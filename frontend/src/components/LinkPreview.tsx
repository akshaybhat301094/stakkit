import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Link } from '../types/database';
import { getDomainFromURL } from '../utils/urlValidation';

interface LinkPreviewProps {
  link: Link;
  onPress?: () => void;
  onLongPress?: () => void;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ link, onPress, onLongPress }) => {
  const domain = getDomainFromURL(link.url);
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior: open the link
      Linking.openURL(link.url).catch(err => {
        console.error('Failed to open URL:', err);
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Header with domain and pin indicator */}
      <View style={styles.header}>
        <View style={styles.domainContainer}>
          <View style={styles.favicon}>
            <Icon name="language" size={16} color="#8E8E93" />
          </View>
          <Text style={styles.domain} numberOfLines={1}>
            {domain}
          </Text>
        </View>
        {link.is_pinned && (
          <Icon name="push-pin" size={16} color="#FF9500" />
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {link.title || domain}
      </Text>

      {/* Description */}
      {link.description && (
        <Text style={styles.description} numberOfLines={2}>
          {link.description}
        </Text>
      )}

      {/* Notes */}
      {link.notes && (
        <Text style={styles.notes} numberOfLines={1}>
          📝 {link.notes}
        </Text>
      )}

      {/* Tags */}
      {link.tags && link.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {link.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {link.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{link.tags.length - 3}</Text>
          )}
        </View>
      )}

      {/* Footer with date and platform */}
      <View style={styles.footer}>
        <Text style={styles.date}>
          {formatDate(link.created_at)}
        </Text>
        {link.platform && (
          <Text style={styles.platform}>
            {link.platform}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  domainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  domain: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
  },
  platform: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default LinkPreview; 