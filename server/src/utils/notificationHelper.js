
import Notification from "../models/Notification.js";

export const sendNotificationSafely = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  relatedExchange = null,
  cabShareId = null,
  requestId = null,
  tripId = null,
}) => {
  try {
    if (!recipient) {
      return null;
    }

    return await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedExchange,
      cabShareId,
      requestId,
      tripId,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
    return null;
  }
};
