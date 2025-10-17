import { collection, onSnapshot, getDocs, writeBatch, doc, setDoc, updateDoc, deleteDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Task } from '../types';
import { MOCK_TASKS } from '../constants';

const TASKS_COLLECTION = 'tasks';
const tasksCollectionRef = collection(db, TASKS_COLLECTION);

export const seedInitialTasks = async () => {
    const snapshot = await getDocs(tasksCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial tasks...");
        const batch = writeBatch(db);
        MOCK_TASKS.forEach(task => {
            const docRef = doc(db, TASKS_COLLECTION, task.id);
            batch.set(docRef, task);
        });
        await batch.commit();
    }
};

// Fix: Explicitly type the snapshot parameter as QuerySnapshot<DocumentData> to resolve the type error.
export const onTasksUpdate = (callback: (tasks: Task[]) => void): (() => void) => {
    return onSnapshot(tasksCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const tasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        callback(tasks);
    });
};


export const addTask = async (newTask: Task): Promise<void> => {
    try {
        const taskDocRef = doc(db, TASKS_COLLECTION, newTask.id);
        await setDoc(taskDocRef, newTask);
    } catch (e) {
        console.error("Error adding task: ", e);
        throw e;
    }
};

export const updateTask = async (updatedTask: Task): Promise<void> => {
    try {
        const taskDocRef = doc(db, TASKS_COLLECTION, updatedTask.id);
        await updateDoc(taskDocRef, { ...updatedTask });
    } catch (e) {
        console.error("Error updating task: ", e);
        throw e;
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const taskDocRef = doc(db, TASKS_COLLECTION, taskId);
        await deleteDoc(taskDocRef);
    } catch(e) {
        console.error("Error deleting task: ", e);
        throw e;
    }
}