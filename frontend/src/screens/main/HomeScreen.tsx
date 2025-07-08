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
import { Link } from '../../types/database';
import LinkCard from '../../components/LinkCard';
import { LinksService } from '../../services/linksService';
import { useAppSelector } from '../../store/hooks';


type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

interface HomeScreenState {
  links: Link[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAuthenticated, user, session } = useAppSelector((state) => state.auth);
  const [state, setState] = useState<HomeScreenState>({
    links: [],
    loading: true,
    refreshing: false,
    error: null,
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

  // Fetch links when screen loads
  useEffect(() => {
    fetchLinks();
  }, []);

  // Refresh links when screen comes into focus (useful when returning from AddLinkScreen)
  useFocusEffect(
    useCallback(() => {
      // Only fetch if not currently loading and not already fetching
      if (!state.loading && !fetchInProgressRef.current && state.links.length === 0) {
        fetchLinks();
      }
    }, [state.loading, state.links.length])
  );

  const handleRefresh = () => {
    fetchLinks(true);
  };

  const handleAddLink = () => {
    navigation.navigate('AddLink');
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
      <Text style={styles.emptyTitle}>No links saved yet</Text>
      <Text style={styles.emptyDescription}>
        Tap the + button to save your first link
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="error-outline" size={64} color="#FF3B30" />
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
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading your links...</Text>
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
        <Text style={styles.headerTitle}>Your Links</Text>
        <Text style={styles.headerSubtitle}>
          {state.links.length} {state.links.length === 1 ? 'link' : 'links'} saved
        </Text>
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

export default HomeScreen; 