// Use this file to store configuration variables
// For example, the password for the admin area
// admin@pr1234

export const DEFAULT_ADMIN_PASSWORD = 'admin@pr1234';

/**
 * The URL of the Google Apps Script web app deployed to handle file uploads to Google Drive.
 * 
 * To get this URL:
 * 1. Create a new Google Apps Script project (script.google.com).
 * 2. Create a Google Drive folder where you want to store images and get its ID.
 * 3. Paste server-side script code (that accepts a POST request with file data and saves it to your Drive folder) into `Code.gs`.
 * 4. Deploy the script as a Web App:
 *    - Click "Deploy" > "New deployment".
 *    - Select "Web app" as the type.
 *    - In the configuration:
 *      - Execute as: "Me (your Google account)"
 *      - Who has access: "Anyone" (This allows the app to call it without user login)
 *    - Click "Deploy", authorize permissions, and copy the "Web app URL" here.
 * 
 * The script should accept a POST request with a JSON body like:
 * { "fileName": "...", "mimeType": "...", "data": "..." (base64 encoded) }
 * and return a JSON response like:
 * { "fileUrl": "..." }
 */
export const GOOGLE_DRIVE_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbyHoWqXJIxJoDTZWulGiR2xKVWT1XcAXDpNh-J_p2UG4OQN1AmP-Ai7MXhNRatX5yip/exec';
