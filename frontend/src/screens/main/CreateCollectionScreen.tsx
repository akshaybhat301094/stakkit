import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { getSafeUserId } from '../../utils/authHelpers';
import CollectionsService from '../../services/collectionsService';

const CreateCollectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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

    try {
      setIsSaving(true);
      
      await CollectionsService.createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      }, safeUserId);

      Alert.alert('Success', 'Collection created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', `Failed to create collection: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (name.trim() || description.trim()) {
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
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Icon name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Collection</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, styles.saveButton]}
            disabled={!name.trim() || !!nameError || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[styles.saveButtonText, (!name.trim() || !!nameError) && styles.saveButtonTextDisabled]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Collection Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collection Name *</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name}
              onChangeText={validateName}
              placeholder="e.g., Weekend Reading, Recipe Ideas"
              placeholderTextColor="#8E8E93"
              returnKeyType="next"
              maxLength={50}
            />
            {nameError && (
              <Text style={styles.errorText}>{nameError}</Text>
            )}
            <Text style={styles.helpText}>
              {name.length}/50 characters
            </Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description to help you remember what this collection is for..."
              placeholderTextColor="#8E8E93"
              multiline={true}
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.helpText}>
              {description.length}/200 characters
            </Text>
          </View>

          {/* Privacy Settings */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Text style={styles.label}>Make Public</Text>
                <Text style={styles.helpText}>
                  Public collections can be viewed by anyone with the link
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor={isPublic ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor="#E5E5EA"
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
                    {name.trim() || 'Collection Name'}
                  </Text>
                  <Text style={styles.previewCount}>0 links</Text>
                </View>
              </View>
              {(description.trim() || !name.trim()) && (
                <Text style={styles.previewDescription}>
                  {description.trim() || 'Add a description to help you remember what this collection is for...'}
                </Text>
              )}
              <View style={styles.previewFooter}>
                <Text style={styles.previewDate}>Created just now</Text>
                {isPublic && (
                  <View style={styles.previewBadge}>
                    <Icon name="public" size={10} color="#007AFF" />
                    <Text style={styles.previewBadgeText}>Public</Text>
                  </View>
                )}
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
    backgroundColor: '#ffffff',
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
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
    color: '#FF3B30',
  },
  helpText: {
    marginTop: 4,
    fontSize: 12,
    color: '#8E8E93',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  previewSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  previewCount: {
    fontSize: 11,
    color: '#8E8E93',
  },
  previewDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDate: {
    fontSize: 11,
    color: '#8E8E93',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  previewBadgeText: {
    fontSize: 9,
    color: '#007AFF',
    marginLeft: 2,
    fontWeight: '500',
  },
});

export default CreateCollectionScreen; 