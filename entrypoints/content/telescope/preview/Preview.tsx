import React, { useCallback, useEffect } from 'react';
import { useSummarizer } from '../hooks/useSummarizer';

interface PreviewProps {
  previewContent: string;
  previewHeader: string;
  isLoading: boolean;
  isFocused: boolean;
  activeTab: 'html' | 'summarize';
}

const Preview: React.FC<PreviewProps> = ({
  previewContent,
  previewHeader,
  isLoading,
  isFocused,
  activeTab,
}) => {
  const {
    status,
    summary,
    error,
    downloadProgress,
    summarize,
    acceptDownload,
    declineDownload,
  } = useSummarizer({
    enabled: activeTab === 'summarize' && !isLoading,
  });




  // Handle keyboard input for consent
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isFocused || activeTab !== 'summarize') return;

      if (status === 'downloadable') {
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          acceptDownload();
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          declineDownload();
        }
      }
    },
    [isFocused, activeTab, status, acceptDownload, declineDownload]
  );

  // Trigger summarization when tab becomes active and status is available
  useEffect(() => {
    if (activeTab === 'summarize' && previewContent && !isLoading && status === 'available') {
      summarize(previewContent);
    }
  }, [activeTab, previewContent, isLoading, status, summarize]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  const renderTabContent = () => {
    if (isLoading) {
      return <div className="telescope-loading">Loading preview...</div>;
    }

    if (activeTab === 'html') {
      return <pre className="telescope-preview-content">{previewContent}</pre>;
    } else {
      // Summarize tab content based on AI state
      switch (status) {
        case 'idle':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator">●</span>
                Initializing Chrome AI...
              </div>
            </div>
          );

        case 'checking':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator">●</span>
                Checking Chrome AI availability...
              </div>
            </div>
          );

        case 'unavailable':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator unavailable">
                  ●
                </span>
                Chrome Built-in AI Summarization Unavailable
              </div>
              <div className="telescope-ai-error">{error}</div>
            </div>
          );

        case 'downloadable':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-consent">
                <div className="telescope-consent-title">
                  Chrome AI Model Download Required
                </div>
                <div className="telescope-consent-message">
                  The AI summarization model needs to be downloaded (one-time
                  download). This will enable high-quality local summarization.
                </div>
                <div className="telescope-consent-controls">
                  <span className="telescope-key-hint">[Y]</span> Download and
                  use AI summarization
                  <br />
                  <span className="telescope-key-hint">[N]</span> Decline (AI summarization will not be available)
                </div>
              </div>
            </div>
          );

        case 'downloading':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-downloading">
                <div className="telescope-download-title">
                  Downloading AI Model...
                </div>
                <div className="telescope-progress-bar">
                  <div
                    className="telescope-progress-fill"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="telescope-progress-text">
                  {Math.round(downloadProgress)}% complete
                </div>
              </div>
            </div>
          );

        case 'summarizing':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator processing">●</span>
                Generating AI summary...
              </div>
            </div>
          );

        case 'available':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator ready">●</span>
                AI Summary
              </div>
              <div className="telescope-summary-content">
                {summary || 'No summary available'}
              </div>
            </div>
          );

        case 'completed':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator ready">●</span>
                AI Summary
              </div>
              <div className="telescope-summary-content">
                {summary || 'No summary available'}
              </div>
            </div>
          );

        case 'error':
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator error">●</span>
                Chrome Built-in AI Error
              </div>
              <div className="telescope-ai-error">{error}</div>
            </div>
          );


        default:
          return (
            <div className="telescope-preview-summary">
              <div className="telescope-ai-status">
                <span className="telescope-status-indicator">●</span>
                Initializing...
              </div>
            </div>
          );
      }
    }
  };

  return (
    <div
      className={`telescope-section telescope-preview-section ${isFocused ? 'focused' : ''}`}
    >
      <div className="telescope-section-header">
        <span className="telescope-section-label">Grep Preview</span>
        <div className="telescope-preview-tabs">
          <span
            className={`telescope-tab ${activeTab === 'summarize' ? 'active' : ''}`}
          >
            [Summarize]
          </span>
          <span
            className={`telescope-tab ${activeTab === 'html' ? 'active' : ''}`}
          >
            [HTML]
          </span>
        </div>
      </div>

      <div className="telescope-preview">
        {previewHeader && (
          <div className="telescope-preview-url">{previewHeader}</div>
        )}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Preview;
