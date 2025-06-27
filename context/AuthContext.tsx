import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { auth, db } from '../firebaseConfig';

// --- Helper Functions ---

/**
 * Registers the device for Expo push notifications.
 * @returns {Promise<string|undefined>} The Expo push token or undefined if it fails.
 */
async function registerForPushNotificationsAsync() {
  let token;
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');
    return;
  }

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

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}


// --- Auth Context Definition ---

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

// --- Auth Provider Component ---

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  /**
   * Reloads the current user's data from Firebase Auth.
   */
  const reloadUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      setUser(auth.currentUser);
    }
  }, []);

  /**
   * Adds an ad to the user's favorites list in Firestore.
   */
  const addToFavorites = useCallback(async (adId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { favorites: arrayUnion(adId) });
    } catch (error) {
      console.error("Error adding to favorites: ", error);
    }
  }, [user]);

  /**
   * Removes an ad from the user's favorites list in Firestore.
   */
  const removeFromFavorites = useCallback(async (adId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { favorites: arrayRemove(adId) });
    } catch (error) {
      console.error("Error removing from favorites: ", error);
    }
  }, [user]);


  // --- Effects ---

  /**
   * Main effect to handle authentication state changes.
   * Manages user session and Firestore user document synchronization.
   */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        // If the user document doesn't exist in Firestore, create it.
        // This is crucial for new sign-ups.
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: currentUser.email,
            displayName: currentUser.displayName, // Save the display name provided during sign-up
            createdAt: serverTimestamp(),
            favorites: [],
          });
        }
        
        // Register for push notifications and update the token.
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          // Update the push token regardless of whether the doc existed or not.
          await updateDoc(userDocRef, {
            pushToken: pushToken,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // User is logged out, clear favorites.
        setFavorites([]);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  /**
   * Subscribes to the user's favorites list in real-time.
   */
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeFavorites = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setFavorites(doc.data().favorites || []);
      }
    });

    return () => unsubscribeFavorites();
  }, [user]);


  // --- Render ---

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

/**
 * Custom hook to easily access the AuthContext.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
