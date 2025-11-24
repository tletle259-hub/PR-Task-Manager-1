
import { collection, onSnapshot, writeBatch, doc, getDocs, addDoc, deleteDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CalendarEvent } from '../types';
import { MOCK_HOLIDAYS } from '../constants';

// --- CALENDAR SERVICE (บริการปฏิทิน) ---

const EVENTS_COLLECTION = 'calendarEvents';
const eventsCollectionRef = collection(db, EVENTS_COLLECTION);

// สร้างข้อมูลวันหยุดเริ่มต้นลงในปฏิทิน
export const seedInitialCalendarEvents = async () => {
    const snapshot = await getDocs(eventsCollectionRef);
    if (snapshot.empty) {
        console.log("Seeding initial calendar events (holidays)...");
        const batch = writeBatch(db);
        MOCK_HOLIDAYS.forEach(h => {
            const eventData: CalendarEvent = {
                id: `holiday-${h.date}`,
                title: h.name,
                start: new Date(h.date).toISOString(),
                end: new Date(h.date).toISOString(),
                allDay: true,
                color: '#10b981' // สีเขียวสำหรับวันหยุด
            };
            const eventDocRef = doc(db, EVENTS_COLLECTION, eventData.id);
            batch.set(eventDocRef, eventData);
        });
        await batch.commit();
    }
};

// ติดตามกิจกรรมในปฏิทิน
export const onCalendarEventsUpdate = (callback: (events: CalendarEvent[]) => void): (() => void) => {
    return onSnapshot(eventsCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
        const events: CalendarEvent[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
        callback(events);
    });
};

// บันทึก/อัปเดตกิจกรรมหลายรายการ
export const saveCalendarEvents = async (events: CalendarEvent[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        events.forEach(event => {
            const eventDocRef = doc(db, EVENTS_COLLECTION, event.id);
            batch.set(eventDocRef, event, { merge: true }); // Merge = ถ้ามีแล้วอัปเดต ถ้าไม่มีสร้างใหม่
        });
        await batch.commit();
    } catch (e) {
        console.error("Error saving calendar events: ", e);
    }
};

// เพิ่มกิจกรรมใหม่
export const addCalendarEvent = async (newEvent: Omit<CalendarEvent, 'id'>): Promise<void> => {
    try {
        await addDoc(eventsCollectionRef, newEvent);
    } catch (e) {
        console.error("Error adding calendar event: ", e);
    }
};

// ลบกิจกรรม
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
    try {
        const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
        await deleteDoc(eventDocRef);
    } catch (e) {
        console.error("Error deleting calendar event: ", e);
    }
};
