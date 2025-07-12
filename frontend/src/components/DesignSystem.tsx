import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Color palette inspired by modern design
export const Colors = {
  // Primary colors
  primary: '#007AFF',
  secondary: '#34C759',
  accent: '#FF9500',
  warning: '#FF3B30',
  
  // Neutral colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F2F7',
  
  // Text colors
  textPrimary: '#1C1C1E',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  textLight: '#C7C7CC',
  
  // Collection colors (inspired by the screenshot)
  collectionColors: [
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Mint
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#FFB6C1', // Pink
    '#98D8C8', // Sage
    '#F7DC6F', // Gold
    '#BB8FCE', // Lavender
  ],
  
  // Smart tag colors
  tagColors: {
    water: '#4ECDC4',
    blue: '#45B7D1',
    purple: '#BB8FCE',
    plant: '#96CEB4',
    nature: '#52C41A',
    tech: '#1890FF',
    design: '#722ED1',
    food: '#FA8C16',
  },
};

// Typography system
export const Typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 38,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 30,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 26,
  } as TextStyle,
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
  } as TextStyle,
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textTertiary,
    lineHeight: 18,
  } as TextStyle,
  
  // Labels
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
    lineHeight: 16,
  } as TextStyle,
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
};

// Grid system
export const Grid = {
  // For responsive design
  columns: 2,
  gutter: Spacing.md,
  
  // Card sizes inspired by the screenshot
  cardSizes: {
    small: { width: '48%', height: 120 },
    medium: { width: '100%', height: 160 },
    large: { width: '100%', height: 200 },
  },
};

// Utility functions
export const getCollectionColor = (index: number): string => {
  return Colors.collectionColors[index % Colors.collectionColors.length];
};

export const getTagColor = (tag: string): string => {
  const lowercaseTag = tag.toLowerCase();
  for (const [key, color] of Object.entries(Colors.tagColors)) {
    if (lowercaseTag.includes(key)) {
      return color;
    }
  }
  return Colors.primary;
};

// Common styles
export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  surface: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  surfaceMedium: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  // Padding utilities
  p_xs: { padding: Spacing.xs },
  p_sm: { padding: Spacing.sm },
  p_md: { padding: Spacing.md },
  p_lg: { padding: Spacing.lg },
  p_xl: { padding: Spacing.xl },
  // Margin utilities
  m_xs: { margin: Spacing.xs },
  m_sm: { margin: Spacing.sm },
  m_md: { margin: Spacing.md },
  m_lg: { margin: Spacing.lg },
  m_xl: { margin: Spacing.xl },
  // Margin vertical
  mv_xs: { marginVertical: Spacing.xs },
  mv_sm: { marginVertical: Spacing.sm },
  mv_md: { marginVertical: Spacing.md },
  mv_lg: { marginVertical: Spacing.lg },
  // Margin horizontal
  mh_xs: { marginHorizontal: Spacing.xs },
  mh_sm: { marginHorizontal: Spacing.sm },
  mh_md: { marginHorizontal: Spacing.md },
  mh_lg: { marginHorizontal: Spacing.lg },
}); 