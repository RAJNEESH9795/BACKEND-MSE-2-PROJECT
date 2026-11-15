
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import ServiceListing from "../../src/models/ServiceListing.js";

describe("Service Listing API", () => {
  let providerToken;
  let anotherUserToken;
  let providerId;

  beforeEach(async () => {
    await User.deleteMany({});
    await ServiceListing.deleteMany({});

    const provider = await User.create({
      name: "Service Provider",
      email: "provider@example.com",
      phone: "9876543210",
      password: "Password123",
      role: "user",
      community: "Test Community",
    });

    const anotherUser = await User.create({
      name: "Another User",
      email: "another@example.com",
      phone: "9876543211",
      password: "Password123",
      role: "user",
      community: "Test Community",
    });

    providerId = provider._id;

    // Generate test JWT tokens without calling the login endpoint.
    const jwtSecret = process.env.JWT_SECRET;

    providerToken = jwt.sign(
      {
        userId: provider._id.toString(),
        role: provider.role,
        tokenVersion: provider.tokenVersion,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
      {
        userId: anotherUser._id.toString(),
        role: anotherUser.role,
        tokenVersion: anotherUser.tokenVersion,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );
  });

  afterEach(async () => {
    await User.deleteMany({});
    await ServiceListing.deleteMany({});
  });

  describe("POST /api/v1/services", () => {
    test("should create a service listing successfully", async () => {
      const response = await request(app)
        .post("/api/v1/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          title: "React Tutoring",
          category: "technology",
          description:
            "I can teach React fundamentals and help students build projects.",
          seeking: "Looking for graphic design services.",
          availability: "Weekends, 10 AM to 2 PM",
          mode: "online",
          location: "",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.service).toBeDefined();
      expect(response.body.service.title).toBe("React Tutoring");
      expect(response.body.service.seeking).toBe(
        "Looking for graphic design services."
      );

      expect(response.body.service.offeredBy.toString()).toBe(
        providerId.toString()
      );

      expect(response.body.service).not.toHaveProperty("creditPrice");
      expect(response.body.service).not.toHaveProperty("exchangeType");
    });

    test("should reject service creation without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/services")
        .send({
          title: "React Tutoring",
          category: "technology",
          description:
            "I can teach React fundamentals and help students build projects.",
          seeking: "Looking for graphic design services.",
          availability: "Weekends",
          mode: "online",
          location: "",
        });

      expect(response.statusCode).toBe(401);
    });

    test("should reject a service listing without seeking", async () => {
      const response = await request(app)
        .post("/api/v1/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          title: "React Tutoring",
          category: "technology",
          description:
            "I can teach React fundamentals and help students build projects.",
          availability: "Weekends",
          mode: "online",
          location: "",
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/services", () => {
    beforeEach(async () => {
      await ServiceListing.create([
        {
          offeredBy: providerId,
          title: "React Tutoring",
          category: "technology",
          description:
            "I teach React fundamentals and help students build frontend projects.",
          seeking: "Looking for graphic design services.",
          availability: "Weekends",
          mode: "online",
          status: "active",
        },
        {
          offeredBy: providerId,
          title: "Graphic Design",
          category: "creative",
          description:
            "I create posters and social media designs for students.",
          seeking: "Looking for web development help.",
          availability: "Evenings",
          mode: "online",
          status: "active",
        },
        {
          offeredBy: providerId,
          title: "Paused Service",
          category: "technology",
          description:
            "I help students understand JavaScript programming concepts.",
          seeking: "Looking for tutoring in return.",
          availability: "Weekdays",
          mode: "online",
          status: "paused",
        },
      ]);
    });

    test("should return only active service listings", async () => {
      const response = await request(app)
        .get("/api/v1/services")
        .set("Authorization", `Bearer ${anotherUserToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.services).toHaveLength(2);

      expect(
        response.body.services.every(
          (service) => service.status === "active"
        )
      ).toBe(true);
    });

    test("should filter service listings by category", async () => {
      const response = await request(app)
        .get("/api/v1/services?category=technology")
        .set("Authorization", `Bearer ${anotherUserToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.services).toHaveLength(1);
      expect(response.body.services[0].title).toBe("React Tutoring");
    });
  });


  describe("PATCH /api/v1/services/:id", () => {
    let serviceId;

    beforeEach(async () => {
      const service = await ServiceListing.create({
        offeredBy: providerId,
        title: "React Tutoring",
        category: "technology",
        description:
          "I teach React fundamentals and help students build frontend projects.",
        seeking: "Looking for graphic design services.",
        availability: "Weekends",
        mode: "online",
        status: "active",
      });

      serviceId = service._id.toString();
    });

    test("should allow the owner to update their service listing", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          title: "Advanced React Tutoring",
          seeking: "Looking for web design services.",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.service.title).toBe(
        "Advanced React Tutoring"
      );
      expect(response.body.service.seeking).toBe(
        "Looking for web design services."
      );
    });

    test("should prevent another user from updating the listing", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .send({
          title: "Unauthorized Update",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(
        "You can only update your own service listings"
      );
    });

    test("should prevent updates to closed listings", async () => {
      await ServiceListing.findByIdAndUpdate(serviceId, {
        status: "closed",
      });

      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          title: "Updated Closed Listing",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        "Closed service listings cannot be updated"
      );
    });

    test("should not allow general updates to change protected fields", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          title: "Updated React Tutoring",
          offeredBy: "000000000000000000000001",
          status: "closed",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.service.title).toBe(
        "Updated React Tutoring"
      );

      expect(response.body.service.offeredBy.toString()).toBe(
        providerId.toString()
      );

      expect(response.body.service.status).toBe("active");
    });
  });


  describe("PATCH /api/v1/services/:id/status", () => {
    let serviceId;

    beforeEach(async () => {
      const service = await ServiceListing.create({
        offeredBy: providerId,
        title: "React Tutoring",
        category: "technology",
        description:
          "I teach React fundamentals and help students build frontend projects.",
        seeking: "Looking for graphic design services.",
        availability: "Weekends",
        mode: "online",
        status: "active",
      });

      serviceId = service._id.toString();
    });

    test("should allow the owner to pause a service listing", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "paused" });

      expect(response.statusCode).toBe(200);
      expect(response.body.service.status).toBe("paused");
    });

    test("should allow the owner to close a service listing", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "closed" });

      expect(response.statusCode).toBe(200);
      expect(response.body.service.status).toBe("closed");
    });

    test("should prevent another user from changing listing status", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}/status`)
        .set("Authorization", `Bearer ${anotherUserToken}`)
        .send({ status: "paused" });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(
        "You can only manage your own service listings"
      );
    });

    test("should prevent reopening a closed listing", async () => {
      await ServiceListing.findByIdAndUpdate(serviceId, {
        status: "closed",
      });

      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "active" });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        "A closed service listing cannot be reopened"
      );
    });

    test("should reject an invalid listing status", async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "pending" });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        "Status must be active, paused, or closed"
      );
    });
  });

});
