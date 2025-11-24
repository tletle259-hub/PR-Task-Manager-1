
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot, deleteDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types';

// --- USER SERVICE (บริการจัดการผู้สั่งงานทั่วไป) ---

const USERS_COLLECTION = 'users';
const usersCollectionRef = collection(db, USERS_COLLECTION);

// สร้าง User ใหม่
export const createUser = async (userData: Omit<User, 'id'>): Promise<string> => {
    const docRef = await addDoc(usersCollectionRef, userData);
    return docRef.id;
};

// ค้นหา User จาก Username
export const getUserByUsername = async (username: string): Promise<User | null> => {
    const q = query(usersCollectionRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() as User };
};

// ค้นหา User จาก Microsoft Account ID
export const getUserByMsalAccountId = async (accountId: string): Promise<User | null> => {
    const q = query(usersCollectionRef, where("msalAccountId", "==", accountId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() as User };
};

// ตรวจสอบว่า Username หรือ Email ซ้ำหรือไม่
export const checkUserExists = async (username: string, email: string): Promise<{ username: boolean; email: boolean }> => {
    const usernameQuery = query(usersCollectionRef, where("username", "==", username));
    const emailQuery = query(usersCollectionRef, where("email", "==", email));

    const usernameSnapshot = await getDocs(usernameQuery);
    const emailSnapshot = await getDocs(emailQuery);

    return {
        username: !usernameSnapshot.empty,
        email: !emailSnapshot.empty
    };
};

// อัปเดตข้อมูล User
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, userData);
};

// ติดตามรายชื่อ User ทั้งหมด (สำหรับ Admin จัดการ)
export const onUsersUpdate = (callback: (users: User[]) => void): (() => void) => {
    return onSnapshot(usersCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const users: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(users);
    }, (error) => {
        console.error("Error watching users (permission?):", error);
    });
};

// ลบ User
export const deleteUser = async (userId: string): Promise<void> => {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userDocRef);
};
