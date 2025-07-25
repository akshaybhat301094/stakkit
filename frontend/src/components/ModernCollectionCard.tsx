import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Collection } from '../types/database';
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  getCollectionColor,
  CommonStyles 
} from './DesignSystem';

interface ModernCollectionCardProps {
  collection: Collection & { linkCount: number };
  onPress?: (collection: Collection) => void;
  onLongPress?: (collection: Collection) => void;
  size?: 'small' | 'medium' | 'large';
  index?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ModernCollectionCard: React.FC<ModernCollectionCardProps> = ({ 
  collection, 
  onPress, 
  onLongPress,
  size = 'medium',
  index = 0 
}) => {
  const handlePress = () => {
    onPress?.(collection);
  };

  const handleLongPress = () => {
    onLongPress?.(collection);
  };

  const getCardDimensions = () => {
    const padding = Spacing.md * 2; // Total horizontal padding
    const gutter = Spacing.sm; // Space between cards
    
    switch (size) {
      case 'small':
        return {
          width: (screenWidth - padding - gutter) / 2,
          height: 120,
        };
      case 'large':
        return {
          width: screenWidth - padding,
          height: 180,
        };
      default: // medium
        return {
          width: (screenWidth - padding - gutter) / 2,
          height: 160,
        };
    }
  };

  const cardDimensions = getCardDimensions();
  const collectionColor = getCollectionColor(index);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCollectionIcon = () => {
    if (collection.is_public) {
      return 'public';
    }
    return 'folder';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          width: cardDimensions.width,
          height: cardDimensions.height,
          backgroundColor: collectionColor,
        }
      ]} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      {/* Background pattern overlay */}
      <View style={styles.backgroundPattern} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Icon name={getCollectionIcon()} size={24} color={Colors.surface} />
            </View>
            
            {/* Link count badge */}
            <View style={styles.linkCountBadge}>
              <Text style={styles.linkCountBadgeText}>
                {collection.linkCount}
              </Text>
            </View>
          </View>
          
          {collection.is_public && (
            <View style={styles.publicBadge}>
              <Icon name="public" size={12} color={Colors.surface} />
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={size === 'small' ? 2 : 3}>
            {collection.name}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.date}>
            {formatDate(collection.created_at)}
          </Text>
        </View>
      </View>
      
      {/* Gradient overlay for better text readability */}
      <View style={styles.gradientOverlay} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.medium,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // Add a subtle pattern or keep it simple
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  
  footer: {
    marginTop: 'auto',
    marginBottom: 0,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.surface,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
     linkCountBadge: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 12,
     paddingHorizontal: Spacing.xs,
     paddingVertical: 2,
     marginLeft: Spacing.xs,
   },
  linkCountBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.surface,
  },
});

export default ModernCollectionCard; 