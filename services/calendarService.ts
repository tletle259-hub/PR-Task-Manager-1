import { CalendarEvent } from '../types';
import { CALENDAR_EVENTS_STORAGE_KEY, MOCK_HOLIDAYS } from '../constants';
import { getData, saveData } from './dataService';

const getInitialEvents = (): CalendarEvent[] => {
    return MOCK_HOLIDAYS.map(h => ({
        id: `holiday-${h.date}`,
        title: h.name,
        start: new Date(h.date).toISOString(),
        end: new Date(h.date).toISOString(),
        allDay: true,
        color: '#10b981'
    }));
}

export const getCalendarEvents = (): CalendarEvent[] => {
    return getData<CalendarEvent[]>(CALENDAR_EVENTS_STORAGE_KEY, getInitialEvents());
};

export const saveCalendarEvents = (events: CalendarEvent[]): void => {
    saveData<CalendarEvent[]>(CALENDAR_EVENTS_STORAGE_KEY, events);
};
