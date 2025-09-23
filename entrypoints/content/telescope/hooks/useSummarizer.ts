import { useCallback, useEffect, useState } from 'react';

/**
 * Advanced HTML text extraction using refined regex patterns
 * Removes scripts, styles, navigation, ads, and other noise
 */
function extractCleanTextAdvanced(html: string): string {
  let text = html;

  try {
    // 1. Remove scripts, styles, and comments completely
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // 2. Remove structural elements (navigation, header, footer, sidebar)
    text = text.replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, '');

    // 3. Remove ads and promotional content (by common class/id patterns)
    text = text.replace(/<[^>]*(?:class|id)="[^"]*(?:ad|advertisement|banner|sidebar|promo)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');

    // 4. Remove meta elements
    text = text.replace(/<(meta|link|title)[^>]*\/?>/gi, '');

    // 5. Remove all HTML tags
    text = text.replace(/<[^>]*>/g, ' ');

    // 6. Decode common HTML entities
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&ndash;': '–',
      '&mdash;': '—',
      '&hellip;': '…',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };

    Object.entries(entities).forEach(([entity, char]) => {
      text = text.replace(new RegExp(entity, 'g'), char);
    });

    // Decode numeric entities (&#123; and &#x1F; formats)
    text = text.replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10);
      return code > 0 && code < 1114112 ? String.fromCharCode(code) : '';
    });
    text = text.replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return code > 0 && code < 1114112 ? String.fromCharCode(code) : '';
    });

    // 7. Clean up whitespace
    text = text.replace(/[\s\r\n\t]+/g, ' ');
    text = text.replace(/\s+([,.!?;:])/g, '$1');
    text = text.replace(/([,.!?;:])\s+/g, '$1 ');
    text = text.trim();

    // 8. Limit length for Chrome AI (preserve sentence boundaries)
    if (text.length > 5000) {
      const sentences = text.substring(0, 5000).split(/[.!?]+/);
      sentences.pop(); // Remove potentially incomplete last sentence
      text = sentences.join('. ');
      if (text && !text.match(/[.!?]$/)) {
        text += '.';
      }
    }

    return text;
  } catch (error) {
    console.warn('Advanced text extraction failed, using fallback:', error);
    // Fallback to simple regex approach
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
  }
}

export type SummarizerStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloadable'
  | 'downloading'
  | 'unavailable'
  | 'summarizing'
  | 'completed'
  | 'error';

export interface UseSummarizerOptions {
  enabled?: boolean;
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
  outputLanguage?: 'en' | 'es' | 'ja';
}

export interface UseSummarizerResult {
  status: SummarizerStatus;
  summary: string;
  error: string;
  downloadProgress: number;
  summarize: (text: string) => Promise<void>;
  acceptDownload: () => Promise<void>;
  declineDownload: () => void;
}

