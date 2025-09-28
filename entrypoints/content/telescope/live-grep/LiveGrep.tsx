import React, { useEffect, useRef } from 'react';

interface LiveGrepProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFocused: boolean;
  isInsertMode: boolean;
  totalCount: number;
  selectedCount: number;
}

const LiveGrep: React.FC<LiveGrepProps> = ({
  searchQuery,
  onSearchChange,
  isFocused,
  isInsertMode,
  totalCount,
  selectedCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && isInsertMode && inputRef.current) {
      inputRef.current.focus();
    } else if (!isInsertMode && inputRef.current) {
      inputRef.current.blur();
    }
  }, [isFocused, isInsertMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className={`telescope-search-section ${isFocused ? 'focused' : ''}`}>
      <span className="telescope-search-label">Live Grep</span>
      <div className="telescope-search-content">
        <div className="telescope-search-mode-indicator" role="status" aria-live="polite">
          {isInsertMode && isFocused ? '-- INSERT --' : ''}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="telescope-search"
          placeholder={
            isFocused && !isInsertMode ? 'Press "i" to enter insert mode' : ''
          }
          value={searchQuery}
          onChange={handleChange}
          readOnly={!isInsertMode}
        />
        <span className="telescope-search-counter" role="status" aria-live="polite" aria-label="Search results count">
          {totalCount > 0 ? `${selectedCount} / ${totalCount}` : '0 / 0'}
        </span>
      </div>
    </div>
  );
};

export default LiveGrep;
