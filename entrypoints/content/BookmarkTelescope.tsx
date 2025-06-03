import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId: string;
}

const BookmarkTelescope: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewContent, setPreviewContent] = useState('Select a bookmark to preview');
  const [previewHeader, setPreviewHeader] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load bookmarks
  const loadBookmarks = useCallback(async () => {
    return new Promise<void>((resolve) => {
      browser.runtime.sendMessage({ action: 'get-bookmarks' }, (response) => {
        if (response.error) {
          console.error('Content: Error loading bookmarks:', response.error);
        }
        const bookmarks = response.bookmarks || [];
        console.log('Content: Bookmarks loaded:', bookmarks);
        setBookmarks(bookmarks);
        resolve();
      });
    });
  }, []);

  // Filter bookmarks based on search query
  const filterBookmarks = useCallback((query: string) => {
    try {
      if (!query.trim()) {
        setFilteredBookmarks([...bookmarks]);
      } else {
        const regex = new RegExp(query, 'i');
        const filtered = bookmarks.filter(
          (bookmark) => regex.test(bookmark.title) || regex.test(bookmark.url)
        );
        setFilteredBookmarks(filtered);
      }
    } catch {
      const lowerQuery = query.toLowerCase();
      const filtered = bookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(lowerQuery) ||
          bookmark.url.toLowerCase().includes(lowerQuery)
      );
      setFilteredBookmarks(filtered);
    }
    setSelectedIndex(0);
  }, [bookmarks]);

  // Update preview for selected bookmark
  const updatePreview = useCallback(async () => {
    if (filteredBookmarks.length === 0 || selectedIndex >= filteredBookmarks.length) {
      setPreviewHeader('');
      setPreviewContent('Select a bookmark to preview');
      return;
    }

    const bookmark = filteredBookmarks[selectedIndex];
    setPreviewHeader(bookmark.url);
    setPreviewContent('Loading preview...');
    setIsLoading(true);

    browser.runtime.sendMessage(
      {
        action: 'fetch-page-content',
        url: bookmark.url
      },
      (response) => {
        setIsLoading(false);
        if (response.error) {
          setPreviewContent(`Error loading preview: ${response.error}`);
        } else {
          const maxLength = 5000;
          const truncatedHtml =
            response.html.length > maxLength
              ? response.html.substring(0, maxLength) + '\n\n... (truncated)'
              : response.html;
          setPreviewContent(truncatedHtml);
        }
      }
    );
  }, [filteredBookmarks, selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          filteredBookmarks.length === 0 ? 0 : (prev + 1) % filteredBookmarks.length
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          filteredBookmarks.length === 0 ? 0 : 
          (prev - 1 + filteredBookmarks.length) % filteredBookmarks.length
        );
        break;
      case 'Enter':
        e.preventDefault();
        openSelectedBookmark();
        break;
      case 'Escape':
        e.preventDefault();
        hide();
        break;
    }
  }, [isVisible, filteredBookmarks.length]);

  // Open selected bookmark
  const openSelectedBookmark = useCallback(() => {
    if (filteredBookmarks.length === 0 || selectedIndex >= filteredBookmarks.length) {
      return;
    }

    const bookmark = filteredBookmarks[selectedIndex];
    browser.runtime.sendMessage({
      action: 'open-bookmark',
      url: bookmark.url
    });
    hide();
  }, [filteredBookmarks, selectedIndex]);

  // Show telescope
  const show = useCallback(async () => {
    setIsVisible(true);
    setSearchQuery('');
    await loadBookmarks();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, [loadBookmarks]);

  // Hide telescope
  const hide = useCallback(() => {
    setIsVisible(false);
    searchInputRef.current?.blur();
  }, []);

  // Handle click outside
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      hide();
    }
  }, [hide]);

  // Handle item click
  const handleItemClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Handle item double click
  const handleItemDoubleClick = useCallback(() => {
    openSelectedBookmark();
  }, [openSelectedBookmark]);

  // Effects
  useEffect(() => {
    filterBookmarks(searchQuery);
  }, [searchQuery, filterBookmarks]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  useEffect(() => {
    const handleToggle = () => {
      console.log('Content: Toggling telescope');
      if (isVisible) {
        hide();
      } else {
        show();
      }
    };

    window.addEventListener('telescope-toggle', handleToggle);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('telescope-toggle', handleToggle);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleKeyDown, show, hide]);

  if (!isVisible) return null;

  return (
    <div 
      className="bookmark-telescope-overlay active"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="telescope-container">
        <div className="telescope-header">
          <input
            ref={searchInputRef}
            type="text"
            className="telescope-search"
            placeholder="Search bookmarks (regex supported)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="telescope-body">
          <div className="telescope-results">
            {filteredBookmarks.length === 0 ? (
              <div className="telescope-loading">No bookmarks found</div>
            ) : (
              filteredBookmarks.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className={`telescope-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleItemClick(index)}
                  onDoubleClick={handleItemDoubleClick}
                >
                  <div className="telescope-item-title">{bookmark.title}</div>
                  <div className="telescope-item-url">{bookmark.url}</div>
                </div>
              ))
            )}
          </div>
          <div className="telescope-preview">
            <div className="telescope-preview-header">{previewHeader}</div>
            <div className="telescope-preview-content">
              {isLoading ? (
                <div className="telescope-loading">Loading preview...</div>
              ) : (
                previewContent
              )}
            </div>
          </div>
        </div>
        <div className="telescope-help">
          Ctrl+Shift+P toggle | Up/Down navigate | Enter open | Esc close
        </div>
      </div>
    </div>
  );
};

export default BookmarkTelescope;