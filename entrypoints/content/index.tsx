import { createRoot } from 'react-dom/client';
import LeaderPalette from './leader-palette/components/LeaderPalette';
import BookmarkManager from './manager/components/BookmarkManager';
import './telescope.css';
import BookmarkTelescope from './telescope/BookmarkTelescope';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Prevent multiple instances
    if (window.bookmarkTelescopeLoaded) {
      return;
    }
    window.bookmarkTelescopeLoaded = true;

    // Add summarization origin trial token to the header
    const otMeta = document.createElement('meta');
    otMeta.httpEquiv = 'origin-trial';
    otMeta.content =
      'AxnlIOHOvSHjVcKzN7x+KBFtx6ajqwWfcMBoZl/LiDUn35BPxhdETUrfYcjvr/2yUCvF+7WqaOEvFQGb7BM/GggAAACHeyJvcmlnaW4iOiJjaHJvbWUtZXh0ZW5zaW9uOi8vYXBhcGNvYmpuYnBtbmRjcGNlZGpobmdtZ29jamFuY2oiLCJmZWF0dXJlIjoiQUlTdW1tYXJpemF0aW9uQVBJIiwiZXhwaXJ5IjoxNzYwNDAwMDAwLCJpc1RoaXJkUGFydHkiOnRydWV9';
    document.head.appendChild(otMeta);

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
