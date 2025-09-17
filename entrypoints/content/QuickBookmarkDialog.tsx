import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface BookmarkFolder {
  id: string;
  title: string;
  path: string;
}


const DEFAULT_MESSAGE_TIMEOUT_MS = 1800;

const QuickBookmarkDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [folderFilter, setFolderFilter] = useState('');
  const [selectedFolderIndex, setSelectedFolderIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const messageTimerRef = useRef<number | null>(null);

  const filteredFolders = useMemo(() => {
    const q = folderFilter.trim().toLowerCase();
    if (q.length === 0) {
      return folders;
    }
    return folders.filter((f) => f.title.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [folders, folderFilter]);

  const setToast = useCallback((text: string) => {
    setMessage(text);
    if (typeof window !== 'undefined') {
      if (messageTimerRef.current !== null) {
        window.clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = window.setTimeout(() => {
        setMessage('');
        messageTimerRef.current = null;
      }, DEFAULT_MESSAGE_TIMEOUT_MS);
    }
  }, []);

  const pickDefaultFolderIndex = useCallback((list: BookmarkFolder[]) => {
    let idx = 0;
    for (let i = 0; i < list.length; i += 1) {
      const label = list[i].title.toLowerCase();
      if (label.includes('bookmarks bar') || label.includes('bookmarks toolbar')) {
        idx = i;
        break;
      }
    }
    return idx;
  }, []);

  const openDialog = useCallback((initialTitle: string, initialUrl: string) => {
    setTitle(initialTitle);
    setUrl(initialUrl);
    setFolderFilter('');
    setIsOpen(true);

    browser.runtime.sendMessage({ action: 'get-bookmark-folders' }, (response) => {
      if (response && Array.isArray(response.folders)) {
        const list: BookmarkFolder[] = response.folders;
        setFolders(list);
        const defaultIndex = pickDefaultFolderIndex(list);
        setSelectedFolderIndex(defaultIndex);
      } else if (response && response.error) {
        setFolders([]);
        setSelectedFolderIndex(0);
        setToast(`Failed to load folders: ${response.error}`);
      }
    });

    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  }, [pickDefaultFolderIndex, setToast]);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setTitle('');
    setUrl('');
    setFolderFilter('');
    setMessage('');
  }, []);

  const createBookmark = useCallback(() => {
    if (!isOpen || isCreating) {
      return;
    }
    if (title.trim().length === 0 || url.trim().length === 0) {
      setToast('Title and URL are required');
      return;
    }
    if (filteredFolders.length === 0) {
      setToast('No folder selected');
      return;
    }
    const folder = filteredFolders[Math.min(selectedFolderIndex, filteredFolders.length - 1)];
    setIsCreating(true);
    browser.runtime.sendMessage(
      { action: 'create-bookmark', title, url, parentId: folder.id },
      (response) => {
        setIsCreating(false);
        if (response && response.success) {
          setToast('Bookmark created');
          closeDialog();
        } else if (response && response.error) {
          setToast(`Failed: ${response.error}`);
        } else {
          setToast('Failed to create bookmark');
        }
      }
    );
  }, [closeDialog, filteredFolders, isCreating, isOpen, selectedFolderIndex, setToast, title, url]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      createBookmark();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredFolders.length === 0) {
        return;
      }
      setSelectedFolderIndex((prev) => (prev + 1) % filteredFolders.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredFolders.length === 0) {
        return;
      }
      setSelectedFolderIndex((prev) => (prev - 1 + filteredFolders.length) % filteredFolders.length);
    }
  }, [closeDialog, createBookmark, filteredFolders.length, isOpen]);

  const onRuntimeMessage = useCallback((message: { action?: string; title?: string; url?: string }) => {
    if (message && message.action === 'open-quick-bookmark') {
      const nextTitle = typeof message.title === 'string' ? message.title : '';
      const nextUrl = typeof message.url === 'string' ? message.url : '';
      openDialog(nextTitle, nextUrl);
    }
  }, [openDialog]);

  useEffect(() => {
    const listener = (message: { action?: string; title?: string; url?: string }) => onRuntimeMessage(message);
    browser.runtime.onMessage.addListener(listener);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown, onRuntimeMessage]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="quick-bookmark-overlay" ref={dialogRef}>
      <div className="quick-dialog">
        <div className="quick-title">Quick Bookmark</div>
        <div className="quick-row">
          <label className="quick-label">Title</label>
          <input
            ref={titleInputRef}
            className="quick-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bookmark title"
          />
        </div>
        <div className="quick-row">
          <label className="quick-label">URL</label>
          <input
            className="quick-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="quick-row">
          <label className="quick-label">Folder</label>
          <input
            className="quick-input"
            type="text"
            value={folderFilter}
            onChange={(e) => {
              setFolderFilter(e.target.value);
              setSelectedFolderIndex(0);
            }}
            placeholder="Filter folders..."
          />
        </div>
        <div className="quick-select-list">
          {filteredFolders.length === 0 ? (
            <div className="quick-empty">No folders</div>
          ) : (
            filteredFolders.map((f, i) => (
              <div
                key={f.id}
                role="button"
                tabIndex={0}
                className={`quick-select-item ${i === selectedFolderIndex ? 'selected' : ''}`}
                onClick={() => setSelectedFolderIndex(i)}
                onDoubleClick={createBookmark}
              >
                <div className="quick-item-title">{f.title}</div>
                <div className="quick-item-path">{f.path}</div>
              </div>
            ))
          )}
        </div>
        <div className="quick-actions">
          <button className="quick-btn secondary" onClick={closeDialog} disabled={isCreating}>Cancel (Esc)</button>
          <button className="quick-btn primary" onClick={createBookmark} disabled={isCreating}>Create (Enter)</button>
        </div>
        {message && <div className="quick-message">{message}</div>}
      </div>
    </div>
  );
};

export default QuickBookmarkDialog;

