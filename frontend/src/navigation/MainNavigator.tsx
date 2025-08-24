import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollToHide } from '../hooks/useScrollToHide';
import { useTheme } from '../hooks/useTheme';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import CollectionsScreen from '../screens/main/CollectionsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AddLinkScreen from '../screens/main/AddLinkScreen';
import CreateCollectionScreen from '../screens/main/CreateCollectionScreen';
import EditCollectionScreen from '../screens/main/EditCollectionScreen';
import EditLinkScreen from '../screens/main/EditLinkScreen';
import CollectionDetailScreen from '../screens/main/CollectionDetailScreen';
import { Collection, Link } from '../types/database';

export type MainTabParamList = {
  Collections: undefined;
  AddLink: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  AddLink: {
    selectedCollectionId?: string;
  } | undefined;
  CreateCollection: undefined;
  EditCollection: {
    collection: Collection;
  };
  EditLink: {
    link: Link & { collections?: Collection[] };
  };
  CollectionDetail: {
    collection: Collection & { linkCount: number };
  };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// Custom add button component
const AddButton = ({ onPress }: { onPress: () => void }) => {
  const [isLoading, setIsLoading] = useState(true);

  const onLoadStart = () => {
    console.log('Video started loading');
    setIsLoading(true);
  };

  const onLoad = () => {
    console.log('Video loaded successfully');
    setIsLoading(false);
  };

  const onError = (error: any) => {
    console.error('Video loading error:', error);
    setIsLoading(false);
  };

  return (
    <View style={styles.addButtonContainer}>
      <Video
        source={require('../../assets/cover.mp4')}
        style={[
          styles.videoBackground,
          isLoading && styles.hidden
        ]}
        isLooping
        resizeMode={ResizeMode.COVER}
        isMuted
        useNativeControls={false}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onError={onError}
      />
      <View style={[
        styles.background,
        !isLoading && styles.backgroundFaded
      ]} />
      <TouchableOpacity
        style={styles.addButton}
        onPress={onPress}
      >
        <Icon name="add" size={32} color="#FFB5D0" />
      </TouchableOpacity>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation, translateY }: any) => {
  const [status, setStatus] = useState<AVPlaybackStatus>({} as AVPlaybackStatus);
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shadowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shadowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    animate();
  }, []);

  const interpolatedShadow = shadowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [5, 20, 5]
  });

  return (
    <Animated.View style={[
      styles.tabBarContainer,
      {
        backgroundColor: colors.surface,
        transform: [{ translateY }],
      }
    ]}>
      <View style={styles.tabBarContent}>
        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => navigation.navigate('Collections')}
          >
            <Icon
              name="collections-bookmark"
              size={28}
              color={state.index === 0 ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <Animated.View style={[
            styles.addButtonContainer,
            {
              shadowOpacity: 0.8,
              shadowRadius: interpolatedShadow,
              elevation: interpolatedShadow,
            }
          ]}>
            <LinearGradient
              colors={['#FFB5D0', '#4A90E2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.outerGradient}
            />
            <LinearGradient
              colors={['rgba(255,181,208,0.4)', 'rgba(74,144,226,0.4)']}
              style={styles.gradientShadow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Video
              source={require('../../assets/cover.mp4')}
              style={styles.buttonVideo}
              shouldPlay
              isLooping
              resizeMode={ResizeMode.COVER}
              isMuted={true}
              onPlaybackStatusUpdate={setStatus}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddLink')}
            >
              <Icon name="add" size={32} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon
              name="person"
              size={28}
              color={state.index === 2 ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const MainTabs: React.FC = () => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { translateY, onScroll } = useScrollToHide();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} translateY={translateY} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Collections" 
        component={CollectionsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="collections-bookmark" size={24} color={color} />
          ),
        }}
        listeners={{
          focus: () => ({
            tabBarStyle: { display: 'flex' }
          })
        }}
      />
      <Tab.Screen 
        name="AddLink"
        component={AddLinkScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="add" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="person" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 40,
    height: 72,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    paddingHorizontal: 20,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sideContainer: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'visible',
    marginTop: 0,
    shadowColor: '#FFB5D0',
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  outerGradient: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 28, // Adjusted for new size
    zIndex: 0,
  },
  gradientShadow: {
    position: 'absolute',
    top: -8, // Reduced from -10
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 34, // Adjusted for new size
    opacity: 0.6,
    zIndex: 0,
  },
  buttonVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 26, // Match new container radius
    zIndex: 1,
    overflow: 'hidden',
  },
  addButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  backgroundFaded: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 3,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 3,
    padding: 10,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
});

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="AddLink" 
        component={AddLinkScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CreateCollection" 
        component={CreateCollectionScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EditCollection" 
        component={EditCollectionScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EditLink" 
        component={EditLinkScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CollectionDetail" 
        component={CollectionDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator; 