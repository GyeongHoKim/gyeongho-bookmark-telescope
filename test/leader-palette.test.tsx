import NotificationContainer from '@/entrypoints/common/components/NotificationContainer';
import { NotificationProvider } from '@/entrypoints/common/contexts/NotificationContext';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import LeaderPalette from '../entrypoints/content/leader-palette/components/LeaderPalette';
import BookmarkManager from '../entrypoints/content/manager/components/BookmarkManager';
import BookmarkTelescope from '../entrypoints/content/telescope/BookmarkTelescope';

describe('LeaderPalette Open/Close', () => {
  const triggerOpenLeaderPalette = () => {
    act(() => {
      const event = new CustomEvent('open-leader-palette');
      window.dispatchEvent(event);
    });
  };

  beforeEach(() => {
    fakeBrowser.reset();
    // Add onMessage listener to respond to sendMessage calls
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'add-bookmark') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });
  });

  it('should not display leader palette initially', () => {
    // given & when
    render(
      <NotificationProvider>
        <LeaderPalette />
      </NotificationProvider>
    );

    // then
    expect(screen.queryByTestId('leader-palette')).not.toBeInTheDocument();
    expect(document.querySelector('.leader-palette')).toBeNull();
  });

  it('should display leader palette when open-leader-palette event is dispatched', async () => {
    // given
    render(
      <NotificationProvider>
        <LeaderPalette />
      </NotificationProvider>
    );

    // when
    triggerOpenLeaderPalette();

    // then
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();
  });

  it('should close leader palette when Escape key is pressed', async () => {
    // given
    render(
      <NotificationProvider>
        <LeaderPalette />
      </NotificationProvider>
    );
    const user = userEvent.setup();
    triggerOpenLeaderPalette();
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();

    // when
    await user.keyboard('Escape');

    // then
    expect(screen.queryByTestId('leader-palette')).not.toBeInTheDocument();
  });
});

describe('LeaderPalette Focus', () => {
  const triggerOpenLeaderPalette = () => {
    act(() => {
      const event = new CustomEvent('open-leader-palette');
      window.dispatchEvent(event);
    });
  };

  beforeEach(() => {
    fakeBrowser.reset();
    // Add onMessage listener to respond to sendMessage calls
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'add-bookmark') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });
  });

  it('should focus on first item when leader palette is opened', async () => {
    // given & when
    render(
      <NotificationProvider>
        <LeaderPalette />
      </NotificationProvider>
    );
    triggerOpenLeaderPalette();
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();
    const firstItem = screen.getAllByTestId('leader-action')[0];

    // then
    expect(firstItem).toHaveFocus();
  });

  it('should change focus between list items using j/k keys', async () => {
    // given
    render(
      <NotificationProvider>
        <LeaderPalette />
      </NotificationProvider>
    );
    const user = userEvent.setup();
    triggerOpenLeaderPalette();
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();
    const everyItems = screen.getAllByTestId('leader-action');

    // when & then
    expect(everyItems[0]).toHaveFocus();
    for (let i = 1; i < everyItems.length; i++) {
      await user.keyboard('j');
      expect(everyItems[i]).toHaveFocus();
    }
    for (let i = everyItems.length - 1; i > 0; i--) {
      expect(everyItems[i]).toHaveFocus();
      await user.keyboard('k');
    }
  });
});

describe('LeaderPalette Actions', () => {
  const triggerOpenLeaderPalette = () => {
    act(() => {
      const event = new CustomEvent('open-leader-palette');
      window.dispatchEvent(event);
    });
  };

  beforeEach(() => {
    fakeBrowser.reset();
    // Add onMessage listener to respond to sendMessage calls
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'add-bookmark') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });
  });

  it('should render quick-bookmark when a key is pressed', async () => {
    // given
    render(
      <NotificationProvider>
        <BookmarkTelescope />
        <BookmarkManager />
        <LeaderPalette />
        <NotificationContainer />
      </NotificationProvider>
    );
    const user = userEvent.setup();
    triggerOpenLeaderPalette();
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();

    // when
    await user.keyboard('a');

    // then
    expect(screen.getByTestId('notification')).toBeInTheDocument();
  });

  it('should render live-grep when g key is pressed', async () => {
    // given
    render(
      <NotificationProvider>
        <LeaderPalette />
        <BookmarkTelescope />
        <BookmarkManager />
      </NotificationProvider>
    );
    const user = userEvent.setup();
    triggerOpenLeaderPalette();
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();

    // when
    await user.keyboard('g');

    // then
    expect(screen.getByTestId('live-grep')).toBeInTheDocument();
  });

  it('should render bookmark-manager when b key is pressed', async () => {
    // given
    render(
      <NotificationProvider>
        <LeaderPalette />
        <BookmarkTelescope />
        <BookmarkManager />
      </NotificationProvider>
    );
    const user = userEvent.setup();
    triggerOpenLeaderPalette();
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();

    // when
    await user.keyboard('b');

    // then
    expect(screen.getByTestId('bookmark-manager')).toBeInTheDocument();
  });
});
