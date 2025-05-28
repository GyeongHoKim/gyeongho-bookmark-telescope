// Background service worker for bookmark telescope extension

chrome.commands.onCommand.addListener(async (command) => {
  console.log('🚀 Command received:', command);
  if (command === 'open-telescope') {
    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    console.log('📍 Active tab:', tab.id, tab.url);

    // Send message to content script to show telescope
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle-telescope' });
      console.log('✅ Message sent to content script');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.log('🔄 Trying to inject content script...');
      
      // Try to inject content script if it's not already there
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['telescope.css']
        });
        
        console.log('📋 Content script injected, trying message again...');
        
        // Wait a bit for script to initialize
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'toggle-telescope' });
            console.log('✅ Message sent after injection');
          } catch (retryError) {
            console.error('❌ Still failed after injection:', retryError);
          }
        }, 100);
        
      } catch (injectionError) {
        console.error('❌ Failed to inject content script:', injectionError);
      }
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'get-bookmarks') {
    // Get all bookmarks
    chrome.bookmarks.getTree((tree) => {
      const bookmarks = extractBookmarks(tree);
      sendResponse({ bookmarks });
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'fetch-page-content') {
    // Fetch page content for preview
    fetch(message.url)
      .then((response) => response.text())
      .then((html) => {
        sendResponse({ html, url: message.url });
      })
      .catch((error) => {
        sendResponse({ error: error.message, url: message.url });
      });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'open-bookmark') {
    // Open bookmark in new tab
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
  }
});

// Extract bookmarks from tree structure
function extractBookmarks(nodes, bookmarks = []) {
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
