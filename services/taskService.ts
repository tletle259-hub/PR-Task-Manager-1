
import { collection, onSnapshot, getDocs, writeBatch, doc, setDoc, updateDoc, deleteDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Task } from '../types';
import { MOCK_TASKS } from '../constants';

// --- TASK SERVICE (บริการจัดการข้อมูลงาน) ---

const TASKS_COLLECTION = 'tasks';
const tasksCollectionRef = collection(db, TASKS_COLLECTION);

// ฟังก์ชันสำหรับสร้างข้อมูลงานเริ่มต้น (Seeding) ลง Database หากยังไม่มีข้อมูล
export const seedInitialTasks = async () => {
    const snapshot = await getDocs(tasksCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial tasks...");
        const batch = writeBatch(db); // ใช้ Batch write เพื่อเขียนหลาย Document พร้อมกัน
        MOCK_TASKS.forEach(task => {
            const docRef = doc(db, TASKS_COLLECTION, task.id);
            batch.set(docRef, task);
        });
        await batch.commit(); // ยืนยันการเขียน
    }
};

// ฟังก์ชันสำหรับ Real-time Listener คอยติดตามการเปลี่ยนแปลงของงานใน Database
// เมื่อข้อมูลเปลี่ยน จะเรียก callback function ที่ส่งเข้ามา
export const onTasksUpdate = (callback: (tasks: Task[]) => void): (() => void) => {
    return onSnapshot(tasksCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const tasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        callback(tasks);
    });
};

// เพิ่มงานใหม่ลง Database
export const addTask = async (newTask: Task): Promise<void> => {
    try {
        const taskDocRef = doc(db, TASKS_COLLECTION, newTask.id);
        await setDoc(taskDocRef, newTask);
    } catch (e) {
        console.error("Error adding task: ", e);
        throw e;
    }
};

// อัปเดตข้อมูลงานที่มีอยู่
export const updateTask = async (updatedTask: Task): Promise<void> => {
    try {
        const taskDocRef = doc(db, TASKS_COLLECTION, updatedTask.id);
        await updateDoc(taskDocRef, { ...updatedTask });
    } catch (e) {
        console.error("Error updating task: ", e);
        throw e;
    }
};

// ลบงานออกจาก Database
export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const taskDocRef = doc(db, TASKS_COLLECTION, taskId);
        await deleteDoc(taskDocRef);
    } catch(e) {
        console.error("Error deleting task: ", e);
        throw e;
    }
}
