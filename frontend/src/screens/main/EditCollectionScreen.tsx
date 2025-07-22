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
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Collection } from '../../types/database';
import { useAppSelector } from '../../store/hooks';
import { getSafeUserId } from '../../utils/authHelpers';
import CollectionsService from '../../services/collectionsService';

interface EditCollectionRouteParams {
  collection: Collection;
}

const EditCollectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { collection } = route.params as EditCollectionRouteParams;
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Form state
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || '');
  const [isPublic, setIsPublic] = useState(collection.is_public);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const hasNameChange = name.trim() !== collection.name;
    const hasDescriptionChange = description.trim() !== (collection.description || '');
    const hasPublicChange = isPublic !== collection.is_public;
    
    setHasChanges(hasNameChange || hasDescriptionChange || hasPublicChange);
  }, [name, description, isPublic, collection]);

  const validateName = (text: string): boolean => {
    setName(text);
    setNameError(null);
    
    if (text.trim().length === 0) {
      setNameError('Collection name is required');
      return false;
    }
    
    if (text.trim().length < 2) {
      setNameError('Collection name must be at least 2 characters');
      return false;
    }
    
    if (text.trim().length > 50) {
      setNameError('Collection name must be less than 50 characters');
      return false;
    }
    
    return true;
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

    // Validate form
    if (!validateName(name)) {
      return;
    }

    if (!hasChanges) {
      Alert.alert('No Changes', 'You haven\'t made any changes to save.');
      return;
    }

    try {
      setIsSaving(true);
      
      await CollectionsService.updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });

      Alert.alert('Success', 'Collection updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error updating collection:', error);
      Alert.alert('Error', `Failed to update collection: ${error.message}`);
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking session...</Text>
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
          
          <Text style={styles.headerTitle}>Edit Collection</Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={[
              styles.headerButton,
              (!hasChanges || nameError) && styles.headerButtonDisabled
            ]}
            disabled={!hasChanges || !!nameError || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[
                styles.saveText,
                (!hasChanges || nameError) && styles.saveTextDisabled
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Collection Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collection Name *</Text>
              <TextInput
                style={[styles.textInput, nameError && styles.textInputError]}
                value={name}
                onChangeText={validateName}
                placeholder="Enter collection name"
                maxLength={50}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
              <Text style={styles.characterCount}>
                {name.length}/50 characters
              </Text>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description to help you remember what this collection is for..."
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {description.length}/200 characters
              </Text>
            </View>

            {/* Public/Private Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabels}>
                  <Text style={styles.label}>Public Collection</Text>
                  <Text style={styles.switchDescription}>
                    {isPublic 
                      ? 'Anyone can view this collection and its links'
                      : 'Only you can view this collection'
                    }
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={[styles.previewIcon, { backgroundColor: '#007AFF' }]}>
                    <Icon name={isPublic ? 'public' : 'folder'} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.previewContent}>
                    <Text style={styles.previewName}>
                      {name.trim() || collection.name}
                    </Text>
                    <Text style={styles.previewCount}>Collection</Text>
                  </View>
                </View>
                {(description.trim() || collection.description) && (
                  <Text style={styles.previewDescription}>
                    {description.trim() || collection.description}
                  </Text>
                )}
                <View style={styles.previewFooter}>
                  <Text style={styles.previewDate}>Created {formatDate(collection.created_at)}</Text>
                  {isPublic && (
                    <View style={styles.previewBadge}>
                      <Icon name="public" size={10} color="#007AFF" />
                      <Text style={styles.previewBadgeText}>Public</Text>
                    </View>
                  )}
                </View>
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
  textInputError: {
    borderColor: '#FF3B30',
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
    minHeight: 80,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabels: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 18,
  },
  previewSection: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  previewCard: {
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
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  previewCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  previewDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewBadgeText: {
    fontSize: 10,
    color: '#007AFF',
    marginLeft: 2,
    fontWeight: '500',
  },
});

export default EditCollectionScreen; 