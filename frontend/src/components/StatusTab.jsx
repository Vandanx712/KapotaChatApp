
const mockStatuses = [
  { id: "1", name: "My Status", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=me", time: "Add to my status", viewed: true },
  { id: "2", name: "Sarah Johnson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", time: "2 hours ago" },
  { id: "3", name: "Mike Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", time: "4 hours ago" },
  { id: "4", name: "Emma Wilson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma", time: "Today, 9:30 AM" },
  { id: "5", name: "James Brown", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james", time: "Yesterday" },
];

const StatusTab = () => {
  return (
    <div className="h-full bg-background p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Status Updates</h2>
      
      <div className="space-y-3">
        {mockStatuses.map((status, index) => (
          <div
            key={status.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 
                       cursor-pointer transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Avatar with ring */}
            <div className={`p-0.5 rounded-full ${status.id === "1" ? "bg-muted" : status.viewed ? "bg-muted" : "bg-primary"}`}>
              <div className="w-12 h-12 rounded-full bg-card p-0.5">
                <img
                  src={status.avatar}
                  alt={status.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{status.name}</h3>
              <p className="text-sm text-muted-foreground">{status.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusTab;
