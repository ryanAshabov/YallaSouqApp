import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { auth, db } from '../firebaseConfig';

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  favorites: string[];
  addToFavorites: (adId: string) => Promise<void>;
  removeFromFavorites: (adId: string) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  favorites: [],
  addToFavorites: async () => {},
  removeFromFavorites: async () => {},
  reloadUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const reloadUser = useCallback(async () => {
    await auth.currentUser?.reload();
    const freshUser = auth.currentUser;
    setUser(freshUser);
  }, []);

  const addToFavorites = useCallback(async (adId: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        favorites: arrayUnion(adId),
      });
    } catch (error) {
      console.error("Error adding to favorites: ", error);
    }
  }, [user]);

  const removeFromFavorites = useCallback(async (adId: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        favorites: arrayRemove(adId),
      });
    } catch (error) {
      console.error("Error removing from favorites: ", error);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);

      if (currentUser) {
        const pushToken = await registerForPushNotificationsAsync();
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: currentUser.email,
            createdAt: serverTimestamp(),
            favorites: [],
          });
        }

        if (pushToken) {
          await updateDoc(userDocRef, {
            pushToken: pushToken,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        setFavorites([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFavorites = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setFavorites(doc.data().favorites || []);
        }
      });
      return () => unsubscribeFavorites();
    }
  }, [user]);

  const value = {
    user,
    isLoading,
    favorites,
    addToFavorites,
    removeFromFavorites,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
