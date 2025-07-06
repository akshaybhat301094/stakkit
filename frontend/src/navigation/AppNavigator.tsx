import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser, setLoading } from '../store/slices/authSlice';
import { supabase } from '../services/supabase';
import { Linking, Platform } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

// Import screens
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const authStateRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  // Memoize the navigation key to prevent unnecessary remounting
  const navigationKey = useMemo(() => {
    return isAuthenticated ? 'authenticated' : 'unauthenticated';
  }, [isAuthenticated]);

  // Stable dispatch function using useCallback
  const stableDispatch = useCallback((action: any) => {
    dispatch(action);
  }, [dispatch]);

  // Debounced auth state update
  const updateAuthState = useCallback((session: any) => {
    if (!mountedRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      const newUserId = session?.user?.id || null;
      
      // Prevent duplicate updates
      if (authStateRef.current === newUserId) {
        return;
      }
      
      authStateRef.current = newUserId;
      stableDispatch(setUser(session?.user ?? null));
    }, 100); // 100ms debounce
  }, [stableDispatch]);

  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    // Check for existing session
    const checkSession = async () => {
      if (!mounted) return;
      
      stableDispatch(setLoading(true));
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          updateAuthState(session);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          updateAuthState(null);
        }
      } finally {
        if (mounted) {
          stableDispatch(setLoading(false));
        }
      }
    };

    checkSession();

    // Listen for auth changes - this is our single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        updateAuthState(session);
        
        // Handle successful OAuth sign-in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in successfully:', session.user.email);
        }
      }
    );

    // Handle deep links for OAuth callback
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Check if it's an OAuth callback
      if (url.includes('auth/callback') || url.includes('access_token') || url.includes('error')) {
        console.log('OAuth callback URL detected');
        
        try {
          // Parse the URL to extract tokens
          const urlObj = new URL(url);
          const fragment = urlObj.hash || urlObj.search;
          
          if (fragment) {
            // Parse fragment/query string to get tokens
            const params = new URLSearchParams(fragment.replace('#', ''));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const error = params.get('error');
            
            if (error) {
              console.error('OAuth error:', error);
              return;
            }
            
            if (accessToken) {
              console.log('Setting session with tokens from deep link');
              // Set session - the auth state listener will handle the user state update
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              // Don't dispatch setUser here - let the auth state listener handle it
            }
          }
        } catch (error) {
          console.error('Error handling deep link:', error);
        }
      }
    };

    // Handle web OAuth callback
    if (Platform.OS === 'web') {
      // Check if current URL is OAuth callback
      const handleWebCallback = async () => {
        const currentUrl = window.location.href;
        console.log('Current URL:', currentUrl);
        
        if (currentUrl.includes('/auth/callback')) {
          console.log('Handling OAuth callback...');
          
          try {
            // Wait a moment for Supabase to process the URL
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Don't call getSession here as it might trigger the auth listener again
            // The auth state listener will handle the session update
            
            // Clean up the URL
            window.history.replaceState({}, document.title, '/');
          } catch (error) {
            console.error('Error handling web callback:', error);
          }
        }
      };

      handleWebCallback();
      
      // Listen for URL changes (for SPA navigation)
      const handlePopState = () => {
        if (mounted) {
          handleWebCallback();
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        mounted = false;
        mountedRef.current = false;
        isInitializedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        window.removeEventListener('popstate', handlePopState);
        subscription.unsubscribe();
      };
    } else {
      // Mobile deep link handling
      const linkingListener = Linking.addEventListener('url', ({ url }) => {
        if (mounted) {
          handleDeepLink(url);
        }
      });

      // Check for initial deep link
      Linking.getInitialURL().then((url) => {
        if (url && mounted) {
          handleDeepLink(url);
        }
      });

      return () => {
        mounted = false;
        mountedRef.current = false;
        isInitializedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        linkingListener.remove();
        subscription.unsubscribe();
      };
    }
  }, []); // Removed dispatch dependency to prevent infinite re-renders

  // Cleanup effect to ensure proper unmounting
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <LoadingScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer key={navigationKey}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default AppNavigator; 