import { app } from "@/app.js";
import { prisma } from "@/database/prisma.js";
import { afterEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

describe("UsersController", () => {
  let user_id: string;

  it("Should create a new user successfully", async () => {
    const response = await request(app).post("/users").send({
      name: "Test User",
      email: "test@example.com",
      password: "password1234",
    });
    console.log(response.body);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test User");
    user_id = response.body.id;
  });

  it("Should not create a new user.", async () => {
    const response = await request(app).post("/users").send({
      name: "Te",
      email: "test",
      password: "1234",
    });
    expect(response.body).toHaveProperty("errors.properties.name");
    expect(response.body).toHaveProperty("errors.properties.email");
    expect(response.body.errors.properties).toHaveProperty("password");
  });
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: "test@example.com" } });
  });
});
