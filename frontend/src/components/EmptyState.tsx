import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows 
} from './DesignSystem';
import { useTheme } from '../hooks/useTheme';

interface EmptyStateProps {
  icon: keyof typeof Icon.glyphMap;
  title: string;
  description: string;
  buttonText: string;
  onButtonPress: () => void;
  iconSize?: number;
  iconColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  buttonText,
  onButtonPress,
  iconSize = 64,
  iconColor
}) => {
  const { colors } = useTheme();
  const finalIconColor = iconColor || colors.textLight;

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Icon name={icon} size={iconSize} color={finalIconColor} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
      <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={onButtonPress}>
        <Icon name="add" size={20} color={colors.surface} />
        <Text style={[styles.createButtonText, { color: colors.surface }]}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});

export default EmptyState;
