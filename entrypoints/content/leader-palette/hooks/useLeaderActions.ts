import { useCallback, useEffect } from 'react';
import { ActionID, LEADER_ITEMS } from '../models/leaderItems';
import { useNotification } from '../../../common/contexts/NotificationContext';

interface UseLeaderActionsProps {
  isOpen: boolean;
  focusIndex: number;
  onClose: () => void;
}

export function useLeaderActions({
  isOpen,
  focusIndex,
  onClose,
}: UseLeaderActionsProps) {
  const { notify } = useNotification();

  const executeAction = useCallback(
    async (actionId: ActionID) => {
      switch (actionId) {
        case 'live-grep': {
          const event = new CustomEvent('telescope-toggle');
          window.dispatchEvent(event);
          break;
        }
        case 'bookmark-manager': {
          const event = new CustomEvent('bookmark-manager-toggle');
          window.dispatchEvent(event);
          break;
        }
        case 'quick-bookmark': {
          const title = document.title;
          const url = window.location.href;

          try {
            const response = await browser.runtime.sendMessage({
              action: 'add-bookmark',
              title,
              url,
            });

            if (response.success) {
              notify({
                variant: 'success',
                title: 'Quick Bookmark',
                message: `Added: ${title}`,
              });
            } else {
              notify({
                variant: 'error',
                title: 'Quick Bookmark',
                message: response.error || 'Failed to add bookmark',
              });
            }
          } catch (err) {
            notify({
              variant: 'error',
              title: 'Quick Bookmark',
              message: err instanceof Error ? err.message : 'Unknown error',
            });
          }
          break;
        }
      }
      onClose();
    },
    [onClose, notify]
  );

  const handleKeyboardEvent = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();

      switch (event.key) {
        case 'Enter':
          executeAction(LEADER_ITEMS[focusIndex].id);
          break;
      }

      const actionId = LEADER_ITEMS.find((item) =>
        item.hotkeys.includes(event.key)
      )?.id;
      if (actionId) {
        executeAction(actionId);
      }
    },
    [focusIndex, isOpen, executeAction]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyboardEvent);
    };
  }, [handleKeyboardEvent]);

  return {
    executeAction,
  };
}
