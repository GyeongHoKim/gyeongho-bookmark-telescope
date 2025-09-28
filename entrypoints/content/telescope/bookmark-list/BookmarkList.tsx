import React, { useEffect, useRef } from 'react';
import type { Bookmark } from '../models/telescopeMachine';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  selectedIndex: number;
  onSelectBookmark: (index: number) => void;
  onOpenBookmark: () => void;
  isFocused: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  selectedIndex,
  onSelectBookmark,
  onOpenBookmark,
  isFocused,
}) => {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemRefs.current[selectedIndex] && isFocused) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      itemRefs.current[selectedIndex]?.focus();
    }
  }, [selectedIndex, bookmarks, isFocused]);

  const handleItemClick = (index: number) => {
    onSelectBookmark(index);
  };

  const handleItemDoubleClick = () => {
    onOpenBookmark();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpenBookmark();
    }
  };

  const totalCount = bookmarks.length;
  const selectedCount = totalCount > 0 ? selectedIndex + 1 : 0;

  return (
    <div
      className={`telescope-section telescope-results-section ${isFocused ? 'focused' : ''}`}
    >
      <div className="telescope-section-header">
        <span className="telescope-section-label">Results</span>
        <span className="telescope-section-counter" role="status" aria-live="polite" aria-label="Results count">
          {totalCount > 0 ? `${selectedCount} / ${totalCount}` : '0 / 0'}
        </span>
      </div>
      <div className="telescope-results" ref={containerRef}>
        {bookmarks.length === 0 ? (
          <div className="telescope-loading" role="status" aria-live="polite">No bookmarks found</div>
        ) : (
          <ul className="telescope-results-list" role="listbox" aria-label="Bookmark results">
            {bookmarks.map((bookmark, index) => (
              <li
                key={bookmark.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`telescope-item ${index === selectedIndex ? 'selected' : ''}`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleItemClick(index)}
                onDoubleClick={handleItemDoubleClick}
                onKeyDown={handleKeyDown}
                tabIndex={isFocused && index === selectedIndex ? 0 : -1}
              >
                <span className="telescope-item-path">{bookmark.url}</span>
                <span className="telescope-item-title">{bookmark.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BookmarkList;
