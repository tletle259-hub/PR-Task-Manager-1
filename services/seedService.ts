import { seedInitialTasks } from './taskService';
import { seedInitialTeamMembers } from './secureIdService';
import { seedInitialCalendarEvents } from './calendarService';

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
    // The promises will run in parallel
    await Promise.all([
      seedInitialTasks(),
      seedInitialTeamMembers(),
      seedInitialCalendarEvents(),
    ]);
    console.log("Initial data check complete.");
    hasSeeded = true;
  } catch (error) {
    console.error("An error occurred during data seeding:", error);
  }
};