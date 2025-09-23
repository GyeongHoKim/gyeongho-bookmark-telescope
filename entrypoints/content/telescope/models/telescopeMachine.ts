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

const panels: Panel[] = ['bookmarkList', 'liveGrep', 'preview'];

export const telescopeMachine = createMachine({
  id: 'telescope',
  types: {} as {
    context: TelescopeContext;
    events: TelescopeEvent;
  },
  initial: 'normal',
  context: {
    activePanel: 'bookmarkList' as Panel,
    previewTab: 'summarize' as PreviewTab,
    selectedBookmarkIndex: 0,
    bookmarks: [] as Bookmark[],
    filteredBookmarks: [] as Bookmark[],
    searchQuery: '',
    previewContent: 'Select a bookmark to preview',
    previewHeader: '',
    isLoading: false,
  },
  states: {
    normal: {
      on: {
        NEXT_PANEL: {
          actions: assign({
            activePanel: ({ context }) => {
              const currentIndex = panels.indexOf(context.activePanel);
              const nextIndex = (currentIndex + 1) % panels.length;
              return panels[nextIndex];
            },
          }),
        },
        PREV_PANEL: {
          actions: assign({
            activePanel: ({ context }) => {
              const currentIndex = panels.indexOf(context.activePanel);
              const prevIndex = (currentIndex - 1 + panels.length) % panels.length;
              return panels[prevIndex];
            },
          }),
        },
        FOCUS_PANEL: {
          actions: assign({
            activePanel: ({ event }) => event.panel,
          }),
        },
        ENTER_INSERT_MODE: {
          target: 'insert',
          guard: ({ context }) => context.activePanel === 'liveGrep',
        },
        NEXT_BOOKMARK: {
          actions: assign({
            selectedBookmarkIndex: ({ context }) => {
              if (context.filteredBookmarks.length === 0) return 0;
              return (context.selectedBookmarkIndex + 1) % context.filteredBookmarks.length;
            },
          }),
        },
        PREV_BOOKMARK: {
          actions: assign({
            selectedBookmarkIndex: ({ context }) => {
              if (context.filteredBookmarks.length === 0) return 0;
              return (context.selectedBookmarkIndex - 1 + context.filteredBookmarks.length) % context.filteredBookmarks.length;
            },
          }),
        },
        SELECT_BOOKMARK: {
          actions: assign({
            selectedBookmarkIndex: ({ event }) => event.index,
          }),
        },
        NEXT_PREVIEW_TAB: {
          actions: assign({
            previewTab: ({ context }) => context.previewTab === 'html' ? 'summarize' : 'html',
          }),
        },
        PREV_PREVIEW_TAB: {
          actions: assign({
            previewTab: ({ context }) => context.previewTab === 'html' ? 'summarize' : 'html',
          }),
        },
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
    },
    insert: {
      on: {
        EXIT_INSERT_MODE: {
          target: 'normal',
        },
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
      },
    },
  },
});
