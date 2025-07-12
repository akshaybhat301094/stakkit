import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Collection, Link } from '../types/database';
import { CollectionsService } from '../services/collectionsService';
import { LinksService } from '../services/linksService';

interface AddToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  link: Link;
  onSuccess?: () => void;
}

interface CollectionWithStatus extends Collection {
  isSelected: boolean;
  isAlreadyAdded: boolean;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  visible,
  onClose,
  link,
  onSuccess,
}) => {
  const [collections, setCollections] = useState<CollectionWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      // Get all user collections
      const userCollections = await CollectionsService.getUserCollections();
      
      // Get collections this link is already in
      const linkCollections = await LinksService.getLinkCollections(link.id);
      const linkCollectionIds = new Set(linkCollections.map(c => c.id));
      
      // Map collections with their status
      const collectionsWithStatus: CollectionWithStatus[] = userCollections.map(collection => ({
        ...collection,
        isSelected: false, // Will be checked for newly selected collections
        isAlreadyAdded: linkCollectionIds.has(collection.id),
      }));
      
      setCollections(collectionsWithStatus);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCollections();
    }
  }, [visible, link.id]);

  const toggleCollection = (collectionId: string) => {
    setCollections(prev => 
      prev.map(collection => 
        collection.id === collectionId
          ? { ...collection, isSelected: !collection.isSelected }
          : collection
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const selectedCollections = collections.filter(c => c.isSelected && !c.isAlreadyAdded);
      
      if (selectedCollections.length === 0) {
        Alert.alert('No Selection', 'Please select at least one collection to add this link to.');
        return;
      }
      
      const collectionIds = selectedCollections.map(c => c.id);
      await LinksService.addLinkToCollections(link.id, collectionIds);
      
      const collectionNames = selectedCollections.map(c => c.name).join(', ');
      Alert.alert(
        'Success',
        `Link added to: ${collectionNames}`,
        [{ text: 'OK', onPress: () => {
          onSuccess?.();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error adding link to collections:', error);
      Alert.alert('Error', 'Failed to add link to collections');
    } finally {
      setSaving(false);
    }
  };

  const getCollectionColor = (name: string): string => {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
      '#00D2D3', '#FF9F43', '#EE5A24', '#0984e3',
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Add to Collection</Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.headerButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Link Preview */}
        <View style={styles.linkPreview}>
          <View style={styles.linkIcon}>
            <Ionicons name="link" size={16} color="#666" />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle} numberOfLines={1}>
              {link.title || 'Untitled Link'}
            </Text>
            <Text style={styles.linkUrl} numberOfLines={1}>
              {link.url}
            </Text>
          </View>
        </View>

        {/* Collections List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading collections...</Text>
          </View>
        ) : (
          <ScrollView style={styles.collectionsContainer}>
            {collections.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-outline" size={48} color="#999" />
                <Text style={styles.emptyTitle}>No Collections</Text>
                <Text style={styles.emptyDescription}>
                  Create a collection first to organize your links
                </Text>
              </View>
            ) : (
              collections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[
                    styles.collectionItem,
                    collection.isAlreadyAdded && styles.collectionItemAdded,
                  ]}
                  onPress={() => !collection.isAlreadyAdded && toggleCollection(collection.id)}
                  disabled={collection.isAlreadyAdded}
                >
                  <View style={styles.collectionItemLeft}>
                    <View 
                      style={[
                        styles.collectionIcon,
                        { backgroundColor: getCollectionColor(collection.name) }
                      ]}
                    >
                      <Ionicons 
                        name={collection.is_public ? "folder-open" : "folder"} 
                        size={16} 
                        color="white" 
                      />
                    </View>
                    
                    <View style={styles.collectionInfo}>
                      <Text style={[
                        styles.collectionName,
                        collection.isAlreadyAdded && styles.collectionNameAdded,
                      ]}>
                        {collection.name}
                      </Text>
                      {collection.description && (
                        <Text style={[
                          styles.collectionDescription,
                          collection.isAlreadyAdded && styles.collectionDescriptionAdded,
                        ]}>
                          {collection.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.collectionItemRight}>
                    {collection.isAlreadyAdded ? (
                      <View style={styles.addedBadge}>
                        <Ionicons name="checkmark" size={16} color="#34C759" />
                        <Text style={styles.addedText}>Added</Text>
                      </View>
                    ) : (
                      <View style={[
                        styles.checkbox,
                        collection.isSelected && styles.checkboxSelected,
                      ]}>
                        {collection.isSelected && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E1E1E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  collectionsContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  collectionItemAdded: {
    backgroundColor: '#F8F9FA',
  },
  collectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  collectionNameAdded: {
    color: '#666',
  },
  collectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  collectionDescriptionAdded: {
    color: '#999',
  },
  collectionItemRight: {
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E1E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  addedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 4,
  },
}); 