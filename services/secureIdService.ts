
import { collection, onSnapshot, getDocs, writeBatch, doc, setDoc, deleteDoc, query, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TeamMember } from '../types';

// --- SECURE ID / TEAM MEMBER SERVICE (บริการจัดการข้อมูลเจ้าหน้าที่) ---

const SECUREID_COLLECTION = 'secureID'; // ชื่อ Collection ใน Firestore
const secureIdCollectionRef = collection(db, SECUREID_COLLECTION);

// สร้างข้อมูลเจ้าหน้าที่เริ่มต้น (Admin)
export const seedInitialTeamMembers = async () => {
    const snapshot = await getDocs(secureIdCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial secureID user...");
        const initialUser = {
            name: 'ไตเติ้ล ณัฐกิตติ์ โชติกรณ์',
            position: 'นักศึกษา',
            avatar: 'https://i.pravatar.cc/150?u=TM01',
            id: 'nattakit', // Username
            password: "1234" // Password (Plaintext สำหรับโปรเจกต์นี้)
        };
        const docRef = doc(db, SECUREID_COLLECTION, "TM001");
        await setDoc(docRef, initialUser);
    }
};

// ติดตามการเปลี่ยนแปลงข้อมูลเจ้าหน้าที่แบบ Real-time
export const onTeamMembersUpdate = (callback: (members: TeamMember[]) => void): (() => void) => {
    const q = query(secureIdCollectionRef);
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const members: TeamMember[] = snapshot.docs.map(doc => {
            const data = doc.data() as { name: string, position: string, avatar: string, id: string };
            return {
                id: doc.id, // เช่น TM001
                name: data.name,
                position: data.position,
                avatar: data.avatar,
                username: data.id, // ใช้ field 'id' ใน document เก็บ username
                // ไม่ส่ง password กลับไปเพื่อความปลอดภัยเบื้องต้น
            } as TeamMember;
        });
        callback(members);
    });
};

// เพิ่มเจ้าหน้าที่ใหม่
export const addTeamMember = async (memberData: Omit<TeamMember, 'id' | 'avatar'>): Promise<void> => {
    const snapshot = await getDocs(secureIdCollectionRef);
    // หา ID ล่าสุดเพื่อรันเลขต่อ (TM001 -> TM002)
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
        avatar: `https://i.pravatar.cc/150?u=${newId}`, // ใช้ Avatar อัตโนมัติตาม ID
        id: memberData.username,
        password: memberData.password,
    };

    const docRef = doc(db, SECUREID_COLLECTION, newId);
    await setDoc(docRef, newMember);
};

// แก้ไขข้อมูลเจ้าหน้าที่
export const updateTeamMember = async (member: TeamMember): Promise<void> => {
    try {
        const docRef = doc(db, SECUREID_COLLECTION, member.id);
        const dataToUpdate: { [key: string]: any } = {
            name: member.name,
            position: member.position,
            avatar: member.avatar,
            id: member.username,
        };
        
        // อัปเดตรหัสผ่านเฉพาะเมื่อมีการส่งค่ามาใหม่
        if (member.password) {
            dataToUpdate.password = member.password;
        }

        await setDoc(docRef, dataToUpdate, { merge: true });
    } catch (e) {
        console.error("Error updating team member: ", e);
        throw e;
    }
};

// ลบเจ้าหน้าที่
export const deleteTeamMember = async (memberId: string): Promise<void> => {
    try {
        const docRef = doc(db, SECUREID_COLLECTION, memberId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Error deleting team member: ", e);
        throw e;
    }
}
