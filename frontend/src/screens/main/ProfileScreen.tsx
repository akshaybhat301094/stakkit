import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useSignOutMutation } from '../../store/api/authApi';
import { logout } from '../../store/slices/authSlice';
import { setThemeMode, ThemeMode } from '../../store/slices/themeSlice';
import { supabase } from '../../services/supabase';
import { useScrollToHide } from '../../hooks/useScrollToHide';
import { useTheme } from '../../hooks/useTheme';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode: themeMode } = useAppSelector((state) => state.theme);
  const [signOut, { isLoading }] = useSignOutMutation();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userInfoError, setUserInfoError] = useState<string | null>(null);
  const { onScroll } = useScrollToHide();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const fetchUserInfo = async () => {
      setUserInfoLoading(true);
      setUserInfoError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('No JWT token found');
        const res = await fetch('http://localhost:8000/auth/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch user info');
        const data = await res.json();
        setUserInfo(data.user);
      } catch (err: any) {
        setUserInfoError(err.message || 'Unknown error');
      } finally {
        setUserInfoLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  const performLogout = async () => {
    try {
      await signOut().unwrap();
      dispatch(logout());
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out');
    }
  };

  const handleThemePress = () => {
    const themeOptions = [
      { title: 'Light', mode: 'light' as ThemeMode },
      { title: 'Dark', mode: 'dark' as ThemeMode },
      { title: 'System', mode: 'system' as ThemeMode },
    ];

    Alert.alert(
      'Theme',
      'Choose your preferred theme',
      [
        ...themeOptions.map((option) => ({
          text: `${option.title}${themeMode === option.mode ? ' ✓' : ''}`,
          onPress: () => dispatch(setThemeMode(option.mode)),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return `System (${isDark ? 'Dark' : 'Light'})`;
      default:
        return 'System';
    }
  };

  const dynamicStyles = createDynamicStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={[styles.header, { borderBottomColor: colors.surfaceSecondary }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
            {userInfoLoading ? (
              <ActivityIndicator color="#007AFF" />
            ) : userInfoError ? (
              <Text style={{ color: 'red' }}>{userInfoError}</Text>
            ) : userInfo ? (
              <View style={styles.userInfo}>
                <Text style={[styles.email, { color: colors.textTertiary }]}>{userInfo.email}</Text>
                {userInfo.name && <Text style={[styles.name, { color: colors.textPrimary }]}>{userInfo.name}</Text>}
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8 }}>User ID: {userInfo.sub}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.menuItemContent}>
                <Icon name="edit" size={20} color={colors.textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit Profile</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary }]}
              onPress={handleThemePress}
            >
              <View style={styles.menuItemContent}>
                <Icon name="palette" size={20} color={colors.textSecondary} style={styles.menuIcon} />
                <View>
                  <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Theme</Text>
                  <Text style={[styles.menuItemSubtext, { color: colors.textTertiary }]}>
                    {getThemeDisplayText()}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.menuItemContent}>
                <Icon name="help" size={20} color={colors.textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Help & Support</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.menuItemContent}>
                <Icon name="privacy-tip" size={20} color={colors.textSecondary} style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Privacy Policy</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createDynamicStyles = (colors: any) => StyleSheet.create({
  // Add any dynamic styles here if needed
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Add padding for floating menu bar
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  email: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  section: {
    marginBottom: 32,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 