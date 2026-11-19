
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";
import User from "../../src/models/User.js";
import Notification from "../../src/models/Notification.js";

describe("Notification API", () => {
  let user;
  let anotherUser;
  let userToken;
  let anotherUserToken;

  let notification;
  let anotherUserNotification;

  beforeEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});

    user = await User.create({
      name: "Priya Sharma",
      email: "priya.notification@test.com",
      password: "TestPassword123",
      phone: "9876543210",
      community: "Agra",
    });

    anotherUser = await User.create({
      name: "Aarav Sharma",
      email: "aarav.notification@test.com",
      password: "TestPassword123",
      phone: "9876543211",
      community: "Agra",
    });

    userToken = jwt.sign(
      {
        userId: user._id,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
      {
        userId: anotherUser._id,
        tokenVersion: anotherUser.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    notification = await Notification.create({
      recipient: user._id,
      sender: anotherUser._id,
      type: "exchange_request",
      title: "New Exchange Request",
      message: "Someone has requested your service.",
    });

    anotherUserNotification = await Notification.create({
      recipient: anotherUser._id,
      sender: user._id,
      type: "exchange_accepted",
      title: "Exchange Accepted",
      message: "Your exchange request was accepted.",
    });
  });

  afterEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  // ==========================================
  // 1. GET MY NOTIFICATIONS
  // ==========================================

  describe("GET /api/v1/notifications", () => {
    test("should return notifications belonging to logged-in user", async () => {
      const response = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.notifications).toHaveLength(1);

      expect(response.body.notifications[0].title).toBe(
        "New Exchange Request"
      );
    });

    test("should populate sender information", async () => {
      const response = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      const sender = response.body.notifications[0].sender;

      expect(sender).toBeDefined();
      expect(sender.name).toBe("Aarav Sharma");
      expect(sender.profilePhoto).toBeDefined();
    });

    test("should not return another user's notifications", async () => {
      const response = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      const ids = response.body.notifications.map(
        (item) => item._id
      );

      expect(ids).not.toContain(
        anotherUserNotification._id.toString()
      );
    });

    test("should return empty notifications when user has none", async () => {
      // Remove the notification belonging to anotherUser.
      // This user should now have zero notifications.
      await Notification.deleteMany({
        recipient: anotherUser._id,
      });

      const response = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${anotherUserToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.notifications).toHaveLength(0);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/v1/notifications");

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 2. GET UNREAD NOTIFICATION COUNT
  // ==========================================

  describe("GET /api/v1/notifications/unread-count", () => {
    test("should return correct unread notification count", async () => {
      await Notification.create({
        recipient: user._id,
        type: "exchange_accepted",
        title: "Exchange Accepted",
        message: "Your request was accepted.",
      });

      const response = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    test("should exclude read notifications from unread count", async () => {
      await Notification.findByIdAndUpdate(
        notification._id,
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      const response = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.count).toBe(0);
    });

    test("should return zero for a user without unread notifications", async () => {
      await Notification.deleteMany({
        recipient: anotherUser._id,
      });

      const response = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${anotherUserToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.count).toBe(0);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/v1/notifications/unread-count");

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 3. MARK ONE NOTIFICATION AS READ
  // ==========================================

  describe("PATCH /api/v1/notifications/:id/read", () => {
    test("should mark notification as read successfully", async () => {
      const response = await request(app)
        .patch(`/api/v1/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.notification.isRead).toBe(true);
      expect(response.body.notification.readAt).not.toBeNull();
    });

    test("should handle already-read notifications", async () => {
      await Notification.findByIdAndUpdate(notification._id, {
        isRead: true,
        readAt: new Date(),
      });

      const response = await request(app)
        .patch(`/api/v1/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Notification already marked as read"
      );
    });

    test("should prevent marking another user's notification as read", async () => {
      const response = await request(app)
        .patch(
          `/api/v1/notifications/${anotherUserNotification._id}/read`
        )
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(404);
    });

    test("should reject invalid notification IDs", async () => {
      const response = await request(app)
        .patch("/api/v1/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(400);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .patch(`/api/v1/notifications/${notification._id}/read`);

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 4. MARK ALL NOTIFICATIONS AS READ
  // ==========================================

  describe("PATCH /api/v1/notifications/read-all", () => {
    test("should mark all unread notifications as read", async () => {
      await Notification.create({
        recipient: user._id,
        type: "exchange_accepted",
        title: "Exchange Accepted",
        message: "Your exchange was accepted.",
      });

      const response = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.modifiedCount).toBe(2);

      const unreadCount = await Notification.countDocuments({
        recipient: user._id,
        isRead: false,
      });

      expect(unreadCount).toBe(0);
    });

    test("should preserve notifications belonging to other users", async () => {
      await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`);

      const otherNotification = await Notification.findById(
        anotherUserNotification._id
      );

      expect(otherNotification.isRead).toBe(false);
    });

    test("should return zero when there are no unread notifications", async () => {
      await Notification.findByIdAndUpdate(notification._id, {
        isRead: true,
        readAt: new Date(),
      });

      const response = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.modifiedCount).toBe(0);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .patch("/api/v1/notifications/read-all");

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 5. DELETE NOTIFICATION
  // ==========================================

  describe("DELETE /api/v1/notifications/:id", () => {
    test("should delete notification successfully", async () => {
      const response = await request(app)
        .delete(`/api/v1/notifications/${notification._id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedNotification = await Notification.findById(
        notification._id
      );

      expect(deletedNotification).toBeNull();
    });

    test("should prevent deleting another user's notification", async () => {
      const response = await request(app)
        .delete(
          `/api/v1/notifications/${anotherUserNotification._id}`
        )
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(404);
    });

    test("should return 404 for nonexistent notifications", async () => {
      const response = await request(app)
        .delete("/api/v1/notifications/000000000000000000000000")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(404);
    });

    test("should reject invalid notification IDs", async () => {
      const response = await request(app)
        .delete("/api/v1/notifications/invalid-id")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(400);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .delete(`/api/v1/notifications/${notification._id}`);

      expect(response.statusCode).toBe(401);
    });
  });
});
