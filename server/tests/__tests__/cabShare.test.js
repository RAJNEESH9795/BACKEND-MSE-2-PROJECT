import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";
import User from "../../src/models/User.js";
import CabShare from "../../src/models/CabShare.js";
import Notification from "../../src/models/Notification.js";

describe("Cab Share API", () => {
  test("should run the Cab Share test suite", () => {
    expect(true).toBe(true);
  });
});