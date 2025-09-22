import '@testing-library/jest-dom';
import { fakeBrowser } from 'wxt/testing';
import { beforeEach } from 'vitest';

// Reset fake browser state before each test
beforeEach(() => {
  fakeBrowser.reset();
});

// Global test setup
declare global {
  var browser: typeof fakeBrowser;
}

global.browser = fakeBrowser;
