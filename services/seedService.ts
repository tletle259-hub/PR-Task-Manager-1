
import { seedInitialTasks } from './taskService';
import { seedInitialTeamMembers } from './secureIdService';
import { seedInitialCalendarEvents } from './calendarService';
import { seedInitialDepartments, seedInitialTaskTypeConfigs } from './departmentService';

let hasSeeded = false;

/**
 * Seeds all initial data into Firestore if it hasn't been done already.
 * This function should be called once when the application starts.
 */
export const seedInitialData = async () => {
  if (hasSeeded) {
    return;
  }

  console.log("Checking if initial data seeding is required...");
  try {
    // The promises will run in parallel. We catch errors individually or collectively
    // to ensure the app doesn't crash if one fails due to permissions.
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
    // We swallow the error here so the main application initialization (attaching listeners) can proceed.
    // The listeners themselves have error handling.
    console.error("An error occurred during data seeding:", error);
  }
};
