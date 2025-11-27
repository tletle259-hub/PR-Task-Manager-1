
import { db } from '../firebaseConfig';
import { TeamMember } from '../types';
import firebase from 'firebase/compat/app';

// --- SECURE ID / TEAM MEMBER SERVICE (บริการจัดการข้อมูลเจ้าหน้าที่) ---

const SECUREID_COLLECTION = 'secureID'; // ชื่อ Collection ใน Firestore

// สร้างข้อมูลเจ้าหน้าที่เริ่มต้น (Admin)
export const seedInitialTeamMembers = async () => {
    const snapshot = await db.collection(SECUREID_COLLECTION).get();
    if (snapshot.empty) {
        console.log("Seeding initial secureID user (admin)...");
        // สร้าง User เริ่มต้น 1 คน
        const initialUser: TeamMember = {
            id: 'TM001',
            name: 'ผู้ดูแลระบบ (Admin)',
            position: 'Admin',
            avatar: 'https://i.pravatar.cc/150?u=TM001',
            username: 'admin',
        };
        
        // เก็บ Password แยกใน Field (ในระบบจริงควร Hash)
        await db.collection(SECUREID_COLLECTION).doc(initialUser.id).set({
            ...initialUser,
            id: 'admin', // username field for login query
            password: 'password123' // รหัสผ่านเริ่มต้น
        });
    }
};

// ติดตามการเปลี่ยนแปลงข้อมูลเจ้าหน้าที่แบบ Real-time
export const onTeamMembersUpdate = (callback: (members: TeamMember[]) => void): (() => void) => {
    return db.collection(SECUREID_COLLECTION).onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
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
    const snapshot = await db.collection(SECUREID_COLLECTION).get();
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

    await db.collection(SECUREID_COLLECTION).doc(newId).set(newMember);
};

// แก้ไขข้อมูลเจ้าหน้าที่
export const updateTeamMember = async (member: TeamMember): Promise<void> => {
    try {
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

        await db.collection(SECUREID_COLLECTION).doc(member.id).set(dataToUpdate, { merge: true });
    } catch (e) {
        console.error("Error updating team member: ", e);
        throw e;
    }
};

// ลบเจ้าหน้าที่
export const deleteTeamMember = async (memberId: string): Promise<void> => {
    try {
        await db.collection(SECUREID_COLLECTION).doc(memberId).delete();
    } catch (e) {
        console.error("Error deleting team member: ", e);
        throw e;
    }
}
