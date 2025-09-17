export default defineBackground(() => {
  // Handle keyboard commands
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'open-telescope') {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tab.id) {
        console.error('No active tab found');
        return;
      }

      try {
        await browser.tabs.sendMessage(tab.id, { action: 'toggle-telescope' });
      } catch (error) {
        console.error('Error sending message:', error);
        try {
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['/content-scripts/content.js']
          });

          setTimeout(async () => {
            try {
              if (tab.id) {
                await browser.tabs.sendMessage(tab.id, { action: 'toggle-telescope' });
              }
            } catch (retryError) {
              console.error('Still failed after injection:', retryError);
            }
          }, 100);

        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError);
        }
      }
    }

    if (command === 'quick-bookmark') {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tab.id) {
        console.error('No active tab found');
        return;
      }

      const payload = {
        action: 'open-quick-bookmark',
        title: typeof tab.title === 'string' ? tab.title : '',
        url: typeof tab.url === 'string' ? tab.url : ''
      };

      try {
        await browser.tabs.sendMessage(tab.id, payload);
      } catch (error) {
        console.error('Error sending quick-bookmark message:', error);
        try {
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['/content-scripts/content.js']
          });

          setTimeout(async () => {
            try {
              if (tab.id) {
                await browser.tabs.sendMessage(tab.id, payload);
              }
            } catch (retryError) {
              console.error('Still failed after injection (quick):', retryError);
            }
          }, 100);
        } catch (injectionError) {
          console.error('Failed to inject content script (quick):', injectionError);
        }
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

    if (message.action === 'get-bookmark-folders') {
      browser.bookmarks.getTree().then((tree) => {
        const folders = extractFolders(tree);
        sendResponse({ folders });
      }).catch((error) => {
        sendResponse({ folders: [], error: error.message });
      });
      return true;
    }

    if (message.action === 'create-bookmark') {
      const title: string = message.title;
      const url: string = message.url;
      const parentId: string | undefined = message.parentId;

      browser.bookmarks.create({ title, url, parentId }).then((node) => {
        sendResponse({ success: true, id: node.id });
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
  });
});

// Extract bookmarks from tree structure
interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
  parentId?: string;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId: string;
}

function extractBookmarks(nodes: BookmarkNode[], bookmarks: Bookmark[] = []): Bookmark[] {
  for (const node of nodes) {
    if (node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title,
        url: node.url,
        parentId: typeof node.parentId === 'string' ? node.parentId : ''
      });
    }
    if (node.children) {
      extractBookmarks(node.children, bookmarks);
    }
  }
  return bookmarks;
}

interface BookmarkFolder {
  id: string;
  title: string;
  path: string;
}

function extractFolders(nodes: BookmarkNode[], ancestors: string[] = [], folders: BookmarkFolder[] = []): BookmarkFolder[] {
  for (const node of nodes) {
    const currentPath = [...ancestors, typeof node.title === 'string' ? node.title : ''].filter(Boolean);
    if (!node.url) {
      if (typeof node.title === 'string' && node.title.trim().length > 0) {
        folders.push({
          id: node.id,
          title: node.title,
          path: currentPath.join(' / ')
        });
      }
      if (node.children) {
        extractFolders(node.children, currentPath, folders);
      }
    }
  }
  return folders;
}
