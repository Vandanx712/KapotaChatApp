import path from "path";

export const StoragePath = (gender, options = {}) => {
  const {
    includeMainFolder = true,
    includeAvatarFolder = true,
    includeUserProfilePic = false,
    includeConversation = false,
    includeMessageFolder = false
  } = options;

  const folderpath = [
    includeMainFolder ? "kapota" : null,
    includeAvatarFolder ? "avatars" : null,
    includeAvatarFolder && gender ? gender : null,
    includeUserProfilePic ? "profilepic" : null,
    includeConversation ? 'conversationPic' : null,
    includeMessageFolder ? 'messagepic' : null
  ].filter(Boolean);
  
  return path.posix.join(...folderpath);
};
