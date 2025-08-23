import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows 
} from './DesignSystem';

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
  iconColor = Colors.textLight
}) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>
        {description}
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={onButtonPress}>
        <Icon name="add" size={20} color={Colors.surface} />
        <Text style={styles.createButtonText}>{buttonText}</Text>
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
    backgroundColor: Colors.surfaceSecondary,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});

export default EmptyState;
