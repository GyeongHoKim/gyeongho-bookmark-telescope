import { useCallback } from 'react';
import type { Bookmark } from '../models/telescopeMachine';

interface UseBookmarkLoaderProps {
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setFilteredBookmarks: (bookmarks: Bookmark[]) => void;
}

export const useBookmarkLoader = ({
  setBookmarks,
  setFilteredBookmarks
}: UseBookmarkLoaderProps) => {
  const loadBookmarks = useCallback(async () => {
    try {
      const response = await browser.runtime.sendMessage({ action: 'get-bookmarks' });
      if (response?.error) {
        console.error('Content: Error loading bookmarks:', response.error);
      }
      const loadedBookmarks: Bookmark[] = response?.bookmarks || [];
      setBookmarks(loadedBookmarks);
      setFilteredBookmarks(loadedBookmarks);
    } catch (error) {
      console.error('Content: Failed to load bookmarks:', error);
      setBookmarks([]);
      setFilteredBookmarks([]);
    }
  }, [setBookmarks, setFilteredBookmarks]);

  return {
    loadBookmarks,
  };
};
