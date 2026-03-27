import { randomUUID } from "node:crypto";

export type CustomerStatus = "draft" | "pending_review" | "active";

export interface Customer {
  id: string;
  name: string;
  industry: string | null;
  region: string | null;
  status: CustomerStatus;
  externalRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
}

export interface CustomerCreateInput {
  name: string;
  industry?: string;
  region?: string;
  status?: CustomerStatus;
  externalRef?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  industry?: string | null;
  region?: string | null;
  status?: CustomerStatus;
  externalRef?: string | null;
}

export interface ContactCreateInput {
  name: string;
  email: string;
  role?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class InMemoryStore {
  private readonly customers = new Map<string, Customer>();
  private readonly contactsByCustomer = new Map<string, Contact[]>();

  createCustomer(input: CustomerCreateInput): Customer {
    const id = randomUUID();
    const ts = nowIso();
    const status = input.status ?? "draft";
    const customer: Customer = {
      id,
      name: input.name,
      industry: input.industry ?? null,
      region: input.region ?? null,
      status,
      externalRef: input.externalRef ?? null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.customers.set(id, customer);
    this.contactsByCustomer.set(id, []);
    return customer;
  }

  listCustomers(params: { limit: number; offset: number }): {
    data: Customer[];
    meta: { total: number; limit: number; offset: number };
  } {
    const all = [...this.customers.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const total = all.length;
    const data = all.slice(params.offset, params.offset + params.limit);
    return { data, meta: { total, limit: params.limit, offset: params.offset } };
  }

  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  updateCustomer(id: string, patch: CustomerUpdateInput): Customer | undefined {
    const existing = this.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = {
      ...existing,
      name: patch.name ?? existing.name,
      industry: patch.industry !== undefined ? patch.industry : existing.industry,
      region: patch.region !== undefined ? patch.region : existing.region,
      status: patch.status ?? existing.status,
      externalRef: patch.externalRef !== undefined ? patch.externalRef : existing.externalRef,
      updatedAt: nowIso(),
    };
    this.customers.set(id, updated);
    return updated;
  }

  listContacts(customerId: string): Contact[] | undefined {
    if (!this.customers.has(customerId)) return undefined;
    return [...(this.contactsByCustomer.get(customerId) ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1,
    );
  }

  createContact(customerId: string, input: ContactCreateInput): Contact | undefined {
    if (!this.customers.has(customerId)) return undefined;

    const id = randomUUID();
    const contact: Contact = {
      id,
      customerId,
      name: input.name,
      email: input.email,
      role: input.role ?? null,
      createdAt: nowIso(),
    };
    const list = this.contactsByCustomer.get(customerId) ?? [];
    list.push(contact);
    this.contactsByCustomer.set(customerId, list);
    return contact;
  }
}
