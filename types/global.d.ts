/// <reference types="wxt/client" />

declare global {
  interface Window {
    bookmarkTelescopeLoaded?: boolean;
  }

  interface DownloadProgressEvent extends Event {
    loaded: number;
    total: number;
  }

  interface DownloadMonitor extends EventTarget {
    addEventListener(type: 'downloadprogress', listener: (event: DownloadProgressEvent) => void): void;
  }

  interface SummarizerCreateOptions {
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    sharedContext?: string;
    outputLanguage?: 'en' | 'es' | 'ja';
    monitor?: (monitor: DownloadMonitor) => void;
  }

  interface SummarizerSummarizeOptions {
    context?: string;
  }

  interface SummarizerInstance {
    summarize(text: string, options?: SummarizerSummarizeOptions): Promise<string>;
    summarizeStreaming(text: string, options?: SummarizerSummarizeOptions): ReadableStream<string>;
    destroy(): void;
  }

  interface SummarizerConstructor {
    create(options?: SummarizerCreateOptions): Promise<SummarizerInstance>;
    capabilities(): Promise<Record<string, unknown>>;
    availability(): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  }

  const Summarizer: SummarizerConstructor;
}

export {};
