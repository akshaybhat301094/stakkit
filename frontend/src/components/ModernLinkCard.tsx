import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Link } from '../types/database';
import { LinkPreview } from '../types';
import LinkMetadataService from '../services/linkMetadataService';
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  CommonStyles 
} from './DesignSystem';

interface ModernLinkCardProps {
  link: Link;
  onPress?: (link: Link) => void;
  onLongPress?: (link: Link) => void;
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const ModernLinkCard: React.FC<ModernLinkCardProps> = ({ 
  link, 
  onPress, 
  onLongPress,
  size = 'medium',
  showActions = false
}) => {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Use existing link data or fetch if needed
    setPreview({
      url: link.url,
      title: link.title,
      description: link.description,
      image: link.image_url,
      platform: link.platform || undefined,
      siteName: LinkMetadataService.extractSiteNameFromUrl(link.url),
    });
  }, [link]);

  const handlePress = () => {
    onPress?.(link);
  };

  const handleLongPress = () => {
    onLongPress?.(link);
  };

  const getCardDimensions = () => {
    const padding = Spacing.md * 2;
    const gutter = Spacing.sm;
    
    switch (size) {
      case 'small':
        return {
          width: (screenWidth - padding - gutter) / 2,
          height: 200, // Further increased from 180
        };
      case 'large':
        return {
          width: screenWidth - padding,
          height: 280, // Further increased from 260
        };
      default:
        return {
          width: (screenWidth - padding - gutter) / 2,
          height: 240, // Further increased from 220
        };
    }
  };

  const cardDimensions = getCardDimensions();
  
  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlatformIcon = (platform?: string) => {
    // If we have a platform, use it
    if (platform) {
      switch (platform.toLowerCase()) {
        case 'youtube': return 'play-circle-filled';
        case 'instagram': return 'photo-camera';
        case 'tiktok': return 'music-note';
        case 'twitter': return 'alternate-email';
        case 'linkedin': return 'business';
        case 'facebook': return 'thumb-up';
        case 'github': return 'code';
        case 'reddit': return 'forum';
        case 'medium': return 'article';
        case 'pinterest': return 'image';
        case 'spotify': return 'library-music';
        case 'netflix': return 'movie';
        default: return 'language';
      }
    }

    // If no platform, try to detect from URL
    const url = link.url.toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'play-circle-filled';
    if (url.includes('instagram.com')) return 'photo-camera';
    if (url.includes('tiktok.com')) return 'music-note';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'alternate-email';
    if (url.includes('linkedin.com')) return 'business';
    if (url.includes('facebook.com')) return 'thumb-up';
    if (url.includes('github.com')) return 'code';
    if (url.includes('reddit.com')) return 'forum';
    if (url.includes('medium.com')) return 'article';
    if (url.includes('pinterest.com')) return 'image';
    if (url.includes('spotify.com')) return 'library-music';
    if (url.includes('netflix.com')) return 'movie';
    if (url.includes('google.com')) return 'search';
    if (url.includes('amazon.com')) return 'shopping-cart';
    if (url.includes('apple.com')) return 'phone-iphone';
    
    // Default fallback
    return 'language';
  };

  const generateSmartTags = (): string[] => {
    // Function removed since we no longer display tag pills
    return [];
  };

  const smartTags = generateSmartTags();
  const displayTitle = preview?.title || link.title || getDomainFromUrl(link.url);
  const displayDescription = preview?.description || link.description;
  const displayImage = preview?.image || link.image_url;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          width: cardDimensions.width,
          height: cardDimensions.height,
        }
      ]} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      {/* Image Section */}
      <View style={styles.imageSection}>
        {displayImage && !imageError ? (
          <Image
            source={{ uri: displayImage }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon 
              name={getPlatformIcon(preview?.platform || link.platform)} 
              size={32} 
              color={Colors.textLight} 
            />
          </View>
        )}
        
        {/* Platform badge - Always show with platform-specific icon */}
        <View style={styles.platformBadge}>
          <Icon 
            name={getPlatformIcon(preview?.platform || link.platform || getDomainFromUrl(link.url))} 
            size={14} 
            color={Colors.surface} 
          />
        </View>

        {/* Pin indicator */}
        {link.is_pinned && (
          <View style={styles.pinBadge}>
            <Icon name="push-pin" size={14} color={Colors.surface} />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Title - Move to top for better hierarchy */}
        <Text style={styles.title} numberOfLines={size === 'small' ? 2 : 2}>
          {displayTitle}
        </Text>

        {/* Header - Domain and Date */}
        <View style={styles.header}>
          <Text style={styles.domain} numberOfLines={1}>
            {preview?.siteName || getDomainFromUrl(link.url)}
          </Text>
          <Text style={styles.date}>
            {formatDate(link.created_at)}
          </Text>
        </View>

        {/* Description - Only for medium and large cards */}
        {displayDescription && size !== 'small' && (
          <Text style={styles.description} numberOfLines={1}>
            {displayDescription}
          </Text>
        )}

        {/* Bottom section with tags and notes */}
        <View style={styles.bottomSection}>
          {/* Notes - Keep notes but remove tags */}
          {link.notes && size !== 'small' && (
            <View style={styles.notesContainer}>
              <Icon name="note" size={12} color={Colors.textTertiary} />
              <Text style={styles.notes} numberOfLines={1}>
                {link.notes}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  imageSection: {
    height: '50%', // Further reduced from 55% to give even more space to content
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 1,
    padding: Spacing.lg, // Increased padding
    paddingBottom: Spacing.md, // Better bottom padding
    justifyContent: 'space-between', // Distribute content evenly
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Increased margin
    marginTop: Spacing.xs, // Added top margin
  },
  domain: {
    ...Typography.labelSmall,
    color: Colors.primary,
    flex: 1,
  },
  date: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  title: {
    ...Typography.bodyBold,
    fontSize: 16, // Increased font size
    marginBottom: 0, // Remove bottom margin since header follows
    lineHeight: 22, // Increased line height
    color: Colors.textPrimary, // Fixed color reference
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm, // Added top margin
    lineHeight: 18, // Increased line height
  },
  bottomSection: {
    marginTop: 'auto', // Push to bottom
    minHeight: 20, // Reduced minimum height since no tags
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  notes: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
});

export default ModernLinkCard; 