import { assign, createMachine } from 'xstate';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId: string;
}

type Panel = 'bookmarkList' | 'preview' | 'liveGrep';
type PreviewTab = 'html' | 'summarize';

interface TelescopeContext {
  activePanel: Panel;
  previewTab: PreviewTab;
  selectedBookmarkIndex: number;
  bookmarks: Bookmark[];
  filteredBookmarks: Bookmark[];
  searchQuery: string;
  previewContent: string;
  previewHeader: string;
  isLoading: boolean;
}

type TelescopeEvent =
  | { type: 'FOCUS_PANEL'; panel: Panel }
  | { type: 'NEXT_PANEL' }
  | { type: 'PREV_PANEL' }
  | { type: 'ENTER_INSERT_MODE' }
  | { type: 'EXIT_INSERT_MODE' }
  | { type: 'SELECT_BOOKMARK'; index: number }
  | { type: 'NEXT_BOOKMARK' }
  | { type: 'PREV_BOOKMARK' }
  | { type: 'NEXT_PREVIEW_TAB' }
  | { type: 'PREV_PREVIEW_TAB' }
  | { type: 'UPDATE_SEARCH'; query: string }
  | { type: 'SET_BOOKMARKS'; bookmarks: Bookmark[] }
  | { type: 'SET_FILTERED_BOOKMARKS'; bookmarks: Bookmark[] }
  | { type: 'SET_PREVIEW'; content: string; header: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'OPEN_BOOKMARK' }
  | { type: 'CLOSE_TELESCOPE' };

export const telescopeMachine = createMachine({
  id: 'telescope',
  types: {} as {
    context: TelescopeContext;
    events: TelescopeEvent;
  },
  initial: 'normal',
  context: {
    activePanel: 'bookmarkList',
    previewTab: 'summarize',
    selectedBookmarkIndex: 0,
    bookmarks: [],
    filteredBookmarks: [],
    searchQuery: '',
    previewContent: 'Select a bookmark to preview',
    previewHeader: '',
    isLoading: false,
  },
  states: {
    normal: {
      initial: 'bookmarkList',
      states: {
        bookmarkList: {
          id: 'normal_bookmarkList',
          entry: assign({ activePanel: 'bookmarkList' }),
          on: {
            NEXT_PANEL: { target: '#normal_liveGrep' },
            PREV_PANEL: { target: '#normal_preview' },
            NEXT_BOOKMARK: {
              actions: assign({
                selectedBookmarkIndex: ({ context }) => {
                  if (context.filteredBookmarks.length === 0) return 0;
                  return (
                    (context.selectedBookmarkIndex + 1) %
                    context.filteredBookmarks.length
                  );
                },
              }),
            },
            PREV_BOOKMARK: {
              actions: assign({
                selectedBookmarkIndex: ({ context }) => {
                  if (context.filteredBookmarks.length === 0) return 0;
                  return (
                    (context.selectedBookmarkIndex -
                      1 +
                      context.filteredBookmarks.length) %
                    context.filteredBookmarks.length
                  );
                },
              }),
            },
            SELECT_BOOKMARK: {
              actions: assign({
                selectedBookmarkIndex: ({ event }) => event.index,
              }),
            },
          },
        },
        liveGrep: {
          id: 'normal_liveGrep',
          entry: assign({ activePanel: 'liveGrep' }),
          on: {
            NEXT_PANEL: { target: '#normal_preview' },
            PREV_PANEL: { target: '#normal_bookmarkList' },
            ENTER_INSERT_MODE: { target: '#insert_liveGrep' },
          },
        },
        preview: {
          id: 'normal_preview',
          entry: assign({ activePanel: 'preview' }),
          on: {
            NEXT_PANEL: { target: '#normal_bookmarkList' },
            PREV_PANEL: { target: '#normal_liveGrep' },
            NEXT_PREVIEW_TAB: {
              actions: assign({
                previewTab: ({ context }) =>
                  context.previewTab === 'html' ? 'summarize' : 'html',
              }),
            },
            PREV_PREVIEW_TAB: {
              actions: assign({
                previewTab: ({ context }) =>
                  context.previewTab === 'html' ? 'summarize' : 'html',
              }),
            },
          },
        },
      },
      on: {
        FOCUS_PANEL: [
          {
            guard: ({ event }) => event.panel === 'bookmarkList',
            target: '.bookmarkList',
          },
          {
            guard: ({ event }) => event.panel === 'liveGrep',
            target: '.liveGrep',
          },
          {
            guard: ({ event }) => event.panel === 'preview',
            target: '.preview',
          },
        ],
      },
    },
    insert: {
      initial: 'liveGrep',
      states: {
        liveGrep: {
          id: 'insert_liveGrep',
          entry: assign({ activePanel: 'liveGrep' }),
          on: {
            EXIT_INSERT_MODE: { target: '#normal_liveGrep' },
          },
        },
      },
    },
  },
  on: {
    UPDATE_SEARCH: {
      actions: assign({
        searchQuery: ({ event }) => event.query,
        selectedBookmarkIndex: () => 0,
      }),
    },
    SET_BOOKMARKS: {
      actions: assign({
        bookmarks: ({ event }) => event.bookmarks,
      }),
    },
    SET_FILTERED_BOOKMARKS: {
      actions: assign({
        filteredBookmarks: ({ event }) => event.bookmarks,
      }),
    },
    SET_PREVIEW: {
      actions: assign({
        previewContent: ({ event }) => event.content,
        previewHeader: ({ event }) => event.header,
      }),
    },
    SET_LOADING: {
      actions: assign({
        isLoading: ({ event }) => event.isLoading,
      }),
    },
    OPEN_BOOKMARK: {
      // This will be handled by the component
    },
    CLOSE_TELESCOPE: {
      // This will be handled by the component
    },
  },
});
