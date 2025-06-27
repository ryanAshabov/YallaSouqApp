import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { Expo } from "expo-server-sdk";

// Initialize Firebase Admin and Expo SDK
admin.initializeApp();
const expo = new Expo();

/**
 * Cloud Function (2nd Gen) to send a push notification when a new message is added.
 */
export const sendPushNotification = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const messageData = snapshot.data();
    const { chatId } = event.params;

    // Get the chat document to find participants
    const chatRef = admin.firestore().collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
        console.log("Chat document not found");
        return;
    }
    const chatData = chatDoc.data()!;

    // Get the sender and receiver IDs
    const senderId = messageData.user._id;
    const receiverId = chatData.participants.find((p: string) => p !== senderId);

    if (!receiverId) {
        console.log("Receiver not found");
        return;
    }

    // Get the receiver's user document to find their push token
    const receiverRef = admin.firestore().collection("users").doc(receiverId);
    const receiverDoc = await receiverRef.get();
    if (!receiverDoc.exists) {
        console.log("Receiver's user document not found");
        return;
    }
    const receiverData = receiverDoc.data()!;
    const pushToken = receiverData.pushToken;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        console.log(`Invalid push token for user ${receiverId}`);
        return;
    }

    // Get sender's name from the chat document
    const senderName = chatData.participantNames[senderId] || "A user";
    const messageText = messageData.text;

    // Construct the notification message
    const notification = {
        to: pushToken,
        sound: "default" as const,
        title: `New message from ${senderName}`,
        body: messageText,
        data: { chatId: chatId, adTitle: chatData.adTitle },
    };
    
    try {
        await expo.sendPushNotificationsAsync([notification]);
        console.log(`Notification sent to user ${receiverId}`);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }

    // Update the last message in the chat document
    await chatRef.update({
        lastMessage: messageText,
        lastMessageTimestamp: messageData.createdAt,
    });
});
