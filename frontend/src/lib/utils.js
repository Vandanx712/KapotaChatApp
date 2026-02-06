export function formatMessageTime(data) {
    return new Date(data).toLocaleDateString('en-Us', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}