import { FiVideo, FiPhone } from "react-icons/fi";

const VideoCallTab = () => {
  const recentCalls = [
    {
      id: "1",
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      time: "Today, 2:30 PM",
      type: "video",
      incoming: true,
    },
    {
      id: "2",
      name: "Mike Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      time: "Yesterday",
      type: "audio",
      incoming: false,
    },
    {
      id: "3",
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      time: "Yesterday",
      type: "video",
      incoming: true,
    },
    {
      id: "4",
      name: "James Brown",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
      time: "Monday",
      type: "audio",
      incoming: false,
    },
  ];

  return (
    <div className="h-full bg-background p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Recent Calls
      </h2>

      <div className="space-y-3">
        {recentCalls.map((call, index) => (
          <div
            key={call.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 
                       cursor-pointer transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Avatar */}
            <img
              src={call.avatar}
              alt={call.name}
              className="w-12 h-12 rounded-full"
            />

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{call.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span
                  className={call.incoming ? "text-green-600" : "text-accent"}
                >
                  {call.incoming ? "↙" : "↗"}
                </span>
                <span>{call.time}</span>
              </div>
            </div>

            {/* Call Icons */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <FiPhone className="w-5 h-5 text-primary" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <FiVideo className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state placeholder */}
      {recentCalls.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <FiVideo className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No recent calls</p>
        </div>
      )}
    </div>
  );
};

export default VideoCallTab;
