
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import Ride from "../../src/models/Ride.js";
import Booking from "../../src/models/Booking.js";

describe("MoveMate Booking API", () => {
  // ==========================================
  // VARIABLES
  // ==========================================

  let aaravToken;
  let priyaToken;
  let otherUserToken;

  let aaravId;
  let priyaId;

  let rideId;

  // ==========================================
  // TEST USERS
  // ==========================================

  const aarav = {
    name: "Aarav Sharma",
    email: "aarav.booking.test@example.com",
    phone: "9876543213",
    password: "AaravPassword123",
    community: "Agra",
  };

  const priya = {
    name: "Priya Sharma",
    email: "priya.booking.test@example.com",
    phone: "9876543214",
    password: "PriyaPassword123",
    community: "Agra",
  };

  const otherUser = {
    name: "Rahul Sharma",
    email: "rahul.booking.test@example.com",
    phone: "9876543215",
    password: "RahulPassword123",
    community: "Agra",
  };

  // ==========================================
  // TEST RIDE DATA
  // ==========================================

  const testRide = {
    source: "Agra",
    destination: "Delhi",
    departureDate: "2027-01-20",
    departureTime: "09:00",
    totalSeats: 4,
    costPerSeat: 300,
    description: "Ride for booking API tests",
  };

  // ==========================================
  // SETUP: REGISTER AND LOGIN TEST USERS
  // ==========================================

  beforeAll(async () => {
    // Clean up previous test users.
    await User.deleteOne({ email: aarav.email });
    await User.deleteOne({ email: priya.email });
    await User.deleteOne({ email: otherUser.email });

    // Register Aarav.
    const aaravRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(aarav);

    expect(aaravRegister.status).toBe(201);

    // Register Priya.
    const priyaRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(priya);

    expect(priyaRegister.status).toBe(201);

    // Register Rahul.
    const rahulRegister = await request(app)
      .post("/api/v1/auth/register")
      .send(otherUser);

    expect(rahulRegister.status).toBe(201);

    // Login Aarav.
    const aaravLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: aarav.email,
        password: aarav.password,
      });

    expect(aaravLogin.status).toBe(200);
    aaravToken = aaravLogin.body.token;

    // Login Priya.
    const priyaLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: priya.email,
        password: priya.password,
      });

    expect(priyaLogin.status).toBe(200);
    priyaToken = priyaLogin.body.token;

    // Login Rahul.
    const rahulLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: otherUser.email,
        password: otherUser.password,
      });

    expect(rahulLogin.status).toBe(200);
    otherUserToken = rahulLogin.body.token;

    // Retrieve user IDs.
    const savedAarav = await User.findOne({
      email: aarav.email,
    });

    const savedPriya = await User.findOne({
      email: priya.email,
    });

    expect(savedAarav).not.toBeNull();
    expect(savedPriya).not.toBeNull();

    aaravId = savedAarav._id.toString();
    priyaId = savedPriya._id.toString();
  });

  // ==========================================
  // SETUP: CREATE A FRESH RIDE BEFORE EACH TEST
  // ==========================================

  beforeEach(async () => {
    const rideResponse = await request(app)
      .post("/api/v1/rides")
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        ...testRide,
        departureDate: "2027-01-20",
      });

    expect(rideResponse.status).toBe(201);

    rideId = rideResponse.body.ride._id;

    expect(rideId).toBeDefined();
  });

  // ==========================================
  // TEST 1: CREATE BOOKING
  // ==========================================

  test("should allow a passenger to create a booking request", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 2,
        message: "I would like to join this ride.",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.booking).toBeDefined();

    const booking = response.body.booking;

    expect(booking.ride.toString()).toBe(rideId);
    expect(booking.user.toString()).toBe(priyaId);
    expect(booking.seats).toBe(2);
    expect(booking.status).toBe("pending");
  });

  // ==========================================
  // TEST 2: PREVENT DUPLICATE BOOKINGS
  // ==========================================

  test("should prevent duplicate active booking requests", async () => {
    // Create the first booking.
    const firstResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 1,
        message: "First booking request.",
      });

    expect(firstResponse.status).toBe(201);

    // Attempt another active booking for the same ride.
    const duplicateResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 1,
        message: "Trying to book the same ride again.",
      });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.success).toBe(false);
  });

  // ==========================================
  // TEST 3: AUTHENTICATION REQUIRED
  // ==========================================

  test("should not allow booking without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .send({
        rideId,
        seats: 1,
        message: "Trying to book without login.",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // TEST 4: APPROVE BOOKING AND DEDUCT SEATS
  // ==========================================

  test("should allow ride owner to approve a booking and deduct seats", async () => {
    // Create a booking for this test.
    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 2,
        message: "Requesting two seats.",
      });

    expect(bookingResponse.status).toBe(201);

    const bookingId = bookingResponse.body.booking._id;

    // Aarav approves the booking.
    const approvalResponse = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        status: "approved",
      });

    expect(approvalResponse.status).toBe(200);
    expect(approvalResponse.body.success).toBe(true);

    const updatedBooking = await Booking.findById(bookingId);

    expect(updatedBooking).not.toBeNull();
    expect(updatedBooking.status).toBe("approved");

    const updatedRide = await Ride.findById(rideId);

    expect(updatedRide).not.toBeNull();
    expect(updatedRide.availableSeats).toBe(2);
    expect(updatedRide.status).toBe("open");
  });

  // ==========================================
  // TEST 5: REJECT BOOKING WITHOUT DEDUCTING SEATS
  // ==========================================

  test("should allow ride owner to reject a booking without deducting seats", async () => {
    // Rahul requests one seat.
    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({
        rideId,
        seats: 1,
        message: "I would like to join this ride.",
      });

    expect(bookingResponse.status).toBe(201);

    const rahulBookingId = bookingResponse.body.booking._id;

    // Aarav rejects Rahul's booking.
    const rejectionResponse = await request(app)
      .patch(`/api/v1/bookings/${rahulBookingId}/status`)
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        status: "rejected",
      });

    expect(rejectionResponse.status).toBe(200);
    expect(rejectionResponse.body.success).toBe(true);

    const rejectedBooking = await Booking.findById(rahulBookingId);

    expect(rejectedBooking).not.toBeNull();
    expect(rejectedBooking.status).toBe("rejected");

    const updatedRide = await Ride.findById(rideId);

    expect(updatedRide.availableSeats).toBe(4);
    expect(updatedRide.status).toBe("open");
  });

  // ==========================================
  // TEST 6: CANCEL APPROVED BOOKING
  // ==========================================

  test("should allow passenger to cancel approved booking and restore seats", async () => {
    // Priya creates a booking.
    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 2,
        message: "Requesting two seats.",
      });

    expect(bookingResponse.status).toBe(201);

    const bookingId = bookingResponse.body.booking._id;

    // Aarav approves the booking.
    const approvalResponse = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        status: "approved",
      });

    expect(approvalResponse.status).toBe(200);

    // Priya cancels her approved booking.
    const cancellationResponse = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${priyaToken}`);

    expect(cancellationResponse.status).toBe(200);
    expect(cancellationResponse.body.success).toBe(true);

    const cancelledBooking = await Booking.findById(bookingId);

    expect(cancelledBooking).not.toBeNull();
    expect(cancelledBooking.status).toBe("cancelled");

    const updatedRide = await Ride.findById(rideId);

    expect(updatedRide).not.toBeNull();
    expect(updatedRide.availableSeats).toBe(4);
    expect(updatedRide.status).toBe("open");
  });

  // ==========================================
  // TEST 7: CANCEL PENDING BOOKING
  // ==========================================

  test("should allow passenger to cancel pending booking without changing available seats", async () => {
    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({
        rideId,
        seats: 1,
        message: "Requesting one seat.",
      });

    expect(bookingResponse.status).toBe(201);

    const rahulBookingId = bookingResponse.body.booking._id;

    const pendingBooking = await Booking.findById(rahulBookingId);

    expect(pendingBooking).not.toBeNull();
    expect(pendingBooking.status).toBe("pending");

    const cancellationResponse = await request(app)
      .patch(`/api/v1/bookings/${rahulBookingId}/cancel`)
      .set("Authorization", `Bearer ${otherUserToken}`);

    expect(cancellationResponse.status).toBe(200);
    expect(cancellationResponse.body.success).toBe(true);

    const cancelledBooking = await Booking.findById(rahulBookingId);

    expect(cancelledBooking).not.toBeNull();
    expect(cancelledBooking.status).toBe("cancelled");

    const updatedRide = await Ride.findById(rideId);

    expect(updatedRide).not.toBeNull();
    expect(updatedRide.availableSeats).toBe(4);
    expect(updatedRide.status).toBe("open");
  });

  // ==========================================
  // TEST 8: PREVENT BOOKING OWN RIDE
  // ==========================================

  test("should prevent a user from booking their own ride", async () => {
    const response = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        rideId,
        seats: 1,
        message: "Trying to book my own ride.",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/own ride/i);

    const aaravBookings = await Booking.find({
      ride: rideId,
      user: aaravId,
    });

    expect(aaravBookings).toHaveLength(0);

    const ride = await Ride.findById(rideId);

    expect(ride).not.toBeNull();
    expect(ride.availableSeats).toBe(4);
    expect(ride.status).toBe("open");
  });

  // ==========================================
  // TEST 9: PREVENT BOOKING WITH INSUFFICIENT SEATS
  // ==========================================

  test("should prevent booking when insufficient seats are available", async () => {
    // Rahul requests three seats.
    const rahulBookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({
        rideId,
        seats: 3,
        message: "Requesting three seats.",
      });

    expect(rahulBookingResponse.status).toBe(201);

    const rahulBookingId = rahulBookingResponse.body.booking._id;

    // Aarav approves Rahul's booking.
    const approvalResponse = await request(app)
      .patch(`/api/v1/bookings/${rahulBookingId}/status`)
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        status: "approved",
      });

    expect(approvalResponse.status).toBe(200);

    const updatedRide = await Ride.findById(rideId);

    expect(updatedRide.availableSeats).toBe(1);
    expect(updatedRide.status).toBe("open");

    // Priya tries to book two seats when only one is available.
    const priyaBookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 2,
        message: "Requesting two seats.",
      });

    expect(priyaBookingResponse.status).toBe(400);
    expect(priyaBookingResponse.body.success).toBe(false);

    const priyaBooking = await Booking.findOne({
      ride: rideId,
      user: priyaId,
      status: { $in: ["pending", "approved"] },
    });

    expect(priyaBooking).toBeNull();

    const finalRide = await Ride.findById(rideId);

    expect(finalRide.availableSeats).toBe(1);
    expect(finalRide.status).toBe("open");
  });

  // ==========================================
  // TEST 10: PREVENT BOOKING A CANCELLED RIDE
  // ==========================================

  test("should prevent passengers from booking a cancelled ride", async () => {
    const cancelledRideResponse = await request(app)
      .post("/api/v1/rides")
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        ...testRide,
        source: "Agra",
        destination: "Jaipur",
        departureDate: "2027-02-15",
      });

    expect(cancelledRideResponse.status).toBe(201);

    const cancelledRideId = cancelledRideResponse.body.ride._id;

    const cancellationResponse = await request(app)
      .delete(`/api/v1/rides/${cancelledRideId}`)
      .set("Authorization", `Bearer ${aaravToken}`);

    expect(cancellationResponse.status).toBe(200);
    expect(cancellationResponse.body.success).toBe(true);

    const cancelledRide = await Ride.findById(cancelledRideId);

    expect(cancelledRide).not.toBeNull();
    expect(cancelledRide.status).toBe("cancelled");

    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({
        rideId: cancelledRideId,
        seats: 1,
        message: "Trying to book a cancelled ride.",
      });

    expect(bookingResponse.status).toBe(400);
    expect(bookingResponse.body.success).toBe(false);

    const bookings = await Booking.find({
      ride: cancelledRideId,
    });

    expect(bookings).toHaveLength(0);

    const finalRide = await Ride.findById(cancelledRideId);

    expect(finalRide).not.toBeNull();
    expect(finalRide.status).toBe("cancelled");
  });

  // ==========================================
  // TEST 11: PREVENT BOOKING A COMPLETED RIDE
  // ==========================================

  test("should prevent passengers from booking a completed ride", async () => {
    const completedRideResponse = await request(app)
      .post("/api/v1/rides")
      .set("Authorization", `Bearer ${aaravToken}`)
      .send({
        ...testRide,
        source: "Agra",
        destination: "Mumbai",
        departureDate: "2027-02-20",
      });

    expect(completedRideResponse.status).toBe(201);

    const completedRideId = completedRideResponse.body.ride._id;

    const updatedRide = await Ride.findByIdAndUpdate(
      completedRideId,
      { status: "completed" },
      { returnDocument: "after", runValidators: true }
    );

    expect(updatedRide).not.toBeNull();
    expect(updatedRide.status).toBe("completed");

    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({
        rideId: completedRideId,
        seats: 1,
        message: "Trying to book a completed ride.",
      });

    expect(bookingResponse.status).toBe(400);
    expect(bookingResponse.body.success).toBe(false);

    const bookings = await Booking.find({
      ride: completedRideId,
    });

    expect(bookings).toHaveLength(0);

    const finalRide = await Ride.findById(completedRideId);

    expect(finalRide).not.toBeNull();
    expect(finalRide.status).toBe("completed");
  });

  // ==========================================
  // TEST 12: PREVENT UNAUTHORIZED BOOKING CANCELLATION
  // ==========================================

  test("should prevent another user from cancelling someone else's booking", async () => {
    // The beforeEach hook has already created a fresh ride.

    // Priya creates a booking request.
    const bookingResponse = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({
        rideId,
        seats: 1,
        message: "Priya is requesting one seat.",
      });

    expect(bookingResponse.status).toBe(201);

    const priyaBookingId = bookingResponse.body.booking._id;

    // Verify Priya's booking.
    const originalBooking = await Booking.findById(priyaBookingId);

    expect(originalBooking).not.toBeNull();
    expect(originalBooking.status).toBe("pending");
    expect(originalBooking.user.toString()).toBe(priyaId);

    // Rahul tries to cancel Priya's booking.
    const cancellationResponse = await request(app)
      .patch(`/api/v1/bookings/${priyaBookingId}/cancel`)
      .set("Authorization", `Bearer ${otherUserToken}`);

    // Rahul must be denied access.
    expect(cancellationResponse.status).toBe(403);
    expect(cancellationResponse.body.success).toBe(false);

    // Verify Priya's booking remains unchanged.
    const finalBooking = await Booking.findById(priyaBookingId);

    expect(finalBooking).not.toBeNull();
    expect(finalBooking.status).toBe("pending");
    expect(finalBooking.user.toString()).toBe(priyaId);

    // Verify the ride's available seats remain unchanged.
    const ride = await Ride.findById(rideId);

    expect(ride).not.toBeNull();
    expect(ride.availableSeats).toBe(4);
    expect(ride.status).toBe("open");
  });
});
