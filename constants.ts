
import { CalendarEvent, Task, TeamMember, TaskStatus, Notification, NotificationType } from './types';

// --- CONSTANTS (ค่าคงที่) ---

// Key สำหรับเก็บข้อมูลใน LocalStorage (ถ้ามีการใช้)
export const CALENDAR_EVENTS_STORAGE_KEY = 'pr-calendar-events';
export const CONTACT_MESSAGES_STORAGE_KEY = 'pr-contact-messages';

// รายชื่อเดือนภาษาไทย
export const MONTH_NAMES_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// รายชื่อแผนกเริ่มต้น (ใช้สำหรับ Seeding ลง Database ครั้งแรก)
export const INITIAL_DEPARTMENTS: string[] = [
  'ส่วนงานอำนวยการ',
  'ส่วนงานจัดการ',
  'ส่วนงานสื่อสารองค์กร',
  'ส่วนงานวิศวกรรมระบบอาคารและความปลอดภัย',
  'ส่วนงานบุคคล',
  'ส่วนงานเลขานุการ 1',
  'ส่วนงานเลขานุการ 2',
  'ส่วนงานพัฒนาระบบสารสนเทศ',
  'ส่วนงานโครงสร้างเทคโนโลยีและเครือข่าย',
  'ส่วนงานบัญชี',
  'ส่วนงานการเงิน',
  'ส่วนงานกฎหมาย',
  'ส่วนงานทะเบียน',
  'ส่วนงานบริการสมาชิก',
  'ส่วนงานกำกับดูแลหน่วยงานอบรม',
  'ส่วนงานวิชาการ',
  'ส่วนงานวิจัย',
  'ส่วนงานทดสอบผู้สอบบัญชี',
  'ส่วนงานพัฒนาและกำกับดูแลคุณภาพของผู้ประกอบวิชาชีพบัญชี',
  'ส่วนงานอบรมและพัฒนาวิชาชีพ',
  'ส่วนงานทดสอบและประเมินผล',
  'ผู้อำนวยการ',
  'ผู้ช่วยผู้อำนวยการ',
  'สำนักงานคณะกรรมการจรรณยาบรรณ',
];

