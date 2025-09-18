import React, { useCallback, useEffect, useRef, useState } from 'react';

interface BookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkTreeNode[];
  parentId?: string;
  dateAdded?: number;
  index?: number;
}

interface ExpandedState {
  [key: string]: boolean;
}

type Mode = 'navigate' | 'add-bookmark' | 'add-folder' | 'edit' | 'confirm-delete';

const BookmarkManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bookmarkTree, setBookmarkTree] = useState<BookmarkTreeNode[]>([]);
  const [flattenedTree, setFlattenedTree] = useState<BookmarkTreeNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<ExpandedState>({});
  const [mode, setMode] = useState<Mode>('navigate');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Generate tree structure prefix (like vim NERDTree)
  const getTreePrefix = useCallback((isLast: boolean[], level: number) => {
    if (level === 0) return '';

    let prefix = '';
    for (let i = 0; i < level - 1; i++) {
      prefix += isLast[i] ? '    ' : '│   ';
    }
    prefix += isLast[level - 1] ? '└── ' : '├── ';
    return prefix;
  }, []);

  // Get node icon (folder/file indicator)
  const getNodeIcon = useCallback((node: BookmarkTreeNode & { hasChildren?: boolean }) => {
    if (node.hasChildren) {
      return expandedNodes[node.id] ? '▼ ' : '▶ ';
    }
    return '  ';
  }, [expandedNodes]);

  // Load bookmark tree
  const loadBookmarkTree = useCallback(async () => {
    setIsLoading(true);
    return new Promise<void>((resolve) => {
      browser.runtime.sendMessage({ action: 'get-bookmark-tree' }, (response) => {
        if (response.error) {
          console.error('Error loading bookmark tree:', response.error);
        }
        const tree = response.tree || [];
        setBookmarkTree(tree);

        // Initialize expanded state for root folders
        const initialExpanded: ExpandedState = {};
        tree.forEach((node: BookmarkTreeNode) => {
          if (node.children) {
            initialExpanded[node.id] = true;
          }
        });
        setExpandedNodes(initialExpanded);

        setIsLoading(false);
        resolve();
      });
    });
  }, []);

  // Flatten tree for navigation with tree structure info
  const flattenTree = useCallback((nodes: BookmarkTreeNode[], level = 0, isLast: boolean[] = []): BookmarkTreeNode[] => {
    const result: BookmarkTreeNode[] = [];

    nodes.forEach((node, index) => {
      const isLastNode = index === nodes.length - 1;
      const currentIsLast = [...isLast, isLastNode];

      // Add level and tree structure info
      const nodeWithLevel = {
        ...node,
        level,
        isLast: currentIsLast,
        hasChildren: !!node.children && node.children.length > 0
      };
      result.push(nodeWithLevel);

      // Add children if expanded
      if (node.children && expandedNodes[node.id]) {
        result.push(...flattenTree(node.children, level + 1, currentIsLast));
      }
    });

    return result;
  }, [expandedNodes]);

  // Update flattened tree when tree or expanded state changes
  useEffect(() => {
    setFlattenedTree(flattenTree(bookmarkTree));
  }, [bookmarkTree, flattenTree]);

  // Get current selected node
  const getSelectedNode = useCallback(() => {
    return flattenedTree[selectedIndex];
  }, [flattenedTree, selectedIndex]);

  // Toggle folder expansion
  const toggleFolder = useCallback((nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);

  // Add bookmark or folder
  const handleAdd = useCallback((isFolder: boolean) => {
    const selectedNode = getSelectedNode();
    if (!selectedNode) return;

    setMode(isFolder ? 'add-folder' : 'add-bookmark');
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [getSelectedNode]);

  // Rename node
  const handleRename = useCallback(() => {
    const selectedNode = getSelectedNode();
    if (!selectedNode) return;

    setMode('edit');
    setEditingNodeId(selectedNode.id);
    setInputValue(selectedNode.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, [getSelectedNode]);

  // Delete node
  const handleDelete = useCallback(() => {
    const selectedNode = getSelectedNode();
    if (!selectedNode) return;

    setMode('confirm-delete');
  }, [getSelectedNode]);

  // Confirm delete
  const confirmDelete = useCallback(() => {
    const selectedNode = getSelectedNode();
    if (!selectedNode) return;

    browser.runtime.sendMessage({
      action: 'delete-bookmark',
      id: selectedNode.id
    }, (response) => {
      if (response.success) {
        loadBookmarkTree();
        setMode('navigate');
      }
    });
  }, [getSelectedNode, loadBookmarkTree]);

  // Save input (for add or edit)
  const handleSaveInput = useCallback(() => {
    const selectedNode = getSelectedNode();
    if (!selectedNode || !inputValue.trim()) {
      setMode('navigate');
      return;
    }

    if (mode === 'add-bookmark' || mode === 'add-folder') {
      // Determine parent ID
      let parentId = selectedNode.id;
      if (!selectedNode.children) {
        // If selected is not a folder, use its parent
        parentId = selectedNode.parentId || '1';
      }

      const message = mode === 'add-folder'
        ? { action: 'create-bookmark-folder', parentId, title: inputValue.trim() }
        : { action: 'add-bookmark', parentId, title: inputValue.trim(), url: window.location.href };

      browser.runtime.sendMessage(message, (response) => {
        if (response.success) {
          loadBookmarkTree();
          setMode('navigate');
        }
      });
    } else if (mode === 'edit' && editingNodeId) {
      browser.runtime.sendMessage({
        action: 'update-bookmark',
        id: editingNodeId,
        title: inputValue.trim()
      }, (response) => {
        if (response.success) {
          loadBookmarkTree();
          setMode('navigate');
          setEditingNodeId(null);
        }
      });
    }
  }, [mode, inputValue, editingNodeId, getSelectedNode, loadBookmarkTree]);

  // Show/hide manager
  const hide = useCallback(() => {
    setIsVisible(false);
    setMode('navigate');
    setEditingNodeId(null);
  }, []);

  const show = useCallback(async () => {
    setIsVisible(true);
    setMode('navigate');
    setSelectedIndex(0);
    await loadBookmarkTree();
  }, [loadBookmarkTree]);

  // Open bookmark
  const openBookmark = useCallback(() => {
    const selectedNode = getSelectedNode();
    if (!selectedNode) return;

    if (selectedNode.url) {
      browser.runtime.sendMessage({
        action: 'open-bookmark',
        url: selectedNode.url
      });
      hide();
    } else if (selectedNode.children) {
      toggleFolder(selectedNode.id);
    }
  }, [getSelectedNode, toggleFolder, hide]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return;

    // Input mode handling
    if (mode === 'add-bookmark' || mode === 'add-folder' || mode === 'edit') {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveInput();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMode('navigate');
        setEditingNodeId(null);
      }
      return;
    }

    // Confirm delete mode
    if (mode === 'confirm-delete') {
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        confirmDelete();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault();
        setMode('navigate');
      }
      return;
    }

    // Navigation mode
    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          Math.min(prev + 1, flattenedTree.length - 1)
        );
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'h':
      case 'ArrowLeft':
        e.preventDefault();
        {
          const node = getSelectedNode();
          if (node?.children && expandedNodes[node.id]) {
            toggleFolder(node.id);
          }
        }
        break;
      case 'l':
      case 'ArrowRight':
        e.preventDefault();
        {
          const node = getSelectedNode();
          if (node?.children && !expandedNodes[node.id]) {
            toggleFolder(node.id);
          }
        }
        break;
      case 'Enter':
      case 'o':
        e.preventDefault();
        openBookmark();
        break;
      case 'a':
        e.preventDefault();
        handleAdd(false);
        break;
      case 'A':
        e.preventDefault();
        handleAdd(true);
        break;
      case 'r':
        e.preventDefault();
        handleRename();
        break;
      case 'd':
        e.preventDefault();
        handleDelete();
        break;
      case 'Escape':
        e.preventDefault();
        hide();
        break;
    }
  }, [isVisible, mode, flattenedTree.length, getSelectedNode, expandedNodes,
      toggleFolder, openBookmark, handleAdd, handleRename, handleDelete,
      handleSaveInput, confirmDelete, hide]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      hide();
    }
  }, [hide]);

  // Handle item click
  const handleItemClick = useCallback((index: number) => {
    setSelectedIndex(index);
    const node = flattenedTree[index];
    if (node?.children) {
      toggleFolder(node.id);
    } else if (node?.url) {
      openBookmark();
    }
  }, [flattenedTree, toggleFolder, openBookmark]);

  // Setup event listeners
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

  // Scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isVisible) return null;

  const selectedNode = getSelectedNode();

  return (
    <div
      className="bookmark-manager-overlay active"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="bookmark-manager-container">
        <div className="bookmark-manager-header">
          <span className="bookmark-manager-title">📚 Bookmark Manager</span>
        </div>

        <div className="bookmark-manager-tree">
          {isLoading ? (
            <div className="bookmark-manager-loading">Loading bookmarks...</div>
          ) : flattenedTree.length === 0 ? (
            <div className="bookmark-manager-empty">No bookmarks found</div>
          ) : (
            flattenedTree.map((node: BookmarkTreeNode & { level?: number; isLast?: boolean[]; hasChildren?: boolean }, index: number) => (
              <div key={node.id}>
                <div
                  ref={el => { itemRefs.current[index] = el; }}
                  className={`bookmark-manager-item ${index === selectedIndex ? 'selected' : ''}`}
                  style={{ paddingLeft: '10px' }}
                  onClick={() => handleItemClick(index)}
                >
                  {mode === 'edit' && editingNodeId === node.id ? (
                    <div className="bookmark-manager-item-content">
                      <span className="bookmark-manager-tree-prefix">
                        {getTreePrefix(node.isLast || [], node.level || 0)}
                      </span>
                      <span className="bookmark-manager-icon">
                        {getNodeIcon(node)}
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        className="bookmark-manager-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div className="bookmark-manager-item-content">
                      <span className="bookmark-manager-tree-prefix">
                        {getTreePrefix(node.isLast || [], node.level || 0)}
                      </span>
                      <span className="bookmark-manager-icon">
                        {getNodeIcon(node)}
                      </span>
                      <span className="bookmark-manager-label">{node.title || 'Untitled'}</span>
                      {node.hasChildren && (
                        <span className="bookmark-manager-count">
                          [{node.children?.length || 0}]
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Show add input right after selected node */}
                {(mode === 'add-bookmark' || mode === 'add-folder') && index === selectedIndex && (
                  <div
                    className="bookmark-manager-item bookmark-manager-new-item"
                    style={{ paddingLeft: '10px' }}
                  >
                    <div className="bookmark-manager-item-content">
                      <span className="bookmark-manager-tree-prefix">
                        {getTreePrefix([...node.isLast || [], true], (node.hasChildren ? (node.level || 0) + 1 : (node.level || 0)))}
                      </span>
                      <span className="bookmark-manager-icon">
                        {mode === 'add-folder' ? '▶ ' : '  '}
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        className="bookmark-manager-input"
                        placeholder={mode === 'add-folder' ? 'Folder name...' : 'Bookmark name...'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bookmark-manager-footer">
          {mode === 'confirm-delete' ? (
            <span className="bookmark-manager-help">
              Delete &quot;{selectedNode?.title}&quot;? [y/n]
            </span>
          ) : mode === 'edit' || mode === 'add-bookmark' || mode === 'add-folder' ? (
            <span className="bookmark-manager-help">
              [Enter: save] [ESC: cancel]
            </span>
          ) : (
            <span className="bookmark-manager-help">
              [j/k: ↑↓] [h/l: ←→] [a: add] [A: folder] [r: rename] [d: delete] [o: open]
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkManager;