import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import BookmarkManager from '../entrypoints/content/manager/components/BookmarkManager';

interface TestBookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children?: TestBookmarkTreeNode[];
}

type GetBookmarkTreeMessage = { action: 'get-bookmark-tree' };
type OpenBookmarkMessage = { action: 'open-bookmark'; url: string };
type CreateFolderMessage = { action: 'create-bookmark-folder'; parentId: string; title: string };
type AddBookmarkMessage = { action: 'add-bookmark'; parentId: string; title: string; url: string };
type UpdateBookmarkMessage = { action: 'update-bookmark'; id: string; title: string };
type DeleteBookmarkMessage = { action: 'delete-bookmark'; id: string };
type TestMessage =
  | GetBookmarkTreeMessage
  | OpenBookmarkMessage
  | CreateFolderMessage
  | AddBookmarkMessage
  | UpdateBookmarkMessage
  | DeleteBookmarkMessage;

describe('BookmarkManager essential behaviors', () => {
  let currentTree: TestBookmarkTreeNode[];
  let openedMessages: Array<OpenBookmarkMessage>;

  const triggerToggle = () => {
    act(() => {
      const event = new CustomEvent('bookmark-manager-toggle');
      window.dispatchEvent(event);
    });
  };

  function findNodeById(
    id: string,
    nodes: TestBookmarkTreeNode[],
    parent: TestBookmarkTreeNode | null = null,
  ): { node: TestBookmarkTreeNode | null; parent: TestBookmarkTreeNode | null } {
    for (const node of nodes) {
      if (node.id === id) return { node, parent };
      if (node.children) {
        const found = findNodeById(id, node.children, node);
        if (found.node) return found;
      }
    }
    return { node: null, parent: null };
  }

  function removeNodeById(id: string, nodes: TestBookmarkTreeNode[]): boolean {
    const index = nodes.findIndex((n) => n.id === id);
    if (index >= 0) {
      nodes.splice(index, 1);
      return true;
    }
    for (const node of nodes) {
      if (node.children && removeNodeById(id, node.children)) return true;
    }
    return false;
  }

  function addChild(parentId: string, child: TestBookmarkTreeNode) {
    const { node: parentNode } = findNodeById(parentId, currentTree);
    if (!parentNode) return;
    if (!parentNode.children) parentNode.children = [];
    parentNode.children.push(child);
  }

  function updateTitle(id: string, title: string) {
    const { node } = findNodeById(id, currentTree);
    if (node) node.title = title;
  }

  beforeEach(() => {
    fakeBrowser.reset();
    openedMessages = [];
    currentTree = [
      {
        id: 'root1',
        title: 'Bookmarks Bar',
        children: [
          { id: 'folder1', title: 'Dev', parentId: 'root1', children: [
            { id: 'b1', title: 'Alpha', url: 'https://alpha.example.com', parentId: 'folder1' },
          ] },
          { id: 'b2', title: 'Beta', url: 'https://beta.example.com', parentId: 'root1' },
        ],
      },
      {
        id: 'root2',
        title: 'Other Bookmarks',
        children: [],
      },
    ];

    browser.runtime.onMessage.addListener((message: TestMessage) => {
      if (message.action === 'get-bookmark-tree') {
        return Promise.resolve({ tree: currentTree });
      }
      if (message.action === 'open-bookmark') {
        openedMessages.push(message);
        return Promise.resolve({ success: true });
      }
      if (message.action === 'create-bookmark-folder') {
        const { parentId, title } = message;
        const newId = `f_${Math.random().toString(36).slice(2, 8)}`;
        addChild(parentId, { id: newId, title, parentId, children: [] });
        return Promise.resolve({ success: true });
      }
      if (message.action === 'add-bookmark') {
        const { parentId, title, url } = message;
        const newId = `b_${Math.random().toString(36).slice(2, 8)}`;
        addChild(parentId, { id: newId, title, url, parentId });
        return Promise.resolve({ success: true });
      }
      if (message.action === 'update-bookmark') {
        const { id, title } = message;
        updateTitle(id, title);
        return Promise.resolve({ success: true });
      }
      if (message.action === 'delete-bookmark') {
        const { id } = message;
        removeNodeById(id, currentTree);
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });
  });

  // 1) Visibility
  it('toggles visibility via custom event and hides on Escape', async () => {
    render(<BookmarkManager />);

    expect(screen.queryByTestId('bookmark-manager')).not.toBeInTheDocument();

    triggerToggle();
    expect(await screen.findByTestId('bookmark-manager')).toBeInTheDocument();

    triggerToggle();
    await waitFor(() => expect(screen.queryByTestId('bookmark-manager')).not.toBeInTheDocument());

    triggerToggle();
    expect(await screen.findByTestId('bookmark-manager')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('bookmark-manager')).not.toBeInTheDocument());
  });

  // 2) Expand/collapse folders with h/l and navigate j/k
  it('navigates with j/k and toggles folder expand/collapse with h/l', async () => {
    render(<BookmarkManager />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('bookmark-manager');

    // Wait until Beta (root child) is visible; Alpha (inside Dev) is hidden initially
    await screen.findByText('Beta');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

    // Select Dev (folder1) and expand with l
    await user.keyboard('j'); // -> Dev
    expect(screen.getByText('Dev').closest('.bookmark-manager-item')).toHaveClass('selected');
    await user.keyboard('l');
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());

    // Collapse with h -> Alpha disappears
    await user.keyboard('h');
    await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
  });

  // 3) Open selected bookmark on Enter
  it('opens selected bookmark on Enter and hides overlay', async () => {
    render(<BookmarkManager />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('bookmark-manager');
    await screen.findByText('Beta');

    // Select Beta (j twice) and press Enter
    await user.keyboard('j'); // Dev
    await user.keyboard('j'); // Beta
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(openedMessages.some((m) => m.action === 'open-bookmark' && m.url === 'https://beta.example.com')).toBe(true);
    });
    await waitFor(() => expect(screen.queryByTestId('bookmark-manager')).not.toBeInTheDocument());
  });

  // 4) Add folder, rename, and delete flows
  it('supports add folder (A), rename (r), and delete (d then y)', async () => {
    render(<BookmarkManager />);
    const user = userEvent.setup();

    triggerToggle();
    await screen.findByTestId('bookmark-manager');

    // Select Other Bookmarks (root2): j x3
    await user.keyboard('j'); // Dev
    await user.keyboard('j'); // Beta
    await user.keyboard('j'); // Other Bookmarks
    expect(screen.getByText('Other Bookmarks').closest('.bookmark-manager-item')).toHaveClass('selected');

    // Add folder
    await user.keyboard('A');
    const input = await screen.findByPlaceholderText('Folder name...');
    await user.type(input, 'NewFolder');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('NewFolder')).toBeInTheDocument());

    // Navigate back to Beta and rename to Beta2
    // Move selection up with k twice to Beta
    await user.keyboard('k'); // NewFolder or last child -> ensure move back up
    await user.keyboard('k'); // Beta
    // Enter rename
    await user.keyboard('r');
    const renameInput = await screen.findByRole('textbox');
    await user.clear(renameInput);
    await user.type(renameInput, 'Beta2');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('Beta2')).toBeInTheDocument());

    // Delete Beta2
    await user.keyboard('d');
    // Confirm prompt visible
    await screen.findByText(/Delete/);
    await user.keyboard('y');
    await waitFor(() => expect(screen.queryByText('Beta2')).not.toBeInTheDocument());
  });
});
