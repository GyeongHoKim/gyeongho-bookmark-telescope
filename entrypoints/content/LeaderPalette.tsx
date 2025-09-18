import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LEADER_ACTIONS, LEADER_ITEMS } from './leaderItems';

const LeaderPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const items = LEADER_ITEMS;

  const isEditableElement = useCallback((el: EventTarget | null) => {
    if (!(el instanceof Element)) return false;
    const tagName = el.tagName.toLowerCase();
    const editableByTag =
      tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const contentEditable = el.getAttribute('contenteditable');
    return (
      editableByTag || contentEditable === '' || contentEditable === 'true'
    );
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setHighlightIndex(0);
    setIsOpen(true);
  }, []);

  const triggerAction = useCallback(
    (itemId: string) => {
      const action = LEADER_ACTIONS[itemId as keyof typeof LEADER_ACTIONS];
      if (action) {
        action();
      }
      close();
    },
    [close]
  );

  const onGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Do not trigger inside inputs/editors
      if (isEditableElement(e.target)) return;

      // Leader key is now handled by Chrome commands API (Ctrl+Shift+T / Cmd+Shift+T)
      // No need to handle keyboard events here

      if (!isOpen) return;

      // While palette is open
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % items.length);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + items.length) % items.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[highlightIndex];
        if (item) {
          triggerAction(item.id);
        }
        return;
      }

      // Quick select by hotkey
      const lowerKey = e.key.length === 1 ? e.key.toLowerCase() : '';
      if (lowerKey) {
        const idx = items.findIndex((it) => it.hotkeys.includes(lowerKey));
        if (idx >= 0) {
          e.preventDefault();
          triggerAction(items[idx].id);
        }
      }
    },
    [isOpen, items, highlightIndex, isEditableElement, close, triggerAction]
  );

  const onDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (!isOpen) return;
      if (!(e.target instanceof Node)) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    },
    [isOpen, close]
  );

  useEffect(() => {
    document.addEventListener('keydown', onGlobalKeyDown, true);
    document.addEventListener('mousedown', onDocumentClick, true);

    // Listen for custom events from background script
    const handleOpenLeaderPalette = () => {
      open();
    };

    window.addEventListener('open-leader-palette', handleOpenLeaderPalette);

    return () => {
      document.removeEventListener('keydown', onGlobalKeyDown, true);
      document.removeEventListener('mousedown', onDocumentClick, true);
      window.removeEventListener(
        'open-leader-palette',
        handleOpenLeaderPalette
      );
    };
  }, [onGlobalKeyDown, onDocumentClick, open]);

  if (!isOpen) return null;

  return (
    <div className="leader-palette" ref={containerRef}>
      <div className="leader-palette-header">
        <span className="leader-palette-title">Leader</span>
        <span className="leader-palette-subtitle">Choose action</span>
      </div>
      <div className="leader-palette-list">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`leader-palette-item ${index === highlightIndex ? 'selected' : ''}`}
            onClick={() => triggerAction(item.id)}
          >
            <span className="leader-palette-item-key">{item.hotkeys[0]}</span>
            <span className="leader-palette-item-body">
              <span className="leader-palette-item-label">{item.label}</span>
              <span className="leader-palette-item-desc">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="leader-palette-help">[j/k: ↑↓] [Enter: select] [ESC: close]</div>
    </div>
  );
};

export default LeaderPalette;
