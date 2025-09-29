import { assign, createMachine } from 'xstate';

export interface BookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children?: BookmarkTreeNode[];
}

export interface FlatNode extends BookmarkTreeNode {
  level: number;
  isLast: boolean[];
  hasChildren: boolean;
  isExpanded: boolean;
}

interface ManagerContext {
  bookmarkTree: BookmarkTreeNode[];
  flattenedTree: FlatNode[];
  expanded: Record<string, boolean>;
  selectedIndex: number;
  inputValue: string;
  editingNodeId: string | null;
  isLoading: boolean;
}

export type ManagerEvent =
  | { type: 'SET_TREE'; tree: BookmarkTreeNode[] }
  | { type: 'SET_FLATTENED'; nodes: FlatNode[] }
  | { type: 'SET_EXPANDED'; expanded: Record<string, boolean> }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SELECT_INDEX'; index: number }
  | { type: 'NEXT_INDEX' }
  | { type: 'PREV_INDEX' }
  | { type: 'TOGGLE_FOLDER'; nodeId: string }
  | { type: 'ENTER_ADD_BOOKMARK' }
  | { type: 'ENTER_ADD_FOLDER' }
  | { type: 'ENTER_EDIT'; nodeId: string }
  | { type: 'ENTER_CONFIRM_DELETE' }
  | { type: 'UPDATE_INPUT_VALUE'; value: string }
  | { type: 'CANCEL' }
  | { type: 'OPERATION_SUCCESS' };

export const managerMachine = createMachine({
  id: 'bookmarkManager',
  types: {} as { context: ManagerContext; events: ManagerEvent },
  initial: 'navigate',
  context: {
    bookmarkTree: [],
    flattenedTree: [],
    expanded: {},
    selectedIndex: 0,
    inputValue: '',
    editingNodeId: null,
    isLoading: false,
  },
  states: {
    navigate: {
      on: {
        NEXT_INDEX: {
          actions: assign(({ context }) => ({
            selectedIndex: Math.min(
              context.selectedIndex + 1,
              Math.max(0, context.flattenedTree.length - 1),
            ),
          })),
        },
        PREV_INDEX: {
          actions: assign(({ context }) => ({
            selectedIndex: Math.max(context.selectedIndex - 1, 0),
          })),
        },
        SELECT_INDEX: {
          actions: assign(({ event }) => ({ selectedIndex: event.index })),
        },
        TOGGLE_FOLDER: {
          actions: assign(({ context, event }) => ({
            expanded: {
              ...context.expanded,
              [event.nodeId]: !context.expanded[event.nodeId],
            },
          })),
        },
        ENTER_ADD_BOOKMARK: 'input_addBookmark',
        ENTER_ADD_FOLDER: 'input_addFolder',
        ENTER_EDIT: {
          target: 'input_edit',
          actions: assign(({ event }) => ({
            editingNodeId: event.nodeId,
            inputValue: '',
          })),
        },
        ENTER_CONFIRM_DELETE: 'confirmDelete',
      },
    },
    input_addBookmark: {
      on: {
        UPDATE_INPUT_VALUE: {
          actions: assign(({ event }) => ({ inputValue: event.value })),
        },
        CANCEL: {
          target: 'navigate',
          actions: assign({
            inputValue: () => '',
            editingNodeId: () => null,
          }),
        },
        OPERATION_SUCCESS: {
          target: 'navigate',
          actions: assign({
            inputValue: () => '',
            editingNodeId: () => null,
          }),
        },
      },
    },
    input_addFolder: {
      on: {
        UPDATE_INPUT_VALUE: {
          actions: assign(({ event }) => ({ inputValue: event.value })),
        },
        CANCEL: {
          target: 'navigate',
          actions: assign({
            inputValue: () => '',
            editingNodeId: () => null,
          }),
        },
        OPERATION_SUCCESS: {
          target: 'navigate',
          actions: assign({
            inputValue: () => '',
            editingNodeId: () => null,
          }),
        },
      },
    },
    input_edit: {
      on: {
        UPDATE_INPUT_VALUE: {
          actions: assign(({ event }) => ({ inputValue: event.value })),
        },
        CANCEL: {
          target: 'navigate',
          actions: assign({
            inputValue: () => '',
            editingNodeId: () => null,
          }),
        },
        OPERATION_SUCCESS: {
          target: 'navigate',
          actions: assign({
            inputValue: () => '',
            editingNodeId: () => null,
          }),
        },
      },
    },
    confirmDelete: {
      on: {
        CANCEL: { target: 'navigate' },
        OPERATION_SUCCESS: { target: 'navigate' },
      },
    },
  },
  on: {
    SET_TREE: {
      actions: assign(({ event }) => ({ bookmarkTree: event.tree })),
    },
    SET_FLATTENED: {
      actions: assign(({ event }) => ({ flattenedTree: event.nodes })),
    },
    SET_EXPANDED: {
      actions: assign(({ event }) => ({ expanded: event.expanded })),
    },
    SET_LOADING: {
      actions: assign(({ event }) => ({ isLoading: event.isLoading })),
    },
  },
});
