export type ActionID = 'live-grep' | 'quick-bookmark' | 'bookmark-manager';

export interface LeaderItem {
  id: ActionID;
  label: string;
  description: string;
  hotkeys: string[];
}

export const LEADER_ITEMS: LeaderItem[] = [
  {
    id: 'live-grep',
    label: 'Live Grep',
    description: 'Search bookmarks',
    hotkeys: ['g']
  },
  {
    id: 'quick-bookmark',
    label: 'Quick Bookmark',
    description: 'Quick add current page',
    hotkeys: ['a']
  },
  {
    id: 'bookmark-manager',
    label: 'Bookmark Manager',
    description: 'Full bookmark management',
    hotkeys: ['b']
  }
];

export const LEADER_ACTIONS: Record<ActionID, () => void> = {
  'live-grep': () => {
    const event = new CustomEvent('telescope-toggle');
    window.dispatchEvent(event);
  },
  'bookmark-manager': () => {
    const event = new CustomEvent('bookmark-manager-toggle');
    window.dispatchEvent(event);
  },
  'quick-bookmark': async () => {
    // Get current page info
    const title = document.title;
    const url = window.location.href;

    // Send message to background script to add bookmark
    try {
      const response = await browser.runtime.sendMessage({
        action: 'add-bookmark',
        title,
        url
      });

      if (response.success) {
        // Show success notification with consistent styling
        const notification = document.createElement('div');
        const truncatedTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;

        notification.innerHTML = `
          <div class="quick-bookmark-notification" data-testid="quick-bookmark">
            <div class="quick-bookmark-header">
              <span class="quick-bookmark-title">Quick Bookmark</span>
            </div>
            <div class="quick-bookmark-content">
              <span class="quick-bookmark-label">Added:</span>
              <span class="quick-bookmark-name">${truncatedTitle}</span>
            </div>
          </div>
        `;

        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #1e1e2e;
          border: 2px solid #cdd6f4;
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          color: #cdd6f4;
          z-index: 999999;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          min-width: 300px;
          max-width: 400px;
        `;

        // Add consistent styling
        const style = document.createElement('style');
        style.textContent = `
          .quick-bookmark-notification {
            display: flex;
            flex-direction: column;
          }

          .quick-bookmark-header {
            padding: 8px 12px;
            background-color: #313244;
            border-bottom: 1px solid #45475a;
          }

          .quick-bookmark-title {
            font-weight: bold;
            color: #cdd6f4;
            font-size: 12px;
          }

          .quick-bookmark-content {
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .quick-bookmark-label {
            color: #6c7086;
            font-size: 11px;
          }

          .quick-bookmark-name {
            color: #a6e3a1;
            font-size: 12px;
            word-break: break-word;
          }

          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
          notification.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => {
            notification.remove();
            style.remove();
          }, 300);
        }, 3000);
      } else {
        console.error('Failed to add bookmark:', response.error);
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  }
} as const;
