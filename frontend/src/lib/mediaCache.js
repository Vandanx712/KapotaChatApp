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

/**
 * Deletes multiple media files from cache (e.g. on clear chat or delete conversation).
 * @param {string[]} mediaIds 
 */
export const deleteMultipleMediaFromCache = async (mediaIds = []) => {
  const validIds = Array.isArray(mediaIds) ? mediaIds.filter(Boolean) : [];
  if (validIds.length === 0) return;
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    validIds.forEach((id) => store.delete(id));
  } catch (error) {
    console.error("Error bulk deleting from media cache", error);
  }
};


const formatSize = (bytes = 0) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const getMediaCacheStats = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        let totalBytes = 0;
        const breakdown = {
          images: { count: 0, bytes: 0 },
          videos: { count: 0, bytes: 0 },
          audios: { count: 0, bytes: 0 },
          documents: { count: 0, bytes: 0 },
        };

        records.forEach((rec) => {
          const bytes = rec.blob?.size || rec.size || 0;
          const mime = (rec.mimeType || "").toLowerCase();
          totalBytes += bytes;

          if (mime.startsWith("image/")) {
            breakdown.images.count += 1;
            breakdown.images.bytes += bytes;
          } else if (mime.startsWith("video/")) {
            breakdown.videos.count += 1;
            breakdown.videos.bytes += bytes;
          } else if (mime.startsWith("audio/")) {
            breakdown.audios.count += 1;
            breakdown.audios.bytes += bytes;
          } else {
            breakdown.documents.count += 1;
            breakdown.documents.bytes += bytes;
          }
        });

        resolve({
          count: records.length,
          totalBytes,
          formatted: formatSize(totalBytes),
          breakdown: {
            images: { ...breakdown.images, formatted: formatSize(breakdown.images.bytes) },
            videos: { ...breakdown.videos, formatted: formatSize(breakdown.videos.bytes) },
            audios: { ...breakdown.audios, formatted: formatSize(breakdown.audios.bytes) },
            documents: { ...breakdown.documents, formatted: formatSize(breakdown.documents.bytes) },
          },
        });
      };

      request.onerror = () => {
        resolve({
          count: 0,
          totalBytes: 0,
          formatted: "0 KB",
          breakdown: {
            images: { count: 0, bytes: 0, formatted: "0 KB" },
            videos: { count: 0, bytes: 0, formatted: "0 KB" },
            audios: { count: 0, bytes: 0, formatted: "0 KB" },
            documents: { count: 0, bytes: 0, formatted: "0 KB" },
          },
        });
      };
    });
  } catch {
    return {
      count: 0,
      totalBytes: 0,
      formatted: "0 KB",
      breakdown: {
        images: { count: 0, bytes: 0, formatted: "0 KB" },
        videos: { count: 0, bytes: 0, formatted: "0 KB" },
        audios: { count: 0, bytes: 0, formatted: "0 KB" },
        documents: { count: 0, bytes: 0, formatted: "0 KB" },
      },
    };
  }
};


export const clearAllMediaCache = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error("Error clearing media cache", error);
    return false;
  }
};