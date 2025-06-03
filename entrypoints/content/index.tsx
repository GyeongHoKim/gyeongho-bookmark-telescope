import { createRoot } from 'react-dom/client';
import BookmarkTelescope from './BookmarkTelescope';
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
    root.render(<BookmarkTelescope />);

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'toggle-telescope') {
        const event = new CustomEvent('telescope-toggle');
        window.dispatchEvent(event);
      }
    });
  },
});