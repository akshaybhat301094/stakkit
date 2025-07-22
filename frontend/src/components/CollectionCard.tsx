import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Collection } from '../types/database';

interface CollectionCardProps {
  collection: Collection & { linkCount: number };
  onPress?: (collection: Collection) => void;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onShare?: (collection: Collection) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ 
  collection, 
  onPress, 
  onEdit, 
  onDelete, 
  onShare 
}) => {
  const [showActions, setShowActions] = useState(false);

  const handlePress = () => {
    onPress?.(collection);
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleEdit = () => {
    setShowActions(false);
    onEdit?.(collection);
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This will remove all links from this collection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => onDelete?.(collection) 
        },
      ]
    );
  };

  const handleShare = () => {
    setShowActions(false);
    onShare?.(collection);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCollectionIcon = () => {
    if (collection.is_public) {
      return 'public';
    }
    return 'folder';
  };

  const getCollectionColor = () => {
    // Generate a consistent color based on collection name
    const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D92', '#00C7BE'];
    const hash = collection.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Collection Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getCollectionColor() }]}>
          <Icon name={getCollectionIcon()} size={24} color="#FFFFFF" />
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={styles.linkCount}>
            {collection.linkCount} {collection.linkCount === 1 ? 'link' : 'links'}
          </Text>
        </View>

        {/* Action button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Icon name="more-vert" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Description */}
      {collection.description && (
        <Text style={styles.description} numberOfLines={2}>
          {collection.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.date}>
          Created {formatDate(collection.created_at)}
        </Text>
        
        <View style={styles.badges}>
          {collection.is_public && (
            <View style={styles.badge}>
              <Icon name="public" size={12} color="#007AFF" />
              <Text style={styles.badgeText}>Public</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions Dropdown */}
      {showActions && (
        <View style={styles.actionsDropdown}>
          <TouchableOpacity style={styles.actionItem} onPress={handleEdit}>
            <Icon name="edit" size={16} color="#007AFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Icon name="share" size={16} color="#007AFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
            <Icon name="delete" size={16} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => setShowActions(false)}
          >
            <Icon name="close" size={16} color="#8E8E93" />
            <Text style={[styles.actionText, { color: '#8E8E93' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  linkCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actionButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
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
  badges: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#007AFF',
    marginLeft: 2,
    fontWeight: '500',
  },
  actionsDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 1000,
    minWidth: 120,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default CollectionCard; 