import express from "express";
import * as OpenApiValidator from "express-openapi-validator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ContactCreateInput,
  CustomerCreateInput,
  CustomerUpdateInput,
  InMemoryStore,
} from "./lib/store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function singleQuery(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return fallback;
}
const openApiSpecPath = join(__dirname, "..", "openapi.yaml");

export function createApp(store: InMemoryStore): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.use(
    OpenApiValidator.middleware({
      apiSpec: openApiSpecPath,
      validateRequests: true,
      validateResponses: true,
    }),
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      version: process.env.SERVICE_VERSION ?? "0.1.0",
    });
  });

  app.get("/ready", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/v1/customers", (req, res) => {
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(singleQuery(req.query.limit, "20"), 10) || 20),
    );
    const offset = Math.max(0, Number.parseInt(singleQuery(req.query.offset, "0"), 10) || 0);
    const body = store.listCustomers({ limit, offset });
    res.status(200).json(body);
  });

  app.post("/v1/customers", (req, res) => {
    const customer = store.createCustomer(req.body as CustomerCreateInput);
    res.status(201).json(customer);
  });

  app.get("/v1/customers/:customerId", (req, res) => {
    const customer = store.getCustomer(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: "not_found", message: "Customer not found" });
      return;
    }
    res.status(200).json(customer);
  });

  app.patch("/v1/customers/:customerId", (req, res) => {
    const updated = store.updateCustomer(req.params.customerId, req.body as CustomerUpdateInput);
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Customer not found" });
      return;
    }
    res.status(200).json(updated);
  });

  app.get("/v1/customers/:customerId/contacts", (req, res) => {
    const contacts = store.listContacts(req.params.customerId);
    if (contacts === undefined) {
      res.status(404).json({ error: "not_found", message: "Customer not found" });
      return;
    }
    res.status(200).json({ data: contacts });
  });

  app.post("/v1/customers/:customerId/contacts", (req, res) => {
    const contact = store.createContact(req.params.customerId, req.body as ContactCreateInput);
    if (!contact) {
      res.status(404).json({ error: "not_found", message: "Customer not found" });
      return;
    }
    res.status(201).json(contact);
  });

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (res.headersSent) {
        next(err);
        return;
      }

      if (err && typeof err === "object" && "status" in err && "message" in err) {
        const status = (err as { status: number }).status;
        const message = String((err as { message: unknown }).message);
        if (status === 400) {
          res.status(400).json({ error: "bad_request", message });
          return;
        }
      }

      next(err);
    },
  );

  return app;
}
