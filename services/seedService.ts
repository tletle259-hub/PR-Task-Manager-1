import { seedInitialTasks } from './taskService';
import { seedInitialTeamMembers } from './teamService';
import { seedInitialNotifications } from './notificationService';
import { seedInitialCalendarEvents } from './calendarService';
import { seedInitialAdminPassword } from './securityService';

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
      seedInitialNotifications(),
      seedInitialCalendarEvents(),
      seedInitialAdminPassword(),
    ]);
    console.log("Initial data check complete.");
    hasSeeded = true;
  } catch (error) {
    console.error("An error occurred during data seeding:", error);
  }
};
