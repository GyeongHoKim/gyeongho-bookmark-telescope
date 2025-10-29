/**
 * ChunkedSummarizer - 긴 텍스트를 청크로 나눠서 요약하는 유틸리티
 * Chrome의 Summarizer API의 inputQuota 제한을 우회하기 위해 사용
 */

export interface ChunkedSummarizerOptions {
  summarizer: Summarizer;
  context?: string;
  maxChunkSize?: number; // 기본값: inputQuota의 80%
  overlapSize?: number; // 청크 간 겹치는 부분 크기 (기본값: 200자)
}

export interface ChunkedSummarizerResult {
  summary: string;
  wasChunked: boolean;
  chunkCount: number;
}

/**
 * 텍스트를 문장 단위로 안전하게 분할
 */
function splitTextIntoSentences(text: string): string[] {
  // 문장 끝 패턴을 찾아서 분할
  const sentencePattern = /[.!?]+(?:\s|$)/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = sentencePattern.exec(text)) !== null) {
    const sentence = text
      .slice(lastIndex, match.index + match[0].length)
      .trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }

  // 마지막 문장 처리
  const lastSentence = text.slice(lastIndex).trim();
  if (lastSentence.length > 0) {
    sentences.push(lastSentence);
  }

  return sentences;
}

/**
 * 문장 배열을 지정된 크기로 청크 분할
 */
function createChunksFromSentences(
  sentences: string[],
  maxChunkSize: number,
  overlapSize: number
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentSize = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceSize = sentence.length;

    // 현재 청크에 문장을 추가했을 때 크기 초과 여부 확인
    if (currentSize + sentenceSize > maxChunkSize && currentChunk.length > 0) {
      // 현재 청크를 저장하고 새 청크 시작
      chunks.push(currentChunk.trim());

      // 겹치는 부분을 위해 이전 청크의 끝 부분을 가져옴
      const overlapText = currentChunk.slice(-overlapSize);
      currentChunk = overlapText + ' ' + sentence;
      currentSize = overlapText.length + 1 + sentenceSize;
    } else {
      // 현재 청크에 문장 추가
      if (currentChunk.length > 0) {
        currentChunk += ' ' + sentence;
        currentSize += 1 + sentenceSize;
      } else {
        currentChunk = sentence;
        currentSize = sentenceSize;
      }
    }
  }

  // 마지막 청크 추가
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * 입력 텍스트의 사용량을 측정하고 청크가 필요한지 확인
 */
async function checkInputQuota(
  summarizer: Summarizer,
  text: string
): Promise<{ needsChunking: boolean; maxChunkSize: number }> {
  try {
    const totalQuota = summarizer.inputQuota;
    const inputUsage = await summarizer.measureInputUsage(text);

    // 사용량이 quota의 80% 이하면 청크 분할 불필요
    const safeThreshold = totalQuota * 0.8;

    if (inputUsage <= safeThreshold) {
      return {
        needsChunking: false,
        maxChunkSize: totalQuota,
      };
    }

    // 청크가 필요한 경우, 안전한 크기로 설정
    return {
      needsChunking: true,
      maxChunkSize: Math.floor(safeThreshold),
    };
  } catch (error) {
    console.warn(
      'Failed to measure input usage, using conservative chunking:',
      error
    );
    // 에러 발생 시 보수적으로 청크 분할
    return {
      needsChunking: true,
      maxChunkSize: 2000, // 보수적인 기본값
    };
  }
}

/**
 * 청크별로 요약을 생성
 */
async function summarizeChunks(
  summarizer: Summarizer,
  chunks: string[],
  context: string
): Promise<string[]> {
  const summaries: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`Summarizing chunk ${i + 1}/${chunks.length}`);
      const chunkSummary = await summarizer.summarize(chunks[i], {
        context: `${context} (Part ${i + 1}/${chunks.length})`,
      });
      summaries.push(chunkSummary);
    } catch (error) {
      console.error(`Failed to summarize chunk ${i + 1}:`, error);
      // 청크 요약 실패 시 원본 청크의 일부를 사용
      const fallback = chunks[i].substring(0, 200) + '...';
      summaries.push(fallback);
    }
  }

  return summaries;
}

/**
 * 청크 요약들을 최종 요약으로 합성
 */
async function synthesizeFinalSummary(
  summarizer: Summarizer,
  chunkSummaries: string[],
  context: string
): Promise<string> {
  if (chunkSummaries.length === 1) {
    return chunkSummaries[0];
  }

  try {
    const combinedSummaries = chunkSummaries.join('\n\n');
    const finalSummary = await summarizer.summarize(combinedSummaries, {
      context: `${context} - Final synthesis of ${chunkSummaries.length} parts`,
    });
    return finalSummary;
  } catch (error) {
    console.error(
      'Failed to synthesize final summary, using combined summaries:',
      error
    );
    // 최종 합성 실패 시 청크 요약들을 단순히 결합
    return chunkSummaries.join('\n\n');
  }
}

/**
 * 청크 기반 요약을 수행하는 메인 함수
 */
export async function summarizeWithChunking(
  text: string,
  options: ChunkedSummarizerOptions
): Promise<ChunkedSummarizerResult> {
  const {
    summarizer,
    context = 'Article from bookmark',
    maxChunkSize,
    overlapSize = 200,
  } = options;

  if (!text || !text.trim()) {
    return {
      summary: '',
      wasChunked: false,
      chunkCount: 0,
    };
  }

  try {
    // 입력 크기 체크
    const quotaCheck = await checkInputQuota(summarizer, text);

    if (!quotaCheck.needsChunking) {
      // 청크 분할이 불필요한 경우 일반 요약
      console.log('Text fits within quota, summarizing directly');
      const summary = await summarizer.summarize(text, { context });
      return {
        summary,
        wasChunked: false,
        chunkCount: 1,
      };
    }

    // 청크 분할 필요
    console.log('Text exceeds quota, splitting into chunks');
    const effectiveMaxChunkSize = maxChunkSize || quotaCheck.maxChunkSize;

    // 텍스트를 문장 단위로 분할
    const sentences = splitTextIntoSentences(text);

    // 청크 생성
    const chunks = createChunksFromSentences(
      sentences,
      effectiveMaxChunkSize,
      overlapSize
    );

    console.log(`Created ${chunks.length} chunks for summarization`);

    // 각 청크 요약
    const chunkSummaries = await summarizeChunks(summarizer, chunks, context);

    // 최종 요약 합성
    const finalSummary = await synthesizeFinalSummary(
      summarizer,
      chunkSummaries,
      context
    );

    return {
      summary: finalSummary,
      wasChunked: true,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error('Error in chunked summarization:', error);
    throw new Error(
      `Chunked summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
