import React, { useState, useEffect } from 'react';

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
  const [summarizeContent, setSummarizeContent] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'summarize' && previewContent && !isLoading) {
      // Simple text extraction and summarization
      // In a real implementation, you might want to use an AI service for summarization
      const textOnly = previewContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const sentences = textOnly.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summary = sentences.slice(0, 5).join('. ') + (sentences.length > 5 ? '...' : '');
      setSummarizeContent(summary || 'No content available for summarization');
    }
  }, [previewContent, activeTab, isLoading]);

  const renderTabContent = () => {
    if (isLoading) {
      return <div className="telescope-loading">Loading preview...</div>;
    }

    if (activeTab === 'html') {
      return (
        <pre className="telescope-preview-content">
          {previewContent}
        </pre>
      );
    } else {
      return (
        <div className="telescope-preview-summary">
          {summarizeContent || 'No summary available'}
        </div>
      );
    }
  };

  return (
    <div className={`telescope-section telescope-preview-section ${isFocused ? 'focused' : ''}`}>
      <div className="telescope-section-header">
        <span className="telescope-section-label">Grep Preview</span>
        <div className="telescope-preview-tabs">
          <span className={`telescope-tab ${activeTab === 'html' ? 'active' : ''}`}>
            [HTML]
          </span>
          <span className={`telescope-tab ${activeTab === 'summarize' ? 'active' : ''}`}>
            [Summarize]
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