export const useSummarizer = (options: UseSummarizerOptions = {}): UseSummarizerResult => {
  const {
    enabled = true,
    type = 'tldr',
    format = 'plain-text',
    length = 'short',
    outputLanguage = 'en',
  } = options;

  const [status, setStatus] = useState<SummarizerStatus>('idle');
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [summarizer, setSummarizer] = useState<SummarizerInstance | null>(null);

  // Check availability
  const checkAvailability = useCallback(async () => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    try {
      // Check if Summarizer API is supported
      if (typeof Summarizer === 'undefined') {
        setStatus('unavailable');
        setError('Chrome Built-in AI is not supported in this browser. Requires Chrome 138+ with experimental features enabled.');
        return;
      }

      const availability = await Summarizer.availability();

      switch (availability) {
        case 'available':
          setStatus('available');
          break;
        case 'downloadable':
          setStatus('downloadable');
          break;
        case 'downloading': {
          setStatus('downloading');
          // Start monitoring download progress
          const checkInterval = setInterval(async () => {
            try {
              const newAvailability = await Summarizer.availability();
              if (newAvailability === 'available') {
                clearInterval(checkInterval);
                setStatus('available');
                setDownloadProgress(0);
              } else if (newAvailability !== 'downloading') {
                clearInterval(checkInterval);
                checkAvailability();
              }
            } catch (err) {
              clearInterval(checkInterval);
              console.error('Error checking download status:', err);
            }
          }, 1000);
          break;
        }
        case 'unavailable':
        default:
          setStatus('unavailable');
          setError('Chrome Built-in AI is not available on this device. Requirements: Windows 10/11, macOS 13+, or ChromeOS with 22GB+ free space and >4GB VRAM.');
          break;
      }
    } catch (err) {
      console.error('Error checking summarizer availability:', err);
      setStatus('error');
      setError(`Failed to check AI availability: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [enabled]);

  // Accept download consent
  const acceptDownload = useCallback(async () => {
    try {
      setStatus('downloading');
      setDownloadProgress(0);

      const newSummarizer = await Summarizer.create({
        type,
        format,
        length,
        outputLanguage,
        monitor: (monitor) => {
          monitor.addEventListener('downloadprogress', (e: DownloadProgressEvent) => {
            const progress = Math.round((e.loaded || 0) * 100);
            setDownloadProgress(progress);
          });
        },
      });

      setSummarizer(newSummarizer);
      setStatus('available');
      setDownloadProgress(0);
    } catch (err) {
      console.error('Error downloading AI model:', err);
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      if (errorMsg.includes('service is not running')) {
        setError('Chrome AI service is not running. Please enable Chrome AI flags and restart Chrome: chrome://flags/#optimization-guide-on-device-model');
      } else {
        setError(`Failed to download AI model: ${errorMsg}`);
      }
    }
  }, [type, format, length, outputLanguage]);

  // Decline download
  const declineDownload = useCallback(() => {
    setStatus('unavailable');
    setError('User declined AI model download. Chrome Built-in AI summarization is not available.');
  }, []);

  // Create summarizer instance if needed
  const ensureSummarizer = useCallback(async (): Promise<SummarizerInstance | null> => {
    if (summarizer) {
      return summarizer;
    }

    if (status === 'available') {
      try {
        const newSummarizer = await Summarizer.create({
          type,
          format,
          length,
          outputLanguage,
        });
        setSummarizer(newSummarizer);
        setStatus('available');
        return newSummarizer;
      } catch (err) {
        console.error('Error creating summarizer:', err);
        setStatus('error');
        setError(`Failed to create summarizer: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return null;
      }
    }

    return null;
  }, [summarizer, status, type, format, length, outputLanguage]);

  // Summarize text
  const summarize = useCallback(async (text: string) => {
    if (!text || !text.trim()) {
      setSummary('');
      return;
    }

    // Check if summarizer is in a valid state for summarization
    if (status === 'idle') {
      throw new Error('Summarizer not initialized. Please wait for initialization to complete.');
    }

    if (status === 'checking') {
      throw new Error('Summarizer availability check in progress. Please wait.');
    }

    if (status === 'downloadable') {
      throw new Error('User consent required for AI model download. Please accept or decline the download.');
    }

    if (status === 'downloading') {
      throw new Error('AI model download in progress. Please wait for download to complete.');
    }

    if (status === 'unavailable') {
      throw new Error('Chrome Built-in AI is not supported on this device or browser.');
    }

    if (status === 'error') {
      throw new Error('Summarizer is in error state. Please try again later.');
    }

    if (status === 'completed') {
      throw new Error('Summary already completed. Refresh content to generate a new summary.');
    }

    if (status !== 'available') {
      throw new Error(`Invalid summarizer state: ${status}`);
    }

    try {
      setStatus('summarizing');

      const summarizerInstance = await ensureSummarizer();
      if (!summarizerInstance) {
        throw new Error('Failed to create summarizer instance');
      }

      // Extract clean text for summarization using advanced regex patterns
      const textOnly = extractCleanTextAdvanced(text);

      const result = await summarizerInstance.summarize(textOnly, {
        context: 'Article from bookmark',
      });

      setSummary(result);
      setStatus('completed');
    } catch (err) {
      console.error('Error generating AI summary:', err);
      setStatus('error');
      setError(`Failed to generate AI summary: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [status, ensureSummarizer]);

  // Initialize on mount
  useEffect(() => {
    if (enabled && status === 'idle') {
      checkAvailability();
    }
  }, [enabled, status, checkAvailability]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (summarizer) {
        try {
          summarizer.destroy();
        } catch (e) {
          console.warn('Error destroying summarizer:', e);
        }
      }
    };
  }, [summarizer]);

  return {
    status,
    summary,
    error,
    downloadProgress,
    summarize,
    acceptDownload,
    declineDownload,
  };
};