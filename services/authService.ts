import { PublicClientApplication, EventType, AccountInfo } from "@azure/msal-browser";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TeamMember, User } from '../types';
import { createUser, getUserByUsername, checkUserExists } from './userService';

// --- MSAL (Microsoft) Configuration ---
const msalConfig = {
  auth: {
    clientId: "ed272ef9-5036-4e92-89bc-44eb49afdf2b",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", 
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
export const msalInstancePromise = msalInstance.initialize();

msalInstancePromise.then(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
    }
});

msalInstance.addEventCallback((event: any) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
  }
});

// --- MSAL Functions ---
export const loginWithMicrosoft = async (): Promise<AccountInfo | null> => {
  try {
    await msalInstancePromise;
    const loginResponse = await msalInstance.loginPopup({ scopes: ["User.Read"] });
    return loginResponse.account;
  } catch (err: any) {
    if (err.errorCode === 'user_cancelled') {
        console.log('MSAL login flow was cancelled by the user.');
    } else {
        console.error("MSAL login error:", err);
    }
    return null;
  }
};

export const logoutFromMicrosoft = async (): Promise<void> => {
    const currentAccount = getMicrosoftAccount();
    if (currentAccount) {
        await msalInstance.logoutPopup({
            account: currentAccount,
            postLogoutRedirectUri: window.location.origin,
        });
    }
};

export const getMicrosoftAccount = (): AccountInfo | null => {
  return msalInstance.getActiveAccount();
};

// --- Custom Requester Auth Functions ---
export const registerUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const exists = await checkUserExists(userData.username, userData.email);
    if (exists.username) throw new Error("Username นี้มีผู้ใช้งานแล้ว");
    if (exists.email) throw new Error("Email นี้มีผู้ใช้งานแล้ว");

    const newUserId = await createUser(userData);
    return { id: newUserId, ...userData };
};

export const loginWithUsernamePassword = async (username: string, password: string): Promise<User | null> => {
    const user = await getUserByUsername(username);
    if (user && user.password === password) {
        // In a real app, you would compare hashed passwords.
        // For this app's scope, we compare plaintext.
        const { password: _, ...userProfile } = user; // Exclude password from returned object
        return userProfile as User;
    }
    return null;
};


// --- Custom Team Member Auth Functions ---
export const loginWithSecureId = async (username: string, password: string): Promise<TeamMember | null> => {
    const usersRef = collection(db, 'secureID');
    const q = query(usersRef, where("id", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn(`Login attempt for non-existent user: ${username}`);
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as { password?: string; id?: string; name?: string; position?: string; avatar?: string; };

    if (userData.password === password) {
        return {
            id: userDoc.id,
            username: userData.id,
            name: userData.name,
            position: userData.position,
            avatar: userData.avatar,
        } as TeamMember;
    }

    return null;
};