function App() {
  return (
    <div className="popup-container">
      <div className="header">
        <h3>Bookmark Telescope</h3>
        <p>Search through your bookmarks with nvim-telescope interface</p>
      </div>

      <div className="shortcut-section">
        <label className="shortcut-label">How to use:</label>
        <div className="shortcut-display">
          Press <kbd>Ctrl+Shift+L</kbd> (or <kbd>Cmd+Shift+L</kbd> on Mac) then{' '}
          <kbd>g</kbd>
        </div>
      </div>

      <div className="help-text">
        <p>
          Use the leader key <kbd>Ctrl+Shift+L</kbd> to open the command
          palette, then press <kbd>g</kbd> to search bookmarks.
        </p>
      </div>
    </div>
  );
}

export default App;
