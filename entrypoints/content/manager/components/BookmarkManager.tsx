import React, { useCallback, useEffect, useRef } from 'react';
import { useBookmarkManager } from '../hooks/useBookmarkManager';

const BookmarkManager: React.FC = () => {
  const {
    isVisible, overlayRef, handleOverlayClick,
    flattenedTree, selectedIndex, inputValue, editingNodeId, isLoading,
    setInputValue, handleItemClick, mode,
  } = useBookmarkManager();

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getTreePrefix = useCallback((isLast: boolean[], level: number) => {
    if (level === 0) return '';
    let prefix = '';
    for (let i = 0; i < level - 1; i++) {
      prefix += isLast[i] ? '    ' : '│   ';
    }
    prefix += isLast[level - 1] ? '└── ' : '├── ';
    return prefix;
  }, []);

  const getNodeIcon = useCallback((node: { hasChildren?: boolean; isExpanded?: boolean }) => {
    return node.hasChildren ? (node.isExpanded ? '▼ ' : '▶ ') : '  ';
  }, []);

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (mode === 'edit' || mode === 'add-bookmark' || mode === 'add-folder') {
      setTimeout(() => {
        inputRef.current?.focus();
        if (mode === 'edit') inputRef.current?.select();
      }, 50);
    }
  }, [mode]);

  if (!isVisible) return null;

  const selectedNode = flattenedTree[selectedIndex];

  return (
    <div
      className="bookmark-manager-overlay active"
      ref={overlayRef}
      onClick={handleOverlayClick}
      data-testid="bookmark-manager"
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
            flattenedTree.map((node, index) => (
              <div key={node.id}>
                <div
                  ref={(el) => { itemRefs.current[index] = el; }}
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
                        <span className="bookmark-manager-count">[{node.children?.length || 0}]</span>
                      )}
                    </div>
                  )}
                </div>

                {(mode === 'add-bookmark' || mode === 'add-folder') && index === selectedIndex && (
                  <div className="bookmark-manager-item bookmark-manager-new-item" style={{ paddingLeft: '10px' }}>
                    <div className="bookmark-manager-item-content">
                      <span className="bookmark-manager-tree-prefix">
                        {getTreePrefix([...(node.isLast || []), true], node.hasChildren ? (node.level || 0) + 1 : (node.level || 0))}
                      </span>
                      <span className="bookmark-manager-icon">{mode === 'add-folder' ? '▶ ' : '  '}</span>
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
            <span className="bookmark-manager-help">Delete &quot;{selectedNode?.title}&quot;? [y/n]</span>
          ) : mode === 'edit' || mode === 'add-bookmark' || mode === 'add-folder' ? (
            <span className="bookmark-manager-help">[Enter: save] [ESC: cancel]</span>
          ) : (
            <span className="bookmark-manager-help">[j/k: ↑↓] [h/l: ←→] [a: add] [A: folder] [r: rename] [d: delete] [o: open]</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkManager;