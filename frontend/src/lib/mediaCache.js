const DB_NAME = "kapota_media_db";
const DB_VERSION = 1;
const STORE_NAME = "media_cache";


const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create an object store with 'mediaId' as key path
        db.createObjectStore(STORE_NAME, { keyPath: "mediaId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};


export const getCachedMedia = async (mediaId) => {
  if (!mediaId) return null;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(mediaId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error("Error reading from media cache", request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error("IndexedDB error:", error);
    return null;
  }
};


export const saveMediaToCache = async (mediaId, { blob, mimeType, name, size }) => {
  if (!mediaId || !blob) return;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        mediaId,
        blob,
        mimeType,
        name,
        size,
        savedAt: Date.now(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error("Error saving media to cache", request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error("IndexedDB save error:", error);
  }
};


export const deleteMediaFromCache = async (mediaId) => {
  if (!mediaId) return;
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(mediaId);
  } catch (error) {
    console.error("Error deleting from media cache", error);
  }
};