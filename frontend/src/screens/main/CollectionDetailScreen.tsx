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
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  getCollectionColor,
  CommonStyles 
} from '../../components/DesignSystem';
import { useTheme } from '../../hooks/useTheme';

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
  const { colors } = useTheme();

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
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Icon name="bookmark-border" size={64} color={colors.textLight} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No links yet</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Add links to "{collection.name}" to see them here
      </Text>
      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddLink}>
        <Icon name="add" size={20} color={colors.surface} />
        <Text style={[styles.addButtonText, { color: colors.surface }]}>Add Link</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color={colors.warning} />
      <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Unable to load links</Text>
      <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>{state.error}</Text>
      
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => fetchCollectionLinks()}>
        <Text style={[styles.retryButtonText, { color: colors.surface }]}>Try Again</Text>
      </TouchableOpacity>
      
      {(state.error?.includes('sign in') || state.error?.includes('session has expired')) && (
        <TouchableOpacity style={[styles.signInButton, { backgroundColor: colors.warning }]} onPress={handleSignInAgain}>
          <Text style={[styles.signInButtonText, { color: colors.surface }]}>Sign In Again</Text>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {collection.name}
          </Text>
          <TouchableOpacity onPress={handleShareCollection} style={styles.headerAction}>
            <Icon name="share" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.collectionInfo, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
          <View style={styles.collectionHeader}>
            <View style={[styles.collectionIcon, { backgroundColor: collectionColor }]}>
              <Icon name={getCollectionIcon()} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.collectionDetails}>
              <Text style={[styles.collectionName, { color: colors.textPrimary }]}>{collection.name}</Text>
              <Text style={[styles.collectionMeta, { color: colors.textTertiary }]}>
                Loading links... • Created {formatDate(collection.created_at)}
              </Text>
            </View>
          </View>
          {collection.description && (
            <Text style={[styles.collectionDescription, { color: colors.textSecondary }]}>{collection.description}</Text>
          )}
          {collection.is_public && (
            <View style={styles.publicBadge}>
              <Icon name="public" size={14} color={colors.primary} />
              <Text style={[styles.publicBadgeText, { color: colors.primary }]}>Public Collection</Text>
            </View>
          )}
        </View>
        
        <LinksLoadingSkeleton count={4} />
        
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleAddLink}>
          <Icon name="add" size={24} color={colors.surface} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {collection.name}
        </Text>
        <TouchableOpacity onPress={handleShareCollection} style={styles.headerAction}>
          <Icon name="share" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.collectionInfo, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
        <View style={styles.collectionHeader}>
          <View style={[styles.collectionIcon, { backgroundColor: collectionColor }]}>
            <Icon name={getCollectionIcon()} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.collectionDetails}>
            <Text style={[styles.collectionName, { color: colors.textPrimary }]}>{collection.name}</Text>
            <Text style={[styles.collectionMeta, { color: colors.textTertiary }]}>
              {state.links.length} {state.links.length === 1 ? 'link' : 'links'} • Created {formatDate(collection.created_at)}
            </Text>
          </View>
        </View>
        {collection.description && (
          <Text style={[styles.collectionDescription, { color: colors.textSecondary }]}>{collection.description}</Text>
        )}
        {collection.is_public && (
          <View style={styles.publicBadge}>
            <Icon name="public" size={14} color={colors.primary} />
            <Text style={[styles.publicBadgeText, { color: colors.primary }]}>Public Collection</Text>
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
              colors={[colors.primary]}
              tintColor={colors.primary}
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
      
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleAddLink}>
        <Icon name="add" size={24} color={colors.surface} />
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
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
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
    padding: Spacing.xl,
    borderBottomWidth: 1,
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
  },
  collectionDescription: {
    ...Typography.body,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: handled dynamically,
    paddingHorizontal: Spacing.md, // Increased from Spacing.sm
    paddingVertical: Spacing.sm, // Increased from Spacing.xs
    borderRadius: BorderRadius.md, // Increased from BorderRadius.sm
    alignSelf: 'flex-start',
    marginTop: Spacing.sm, // Added margin top for better separation
  },
  publicBadgeText: {
    ...Typography.labelSmall,
    // color: handled dynamically,
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
    // backgroundColor: handled dynamically,
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
    // backgroundColor: handled dynamically,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  addButtonText: {
    // color: handled dynamically,
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
    bottom: 40,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
    elevation: 8,
  },
});

export default CollectionDetailScreen; 