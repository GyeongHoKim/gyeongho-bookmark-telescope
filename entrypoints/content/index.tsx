import { createRoot } from 'react-dom/client';
import BookmarkTelescope from './BookmarkTelescope';
import BookmarkManager from './BookmarkManager';
import LeaderPalette from './LeaderPalette';
import './telescope.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Prevent multiple instances
    if (window.bookmarkTelescopeLoaded) {
      return;
    }
    window.bookmarkTelescopeLoaded = true;

    // Create container for React component
    const container = document.createElement('div');
    container.id = 'bookmark-telescope-root';
    document.body.appendChild(container);

    // Mount React component
    const root = createRoot(container);
    root.render(
      <>
        <BookmarkTelescope />
        <BookmarkManager />
        <LeaderPalette />
      </>
    );

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'open-leader-palette') {
        const event = new CustomEvent('open-leader-palette');
        window.dispatchEvent(event);
      }
    });
  },
});
