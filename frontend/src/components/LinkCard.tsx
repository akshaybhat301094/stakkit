import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Link } from '../types/database';
import { LinkPreview } from '../types';
import LinkMetadataService from '../services/linkMetadataService';
import LinksService from '../services/linksService';

interface LinkCardProps {
  link: Link;
  onEdit?: (link: Link) => void;
  onDelete?: (link: Link) => void;
  onShare?: (link: Link) => void;
  onAddToCollection?: (link: Link) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, onDelete, onShare, onAddToCollection }) => {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Fetch preview metadata on mount
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setIsLoadingPreview(true);
        setImageError(false);
        
        // Check if we need to fetch fresh metadata
        const needsMetadataUpdate = (
          !link.image_url || 
          !link.title || 
          link.title === getDomainFromUrl(link.url) ||
          (link.title && link.title.startsWith('YouTube Video -')) || // Catch generic YouTube titles
          link.title === 'YouTube Video' ||
          link.title === 'Instagram Post' ||
          link.title === 'Twitter Post' ||
          link.title === 'TikTok Video'
        );

        if (needsMetadataUpdate) {
          console.log('🔄 Fetching fresh metadata for:', link.url, 'Current title:', link.title);
          const metadata = await LinkMetadataService.getMetadata(link.url);
          console.log('📋 Fetched metadata:', { title: metadata.title, hasImage: !!metadata.image });
          setPreview(metadata);
          
          // Save the fresh metadata back to the database
          try {
            if (metadata.title && metadata.title !== link.title || 
                metadata.image && metadata.image !== link.image_url ||
                metadata.platform && metadata.platform !== link.platform) {
              
              console.log('💾 Updating database with fresh metadata for link:', link.id);
              await LinksService.updateLink(link.id, {
                title: metadata.title || link.title,
                description: metadata.description || link.description,
                image_url: metadata.image || link.image_url,
                platform: metadata.platform || link.platform,
              });
              console.log('✅ Database updated successfully');
            }
          } catch (updateError) {
            console.warn('❌ Failed to update link metadata:', updateError);
          }
          
          return;
        }
        
        // If we already have good metadata from the database, use it
        setPreview({
          url: link.url,
          title: link.title,
          description: link.description,
          image: link.image_url,
          platform: link.platform || undefined,
          siteName: LinkMetadataService.extractSiteNameFromUrl(link.url),
        });
      } catch (error) {
        console.warn('Error fetching preview:', error);
        // Use link data as fallback
        setPreview({
          url: link.url,
          title: link.title || LinkMetadataService.extractTitleFromUrl(link.url),
          description: link.description,
          image: link.image_url,
          platform: link.platform || LinkMetadataService.detectPlatform(link.url),
        });
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [link.url, link.title, link.description, link.image_url, link.platform]);

  const handleOpenLink = async () => {
    try {
      const supported = await Linking.canOpenURL(link.url);
      if (supported) {
        await Linking.openURL(link.url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => onDelete?.(link) 
        },
      ]
    );
  };

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
      year: 'numeric'
    });
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'youtube': return 'play-circle-filled';
      case 'instagram': return 'photo-camera';
      case 'tiktok': return 'music-note';
      case 'twitter': return 'alternate-email';
      default: return 'language';
    }
  };

  const displayTitle = preview?.title || link.title || getDomainFromUrl(link.url);
  const displayDescription = preview?.description || link.description;
  const displayImage = preview?.image || link.image_url;

  return (
    <TouchableOpacity style={styles.container} onPress={handleOpenLink} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Image Preview */}
        {displayImage && !imageError && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: displayImage }}
              style={styles.previewImage}
              onError={(error) => {
                console.warn('Image load error for', displayImage, error);
                setImageError(true);
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
              onLoadStart={() => {
                // Image started loading
              }}
            />
            {isLoadingPreview && (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator color="#007AFF" />
                <Text style={styles.loadingText}>Loading preview...</Text>
              </View>
            )}
          </View>
        )}

        {/* Header with title and actions */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Icon 
                name={getPlatformIcon(preview?.platform || link.platform)} 
                size={16} 
                color="#8E8E93" 
                style={styles.platformIcon}
              />
              <Text style={styles.title} numberOfLines={2}>
                {displayTitle}
              </Text>
            </View>
            <Text style={styles.domain} numberOfLines={1}>
              {preview?.siteName || getDomainFromUrl(link.url)}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {onShare && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => onShare(link)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="share" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
            
            {onAddToCollection && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => onAddToCollection(link)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="create-new-folder" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
            
            {onEdit && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => onEdit(link)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="edit" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="delete" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Description */}
        {displayDescription && (
          <Text style={styles.description} numberOfLines={2}>
            {displayDescription}
          </Text>
        )}

        {/* Notes */}
        {link.notes && (
          <View style={styles.notesContainer}>
            <Icon name="note" size={14} color="#8E8E93" />
            <Text style={styles.notes} numberOfLines={2}>
              {link.notes}
            </Text>
          </View>
        )}

        {/* Footer with date and pin status */}
        <View style={styles.footer}>
          <Text style={styles.date}>
            Saved {formatDate(link.created_at)}
          </Text>
          
          {link.is_pinned && (
            <View style={styles.pinnedContainer}>
              <Icon name="push-pin" size={14} color="#007AFF" />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F2F2F7',
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 242, 247, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  platformIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 22,
    flex: 1,
  },
  domain: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  notes: {
    fontSize: 13,
    color: '#3C3C43',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pinnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default LinkCard; 