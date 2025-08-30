import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Collection } from '../../types/database';
import ModernCollectionCard from '../../components/ModernCollectionCard';
import { CollectionLoadingSkeleton } from '../../components/LoadingCard';
import EmptyState from '../../components/EmptyState';
import ShareTestButton from '../../components/ShareTestButton';
import { CollectionsService } from '../../services/collectionsService';
import { useAppSelector } from '../../store/hooks';
import { 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  CommonStyles 
} from '../../components/DesignSystem';
import { useScrollToHide } from '../../hooks/useScrollToHide';
import { useTheme } from '../../hooks/useTheme';

type CollectionsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

interface CollectionsScreenState {
  collections: (Collection & { linkCount: number })[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

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
  const { onScroll } = useScrollToHide();
  const { colors } = useTheme();

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

  useEffect(() => {
    fetchCollections();
  }, []);

  useFocusEffect(
    useCallback(() => {
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
    const collectionWithCount = state.collections.find(c => c.id === collection.id);
    if (collectionWithCount) {
      navigation.navigate('CollectionDetail', { collection: collectionWithCount });
    }
  };

  const handleEditCollection = (collection: Collection) => {
    navigation.navigate('EditCollection', { collection });
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

  const handleCollectionLongPress = (collection: Collection) => {
    Alert.alert(
      collection.name,
      'What would you like to do with this collection?',
      [
        { text: 'Edit', onPress: () => handleEditCollection(collection) },
        { text: 'Share', onPress: () => handleShareCollection(collection) },
        { 
          text: 'Delete', 
          onPress: () => confirmDeleteCollection(collection), 
          style: 'destructive' 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmDeleteCollection = (collection: Collection) => {
    const collectionWithCount = state.collections.find(c => c.id === collection.id);
    const linkCount = collectionWithCount?.linkCount || 0;
    
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"?${
        linkCount > 0 
          ? `\n\nThis will remove ${linkCount} link${linkCount > 1 ? 's' : ''} from this collection, but the links themselves will remain saved.`
          : ''
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => handleDeleteCollection(collection) 
        },
      ]
    );
  };

  const handleShareCollection = async (collection: Collection) => {
    try {
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
    navigation.navigate('Auth' as any);
  };

  const renderCollectionGrid = () => {
    const collections = state.collections;
    const rows: React.ReactElement[] = [];
    
    // Simple 2-column grid layout like in the screenshot
    for (let i = 0; i < collections.length; i += 2) {
      const rowCollections = collections.slice(i, i + 2);
      
      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowCollections.map((collection, index) => {
            const globalIndex = i + index;
            
            return (
              <View key={collection.id} style={styles.gridCard}>
                <ModernCollectionCard
                  collection={collection}
                  onPress={handleCollectionPress}
                  onLongPress={handleCollectionLongPress}
                  size="medium"
                  index={globalIndex}
                />
              </View>
            );
          })}
          {/* Add empty space if odd number of collections */}
          {rowCollections.length === 1 && <View style={styles.gridCard} />}
        </View>
      );
    }
    
    return rows;
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="folder-open"
      title="Start organizing"
      description="Create collections to organize your saved links by topic, project, or any way you like."
      buttonText="Create Collection"
      onButtonPress={handleCreateCollection}
    />
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color={colors.warning} />
      <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Unable to load collections</Text>
      <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>{state.error}</Text>
      
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => fetchCollections()}>
        <Text style={[styles.retryButtonText, { color: colors.surface }]}>Try Again</Text>
      </TouchableOpacity>
      
      {(state.error?.includes('sign in') || state.error?.includes('session has expired')) && (
        <TouchableOpacity style={[styles.signInButton, { backgroundColor: colors.warning }]} onPress={handleSignInAgain}>
          <Text style={[styles.signInButtonText, { color: colors.surface }]}>Sign In Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (state.loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Collections</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>Loading your collections...</Text>
        </View>
        
        <CollectionLoadingSkeleton count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Collections</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {state.collections.length} {state.collections.length === 1 ? 'collection' : 'collections'}
          </Text>
        </View>
        
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surfaceSecondary }]} onPress={handleCreateCollection}>
          <Icon name="create-new-folder" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {state.error ? (
        renderErrorState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            state.collections.length === 0 && styles.emptyScrollContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {state.collections.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Test Share Feature Button (Development) */}
              <View style={styles.testButtonContainer}>
                <ShareTestButton />
              </View>
              
              <View style={styles.gridContainer}>
                {renderCollectionGrid()}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Remove the FAB since we have the add button in the menu bar */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h1,
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.caption,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: 120, // Increased padding for floating menu bar
  },
  emptyScrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  testButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  gridContainer: {
    paddingHorizontal: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  gridCard: {
    width: (screenWidth - (Spacing.md * 2)) / 2, // For 2-column grid
    paddingHorizontal: Spacing.sm / 2, // Add gap between cards
  },

  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h3,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  signInButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
});

export default CollectionsScreen; 