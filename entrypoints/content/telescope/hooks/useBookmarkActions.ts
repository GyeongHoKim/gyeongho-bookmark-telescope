import { useCallback } from 'react';
import type { Bookmark } from '../models/telescopeMachine';

interface UseBookmarkActionsProps {
  filteredBookmarks: Bookmark[];
  selectedBookmarkIndex: number;
  selectBookmark: (index: number) => void;
  hide: () => void;
}

export const useBookmarkActions = ({
  filteredBookmarks,
  selectedBookmarkIndex,
  selectBookmark,
  hide,
}: UseBookmarkActionsProps) => {
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

  return {
    openSelectedBookmark,
    selectBookmark,
  };
};