// ข้อมูลงานจำลอง (Mock Data) สำหรับทดสอบระบบตอนเริ่มต้น
export const MOCK_TASKS: Task[] = [
  {
    id: 'PR001',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายการตลาด',
    requesterEmail: 'marketing@example.com',
    department: 'การตลาด',
    taskTitle: 'ออกแบบแบนเนอร์โปรโมชั่น 12.12',
    taskDescription: 'ต้องการแบนเนอร์สำหรับแคมเปญ 12.12 สำหรับใช้บนโซเชียลมีเดียทุกช่องทาง ขนาด 1200x1200 และ 1080x1920',
    taskType: 'แบนเนอร์',
    dueDate: '2025-11-20',
    attachments: [{ name: 'brief-12-12.pdf', size: 120450, type: 'application/pdf' }],
    assigneeId: 'TM01',
    status: TaskStatus.IN_PROGRESS,
    isStarred: true,
    notes: [{
      id: 'note-pr001-1',
      author: 'สมชาย ใจดี',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      text: 'กำลังรอคอนเฟิร์มคอนเซ็ปต์จากลูกค้า'
    }],
    requestType: 'new',
    phone: '081-234-5678',
    committee: 'คณะกรรมการการตลาด',
    additionalNotes: 'ต้องการ Mood & Tone ที่ดูทันสมัย'
  },
  // ... (ข้อมูลจำลองอื่นๆ) ...
  {
    id: 'PR002',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายบุคคล',
    requesterEmail: 'hr@example.com',
    department: 'บุคคล',
    taskTitle: 'ถ่ายวิดีโอบรรยากาศงานเลี้ยงปีใหม่บริษัท',
    taskDescription: 'ต้องการวิดีโอไฮไลท์งานเลี้ยงปีใหม่ ความยาวไม่เกิน 3 นาที',
    taskType: 'วิดีโอ (ถ่ายทำ)',
    dueDate: '2025-11-27',
    attachments: [],
    assigneeId: 'TM02',
    status: TaskStatus.IN_PROGRESS,
    isStarred: false,
    notes: [],
    requestType: 'new',
    phone: '082-345-6789',
  },
  {
    id: 'PR003',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายขาย',
    requesterEmail: 'sales@example.com',
    department: 'ขาย',
    taskTitle: 'ทำโบรชัวร์สินค้าใหม่',
    taskDescription: 'รายละเอียดสินค้าและรูปภาพอยู่ในไฟล์แนบ ต้องการโบรชัวร์ขนาด A4 พับ 3 ตอน',
    taskType: 'โบรชัวร์',
    dueDate: '2025-11-17',
    attachments: [{ name: 'product-details.docx', size: 2500000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }],
    assigneeId: 'TM01',
    status: TaskStatus.NOT_STARTED,
    isStarred: false,
    notes: [],
    requestType: 'new',
    phone: '083-456-7890',
  },
  {
    id: 'PR004',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายบริหาร',
    requesterEmail: 'management@example.com',
    department: 'บริหาร',
    taskTitle: 'เขียนข่าวประชาสัมพันธ์เปิดตัว CEO คนใหม่',
    taskDescription: 'ต้องการข่าวสำหรับแจกสื่อมวลชน เกี่ยวกับการเข้ารับตำแหน่งของ CEO คนใหม่',
    taskType: 'ข่าวประชาสัมพันธ์',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: [],
    assigneeId: 'TM03',
    status: TaskStatus.COMPLETED,
    isStarred: false,
    notes: [{
        id: 'note-pr004-1',
        author: 'ณัฐพงศ์ ทรงพลัง',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        text: 'ส่งให้สื่อเรียบร้อยแล้วเมื่อวานนี้'
    }],
    requestType: 'edit',
    phone: '084-567-8901',
  },
  {
    id: 'PR005',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายจัดซื้อ',
    requesterEmail: 'procurement@example.com',
    department: 'จัดซื้อ',
    taskTitle: 'ออกแบบของที่ระลึกสำหรับแจกลูกค้า',
    taskDescription: 'ต้องการไอเดียและแบบของที่ระลึกในงบไม่เกิน 200 บาทต่อชิ้น',
    taskType: 'ของที่ระลึก',
    dueDate: '2025-12-04',
    attachments: [],
    assigneeId: 'TM01',
    status: TaskStatus.NOT_STARTED,
    isStarred: true,
    notes: [],
    requestType: 'new',
    phone: '085-678-9012',
  },
  {
    id: 'PR006',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายไอที',
    requesterEmail: 'it@example.com',
    department: 'เทคโนโลยีสารสนเทศ',
    taskTitle: 'ทำสไลด์นำเสนอระบบใหม่',
    taskDescription: 'ต้องการสไลด์สำหรับนำเสนอผู้บริหารเกี่ยวกับระบบ ERP ใหม่ จำนวน 20 สไลด์',
    taskType: 'สไลด์',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: [],
    assigneeId: 'TM04',
    status: TaskStatus.COMPLETED,
    isStarred: false,
    notes: [],
    requestType: 'other',
    phone: '086-789-0123',
  },
  {
    id: 'PR007',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    requesterName: 'ฝ่ายการตลาด',
    requesterEmail: 'marketing@example.com',
    department: 'การตลาด',
    taskTitle: 'จัดทำ Roll-up สำหรับงานอีเว้นท์',
    taskDescription: 'ต้องการ Roll-up ขนาด 80x200cm สำหรับงาน Thailand Mobile Expo',
    taskType: 'Roll-up',
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: [],
    assigneeId: 'TM02',
    status: TaskStatus.CANCELLED,
    isStarred: false,
    notes: [{
      id: 'note-pr007-1',
      author: 'สมชาย ใจดี',
      timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      text: 'ลูกค้ายกเลิกการออกบูธแล้ว งานนี้จึงถูกยกเลิก'
    }],
    requestType: 'new',
    phone: '081-234-5678'
  }
];

