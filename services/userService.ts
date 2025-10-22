import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot, deleteDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types';

const USERS_COLLECTION = 'users';
const usersCollectionRef = collection(db, USERS_COLLECTION);

export const createUser = async (userData: Omit<User, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(usersCollectionRef, userData);
        return docRef.id;
    } catch (e) {
        console.error("Error creating user: ", e);
        throw new Error("Could not create user account.");
    }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    try {
        const q = query(usersCollectionRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() as User };
    } catch (e) {
        console.error("Error getting user by username: ", e);
        return null;
    }
};

export const getUserByMsalAccountId = async (accountId: string): Promise<User | null> => {
    try {
        const q = query(usersCollectionRef, where("msalAccountId", "==", accountId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() as User };
    } catch (e) {
        console.error("Error getting user by MSAL account ID: ", e);
        return null;
    }
};

export const checkUserExists = async (username: string, email: string): Promise<{ username: boolean; email: boolean }> => {
    try {
        const usernameQuery = query(usersCollectionRef, where("username", "==", username));
        const emailQuery = query(usersCollectionRef, where("email", "==", email));

        const usernameSnapshot = await getDocs(usernameQuery);
        const emailSnapshot = await getDocs(emailQuery);

        return {
            username: !usernameSnapshot.empty,
            email: !emailSnapshot.empty
        };
    } catch (e) {
        console.error("Error checking if user exists: ", e);
        // In case of error, assume they don't exist to allow retries, but log it.
        return { username: false, email: false };
    }
};


export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userDocRef, userData);
    } catch (e) {
        console.error("Error updating user: ", e);
        throw new Error("Could not update user profile.");
    }
};

export const onUsersUpdate = (callback: (users: User[]) => void): (() => void) => {
    return onSnapshot(usersCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const users: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(users);
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await deleteDoc(userDocRef);
    } catch (e) {
        console.error("Error deleting user: ", e);
        throw new Error("Could not delete user account.");
    }
};