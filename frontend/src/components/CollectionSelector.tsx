import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Collection } from '../types/database';
import { CollectionsService } from '../services/collectionsService';
import { useTheme } from '../hooks/useTheme';
import {
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from './DesignSystem';

interface CollectionSelectorProps {
  onSelect: (collectionId: string | null) => void;
  selectedCollectionId?: string | null;
  allowCreateNew?: boolean;
  onCreateNew?: (name: string, description?: string) => Promise<void>;
  showCreateForm?: boolean;
  style?: any;
}

interface CollectionSelectorState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  showCreateForm: boolean;
  newCollectionName: string;
  newCollectionDescription: string;
  creating: boolean;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  onSelect,
  selectedCollectionId,
  allowCreateNew = true,
  onCreateNew,
  showCreateForm = false,
  style,
}) => {
  const { colors } = useTheme();
  
  const [state, setState] = useState<CollectionSelectorState>({
    collections: [],
    loading: true,
    error: null,
    showCreateForm: showCreateForm,
    newCollectionName: '',
    newCollectionDescription: '',
    creating: false,
  });

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const collections = await CollectionsService.getUserCollections();
      
      setState(prev => ({ 
        ...prev, 
        collections,
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error loading collections:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load collections', 
        loading: false 
      }));
    }
  };

  const handleSelectCollection = (collectionId: string) => {
    setState(prev => ({ ...prev, showCreateForm: false }));
    onSelect(collectionId);
  };

  const handleShowCreateForm = () => {
    setState(prev => ({ ...prev, showCreateForm: true }));
    onSelect(null);
  };

  const handleCreateCollection = async () => {
    if (!state.newCollectionName.trim()) {
      return;
    }

    try {
      setState(prev => ({ ...prev, creating: true }));
      
      if (onCreateNew) {
        await onCreateNew(
          state.newCollectionName.trim(),
          state.newCollectionDescription.trim() || undefined
        );
      } else {
        // Default create behavior
        const newCollection = await CollectionsService.createCollection({
          name: state.newCollectionName.trim(),
          description: state.newCollectionDescription.trim() || undefined,
          is_public: false,
        });
        
        // Refresh collections list and select the new one
        await loadCollections();
        onSelect(newCollection.id);
      }
      
      setState(prev => ({ 
        ...prev, 
        showCreateForm: false,
        newCollectionName: '',
        newCollectionDescription: '',
        creating: false,
      }));
    } catch (error) {
      console.error('Error creating collection:', error);
      setState(prev => ({ ...prev, creating: false }));
    }
  };

  const getCollectionColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorPalette = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
      '#00D2D3', '#FF9F43', '#EE5A24', '#0984e3',
    ];
    
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  if (state.loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading collections...
        </Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Icon name="error-outline" size={24} color={colors.warning} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {state.error}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]} 
          onPress={loadCollections}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Existing Collections */}
        {state.collections.map((collection) => (
          <TouchableOpacity
            key={collection.id}
            style={[
              styles.collectionItem,
              { backgroundColor: colors.surface },
              selectedCollectionId === collection.id && styles.collectionItemSelected,
              selectedCollectionId === collection.id && { borderLeftColor: colors.primary }
            ]}
            onPress={() => handleSelectCollection(collection.id)}
          >
            <View style={styles.collectionItemLeft}>
              <View 
                style={[
                  styles.collectionIcon,
                  { backgroundColor: getCollectionColor(collection.name) }
                ]}
              >
                <Icon 
                  name={collection.is_public ? "folder-open" : "folder"} 
                  size={16} 
                  color="white" 
                />
              </View>
              
              <View style={styles.collectionInfo}>
                <Text style={[styles.collectionName, { color: colors.textPrimary }]}>
                  {collection.name}
                </Text>
                {collection.description && (
                  <Text style={[styles.collectionDescription, { color: colors.textSecondary }]}>
                    {collection.description}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.collectionItemRight}>
              <View style={[
                styles.radio,
                { borderColor: colors.textTertiary },
                selectedCollectionId === collection.id && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary 
                }
              ]}>
                {selectedCollectionId === collection.id && (
                  <Icon name="check" size={12} color="white" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Create New Collection Option */}
        {allowCreateNew && (
          <TouchableOpacity
            style={[
              styles.collectionItem,
              { backgroundColor: colors.surface },
              state.showCreateForm && styles.collectionItemSelected,
              state.showCreateForm && { borderLeftColor: colors.accent }
            ]}
            onPress={handleShowCreateForm}
          >
            <View style={styles.collectionItemLeft}>
              <View style={[styles.collectionIcon, { backgroundColor: colors.accent }]}>
                <Icon name="add" size={16} color="white" />
              </View>
              
              <View style={styles.collectionInfo}>
                <Text style={[styles.collectionName, { color: colors.textPrimary }]}>
                  Create New Collection
                </Text>
                <Text style={[styles.collectionDescription, { color: colors.textSecondary }]}>
                  Organize your links in a new collection
                </Text>
              </View>
            </View>
            
            <View style={styles.collectionItemRight}>
              <View style={[
                styles.radio,
                { borderColor: colors.textTertiary },
                state.showCreateForm && { 
                  backgroundColor: colors.accent,
                  borderColor: colors.accent 
                }
              ]}>
                {state.showCreateForm && (
                  <Icon name="check" size={12} color="white" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        
        {/* New Collection Form */}
        {state.showCreateForm && (
          <View style={[styles.newCollectionForm, { backgroundColor: colors.surfaceSecondary }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              placeholder="Collection name"
              placeholderTextColor={colors.textTertiary}
              value={state.newCollectionName}
              onChangeText={(text) => setState(prev => ({ ...prev, newCollectionName: text }))}
              autoFocus
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={state.newCollectionDescription}
              onChangeText={(text) => setState(prev => ({ ...prev, newCollectionDescription: text }))}
              multiline
              numberOfLines={2}
            />
            
            <View style={styles.createFormActions}>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.accent }]}
                onPress={handleCreateCollection}
                disabled={state.creating || !state.newCollectionName.trim()}
              >
                {state.creating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.textTertiary }]}
                onPress={() => setState(prev => ({ 
                  ...prev, 
                  showCreateForm: false,
                  newCollectionName: '',
                  newCollectionDescription: ''
                }))}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  collectionItemSelected: {
    borderLeftWidth: 4,
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
    marginRight: Spacing.md,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  collectionDescription: {
    ...Typography.caption,
    fontSize: 12,
  },
  collectionItemRight: {
    marginLeft: Spacing.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCollectionForm: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  input: {
    ...Typography.body,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 44,
  },
  createFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  createButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});

export default CollectionSelector;
