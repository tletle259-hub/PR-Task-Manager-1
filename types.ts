export enum TaskStatus {
  NOT_STARTED = 'ยังไม่ดำเนินการ',
  IN_PROGRESS = 'กำลังดำเนินการ',
  COMPLETED = 'เสร็จสิ้น',
  CANCELLED = 'ยกเลิก',
}

// This enum is now deprecated for UI components and is only used for the initial data seeding.
// All UI components should use the dynamic TaskTypeConfig collection from Firestore.
export enum TaskType {
  BROCHURE = 'โบรชัวร์',
  BANNER = 'แบนเนอร์',
  POSTER = 'โปสเตอร์',
  VIDEO_SHOOT = 'วิดีโอ (ถ่ายทำ)',
  VIDEO_EDIT = 'วิดีโอ (ตัดต่อ)',
  PHOTO = 'ภาพนิ่ง',
  PRESS_RELEASE = 'ข่าวประชาสัมพันธ์',
  ARTICLE = 'บทความ',
  LOGO = 'โลโก้',
  SOUVENIR = 'ของที่ระลึก',
  ROLL_UP = 'Roll-up',
  BACKDROP = 'Backdrop',
  SIGN = 'ป้าย',
  CERTIFICATE = 'วุฒิบัตร',
  SLIDE = 'สไลด์',
  FILE_COVER = 'ปกแฟ้ม',
  OTHER = 'งานชนิดอื่นๆ',
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Note {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export interface Task {
  id: string;
  timestamp: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  taskTitle: string;
  taskDescription: string;
  taskType: string; // Changed from TaskType enum to string
  dueDate: string;
  attachments: Attachment[];
  assigneeId: string | null;
  status: TaskStatus;
  isStarred: boolean;
  notes: Note[];

  // New fields for the detailed form
  requestType: 'new' | 'edit' | 'other' | 'project';
  committee?: string;
  phone: string;
  otherTaskTypeName?: string;
  additionalNotes?: string;

  // New fields for Project-based tasks
  projectId?: string;
  projectName?: string;
}

// New SubTask interface for project-based forms
export interface SubTask {
  id: string;
  taskType: string;
  otherTaskTypeName: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
}


export interface TeamMember {
  id: string; // Document ID, e.g., TM01
  name:string;
  position: string;
  avatar: string;
  username?: string;
  password?: string;
}

// New User interface for requesters
export interface User {
  id: string; // Firestore document ID
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  position: string;
  department: string;
  email: string;
  username: string;
  password?: string; // Should be hashed in a real app, plaintext for this scope
  msalAccountId?: string;
}


export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  allDay: boolean;
  color: string;
}

export enum NotificationType {
  NEW_ASSIGNMENT = 'มอบหมายงานใหม่',
  DUE_SOON = 'งานใกล้ถึงกำหนด',
  STATUS_UPDATE = 'สถานะงานเปลี่ยนแปลง',
  NEW_TASK = 'มีงานใหม่เข้ามา',
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  taskId: string;
  timestamp: string;
  isRead: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Department {
  id: string;
  name: string;
}

export interface TaskTypeConfig {
  id: string;
  name: string;
  dailyLimit: number | null;
  leadTimeDays: number | null;
  colorHex: string;
  isEditable: boolean;
  order: number;
}