import { app } from "@/app.js";
import { prisma } from "@/database/prisma.js";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import request from "supertest";

describe("SessionsController", () => {
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: "auth@example.com" } });
  });

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: "auth@example.com" } });
  });

  afterAll(async () => {
    // Fecha a conexão do Prisma — sem isso o Jest pode ficar "pendurado"
    // (processo não finaliza sozinho) porque a pool de conexão continua aberta.
    await prisma.$disconnect();
  });

  it("Should authenticate a and get access token", async () => {
    const userResponse = await request(app).post("/users").send({
      name: "Test User",
      email: "auth@example.com",
      password: "password1234",
    });

    const sessionResponse = await request(app).post("/sessions").send({
      email: "auth@example.com",
      password: "password1234",
    });
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.token).toEqual(expect.any(String));
  });

  it("Should get a the user info", async () => {
    const userResponse = await request(app).post("/users").send({
      name: "Test User",
      email: "auth@example.com",
      password: "password1234",
    });
    const sessionResponse = await request(app).post("/sessions").send({
      email: "auth@example.com",
      password: "password1234",
    });

    const userInfoResponse = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${sessionResponse.body.token}`);

    expect(userInfoResponse.status).toBe(200);
    expect(userInfoResponse.body.user.id).toEqual(userResponse.body.id);
    expect(userInfoResponse.body.user.name).toEqual(expect.any(String));
    expect(userInfoResponse.body.user.email).toEqual(expect.any(String));
    expect(userInfoResponse.body.user.role).toEqual(expect.any(String));
    expect(userInfoResponse.body.user).not.toHaveProperty("password");
  });

  it("Not get info and get a 401", async () => {
    const userInfoResponse = await request(app)
      .get("/users")
      .set(
        "Authorization",
        `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3ODY0OTAxODksImV4cCI6MTc4NjU3NjU4OSwic3ViIjoiMDAyYzhkODgtNWQ2ZC00NmI4LThiYjAtMjg2M2FkYmViMjExIn0.sv6ER6g7MjwbcWWVYRPd01SGabsYibqXU8pVYb71lg4`,
      );

    expect(userInfoResponse.status).toBe(401);
  });
});
