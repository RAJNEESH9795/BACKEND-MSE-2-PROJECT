
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";
import User from "../../src/models/User.js";
import ServiceListing from "../../src/models/ServiceListing.js";
import ExchangeRequest from "../../src/models/ExchangeRequest.js";

describe("Direct Service Exchange API", () => {
  let requester;
  let provider;
  let requesterToken;
  let providerToken;
  let requestedListing;
  let offeredListing;
  let exchangeRequestId;

  beforeEach(async () => {
    await ExchangeRequest.deleteMany({});
    await ServiceListing.deleteMany({});
    await User.deleteMany({});

    requester = await User.create({
      name: "Priya Sharma",
      email: "priya.exchange@test.com",
      password: "TestPassword123",
      phone: "9876543210",
      community: "Agra",
    });

    provider = await User.create({
      name: "Aarav Sharma",
      email: "aarav.exchange@test.com",
      password: "TestPassword123",
      phone: "9876543211",
      community: "Agra",
    });

    requesterToken = jwt.sign(
      { userId: requester._id, tokenVersion: requester.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    providerToken = jwt.sign(
      { userId: provider._id, tokenVersion: provider.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    requestedListing = await ServiceListing.create({
      offeredBy: provider._id,
      title: "React Tutoring",
      category: "technology",
      description:
        "Learn React and JavaScript fundamentals with practical examples.",
      seeking: "Graphic design services in exchange for tutoring.",
      availability: "Weekends",
      mode: "online",
    });

    offeredListing = await ServiceListing.create({
      offeredBy: requester._id,
      title: "Graphic Design Services",
      category: "creative",
      description:
        "I can create posters, banners and social media graphics.",
      seeking: "React tutoring in exchange for graphic design.",
      availability: "Evenings",
      mode: "online",
    });
  });

  afterEach(async () => {
    await ExchangeRequest.deleteMany({});
    await ServiceListing.deleteMany({});
    await User.deleteMany({});
  });

  // ==========================================
  // 1. CREATE EXCHANGE REQUEST
  // ==========================================

  describe("POST /api/v1/exchanges", () => {
    test("should create a direct exchange request successfully", async () => {
      const response = await request(app)
        .post("/api/v1/exchanges")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({
          requestedListingId: requestedListing._id.toString(),
          offeredListingId: offeredListing._id.toString(),
          message:
            "I would like to exchange graphic design for React tutoring.",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      const exchange = response.body.exchangeRequest;

      expect(exchange).toBeDefined();
      expect(exchange.requester.toString()).toBe(
        requester._id.toString()
      );
      expect(exchange.provider.toString()).toBe(
        provider._id.toString()
      );
      expect(exchange.status).toBe("pending");
      expect(exchange.offeredListing.toString()).toBe(
        offeredListing._id.toString()
      );
      expect(exchange.requestedListing.toString()).toBe(
        requestedListing._id.toString()
      );
      expect(exchange).not.toHaveProperty("creditAmount");
      expect(exchange).not.toHaveProperty("creditsReserved");

      exchangeRequestId = exchange._id;
    });

    test("should reject an unauthenticated request", async () => {
      const response = await request(app)
        .post("/api/v1/exchanges")
        .send({
          requestedListingId: requestedListing._id.toString(),
          offeredListingId: offeredListing._id.toString(),
        });

      expect(response.statusCode).toBe(401);
    });

    test("should reject a request without both listing IDs", async () => {
      const response = await request(app)
        .post("/api/v1/exchanges")
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({
          requestedListingId: requestedListing._id.toString(),
        });

      expect(response.statusCode).toBe(400);
    });

    test("should prevent a user from requesting their own listing", async () => {
      const response = await request(app)
        .post("/api/v1/exchanges")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          requestedListingId: requestedListing._id.toString(),
          offeredListingId: offeredListing._id.toString(),
        });

      expect(response.statusCode).toBe(400);
    });

    test("should prevent offering a listing owned by another user", async () => {
      // Create a third-party listing so the provider is not
      // requesting their own listing in the first validation.
      const thirdParty = await User.create({
        name: "Third Party",
        email: "thirdparty.create@test.com",
        password: "TestPassword123",
        phone: "9876543212",
        community: "Agra",
      });

      const thirdPartyListing = await ServiceListing.create({
        offeredBy: thirdParty._id,
        title: "Photography Services",
        category: "photography",
        description:
          "Photography services for events and personal projects.",
        seeking: "Looking for technology tutoring.",
        availability: "Weekends",
        mode: "online",
      });

      const response = await request(app)
        .post("/api/v1/exchanges")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({
          requestedListingId: thirdPartyListing._id.toString(),
          offeredListingId: offeredListing._id.toString(),
        });

      expect(response.statusCode).toBe(403);
    });
  });

  // ==========================================
  // 2. GET MY EXCHANGE REQUESTS
  // ==========================================

  describe("GET /api/v1/exchanges/my-requests", () => {
    beforeEach(async () => {
      const exchange = await ExchangeRequest.create({
        requester: requester._id,
        provider: provider._id,
        requestedListing: requestedListing._id,
        offeredListing: offeredListing._id,
        message: "Let's exchange services.",
      });

      exchangeRequestId = exchange._id.toString();
    });

    test("should return requests made by the requester", async () => {
      const response = await request(app)
        .get("/api/v1/exchanges/my-requests")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requests).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    test("should return an empty list when the user has no requests", async () => {
      const response = await request(app)
        .get("/api/v1/exchanges/my-requests")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.requests).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    test("should reject an unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/v1/exchanges/my-requests"
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 3. GET RECEIVED EXCHANGE REQUESTS
  // ==========================================

  describe("GET /api/v1/exchanges/received", () => {
    beforeEach(async () => {
      const exchange = await ExchangeRequest.create({
        requester: requester._id,
        provider: provider._id,
        requestedListing: requestedListing._id,
        offeredListing: offeredListing._id,
        message: "Let's exchange services.",
      });

      exchangeRequestId = exchange._id.toString();
    });

    test("should return requests received by the provider", async () => {
      const response = await request(app)
        .get("/api/v1/exchanges/received")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requests).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    test("should return an empty list when the provider has no requests", async () => {
      const response = await request(app)
        .get("/api/v1/exchanges/received")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.requests).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    test("should reject an unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/v1/exchanges/received"
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 4. ACCEPT OR REJECT EXCHANGE REQUEST
  // ==========================================

  describe("PATCH /api/v1/exchanges/:id/status", () => {
    beforeEach(async () => {
      const exchange = await ExchangeRequest.create({
        requester: requester._id,
        provider: provider._id,
        requestedListing: requestedListing._id,
        offeredListing: offeredListing._id,
        message: "Let's exchange services.",
      });

      exchangeRequestId = exchange._id.toString();
    });

    test("should allow the provider to accept a request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "accepted" });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.exchangeRequest.status).toBe("accepted");
    });

    test("should allow the provider to reject a request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "rejected" });

      expect(response.statusCode).toBe(200);
      expect(response.body.exchangeRequest.status).toBe("rejected");
    });

    test("should prevent the requester from accepting their own request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/status`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ status: "accepted" });

      // The controller searches using provider: req.user.userId.
      // A requester therefore receives 404.
      expect(response.statusCode).toBe(404);
    });

    test("should reject an invalid status", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "completed" });

      expect(response.statusCode).toBe(400);
    });

    test("should prevent changing a request that is no longer pending", async () => {
      await ExchangeRequest.findByIdAndUpdate(exchangeRequestId, {
        status: "accepted",
      });

      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/status`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "rejected" });

      expect(response.statusCode).toBe(400);
    });

    test("should return 404 for a nonexistent request", async () => {
      const response = await request(app)
        .patch("/api/v1/exchanges/000000000000000000000000/status")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ status: "accepted" });

      expect(response.statusCode).toBe(404);
    });

    test("should reject an unauthenticated request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/status`)
        .send({ status: "accepted" });

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 5. CANCEL EXCHANGE REQUEST
  // ==========================================

  describe("PATCH /api/v1/exchanges/:id/cancel", () => {
    beforeEach(async () => {
      const exchange = await ExchangeRequest.create({
        requester: requester._id,
        provider: provider._id,
        requestedListing: requestedListing._id,
        offeredListing: offeredListing._id,
        message: "Let's exchange services.",
      });

      exchangeRequestId = exchange._id.toString();
    });

    test("should allow the requester to cancel a pending request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/cancel`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.exchangeRequest.status).toBe("cancelled");
    });

    test("should prevent the provider from cancelling the request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/cancel`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({});

      // The cancellation query only matches the requester.
      expect(response.statusCode).toBe(404);
    });

    test("should prevent cancellation after acceptance", async () => {
      await ExchangeRequest.findByIdAndUpdate(exchangeRequestId, {
        status: "accepted",
      });

      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/cancel`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      // No pending request matches the atomic update.
      expect(response.statusCode).toBe(404);
    });

    test("should reject an unauthenticated request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/cancel`)
        .send({});

      expect(response.statusCode).toBe(401);
    });
  });

  // ==========================================
  // 6. CONFIRM EXCHANGE COMPLETION
  // ==========================================

  describe("PATCH /api/v1/exchanges/:id/complete", () => {
    beforeEach(async () => {
      const exchange = await ExchangeRequest.create({
        requester: requester._id,
        provider: provider._id,
        requestedListing: requestedListing._id,
        offeredListing: offeredListing._id,
        message: "Let's exchange services.",
        status: "accepted",
      });

      exchangeRequestId = exchange._id.toString();
    });

    test("should allow the requester to confirm completion", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.exchangeRequest.requesterCompleted).toBe(true);
      expect(response.body.exchangeRequest.providerCompleted).toBe(false);
      expect(response.body.exchangeRequest.status).toBe("accepted");
    });

    test("should allow the provider to confirm completion", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({});

      expect(response.statusCode).toBe(200);
      expect(response.body.exchangeRequest.providerCompleted).toBe(true);
      expect(response.body.exchangeRequest.requesterCompleted).toBe(false);
      expect(response.body.exchangeRequest.status).toBe("accepted");
    });

    test("should complete the exchange after both participants confirm", async () => {
      await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({});

      expect(response.statusCode).toBe(200);
      expect(response.body.exchangeRequest.requesterCompleted).toBe(true);
      expect(response.body.exchangeRequest.providerCompleted).toBe(true);
      expect(response.body.exchangeRequest.status).toBe("completed");
    });

    test("should prevent duplicate completion confirmation", async () => {
      await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      expect(response.statusCode).toBe(409);
    });

    test("should prevent a third party from confirming completion", async () => {
      const thirdParty = await User.create({
        name: "Third Party",
        email: "thirdparty.complete@test.com",
        password: "TestPassword123",
        phone: "9876543212",
        community: "Agra",
      });

      const thirdPartyToken = jwt.sign(
        {
          userId: thirdParty._id,
          tokenVersion: thirdParty.tokenVersion,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${thirdPartyToken}`)
        .send({});

      expect(response.statusCode).toBe(403);
    });

    test("should prevent completion confirmation while request is pending", async () => {
      await ExchangeRequest.findByIdAndUpdate(exchangeRequestId, {
        status: "pending",
      });

      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
    });

    test("should reject an unauthenticated request", async () => {
      const response = await request(app)
        .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
        .send({});

      expect(response.statusCode).toBe(401);
    });

    test("should complete the exchange when both participants confirm simultaneously", async () => {
      const [requesterResponse, providerResponse] = await Promise.all([
        request(app)
          .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
          .set("Authorization", `Bearer ${requesterToken}`)
          .send({}),

        request(app)
          .patch(`/api/v1/exchanges/${exchangeRequestId}/complete`)
          .set("Authorization", `Bearer ${providerToken}`)
          .send({}),
      ]);

      expect(requesterResponse.statusCode).toBe(200);
      expect(providerResponse.statusCode).toBe(200);

      const finalRequest = await ExchangeRequest.findById(exchangeRequestId);

      expect(finalRequest).not.toBeNull();
      expect(finalRequest.requesterCompleted).toBe(true);
      expect(finalRequest.providerCompleted).toBe(true);
      expect(finalRequest.status).toBe("completed");
    });
  });
});
