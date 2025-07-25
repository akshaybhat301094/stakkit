import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';

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
  Home: undefined;
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

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Icon.glyphMap;

          if (route.name === 'Collections') {
            iconName = focused ? 'folder' : 'folder-open';
          } else if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom - 8, 0),
        },
      })}
    >
      <Tab.Screen 
        name="Collections" 
        component={CollectionsScreen}
        options={{ title: 'Collections' }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'All Links' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

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