import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { InMemoryStore } from "../src/lib/store.js";

describe("Customer API", () => {
  const store = new InMemoryStore();
  const app = createApp(store);

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body).toEqual({ status: "ok", version: "0.1.0" });
  });

  it("GET /ready returns ok", async () => {
    const res = await request(app).get("/ready").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("creates and retrieves a customer", async () => {
    const created = await request(app)
      .post("/v1/customers")
      .send({ name: "Acme Corp", status: "draft" })
      .expect(201);

    expect(created.body.name).toBe("Acme Corp");
    expect(created.body.status).toBe("draft");
    const id = created.body.id as string;

    const get = await request(app).get(`/v1/customers/${id}`).expect(200);
    expect(get.body.id).toBe(id);
  });

  it("lists customers with pagination", async () => {
    await request(app).post("/v1/customers").send({ name: "Beta LLC" }).expect(201);
    const res = await request(app).get("/v1/customers?limit=1&offset=0").expect(200);
    expect(res.body.meta.limit).toBe(1);
    expect(res.body.meta.offset).toBe(0);
    expect(res.body.data.length).toBe(1);
  });

  it("returns 404 for missing customer", async () => {
    const res = await request(app)
      .get("/v1/customers/00000000-0000-4000-8000-000000000001")
      .expect(404);
    expect(res.body.error).toBe("not_found");
  });

  it("patches a customer", async () => {
    const created = await request(app)
      .post("/v1/customers")
      .send({ name: "Gamma Inc" })
      .expect(201);
    const id = created.body.id as string;

    const updated = await request(app)
      .patch(`/v1/customers/${id}`)
      .send({ status: "active" })
      .expect(200);
    expect(updated.body.status).toBe("active");
  });

  it("manages contacts", async () => {
    const created = await request(app)
      .post("/v1/customers")
      .send({ name: "Acme Corp" })
      .expect(201);
    const customerId = created.body.id as string;

    const contact = await request(app)
      .post(`/v1/customers/${customerId}/contacts`)
      .send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        role: "Buyer",
      })
      .expect(201);
    expect(contact.body.email).toBe("jane.doe@example.com");

    const list = await request(app).get(`/v1/customers/${customerId}/contacts`).expect(200);
    expect(list.body.data).toHaveLength(1);
  });

  it("returns 404 when adding contact to missing customer", async () => {
    const res = await request(app)
      .post("/v1/customers/00000000-0000-4000-8000-000000000002/contacts")
      .send({ name: "X", email: "x@example.com" })
      .expect(404);
    expect(res.body.error).toBe("not_found");
  });
});
