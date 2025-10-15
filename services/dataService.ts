// A generic service for interacting with localStorage.

/**
 * Retrieves data from localStorage. If not present, saves and returns the fallback data.
 * @param key The localStorage key.
 * @param fallback The default data to use if nothing is stored.
 * @returns The stored or fallback data.
 */
export function getData<T>(key:string, fallback: T): T {
  const item = localStorage.getItem(key);
  if (item === null) {
    // If no data, store the fallback data for next time
    saveData(key, fallback);
    return fallback;
  }
  try {
    const parsed = JSON.parse(item);
    // A simple check to ensure we're dealing with array data where expected
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch (e) {
    console.error(`Error parsing JSON from localStorage key "${key}":`, e);
    localStorage.removeItem(key); // Clear corrupted data
    return fallback;
  }
}

/**
 * Saves data to localStorage.
 * @param key The localStorage key.
 * @param data The data to save.
 */
export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving data to localStorage key "${key}":`, e);
  }
}
