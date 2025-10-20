import { useMachine } from '@xstate/react';
import { useCallback } from 'react';
import { telescopeMachine, type Bookmark } from '../models/telescopeMachine';

export const useTelescopeMachine = () => {
  const [state, send] = useMachine(telescopeMachine);

  // State context
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

  // State matches
  const isInsertMode = state.matches('insert');
  const isBookmarkListFocused = state.matches('normal.bookmarkList');
  const isLiveGrepFocused =
    state.matches('normal.liveGrep') || state.matches('insert.liveGrep');
  const isPreviewFocused = state.matches('normal.preview');

  // Actions
  const setBookmarks = useCallback(
    (newBookmarks: Bookmark[]) => {
      send({ type: 'SET_BOOKMARKS', bookmarks: newBookmarks });
    },
    [send]
  );

  const setFilteredBookmarks = useCallback(
    (newBookmarks: Bookmark[]) => {
      send({ type: 'SET_FILTERED_BOOKMARKS', bookmarks: newBookmarks });
    },
    [send]
  );

  const setPreview = useCallback(
    (content: string, header: string) => {
      send({ type: 'SET_PREVIEW', content, header });
    },
    [send]
  );

  const setLoading = useCallback(
    (loading: boolean) => {
      send({ type: 'SET_LOADING', isLoading: loading });
    },
    [send]
  );

  const selectBookmark = useCallback(
    (index: number) => {
      send({ type: 'SELECT_BOOKMARK', index });
    },
    [send]
  );

  const updateSearch = useCallback(
    (query: string) => {
      send({ type: 'UPDATE_SEARCH', query });
    },
    [send]
  );

  const focusPanel = useCallback(
    (panel: 'bookmarkList' | 'liveGrep' | 'preview') => {
      send({ type: 'FOCUS_PANEL', panel });
    },
    [send]
  );

  const exitInsertMode = useCallback(() => {
    send({ type: 'EXIT_INSERT_MODE' });
  }, [send]);

  const enterInsertMode = useCallback(() => {
    send({ type: 'ENTER_INSERT_MODE' });
  }, [send]);

  const nextPanel = useCallback(() => {
    send({ type: 'NEXT_PANEL' });
  }, [send]);

  const prevPanel = useCallback(() => {
    send({ type: 'PREV_PANEL' });
  }, [send]);

  const nextBookmark = useCallback(() => {
    send({ type: 'NEXT_BOOKMARK' });
  }, [send]);

  const prevBookmark = useCallback(() => {
    send({ type: 'PREV_BOOKMARK' });
  }, [send]);

  const nextPreviewTab = useCallback(() => {
    send({ type: 'NEXT_PREVIEW_TAB' });
  }, [send]);

  const prevPreviewTab = useCallback(() => {
    send({ type: 'PREV_PREVIEW_TAB' });
  }, [send]);

  return {
    // State
    state,
    previewTab,
    selectedBookmarkIndex,
    bookmarks,
    filteredBookmarks,
    searchQuery,
    previewContent,
    previewHeader,
    isLoading,
    // State matches
    isInsertMode,
    isBookmarkListFocused,
    isLiveGrepFocused,
    isPreviewFocused,
    // Actions
    setBookmarks,
    setFilteredBookmarks,
    setPreview,
    setLoading,
    selectBookmark,
    updateSearch,
    focusPanel,
    exitInsertMode,
    enterInsertMode,
    nextPanel,
    prevPanel,
    nextBookmark,
    prevBookmark,
    nextPreviewTab,
    prevPreviewTab,
    // Raw send for edge cases
    send,
  };
};
