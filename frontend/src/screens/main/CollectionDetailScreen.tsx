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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Link, Collection } from '../../types/database';
import ModernLinkCard from '../../components/ModernLinkCard';
import { LinksLoadingSkeleton } from '../../components/LoadingCard';
import { AddToCollectionModal } from '../../components/AddToCollectionModal';
import { LinksService } from '../../services/linksService';
import { useAppSelector } from '../../store/hooks';
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  getCollectionColor,
  CommonStyles 
} from '../../components/DesignSystem';

type CollectionDetailScreenNavigationProp = StackNavigationProp<MainStackParamList, 'CollectionDetail'>;

interface CollectionDetailRouteParams {
  collection: Collection & { linkCount: number };
}

interface CollectionDetailScreenState {
  links: Link[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  showAddToCollectionModal: boolean;
  selectedLinkForCollection: Link | null;
}

const { width: screenWidth } = Dimensions.get('window');

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
    showAddToCollectionModal: false,
    selectedLinkForCollection: null,
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

  useEffect(() => {
    fetchCollectionLinks();
  }, [collection.id]);

  useFocusEffect(
    useCallback(() => {
      if (!fetchInProgressRef.current) {
        fetchCollectionLinks();
      }
    }, [collection.id])
  );

  const handleRefresh = () => {
    fetchCollectionLinks(true);
  };

  const handleAddLink = () => {
    navigation.navigate('AddLink', { selectedCollectionId: collection.id });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLinkPress = (link: Link) => {
    import('expo-web-browser').then(({ openBrowserAsync }) => {
      openBrowserAsync(link.url).catch(err => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open link');
      });
    });
  };

  const handleLinkLongPress = (link: Link) => {
    Alert.alert(
      link.title || 'Link Options',
      'What would you like to do with this link?',
      [
        { text: 'Edit', onPress: () => handleEditLink(link) },
        { text: 'Share', onPress: () => handleShareLink(link) },
        { text: 'Add to Collection', onPress: () => handleAddToCollection(link) },
        { text: 'Delete', onPress: () => handleDeleteLink(link), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEditLink = (link: Link) => {
    navigation.navigate('EditLink', { link });
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

  const handleAddToCollection = (link: Link) => {
    setState(prev => ({
      ...prev,
      showAddToCollectionModal: true,
      selectedLinkForCollection: link,
    }));
  };

  const handleCloseAddToCollectionModal = () => {
    setState(prev => ({
      ...prev,
      showAddToCollectionModal: false,
      selectedLinkForCollection: null,
    }));
  };

  const handleAddToCollectionSuccess = () => {
    fetchCollectionLinks(true);
  };

  const handleSignInAgain = () => {
    navigation.navigate('Auth' as any);
  };

  const renderLinksGrid = () => {
    const links = state.links;
    const rows: React.ReactElement[] = [];
    
    for (let i = 0; i < links.length; i += 2) {
      const rowLinks = links.slice(i, i + 2);
      
      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowLinks.map((link, index) => {
            return (
              <View key={link.id} style={styles.gridCard}>
                <ModernLinkCard
                  link={link}
                  onPress={handleLinkPress}
                  onLongPress={handleLinkLongPress}
                  size="medium"
                />
              </View>
            );
          })}
          {rowLinks.length === 1 && <View style={styles.gridCard} />}
        </View>
      );
    }
    
    return rows;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="bookmark-border" size={64} color={Colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No links yet</Text>
      <Text style={styles.emptyDescription}>
        Add links to "{collection.name}" to see them here
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddLink}>
        <Icon name="add" size={20} color={Colors.surface} />
        <Text style={styles.addButtonText}>Add Link</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color={Colors.warning} />
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const collectionColor = getCollectionColor(0); // Use first color for consistency

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {collection.name}
          </Text>
          <TouchableOpacity onPress={handleShareCollection} style={styles.headerAction}>
            <Icon name="share" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.collectionInfo}>
          <View style={styles.collectionHeader}>
            <View style={[styles.collectionIcon, { backgroundColor: collectionColor }]}>
              <Icon name={getCollectionIcon()} size={28} color={Colors.surface} />
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
              <Icon name="public" size={14} color={Colors.primary} />
              <Text style={styles.publicBadgeText}>Public Collection</Text>
            </View>
          )}
        </View>
        
        <LinksLoadingSkeleton count={4} />
        
        <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
          <Icon name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {collection.name}
        </Text>
        <TouchableOpacity onPress={handleShareCollection} style={styles.headerAction}>
          <Icon name="share" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.collectionInfo}>
        <View style={styles.collectionHeader}>
          <View style={[styles.collectionIcon, { backgroundColor: collectionColor }]}>
            <Icon name={getCollectionIcon()} size={28} color={Colors.surface} />
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
            <Icon name="public" size={14} color={Colors.primary} />
            <Text style={styles.publicBadgeText}>Public Collection</Text>
          </View>
        )}
      </View>

      {state.error ? (
        renderErrorState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            state.links.length === 0 && styles.emptyScrollContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {state.links.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.gridContainer}>
              {renderLinksGrid()}
            </View>
          )}
        </ScrollView>
      )}
      
      <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
        <Icon name="add" size={24} color={Colors.surface} />
      </TouchableOpacity>

      {state.showAddToCollectionModal && state.selectedLinkForCollection && (
        <AddToCollectionModal
          visible={state.showAddToCollectionModal}
          onClose={handleCloseAddToCollectionModal}
          link={state.selectedLinkForCollection}
          onSuccess={handleAddToCollectionSuccess}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, // Increased from Spacing.md
    paddingVertical: Spacing.md, // Increased from Spacing.sm
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.bodyBold,
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.lg, // Increased from Spacing.md
  },
  headerAction: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  collectionInfo: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl, // Increased from Spacing.lg
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md, // Increased from Spacing.sm
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg, // Increased from Spacing.md
  },
  collectionDetails: {
    flex: 1,
  },
  collectionName: {
    ...Typography.h3,
    marginBottom: Spacing.sm, // Increased from Spacing.xs
  },
  collectionMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  collectionDescription: {
    ...Typography.body,
    marginBottom: Spacing.lg, // Increased from Spacing.sm
    lineHeight: 22, // Added line height for better readability
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md, // Increased from Spacing.sm
    paddingVertical: Spacing.sm, // Increased from Spacing.xs
    borderRadius: BorderRadius.md, // Increased from BorderRadius.sm
    alignSelf: 'flex-start',
    marginTop: Spacing.sm, // Added margin top for better separation
  },
  publicBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    marginLeft: Spacing.sm, // Increased from Spacing.xs
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: 120, // Increased from 100 to give more space for FAB
  },
  emptyScrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg, // Increased from Spacing.md
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg, // Increased from Spacing.md
    paddingHorizontal: 0, // Removed horizontal padding
  },
  gridCard: {
    width: (screenWidth - (Spacing.lg * 2) - Spacing.lg) / 2, // Adjusted for better spacing
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  signInButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 40, // Increased from 30 for better spacing
    right: 24, // Increased from 20 for better spacing
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
    elevation: 8, // Added elevation for Android
  },
});

export default CollectionDetailScreen; 