
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
}) => {
  try {
    if (!recipient) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedExchange,
      cabShareId,
      requestId,
    });

    return notification;
  } catch (error) {
    console.error(
      "Notification creation failed:",
      error
    );

    // Notifications should not break the main operation
    return null;
  }
};
