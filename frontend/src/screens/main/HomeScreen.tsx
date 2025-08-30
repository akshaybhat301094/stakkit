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
import { Link, LinkWithCollections } from '../../types/database';
import ModernLinkCard from '../../components/ModernLinkCard';
import { LinksLoadingSkeleton } from '../../components/LoadingCard';
import { AddToCollectionModal } from '../../components/AddToCollectionModal';
import ShareTestButton from '../../components/ShareTestButton';
import { LinksService } from '../../services/linksService';
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

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

interface HomeScreenState {
  links: LinkWithCollections[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  showAddToCollectionModal: boolean;
  selectedLinkForCollection: LinkWithCollections | null;
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
  const { onScroll } = useScrollToHide();
  const { colors } = useTheme();

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

      const userLinks = await LinksService.getUserLinksWithCollections();
      
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

  const handleLinkPress = (link: LinkWithCollections) => {
    // Open link in browser
    import('expo-web-browser').then(({ openBrowserAsync }) => {
      openBrowserAsync(link.url).catch(err => {
        console.error('Failed to open URL:', err);
        Alert.alert('Error', 'Could not open link');
      });
    });
  };

  const handleLinkLongPress = (link: LinkWithCollections) => {
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

  const handleEditLink = (link: LinkWithCollections) => {
    navigation.navigate('EditLink', { link });
  };

  const handleDeleteLink = async (link: LinkWithCollections) => {
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

  const handleShareLink = async (link: LinkWithCollections) => {
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

  const handleAddToCollection = (link: LinkWithCollections) => {
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
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Icon name="bookmark" size={24} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{totalLinks}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Links</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Icon name="push-pin" size={24} color={colors.accent} />
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{pinnedLinks}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Pinned</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Icon name="schedule" size={24} color={colors.secondary} />
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{recentLinks}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>This Week</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="bookmark-border" size={64} color={colors.textLight} />
      </View>
      <View style={styles.emptyTextContainer}>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          No <Text style={styles.highlightText}>stakks</Text> yet!
        </Text>
        <Text style={[styles.emptyDescription, { color: colors.textPrimary }]}>
          Send <Text style={styles.highlightText}>reels</Text> you love{'\n'}
          and we will do the magic!
        </Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color={colors.warning} />
      <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Unable to load links</Text>
      <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>{state.error}</Text>
      
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => fetchLinks()}>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Links</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>Loading your saved links...</Text>
        </View>
        
        <LinksLoadingSkeleton count={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceSecondary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Links</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {state.links.length} {state.links.length === 1 ? 'link' : 'links'} saved
          </Text>
        </View>
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
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {state.links.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Quick Stats */}
              {renderQuickStats()}
              
              {/* Test Share Feature Button (Development) */}
              <View style={styles.testButtonContainer}>
                <ShareTestButton />
              </View>
              
              {/* Links Grid */}
              <View style={styles.gridContainer}>
                {renderLinksGrid()}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Remove FAB since we have the add button in the menu bar */}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg, // Changed from Spacing.md to match grid container
    marginBottom: Spacing.xl, // Increased from Spacing.lg for better separation
  },
  statCard: {
    flex: 1,
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
  },
  testButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    flex: 1,
  },
  emptyIconContainer: {
    marginBottom: Spacing.xl,
  },
  emptyTextContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.h1,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  highlightText: {
    color: '#FF69B4', // Pink color - brand color, keep static
  },
  emptyDescription: {
    ...Typography.body,
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 32,
  },
  addButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  addButtonText: {
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

export default HomeScreen; 