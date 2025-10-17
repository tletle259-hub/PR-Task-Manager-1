import { collection, onSnapshot, addDoc, writeBatch, doc, getDocs, QuerySnapshot, DocumentData, deleteDoc, updateDoc } from 'firebase/firestore';
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

export const updateContactMessage = async (messageId: string, updates: Partial<Omit<ContactMessage, 'id'>>): Promise<void> => {
    try {
        const messageDocRef = doc(db, MESSAGES_COLLECTION, messageId);
        await updateDoc(messageDocRef, updates);
    } catch (e) {
        console.error("Error updating contact message: ", e);
        throw e;
    }
};

export const deleteContactMessage = async (messageId: string): Promise<void> => {
    try {
        const messageDocRef = doc(db, MESSAGES_COLLECTION, messageId);
        await deleteDoc(messageDocRef);
    } catch(e) {
        console.error("Error deleting contact message: ", e);
        throw e;
    }
};

export const deleteAllContactMessages = async (): Promise<void> => {
    try {
        const existingDocsSnapshot = await getDocs(messagesCollectionRef);
        if (existingDocsSnapshot.empty) return;

        const batch = writeBatch(db);
        existingDocsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (e) {
        console.error("Error deleting all contact messages: ", e);
        throw e;
    }
};