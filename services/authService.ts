
import { PublicClientApplication, EventType, AccountInfo } from "@azure/msal-browser";
import { db, auth } from '../firebaseConfig';
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

// --- Helper: Ensure Firebase Auth ---
export const ensureFirebaseAuth = async () => {
    // v8 compat way
    return new Promise<void>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(() => {
            unsubscribe();
            resolve();
        });
    });
};

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
    try {
        const user = await getUserByUsername(username);
        if (user && user.password === password) {
            const { password: _, ...userProfile } = user;
            return userProfile as User;
        }
        return null;
    } catch (error: any) {
        // Auto-fix: If permission denied, sign out (clear stale token) and retry once
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
            console.warn("Permission error detected. Clearing auth state and retrying...");
            await auth.signOut();
            // Retry the operation
            const userRetry = await getUserByUsername(username);
            if (userRetry && userRetry.password === password) {
                const { password: _, ...userProfile } = userRetry;
                return userProfile as User;
            }
            return null;
        }
        throw error;
    }
};


// --- Custom Team Member Auth Functions ---
export const loginWithSecureId = async (username: string, password: string): Promise<TeamMember | null> => {
    const usersRef = db.collection('secureID');
    const q = usersRef.where("id", "==", username);
    
    let querySnapshot;

    try {
        querySnapshot = await q.get();
    } catch (error: any) {
        // Critical Fix: If permission denied, it might be due to a stale anonymous token.
        // We sign out to force "Guest" mode which works with "allow read: if true;"
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
             console.warn("Permission denied. Clearing potential stale auth token and retrying...");
             try {
                 await auth.signOut();
                 querySnapshot = await q.get();
             } catch (retryError) {
                 // If it fails again, bubble up the error to show the Rules instruction
                 throw error; 
             }
        } else {
            throw error;
        }
    }

    if (querySnapshot.empty) {
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
