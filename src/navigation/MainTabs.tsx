import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { TransactionsScreen } from '@/screens/transactions/TransactionsScreen';
import { BudgetScreen } from '@/screens/budget/BudgetScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { Colors } from '@/constants/colors';

const Tab = createBottomTabNavigator();

const TAB_EMOJIS: Record<string, string> = {
  Home:         '🏠',
  Transact:     '💳',
  Budget:       '📊',
  Goals:        '🎯',
  Profile:      '👤',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
            {TAB_EMOJIS[route.name]}
          </Text>
        ),
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 12,
          paddingTop: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 0,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}         options={{ title: 'Home' }} />
      <Tab.Screen name="Transact" component={TransactionsScreen} options={{ title: 'Transact' }} />
      <Tab.Screen name="Budget"   component={BudgetScreen}       options={{ title: 'Budget' }} />
      <Tab.Screen name="Goals"    component={GoalsScreen}        options={{ title: 'Goals' }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}      options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
