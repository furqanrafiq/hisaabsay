import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { AddTransactionScreen } from '@/screens/transactions/AddTransactionScreen';
import { EditTransactionScreen } from '@/screens/transactions/EditTransactionScreen';
import { AddBudgetScreen } from '@/screens/budget/AddBudgetScreen';
import { AddGoalScreen } from '@/screens/goals/AddGoalScreen';
import { AddCategoryScreen } from '@/screens/categories/AddCategoryScreen';
import { Colors } from '@/constants/colors';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="EditTransaction" component={EditTransactionScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AddBudget" component={AddBudgetScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AddGoal" component={AddGoalScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="AddCategory" component={AddCategoryScreen} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
