import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiPlus, FiX, FiTrash2, FiClock } from 'react-icons/fi';
import { Task, CalendarEvent } from '../types';
import { TASK_TYPE_COLORS } from '../constants';
import { onCalendarEventsUpdate, saveCalendarEvents, deleteCalendarEvent, addCalendarEvent } from '../services/calendarService';

type ViewMode = 'month' | 'week' | 'day';

// A union type for items in the calendar to handle Tasks and CalendarEvents.
type CalendarItem = (Task & { itemType: 'task' }) | (CalendarEvent & { itemType: 'event' });

const EVENT_COLORS = [ '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];

// --- HELPER FUNCTIONS ---
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const formatToYyyyMmDd = (date: Date) => date.toISOString().split('T')[0];
const formatToTime = (date: Date) => date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });

// --- MODAL COMPONENT ---
const EventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'> | CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  event: Partial<CalendarEvent> | null;
}> = ({ isOpen, onClose, onSave, onDelete, event }) => {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});

  useEffect(() => {
    setFormData(event || { color: EVENT_COLORS[0], allDay: true, start: new Date().toISOString() });
  }, [event]);

  if (!isOpen) return null;

  const handleSave = () => {
    const finalEventData = {
      title: formData.title || 'กิจกรรมใหม่',
      start: formData.start || new Date().toISOString(),
      end: formData.end || formData.start || new Date().toISOString(),
      allDay: formData.allDay ?? true,
      color: formData.color || EVENT_COLORS[0],
    };

    if(formData.id) {
        onSave({ id: formData.id, ...finalEventData });
    } else {
        onSave(finalEventData);
    }
  };
  
  const handleDelete = () => {
      if(formData.id && window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้?')) {
          onDelete(formData.id);
      }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold">{formData.id ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}</h3>
          <button onClick={onClose} className="icon-interactive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><FiX /></button>
        </header>
        <div className="p-6 space-y-4">
          <input type="text" placeholder="ชื่องาน" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" />
          <div className="flex items-center gap-4">
            <label>วันที่:</label>
            <input type="date" value={formatToYyyyMmDd(new Date(formData.start || Date.now()))} onChange={e => setFormData({ ...formData, start: new Date(e.target.value).toISOString() })} className="form-input flex-grow" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="allDay" checked={formData.allDay} onChange={e => setFormData({ ...formData, allDay: e.target.checked })} />
            <label htmlFor="allDay">ตลอดวัน</label>
          </div>
          <div>
            <label className="block mb-2">สี:</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map(color => (
                <button key={color} onClick={() => setFormData({ ...formData, color })} className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-blue-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            {formData.id && <button onClick={handleDelete} className="icon-interactive px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"><FiTrash2/> ลบ</button>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="icon-interactive px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">ยกเลิก</button>
            <button onClick={handleSave} className="icon-interactive px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-blue-700">บันทึก</button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};


interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-10-17')); // Default to Oct 2025 to show mock data
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
  
  useEffect(() => {
    const unsubscribe = onCalendarEventsUpdate(setCustomEvents);
    return () => unsubscribe();
  }, []);

  const handleSaveEvent = async (event: Omit<CalendarEvent, 'id'> | CalendarEvent) => {
    if ('id' in event) {
        const eventToSave = { ...event };
        if (customEvents.find(e => e.id === event.id)) {
             await saveCalendarEvents([eventToSave]);
        } else {
             delete (eventToSave as Partial<CalendarEvent>).id;
             await addCalendarEvent(eventToSave);
        }
    } else {
        await addCalendarEvent(event);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  }

  const handleDeleteEvent = async (eventId: string) => {
    await deleteCalendarEvent(eventId);
    setIsModalOpen(false);
    setSelectedEvent(null);
  }

  const allItems: CalendarItem[] = useMemo(() => [
    ...tasks.map((t): CalendarItem => ({...t, itemType: 'task'})),
    ...customEvents.map((e): CalendarItem => ({...e, itemType: 'event'}))
  ], [tasks, customEvents]);
  
  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Set to first day to avoid month skipping issues
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const MiniCalendar = () => {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const days = Array.from({length: firstDay.getDay()}).map(() => null)
        .concat(Array.from({length: lastDay.getDate()}, (_, i) => i + 1));
      
      return <div className="p-4">
          <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{currentDate.toLocaleDateString('th-TH', {month: 'long', year: 'numeric'})}</span>
              <div>
                  <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FiChevronLeft size={16}/></button>
                  <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><FiChevronRight size={16}/></button>
              </div>
          </div>
          <div className="grid grid-cols-7 text-center text-xs gap-1">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => <span key={d} className="text-gray-500">{d}</span>)}
              {days.map((d, i) => (
                  <button key={i} disabled={!d} onClick={() => d && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))} className={`w-8 h-8 rounded-full transition-colors ${d ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : ''} ${d && isSameDay(currentDate, new Date(currentDate.getFullYear(), currentDate.getMonth(), d)) ? 'bg-brand-primary text-white' : ''} ${d && isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), d)) ? 'font-bold ring-1 ring-brand-primary' : ''}`}>
                      {d}
                  </button>
              ))}
          </div>
      </div>
  }

  const RenderView = () => {
      const today = new Date();
      
      if(viewMode === 'month') {
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const daysInMonth = [];
          for (let i = 0; i < firstDayOfMonth.getDay(); i++) daysInMonth.push({ date: null });
          for (let i = 1; i <= lastDayOfMonth.getDate(); i++) daysInMonth.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) });
          while (daysInMonth.length % 7 !== 0 || daysInMonth.length < 35) daysInMonth.push({ date: null });

          return <div className="grid grid-cols-7 grid-rows-5 auto-rows-fr gap-1 flex-grow">
              {daysInMonth.map((day, index) => {
                  const itemsForDay = day.date ? allItems.filter(item => {
                      if (item.itemType === 'task') {
                          return isSameDay(new Date(item.dueDate), day.date as Date);
                      } else {
                          return isSameDay(new Date(item.start), day.date as Date);
                      }
                  }) : [];
                  
                  return <div key={index} onClick={() => day.date && !itemsForDay.length && (setSelectedEvent({start: day.date.toISOString()}), setIsModalOpen(true))} className={`relative flex flex-col p-1.5 rounded-lg transition-colors min-h-[100px] overflow-hidden ${day.date ? 'bg-white dark:bg-dark-card/50 cursor-pointer' : 'bg-gray-50 dark:bg-dark-bg/20'}`}>
                       {day.date && <span className={`self-end text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day.date, today) ? 'bg-brand-primary text-white' : 'text-gray-500 dark:text-dark-text-muted'}`}>{day.date.getDate()}</span>}
                      <div className="flex-grow mt-1 space-y-1 overflow-y-auto text-left text-xs">
                          {itemsForDay.slice(0,3).map(item => {
                              const isTask = item.itemType === 'task';
                              const title = isTask ? item.taskTitle : item.title;
                              const colorHex = isTask ? TASK_TYPE_COLORS[item.taskType]?.hex : item.color;
                              return <div 
                                key={item.id} 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (isTask) {
                                    onSelectTask(item);
                                  } else {
                                    setSelectedEvent(item);
                                    setIsModalOpen(true);
                                  }
                                }} 
                                className={`px-2 py-0.5 font-medium rounded truncate cursor-pointer`} 
                                style={{backgroundColor: colorHex ? colorHex + '33' : undefined, color: colorHex, borderLeft: `3px solid ${colorHex}`}} 
                                title={title}>{title}
                              </div>
                          })}
                          {itemsForDay.length > 3 && <div className="text-center font-bold text-gray-500">...อีก {itemsForDay.length - 3} รายการ</div>}
                      </div>
                  </div>
              })}
          </div>
      }
      
      if(viewMode === 'week') {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const weekDays = Array.from({length: 7}).map((_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));

          return <div className="grid grid-cols-7 gap-1 flex-grow">
              {weekDays.map(day => {
                   const itemsForDay = allItems.filter(item => {
                       if (item.itemType === 'task') {
                           return isSameDay(new Date(item.dueDate), day);
                       } else {
                           return isSameDay(new Date(item.start), day);
                       }
                   });
                   return <div key={day.toISOString()} className="bg-white dark:bg-dark-card/50 rounded-lg p-2 flex flex-col">
                       <div className={`text-center mb-2 pb-1 border-b dark:border-dark-border ${isSameDay(day, today) ? 'text-brand-primary font-bold' : ''}`}>
                           <p className="text-sm">{day.toLocaleDateString('th-TH', {weekday: 'short'})}</p>
                           <p className="text-xl">{day.getDate()}</p>
                       </div>
                       <div className="space-y-1 overflow-y-auto text-xs">{itemsForDay.map(item => {
                           const isTask = item.itemType === 'task';
                           const title = isTask ? item.taskTitle : item.title;
                           const colorHex = isTask ? TASK_TYPE_COLORS[item.taskType]?.hex : item.color;
                           const isAllDay = isTask ? true : item.allDay;
                           return <div 
                            key={item.id} 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isTask) {
                                  onSelectTask(item);
                                } else {
                                  setSelectedEvent(item);
                                  setIsModalOpen(true);
                                }
                            }} 
                            className={`p-2 font-medium rounded cursor-pointer`} 
                            style={{backgroundColor: colorHex ? colorHex + '33' : undefined, color: colorHex}}
                            >{!isAllDay && <FiClock className="inline mr-1" />} {title}</div>
                       })}</div>
                   </div>
              })}
          </div>
      }

       if(viewMode === 'day') {
          const itemsForDay = allItems.filter(item => {
              if (item.itemType === 'task') {
                  return isSameDay(new Date(item.dueDate), currentDate);
              } else {
                  return isSameDay(new Date(item.start), currentDate);
              }
          }).sort((a,b) => {
              const dateA = a.itemType === 'task' ? new Date(a.dueDate) : new Date(a.start);
              const dateB = b.itemType === 'task' ? new Date(b.dueDate) : new Date(b.start);
              return dateA.getTime() - dateB.getTime()
          });
          return <div className="bg-white dark:bg-dark-card/50 rounded-lg p-4 flex-grow overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{currentDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
              <div className="space-y-2">{itemsForDay.map(item => {
                const isTask = item.itemType === 'task';
                const title = isTask ? item.taskTitle : item.title;
                const colorHex = isTask ? TASK_TYPE_COLORS[item.taskType]?.hex : item.color;
                const isAllDay = isTask ? true : item.allDay;
                const startTime = !isTask ? new Date(item.start) : null;
                return <div 
                    key={item.id} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isTask) {
                            onSelectTask(item);
                        } else {
                            setSelectedEvent(item);
                            setIsModalOpen(true);
                        }
                    }} 
                    className={`p-3 font-medium rounded cursor-pointer flex items-center`} 
                    style={{backgroundColor: colorHex ? colorHex + '33' : undefined, color: colorHex}}
                    > {!isAllDay && startTime && <span className="w-20 text-sm">{formatToTime(startTime)}</span>} {title}</div>
              })}</div>
          </div>
       }
      
      return null;
  }
  

  return (
    <div className="bg-white dark:bg-dark-card p-2 sm:p-4 rounded-xl shadow-lg h-full flex flex-col md:flex-row gap-4">
       <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} event={selectedEvent} />
      
       {/* Sidebar */}
       <aside className="w-full md:w-64 flex-shrink-0 bg-gray-50 dark:bg-dark-bg/50 rounded-lg">
           <div className="p-4">
               <button onClick={() => {setSelectedEvent(null); setIsModalOpen(true)}} className="icon-interactive w-full bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                   <FiPlus/> เหตุการณ์ใหม่
               </button>
           </div>
           <MiniCalendar/>
       </aside>

      {/* Main Calendar */}
      <div className="flex-grow flex flex-col">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-4 p-2">
            <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)} className="icon-interactive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><FiChevronLeft size={20}/></button>
                <h2 className="text-xl font-bold w-48 text-center">{currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)} className="icon-interactive p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><FiChevronRight size={20}/></button>
                <button onClick={() => setCurrentDate(new Date())} className="icon-interactive px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border dark:border-gray-600">วันนี้</button>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mt-4 sm:mt-0">
                {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                    <button key={v} onClick={() => setViewMode(v)} className={`icon-interactive px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === v ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}>
                        {{month: 'เดือน', week: 'สัปดาห์', day: 'วัน'}[v]}
                    </button>
                ))}
            </div>
        </header>

        <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-500 dark:text-gray-400 mb-2 px-2">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map(day => <div key={day} className="hidden md:block">{day}</div>)}
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => <div key={day} className="md:hidden">{day}</div>)}
        </div>
        
        <main className="flex-grow flex flex-col bg-gray-100 dark:bg-dark-bg rounded-lg p-1">
            <AnimatePresence mode="wait">
                <motion.div key={viewMode + currentDate.getMonth()} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} exit={{ opacity: 0.5 }} transition={{ duration: 0.2 }} className="flex-grow flex flex-col">
                    <RenderView />
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
       <style>{`.form-input { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #d1d5db; background-color: #f9fafb; } .dark .form-input { border-color: #4b5563; background-color: #374151; }`}</style>
    </div>
  );
};

export default CalendarView;