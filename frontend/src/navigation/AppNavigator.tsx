import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSession, setLoading } from '../store/slices/authSlice';
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
  const { isAuthenticated, isLoading, user, session } = useAppSelector((state) => state.auth);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const authStateRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  // Debug current state
  useEffect(() => {
    if (isAuthenticated) {
      setIsNavigationReady(true);
    }
  }, [isAuthenticated, user, session, isLoading, isNavigationReady]);

  // Memoize the navigation key to prevent unnecessary remounting
  const navigationKey = useMemo(() => {
    return `${isAuthenticated ? 'authenticated' : 'unauthenticated'}-${user?.id || 'none'}`;
  }, [isAuthenticated, user?.id]);

  // Stable dispatch function using useCallback
  const stableDispatch = useCallback((action: any) => {
    if (mountedRef.current) {
      dispatch(action);
    }
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
      authStateRef.current = newUserId;
      stableDispatch(setSession(session));
    }, 100);
  }, [stableDispatch]);

  useEffect(() => {
    mountedRef.current = true;

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    // Check for existing session
    const checkSession = async () => {
      if (!mountedRef.current) return;
      
      try {
        stableDispatch(setLoading(true));
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mountedRef.current) {
          updateAuthState(session);
          setIsNavigationReady(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mountedRef.current) {
          updateAuthState(null);
          setIsNavigationReady(true);
        }
      } finally {
        if (mountedRef.current) {
          stableDispatch(setLoading(false));
        }
      }
    };

    // Initialize session check
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        console.log('Auth state change event:', {
          event,
          userId: session?.user?.id,
          hasSession: !!session,
          hasUser: !!session?.user,
          email: session?.user?.email,
        });
        
        // Handle auth state change
        switch (event) {
          case 'INITIAL_SESSION':
            if (session) {
              console.log('Initial session detected, updating auth state');
              await updateAuthState(session);
              setIsNavigationReady(true);
            } else {
              console.log('No initial session, clearing auth state');
              await updateAuthState(null);
              setIsNavigationReady(true);
            }
            break;
          case 'SIGNED_IN':
            console.log('Sign in detected, updating session');
            await updateAuthState(session);
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed, updating session');
            await updateAuthState(session);
            break;
          case 'USER_UPDATED':
            console.log('User updated, updating session');
            await updateAuthState(session);
            break;
          case 'SIGNED_OUT':
            console.log('Sign out detected, clearing auth state');
            await updateAuthState(null);
            break;
          default:
            console.log('Unhandled auth event:', event);
            // Still update the state for unhandled events if we have a session
            if (session) {
              await updateAuthState(session);
            }
            break;
        }
      }
    );

    // Handle deep links and OAuth callbacks
    if (Platform.OS === 'web') {
      const handleWebCallback = async () => {
        if (!mountedRef.current) return;
        
        const currentUrl = window.location.href;
        if (currentUrl.includes('/auth/callback') || currentUrl.includes('#access_token=')) {
          console.log('Handling OAuth callback...');
          
          try {
            // Let Supabase handle the callback
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Clean up the URL without triggering a navigation
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (error) {
            console.error('Error handling web callback:', error);
          }
        }
      };

      handleWebCallback();
      
      // Listen for URL changes
      const handlePopState = () => {
        if (mountedRef.current) {
          handleWebCallback();
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        mountedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        window.removeEventListener('popstate', handlePopState);
        subscription.unsubscribe();
      };
    } else {
      // Mobile deep link handling
      const linkingListener = Linking.addEventListener('url', ({ url }) => {
        if (mountedRef.current && url) {
          handleDeepLink(url);
        }
      });

      // Check for initial deep link
      Linking.getInitialURL().then((url) => {
        if (url && mountedRef.current) {
          handleDeepLink(url);
        }
      });

      return () => {
        mountedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        linkingListener.remove();
        subscription.unsubscribe();
      };
    }
  }, []); // Empty dependency array to run only once

  // Handle deep links for mobile
  const handleDeepLink = async (url: string) => {
    if (!url.includes('auth/callback') && !url.includes('access_token')) return;
    
    try {
      // Add a small delay to allow Supabase to process the OAuth response
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try multiple times to get the session
      for (let i = 0; i < 3; i++) {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) continue;

        if (session) {
          updateAuthState(session);
          return;
        }

        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // If we still don't have a session, try to parse the URL
      const urlObj = new URL(url);
      const fragment = urlObj.hash || urlObj.search;
      
      if (fragment) {
        const params = new URLSearchParams(fragment.replace('#', ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          const { data: { session: newSession }, error: sessionError } = 
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
          if (sessionError) return;
          
          if (newSession) {
            updateAuthState(newSession);
          }
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  if (!isNavigationReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer key={navigationKey}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen 
            name="Main" 
            component={MainNavigator}
            options={{ 
              animationEnabled: true,
              gestureEnabled: false 
            }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ 
              animationEnabled: true,
              gestureEnabled: false 
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 