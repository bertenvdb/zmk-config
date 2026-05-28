import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import SpoolsListScreen from '../screens/spools/SpoolsListScreen';
import SpoolDetailScreen from '../screens/spools/SpoolDetailScreen';
import SpoolCreateEditScreen from '../screens/spools/SpoolCreateEditScreen';
import FilamentsListScreen from '../screens/filaments/FilamentsListScreen';
import ManufacturersListScreen from '../screens/manufacturers/ManufacturersListScreen';
import ManufacturerOverrideScreen from '../screens/manufacturers/ManufacturerOverrideScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import type {
  SpoolStackParamList,
  ManufacturerStackParamList,
  TabParamList,
} from '../types';

const SpoolStack = createNativeStackNavigator<SpoolStackParamList>();
function SpoolsNavigator() {
  return (
    <SpoolStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' } }}>
      <SpoolStack.Screen
        name="SpoolsList"
        component={SpoolsListScreen}
        options={{ title: 'Spools' }}
      />
      <SpoolStack.Screen
        name="SpoolDetail"
        component={SpoolDetailScreen}
        options={{ title: 'Spool' }}
      />
      <SpoolStack.Screen
        name="SpoolCreateEdit"
        component={SpoolCreateEditScreen}
        options={({ route }) => ({
          title: route.params?.spoolId != null ? 'Edit Spool' : 'New Spool',
        })}
      />
    </SpoolStack.Navigator>
  );
}

const ManufacturerStack = createNativeStackNavigator<ManufacturerStackParamList>();
function ManufacturersNavigator() {
  return (
    <ManufacturerStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' } }}>
      <ManufacturerStack.Screen
        name="ManufacturersList"
        component={ManufacturersListScreen}
        options={{ title: 'Manufacturers' }}
      />
      <ManufacturerStack.Screen
        name="ManufacturerOverride"
        component={ManufacturerOverrideScreen}
        options={({ route }) => ({ title: route.params.vendorName })}
      />
    </ManufacturerStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof TabParamList, string> = {
            Spools: '🧵',
            Filaments: '🎨',
            Manufacturers: '🏭',
            Settings: '⚙️',
          };
          return (
            <Text style={{ fontSize: size - 4, color }}>{icons[route.name]}</Text>
          );
        },
      })}>
      <Tab.Screen name="Spools" component={SpoolsNavigator} />
      <Tab.Screen
        name="Filaments"
        component={FilamentsListScreen}
        options={{ headerShown: true, title: 'Filaments' }}
      />
      <Tab.Screen name="Manufacturers" component={ManufacturersNavigator} />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
