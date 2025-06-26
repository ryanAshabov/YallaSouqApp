import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { chatId, adTitle } = useLocalSearchParams<{ chatId: string, adTitle?: string }>();
    const [messages, setMessages] = useState<IMessage[]>([]);

    useEffect(() => {
        if (!chatId) return;

        const messagesCollection = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    _id: doc.id,
                    text: data.text,
                    createdAt: data.createdAt.toDate(),
                    user: data.user,
                };
            });
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [chatId]);

    const onSend = useCallback((newMessages: IMessage[] = []) => {
        if (!chatId) return;

        const messageToSend = newMessages[0];
        const messagesCollection = collection(db, 'chats', chatId, 'messages');

        addDoc(messagesCollection, {
            text: messageToSend.text,
            createdAt: serverTimestamp(),
            user: {
                _id: user!.uid,
                name: user!.email || 'Anonymous', // Use email as name for now
            },
        });
    }, [chatId, user]);

    if (!user) {
        // This should ideally be handled by routing rules, but as a fallback:
        return (
            <View style={styles.centered}>
                <Text>Please log in to view messages.</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                    <Text>Login</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{adTitle || 'Chat'}</Text>
            </View>
            <GiftedChat
                messages={messages}
                onSend={newMessages => onSend(newMessages)}
                user={{
                    _id: user.uid,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1, // Allows text to take available space and be ellipsized
    },
});
