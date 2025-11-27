
import { db } from '../firebaseConfig';
import { User } from '../types';
import firebase from 'firebase/compat/app';

// --- USER SERVICE (บริการจัดการผู้สั่งงานทั่วไป) ---

const USERS_COLLECTION = 'users';

// สร้าง User ใหม่
export const createUser = async (userData: Omit<User, 'id'>): Promise<string> => {
    const docRef = await db.collection(USERS_COLLECTION).add(userData);
    return docRef.id;
};

// ค้นหา User จาก Username
export const getUserByUsername = async (username: string): Promise<User | null> => {
    const querySnapshot = await db.collection(USERS_COLLECTION).where("username", "==", username).get();
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() as User };
};

// ค้นหา User จาก Microsoft Account ID
export const getUserByMsalAccountId = async (accountId: string): Promise<User | null> => {
    const querySnapshot = await db.collection(USERS_COLLECTION).where("msalAccountId", "==", accountId).get();
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() as User };
};

// ตรวจสอบว่า Username หรือ Email ซ้ำหรือไม่
export const checkUserExists = async (username: string, email: string): Promise<{ username: boolean; email: boolean }> => {
    const usernameQuery = db.collection(USERS_COLLECTION).where("username", "==", username);
    const emailQuery = db.collection(USERS_COLLECTION).where("email", "==", email);

    const usernameSnapshot = await usernameQuery.get();
    const emailSnapshot = await emailQuery.get();

    return {
        username: !usernameSnapshot.empty,
        email: !emailSnapshot.empty
    };
};

// อัปเดตข้อมูล User
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    await db.collection(USERS_COLLECTION).doc(userId).update(userData);
};

// ติดตามรายชื่อ User ทั้งหมด (สำหรับ Admin จัดการ)
export const onUsersUpdate = (callback: (users: User[]) => void): (() => void) => {
    return db.collection(USERS_COLLECTION).onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const users: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(users);
    }, (error) => {
        console.error("Error watching users (permission?):", error);
    });
};

// ลบ User
export const deleteUser = async (userId: string): Promise<void> => {
    await db.collection(USERS_COLLECTION).doc(userId).delete();
};
