import { collection, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TeamMember } from '../types';
import { MOCK_TEAM_MEMBERS } from '../constants';

const TEAM_MEMBERS_COLLECTION = 'teamMembers';
const teamMembersCollectionRef = collection(db, TEAM_MEMBERS_COLLECTION);

export const seedInitialTeamMembers = async () => {
    const snapshot = await getDocs(teamMembersCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial team members...");
        const batch = writeBatch(db);
        MOCK_TEAM_MEMBERS.forEach(member => {
            const docRef = doc(db, TEAM_MEMBERS_COLLECTION, member.id);
            batch.set(docRef, member);
        });
        await batch.commit();
    }
};

export const onTeamMembersUpdate = (callback: (members: TeamMember[]) => void): (() => void) => {
    return onSnapshot(teamMembersCollectionRef, (snapshot) => {
        const members: TeamMember[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
        callback(members);
    });
};

export const saveTeamMembers = async (members: TeamMember[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const existingDocsSnapshot = await getDocs(teamMembersCollectionRef);
        
        // Create a map of new members for efficient lookup
        const newMembersMap = new Map(members.map(m => [m.id, m]));

        // Delete members that are no longer in the new list
        existingDocsSnapshot.docs.forEach(doc => {
            if (!newMembersMap.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });
        
        // Set/Update members from the new list
        members.forEach(member => {
            const docRef = doc(db, TEAM_MEMBERS_COLLECTION, member.id);
            batch.set(docRef, member);
        });
        
        await batch.commit();
    } catch (e) {
        console.error("Error saving team members: ", e);
    }
};
