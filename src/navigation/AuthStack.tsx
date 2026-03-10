import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhoneScreen } from '@/screens/auth/PhoneScreen';
import { OTPScreen } from '@/screens/auth/OTPScreen';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
}
