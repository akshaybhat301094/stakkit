import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { MainStackParamList } from '../../navigation/MainNavigator';

// Import services and utilities
import { validateURL, extractURLsFromText, getDomainFromURL } from '../../utils/urlValidation';
import { getSafeUserId } from '../../utils/authHelpers';
import CollectionsService from '../../services/collectionsService';
import LinksService from '../../services/linksService';
import LinkMetadataService from '../../services/linkMetadataService';
import { Collection } from '../../types/database';
import { LinkPreview } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface AddLinkScreenProps {}

const AddLinkScreen: React.FC<AddLinkScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCollectionId: paramCollectionId } = (route.params as MainStackParamList['AddLink']) || {};
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { colors } = useTheme();
  
  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  
  // Preview state
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load collections on mount
  useEffect(() => {
    console.log('Auth state check:', { isAuthenticated, userId: user?.id });
    
    if (!user?.id) {
      console.log('No user ID available, redirecting...');
      Alert.alert('Authentication Required', 'Please sign in to add links.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    loadCollections();
    checkClipboard();
  }, [isAuthenticated, user]);

  const loadCollections = async () => {
    if (!user?.id) return;
    
    const safeUserId = getSafeUserId(user.id);
    if (!safeUserId) {
      Alert.alert('Session Error', 'Invalid session. Please restart the app.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    try {
      console.log('Loading collections for user:', safeUserId);
      setIsLoading(true);
      const userCollections = await CollectionsService.getUserCollections(safeUserId);
      console.log('Loaded collections:', userCollections.length);
      setCollections(userCollections);
      
      // Auto-select collection: prioritize passed parameter, then first collection, then create default
      if (paramCollectionId && userCollections.find(c => c.id === paramCollectionId)) {
        // Use the passed collection ID if it exists in user's collections
        console.log('Pre-selecting collection from parameter:', paramCollectionId);
        setSelectedCollectionId(paramCollectionId);
      } else if (userCollections.length > 0) {
        // Fallback to first collection
        setSelectedCollectionId(userCollections[0].id);
      } else {
        console.log('No collections found, creating default...');
        // Create default collection
        const defaultCollection = await CollectionsService.getOrCreateDefaultCollection(safeUserId);
        console.log('Created default collection:', defaultCollection.id);
        setCollections([defaultCollection]);
        setSelectedCollectionId(defaultCollection.id);
      }
    } catch (error: any) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', `Failed to load collections: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      const urls = extractURLsFromText(clipboardContent);
      
      if (urls.length > 0) {
        setClipboardUrl(urls[0]);
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
    }
  };

  const handleURLChange = useCallback((text: string) => {
    setUrl(text);
    
    // Clear previous errors and preview
    setUrlError(null);
    setPreview(null);
    
    // Validate URL if not empty
    if (text.trim()) {
      const validation = validateURL(text);
      if (!validation.isValid) {
        setUrlError(validation.error || 'Invalid URL');
      } else {
        // Fetch metadata for valid URL
        fetchLinkPreview(validation.normalizedUrl || text);
      }
    }
  }, []);

  const fetchLinkPreview = async (validUrl: string) => {
    try {
      setIsLoadingPreview(true);
      const metadata = await LinkMetadataService.getMetadata(validUrl);
      setPreview(metadata);
      
      // Auto-fill title if empty and metadata has title
      if (!title.trim() && metadata.title) {
        setTitle(metadata.title);
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
      // Fallback to domain name
      if (!title.trim()) {
        const domain = getDomainFromURL(validUrl);
        setTitle(domain);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePasteFromClipboard = () => {
    if (clipboardUrl) {
      setUrl(clipboardUrl);
      handleURLChange(clipboardUrl);
      setClipboardUrl(null);
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

    try {
      setIsSaving(true);
      
      // Validate URL
      const validation = validateURL(url);
      if (!validation.isValid) {
        setUrlError(validation.error || 'Invalid URL');
        return;
      }

      // Check for duplicates
      const existingLink = await LinksService.checkDuplicateURL(validation.normalizedUrl!, safeUserId);
      if (existingLink) {
        Alert.alert(
          'Duplicate Link',
          'This URL has already been saved. Do you want to save it again?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save Anyway', onPress: () => saveLink(validation.normalizedUrl!, safeUserId) }
          ]
        );
        return;
      }
      await saveLink(validation.normalizedUrl!, safeUserId);
    } catch (error: any) {
      console.error('Error saving link:', error);
      Alert.alert('Error', `Failed to save link: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveLink = async (normalizedUrl: string, userId: string) => {
    try {
      await LinksService.saveLink({
        url: normalizedUrl,
        title: title.trim() || preview?.title || getDomainFromURL(normalizedUrl),
        description: preview?.description,
        image_url: preview?.image,
        platform: preview?.platform,
        notes: notes.trim() || undefined,
        collectionIds: selectedCollectionId ? [selectedCollectionId] : undefined,
      }, userId);

      Alert.alert('Success', 'Link saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      throw error;
    }
  };

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  if (!user?.id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Checking session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.surfaceSecondary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Link</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, styles.saveButton]}
            disabled={!url.trim() || !!urlError || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[
                styles.saveButtonText, 
                { color: colors.primary },
                (!url.trim() || !!urlError) && { color: colors.textTertiary }
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Clipboard suggestion */}
          {clipboardUrl && (
            <TouchableOpacity style={[styles.clipboardSuggestion, { backgroundColor: colors.surfaceSecondary }]} onPress={handlePasteFromClipboard}>
              <Icon name="content-paste" size={20} color={colors.primary} />
              <Text style={[styles.clipboardText, { color: colors.primary }]}>Paste: {clipboardUrl}</Text>
            </TouchableOpacity>
          )}

          {/* URL Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>URL *</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary },
                urlError && { borderColor: colors.warning }
              ]}
              value={url}
              onChangeText={handleURLChange}
              placeholder="https://example.com"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
            />
            {urlError && (
              <Text style={[styles.urlErrorText, { color: colors.warning }]}>{urlError}</Text>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Title</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Link title (auto-generated from domain)"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
            />
          </View>

          {/* Collection Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collection</Text>
            <TouchableOpacity 
              style={styles.collectionSelector}
              onPress={() => setShowCollectionPicker(!showCollectionPicker)}
            >
              <Text style={styles.collectionSelectorText}>
                {selectedCollection ? selectedCollection.name : 'Select Collection'}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color="#8E8E93" />
            </TouchableOpacity>
            
            {showCollectionPicker && (
              <View style={styles.collectionPicker}>
                {collections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={[
                      styles.collectionOption,
                      collection.id === selectedCollectionId && styles.collectionOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedCollectionId(collection.id);
                      setShowCollectionPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.collectionOptionText,
                      collection.id === selectedCollectionId && styles.collectionOptionTextSelected
                    ]}>
                      {collection.name}
                    </Text>
                    {collection.id === selectedCollectionId && (
                      <Icon name="check" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add your notes here..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    // Handled dynamically
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clipboardSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  clipboardText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    // Handled dynamically
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  urlErrorText: {
    marginTop: 4,
    fontSize: 14,
  },
  collectionSelector: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionSelectorText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  collectionPicker: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  collectionOptionSelected: {
    backgroundColor: '#F2F2F7',
  },
  collectionOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  collectionOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default AddLinkScreen; 