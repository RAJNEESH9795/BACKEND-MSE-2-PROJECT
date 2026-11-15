
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import Ride from "../../src/models/Ride.js";

describe("MoveMate Ride API", () => {
  let aaravToken;
  let priyaToken;
  let aaravId;
  let rideId;
  let cancellationRideId;

  // ==========================================
  // TEST USERS
  // ==========================================

  const aarav = {
    name: "Aarav Sharma",
    email: "aarav.ride.test@example.com",
    phone: "9876543211",
    password: "AaravPassword123",
    community: "Agra",
  };

  const priya = {
    name: "Priya Sharma",
    email: "priya.ride.test@example.com",
    phone: "9876543212",
    password: "PriyaPassword123",
    community: "Agra",
  };

  // ==========================================
  // TEST RIDE DATA
  // ==========================================

  const testRide = {
    source: "Agra",
    destination: "Delhi",
    departureDate: "2027-01-15",
    departureTime: "08:30",
    totalSeats: 4,
    costPerSeat: 300,
    description: "Travelling from Agra to Delhi",
  };

  // ==========================================
  // SETUP: REGISTER AND LOGIN BOTH USERS
  // ==========================================

  beforeAll(async () => {
    await User.deleteOne({ email: aarav.email });
    await User.deleteOne({ email: priya.email });

    // Register Aarav
    const aaravRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(aarav);

    expect(aaravRegister.status).toBe(201);

    // Register Priya
    const priyaRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(priya);

    expect(priyaRegister.status).toBe(201);

    // Login Aarav
    const aaravLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: aarav.email,
        password: aarav.password,
      });

    expect(aaravLogin.status).toBe(200);

    aaravToken = aaravLogin.body.token;

    // Login Priya
    const priyaLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: priya.email,
        password: priya.password,
      });

    expect(priyaLogin.status).toBe(200);

    priyaToken = priyaLogin.body.token;

    // Retrieve Aarav's MongoDB ID
    const savedAarav = await User.findOne({
      email: aarav.email,
    });

    expect(savedAarav).not.toBeNull();

    aaravId = savedAarav._id.toString();
  });

  // ==========================================
  // 1. CREATE RIDE
  // ==========================================

  describe("POST /api/v1/rides", () => {
    test("should create a ride successfully", async () => {
      const response = await request(app)
        .post("/api/v1/rides")
        .set("Authorization", `Bearer ${aaravToken}`)
        .send(testRide);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.ride.source).toBe(
        testRide.source
      );

      expect(response.body.ride.destination).toBe(
        testRide.destination
      );

      rideId = response.body.ride._id;

      const savedRide = await Ride.findById(rideId);

      expect(savedRide).not.toBeNull();

      expect(
        savedRide.createdBy.toString()
      ).toBe(aaravId);

      expect(savedRide.availableSeats).toBe(4);
    });

    test("should reject ride creation without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/rides")
        .send(testRide);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. GET ALL RIDES
  // ==========================================

  describe("GET /api/v1/rides", () => {
    test("should retrieve available rides", async () => {
      const response = await request(app)
        .get("/api/v1/rides")
        .set("Authorization", `Bearer ${aaravToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.rides)).toBe(true);

      expect(
        response.body.rides.some(
          (ride) => ride._id === rideId
        )
      ).toBe(true);
    });
  });

  // ==========================================
  // 3. GET RIDE BY ID
  // ==========================================

  describe("GET /api/v1/rides/:id", () => {
    test("should retrieve a ride by its ID", async () => {
      const response = await request(app)
        .get(`/api/v1/rides/${rideId}`)
        .set("Authorization", `Bearer ${aaravToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ride._id).toBe(rideId);
    });

    test("should reject an invalid ride ID", async () => {
      const response = await request(app)
        .get("/api/v1/rides/invalid-id")
        .set("Authorization", `Bearer ${aaravToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // 4. UPDATE RIDE
  // ==========================================

  describe("PATCH /api/v1/rides/:id", () => {
    test("should allow the ride creator to update their ride", async () => {
      const response = await request(app)
        .patch(`/api/v1/rides/${rideId}`)
        .set("Authorization", `Bearer ${aaravToken}`)
        .send({
          source: "Agra Cantt",
          destination: "New Delhi",
          departureTime: "09:00",
          totalSeats: 5,
          costPerSeat: 350,
          description: "Updated ride from Agra to Delhi",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.ride.source).toBe("Agra Cantt");
      expect(response.body.ride.destination).toBe("New Delhi");
      expect(response.body.ride.departureTime).toBe("09:00");
      expect(response.body.ride.totalSeats).toBe(5);
      expect(response.body.ride.availableSeats).toBe(5);
      expect(response.body.ride.costPerSeat).toBe(350);
    });

    test("should prevent another user from updating someone else's ride", async () => {
      const response = await request(app)
        .patch(`/api/v1/rides/${rideId}`)
        .set("Authorization", `Bearer ${priyaToken}`)
        .send({
          source: "Mumbai",
          destination: "Pune",
          costPerSeat: 100,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "You can only update your own rides"
      );
    });
  });

  // ==========================================
  // 5. CANCEL RIDE
  // ==========================================

  describe("DELETE /api/v1/rides/:id", () => {

    test("should create a separate ride for cancellation tests", async () => {
      const response = await request(app)
        .post("/api/v1/rides")
        .set("Authorization", `Bearer ${aaravToken}`)
        .send({
          ...testRide,
          source: "Agra",
          destination: "Mathura",
          description: "Ride created for cancellation tests",
        });

      expect(response.status).toBe(201);

      cancellationRideId = response.body.ride._id;
    });

    test("should prevent another user from cancelling someone else's ride", async () => {
      const response = await request(app)
        .delete(`/api/v1/rides/${cancellationRideId}`)
        .set("Authorization", `Bearer ${priyaToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "You can only cancel your own rides"
      );

      // Confirm that the ride remains open.
      const savedRide = await Ride.findById(
        cancellationRideId
      );

      expect(savedRide.status).toBe("open");
    });

    test("should allow the ride creator to cancel their ride", async () => {
      const response = await request(app)
        .delete(`/api/v1/rides/${cancellationRideId}`)
        .set("Authorization", `Bearer ${aaravToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.ride.status).toBe("cancelled");
    });

    test("should retain the cancelled ride in MongoDB", async () => {
      const savedRide = await Ride.findById(
        cancellationRideId
      );

      expect(savedRide).not.toBeNull();
      expect(savedRide.status).toBe("cancelled");
    });

    test("should not allow updating a cancelled ride", async () => {
      const response = await request(app)
        .patch(`/api/v1/rides/${cancellationRideId}`)
        .set("Authorization", `Bearer ${aaravToken}`)
        .send({
          source: "Updated Agra",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Only open rides can be updated"
      );
    });
  });
});
