
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/User.js";

describe("MoveMate Authentication API", () => {
  // Shared test user accessible to all nested test blocks.
  const validUser = {
    name: "Test User",
    email: "testuser@example.com",
    phone: "9876543210",
    password: "TestPassword123",
    community: "Agra",
  };

  // ==========================================
  // 1. REGISTRATION TESTS
  // ==========================================

  describe("POST /api/v1/auth/register", () => {
    test("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.password).toBeUndefined();
    });

    test("should reject duplicate email registration", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test("should store password as a bcrypt hash", async () => {
      const user = await User.findOne({
        email: validUser.email,
      }).select("+password");

      expect(user).not.toBeNull();
      expect(user.password).not.toBe(validUser.password);
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });
  });

  // ==========================================
  // 2. LOGIN TESTS
  // ==========================================

  describe("POST /api/v1/auth/login", () => {
    test("should login successfully and return a JWT token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
      expect(response.body.user.email).toBe(validUser.email);

      // Verify JWT by accessing a protected route.
      const protectedResponse = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${response.body.token}`);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.success).toBe(true);
    });

    test("should reject login with an incorrect password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: validUser.email,
          password: "WrongPassword123",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // 3. PROTECTED ROUTE TESTS
  // ==========================================

  describe("Protected routes", () => {
    test("should reject requests without a JWT token", async () => {
      const response = await request(app)
        .get("/api/v1/users/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
