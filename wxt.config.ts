import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  zip: {
    artifactTemplate: 'bookmark-telescope-{{browser}}.zip'
  },
  manifest: {
    name: 'Bookmark Telescope',
    description: 'Live grep through bookmarks with nvim-telescope like interface using leader key',
    version: '1.1.0',
    permissions: ['bookmarks', 'tabs', 'activeTab', 'scripting'],
    commands: {
      'open-leader-palette': {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L'
        },
        description: 'Open leader palette'
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
