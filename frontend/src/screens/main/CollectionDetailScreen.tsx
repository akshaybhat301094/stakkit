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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Link, Collection } from '../../types/database';
import LinkCard from '../../components/LinkCard';
import { LinksLoadingSkeleton } from '../../components/LoadingCard';
import { LinksService } from '../../services/linksService';
import { useAppSelector } from '../../store/hooks';

type CollectionDetailScreenNavigationProp = StackNavigationProp<MainStackParamList, 'CollectionDetail'>;

interface CollectionDetailScreenState {
  links: Link[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

interface CollectionDetailRouteParams {
  collection: Collection & { linkCount: number };
}

const CollectionDetailScreen: React.FC = () => {
  const navigation = useNavigation<CollectionDetailScreenNavigationProp>();
  const route = useRoute();
  const { collection } = route.params as CollectionDetailRouteParams;
  const { isAuthenticated, user, session } = useAppSelector((state) => state.auth);
  const [state, setState] = useState<CollectionDetailScreenState>({
    links: [],
    loading: true,
    refreshing: false,
    error: null,
  });
  const fetchInProgressRef = useRef(false);

  const fetchCollectionLinks = async (isRefreshing = false) => {
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

      const collectionLinks = await LinksService.getLinksInCollection(collection.id);
      
      setState(prev => ({ 
        ...prev, 
        links: collectionLinks, 
        loading: false, 
        refreshing: false 
      }));
    } catch (error: any) {
      console.error('Error fetching collection links:', error);
      let errorMessage = 'Failed to load links. Please try again.';
      
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

  // Fetch links when screen loads
  useEffect(() => {
    fetchCollectionLinks();
  }, [collection.id]);

  // Refresh links when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Always refresh when screen comes into focus to ensure latest data
      if (!fetchInProgressRef.current) {
        fetchCollectionLinks();
      }
    }, [collection.id])
  );

  const handleRefresh = () => {
    fetchCollectionLinks(true);
  };

  const handleAddLink = () => {
    navigation.navigate('AddLink');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditLink = (link: Link) => {
    // Navigate to edit link screen (to be implemented)
    Alert.alert('Coming Soon', 'Link editing will be available soon!');
  };

  const handleDeleteLink = async (link: Link) => {
    try {
      await LinksService.deleteLink(link.id);
      setState(prev => ({
        ...prev,
        links: prev.links.filter(l => l.id !== link.id)
      }));
      Alert.alert('Success', 'Link deleted successfully');
    } catch (error) {
      console.error('Error deleting link:', error);
      Alert.alert('Error', 'Failed to delete link. Please try again.');
    }
  };

  const handleShareLink = async (link: Link) => {
    try {
      const shareContent = {
        message: `Check out this link: ${link.title || link.url}\n\n${link.url}`,
        url: link.url,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing link:', error);
      Alert.alert('Error', 'Failed to share link');
    }
  };

  const handleShareCollection = async () => {
    try {
      const shareContent = {
        message: `Check out my collection "${collection.name}" with ${collection.linkCount} ${collection.linkCount === 1 ? 'link' : 'links'}!`,
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

  const renderLinkCard = ({ item }: { item: Link }) => (
    <LinkCard
      link={item}
      onEdit={handleEditLink}
      onDelete={handleDeleteLink}
      onShare={handleShareLink}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bookmark-border" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No links in this collection</Text>
      <Text style={styles.emptyDescription}>
        Add links to "{collection.name}" to see them here
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddLink}>
        <Icon name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Link</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Unable to load links</Text>
      <Text style={styles.errorDescription}>{state.error}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchCollectionLinks()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      
      {(state.error?.includes('sign in') || state.error?.includes('session has expired')) && (
        <TouchableOpacity style={styles.signInButton} onPress={handleSignInAgain}>
          <Text style={styles.signInButtonText}>Sign In Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {collection.name}
          </Text>
          <TouchableOpacity onPress={handleShareCollection} style={styles.headerAction}>
            <Icon name="share" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Collection Info with Loading State */}
        <View style={styles.collectionInfo}>
          <View style={styles.collectionHeader}>
            <View style={[styles.collectionIcon, { backgroundColor: getCollectionColor() }]}>
              <Icon name={getCollectionIcon()} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.collectionDetails}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionMeta}>
                Loading links... • Created {formatDate(collection.created_at)}
              </Text>
            </View>
          </View>
          {collection.description && (
            <Text style={styles.collectionDescription}>{collection.description}</Text>
          )}
          {collection.is_public && (
            <View style={styles.publicBadge}>
              <Icon name="public" size={14} color="#007AFF" />
              <Text style={styles.publicBadgeText}>Public Collection</Text>
            </View>
          )}
        </View>
        
        <LinksLoadingSkeleton count={4} />
        
        <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
          <Icon name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {collection.name}
        </Text>
        <TouchableOpacity onPress={handleShareCollection} style={styles.headerAction}>
          <Icon name="share" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Collection Info */}
      <View style={styles.collectionInfo}>
        <View style={styles.collectionHeader}>
          <View style={[styles.collectionIcon, { backgroundColor: getCollectionColor() }]}>
            <Icon name={getCollectionIcon()} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.collectionDetails}>
            <Text style={styles.collectionName}>{collection.name}</Text>
            <Text style={styles.collectionMeta}>
              {state.links.length} {state.links.length === 1 ? 'link' : 'links'} • Created {formatDate(collection.created_at)}
            </Text>
          </View>
        </View>
        {collection.description && (
          <Text style={styles.collectionDescription}>{collection.description}</Text>
        )}
        {collection.is_public && (
          <View style={styles.publicBadge}>
            <Icon name="public" size={14} color="#007AFF" />
            <Text style={styles.publicBadgeText}>Public Collection</Text>
          </View>
        )}
      </View>

      {state.error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={state.links}
          renderItem={renderLinkCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            state.links.length === 0 && styles.emptyListContainer
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
      
      {/* Floating Action Button */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerAction: {
    padding: 8,
    marginRight: -8,
  },
  collectionInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  collectionDetails: {
    flex: 1,
  },
  collectionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  collectionMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  collectionDescription: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 12,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  publicBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 100, // Space for FAB
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
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

export default CollectionDetailScreen; 