// ข้อมูลการแจ้งเตือนจำลอง
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTIF001',
    type: NotificationType.NEW_ASSIGNMENT,
    message: 'คุณได้รับมอบหมายงานใหม่: "ออกแบบของที่ระลึกสำหรับแจกลูกค้า"',
    taskId: 'PR005',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  // ...
  {
    id: 'NOTIF002',
    type: NotificationType.DUE_SOON,
    message: 'งาน "ทำโบรชัวร์สินค้าใหม่" ใกล้จะถึงกำหนดส่งแล้ว',
    taskId: 'PR003',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'NOTIF003',
    type: NotificationType.STATUS_UPDATE,
    message: 'สถานะของงาน "เขียนข่าวประชาสัมพันธ์เปิดตัว CEO คนใหม่" เปลี่ยนเป็น "เสร็จสิ้น"',
    taskId: 'PR004',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
   {
    id: 'NOTIF004',
    type: NotificationType.DUE_SOON,
    message: 'งาน "ออกแบบแบนเนอร์โปรโมชั่น 12.12" ใกล้ถึงกำหนดส่งแล้ว',
    taskId: 'PR001',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
];

// สีประจำสถานะงาน (ใช้ Tailwind CSS Classes)
export const TASK_STATUS_COLORS: { [key in TaskStatus]: string } = {
  [TaskStatus.NOT_STARTED]: 'bg-gray-500 dark:bg-gray-600', // สีเทา
  [TaskStatus.IN_PROGRESS]: 'bg-yellow-500 dark:bg-yellow-600', // สีเหลือง
  [TaskStatus.COMPLETED]: 'bg-green-500 dark:bg-green-600', // สีเขียว
  [TaskStatus.CANCELLED]: 'bg-red-500 dark:bg-red-600', // สีแดง
};

// สีประจำประเภทงาน (ใช้สำหรับ Initial Data Seeding)
// หมายเหตุ: ปัจจุบัน UI ใช้สีจาก Firestore (TaskTypeConfig) แทนค่าเหล่านี้แล้ว
export const TASK_TYPE_COLORS: { [key: string]: { bg: string; text: string; border: string; hex: string; } } = {
  'โบรชัวร์':      { bg: 'bg-rose-100 dark:bg-rose-900/50',      text: 'text-rose-700 dark:text-rose-300',      border: 'border-rose-500',      hex: '#f43f5e' },
  'แบนเนอร์':        { bg: 'bg-sky-100 dark:bg-sky-900/50',        text: 'text-sky-700 dark:text-sky-300',        border: 'border-sky-500',        hex: '#0ea5e9' },
  'โปสเตอร์':        { bg: 'bg-amber-100 dark:bg-amber-900/50',    text: 'text-amber-700 dark:text-amber-300',    border: 'border-amber-500',    hex: '#f59e0b' },
  'วิดีโอ (ถ่ายทำ)':   { bg: 'bg-purple-100 dark:bg-purple-900/50',  text: 'text-purple-700 dark:text-purple-300',  border: 'border-purple-500',  hex: '#a855f7' },
  'วิดีโอ (ตัดต่อ)':    { bg: 'bg-indigo-100 dark:bg-indigo-900/50',  text: 'text-indigo-700 dark:text-indigo-300',  border: 'border-indigo-500',  hex: '#6366f1' },
  'ภาพนิ่ง':         { bg: 'bg-pink-100 dark:bg-pink-900/50',      text: 'text-pink-700 dark:text-pink-300',      border: 'border-pink-500',      hex: '#ec4899' },
  'ข่าวประชาสัมพันธ์': { bg: 'bg-slate-100 dark:bg-slate-700',      text: 'text-slate-700 dark:text-slate-300',      border: 'border-slate-500',      hex: '#64748b' },
  'บทความ':       { bg: 'bg-emerald-100 dark:bg-emerald-900/50',text: 'text-emerald-700 dark:text-emerald-300',border: 'border-emerald-500',hex: '#10b981' },
  'โลโก้':          { bg: 'bg-orange-100 dark:bg-orange-900/50',  text: 'text-orange-700 dark:text-orange-300',  border: 'border-orange-500',  hex: '#f97316' },
  'ของที่ระลึก':      { bg: 'bg-teal-100 dark:bg-teal-900/50',      text: 'text-teal-700 dark:text-teal-300',      border: 'border-teal-500',      hex: '#14b8a6' },
  'Roll-up':       { bg: 'bg-cyan-100 dark:bg-cyan-900/50',      text: 'text-cyan-700 dark:text-cyan-300',      border: 'border-cyan-500',      hex: '#06b6d4' },
  'Backdrop':      { bg: 'bg-lime-100 dark:bg-lime-900/50',      text: 'text-lime-700 dark:text-lime-300',      border: 'border-lime-500',      hex: '#84cc16' },
  'ป้าย':          { bg: 'bg-yellow-100 dark:bg-yellow-900/50',  text: 'text-yellow-700 dark:text-yellow-300',  border: 'border-yellow-500',  hex: '#eab308' },
  'วุฒิบัตร':   { bg: 'bg-red-100 dark:bg-red-900/50',        text: 'text-red-700 dark:text-red-300',        border: 'border-red-500',        hex: '#ef4444' },
  'สไลด์':         { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/50',text: 'text-fuchsia-700 dark:text-fuchsia-300',border: 'border-fuchsia-500',hex: '#d946ef' },
  'ปกแฟ้ม':    { bg: 'bg-violet-100 dark:bg-violet-900/50',  text: 'text-violet-700 dark:text-violet-300',  border: 'border-violet-500',  hex: '#8b5cf6' },
  'งานชนิดอื่นๆ':         { bg: 'bg-stone-100 dark:bg-stone-700',      text: 'text-stone-700 dark:text-stone-300',      border: 'border-stone-500',      hex: '#78716c' },
};

// วันหยุดราชการสำหรับปฏิทิน
export const MOCK_HOLIDAYS: { date: string, name: string }[] = [
    { date: '2025-01-01', name: 'วันขึ้นปีใหม่' },
    { date: '2025-04-13', name: 'วันสงกรานต์' },
    { date: '2025-04-14', name: 'วันสงกรานต์' },
    { date: '2025-04-15', name: 'วันสงกรานต์' },
    { date: '2025-05-01', name: 'วันแรงงานแห่งชาติ' },
    { date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10' },
    { date: '2025-10-13', name: 'วันคล้ายวันสวรรคต ร.9' },
    { date: '2025-10-23', name: 'วันปิยมหาราช' },
    { date: '2025-12-05', name: 'วันพ่อแห่งชาติ' },
    { date: '2025-12-10', name: 'วันรัฐธรรมนูญ' },
    { date: '2025-12-31', name: 'วันสิ้นปี' },
];
