import { Check, MapPin, Search, Send } from "lucide-react";
import LoadableImage from "../common/LoadableImage";
import { Avatar, Button, EmptyState, Input, Modal } from "../ui";
import { cn } from "../../lib/utils";

export default function SharePostDialog({
  post,
  conversations,
  search,
  onSearchChange,
  selectedIds,
  onToggle,
  onClose,
  onSend,
  isSending,
}) {
  return (
    <Modal
      open={Boolean(post)}
      onClose={onClose}
      title="Send post"
      description="Choose up to 5 conversations."
      size="md"
      footer={
        <>
          <Button onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button
            variant="primary"
            onClick={onSend}
            loading={isSending}
            disabled={selectedIds.length === 0}
          >
            <Send className="size-4" />
            Send to {selectedIds.length || ""}
          </Button>
        </>
      }
    >
      {post && (
        <div className="flex items-center gap-3 rounded-app border border-line bg-surface-muted p-3">
          <LoadableImage
            src={post.image?.url}
            alt={post.caption || "Shared post"}
            className="h-full w-full object-cover"
            wrapperClassName="size-16 shrink-0 rounded-control bg-surface-hover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{post.user?.fullname}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{post.caption || "No caption"}</p>
            {post.location?.name && (
              <span className="mt-1 flex items-center gap-1 text-xs text-subtle">
                <MapPin className="size-3" />
                <span className="truncate">{post.location.name}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Input
          icon={Search}
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{selectedIds.length}/5 selected</span>
        <span>{conversations.length} conversations</span>
      </div>

      <div className="ui-scrollbar mt-3 max-h-80 space-y-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No conversations found"
            description="Try a different search."
            className="py-8"
          />
        ) : (
          conversations.map((conversation) => {
            const label = conversation.isgroup
              ? conversation.groupdetail?.groupname
              : conversation.name;
            const image = conversation.isgroup
              ? conversation.groupdetail?.groupIcon?.url
              : conversation.profilePic?.url;
            const isSelected = selectedIds.includes(conversation.conversationId);

            return (
              <button
                key={conversation.conversationId}
                type="button"
                onClick={() => onToggle(conversation.conversationId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-control border p-2.5 text-left transition",
                  isSelected
                    ? "border-brand/40 bg-brand-soft"
                    : "border-transparent hover:bg-surface-hover",
                )}
              >
                <Avatar src={image} alt={label || "Conversation"} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{label}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {conversation.lastmessage?.text ||
                      (conversation.isgroup ? "Group conversation" : "Direct conversation")}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border",
                    isSelected ? "border-brand bg-brand text-on-brand" : "border-line-strong",
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
