
import { CalendarEvent, Task, TeamMember, TaskStatus, Notification, NotificationType, TaskType } from './types';

// --- CONSTANTS (ค่าคงที่) ---

// Key สำหรับเก็บข้อมูลใน LocalStorage (ถ้ามีการใช้)
export const CALENDAR_EVENTS_STORAGE_KEY = 'pr-calendar-events';
export const CONTACT_MESSAGES_STORAGE_KEY = 'pr-contact-messages';

// รายชื่อเดือนภาษาไทย
export const MONTH_NAMES_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// สีสถานะงาน (Tailwind Classes)
export const TASK_STATUS_COLORS = {
  [TaskStatus.NOT_STARTED]: 'bg-gray-500',
  [TaskStatus.IN_PROGRESS]: 'bg-yellow-500',
  [TaskStatus.COMPLETED]: 'bg-green-500',
  [TaskStatus.CANCELLED]: 'bg-red-500',
};

// สีประเภทงาน (Hex Codes)
export const TASK_TYPE_COLORS: { [key: string]: { hex: string } } = {
  [TaskType.BROCHURE]: { hex: '#ef4444' }, // red
  [TaskType.BANNER]: { hex: '#f97316' }, // orange
  [TaskType.POSTER]: { hex: '#eab308' }, // yellow
  [TaskType.VIDEO_SHOOT]: { hex: '#84cc16' }, // lime
  [TaskType.VIDEO_EDIT]: { hex: '#22c55e' }, // green
  [TaskType.PHOTO]: { hex: '#10b981' }, // emerald
  [TaskType.PRESS_RELEASE]: { hex: '#14b8a6' }, // teal
  [TaskType.ARTICLE]: { hex: '#06b6d4' }, // cyan
  [TaskType.LOGO]: { hex: '#0ea5e9' }, // sky
  [TaskType.SOUVENIR]: { hex: '#3b82f6' }, // blue
  [TaskType.ROLL_UP]: { hex: '#6366f1' }, // indigo
  [TaskType.BACKDROP]: { hex: '#8b5cf6' }, // violet
  [TaskType.SIGN]: { hex: '#a855f7' }, // purple
  [TaskType.CERTIFICATE]: { hex: '#d946ef' }, // fuchsia
  [TaskType.SLIDE]: { hex: '#ec4899' }, // pink
  [TaskType.FILE_COVER]: { hex: '#f43f5e' }, // rose
  [TaskType.OTHER]: { hex: '#64748b' }, // slate
};

// วันหยุดจำลอง (Mock Holidays)
export const MOCK_HOLIDAYS = [
    { date: '2025-01-01', name: 'วันขึ้นปีใหม่' },
    { date: '2025-04-13', name: 'วันสงกรานต์' },
    { date: '2025-04-14', name: 'วันสงกรานต์' },
    { date: '2025-04-15', name: 'วันสงกรานต์' },
    { date: '2025-05-01', name: 'วันแรงงานแห่งชาติ' },
    { date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10' },
    { date: '2025-08-12', name: 'วันแม่แห่งชาติ' },
    { date: '2025-10-13', name: 'วันนวมินทรมหาราช' },
    { date: '2025-10-23', name: 'วันปิยมหาราช' },
    { date: '2025-12-05', name: 'วันพ่อแห่งชาติ' },
    { date: '2025-12-10', name: 'วันรัฐธรรมนูญ' },
    { date: '2025-12-31', name: 'วันสิ้นปี' },
];

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
    id: "PR001-2025",
    timestamp: new Date().toISOString(),
    requesterName: "สมชาย ใจดี",
    requesterEmail: "somchai@example.com",
    department: "ส่วนงานสื่อสารองค์กร",
    phone: "081-234-5678",
    taskTitle: "ออกแบบโปสเตอร์งานสัมมนา",
    taskDescription: "ต้องการโปสเตอร์ขนาด A3 ธีมสีน้ำเงิน",
    taskType: "โปสเตอร์",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    status: TaskStatus.NOT_STARTED,
    assigneeIds: [],
    isStarred: false,
    attachments: [],
    notes: [],
    requestType: "new"
  }
];
