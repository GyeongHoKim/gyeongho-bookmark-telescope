# Contributing to LazyBookmark

Thank you for your interest in contributing to LazyBookmark! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Getting Started

Before you begin:

- Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or higher recommended)
- Familiarize yourself with the [README.md](README.md) to understand the project's purpose and features
- Read the [CLAUDE.md](CLAUDE.md) for detailed architecture and development guidelines
- Check existing [issues](https://github.com/GyeongHoKim/gyeongho-bookmark-telescope/issues) and [pull requests](https://github.com/GyeongHoKim/gyeongho-bookmark-telescope/pulls) to avoid duplicate work

## Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/gyeongho-bookmark-telescope.git
   cd gyeongho-bookmark-telescope
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Mode**

   ```bash
   npm run dev          # For Chrome
   npm run dev:firefox  # For Firefox
   ```

4. **Load Extension in Browser**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `.output/chrome-mv3` directory
   - The extension will be installed and ready to use

5. **Enable AI Features (Optional)**
   - Chrome version 138 or later is required
   - Enable `chrome://flags/#summarization-api-for-gemini-nano`
   - See [README.md](README.md) for detailed prerequisites

## How to Contribute

### Types of Contributions We Welcome

- **Bug Fixes**: Fix issues reported in the issue tracker
- **Feature Development**: Implement features from our [roadmap](README.md#features)
- **Documentation**: Improve README, code comments, or create tutorials
- **Testing**: Add or improve unit/integration tests
- **UI/UX Improvements**: Enhance the user interface or experience
- **Performance Optimization**: Make the extension faster or more efficient

### Before You Start

1. **Check for existing work**: Search issues and PRs to ensure you're not duplicating effort
2. **Discuss major changes**: For significant features or architectural changes, open an issue first to discuss your approach
3. **Start small**: If you're new to the project, start with issues labeled `good first issue`

## Coding Standards

All code contributions must adhere to our quality standards:

### TypeScript and React

- Use TypeScript for all new code
- Follow React 19 best practices and functional component patterns
- Use modern React hooks (`useState`, `useEffect`, `useCallback`, etc.)
- Properly type all props, state, and function signatures

### Code Quality Requirements

**IMPORTANT**: All submissions must pass the following checks:

```bash
npm run compile      # TypeScript type checking
npm run lint         # ESLint validation
npm run test:run     # Run all tests
```

- **TypeScript**: All code must compile without errors
- **ESLint**: All code must pass linting (use `npm run lint:fix` for automatic fixes)
- **Tests**: All tests must pass, and new features should include tests
- **No console errors**: Check browser console for runtime errors

### ESLint Configuration

Our ESLint setup includes:

- TypeScript strict type checking
- React and React Hooks validation
- No unused variables (except those prefixed with `_`)
- Consistent code formatting

### Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code structure and patterns
- Use Prettier for code formatting: `npm run format`

### Keyboard Shortcuts

- **Always reference [CHROME_KEYBOARD_SHORTCUT.md](CHROME_KEYBOARD_SHORTCUT.md)** when working with keyboard shortcuts
- Verify shortcuts don't conflict with Chrome's default shortcuts
- Test compatibility across Windows/Linux and Mac platforms

## Testing Guidelines

### Running Tests

```bash
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage report
```

### Writing Tests

- Place test files in the `test/` directory
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies (Chrome APIs, fetch, etc.)
- Aim for meaningful test coverage, especially for critical features

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component Name', () => {
  it('should do something specific', () => {
    // Arrange
    const props = { /* ... */ };

    // Act
    render(<Component {...props} />);

    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Your Changes

- Write clear, concise commit messages
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
  ```
  feat: add semantic search feature
  fix: resolve bookmark deletion issue
  docs: update installation instructions
  test: add tests for telescope component
  refactor: simplify bookmark fetching logic
  ```

### 3. Test Your Changes

```bash
npm run compile       # Ensure TypeScript compiles
npm run lint          # Check for linting errors
npm run test:run      # Run all tests
```

### 4. Build and Test Extension

```bash
npm run build         # Build for production
```

Load the built extension in Chrome and verify:

- All features work as expected
- No console errors
- Extension doesn't conflict with other extensions
- Keyboard shortcuts work correctly

### 5. Submit Pull Request

- Push your branch to your fork
- Open a Pull Request against the `main` branch
- Fill out the PR template completely
- Link any related issues (e.g., "Fixes #123")
- Provide clear description of changes and testing performed

### PR Review Process

1. **Automated Checks**: Your PR must pass all automated checks (linting, tests, build)
2. **Code Review**: A maintainer will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

### What We Look For

- Clear, focused changes that solve one problem
- Properly formatted and linted code
- Adequate test coverage
- No breaking changes (or clearly documented if necessary)
- Updated documentation if applicable

## Issue Reporting

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check if the issue is already fixed in the latest version
- Gather relevant information (Chrome version, OS, error messages)

### Creating a Good Issue

Include the following information:

**For Bug Reports:**

- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Chrome version and OS
- Console errors (if any)
- Screenshots or GIFs (if applicable)

**For Feature Requests:**

- Clear description of the proposed feature
- Use cases and benefits
- Potential implementation approach (optional)
- Willingness to contribute (if applicable)

## Community

### Getting Help

- **Documentation**: Check [README.md](README.md) and [CLAUDE.md](CLAUDE.md)
- **Issues**: Search or create an issue for questions
- **Discussions**: Use GitHub Discussions for general questions

### Staying Updated

- Watch the repository for notifications
- Check the [Chrome Web Store listing](https://chromewebstore.google.com/detail/apapcobjnbpmndcpcedjhngmgocjancj) for updates

### Recognition

Contributors will be acknowledged in:

- The repository's contributor list
- Release notes for significant contributions

## Development Resources

### Key Files to Understand

- `entrypoints/background.ts` - Service worker handling commands and Chrome APIs
- `entrypoints/content/index.tsx` - Content script entry point
- `entrypoints/content/BookmarkTelescope.tsx` - Main telescope UI component
- `entrypoints/content/leader-palette/` - Leader palette implementation
- `wxt.config.ts` - Extension configuration
- `CLAUDE.md` - Comprehensive architecture documentation

### Useful Commands

```bash
npm run dev              # Development mode for Chrome
npm run dev:firefox      # Development mode for Firefox
npm run build            # Production build
npm run build:firefox    # Production build for Firefox
npm run zip              # Create Chrome Web Store package
npm run zip:firefox      # Create Firefox Add-ons package
npm run compile          # TypeScript type checking
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run test             # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run format           # Format code with Prettier
```

### Chrome Built-in AI APIs

When working with AI features:

- Search for the latest MDN documentation (APIs are in origin trial)
- Check model availability with `.availability()` before use
- Handle cases where AI features are unavailable gracefully

## License

By contributing to LazyBookmark, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to LazyBookmark! Your efforts help make bookmark management better for everyone.
