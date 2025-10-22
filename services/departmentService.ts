import { collection, onSnapshot, getDocs, writeBatch, doc, addDoc, updateDoc, deleteDoc, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Department } from '../types';
import { INITIAL_DEPARTMENTS } from '../constants';

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
