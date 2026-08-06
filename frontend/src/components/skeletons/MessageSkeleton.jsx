import { Skeleton } from "../ui";

const MessageSkeleton = () => {
    const skeletonMessages = Array(6).fill(null);

    return (
        <div className="chat-canvas flex-1 space-y-1 overflow-y-auto px-4 py-5">
            {skeletonMessages.map((_, idx) => (
                <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="flex items-end">
                        <Skeleton className={`rounded-app ${idx % 3 === 0 ? "h-20 w-60" : "h-10 w-40"}`} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MessageSkeleton;
