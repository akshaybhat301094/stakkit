import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  Alert,
  Share
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Collection } from '../../types/database';
import CollectionCard from '../../components/CollectionCard';
import { CollectionsService } from '../../services/collectionsService';
import { useAppSelector } from '../../store/hooks';

type CollectionsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

interface CollectionsScreenState {
  collections: (Collection & { linkCount: number })[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const CollectionsScreen: React.FC = () => {
  const navigation = useNavigation<CollectionsScreenNavigationProp>();
  const { isAuthenticated, user, session } = useAppSelector((state) => state.auth);
  const [state, setState] = useState<CollectionsScreenState>({
    collections: [],
    loading: true,
    refreshing: false,
    error: null,
  });
  const fetchInProgressRef = useRef(false);

  const fetchCollections = async (isRefreshing = false) => {
    if (fetchInProgressRef.current && !isRefreshing) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      
      setState(prev => ({ 
        ...prev, 
        loading: !isRefreshing, 
        refreshing: isRefreshing,
        error: null 
      }));

      const userCollections = await CollectionsService.getUserCollectionsWithCounts();
      
      setState(prev => ({ 
        ...prev, 
        collections: userCollections, 
        loading: false, 
        refreshing: false 
      }));
    } catch (error: any) {
      console.error('Error fetching collections:', error);
      let errorMessage = 'Failed to load collections. Please try again.';
      
      if (error.message.includes('User not authenticated') || error.message.includes('Authentication failed')) {
        errorMessage = 'You are not signed in. Please sign in again.';
      } else if (error.message.includes('JWT')) {
        errorMessage = 'Your session has expired. Please sign in again.';
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false, 
        refreshing: false 
      }));
    } finally {
      fetchInProgressRef.current = false;
    }
  };

  // Fetch collections when screen loads
  useEffect(() => {
    fetchCollections();
  }, []);

  // Refresh collections when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Always refresh when screen comes into focus to ensure latest data
      if (!fetchInProgressRef.current) {
        fetchCollections();
      }
    }, [])
  );

  const handleRefresh = () => {
    fetchCollections(true);
  };

  const handleAddLink = () => {
    navigation.navigate('AddLink');
  };

  const handleCreateCollection = () => {
    navigation.navigate('CreateCollection');
  };

  const handleCollectionPress = (collection: Collection) => {
    // Find the collection with linkCount from our state
    const collectionWithCount = state.collections.find(c => c.id === collection.id);
    if (collectionWithCount) {
      navigation.navigate('CollectionDetail', { collection: collectionWithCount });
    }
  };

  const handleEditCollection = (collection: Collection) => {
    Alert.alert('Coming Soon', 'Collection editing will be available soon!');
  };

  const handleDeleteCollection = async (collection: Collection) => {
    try {
      await CollectionsService.deleteCollection(collection.id);
      setState(prev => ({
        ...prev,
        collections: prev.collections.filter(c => c.id !== collection.id)
      }));
      Alert.alert('Success', 'Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      Alert.alert('Error', 'Failed to delete collection. Please try again.');
    }
  };

  const handleShareCollection = async (collection: Collection) => {
    try {
      // Find the collection with linkCount from our state
      const collectionWithCount = state.collections.find(c => c.id === collection.id);
      const linkCount = collectionWithCount?.linkCount || 0;
      
      const shareContent = {
        message: `Check out my collection "${collection.name}" with ${linkCount} ${linkCount === 1 ? 'link' : 'links'}!`,
        title: collection.name,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing collection:', error);
      Alert.alert('Error', 'Failed to share collection');
    }
  };

  const handleSignInAgain = () => {
    // Navigate back to auth flow
    navigation.navigate('Auth' as any);
  };

  const renderCollectionCard = ({ item }: { item: Collection & { linkCount: number } }) => (
    <CollectionCard
      collection={item}
      onPress={handleCollectionPress}
      onEdit={handleEditCollection}
      onDelete={handleDeleteCollection}
      onShare={handleShareCollection}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="folder-open" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No collections yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first collection to organize your saved links
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateCollection}>
        <Icon name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Collection</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Unable to load collections</Text>
      <Text style={styles.errorDescription}>{state.error}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchCollections()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      
      {(state.error?.includes('sign in') || state.error?.includes('session has expired')) && (
        <TouchableOpacity style={styles.signInButton} onPress={handleSignInAgain}>
          <Text style={styles.signInButtonText}>Sign In Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading your collections...</Text>
        </View>
        <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
          <Icon name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
        <Text style={styles.headerSubtitle}>
          {state.collections.length} {state.collections.length === 1 ? 'collection' : 'collections'}
        </Text>
      </View>

      {state.error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={state.collections}
          renderItem={renderCollectionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            state.collections.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Create Collection FAB - positioned differently than add link */}
      <TouchableOpacity 
        style={[styles.fab, { right: 80, backgroundColor: '#34C759' }]} 
        onPress={handleCreateCollection}
      >
        <Icon name="create-new-folder" size={22} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Link FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
        <Icon name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 100, // Space for FABs
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});

export default CollectionsScreen; 