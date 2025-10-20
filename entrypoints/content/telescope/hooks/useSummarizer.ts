import { Readability } from '@mozilla/readability';
import { useCallback, useEffect, useState } from 'react';

/**
 * Extract clean text from HTML using Mozilla's Readability.js
 * This provides much better content extraction than regex-based approaches
 */
function extractCleanTextWithReadability(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const reader = new Readability(doc);
    const article = reader.parse();

    if (article && article.textContent) {
      let text = article.textContent;
      text = text.replace(/[\s\r\n\t]+/g, ' ');
      text = text.replace(/\s+([,.!?;:])/g, '$1');
      text = text.replace(/([,.!?;:])\s+/g, '$1 ');
      text = text.trim();
      return text;
    }

    const title = article?.title ?? article?.siteName ?? document.title ?? '';
    if (title) {
      return title.trim();
    }

    throw new Error('Readability could not extract content');
  } catch (error) {
    console.warn('Readability extraction failed, using fallback:', error);

    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\s\r\n\t]+/g, ' ')
      .trim()
      .substring(0, 5000);
  }
}

export type SummarizerStatus =
  | 'idle'
  | 'checking'
  | Availability
  | 'summarizing'
  | 'error';

export interface UseSummarizerOptions extends SummarizerCreateCoreOptions {
  enabled?: boolean;
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

export const useSummarizer = (
  options: UseSummarizerOptions = {}
): UseSummarizerResult => {
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
  const [summarizer, setSummarizer] = useState<Summarizer | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    try {
      if (typeof Summarizer === 'undefined') {
        setStatus('unavailable');
        setError(
          'Chrome Built-in AI is not supported in this browser. Requires Chrome 138+ with experimental features enabled.'
        );
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
          setError(
            'Chrome Built-in AI is not available on this device. Requirements: Windows 10/11, macOS 13+, or ChromeOS with 22GB+ free space and >4GB VRAM.'
          );
          break;
      }
    } catch (err) {
      console.error('Error checking summarizer availability:', err);
      setStatus('error');
      setError(
        `Failed to check AI availability: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [enabled]);

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
          monitor.addEventListener('downloadprogress', (e: ProgressEvent) => {
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
        setError(
          'Chrome AI service is not running. Please enable Chrome AI flags and restart Chrome: chrome://flags/#optimization-guide-on-device-model'
        );
      } else {
        setError(`Failed to download AI model: ${errorMsg}`);
      }
    }
  }, [type, format, length, outputLanguage]);

  const declineDownload = useCallback(() => {
    setStatus('unavailable');
    setError(
      'User declined AI model download. Chrome Built-in AI summarization is not available.'
    );
  }, []);

  const ensureSummarizer = useCallback(async (): Promise<Summarizer | null> => {
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
        setError(
          `Failed to create summarizer: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        return null;
      }
    }

    return null;
  }, [summarizer, status, type, format, length, outputLanguage]);

  const summarize = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) {
        setSummary('');
        return;
      }

      if (status === 'idle') {
        throw new Error(
          'Summarizer not initialized. Please wait for initialization to complete.'
        );
      }

      if (status === 'checking') {
        throw new Error(
          'Summarizer availability check in progress. Please wait.'
        );
      }

      if (status === 'downloadable') {
        throw new Error(
          'User consent required for AI model download. Please accept or decline the download.'
        );
      }

      if (status === 'downloading') {
        throw new Error(
          'AI model download in progress. Please wait for download to complete.'
        );
      }

      if (status === 'unavailable') {
        throw new Error(
          'Chrome Built-in AI is not supported on this device or browser.'
        );
      }

      if (status === 'error') {
        throw new Error(
          'Summarizer is in error state. Please try again later.'
        );
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

        const textOnly = extractCleanTextWithReadability(text);

        const result = await summarizerInstance.summarize(textOnly, {
          context: 'Article from bookmark',
        });

        setSummary(result);
        setStatus('available');
      } catch (err) {
        console.error('Error generating AI summary:', err);
        setStatus('error');
        setError(
          `Failed to generate AI summary: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    },
    [status, ensureSummarizer]
  );

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
