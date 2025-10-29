# Security Policy

## Overview

LazyBookmark is a browser extension that prioritizes user privacy and security. This document outlines our security practices and how to report security vulnerabilities.

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          | Notes                 |
| ------- | ------------------ | --------------------- |
| 2.x.x   | :white_check_mark: | Latest stable release |
| 2.0.x   | :white_check_mark: | Security fixes only   |
| < 2.0   | :x:                | No longer supported   |

We recommend always using the latest version available on the [Chrome Web Store](https://chromewebstore.google.com/detail/apapcobjnbpmndcpcedjhngmgocjancj).

## Security Practices

### Data Privacy

LazyBookmark is designed with privacy in mind:

- **No Data Collection**: We do not collect, store, or transmit any personal data
- **Local Processing**: All operations run entirely locally in your browser
- **No External Servers**: No data is sent to external servers or third parties
- **Minimal Permissions**: We request only the permissions necessary for core functionality

### Permissions Used

Our extension requires the following Chrome permissions:

- `bookmarks` - To read and manage your bookmarks
- `tabs` - To access tab information for bookmark creation
- `activeTab` - To interact with the currently active tab
- `storage` - To store extension settings locally

### AI Features Security

When using Chrome Built-in AI features:

- **On-Device Processing**: AI summarization runs locally using Chrome's built-in Gemini Nano model
- **No Cloud Transmission**: Your bookmark content is not sent to external AI services
- **Optional Feature**: AI features can be disabled if you prefer not to use them

### Content Fetching

When previewing bookmarks:

- We fetch page content (HTML) only when you explicitly open the preview pane
- Content is processed locally and never stored permanently
- Fetching respects CORS policies and content security policies

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate responsible disclosure from the security community.

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities through one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Navigate to the [Security Advisories](https://github.com/GyeongHoKim/gyeongho-bookmark-telescope/security/advisories) page
   - Click "Report a vulnerability"
   - Fill out the advisory form with details

2. **Email**
   - Send details to: rlarudgh2017@gmail.com
   - Use subject line: `[SECURITY] Brief description of issue`
   - Include "SECURITY" in the subject to ensure priority handling

### What to Include

Please provide the following information to help us assess and address the vulnerability:

- **Type of vulnerability** (e.g., XSS, privilege escalation, data exposure)
- **Affected version(s)** of the extension
- **Step-by-step instructions** to reproduce the issue
- **Proof of concept** or exploit code (if applicable)
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

### What to Expect

When you report a vulnerability, you can expect:

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will assess the vulnerability and determine its severity within 5 business days
3. **Updates**: We will keep you informed of our progress throughout the resolution process
4. **Resolution**: We will work to address critical vulnerabilities as quickly as possible
5. **Credit**: With your permission, we will credit you in the security advisory and release notes

### Response Timeline

- **Critical vulnerabilities**: Patch within 7 days
- **High severity**: Patch within 14 days
- **Medium severity**: Patch within 30 days
- **Low severity**: Included in next regular release

Timelines may vary depending on the complexity of the fix.

## Disclosure Policy

We follow a **coordinated disclosure** process:

1. You report the vulnerability privately
2. We work on a fix and keep you updated
3. We release a patched version
4. We publish a security advisory
5. You may publicly disclose the vulnerability after the advisory is published

Please allow us adequate time to address the issue before any public disclosure.

## Security Update Process

When we release a security update:

1. We publish a new version to the Chrome Web Store
2. We create a GitHub Security Advisory with details
3. We update the [CHANGELOG](https://github.com/GyeongHoKim/gyeongho-bookmark-telescope/releases) with security fixes
4. Chrome automatically updates the extension for most users within 24-48 hours

### Checking Your Version

To verify you have the latest secure version:

1. Visit `chrome://extensions/`
2. Find "LazyBookmark" in the list
3. Check the version number
4. Click "Update" to force an update check if needed

## Security Best Practices for Users

To maximize your security while using LazyBookmark:

- **Keep Chrome Updated**: Use the latest version of Chrome for security patches
- **Review Permissions**: Understand what permissions the extension requests
- **Report Suspicious Behavior**: If you notice anything unusual, report it immediately
- **Use Official Sources**: Only install from the [Chrome Web Store](https://chromewebstore.google.com/detail/apapcobjnbpmndcpcedjhngmgocjancj)
- **Check Version**: Ensure you're running a supported version

## Scope

### In Scope

Security issues within the extension's code, including:

- Cross-site scripting (XSS) vulnerabilities
- Content security policy bypasses
- Privilege escalation
- Data exposure or leakage
- Authentication/authorization issues
- Dependency vulnerabilities

### Out of Scope

The following are generally out of scope:

- Issues in Chrome browser itself (report to Chrome Security)
- Issues with third-party websites
- Social engineering attacks
- Denial of service attacks
- Issues requiring physical access to a user's device
- Issues in outdated/unsupported versions

## Dependencies

We regularly monitor and update our dependencies to address known vulnerabilities:

- Automated dependency scanning via GitHub Dependabot
- Regular audits using `npm audit`
- Prompt updates for security-related dependencies

To check for dependency vulnerabilities:

```bash
npm audit
```

## Security Development Practices

Our development process includes:

- **Code Review**: All changes undergo peer review before merging
- **Linting**: ESLint checks for potential security issues
- **TypeScript**: Strong typing helps prevent common vulnerabilities
- **Testing**: Automated tests help catch security regressions
- **Minimal Dependencies**: We limit third-party dependencies to reduce attack surface

## Contact

For general security questions (non-vulnerabilities), you can:

- Open a discussion in [GitHub Discussions](https://github.com/GyeongHoKim/gyeongho-bookmark-telescope/discussions)
- Create a non-sensitive issue in the [issue tracker](https://github.com/GyeongHoKim/gyeongho-bookmark-telescope/issues)

For security vulnerabilities, always use the private reporting methods described above.

## Acknowledgments

We appreciate the security researchers and users who help keep LazyBookmark secure. Contributors who responsibly disclose vulnerabilities will be credited in our security advisories (with their permission).

---

Thank you for helping keep LazyBookmark and its users safe!
