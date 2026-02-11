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
