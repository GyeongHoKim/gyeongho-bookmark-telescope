import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import BookmarkTelescope from '../entrypoints/content/telescope/BookmarkTelescope';

interface TestBookmark {
  id: string;
  title: string;
  url: string;
  parentId: string;
}

describe('BookmarkTelescope integration', () => {
  const testBookmarks: TestBookmark[] = [
    { id: '1', title: 'Alpha', url: 'https://alpha.example.com', parentId: 'p1' },
    { id: '2', title: 'Beta', url: 'https://beta.example.com', parentId: 'p1' },
    { id: '3', title: 'Gamma', url: 'https://gamma.example.com', parentId: 'p1' },
  ];

  const triggerToggle = () => {
    act(() => {
      const event = new CustomEvent('telescope-toggle');
      window.dispatchEvent(event);
    });
  };

  let openedMessages: Array<{ action: string; url?: string }>; // capture open-bookmark calls

  beforeEach(() => {
    fakeBrowser.reset();
    openedMessages = [];

    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'get-bookmarks') {
        return Promise.resolve({ bookmarks: testBookmarks });
      }
      if (message.action === 'fetch-page-content') {
        return Promise.resolve({ html: '<html><body><h1>Example</h1><p>Content</p></body></html>' });
      }
      if (message.action === 'open-bookmark') {
        openedMessages.push(message);
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({});
    });
  });

  // 1) Visibility
  it('should toggle visibility via custom event and hide on Escape', async () => {
    render(<BookmarkTelescope />);

    // Initial: overlay not visible
    expect(screen.queryByTestId('live-grep')).not.toBeInTheDocument();

    // Toggle on
    triggerToggle();
    expect(await screen.findByTestId('live-grep')).toBeInTheDocument();

    // Toggle off
    triggerToggle();
    await waitFor(() => expect(screen.queryByTestId('live-grep')).not.toBeInTheDocument());

    // Toggle on again then hide with Escape
    const user = userEvent.setup();
    triggerToggle();
    expect(await screen.findByTestId('live-grep')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('live-grep')).not.toBeInTheDocument());
  });

  // 2) Panel navigation (normal mode)
  it('should cycle panels with l/h keys in normal mode', async () => {
    render(<BookmarkTelescope />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('live-grep');

    // On open: bookmarkList focused
    expect(document.querySelector('.telescope-results-section.focused')).toBeInTheDocument();

    // l -> liveGrep
    await user.keyboard('l');
    expect(document.querySelector('.telescope-search-section.focused')).toBeInTheDocument();

    // l -> preview
    await user.keyboard('l');
    expect(document.querySelector('.telescope-preview-section.focused')).toBeInTheDocument();

    // l -> back to bookmarkList
    await user.keyboard('l');
    expect(document.querySelector('.telescope-results-section.focused')).toBeInTheDocument();

    // h -> preview
    await user.keyboard('h');
    expect(document.querySelector('.telescope-preview-section.focused')).toBeInTheDocument();

    // h -> liveGrep
    await user.keyboard('h');
    expect(document.querySelector('.telescope-search-section.focused')).toBeInTheDocument();
  });

  // 3) Bookmark navigation (normal.bookmarkList only)
  it('should navigate bookmarks with j/k only in bookmarkList panel', async () => {
    render(<BookmarkTelescope />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('live-grep');

    // Wait for bookmarks to render
    const alphaTitle = await screen.findByText('Alpha');
    expect(alphaTitle).toBeInTheDocument();

    const getSelectedTitle = () => {
      const selected = document.querySelector('li.telescope-item.selected .telescope-item-title');
      return selected?.textContent;
    };

    // First item selected by default (Alpha)
    await waitFor(() => expect(getSelectedTitle()).toBe('Alpha'));

    // j selects next (Beta)
    await user.keyboard('j');
    await waitFor(() => expect(getSelectedTitle()).toBe('Beta'));

    // k selects previous (Alpha)
    await user.keyboard('k');
    await waitFor(() => expect(getSelectedTitle()).toBe('Alpha'));

    // Move focus to liveGrep
    await user.keyboard('l');
    expect(document.querySelector('.telescope-search-section.focused')).toBeInTheDocument();

    // In non-bookmarkList panels, j/k do nothing
    await user.keyboard('j');
    await user.keyboard('k');
    // Selection unchanged
    await waitFor(() => expect(getSelectedTitle()).toBe('Alpha'));
  });

  // 4) Insert mode (normal.liveGrep -> insert.liveGrep)
  it('should enter/exit insert mode correctly and restrict panel nav', async () => {
    render(<BookmarkTelescope />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('live-grep');

    // Move to liveGrep
    await user.keyboard('l');
    expect(document.querySelector('.telescope-search-section.focused')).toBeInTheDocument();

    // Enter insert mode with i
    await user.keyboard('i');

    // Input should be editable and focused; mode indicator shows INSERT
    const input = document.querySelector('input.telescope-search') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(input?.readOnly).toBe(false);
    expect(input).toHaveFocus();
    expect(screen.getAllByText('-- INSERT --').length).toBeGreaterThan(0);

    // In insert mode, l should NOT change panel
    await user.keyboard('l');
    expect(document.querySelector('.telescope-search-section.focused')).toBeInTheDocument();

    // Exit insert with Escape, remain on liveGrep
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(document.querySelector('.telescope-search-section.focused')).toBeInTheDocument()
    );

    // Now l should move to preview
    await user.keyboard('l');
    await waitFor(() =>
      expect(document.querySelector('.telescope-preview-section.focused')).toBeInTheDocument()
    );
  });

  // 5) Preview tab toggles (normal.preview)
  it('should toggle preview tabs with ] and [ keys', async () => {
    render(<BookmarkTelescope />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('live-grep');

    // Move to preview panel
    await user.keyboard('l');
    await user.keyboard('l');
    expect(document.querySelector('.telescope-preview-section.focused')).toBeInTheDocument();

    const summarizeTab = () => screen.getByText('[Summarize]');
    const htmlTab = () => screen.getByText('[HTML]');

    // Default active tab is [Summarize]
    expect(summarizeTab()).toHaveClass('active');
    expect(htmlTab()).not.toHaveClass('active');

    // ] switches to [HTML]
    await user.keyboard('{]}');
    await waitFor(() => expect(htmlTab()).toHaveClass('active'));
    await waitFor(() => expect(summarizeTab()).not.toHaveClass('active'));

    // [ switches back to [Summarize]
    await user.keyboard('{[}');
    await waitFor(() => expect(summarizeTab()).toHaveClass('active'));
    await waitFor(() => expect(htmlTab()).not.toHaveClass('active'));
  });

  // 6) Search filtering and selection reset
  it('should filter bookmarks and reset selection to first result', async () => {
    render(<BookmarkTelescope />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('live-grep');

    // Ensure bookmarks loaded
    await screen.findByText('Alpha');

    // Move to bookmarkList and select Beta to make selection non-zero
    // (Already on bookmarkList after open)
    await user.keyboard('j');
    const getSelectedTitle = () => {
      const selected = document.querySelector('li.telescope-item.selected .telescope-item-title');
      return selected?.textContent;
    };
    await waitFor(() => expect(getSelectedTitle()).toBe('Beta'));

    // Move to liveGrep and enter insert
    await user.keyboard('l');
    await user.keyboard('i');

    const input = document.querySelector('input.telescope-search') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    // Type query to filter to Gamma
    await user.type(input!, 'Gamma');

    // Filtered list should contain only Gamma and selection resets to first (Gamma)
    await waitFor(() => {
      const items = Array.from(document.querySelectorAll('ul.telescope-results-list li.telescope-item .telescope-item-title'));
      const titles = items.map((el) => el.textContent);
      expect(titles).toEqual(['Gamma']);
      expect(getSelectedTitle()).toBe('Gamma');
    });
  });

  // 7) Open bookmark
  it('should open selected bookmark on Enter and hide overlay', async () => {
    render(<BookmarkTelescope />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('live-grep');

    // Ensure bookmarks loaded and select Beta
    await screen.findByText('Alpha');
    await user.keyboard('j');

    // Press Enter to open
    await user.keyboard('{Enter}');

    // Assert an open-bookmark message with correct URL was sent
    await waitFor(() => {
      expect(openedMessages.some((m) => m.action === 'open-bookmark' && m.url === 'https://beta.example.com')).toBe(true);
    });

    // Overlay hides
    await waitFor(() => expect(screen.queryByTestId('live-grep')).not.toBeInTheDocument());
  });
});
