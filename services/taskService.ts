
import { db } from '../firebaseConfig';
import { Task } from '../types';
import { MOCK_TASKS } from '../constants';
import firebase from 'firebase/compat/app';

// --- TASK SERVICE (บริการจัดการข้อมูลงาน) ---

const TASKS_COLLECTION = 'tasks';

// ฟังก์ชันสำหรับสร้างข้อมูลงานเริ่มต้น (Seeding) ลง Database หากยังไม่มีข้อมูล
export const seedInitialTasks = async () => {
    const snapshot = await db.collection(TASKS_COLLECTION).get();
    if (snapshot.empty) {
        console.log("Seeding initial tasks...");
        const batch = db.batch(); // ใช้ Batch write เพื่อเขียนหลาย Document พร้อมกัน
        MOCK_TASKS.forEach(task => {
            const docRef = db.collection(TASKS_COLLECTION).doc(task.id);
            batch.set(docRef, task);
        });
        await batch.commit(); // ยืนยันการเขียน
    }
};

// ฟังก์ชันสำหรับ Real-time Listener คอยติดตามการเปลี่ยนแปลงของงานใน Database
// เมื่อข้อมูลเปลี่ยน จะเรียก callback function ที่ส่งเข้ามา
export const onTasksUpdate = (callback: (tasks: Task[]) => void): (() => void) => {
    return db.collection(TASKS_COLLECTION).onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const tasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        callback(tasks);
    });
};

// เพิ่มงานใหม่ลง Database
export const addTask = async (newTask: Task): Promise<void> => {
    try {
        await db.collection(TASKS_COLLECTION).doc(newTask.id).set(newTask);
    } catch (e) {
        console.error("Error adding task: ", e);
        throw e;
    }
};

// อัปเดตข้อมูลงานที่มีอยู่
export const updateTask = async (updatedTask: Task): Promise<void> => {
    try {
        await db.collection(TASKS_COLLECTION).doc(updatedTask.id).update({ ...updatedTask });
    } catch (e) {
        console.error("Error updating task: ", e);
        throw e;
    }
};

// ลบงานออกจาก Database
export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        await db.collection(TASKS_COLLECTION).doc(taskId).delete();
    } catch(e) {
        console.error("Error deleting task: ", e);
        throw e;
    }
}

// ลบหลายงานพร้อมกัน (Batch Delete)
export const deleteTasks = async (taskIds: string[]): Promise<void> => {
    try {
        const batch = db.batch();
        taskIds.forEach(id => {
            const taskDocRef = db.collection(TASKS_COLLECTION).doc(id);
            batch.delete(taskDocRef);
        });
        await batch.commit();
    } catch (e) {
        console.error("Error deleting tasks batch: ", e);
        throw e;
    }
};

// นำเข้างานจาก JSON (Batch Import)
export const importTasksFromJSON = async (jsonData: any[]): Promise<void> => {
    try {
        // Firebase Batch จำกัดที่ 500 รายการต่อครั้ง เราจึงต้องแบ่ง Chunk
        const chunkSize = 450; 
        for (let i = 0; i < jsonData.length; i += chunkSize) {
            const chunk = jsonData.slice(i, i + chunkSize);
            const batch = db.batch();
            
            chunk.forEach((item: any) => {
                if (item.id) {
                    const docRef = db.collection(TASKS_COLLECTION).doc(item.id);
                    batch.set(docRef, item, { merge: true });
                }
            });
            
            await batch.commit();
            console.log(`Imported chunk ${i/chunkSize + 1}`);
        }
    } catch (e) {
        console.error("Error importing tasks from JSON: ", e);
        throw e;
    }
};
