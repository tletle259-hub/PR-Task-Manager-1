
import { collection, onSnapshot, addDoc, writeBatch, doc, getDocs, QuerySnapshot, DocumentData, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ContactMessage } from '../types';

// --- CONTACT SERVICE (บริการข้อความติดต่อจากผู้ใช้) ---

const MESSAGES_COLLECTION = 'contactMessages';
const messagesCollectionRef = collection(db, MESSAGES_COLLECTION);

// ติดตามข้อความติดต่อเข้ามาใหม่
export const onContactMessagesUpdate = (callback: (messages: ContactMessage[]) => void): (() => void) => {
    return onSnapshot(messagesCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const messages: ContactMessage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
        callback(messages);
    });
};

// ส่งข้อความติดต่อใหม่ (จาก ChatBot widget)
export const addContactMessage = async (newMessage: Omit<ContactMessage, 'id'>): Promise<string | null> => {
    try {
        const docRef = await addDoc(messagesCollectionRef, newMessage);
        return docRef.id;
    } catch (e) {
        console.error("Error adding contact message: ", e);
        return null;
    }
};

// อัปเดตสถานะข้อความ (เช่น อ่านแล้ว)
export const updateContactMessage = async (messageId: string, updates: Partial<Omit<ContactMessage, 'id'>>): Promise<void> => {
    try {
        const messageDocRef = doc(db, MESSAGES_COLLECTION, messageId);
        await updateDoc(messageDocRef, updates);
    } catch (e) {
        console.error("Error updating contact message: ", e);
        throw e;
    }
};

// ลบข้อความ
export const deleteContactMessage = async (messageId: string): Promise<void> => {
    try {
        const messageDocRef = doc(db, MESSAGES_COLLECTION, messageId);
        await deleteDoc(messageDocRef);
    } catch(e) {
        console.error("Error deleting contact message: ", e);
        throw e;
    }
};

// ลบข้อความทั้งหมด
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
