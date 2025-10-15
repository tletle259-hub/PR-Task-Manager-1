import { collection, onSnapshot, writeBatch, doc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CalendarEvent } from '../types';
import { MOCK_HOLIDAYS } from '../constants';

const EVENTS_COLLECTION = 'calendarEvents';
const eventsCollectionRef = collection(db, EVENTS_COLLECTION);

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
                color: '#10b981'
            };
            const eventDocRef = doc(db, EVENTS_COLLECTION, eventData.id);
            batch.set(eventDocRef, eventData);
        });
        await batch.commit();
    }
};

export const onCalendarEventsUpdate = (callback: (events: CalendarEvent[]) => void): (() => void) => {
    return onSnapshot(eventsCollectionRef, (snapshot) => {
        const events: CalendarEvent[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
        callback(events);
    });
};

export const saveCalendarEvents = async (events: CalendarEvent[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        events.forEach(event => {
            const eventDocRef = doc(db, EVENTS_COLLECTION, event.id);
            batch.set(eventDocRef, event, { merge: true }); // Use merge to update or create
        });
        await batch.commit();
    } catch (e) {
        console.error("Error saving calendar events: ", e);
    }
};

export const addCalendarEvent = async (newEvent: Omit<CalendarEvent, 'id'>): Promise<void> => {
    try {
        await addDoc(eventsCollectionRef, newEvent);
    } catch (e) {
        console.error("Error adding calendar event: ", e);
    }
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
    try {
        const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
        await deleteDoc(eventDocRef);
    } catch (e) {
        console.error("Error deleting calendar event: ", e);
    }
};
