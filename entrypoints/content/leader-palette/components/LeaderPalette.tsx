import React from 'react';
import { useLeaderActions } from '../hooks/useLeaderActions';
import { useLeaderPalette } from '../hooks/useLeaderPalette';
import { LEADER_ITEMS } from '../models/leaderItems';

const LeaderPalette: React.FC = () => {
  const { isOpen, focusIndex, close, ulRef, containerRef } = useLeaderPalette();
  const { executeAction } = useLeaderActions({
    isOpen,
    focusIndex,
    onClose: close,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      className="leader-palette"
      data-testid="leader-palette"
    >
      <header className="leader-palette-header">
        <span className="leader-palette-title" data-testid="leader-title">
          Leader
        </span>
        <span className="leader-palette-subtitle">Choose action</span>
      </header>
      <ul
        ref={ulRef}
        className="leader-palette-list"
        data-testid="leader-actions"
      >
        {LEADER_ITEMS.map((item) => (
          <li key={item.id} tabIndex={0}>
            <button
              type="button"
              className="leader-palette-item"
              onClick={() => executeAction(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.stopPropagation();
                  executeAction(item.id);
                }
              }}
              data-testid="leader-action"
            >
              <span className="leader-palette-item-key">{item.hotkeys[0]}</span>
              <span className="leader-palette-item-body">
                <span className="leader-palette-item-label">{item.label}</span>
                <span className="leader-palette-item-desc">
                  {item.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="leader-palette-help">
        [j/k: ↑↓] [Enter: select] [ESC: close]
      </div>
    </section>
  );
};

export default LeaderPalette;
