import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import CollectionsScreen from '../screens/main/CollectionsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AddLinkScreen from '../screens/main/AddLinkScreen';
import CreateCollectionScreen from '../screens/main/CreateCollectionScreen';
import CollectionDetailScreen from '../screens/main/CollectionDetailScreen';
import { Collection } from '../types/database';

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
  CollectionDetail: {
    collection: Collection & { linkCount: number };
  };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Collections') {
            iconName = focused ? 'folder' : 'folder-open';
          } else if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
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