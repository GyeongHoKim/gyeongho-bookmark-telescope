import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTelescopeVisibilityProps {
  onShow: () => void;
  onHide: () => void;
}

export const useTelescopeVisibility = ({ onShow, onHide }: UseTelescopeVisibilityProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef<boolean>(false);

  const show = useCallback(async () => {
    isVisibleRef.current = true;
    setIsVisible(true);
    onShow();
  }, [onShow]);

  const hide = useCallback(() => {
    isVisibleRef.current = false;
    setIsVisible(false);
    onHide();
  }, [onHide]);

  useEffect(() => {
    const handleToggle = () => {
      if (isVisibleRef.current) {
        hide();
      } else {
        show();
      }
    };

    window.addEventListener('telescope-toggle', handleToggle);

    return () => {
      window.removeEventListener('telescope-toggle', handleToggle);
    };
  }, [show, hide]);

  return {
    isVisible,
    isVisibleRef,
    show,
    hide,
  };
};
