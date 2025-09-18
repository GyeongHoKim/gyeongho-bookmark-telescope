# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with WXT
- `npm run dev:firefox` - Start development mode for Firefox
- `npm run build` - Build extension for production
- `npm run build:firefox` - Build extension for Firefox
- `npm run zip` - Create zip file for Chrome Web Store
- `npm run zip:firefox` - Create zip file for Firefox Add-ons
- `npm run compile` - TypeScript type checking without emitting files
- `npm run lint` - Run ESLint to check code quality and style
- `npm run lint:fix` - Run ESLint with automatic fixing
- `npm install` - Install dependencies and run WXT prepare

## Architecture Overview

This is a Chrome/Firefox browser extension built with **WXT framework** and **React** that provides a nvim-telescope-like interface for searching bookmarks.

### Key Components

**WXT Framework Structure:**
- `entrypoints/background.ts` - Service worker handling keyboard commands, bookmark API, and content fetching
- `entrypoints/content/index.tsx` - Content script entry point that mounts React app
- `entrypoints/content/BookmarkTelescope.tsx` - Main React component with telescope UI
- `entrypoints/popup/` - Extension popup (settings interface)
- `wxt.config.ts` - WXT configuration with React module and manifest settings

**Extension Architecture:**
- **Background Script**: Fetches bookmarks via Chrome API, handles cross-origin requests for page previews
- **Content Script**: Injects React telescope UI into any webpage, communicates with background via message passing
- **React Component**: Implements live search with regex support, keyboard navigation, and HTML preview pane

**Key Features:**
- Live search through bookmarks with regex support
- Keyboard navigation (↑↓ arrows, Enter to open, Esc to close)
- HTML preview fetching for selected bookmarks
- nvim-telescope inspired dark theme
- Cross-browser support (Chrome/Firefox)

**Communication Flow:**
1. Background script receives keyboard command
2. Sends message to content script to toggle telescope
3. Content script shows/hides React component
4. React component requests bookmarks from background
5. Background fetches from Chrome bookmarks API
6. React component filters and displays results with live preview

**Permissions Required:**
- `bookmarks` - Access browser bookmarks
- `tabs` - Query active tab and create new tabs
- `activeTab` - Send messages to content scripts
- `scripting` - Inject content scripts dynamically

## File Structure

- `entrypoints/` - WXT entry points (background, content, popup)
- `wxt.config.ts` - Extension configuration and manifest
- `tsconfig.json` - TypeScript configuration extending WXT defaults
- Package uses React 19 with TypeScript and WXT dev modules

## Testing & Debugging

The extension can be loaded in Chrome developer mode by building and loading the `dist/` directory. Use browser developer tools to debug:
- Background script console: chrome://extensions/ → service worker link
- Content script console: Page inspect → Console tab
- Extension includes detailed console logging for debugging message flow

## Code Quality & Standards

**ESLint Configuration:**
- ESLint is configured with TypeScript, React, and React Hooks support
- Configuration includes recommended rules for code quality and consistency
- React 19 JSX runtime support enabled
- Automatic React version detection

**Linting Rules:**
- TypeScript strict type checking enabled
- React Hook dependency validation
- No unused variables (except those starting with `_`)
- Consistent code formatting and style

**IMPORTANT - Code Modification Requirements:**
- **ALL code changes MUST pass ESLint validation**
- **ALWAYS run `npm run lint` after making any code modifications**
- **Fix all ESLint errors and warnings before considering changes complete**
- Use `npm run lint:fix` for automatic fixes where possible
- Never ignore or disable ESLint rules without explicit justification

**Keyboard Shortcut Development:**
- **ALWAYS reference `CHROME_KEYBOARD_SHORTCUT.md` when working with keyboard shortcuts**
- **Check for conflicts with Chrome's default keyboard shortcuts before implementing new ones**
- **Verify shortcut compatibility across Windows/Linux and Mac platforms**

## Development Notes

- Uses WXT's `defineBackground()` and `defineContentScript()` wrappers
- React components use modern hooks and functional patterns
- Message passing between background and content scripts for bookmark data
- Cross-origin fetching handled in background script due to content script limitations
- CSS uses telescope-inspired styling with dark theme
- TypeScript interfaces defined for all data structures (BookmarkNode, Bookmark)
- React useCallback hooks properly configured with correct dependencies
