import { useCallback, useEffect, useRef } from 'react';
import type { ActorRefFrom } from 'xstate';
import type { telescopeMachine } from '../models/telescopeMachine';

interface UseTelescopeKeyboardProps {
  isVisible: boolean;
  state: {
    matches: (state: string) => boolean;
  };
  send: ActorRefFrom<typeof telescopeMachine>['send'];
  onOpenBookmark: () => void;
  onHide: () => void;
}

export const useTelescopeKeyboard = ({
  isVisible,
  state,
  send,
  onOpenBookmark,
  onHide,
}: UseTelescopeKeyboardProps) => {
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;

      const current = stateRef.current;
      const normal = current.matches('normal');
      const insert = current.matches('insert');
      const bookmarkListFocused = current.matches('normal.bookmarkList');
      const liveGrepFocused =
        current.matches('normal.liveGrep') ||
        current.matches('insert.liveGrep');
      const previewFocused = current.matches('normal.preview');

      // Normal mode keys
      if (normal) {
        switch (e.key) {
          case 'h':
          case 'ArrowLeft':
            e.preventDefault();
            send({ type: 'PREV_PANEL' });
            break;
          case 'l':
          case 'ArrowRight':
            e.preventDefault();
            send({ type: 'NEXT_PANEL' });
            break;
          case 'j':
          case 'ArrowDown':
            if (bookmarkListFocused) {
              e.preventDefault();
              send({ type: 'NEXT_BOOKMARK' });
            }
            break;
          case 'k':
          case 'ArrowUp':
            if (bookmarkListFocused) {
              e.preventDefault();
              send({ type: 'PREV_BOOKMARK' });
            }
            break;
          case 'i':
          case 'I':
            if (liveGrepFocused) {
              e.preventDefault();
              send({ type: 'ENTER_INSERT_MODE' });
            }
            break;
          case '[':
            if (previewFocused) {
              e.preventDefault();
              send({ type: 'PREV_PREVIEW_TAB' });
            }
            break;
          case ']':
            if (previewFocused) {
              e.preventDefault();
              send({ type: 'NEXT_PREVIEW_TAB' });
            }
            break;
          case 'Enter':
            e.preventDefault();
            onOpenBookmark();
            break;
          case 'q':
          case 'Escape':
            e.preventDefault();
            onHide();
            break;
        }
      }

      // Insert mode keys
      if (insert) {
        if (e.key === 'Escape') {
          e.preventDefault();
          send({ type: 'EXIT_INSERT_MODE' });
        }
      }
    },
    [isVisible, send, onOpenBookmark, onHide]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    handleKeyDown,
  };
};
