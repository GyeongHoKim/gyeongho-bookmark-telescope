import { useEffect, useState } from 'react';

interface Command {
  name?: string;
  description?: string;
  shortcut?: string;
}

function App() {
  const [currentShortcut, setCurrentShortcut] = useState<string>('Ctrl+Shift+P');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current shortcut from Chrome
    if (browser?.commands?.getAll) {
      browser.commands.getAll().then((commands: Command[]) => {
        const telescopeCommand = commands.find(cmd => cmd.name === 'open-telescope');
        if (telescopeCommand?.shortcut) {
          setCurrentShortcut(telescopeCommand.shortcut);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const openShortcutSettings = () => {
    browser.tabs.create({
      url: 'chrome://extensions/shortcuts'
    });
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h3>Bookmark Telescope</h3>
        <p>Search through your bookmarks with nvim-telescope interface</p>
      </div>

      <div className="shortcut-section">
        <label className="shortcut-label">Current Shortcut:</label>
        <div className="shortcut-display">
          {isLoading ? 'Loading...' : currentShortcut}
        </div>
      </div>

      <div className="buttons">
        <button 
          className="secondary-button"
          onClick={openShortcutSettings}
          title="Open Chrome shortcuts settings"
        >
          Customize Shortcut
        </button>
      </div>

      <div className="help-text">
        <p>
          customize the keyboard shortcut in Chrome settings.
        </p>
      </div>
    </div>
  );
}

export default App;