
import { seedInitialTasks } from './taskService';
import { seedInitialTeamMembers } from './secureIdService';
import { seedInitialCalendarEvents } from './calendarService';
import { seedInitialDepartments, seedInitialTaskTypeConfigs } from './departmentService';

let hasSeeded = false;

/**
 * ฟังก์ชันสำหรับ Seed ข้อมูลเริ่มต้นลง Firestore หากยังไม่เคยทำมาก่อน
 * จะถูกเรียก 1 ครั้งเมื่อแอปรันขึ้นมา
 */
export const seedInitialData = async () => {
  if (hasSeeded) {
    return;
  }

  console.log("Checking if initial data seeding is required...");
  try {
    // รันฟังก์ชัน Seed ทั้งหมดพร้อมกัน
    // ใช้ catch แยกเพื่อป้องกันแอปพังหากมีบางอันติด Permission
    await Promise.all([
      seedInitialTasks().catch(e => console.warn("Seed tasks failed (likely permission):", e.code)),
      seedInitialTeamMembers().catch(e => console.warn("Seed team members failed (likely permission):", e.code)),
      seedInitialCalendarEvents().catch(e => console.warn("Seed calendar failed (likely permission):", e.code)),
      seedInitialDepartments().catch(e => console.warn("Seed departments failed (likely permission):", e.code)),
      seedInitialTaskTypeConfigs().catch(e => console.warn("Seed configs failed (likely permission):", e.code)),
    ]);
    console.log("Initial data check complete.");
    hasSeeded = true;
  } catch (error) {
    // หากเกิดข้อผิดพลาดร้ายแรง ให้ log ไว้ แต่ไม่ throw เพื่อให้แอปรันต่อได้
    console.error("An error occurred during data seeding:", error);
  }
};
