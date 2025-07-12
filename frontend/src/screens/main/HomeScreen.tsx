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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Link } from '../../types/database';
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
  CommonStyles 
} from '../../components/DesignSystem';

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

interface HomeScreenState {
  links: Link[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  showAddToCollectionModal: boolean;
  selectedLinkForCollection: Link | null;
}

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAuthenticated, user, session } = useAppSelector((state) => state.auth);
  const [state, setState] = useState<HomeScreenState>({
    links: [],
    loading: true,
    refreshing: false,
    error: null,
    showAddToCollectionModal: false,
    selectedLinkForCollection: null,
  });
  const fetchInProgressRef = useRef(false);

  const fetchLinks = async (isRefreshing = false) => {
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

      const userLinks = await LinksService.getUserLinks();
      
      setState(prev => ({ 
        ...prev, 
        links: userLinks, 
        loading: false, 
        refreshing: false 
      }));
    } catch (error: any) {
      console.error('Error fetching links:', error);
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
    fetchLinks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!fetchInProgressRef.current) {
        fetchLinks();
      }
    }, [])
  );

  const handleRefresh = () => {
    fetchLinks(true);
  };

  const handleAddLink = () => {
    navigation.navigate('AddLink');
  };

  const handleLinkPress = (link: Link) => {
    // Open link in browser
    import('react-native').then(({ Linking }) => {
      Linking.openURL(link.url).catch(err => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open link');
      });
    });
  };

  const handleLinkLongPress = (link: Link) => {
    // Show action sheet with options
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
    fetchLinks(true);
  };

  const handleSignInAgain = () => {
    navigation.navigate('Auth' as any);
  };

  const renderLinksGrid = () => {
    const links = state.links;
    const rows: React.ReactElement[] = [];
    
    // Simple 2-column grid layout
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
          {/* Add empty space if odd number of links */}
          {rowLinks.length === 1 && <View style={styles.gridCard} />}
        </View>
      );
    }
    
    return rows;
  };

  const renderQuickStats = () => {
    const totalLinks = state.links.length;
    const pinnedLinks = state.links.filter(link => link.is_pinned).length;
    const recentLinks = state.links.filter(link => {
      const linkDate = new Date(link.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return linkDate > weekAgo;
    }).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="bookmark" size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{totalLinks}</Text>
          <Text style={styles.statLabel}>Total Links</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="push-pin" size={24} color={Colors.accent} />
          <Text style={styles.statNumber}>{pinnedLinks}</Text>
          <Text style={styles.statLabel}>Pinned</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="schedule" size={24} color={Colors.secondary} />
          <Text style={styles.statNumber}>{recentLinks}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="bookmark-border" size={64} color={Colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Start saving links</Text>
      <Text style={styles.emptyDescription}>
        Save interesting articles, videos, and resources to access them later from anywhere.
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddLink}>
        <Icon name="add" size={20} color={Colors.surface} />
        <Text style={styles.addButtonText}>Add Your First Link</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color={Colors.warning} />
      <Text style={styles.errorTitle}>Unable to load links</Text>
      <Text style={styles.errorDescription}>{state.error}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchLinks()}>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Links</Text>
          <Text style={styles.headerSubtitle}>Loading your saved links...</Text>
        </View>
        
        <LinksLoadingSkeleton count={6} />
        
        <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
          <Icon name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Links</Text>
          <Text style={styles.headerSubtitle}>
            {state.links.length} {state.links.length === 1 ? 'link' : 'links'} saved
          </Text>
        </View>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleAddLink}>
          <Icon name="add" size={24} color={Colors.primary} />
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
            <>
              {/* Quick Stats */}
              {renderQuickStats()}
              
              {/* Links Grid */}
              <View style={styles.gridContainer}>
                {renderLinksGrid()}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
        <Icon name="add" size={24} color={Colors.surface} />
      </TouchableOpacity>

      {/* Add to Collection Modal */}
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
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  headerTitle: {
    ...Typography.h1,
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: 120, // Increased from 100 to match CollectionDetailScreen
  },
  emptyScrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg, // Changed from Spacing.md to match grid container
    marginBottom: Spacing.xl, // Increased from Spacing.lg for better separation
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    ...Shadows.small,
  },
  statNumber: {
    ...Typography.h2,
    fontSize: 20,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg, // Changed from Spacing.md to match CollectionDetailScreen
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg, // Changed from Spacing.md to match CollectionDetailScreen
    paddingHorizontal: 0, // Removed horizontal padding like CollectionDetailScreen
  },
  gridCard: {
    width: (screenWidth - (Spacing.lg * 2) - Spacing.md) / 2, // Updated to match CollectionDetailScreen calculation
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
    lineHeight: 24,
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
    bottom: 40, // Increased from 30 to match CollectionDetailScreen
    right: 24, // Increased from 20 to match CollectionDetailScreen
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
    elevation: 8, // Added elevation for Android consistency
  },
});

export default HomeScreen; 