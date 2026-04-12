export function formatMessageTime(data) {
  const today = new Date();
  const msgDate = new Date(data);
  if (today.toDateString() == msgDate.toDateString()) {
    return msgDate.toLocaleTimeString("en-uk", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return msgDate.toLocaleDateString("en-uk", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

export function mergeUniqueById(current = [], incoming = []) {
  const seen = new Set();
  const merged = [];

  [...current, ...incoming].forEach((item) => {
    const id = item?._id?.toString?.() ?? item?._id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    merged.push(item);
  });

  return merged;
}
