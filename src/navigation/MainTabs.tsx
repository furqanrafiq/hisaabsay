import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { TransactionsScreen } from '@/screens/transactions/TransactionsScreen';
import { BudgetScreen } from '@/screens/budget/BudgetScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { Colors } from '@/constants/colors';


const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
  Home: 'home',
  Transactions: 'swap-horizontal',
  Budget: 'chart-pie',
  Goals: 'flag',
  Profile: 'account',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={icons[route.name] as any} size={size} color={color} />
        ),
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'HisaabSay' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
