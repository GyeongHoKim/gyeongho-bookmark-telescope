import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

vi.mock('webextension-polyfill');

// Reset fake browser state before each test
beforeEach(() => {
  fakeBrowser.reset();
});
