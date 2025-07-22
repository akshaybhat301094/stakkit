import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Link, Collection } from '../../types/database';
import { useAppSelector } from '../../store/hooks';
import { getSafeUserId } from '../../utils/authHelpers';
import { LinksService } from '../../services/linksService';
import { CollectionsService } from '../../services/collectionsService';

interface EditLinkRouteParams {
  link: Link & { collections?: Collection[] };
}

const EditLinkScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { link } = route.params as EditLinkRouteParams;
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Form state
  const [title, setTitle] = useState(link.title || '');
  const [notes, setNotes] = useState(link.notes || '');
  const [isPinned, setIsPinned] = useState(link.is_pinned || false);
  
  // Collection state
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    link.collections?.map(c => c.id) || []
  );
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  // Track changes
  useEffect(() => {
    const hasTitleChange = title.trim() !== (link.title || '');
    const hasNotesChange = notes.trim() !== (link.notes || '');
    const hasPinnedChange = isPinned !== link.is_pinned;
    
    // Check collection changes
    const originalCollectionIds = link.collections?.map(c => c.id) || [];
    const hasCollectionChanges = 
      selectedCollectionIds.length !== originalCollectionIds.length ||
      selectedCollectionIds.some(id => !originalCollectionIds.includes(id)) ||
      originalCollectionIds.some(id => !selectedCollectionIds.includes(id));
    
    setHasChanges(hasTitleChange || hasNotesChange || hasPinnedChange || hasCollectionChanges);
  }, [title, notes, isPinned, selectedCollectionIds, link]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const collections = await CollectionsService.getUserCollections();
      setAllCollections(collections);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No active session found.');
      return;
    }

    const safeUserId = getSafeUserId(user.id);
    if (!safeUserId) {
      Alert.alert('Session Error', 'Invalid session. Please restart the app.');
      return;
    }

    if (!hasChanges) {
      Alert.alert('No Changes', 'You haven\'t made any changes to save.');
      return;
    }

    try {
      setIsSaving(true);
      
      // Update link basic info
      await LinksService.updateLink(link.id, {
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        is_pinned: isPinned,
      });

      // Handle collection changes
      const originalCollectionIds = link.collections?.map(c => c.id) || [];
      const toAdd = selectedCollectionIds.filter(id => !originalCollectionIds.includes(id));
      const toRemove = originalCollectionIds.filter(id => !selectedCollectionIds.includes(id));

      // Add to new collections
      if (toAdd.length > 0) {
        await LinksService.addLinkToCollections(link.id, toAdd);
      }

      // Remove from old collections
      if (toRemove.length > 0) {
        for (const collectionId of toRemove) {
          await LinksService.removeLinkFromCollection(link.id, collectionId);
        }
      }

      Alert.alert('Success', 'Link updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error updating link:', error);
      Alert.alert('Error', `Failed to update link: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollectionIds(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
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
    switch (platform?.toLowerCase()) {
      case 'youtube': return 'play-circle-filled';
      case 'instagram': return 'photo-camera';
      case 'tiktok': return 'music-note';
      case 'twitter': return 'alternate-email';
      case 'linkedin': return 'business';
      case 'facebook': return 'thumb-up';
      case 'github': return 'code';
      default: return 'language';
    }
  };

  if (!user?.id || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Edit Link</Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={[
              styles.headerButton,
              !hasChanges && styles.headerButtonDisabled
            ]}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[
                styles.saveText,
                !hasChanges && styles.saveTextDisabled
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Link Preview */}
            <View style={styles.linkPreview}>
              {link.image_url && !imageError && (
                <Image
                  source={{ uri: link.image_url }}
                  style={styles.linkImage}
                  onError={() => setImageError(true)}
                />
              )}
              {(!link.image_url || imageError) && (
                <View style={styles.linkImagePlaceholder}>
                  <Icon 
                    name={getPlatformIcon(link.platform)} 
                    size={32} 
                    color="#8E8E93" 
                  />
                </View>
              )}
              
              <View style={styles.linkInfo}>
                <Text style={styles.linkUrl} numberOfLines={1}>
                  {getDomainFromUrl(link.url)}
                </Text>
                <Text style={styles.linkDomain} numberOfLines={1}>
                  {link.url}
                </Text>
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter link title"
                maxLength={200}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <Text style={styles.characterCount}>
                {title.length}/200 characters
              </Text>
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add your notes about this link..."
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {notes.length}/500 characters
              </Text>
            </View>

            {/* Pin Toggle */}
            <View style={styles.inputGroup}>
              <TouchableOpacity 
                style={styles.toggleRow}
                onPress={() => setIsPinned(!isPinned)}
              >
                <View style={styles.toggleLabels}>
                  <Text style={styles.label}>Pin this link</Text>
                  <Text style={styles.toggleDescription}>
                    Pinned links appear at the top of your lists
                  </Text>
                </View>
                <View style={[styles.toggle, isPinned && styles.toggleActive]}>
                  {isPinned && (
                    <Icon name="push-pin" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Collections */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collections</Text>
              <TouchableOpacity 
                style={styles.collectionToggle}
                onPress={() => setShowCollectionPicker(!showCollectionPicker)}
              >
                <Text style={styles.collectionToggleText}>
                  {selectedCollectionIds.length === 0 
                    ? 'No collections selected' 
                    : `${selectedCollectionIds.length} collection${selectedCollectionIds.length === 1 ? '' : 's'} selected`
                  }
                </Text>
                <Icon 
                  name={showCollectionPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                  size={24} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
              
              {showCollectionPicker && (
                <View style={styles.collectionList}>
                  {allCollections.map((collection) => (
                    <TouchableOpacity
                      key={collection.id}
                      style={styles.collectionItem}
                      onPress={() => toggleCollection(collection.id)}
                    >
                      <View style={styles.collectionItemLeft}>
                        <View style={styles.collectionIcon}>
                          <Icon 
                            name={collection.is_public ? 'public' : 'folder'} 
                            size={16} 
                            color="#007AFF" 
                          />
                        </View>
                        <View style={styles.collectionItemInfo}>
                          <Text style={styles.collectionName}>
                            {collection.name}
                          </Text>
                          {collection.description && (
                            <Text style={styles.collectionDescription}>
                              {collection.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View style={[
                        styles.checkbox,
                        selectedCollectionIds.includes(collection.id) && styles.checkboxSelected,
                      ]}>
                        {selectedCollectionIds.includes(collection.id) && (
                          <Icon name="check" size={16} color="white" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Metadata Info */}
            <View style={styles.metadataSection}>
              <Text style={styles.metadataTitle}>Link Information</Text>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Created:</Text>
                <Text style={styles.metadataValue}>{formatDate(link.created_at)}</Text>
              </View>
              {link.platform && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Platform:</Text>
                  <Text style={styles.metadataValue}>{link.platform}</Text>
                </View>
              )}
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>URL:</Text>
                <Text style={styles.metadataValueUrl} numberOfLines={2}>{link.url}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  saveTextDisabled: {
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  linkPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  linkImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  linkImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  linkInfo: {
    flex: 1,
  },
  linkUrl: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  linkDomain: {
    fontSize: 14,
    color: '#8E8E93',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  toggleLabels: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 18,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  collectionToggle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionToggleText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  collectionList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectionItemInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  collectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  metadataSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    width: 80,
  },
  metadataValue: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  metadataValueUrl: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
});

export default EditLinkScreen; 