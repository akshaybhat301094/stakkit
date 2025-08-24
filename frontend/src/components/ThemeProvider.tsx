import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateSystemTheme } from '../store/slices/themeSlice';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { mode, isDark } = useAppSelector((state) => state.theme);

  useEffect(() => {
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(() => {
      if (mode === 'system') {
        dispatch(updateSystemTheme());
      }
    });

    return () => subscription?.remove();
  }, [dispatch, mode]);

  return (
    <>
      {children}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
};

export default ThemeProvider;
