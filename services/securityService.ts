import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { DEFAULT_ADMIN_PASSWORD } from '../config';

const SECURITY_COLLECTION = 'security';
const PASSWORDS_DOC = 'passwords';
const passwordsDocRef = doc(db, SECURITY_COLLECTION, PASSWORDS_DOC);

export const seedInitialAdminPassword = async () => {
    const docSnap = await getDoc(passwordsDocRef);
    if (!docSnap.exists()) {
        console.log("Seeding initial admin password...");
        await setDoc(passwordsDocRef, { values: [DEFAULT_ADMIN_PASSWORD] });
    }
};

export const getAdminPasswords = async (): Promise<string[]> => {
    try {
        const docSnap = await getDoc(passwordsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure values is an array and not empty
            if (Array.isArray(data.values) && data.values.length > 0) {
                return data.values;
            }
        }
        // If doc doesn't exist, or values is empty/invalid, seed and return default
        await seedInitialAdminPassword();
        return [DEFAULT_ADMIN_PASSWORD];
    } catch (e) {
        console.error("Error fetching admin passwords: ", e);
        return [DEFAULT_ADMIN_PASSWORD]; // Fallback
    }
};

export const saveAdminPasswords = async (passwords: string[]): Promise<void> => {
    try {
        await setDoc(passwordsDocRef, { values: passwords });
    } catch (e) {
        console.error("Error saving admin passwords: ", e);
        throw e; // Re-throw to be caught by the component
    }
};
