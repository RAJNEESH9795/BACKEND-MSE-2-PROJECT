import Notification from "../models/Notification.js";

const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  relatedExchange = null,
}) => {
  try {
    return await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedExchange,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);
    return null;
  }
};

export default createNotification;