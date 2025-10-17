import { collection, onSnapshot, getDocs, writeBatch, doc, setDoc, deleteDoc, query, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TeamMember } from '../types';

const SECUREID_COLLECTION = 'secureID';
const secureIdCollectionRef = collection(db, SECUREID_COLLECTION);

export const seedInitialTeamMembers = async () => {
    const snapshot = await getDocs(secureIdCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial secureID user...");
        const initialUser = {
            name: 'ไตเติ้ล ณัฐกิตติ์ โชติกรณ์',
            position: 'นักศึกษา',
            avatar: 'https://i.pravatar.cc/150?u=TM01',
            id: 'nattakit', // This is the username, stored in the 'id' field
            password: "1234" // Store plaintext password
        };
        const docRef = doc(db, SECUREID_COLLECTION, "TM001");
        await setDoc(docRef, initialUser);
    }
};

// Fix: Explicitly type the snapshot parameter as QuerySnapshot<DocumentData> to resolve the type error.
export const onTeamMembersUpdate = (callback: (members: TeamMember[]) => void): (() => void) => {
    const q = query(secureIdCollectionRef);
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const members: TeamMember[] = snapshot.docs.map(doc => {
            // Fix: Cast the document data to a known type to allow property access and resolve errors.
            const data = doc.data() as { name: string, position: string, avatar: string, id: string };
            return {
                id: doc.id, // Document ID (e.g., TM001)
                name: data.name,
                position: data.position,
                avatar: data.avatar,
                username: data.id, // Username from the 'id' field
                // Password is intentionally not returned here for security
            } as TeamMember;
        });
        callback(members);
    });
};

export const addTeamMember = async (memberData: Omit<TeamMember, 'id' | 'avatar'>): Promise<void> => {
    const snapshot = await getDocs(secureIdCollectionRef);
    const existingIds = snapshot.docs
        .map(doc => parseInt(doc.id.replace('TM', ''), 10))
        .filter(id => !isNaN(id));
        
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = `TM${(maxId + 1).toString().padStart(3, '0')}`;
    
    if (!memberData.username || !memberData.password) {
        throw new Error("Username and password are required.");
    }

    const newMember = {
        name: memberData.name,
        position: memberData.position,
        avatar: `https://i.pravatar.cc/150?u=${newId}`,
        id: memberData.username,
        password: memberData.password, // Expects a plaintext password
    };

    const docRef = doc(db, SECUREID_COLLECTION, newId);
    await setDoc(docRef, newMember);
};


export const updateTeamMember = async (member: TeamMember): Promise<void> => {
    try {
        const docRef = doc(db, SECUREID_COLLECTION, member.id);
        const dataToUpdate: { [key: string]: any } = {
            name: member.name,
            position: member.position,
            avatar: member.avatar,
            id: member.username, // 'id' field in Firestore holds the username
        };
        
        // Only include password if it's being changed (i.e., it's provided in the member object)
        if (member.password) {
            dataToUpdate.password = member.password;
        }

        await setDoc(docRef, dataToUpdate, { merge: true });
    } catch (e) {
        console.error("Error updating team member: ", e);
        throw e;
    }
};


export const deleteTeamMember = async (memberId: string): Promise<void> => {
    try {
        const docRef = doc(db, SECUREID_COLLECTION, memberId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Error deleting team member: ", e);
        throw e;
    }
}