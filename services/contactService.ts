import { collection, onSnapshot, addDoc, writeBatch, doc, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ContactMessage } from '../types';

const MESSAGES_COLLECTION = 'contactMessages';
const messagesCollectionRef = collection(db, MESSAGES_COLLECTION);


// Fix: Explicitly type the snapshot parameter as QuerySnapshot<DocumentData> to resolve the type error.
export const onContactMessagesUpdate = (callback: (messages: ContactMessage[]) => void): (() => void) => {
    return onSnapshot(messagesCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const messages: ContactMessage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
        callback(messages);
    });
};


export const addContactMessage = async (newMessage: Omit<ContactMessage, 'id'>): Promise<string | null> => {
    try {
        const docRef = await addDoc(messagesCollectionRef, newMessage);
        return docRef.id;
    } catch (e) {
        console.error("Error adding contact message: ", e);
        return null;
    }
};

export const saveContactMessages = async (messages: ContactMessage[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    // This function can be used for bulk updates or deletions.
    // For simple "mark as read" or single deletions, a more specific function would be better.
    // This example is for clearing all messages.
    if (messages.length === 0) {
        // Fix: Use getDocs() function instead of the non-existent .get() method on a collection reference.
        const allMessagesSnapshot = await getDocs(messagesCollectionRef);
        allMessagesSnapshot.forEach(doc => batch.delete(doc.ref));
    } else {
       messages.forEach(msg => {
            const docRef = doc(db, MESSAGES_COLLECTION, msg.id);
            batch.set(docRef, msg);
       });
    }
    await batch.commit();
  } catch (e) {
    console.error("Error saving contact messages: ", e);
  }
};