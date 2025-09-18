export default defineBackground(() => {
  // Handle keyboard commands
  browser.commands.onCommand.addListener(async (command) => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab.id) {
      console.error('No active tab found');
      return;
    }

    try {
      if (command === 'open-leader-palette') {
        await browser.tabs.sendMessage(tab.id, { action: 'open-leader-palette' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['/content-scripts/content.js']
        });

        setTimeout(async () => {
          try {
            if (tab.id && command === 'open-leader-palette') {
              await browser.tabs.sendMessage(tab.id, { action: 'open-leader-palette' });
            }
          } catch (retryError) {
            console.error('Still failed after injection:', retryError);
          }
        }, 100);

      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
      }
    }
  });

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'get-bookmarks') {
      browser.bookmarks.getTree().then((tree) => {
        console.log('Background: Raw bookmark tree:', tree);
        const bookmarks = extractBookmarks(tree);
        sendResponse({ bookmarks });
      }).catch((error) => {
        sendResponse({ bookmarks: [], error: error.message });
      });
      return true;
    }

    if (message.action === 'fetch-page-content') {
      fetch(message.url)
        .then((response) => response.text())
        .then((html) => {
          sendResponse({ html, url: message.url });
        })
        .catch((error) => {
          sendResponse({ error: error.message, url: message.url });
        });
      return true;
    }

    if (message.action === 'open-bookmark') {
      browser.tabs.create({ url: message.url });
      sendResponse({ success: true });
    }
  });
});

// Extract bookmarks from tree structure
interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children?: BookmarkNode[];
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId?: string;
}

function extractBookmarks(nodes: BookmarkNode[], bookmarks: Bookmark[] = []): Bookmark[] {
  for (const node of nodes) {
    if (node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title,
        url: node.url,
        parentId: node.parentId
      });
    }
    if (node.children) {
      extractBookmarks(node.children, bookmarks);
    }
  }
  return bookmarks;
}
