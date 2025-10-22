import { collection, onSnapshot, getDocs, writeBatch, doc, addDoc, updateDoc, deleteDoc, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Department, TaskTypeConfig } from '../types';
import { INITIAL_DEPARTMENTS, TASK_TYPE_COLORS } from '../constants';
import { TaskType as OldTaskTypeEnum } from '../types'; // Keep old enum for seeding

// --- DEPARTMENT SERVICE ---

const DEPARTMENTS_COLLECTION = 'departments';
const departmentsCollectionRef = collection(db, DEPARTMENTS_COLLECTION);

export const seedInitialDepartments = async () => {
    const snapshot = await getDocs(departmentsCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial departments...");
        const batch = writeBatch(db);
        INITIAL_DEPARTMENTS.forEach(name => {
            const docRef = doc(collection(db, DEPARTMENTS_COLLECTION));
            batch.set(docRef, { name });
        });
        await batch.commit();
    }
};

export const onDepartmentsUpdate = (callback: (departments: Department[]) => void): (() => void) => {
    const q = query(departmentsCollectionRef, orderBy('name'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const departments: Department[] = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Department));
        callback(departments);
    });
};

export const addDepartment = async (name: string): Promise<void> => {
    await addDoc(departmentsCollectionRef, { name });
};

export const updateDepartment = async (id: string, name: string): Promise<void> => {
    const docRef = doc(db, DEPARTMENTS_COLLECTION, id);
    await updateDoc(docRef, { name });
};

export const deleteDepartment = async (id: string): Promise<void> => {
    const docRef = doc(db, DEPARTMENTS_COLLECTION, id);
    await deleteDoc(docRef);
};


// --- TASK TYPE CONFIG SERVICE ---

const CONFIGS_COLLECTION = 'taskTypeConfigs';
const configsCollectionRef = collection(db, CONFIGS_COLLECTION);

const getRandomColor = () => {
    const palette = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];
    return palette[Math.floor(Math.random() * palette.length)];
}

export const seedInitialTaskTypeConfigs = async () => {
    const snapshot = await getDocs(configsCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial task type configs from enum...");
        const batch = writeBatch(db);
        let order = 0;
        for (const typeName of Object.values(OldTaskTypeEnum)) {
            const isOther = typeName === OldTaskTypeEnum.OTHER;
            const docRef = doc(collection(db, CONFIGS_COLLECTION));
            const configData: Omit<TaskTypeConfig, 'id'> = {
                name: typeName,
                dailyLimit: null,
                leadTimeDays: null,
                colorHex: TASK_TYPE_COLORS[typeName]?.hex || getRandomColor(),
                isEditable: !isOther,
                order: isOther ? 999 : order++,
            };
            batch.set(docRef, configData);
        }
        await batch.commit();
    }
};

export const onTaskTypeConfigsUpdate = (callback: (configs: TaskTypeConfig[]) => void): (() => void) => {
    // The original query `orderBy('order'), orderBy('name')` requires a composite index.
    // To fix the reported error without requiring manual index creation, we'll fetch the data
    // without sorting and then perform the sort on the client-side.
    const q = query(configsCollectionRef);
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const configs: TaskTypeConfig[] = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        } as TaskTypeConfig));
        
        // Sort on the client-side to avoid Firestore index requirement.
        configs.sort((a, b) => {
            if (a.order !== b.order) {
                return (a.order || 0) - (b.order || 0);
            }
            return a.name.localeCompare(b.name, 'th');
        });

        callback(configs);
    });
};

export const addTaskTypeConfig = async (configData: {name: string, dailyLimit: number | null, leadTimeDays: number | null}): Promise<void> => {
    const snapshot = await getDocs(configsCollectionRef);
    const maxOrder = Math.max(0, ...snapshot.docs.map(doc => doc.data().order || 0).filter(o => o < 999));

    await addDoc(configsCollectionRef, { 
        name: configData.name,
        dailyLimit: configData.dailyLimit,
        leadTimeDays: configData.leadTimeDays,
        colorHex: getRandomColor(),
        isEditable: true,
        order: maxOrder + 1,
    });
};

export const updateTaskTypeConfig = async (id: string, updates: Partial<Omit<TaskTypeConfig, 'id'>>): Promise<void> => {
    const docRef = doc(db, CONFIGS_COLLECTION, id);
    await updateDoc(docRef, updates);
};

export const deleteTaskTypeConfig = async (id: string): Promise<void> => {
    const docRef = doc(db, CONFIGS_COLLECTION, id);
    await deleteDoc(docRef);
};