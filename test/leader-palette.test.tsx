import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import LeaderPalette from '../entrypoints/content/leader-palette/components/LeaderPalette';

describe('LeaderPalette Open/Close', () => {
  const triggerOpenLeaderPalette = () => {
    act(() => {
      const event = new CustomEvent('open-leader-palette');
      window.dispatchEvent(event);
    });
  };

  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('should not display leader palette initially', () => {
    // given & when
    render(<LeaderPalette />);

    // then
    expect(screen.queryByTestId('leader-palette')).not.toBeInTheDocument();
    expect(document.querySelector('.leader-palette')).toBeNull();
  });

  it('should display leader palette when open-leader-palette event is dispatched', async () => {
    // given
    render(<LeaderPalette />);

    // when
    triggerOpenLeaderPalette();

    // then
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).toBeInTheDocument();
  });

  it('should close leader palette when Escape key is pressed', async () => {
    // given
    render(<LeaderPalette />);
    const user = userEvent.setup();
    triggerOpenLeaderPalette();

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
  });

  it('should focus on first item when leader palette is opened', async () => {
    // given & when
    render(<LeaderPalette />);
    triggerOpenLeaderPalette();
    const firstItem = screen.getAllByTestId('leader-action')[0];

    // then
    expect(firstItem).toHaveFocus();
  });

  it('should change focus between list items using j/k keys', async () => {
    // given
    render(<LeaderPalette />);
    const user = userEvent.setup();
    triggerOpenLeaderPalette();
    const everyItems = screen.getAllByTestId('leader-action');

    // when & then
    expect(everyItems[0]).toHaveFocus();
    for (let i = 1; i < everyItems.length; i++) {
      await user.keyboard('k');
      expect(everyItems[i]).toHaveFocus();
    }
    for (let i = everyItems.length - 1; i >= 0; i--) {
      await user.keyboard('j');
      expect(everyItems[i]).toHaveFocus();
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
  });

  it('should render quick-bookmark when a key is pressed', async () => {
    // given
    render(<LeaderPalette />);
    const user = userEvent.setup();
    triggerOpenLeaderPalette();

    // when
    await user.keyboard('a');

    // then
    expect(screen.getByTestId('quick-bookmark')).toBeInTheDocument();
  });

  it('should render live-grep when g key is pressed', async () => {
    // given
    render(<LeaderPalette />);
    const user = userEvent.setup();
    triggerOpenLeaderPalette();

    // when
    await user.keyboard('g');

    // then
    expect(screen.getByTestId('live-grep')).toBeInTheDocument();
  });

  it('should render bookmark-manager when b key is pressed', async () => {
    // given
    render(<LeaderPalette />);
    const user = userEvent.setup();
    triggerOpenLeaderPalette();

    // when
    await user.keyboard('b');

    // then
    expect(screen.getByTestId('bookmark-manager')).toBeInTheDocument();
  });
});
