<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.0.0 → 1.1.0

  Modified Principles:
  - Added: V. Chrome Built-in AI API Standards (new principle)

  Added Sections:
  - Chrome Built-in AI API Standards (Principle V) - Mandatory research requirements for Summarizer API, Prompt API, Writer API

  Removed Sections: None

  Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section requires update with new principle V
  ✅ spec-template.md - Verified alignment with principles
  ✅ tasks-template.md - Constitution Compliance Reminders section requires update
  ⚠ CLAUDE.md - Already contains Chrome Built-in AI guidance, constitution adds formal principle

  Follow-up TODOs: None
-->

# LazyBookmark Constitution

## Core Principles

### I. Code Quality & Validation (NON-NEGOTIABLE)

**All code modifications MUST pass both ESLint validation and TypeScript compilation before being considered complete.**

Requirements:
- Run `npm run compile` after every code modification to ensure TypeScript type safety
- Run `npm run lint` after every code modification to ensure code quality standards
- Use `npm run lint:fix` for automatic fixes where possible
- Never ignore or disable ESLint rules without explicit justification
- Fix all errors and warnings before committing code
- Zero tolerance policy: No commits with linting errors or TypeScript compilation errors

**Rationale**: Type safety and code quality standards prevent runtime errors, improve maintainability, and ensure consistent code style across the codebase. Automated validation catches issues early in the development cycle.

### II. Testing Standards (NON-NEGOTIABLE)

**Unit Tests MUST target pure TypeScript business logic; avoid unit testing React components or custom hooks.**
**All React components MUST be tested with Component(integration) tests, and Snapshot tests using `@testing-library/react`**

Requirements:
- All tests MUST be written in the `test/` folder using `@testing-library/react` and Vitest
- Unit tests MUST focus exclusively on pure TypeScript classes and functions
- Do NOT write unit tests for custom hooks or React components, React components should be handled by Component(integration) tests and Snapshot tests using `@testing-library/react`
- Component(integration) tests may cover the interaction between business logic and UI
- Follow TDD where appropriate: write tests, ensure they fail, then implement

**Rationale**: Unit Testing pure business logic provides stable, reliable tests that don't break with UI changes. Component(integration) tests and Snapshot tests using `@testing-library/react` ensure the React components are working as expected.

### III. Architecture & Separation of Concerns (NON-NEGOTIABLE)

**React components MUST NOT contain business logic. Business logic MUST be implemented as pure TypeScript classes or functions, wrapped in custom hooks, then imported by components.**

Requirements:
- Business logic MUST be implemented as pure TypeScript classes or functions
- Custom hooks MUST wrap pure TypeScript business logic to provide React integration
- React components MUST only handle presentation and user interaction
- Components import and use custom hooks, not raw business logic
- This three-layer architecture (pure logic → custom hook → component) is mandatory
- State machines and complex state logic belong in pure TypeScript (e.g., XState machines)

**Rationale**: Separating business logic from presentation enables better testability, reusability, and maintainability. Pure TypeScript logic can be tested independently, reused across components, and modified without affecting the UI. This architecture makes the codebase more maintainable long-term.

### IV. LazySth Style Consistency

**UI/UX MUST maintain consistency with LazySth-inspired design: dark theme, keyboard-centric navigation, and minimal visual noise.**

Requirements:
- Dark theme styling for all UI components
- Keyboard shortcuts MUST follow vim-like conventions where applicable (j/k navigation, etc.)
- Leader palette system (Cmd/Ctrl+Shift+L) as primary interface
- Minimize mouse interaction requirements
- Console-style, terminal-inspired aesthetics
- Visual consistency with existing telescope and leader palette components
- Reference `CHROME_KEYBOARD_SHORTCUT.md` when implementing new keyboard shortcuts
- Verify shortcuts don't conflict with Chrome defaults across Windows/Linux and Mac

**Rationale**: LazySth styling and keyboard-centric design are core to the product identity. Consistency ensures a cohesive user experience for keyboard power users familiar with LazyVim/LazyGit conventions.

### V. Chrome Built-in AI API Standards (NON-NEGOTIABLE)

**When developing features using Chrome Built-in AI APIs (Summarizer API, Prompt API, Writer API), MUST verify latest API documentation before implementation due to origin trial program status.**

