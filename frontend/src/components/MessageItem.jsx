import { memo, useRef, useState } from "react";
import { cn, formatMessageTime } from "../lib/utils";
import {
  Check,
  CheckCheck,
  CopyIcon,
  Edit2,
  EllipsisVerticalIcon,
  LucideInfo,
  Reply,
  SmileIcon,
  Trash2Icon,
  X,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import {
  Avatar,
  Button,
  ContextMenu,
  DropdownMenu,
  Input,
  MenuItem,
  MenuSeparator,
  Modal,
} from "./ui";
import { useThemeStore } from "../store/useThemeStore";

const MessageItem = memo(
  ({
    m,
    authUser,
    selectedConversation,
    highlightId,
    isSequenceStart = true,
    isSequenceEnd = true,
  }) => {
    const isSentByMe = m?.sender === authUser._id;
    const [showPicker, setShowPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editedText, setEditedText] = useState(m?.text);
    const [info, setInfo] = useState(false);
    const [showReactionDetails, setShowReactionDetails] = useState(false);

    const navigate = useNavigate();
    const messageUpdate = useChatStore((state) => state.messageUpdate);
    const messageDelete = useChatStore((state) => state.messageDelete);
    const reactToMessage = useChatStore((state) => state.reactToMessage);
    const setReplyingTo = useChatStore((state) => state.setReplyingTo);
    const [openUp, setOpenUp] = useState(false);
    const dropdownRef = useRef(null);
    const theme = useThemeStore((state) => state.theme);
    const isHighlighted = highlightId && m?._id === highlightId;
    const isSharedPost = Boolean(m?.post?._id);

    if (m?.system) {
      if (m?.deletedFor?.includes(authUser._id)) return null;
      return (
        <div className="my-3 flex justify-center px-6">
          <div className="rounded-control border border-line bg-surface/90 px-3 py-1.5 text-xs font-medium text-muted shadow-control">
            {m.text}
          </div>
        </div>
      );
    }

    if (m?._id === "typing") {
      return (
        <div className="flex justify-start px-4 py-1.5">
          <div className="flex items-center gap-1 rounded-app rounded-bl-[2px] border border-line bg-message-in px-4 py-3 shadow-control" aria-label="Typing">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="size-1.5 animate-pulse rounded-full bg-subtle" style={{ animationDelay: `${dot * 120}ms` }} />
            ))}
          </div>
        </div>
      );
    }

    const handleOpen = () => {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow < 150 && spaceAbove > 150) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    };

    const now = new Date().getTime();
    const createdAt = new Date(m?.createdAt).getTime();
    const TEN_MIN = 10 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const updatefor = now <= createdAt + TEN_MIN;
    const deletefor = now <= createdAt + ONE_DAY;

    let myrole;
    if (selectedConversation.isgroup) {
      const membersId = Object.keys(
        selectedConversation.groupdetail.membersDetail,
      );
      const mydetail =
        selectedConversation.groupdetail.membersDetail[
        membersId.filter((mem) => mem == authUser._id)[0]
        ];
      myrole = mydetail?.role;
    }

    const seenBySet = new Set();
    if (m && m._id !== "typing") {
      [m.sender, ...(m.seenBy || [])]
        .filter(Boolean)
        .forEach((id) => seenBySet.add(id.toString()));
    }
    const seenByCount =
      selectedConversation.isgroup && isSentByMe
        ? [...seenBySet].filter((id) => id !== authUser._id).length
        : 0;
    const seenByNames =
      selectedConversation.isgroup && isSentByMe
        ? [...seenBySet]
          .filter((id) => id !== authUser._id)
          .map(
            (id) =>
              selectedConversation.groupdetail?.membersDetail?.[id]
                ?.fullname || "Unknown",
          )
          .filter(Boolean)
        : [];

    const canEdit =
      (!selectedConversation.isgroup &&
        m.sender === authUser._id &&
        !m.isSeen &&
        updatefor &&
        !isSharedPost) ||
      (selectedConversation.isgroup &&
        myrole !== "member" &&
        updatefor &&
        !isSharedPost);

    const onEmojiClick = async (emojiData) => {
      const updated = await reactToMessage(m._id, emojiData.emoji);
      if (updated) setShowPicker(false);
    };

    const handleSaveEdit = async () => {
      const trimmedText = editedText.trim();
      if (!trimmedText || trimmedText === m.text) return;

      const updated = await messageUpdate(m._id, {
        conversationId: selectedConversation.conversationId,
        text: trimmedText,
        emoji: "",
      });
      if (updated) setEditing(false);
    };

    const handledeleteForMe = () => {
      messageDelete(m._id, {
        conversationId: selectedConversation.conversationId,
        deleteType: "deleteForMe",
      });
      setDeleting(false);
    };

    const handleDeleteEeveryone = () => {
      messageDelete(m._id, {
        conversationId: selectedConversation.conversationId,
        deleteType: "deleteForEveryone",
      });
      setDeleting(false);
    };

    const handleOpenSharedPost = () => {
      if (!m?.post?._id) return;

      navigate(`/post/${m.post._id}`, {
        state: {
          sharedPost: true,
        },
      });
    };

    const handleCopy = async () => {
      if (!m?.text) {
        toast.error("This message has no text to copy");
        return;
      }

      try {
        await navigator.clipboard.writeText(m.text);
        toast.success("Copied");
      } catch {
        toast.error("Unable to copy message");
      }
    };

    const canDeleteForEveryone =
      deletefor &&
      isSentByMe &&
      (!selectedConversation.isgroup || myrole === "admin");

    const senderName = selectedConversation.isgroup
      ? selectedConversation.groupdetail?.membersDetail?.[m.sender]?.fullname
      : selectedConversation.name;
    const senderProfile = selectedConversation.isgroup
      ? selectedConversation.groupdetail?.membersDetail?.[m.sender]?.profilePic
      : null;
    const hasTextContent = Boolean(
      m.text && (!isSharedPost || m.deletedForEveryone),
    );
    const showTimeOverMedia = Boolean(m.image && !hasTextContent);

    const replySenderId = m.replyTo?.sender?.toString?.() || m.replyTo?.sender;
    const replySenderName =
      replySenderId === authUser._id
        ? "You"
        : selectedConversation.isgroup
          ? selectedConversation.groupdetail?.membersDetail?.[replySenderId]
              ?.fullname || "Participant"
          : selectedConversation.name || "Contact";
    const normalizedReactions =
      (Array.isArray(m.reactions) && m.reactions.length > 0
        ? m.reactions
        : m.reacted
          ? [{ emoji: m.reacted, userId: null }]
          : []
      );
    const reactionGroups = Object.values(
      normalizedReactions.reduce((groups, reaction) => {
        if (!reaction?.emoji) return groups;
        const group = groups[reaction.emoji] || {
          emoji: reaction.emoji,
          userIds: [],
        };
        if (reaction.userId) group.userIds.push(reaction.userId.toString());
        groups[reaction.emoji] = group;
        return groups;
      }, {}),
    );
    const visibleReactionGroups = [...reactionGroups]
      .sort((first, second) => second.userIds.length - first.userIds.length)
      .slice(0, 3);
    const totalReactionCount = normalizedReactions.length;
    const myReaction = normalizedReactions.find(
      (reaction) => reaction.userId?.toString?.() === authUser._id?.toString?.(),
    );
    const reactedByMe = Boolean(myReaction);
    const reactionDetails = normalizedReactions.map((reaction) => {
      const userId = reaction.userId?.toString?.();
      if (userId === authUser._id?.toString?.()) {
        return {
          userId,
          name: "You",
          profilePic: authUser.profilePic,
          emoji: reaction.emoji,
        };
      }

      const member = selectedConversation.isgroup
        ? selectedConversation.groupdetail?.membersDetail?.[userId]
        : null;
      return {
        userId: userId || `legacy-${reaction.emoji}`,
        name: member?.fullname || selectedConversation.name || "Participant",
        profilePic: member?.profilePic || selectedConversation.profilePic,
        emoji: reaction.emoji,
      };
    });

    const reactionLimit = selectedConversation.isgroup
      ? Math.max(
        Object.keys(selectedConversation.groupdetail?.membersDetail || {}).length,
        totalReactionCount,
        1,
      )
      : 2;

    const handleRemoveMyReaction = async () => {
      if (!myReaction?.emoji) return;
      const updated = await reactToMessage(m._id, myReaction.emoji);
      if (updated) {
        setShowReactionDetails(false);
        setShowPicker(false);
      }
    };

    const renderMessageActions = () => (
      <>
        <MenuItem icon={Reply} onClick={() => setReplyingTo(m)}>
          Reply
        </MenuItem>
        <MenuItem icon={CopyIcon} onClick={handleCopy}>Copy message</MenuItem>
        {selectedConversation.isgroup && isSentByMe && seenByCount > 0 && (
          <MenuItem icon={LucideInfo} onClick={() => setInfo(true)}>Message info</MenuItem>
        )}
        {canEdit && (
          <MenuItem icon={Edit2} onClick={() => setEditing(true)}>Edit message</MenuItem>
        )}
        <MenuSeparator />
        <MenuItem icon={Trash2Icon} destructive onClick={() => setDeleting(true)}>
          Delete message
        </MenuItem>
      </>
    );

    return (
      <>
        <div
          className={cn(
            "flex px-4",
            isSequenceStart ? "pt-1" : "pt-0.5",
            isSequenceEnd ? "pb-1" : "pb-0",
            isSentByMe ? "justify-end" : "justify-start",
            m?.deletedFor?.includes(authUser._id) && "hidden",
          )}
        >
          <div
            className={cn(
              "flex max-w-[72%] items-end",
              selectedConversation.isgroup && !isSentByMe && "gap-2",
            )}
          >
            {selectedConversation.isgroup && !isSentByMe && (
              <span className="flex w-7 shrink-0 justify-center">
                {isSequenceEnd && (
                  <Avatar
                    src={senderProfile?.url}
                    alt={senderName || "Group participant"}
                    size="xs"
                    className={reactionGroups.length > 0 ? "mb-6" : "mb-0.5"}
                  />
                )}
              </span>
            )}

            <ContextMenu
              className="group relative min-w-0 max-w-full"
              menu={renderMessageActions()}
            >
              <div
                className={cn(
                  "relative w-fit max-w-full px-2 py-1.5 text-[13.5px] leading-[19px] text-ink shadow-control transition",
                  isSentByMe
                    ? cn(
                      "rounded-[7.5px] bg-message-out",
                      isSequenceStart && "message-bubble-out rounded-tr-none",
                    )
                    : cn(
                      "rounded-[7.5px] bg-message-in",
                      isSequenceStart && "message-bubble-in rounded-tl-none",
                    ),
                  isHighlighted && "ring-2 ring-brand/60 ring-offset-2 ring-offset-canvas",
                )}
              >
                {selectedConversation.isgroup &&
                  !isSentByMe &&
                  isSequenceStart &&
                  senderName && (
                  <div className="mb-0.5 truncate text-xs font-semibold text-brand-strong">{senderName}</div>
                )}

                {m.replyTo && (
                  <div className="mb-1.5 min-w-48 rounded-control border-l-2 border-brand/70 bg-surface/45 px-2 py-1">
                    <p className="text-xs font-semibold text-brand-strong">
                      {m.replyTo.deleted ? "Original message" : replySenderName}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                      {m.replyTo.deleted
                        ? "This message was deleted"
                        : m.replyTo.preview || "Message"}
                    </p>
                  </div>
                )}

                {m.image && (
                  <PhotoProvider>
                    <PhotoView src={m.image.url}>
                      <img
                        src={m.image.url}
                        className={cn(
                          "max-h-[360px] max-w-[min(360px,42vw)] cursor-pointer rounded-control object-contain",
                          hasTextContent && "mb-1.5",
                        )}
                        alt="Message attachment"
                      />
                    </PhotoView>
                  </PhotoProvider>
                )}

                {isSharedPost && !m.deletedForEveryone && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenSharedPost();
                    }}
                    className="mb-3 overflow-hidden rounded-control border border-line bg-surface text-left transition hover:bg-surface-hover"
                  >
                    {m.post?.image?.url && (
                      <img
                        src={m.post.image.url}
                        alt={m.post.caption || "Shared post"}
                        className="max-h-64 w-full object-cover"
                      />
                    )}
                    <div className="p-2.5">
                      <p className="line-clamp-2 text-sm text-ink">{m.post?.caption || m.text || "Shared post"}</p>
                      <p className="mt-2 text-xs font-semibold text-brand-strong">Open post</p>
                    </div>
                  </button>
                )}

                {m.text && (!isSharedPost || m.deletedForEveryone) && (
                  <p className={cn("whitespace-pre-wrap break-words", m.deletedForEveryone && "italic text-muted")}>
                    {m.deletedForEveryone
                      ? authUser._id == m.sender
                        ? "You deleted this message"
                        : "This message was deleted"
                      : m.text}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-block h-px",
                        isSentByMe ? "w-16" : "w-[48px]",
                      )}
                    />
                  </p>
                )}

                <time
                  className={cn(
                    "absolute bottom-1 right-1.5 flex items-center gap-1 text-[10px] leading-none text-muted",
                    showTimeOverMedia &&
                      "rounded bg-black/45 px-1 py-0.5 text-white",
                  )}
                >
                  {formatMessageTime(m.createdAt)}
                  {isSentByMe && (m.isSeen ? (
                    <CheckCheck className={cn("size-3.5", showTimeOverMedia ? "text-sky-300" : "text-brand-strong")} />
                  ) : (
                    <Check className="size-3.5" />
                  ))}
                </time>
              </div>

              {!m?.deletedForEveryone && (
                <div
                  className={cn(
                    "absolute top-0 flex items-center gap-0.5 rounded-control border border-line bg-surface-raised p-0.5 opacity-0 shadow-control transition-opacity group-hover:opacity-100",
                    isSentByMe ? "right-full mr-2" : "left-full ml-2",
                  )}
                >
                  <Button
                    iconOnly
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowPicker(true)}
                    aria-label="React to message"
                  >
                    <SmileIcon className="size-4" />
                  </Button>
                  <div ref={dropdownRef}>
                    <DropdownMenu
                      align={isSentByMe ? "end" : "start"}
                      side={openUp ? "top" : "bottom"}
                      trigger={
                        <Button iconOnly size="xs" variant="ghost" onClick={handleOpen} aria-label="Message actions">
                          <EllipsisVerticalIcon className="size-4" />
                        </Button>
                      }
                    >
                      {renderMessageActions()}
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {reactionGroups.length > 0 && (
                <div
                  className={cn(
                    "relative z-10 -mt-0.5 flex",
                    isSentByMe ? "justify-end pr-2" : "pl-2",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setShowReactionDetails(true)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs shadow-control transition hover:border-brand hover:bg-brand-soft",
                      reactedByMe
                        ? "border-brand/40 bg-brand-soft text-brand-strong"
                        : "border-line bg-surface-raised text-ink",
                    )}
                    title={`View ${totalReactionCount} reaction${totalReactionCount === 1 ? "" : "s"}`}
                    aria-label={`View ${totalReactionCount} message reaction${totalReactionCount === 1 ? "" : "s"}`}
                  >
                    <span className="flex items-center" aria-hidden="true">
                      {visibleReactionGroups.map((reaction) => (
                        <span key={reaction.emoji} className="-ml-0.5 first:ml-0">
                          {reaction.emoji}
                        </span>
                      ))}
                    </span>
                    <span className="min-w-3 text-center font-semibold">{totalReactionCount}</span>
                  </button>
                </div>
              )}
            </ContextMenu>
          </div>
        </div>

        <Modal
          open={showReactionDetails}
          onClose={() => setShowReactionDetails(false)}
          title="Message reactions"
          description={`${totalReactionCount} participant${totalReactionCount === 1 ? "" : "s"} reacted to this message.`}
          size="sm"
        >
          <div className="ui-scrollbar max-h-80 space-y-1 overflow-y-auto">
            {reactionDetails.map((reaction, index) => (
              <div
                key={`${reaction.userId}-${index}`}
                className="flex h-12 items-center gap-3 rounded-control px-2.5 hover:bg-surface-hover"
              >
                <Avatar
                  src={reaction.profilePic?.url}
                  alt={reaction.name}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {reaction.name}
                </span>
                <span className="text-xl" aria-label={`Reacted ${reaction.emoji}`}>
                  {reaction.emoji}
                </span>
                {reaction.userId === authUser._id?.toString?.() && (
                  <Button
                    iconOnly
                    size="xs"
                    variant="ghost"
                    onClick={handleRemoveMyReaction}
                    aria-label={`Remove ${reaction.emoji} reaction`}
                    title="Remove your reaction"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Modal>

        <Modal
          open={info}
          onClose={() => setInfo(false)}
          title={`Seen by ${seenByCount}`}
          description="People in this group who have opened the message."
          size="sm"
        >
          <div className="space-y-1">
            {seenByNames.map((name, index) => (
              <div key={`${name}-${index}`} className="truncate rounded-control px-3 py-2 text-sm text-ink hover:bg-surface-hover">
                {name}
              </div>
            ))}
          </div>
        </Modal>

        <Modal
          open={editing}
          onClose={() => {
            setEditing(false);
            setEditedText(m.text);
          }}
          title="Edit message"
          description="Edits are available for a limited time after sending."
          size="sm"
          footer={
            <>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={!editedText.trim() || editedText.trim() === m.text}
              >
                Save changes
              </Button>
            </>
          }
        >
          <Input
            value={editedText}
            onChange={(event) => setEditedText(event.target.value)}
            autoFocus
          />
        </Modal>

        <Modal
          open={deleting}
          onClose={() => setDeleting(false)}
          title="Delete message?"
          description="Choose whether to remove it just for you or for everyone in the conversation."
          size="sm"
        >
          <div className="flex flex-col gap-2">
            {canDeleteForEveryone && (
              <Button variant="danger" onClick={handleDeleteEeveryone}>Delete for everyone</Button>
            )}
            <Button variant="dangerGhost" onClick={handledeleteForMe}>Delete for me</Button>
            <Button variant="ghost" onClick={() => setDeleting(false)}>Cancel</Button>
          </div>
        </Modal>

        <Modal
          open={showPicker}
          onClose={() => setShowPicker(false)}
          title="React to message"
          description={`Each participant can add one reaction. This conversation allows up to ${reactionLimit} reactions.`}
          size="sm"
          className="w-auto"
        >
          {myReaction && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-control bg-surface-muted px-3 py-2">
              <span className="text-sm text-muted">
                Your reaction <span className="ml-1 text-lg">{myReaction.emoji}</span>
              </span>
              <Button
                size="sm"
                variant="dangerGhost"
                onClick={handleRemoveMyReaction}
              >
                Remove
              </Button>
            </div>
          )}
          <div className="overflow-hidden rounded-control border border-line">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onEmojiClick(emojiData);
              }}
              theme={theme}
              autoFocusSearch={true}
              width={350}
              height={400}
              lazyLoadEmojis={true}
            />
          </div>
        </Modal>
      </>
    );
  },
);

export default MessageItem;
