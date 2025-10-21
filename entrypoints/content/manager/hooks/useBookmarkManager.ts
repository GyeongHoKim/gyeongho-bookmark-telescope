import { useMachine } from '@xstate/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  managerMachine,
  type BookmarkTreeNode,
  type FlatNode,
} from '../models/managerMachine';

export function useBookmarkManager() {
  const [state, send] = useMachine(managerMachine);
  const stateRef = useRef(state);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    bookmarkTree,
    flattenedTree,
    expanded,
    selectedIndex,
    inputValue,
    editingNodeId,
    isLoading,
  } = state.context;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const flattenTree = useCallback(
    (
      nodes: BookmarkTreeNode[],
      level = 0,
      isLast: boolean[] = []
    ): FlatNode[] => {
      const result: FlatNode[] = [];
      nodes.forEach((node, index) => {
        const isLastNode = index === nodes.length - 1;
        const currentIsLast = [...isLast, isLastNode];
        const hasChildren = !!node.children && node.children.length > 0;
        const isExpanded = !!expanded[node.id];
        result.push({
          ...node,
          level,
          isLast: currentIsLast,
          hasChildren,
          isExpanded,
        });
        if (hasChildren && isExpanded) {
          result.push(...flattenTree(node.children!, level + 1, currentIsLast));
        }
      });
      return result;
    },
    [expanded]
  );

  useEffect(() => {
    send({ type: 'SET_FLATTENED', nodes: flattenTree(bookmarkTree) });
  }, [bookmarkTree, expanded, flattenTree, send]);

  const loadBookmarkTree = useCallback(async () => {
    send({ type: 'SET_LOADING', isLoading: true });
    try {
      const response = await browser.runtime.sendMessage({
        action: 'get-bookmark-tree',
      });
      const tree: BookmarkTreeNode[] = response?.tree || [];
      send({ type: 'SET_TREE', tree });
      const initialExpanded: Record<string, boolean> = {};
      tree.forEach((node) => {
        if (node.children?.length) initialExpanded[node.id] = true;
      });
      send({ type: 'SET_EXPANDED', expanded: initialExpanded });
    } finally {
      send({ type: 'SET_LOADING', isLoading: false });
    }
  }, [send]);

  const hide = useCallback(() => {
    setIsVisible(false);
    send({ type: 'CANCEL' });
  }, [send]);

  const show = useCallback(async () => {
    setIsVisible(true);
    send({ type: 'CANCEL' });
    send({ type: 'SELECT_INDEX', index: 0 });
    await loadBookmarkTree();
  }, [loadBookmarkTree, send]);

  const getSelectedNode = useCallback(
    () => flattenedTree[selectedIndex],
    [flattenedTree, selectedIndex]
  );
  const toggleFolder = useCallback(
    (nodeId: string) => send({ type: 'TOGGLE_FOLDER', nodeId }),
    [send]
  );

  const confirmDelete = useCallback(async () => {
    const node = getSelectedNode();
    if (!node) return;
    await browser.runtime.sendMessage({
      action: 'delete-bookmark',
      id: node.id,
    });
    await loadBookmarkTree();
    send({ type: 'OPERATION_SUCCESS' });
  }, [getSelectedNode, loadBookmarkTree, send]);

  const saveInput = useCallback(async () => {
    const node = getSelectedNode();
    const value = inputValue.trim();
    if (!node || !value) {
      send({ type: 'CANCEL' });
      return;
    }
    if (state.matches('input_addFolder')) {
      await browser.runtime.sendMessage({
        action: 'create-bookmark-folder',
        parentId: node.children ? node.id : node.parentId || '1',
        title: value,
      });
    } else if (state.matches('input_addBookmark')) {
      await browser.runtime.sendMessage({
        action: 'add-bookmark',
        parentId: node.children ? node.id : node.parentId || '1',
        title: value,
        url: window.location.href,
      });
    } else if (state.matches('input_edit') && editingNodeId) {
      await browser.runtime.sendMessage({
        action: 'update-bookmark',
        id: editingNodeId,
        title: value,
      });
    }
    await loadBookmarkTree();
    send({ type: 'OPERATION_SUCCESS' });
  }, [
    state,
    inputValue,
    editingNodeId,
    getSelectedNode,
    loadBookmarkTree,
    send,
  ]);

  const openSelected = useCallback(() => {
    const node = getSelectedNode();
    if (!node) return;
    if (node.url) {
      browser.runtime.sendMessage({ action: 'open-bookmark', url: node.url });
      hide();
    } else if (node.children) {
      toggleFolder(node.id);
    }
  }, [getSelectedNode, toggleFolder, hide]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (state.matches('navigate')) {
        switch (e.key) {
          case 'j':
          case 'ArrowDown':
            e.preventDefault();
            send({ type: 'NEXT_INDEX' });
            break;
          case 'k':
          case 'ArrowUp':
            e.preventDefault();
            send({ type: 'PREV_INDEX' });
            break;
          case 'h':
          case 'ArrowLeft':
            {
              e.preventDefault();
              const n = getSelectedNode();
              if (n?.children && n.isExpanded) toggleFolder(n.id);
            }
            break;
          case 'l':
          case 'ArrowRight':
            {
              e.preventDefault();
              const n = getSelectedNode();
              if (n?.children && !n.isExpanded) toggleFolder(n.id);
            }
            break;
          case 'Enter':
          case 'o':
            e.preventDefault();
            openSelected();
            break;
          case 'a':
            e.preventDefault();
            send({ type: 'ENTER_ADD_BOOKMARK' });
            break;
          case 'A':
            e.preventDefault();
            send({ type: 'ENTER_ADD_FOLDER' });
            break;
          case 'r': {
            e.preventDefault();
            const n = getSelectedNode();
            if (n) send({ type: 'ENTER_EDIT', nodeId: n.id });
            break;
          }
          case 'd':
            e.preventDefault();
            send({ type: 'ENTER_CONFIRM_DELETE' });
            break;
          case 'Escape':
            e.preventDefault();
            hide();
            break;
        }
      } else if (state.matches('confirmDelete')) {
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          confirmDelete();
        } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
          e.preventDefault();
          send({ type: 'CANCEL' });
        }
      } else if (
        state.matches('input_addBookmark') ||
        state.matches('input_addFolder') ||
        state.matches('input_edit')
      ) {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveInput();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          send({ type: 'CANCEL' });
        }
      }
    },
    [
      isVisible,
      state,
      getSelectedNode,
      toggleFolder,
      openSelected,
      confirmDelete,
      saveInput,
      hide,
      send,
    ]
  );

  useEffect(() => {
    const handleToggle = () => {
      if (isVisible) {
        hide();
      } else {
        show();
      }
    };
    window.addEventListener('bookmark-manager-toggle', handleToggle);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('bookmark-manager-toggle', handleToggle);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleKeyDown, show, hide]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) hide();
    },
    [hide]
  );

  const handleItemClick = useCallback(
    (index: number) => {
      send({ type: 'SELECT_INDEX', index });
      const node = flattenedTree[index];
      if (node?.children) toggleFolder(node.id);
      else if (node?.url) openSelected();
    },
    [send, flattenedTree, toggleFolder, openSelected]
  );

  const mode = useMemo(
    () =>
      state.matches('confirmDelete')
        ? 'confirm-delete'
        : state.matches('input_edit')
          ? 'edit'
          : state.matches('input_addFolder')
            ? 'add-folder'
            : state.matches('input_addBookmark')
              ? 'add-bookmark'
              : 'navigate',
    [state]
  );

  return {
    isVisible,
    overlayRef,
    handleOverlayClick,
    flattenedTree,
    selectedIndex,
    inputValue,
    editingNodeId,
    isLoading,
    setInputValue: (v: string) =>
      send({ type: 'UPDATE_INPUT_VALUE', value: v }),
    handleItemClick,
    mode,
  } as const;
}
