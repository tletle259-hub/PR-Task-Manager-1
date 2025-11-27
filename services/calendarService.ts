
import { db } from '../firebaseConfig';
import { CalendarEvent } from '../types';
import { MOCK_HOLIDAYS } from '../constants';
import firebase from 'firebase/compat/app';

// --- CALENDAR SERVICE (บริการปฏิทิน) ---

const EVENTS_COLLECTION = 'calendarEvents';

// สร้างข้อมูลวันหยุดเริ่มต้นลงในปฏิทิน
export const seedInitialCalendarEvents = async () => {
    const snapshot = await db.collection(EVENTS_COLLECTION).get();
    if (snapshot.empty) {
        console.log("Seeding initial calendar events (holidays)...");
        const batch = db.batch();
        MOCK_HOLIDAYS.forEach(h => {
            const eventData: CalendarEvent = {
                id: `holiday-${h.date}`,
                title: h.name,
                start: new Date(h.date).toISOString(),
                end: new Date(h.date).toISOString(),
                allDay: true,
                color: '#10b981' // สีเขียวสำหรับวันหยุด
            };
            const eventDocRef = db.collection(EVENTS_COLLECTION).doc(eventData.id);
            batch.set(eventDocRef, eventData);
        });
        await batch.commit();
    }
};

// ติดตามกิจกรรมในปฏิทิน
export const onCalendarEventsUpdate = (callback: (events: CalendarEvent[]) => void): (() => void) => {
    return db.collection(EVENTS_COLLECTION).onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
        const events: CalendarEvent[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
        callback(events);
    });
};

// บันทึก/อัปเดตกิจกรรมหลายรายการ
export const saveCalendarEvents = async (events: CalendarEvent[]): Promise<void> => {
    try {
        const batch = db.batch();
        events.forEach(event => {
            const eventDocRef = db.collection(EVENTS_COLLECTION).doc(event.id);
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
        await db.collection(EVENTS_COLLECTION).add(newEvent);
    } catch (e) {
        console.error("Error adding calendar event: ", e);
    }
};

// ลบกิจกรรม
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
    try {
        await db.collection(EVENTS_COLLECTION).doc(eventId).delete();
    } catch (e) {
        console.error("Error deleting calendar event: ", e);
    }
};
