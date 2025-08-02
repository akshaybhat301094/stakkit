import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

export const useScrollToHide = (scrollOffset = 100) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const translateY = new Animated.Value(0);

  const onScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    if (currentScrollY < lastScrollY || currentScrollY < scrollOffset) {
      // Scrolling up or near top - show menu
      if (!isVisible) {
        setIsVisible(true);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10
        }).start();
      }
    } else if (currentScrollY > lastScrollY && currentScrollY > scrollOffset) {
      // Scrolling down and past threshold - hide menu
      if (isVisible) {
        setIsVisible(false);
        Animated.spring(translateY, {
          toValue: 100, // Move down by 100 units (will be hidden)
          useNativeDriver: true,
          tension: 65,
          friction: 10
        }).start();
      }
    }
    setLastScrollY(currentScrollY);
  };

  return {
    translateY,
    onScroll
  };
}; 