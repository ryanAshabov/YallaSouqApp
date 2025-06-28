import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Updated notification handler to use the current API
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Correct, non-deprecated property
    shouldShowList: true,   // Correct, non-deprecated property
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Listener for notification tap
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { chatId, adTitle } = response.notification.request.content.data as { chatId?: string, adTitle?: string };

      if (chatId && adTitle) {
        router.push(`/chat/${chatId}?adTitle=${encodeURIComponent(adTitle)}`);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
          <Stack.Screen name="category/[category]" options={{ headerShown: false }} />
          <Stack.Screen name="ad/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="my-ads" options={{ headerShown: false }} />
          <Stack.Screen name="ad-edit/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
          <Stack.Screen name="user/[userId]" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
