import { Session } from "../models/session.model.js";
import { ApiError } from "../util/apierror.js";
import { io } from "./socket.js";

export const enforceSessionLimit = async (user) => {
    const loginLimit = user.loginlimits || 3;
    const now = new Date();

    await Session.deleteMany({
        user: user._id,
        expireAt: { $lte: now },
    });

    const activeSessions = await Session.find({
        user: user._id,
        expireAt: { $gt: now },
    })
        .populate("trustedDevice", "isPrimary")
        .sort({ lastSeenAt: 1 })
        .lean();

    if (activeSessions.length < loginLimit) {
        return;
    }

    const removableSessions = activeSessions.filter(
        (session) => !session.trustedDevice?.isPrimary,
    );

    if (removableSessions.length === 0) {
        throw new ApiError(
            403,
            "Device limit reached. No removable session is available.",
        );
    }

    const numberToRemove =
        activeSessions.length - loginLimit + 1;

    const sessionsToRemove = removableSessions.slice(
        0,
        numberToRemove,
    );

    const sessionIds = sessionsToRemove.map(
        (session) => session._id,
    );

    await Session.deleteMany({
        _id: { $in: sessionIds },
        user: user._id,
    });

    sessionsToRemove.forEach((session) => {
        io.to(session._id.toString()).emit("force-logout");
    });
};