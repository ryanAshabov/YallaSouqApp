import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { chatId, adTitle } = response.notification.request.content.data as { chatId?: string, adTitle?: string };

      if (chatId && adTitle) {
        // Navigate to the chat screen
        router.push(`/chat/${chatId}?adTitle=${encodeURIComponent(adTitle)}`);
      }
    });

    return () => subscription.remove();
  }, [router]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="category/[category]" options={{ headerShown: false }} />
          <Stack.Screen name="ad/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="my-ads" options={{ headerShown: false }} />
          <Stack.Screen name="ad-edit/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
