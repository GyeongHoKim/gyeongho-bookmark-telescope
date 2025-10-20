import { useCallback } from 'react';
import type { Bookmark } from '../models/telescopeMachine';

interface UseBookmarkPreviewProps {
  filteredBookmarks: Bookmark[];
  selectedBookmarkIndex: number;
  setPreview: (content: string, header: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useBookmarkPreview = ({
  filteredBookmarks,
  selectedBookmarkIndex,
  setPreview,
  setLoading,
}: UseBookmarkPreviewProps) => {
  const updatePreview = useCallback(async () => {
    if (
      filteredBookmarks.length === 0 ||
      selectedBookmarkIndex >= filteredBookmarks.length
    ) {
      setPreview('Select a bookmark to preview', '');
      return;
    }

    const bookmark = filteredBookmarks[selectedBookmarkIndex];
    setPreview('Loading preview...', bookmark.url);
    setLoading(true);

    try {
      const response = await browser.runtime.sendMessage({
        action: 'fetch-page-content',
        url: bookmark.url,
      });
      setLoading(false);
      if (response?.error) {
        setPreview(`Error loading preview: ${response.error}`, bookmark.url);
      } else {
        const html: string = response?.html ?? '';
        setPreview(html, bookmark.url);
      }
    } catch (error) {
      setLoading(false);
      setPreview(
        `Error loading preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        bookmark.url
      );
    }
  }, [filteredBookmarks, selectedBookmarkIndex, setPreview, setLoading]);

  return {
    updatePreview,
  };
};
