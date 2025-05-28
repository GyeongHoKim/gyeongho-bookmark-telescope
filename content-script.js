// Content script for bookmark telescope extension

class BookmarkTelescope {
  constructor() {
    this.overlay = null;
    this.searchInput = null;
    this.resultsList = null;
    this.previewPane = null;
    this.bookmarks = [];
    this.filteredBookmarks = [];
    this.selectedIndex = 0;
    this.isVisible = false;

    this.initializeOverlay();
    this.setupMessageListener();
  }

  initializeOverlay() {
    // Create overlay structure
    this.overlay = document.createElement('div');
    this.overlay.className = 'bookmark-telescope-overlay';
    this.overlay.innerHTML = `
      <div class="telescope-container">
        <div class="telescope-header">
          <input type="text" class="telescope-search" placeholder="🔍 Search bookmarks (regex supported)..." />
        </div>
        <div class="telescope-body">
          <div class="telescope-results"></div>
          <div class="telescope-preview">
            <div class="telescope-preview-header"></div>
            <div class="telescope-preview-content">Select a bookmark to preview</div>
          </div>
        </div>
        <div class="telescope-help">
          Ctrl+Shift+P toggle • ↑↓ navigate • Enter open • Esc close
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(this.overlay);

    // Get references
    this.searchInput = this.overlay.querySelector('.telescope-search');
    this.resultsList = this.overlay.querySelector('.telescope-results');
    this.previewPane = this.overlay.querySelector('.telescope-preview-content');
    this.previewHeader = this.overlay.querySelector(
      '.telescope-preview-header'
    );

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.filterBookmarks(e.target.value);
    });

    // Keyboard navigation
    this.searchInput.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigateDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateUp();
          break;
        case 'Enter':
          e.preventDefault();
          this.openSelectedBookmark();
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
      }
    });

    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      console.log('📨 Content script received message:', message);
      if (message.action === 'toggle-telescope') {
        console.log('🔭 Toggling telescope, current visibility:', this.isVisible);
        this.toggle();
      }
    });
  }

  async toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      await this.show();
    }
  }

  async show() {
    this.isVisible = true;
    this.overlay.classList.add('active');

    // Focus search input
    this.searchInput.focus();
    this.searchInput.value = '';

    // Load bookmarks
    await this.loadBookmarks();
    this.filterBookmarks('');
  }

  hide() {
    this.isVisible = false;
    this.overlay.classList.remove('active');
    this.searchInput.blur();
  }

  async loadBookmarks() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'get-bookmarks' }, (response) => {
        this.bookmarks = response.bookmarks || [];
        resolve();
      });
    });
  }

  filterBookmarks(query) {
    try {
      if (!query.trim()) {
        this.filteredBookmarks = [...this.bookmarks];
      } else {
        // Use regex for filtering
        const regex = new RegExp(query, 'i');
        this.filteredBookmarks = this.bookmarks.filter(
          (bookmark) => regex.test(bookmark.title) || regex.test(bookmark.url)
        );
      }
    } catch {
      // If regex is invalid, fall back to simple string matching
      const lowerQuery = query.toLowerCase();
      this.filteredBookmarks = this.bookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(lowerQuery) ||
          bookmark.url.toLowerCase().includes(lowerQuery)
      );
    }

    this.selectedIndex = 0;
    this.renderResults();
    this.updatePreview();
  }

  renderResults() {
    this.resultsList.innerHTML = '';

    if (this.filteredBookmarks.length === 0) {
      this.resultsList.innerHTML =
        '<div class="telescope-loading">No bookmarks found</div>';
      return;
    }

    this.filteredBookmarks.forEach((bookmark, index) => {
      const item = document.createElement('div');
      item.className = `telescope-item ${index === this.selectedIndex ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="telescope-item-title">${this.escapeHtml(bookmark.title)}</div>
        <div class="telescope-item-url">${this.escapeHtml(bookmark.url)}</div>
      `;

      item.addEventListener('click', () => {
        this.selectedIndex = index;
        this.renderResults();
        this.updatePreview();
      });

      item.addEventListener('dblclick', () => {
        this.openSelectedBookmark();
      });

      this.resultsList.appendChild(item);
    });
  }

  navigateDown() {
    if (this.filteredBookmarks.length === 0) return;
    this.selectedIndex =
      (this.selectedIndex + 1) % this.filteredBookmarks.length;
    this.renderResults();
    this.updatePreview();
    this.scrollToSelected();
  }

  navigateUp() {
    if (this.filteredBookmarks.length === 0) return;
    this.selectedIndex =
      (this.selectedIndex - 1 + this.filteredBookmarks.length) %
      this.filteredBookmarks.length;
    this.renderResults();
    this.updatePreview();
    this.scrollToSelected();
  }

  scrollToSelected() {
    const selectedItem = this.resultsList.querySelector(
      '.telescope-item.selected'
    );
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }

  async updatePreview() {
    if (
      this.filteredBookmarks.length === 0 ||
      this.selectedIndex >= this.filteredBookmarks.length
    ) {
      this.previewHeader.textContent = '';
      this.previewPane.textContent = 'Select a bookmark to preview';
      return;
    }

    const bookmark = this.filteredBookmarks[this.selectedIndex];
    this.previewHeader.textContent = bookmark.url;
    this.previewPane.innerHTML =
      '<div class="telescope-loading">Loading preview...</div>';

    // Fetch page content
    chrome.runtime.sendMessage(
      {
        action: 'fetch-page-content',
        url: bookmark.url
      },
      (response) => {
        if (response.error) {
          this.previewPane.innerHTML = `<div class="telescope-error">Error loading preview: ${response.error}</div>`;
        } else {
          this.displayPreview(response.html);
        }
      }
    );
  }

  displayPreview(html) {
    // Extract and display raw HTML (truncated for performance)
    const maxLength = 5000;
    const truncatedHtml =
      html.length > maxLength
        ? html.substring(0, maxLength) + '\n\n... (truncated)'
        : html;

    this.previewPane.textContent = truncatedHtml;
  }

  openSelectedBookmark() {
    if (
      this.filteredBookmarks.length === 0 ||
      this.selectedIndex >= this.filteredBookmarks.length
    ) {
      return;
    }

    const bookmark = this.filteredBookmarks[this.selectedIndex];
    chrome.runtime.sendMessage({
      action: 'open-bookmark',
      url: bookmark.url
    });

    this.hide();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize telescope when content script loads
console.log('🎯 Bookmark Telescope content script loaded');

// Prevent multiple instances
if (!window.bookmarkTelescopeLoaded) {
  window.bookmarkTelescopeLoaded = true;
  new BookmarkTelescope();
} else {
  console.log('🔄 Bookmark Telescope already loaded, skipping...');
}
