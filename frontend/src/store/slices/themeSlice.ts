import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

// Get initial system theme
const getSystemTheme = (): boolean => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark';
};

const initialState: ThemeState = {
  mode: 'system',
  isDark: getSystemTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      
      // Update isDark based on the mode
      if (action.payload === 'system') {
        state.isDark = getSystemTheme();
      } else {
        state.isDark = action.payload === 'dark';
      }
    },
    updateSystemTheme: (state) => {
      // This will be called when system theme changes
      if (state.mode === 'system') {
        state.isDark = getSystemTheme();
      }
    },
  },
});

export const { setThemeMode, updateSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;
