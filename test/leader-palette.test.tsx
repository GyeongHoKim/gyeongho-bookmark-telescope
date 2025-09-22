import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import LeaderPalette from '../entrypoints/content/LeaderPalette';

describe('LeaderPalette', () => {
  beforeEach(() => {
    // Reset fake browser state before each test
    fakeBrowser.reset();
  });

  it('should display leader palette when open-leader-palette event is dispatched', async () => {
    // Render the LeaderPalette component
    render(<LeaderPalette />);

    // Initially, the palette should not be visible
    expect(screen.queryByTestId('leader-palette')).not.toBeInTheDocument();
    expect(document.querySelector('.leader-palette')).toBeNull();

    // Dispatch the open-leader-palette event wrapped in act
    await act(async () => {
      const event = new CustomEvent('open-leader-palette');
      window.dispatchEvent(event);

      // Wait for the component to respond to the event
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check if the leader palette with the correct class name is now visible
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).not.toBeNull();
    expect(leaderPaletteElement).toBeInTheDocument();

    // Check for specific elements within the leader palette
    expect(screen.getByText('Leader')).toBeInTheDocument();
    expect(screen.getByText('Choose action')).toBeInTheDocument();
    expect(
      screen.getByText('[j/k: ↑↓] [Enter: select] [ESC: close]')
    ).toBeInTheDocument();
  });

  it('should not display leader palette initially', () => {
    // Render the LeaderPalette component
    render(<LeaderPalette />);

    // The palette should not be visible initially
    expect(document.querySelector('.leader-palette')).toBeNull();
  });

  it('should handle browser extension messaging for open-leader-palette', async () => {
    // Render the LeaderPalette component
    render(<LeaderPalette />);

    // Simulate the background script sending a message to content script
    // which then dispatches the custom event
    const mockMessage = { action: 'open-leader-palette' };

    // Simulate the message listener behavior from content/index.tsx wrapped in act
    await act(async () => {
      if (mockMessage.action === 'open-leader-palette') {
        const event = new CustomEvent('open-leader-palette');
        window.dispatchEvent(event);
      }

      // Wait for the event to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the leader palette is now visible
    const leaderPaletteElement = document.querySelector('.leader-palette');
    expect(leaderPaletteElement).not.toBeNull();
    expect(leaderPaletteElement).toHaveClass('leader-palette');
  });
});
