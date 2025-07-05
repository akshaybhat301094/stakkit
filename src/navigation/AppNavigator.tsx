import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser, setLoading } from '../store/slices/authSlice';
import { supabase } from '../services/supabase';
import { Linking, Platform } from 'react-native';

// Import screens
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      dispatch(setLoading(true));
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        dispatch(setUser(session?.user ?? null));
      } catch (error) {
        console.error('Error checking session:', error);
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        dispatch(setUser(session?.user ?? null));
        
        // Handle successful OAuth sign-in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in successfully:', session.user.email);
        }
      }
    );

    // Handle deep links for OAuth callback
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      
      // Check if it's an OAuth callback
      if (url.includes('access_token') || url.includes('error')) {
        // Supabase will automatically handle the OAuth callback through the auth state listener
        console.log('OAuth callback URL detected, letting Supabase handle it');
      }
    };

    // Handle web OAuth callback
    if (Platform.OS === 'web') {
      // Check if current URL is OAuth callback
      const handleWebCallback = () => {
        const currentUrl = window.location.href;
        console.log('Current URL:', currentUrl);
        
        if (currentUrl.includes('/auth/callback')) {
          console.log('Handling OAuth callback...');
          // Supabase will automatically handle the tokens from the URL
          // We just need to redirect to the main app
          window.history.replaceState({}, document.title, '/');
        }
      };

      handleWebCallback();
      
      // Listen for URL changes (for SPA navigation)
      const handlePopState = () => {
        handleWebCallback();
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // Mobile deep link handling
      const linkingListener = Linking.addEventListener('url', ({ url }) => {
        handleDeepLink(url);
      });

      // Check for initial deep link
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      });

      return () => {
        linkingListener.remove();
        subscription.unsubscribe();
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 