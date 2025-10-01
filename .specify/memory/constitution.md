<!-- Sync Impact Report
Version Change: 0.0.0 → 1.0.0 (Initial constitution creation)
Modified Principles: N/A (new creation)
Added Sections: All sections newly created
Removed Sections: None
Templates Requiring Updates:
✅ plan-template.md - Constitution check gates will reference these principles
✅ spec-template.md - Aligned with quality and testing requirements
✅ tasks-template.md - TDD and testing phases align with Principle III
Follow-up TODOs: Ratification date pending user confirmation
-->

# LazyBookmark Project Constitution

## Core Principles

### I. Code Quality First
Every code modification MUST pass ESLint validation and TypeScript compilation before being considered complete. No exceptions. Use `npm run lint` and `npm run compile` to validate all changes. Automatic fixes via `npm run lint:fix` are encouraged where available. Code quality is not negotiable - broken builds are unacceptable.

**Rationale**: High code quality prevents technical debt accumulation and ensures maintainability. TypeScript's type safety and ESLint's consistent formatting reduce bugs and improve developer experience.

### II. User Experience Consistency
The extension MUST maintain the LazyVim/LazyGit-inspired interface paradigm across all features. Every new UI component must follow the established dark theme, keyboard-centric navigation patterns, and leader palette command structure. Visual and interaction consistency is paramount for power users.

**Rationale**: Users rely on muscle memory and consistent patterns. Breaking the established UX paradigm damages the core value proposition of a vim-telescope-like bookmark manager.

### III. Test-First Development (NON-NEGOTIABLE)
All new features and bug fixes require tests written BEFORE implementation. The Red-Green-Refactor cycle is mandatory:
1. Write failing tests that specify expected behavior
2. Implement minimum code to pass tests
3. Refactor while keeping tests green
No pull request without accompanying tests. Integration tests required for cross-component features.

**Rationale**: TDD ensures features work as specified, prevents regressions, and serves as living documentation. The extension's complexity requires confidence in changes.

### IV. Cross-Browser Compatibility
All features MUST work identically on Chrome and Firefox. Use WXT framework's cross-browser APIs exclusively. Test on both browsers before considering any feature complete. Platform-specific code requires explicit justification and fallback behavior.

**Rationale**: Supporting multiple browsers expands user reach and forces better architectural decisions through abstraction.

### V. Performance Standards
Extension performance targets are non-negotiable:
- Leader palette must open within 100ms of keyboard shortcut
- Bookmark search must return results within 50ms for up to 10,000 bookmarks
- Preview pane must render within 200ms of selection
- Memory footprint must stay under 50MB during normal operation
Performance regression blocks releases.

**Rationale**: Performance directly impacts user productivity. Slow tools interrupt flow state and diminish the value of keyboard-driven interfaces.

### VI. Privacy and Security by Design
The extension MUST NOT:
- Store user data outside the browser's secure storage APIs
- Transmit bookmark data without explicit user consent
- Execute remote code or eval() statements
- Request permissions beyond documented requirements
All AI features must be opt-in with clear data usage disclosure.

**Rationale**: Bookmarks contain sensitive information. Trust is earned through transparent, minimal data handling and respect for user privacy.

### VII. Incremental Enhancement
Start with the simplest working implementation, then enhance. Features must be:
- Independently toggleable via settings
- Backward compatible with existing bookmarks
- Gracefully degradable when dependencies fail
- Released behind feature flags when experimental
YAGNI (You Aren't Gonna Need It) principle applies until proven otherwise.

**Rationale**: Complexity kills maintainability. Simple foundations enable sustainable growth and easier debugging.

## Development Standards

### Code Review Requirements
- Every PR requires at least one review before merge
- All CI checks (lint, compile, test) must pass
- Breaking changes require migration guide
- Performance benchmarks required for critical path changes

### Documentation Standards
- New features require updated README sections
- API changes need migration guides
- Complex logic requires inline documentation
- CHROME_KEYBOARD_SHORTCUT.md must be referenced for all keyboard work

### Release Process
- Semantic versioning strictly enforced
- Changelog updated for every release
- Chrome Web Store and Firefox Add-ons updates synchronized
- Breaking changes require major version bump

## Architecture Constraints

### Technology Stack (Locked)
- **Framework**: WXT (no migration without critical justification)
- **UI Library**: React 19+ with hooks only (no class components)
- **Language**: TypeScript with strict mode enabled
- **Build System**: WXT's Vite-based pipeline
- **State Management**: React hooks and context (no Redux unless proven necessary)

### Extension Architecture Rules
- Background scripts handle all cross-origin requests
- Content scripts remain minimal and performant
- Message passing must use typed interfaces
- React components must be functional with proper hook dependencies
- CSS modules or styled-components only (no global styles)

## Governance

The Constitution supersedes all development practices and team agreements.

### Amendment Process
1. Proposed changes require written justification with impact analysis
2. Breaking principle changes require team consensus
3. Version bump follows semantic versioning:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or section addition
   - PATCH: Clarification or wording improvements
4. All amended versions must update dependent templates

### Compliance Verification
- All PRs must reference constitution compliance in description
- Automated CI checks enforce linting and compilation rules
- Performance benchmarks run on every merge to main
- Quarterly constitution review to ensure relevance

### Runtime Guidance
Development teams should reference CLAUDE.md for AI-assisted development patterns and README.md for general project guidance. The constitution principles must be considered in all architectural decisions.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Pending user confirmation | **Last Amended**: 2025-01-02