Requirements:
- MUST use Context7 MCP tools to query MDN documentation for Chrome Built-in AI APIs before implementation
- MUST use Web Search to verify latest API changes, availability methods, and usage patterns
- MUST verify model availability using asynchronous availability methods:
  - Summarizer API: `Summarizer.availability()`
  - Prompt API: `LanguageModel.availability()`
  - Writer API: `Writer.availability()`
- MUST handle origin trial token requirements and feature detection
- MUST implement proper fallback mechanisms when APIs are unavailable
- MUST document API version and origin trial status in code comments
- AI agents have outdated information about these APIs - ALWAYS verify current documentation

**Rationale**: Chrome Built-in AI APIs are in origin trial program and subject to frequent changes. AI agents may have outdated information about API signatures, availability methods, and usage patterns. Verifying current documentation prevents implementation errors and ensures compatibility with the latest API versions. These APIs are critical to LazyBookmark's core value proposition (summarization, semantic features) and must be implemented correctly.

## Development Workflow

### Code Modification Procedure

Every code change MUST follow this workflow:

1. **Implement** changes to code
2. **Validate** with `npm run compile` (TypeScript type checking)
3. **Lint** with `npm run lint` (code quality check)
4. **Fix** all errors and warnings (use `npm run lint:fix` for auto-fixes)
5. **Test** business logic changes with unit tests in `test/` folder
6. **Commit** only after all validations pass

### Architecture Requirements

When adding new functionality:

1. **Create** pure TypeScript class/function for business logic
2. **Test** the pure TypeScript logic with unit tests
3. **Wrap** the logic in a custom hook for React integration
4. **Use** the custom hook in React components
5. **Avoid** putting business logic directly in components

### Testing Requirements

When writing tests:

1. **Target** pure TypeScript business logic only
2. **Place** tests in `test/` folder
3. **Use** `@testing-library/react` and Vitest
4. **Avoid** testing custom hooks or React components with unit tests
5. **Focus** on behavior and outcomes, not implementation details

### Chrome Built-in AI Development Workflow

When implementing Chrome Built-in AI features(Summarizer API, Prompt API, Writer API, etc.):

1. **Research** current API documentation using Context7 MCP tools (MDN)
2. **Verify** latest changes using Web Search
3. **Document** API version and origin trial status in code
4. **Implement** with proper availability checks
5. **Add** fallback mechanisms for when APIs are unavailable
6. **Test** both available and unavailable scenarios

## Quality Gates

Before any pull request or commit, the following MUST be verified:

- [ ] `npm run compile` passes with zero errors
- [ ] `npm run lint` passes with zero errors/warnings
- [ ] All unit tests pass (`npm run test`)
- [ ] Business logic is in pure TypeScript classes/functions
- [ ] Custom hooks wrap business logic appropriately
- [ ] React components contain no business logic
- [ ] LazySth styling consistency maintained
- [ ] Keyboard shortcuts documented and conflict-free
- [ ] Chrome Built-in AI APIs verified against current documentation (if applicable)
- [ ] Availability checks implemented for all AI APIs used
- [ ] Fallback mechanisms tested for unavailable AI features

## Governance

### Amendment Procedure

This constitution may be amended through the following process:

1. Proposed changes MUST be documented with rationale
2. Changes MUST be reviewed against existing codebase
3. Version MUST be incremented following semantic versioning:
   - **MAJOR**: Backward-incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
4. All dependent templates MUST be updated for consistency
5. A Sync Impact Report MUST be generated documenting changes

### Compliance

- All pull requests MUST verify compliance with these principles
- Code reviews MUST enforce architectural separation (pure logic → hook → component)
- Complexity MUST be justified against simplicity principle
- Violations require explicit justification and approval
- Template files (`plan-template.md`, `spec-template.md`, `tasks-template.md`) MUST reference this constitution

### Living Document

This constitution is a living document that evolves with the project. Updates MUST:

- Maintain backward compatibility where possible
- Document breaking changes clearly
- Update all dependent artifacts synchronously
- Preserve the core principles (I-V) unless critical justification provided

**Version**: 1.1.0 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-18
