import { useCallback } from 'react';
import type { Bookmark } from '../models/telescopeMachine';

interface UseBookmarkFilterProps {
  bookmarks: Bookmark[];
  setFilteredBookmarks: (bookmarks: Bookmark[]) => void;
}

export const useBookmarkFilter = ({
  bookmarks,
  setFilteredBookmarks,
}: UseBookmarkFilterProps) => {
  const filterBookmarks = useCallback(
    (query: string) => {
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
    },
    [bookmarks, setFilteredBookmarks]
  );

  return {
    filterBookmarks,
  };
};
