import React, { useCallback, useEffect, useRef } from 'react';
import BookmarkList from './bookmark-list/BookmarkList';
import { useBookmarkActions } from './hooks/useBookmarkActions';
import { useBookmarkFilter } from './hooks/useBookmarkFilter';
import { useBookmarkLoader } from './hooks/useBookmarkLoader';
import { useBookmarkPreview } from './hooks/useBookmarkPreview';
import { useTelescopeKeyboard } from './hooks/useTelescopeKeyboard';
import { useTelescopeMachine } from './hooks/useTelescopeMachine';
import { useTelescopeVisibility } from './hooks/useTelescopeVisibility';
import LiveGrep from './live-grep/LiveGrep';
import Preview from './preview/Preview';

const BookmarkTelescope: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Use telescope machine hook
  const {
    state,
    bookmarks,
    filteredBookmarks,
    searchQuery,
    previewContent,
    previewHeader,
    isLoading,
    selectedBookmarkIndex,
    previewTab,
    isInsertMode,
    isBookmarkListFocused,
    isLiveGrepFocused,
    isPreviewFocused,
    setBookmarks,
    setFilteredBookmarks,
    setPreview,
    setLoading,
    selectBookmark,
    updateSearch,
    focusPanel,
    exitInsertMode,
    send,
  } = useTelescopeMachine();

  // Use custom hooks
  const { loadBookmarks } = useBookmarkLoader({
    setBookmarks,
    setFilteredBookmarks,
  });

  const { filterBookmarks } = useBookmarkFilter({
    bookmarks,
    setFilteredBookmarks,
  });

  const { updatePreview } = useBookmarkPreview({
    filteredBookmarks,
    selectedBookmarkIndex,
    setPreview,
    setLoading,
  });

  // Filter bookmarks when search query changes
  useEffect(() => {
    filterBookmarks(searchQuery);
  }, [searchQuery, filterBookmarks]);

  // Update preview when selected bookmark or filtered bookmarks change
  useEffect(() => {
    updatePreview();
  }, [selectedBookmarkIndex, filteredBookmarks, updatePreview]);

  const handleShow = useCallback(() => {
    updateSearch('');
    focusPanel('bookmarkList');
    loadBookmarks();
  }, [updateSearch, focusPanel, loadBookmarks]);

  const handleHide = useCallback(() => {
    if (isInsertMode) {
      exitInsertMode();
    }
  }, [exitInsertMode, isInsertMode]);

  const { isVisible, hide } = useTelescopeVisibility({
    onShow: handleShow,
    onHide: handleHide,
  });

  const { openSelectedBookmark } = useBookmarkActions({
    filteredBookmarks,
    selectedBookmarkIndex,
    selectBookmark,
    hide,
  });

  useTelescopeKeyboard({
    isVisible,
    state,
    send,
    onOpenBookmark: openSelectedBookmark,
    onHide: hide,
  });

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
      updateSearch(query);
    },
    [updateSearch]
  );

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
            onSelectBookmark={selectBookmark}
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
