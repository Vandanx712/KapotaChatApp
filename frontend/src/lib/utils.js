export function formatMessageTime(data) {
  const msgDate = new Date(data);
  if (Number.isNaN(msgDate.getTime())) return "";

  return msgDate.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function isSameMessageDay(first, second) {
  const firstDate = new Date(first);
  const secondDate = new Date(second);
  if (
    Number.isNaN(firstDate.getTime()) ||
    Number.isNaN(secondDate.getTime())
  ) {
    return false;
  }

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function formatMessageDate(data) {
  const msgDate = new Date(data);
  if (Number.isNaN(msgDate.getTime())) return "";

  const today = new Date();
  if (isSameMessageDay(msgDate, today)) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameMessageDay(msgDate, yesterday)) return "Yesterday";

  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(today.getDate() - 6);
  sixDaysAgo.setHours(0, 0, 0, 0);
  if (msgDate >= sixDaysAgo && msgDate < today) {
    return msgDate.toLocaleDateString("en-GB", { weekday: "long" });
  }

  return msgDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(msgDate.getFullYear() !== today.getFullYear()
      ? { year: "numeric" }
      : {}),
  });
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

export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
