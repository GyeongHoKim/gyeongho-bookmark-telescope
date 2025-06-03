import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Bookmark Telescope',
    description: 'Live grep through bookmarks with nvim-telescope like interface using Ctrl+Shift+P',
    version: '1.1.0',
    permissions: ['bookmarks', 'tabs', 'activeTab', 'scripting'],
    commands: {
      'open-telescope': {
        suggested_key: {
          default: 'Ctrl+Shift+P',
          mac: 'Command+Shift+P'
        },
        description: 'Open bookmark telescope'
      }
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content-scripts/content.js'],
        css: ['content-scripts/content.css']
      }
    ],
    action: {
      default_popup: 'popup.html',
      default_title: 'Bookmark Telescope Settings'
    }
  }
});