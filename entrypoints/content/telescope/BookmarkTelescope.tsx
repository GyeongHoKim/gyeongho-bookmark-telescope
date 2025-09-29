import { useMachine } from '@xstate/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import BookmarkList from './bookmark-list/BookmarkList';
import LiveGrep from './live-grep/LiveGrep';
import { telescopeMachine, type Bookmark } from './models/telescopeMachine';
import Preview from './preview/Preview';

const BookmarkTelescope: React.FC = () => {
  const [state, send] = useMachine(telescopeMachine);
  const stateRef = useRef(state);
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef<boolean>(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    previewTab,
    selectedBookmarkIndex,
    bookmarks,
    filteredBookmarks,
    searchQuery,
    previewContent,
    previewHeader,
    isLoading,
  } = state.context;

  const isInsertMode = state.matches('insert');
  const isBookmarkListFocused = state.matches('normal.bookmarkList');
  const isLiveGrepFocused =
    state.matches('normal.liveGrep') || state.matches('insert.liveGrep');
  const isPreviewFocused = state.matches('normal.preview');

  // Load bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const response = await browser.runtime.sendMessage({ action: 'get-bookmarks' });
      if (response?.error) {
        console.error('Content: Error loading bookmarks:', response.error);
      }
      const loadedBookmarks: Bookmark[] = response?.bookmarks || [];
      send({ type: 'SET_BOOKMARKS', bookmarks: loadedBookmarks });
      send({ type: 'SET_FILTERED_BOOKMARKS', bookmarks: loadedBookmarks });
    } catch (error) {
      console.error('Content: Failed to load bookmarks:', error);
      send({ type: 'SET_BOOKMARKS', bookmarks: [] });
      send({ type: 'SET_FILTERED_BOOKMARKS', bookmarks: [] });
    }
  }, [send]);

  // Filter bookmarks based on search query
  const filterBookmarks = useCallback(
    (query: string) => {
      try {
        if (!query.trim()) {
          send({ type: 'SET_FILTERED_BOOKMARKS', bookmarks: [...bookmarks] });
        } else {
          const regex = new RegExp(query, 'i');
          const filtered = bookmarks.filter(
            (bookmark) => regex.test(bookmark.title) || regex.test(bookmark.url)
          );
          send({ type: 'SET_FILTERED_BOOKMARKS', bookmarks: filtered });
        }
      } catch {
        const lowerQuery = query.toLowerCase();
        const filtered = bookmarks.filter(
          (bookmark) =>
            bookmark.title.toLowerCase().includes(lowerQuery) ||
            bookmark.url.toLowerCase().includes(lowerQuery)
        );
        send({ type: 'SET_FILTERED_BOOKMARKS', bookmarks: filtered });
      }
    },
    [bookmarks, send]
  );

  // Hide telescope
  const hide = useCallback(() => {
    isVisibleRef.current = false;
    setIsVisible(false);
    if (isInsertMode) {
      send({ type: 'EXIT_INSERT_MODE' });
    }
  }, [send, isInsertMode]);

  // Open selected bookmark
  const openSelectedBookmark = useCallback(() => {
    if (
      filteredBookmarks.length === 0 ||
      selectedBookmarkIndex >= filteredBookmarks.length
    ) {
      return;
    }
    const bookmark = filteredBookmarks[selectedBookmarkIndex];
    browser.runtime.sendMessage({
      action: 'open-bookmark',
      url: bookmark.url,
    });
    hide();
  }, [filteredBookmarks, selectedBookmarkIndex, hide]);

  // Show telescope
  const show = useCallback(async () => {
    isVisibleRef.current = true;
    setIsVisible(true);
    send({ type: 'UPDATE_SEARCH', query: '' });
    send({ type: 'FOCUS_PANEL', panel: 'bookmarkList' });
    await loadBookmarks();
  }, [loadBookmarks, send]);

  // Update preview for selected bookmark
  const updatePreview = useCallback(async () => {
    if (
      filteredBookmarks.length === 0 ||
      selectedBookmarkIndex >= filteredBookmarks.length
    ) {
      send({
        type: 'SET_PREVIEW',
        content: 'Select a bookmark to preview',
        header: '',
      });
      return;
    }

    const bookmark = filteredBookmarks[selectedBookmarkIndex];
    send({
      type: 'SET_PREVIEW',
      content: 'Loading preview...',
      header: bookmark.url,
    });
    send({ type: 'SET_LOADING', isLoading: true });

    try {
      const response = await browser.runtime.sendMessage({
        action: 'fetch-page-content',
        url: bookmark.url,
      });
      send({ type: 'SET_LOADING', isLoading: false });
      if (response?.error) {
        send({
          type: 'SET_PREVIEW',
          content: `Error loading preview: ${response.error}`,
          header: bookmark.url,
        });
      } else {
        const html: string = response?.html ?? '';
        const maxLength = 5000;
        const truncatedHtml =
          html.length > maxLength
            ? html.substring(0, maxLength) + '\n\n... (truncated)'
            : html;
        send({
          type: 'SET_PREVIEW',
          content: truncatedHtml,
          header: bookmark.url,
        });
      }
    } catch (error) {
      send({ type: 'SET_LOADING', isLoading: false });
      send({
        type: 'SET_PREVIEW',
        content: `Error loading preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        header: bookmark.url,
      });
    }
  }, [filteredBookmarks, selectedBookmarkIndex, send]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisibleRef.current) return;

      const current = stateRef.current;
      const normal = current.matches('normal');
      const insert = current.matches('insert');
      const bookmarkListFocused = current.matches('normal.bookmarkList');
      const liveGrepFocused =
        current.matches('normal.liveGrep') || current.matches('insert.liveGrep');
      const previewFocused = current.matches('normal.preview');

      // Normal mode keys
      if (normal) {
        switch (e.key) {
          case 'h':
          case 'ArrowLeft':
            e.preventDefault();
            send({ type: 'PREV_PANEL' });
            break;
          case 'l':
          case 'ArrowRight':
            e.preventDefault();
            send({ type: 'NEXT_PANEL' });
            break;
          case 'j':
          case 'ArrowDown':
            if (bookmarkListFocused) {
              e.preventDefault();
              send({ type: 'NEXT_BOOKMARK' });
            }
            break;
          case 'k':
          case 'ArrowUp':
            if (bookmarkListFocused) {
              e.preventDefault();
              send({ type: 'PREV_BOOKMARK' });
            }
            break;
          case 'i':
          case 'I':
            if (liveGrepFocused) {
              e.preventDefault();
              send({ type: 'ENTER_INSERT_MODE' });
            }
            break;
        case '[':
        case 'BracketLeft':
            if (previewFocused) {
              e.preventDefault();
              send({ type: 'PREV_PREVIEW_TAB' });
            }
            break;
        case ']':
        case 'BracketRight':
            if (previewFocused) {
              e.preventDefault();
              send({ type: 'NEXT_PREVIEW_TAB' });
            }
            break;
          case 'Enter':
            e.preventDefault();
            openSelectedBookmark();
            break;
          case 'q':
          case 'Escape':
            e.preventDefault();
            hide();
            break;
        }
      }

      // Insert mode keys
      if (insert) {
        if (e.key === 'Escape') {
          e.preventDefault();
          send({ type: 'EXIT_INSERT_MODE' });
        }
      }
    },
    [send, openSelectedBookmark, hide]
  );

  // Handle click outside
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        hide();
      }
    },
    [hide]
  );

  // Handle search change
  const handleSearchChange = useCallback(
    (query: string) => {
      send({ type: 'UPDATE_SEARCH', query });
    },
    [send]
  );

  // Handle bookmark selection
  const handleSelectBookmark = useCallback(
    (index: number) => {
      send({ type: 'SELECT_BOOKMARK', index });
    },
    [send]
  );

  // Effects
  useEffect(() => {
    filterBookmarks(searchQuery);
  }, [searchQuery, filterBookmarks]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  useEffect(() => {
    const handleToggle = () => {
      if (isVisibleRef.current) {
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
  }, [handleKeyDown, show, hide]);

  if (!isVisible) return null;

  const totalCount = filteredBookmarks.length;
  const selectedCount = totalCount > 0 ? selectedBookmarkIndex + 1 : 0;

  return (
    <div
      className="bookmark-telescope-overlay active"
      ref={overlayRef}
      onClick={handleOverlayClick}
      data-testid="live-grep"
    >
      <div className="telescope-container">
        {/* Mode indicator */}
        <div className="telescope-mode-indicator">
          {isInsertMode ? '-- INSERT --' : '-- NORMAL --'}
        </div>

        {/* Main sections */}
        <div className="telescope-main-sections">
          <BookmarkList
            bookmarks={filteredBookmarks}
            selectedIndex={selectedBookmarkIndex}
            onSelectBookmark={handleSelectBookmark}
            onOpenBookmark={openSelectedBookmark}
            isFocused={isBookmarkListFocused}
          />

          <Preview
            previewContent={previewContent}
            previewHeader={previewHeader}
            isLoading={isLoading}
            isFocused={isPreviewFocused}
            activeTab={previewTab}
          />
        </div>

        {/* Live Grep section */}
        <LiveGrep
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isFocused={isLiveGrepFocused}
          isInsertMode={isInsertMode}
          totalCount={totalCount}
          selectedCount={selectedCount}
        />
      </div>
    </div>
  );
};

export default BookmarkTelescope;
