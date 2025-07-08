import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Link } from '../types/database';

interface LinkCardProps {
  link: Link;
  onEdit?: (link: Link) => void;
  onDelete?: (link: Link) => void;
  onShare?: (link: Link) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, onDelete, onShare }) => {
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

  return (
    <TouchableOpacity style={styles.container} onPress={handleOpenLink} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Header with title and actions */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {link.title || getDomainFromUrl(link.url)}
            </Text>
            <Text style={styles.domain} numberOfLines={1}>
              {getDomainFromUrl(link.url)}
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
        {link.description && (
          <Text style={styles.description} numberOfLines={2}>
            {link.description}
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
  },
  content: {
    padding: 16,
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 2,
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