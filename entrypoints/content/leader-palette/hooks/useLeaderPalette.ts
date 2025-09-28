import { useCallback, useEffect, useRef, useState } from 'react';
import { LEADER_ITEMS } from '../models/leaderItems';

export const useLeaderPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const ulRef = useRef<HTMLUListElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleKeyboardEvent = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowUp':
          setFocusIndex((prev) => {
            return (prev - 1 + LEADER_ITEMS.length) % LEADER_ITEMS.length;
          });
          break;
        case 'j':
          setFocusIndex((prev) => {
            return (prev + 1) % LEADER_ITEMS.length;
          });
          break;
        case 'ArrowDown':
          setFocusIndex((prev) => {
            return (prev + 1) % LEADER_ITEMS.length;
          });
          break;
        case 'k':
          setFocusIndex((prev) => {
            return (prev - 1 + LEADER_ITEMS.length) % LEADER_ITEMS.length;
          });
          break;
      }
    },
    [isOpen]
  );

  useEffect(() => {
    const handleOpenLeaderPalette = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-leader-palette', handleOpenLeaderPalette);

    return () => {
      window.removeEventListener(
        'open-leader-palette',
        handleOpenLeaderPalette
      );
    };
  }, []);

  useEffect(() => {
    const handleClickEvent = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!(event.target instanceof Node)) {
        return;
      }
      if (containerRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickEvent);

    return () => {
      document.removeEventListener('mousedown', handleClickEvent);
    };
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyboardEvent);
    };
  }, [handleKeyboardEvent]);

  useEffect(() => {
    if (isOpen) {
      setFocusIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !ulRef.current) {
      return;
    }
    const selectedItem = ulRef.current?.childNodes[focusIndex]?.firstChild;
    if (selectedItem && selectedItem instanceof HTMLButtonElement) {
      selectedItem.focus();
    }
  }, [focusIndex, isOpen]);

  return {
    isOpen,
    focusIndex,
    close,
    ulRef,
    containerRef,
  };
};
