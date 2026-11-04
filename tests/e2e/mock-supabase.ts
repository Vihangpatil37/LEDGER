import http from "node:http";
import { URL } from "node:url";

export interface MockCustomer {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  alert_step: number;
  is_active: boolean;
  balance: string;
  status: "CLEAR" | "OWING" | "ALERT" | "ADVANCE";
  alert_level: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockTransaction {
  id: string;
  owner_id: string;
  customer_id: string;
  customer_name: string;
  type: "CREDIT" | "PAYMENT";
  amount: string;
  description: string | null;
  is_reversal: boolean;
  reversal_of: string | null;
  advance_confirmed: boolean;
  idempotency_key?: string;
  created_at: string;
}

const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const OWNER_EMAIL = "owner@chailedger.local";
const OWNER_PASSWORD = "password123";

function createJwt(userId: string, email: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "supabase-demo",
      sub: userId,
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600 * 24,
      role: "authenticated",
      email,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
    })
  ).toString("base64url");
  return `${header}.${payload}.c2lnbmF0dXJl`;
}

export function createMockSupabaseServer() {
  let customers: MockCustomer[] = [
    {
      id: "10000000-0000-0000-0000-000000000001",
      owner_id: OWNER_ID,
      name: "Rahul Patel",
      phone: "919876543210",
      alert_step: 500,
      is_active: true,
      balance: "1150.00",
      status: "ALERT",
      alert_level: 2,
      last_activity_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 86400 * 3000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      owner_id: OWNER_ID,
      name: "Amit Shah",
      phone: "919823456789",
      alert_step: 500,
      is_active: true,
      balance: "1000.00",
      status: "ALERT",
      alert_level: 2,
      last_activity_at: new Date(Date.now() - 7200 * 1000).toISOString(),
      created_at: new Date(Date.now() - 86400 * 2000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      owner_id: OWNER_ID,
      name: "Jay Mehta",
      phone: "919834567890",
      alert_step: 500,
      is_active: true,
      balance: "500.00",
      status: "ALERT",
      alert_level: 1,
      last_activity_at: new Date(Date.now() - 10800 * 1000).toISOString(),
      created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "10000000-0000-0000-0000-000000000005",
      owner_id: OWNER_ID,
      name: "Suresh Kumar",
      phone: "919856789012",
      alert_step: 500,
      is_active: true,
      balance: "0.00",
      status: "CLEAR",
      alert_level: 0,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      owner_id: OWNER_ID,
      name: "Vikram Singh",
      phone: "919845678901",
      alert_step: 500,
      is_active: false,
      balance: "0.00",
      status: "CLEAR",
      alert_level: 0,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "10000000-0000-0000-0000-000000000006",
      owner_id: OWNER_ID,
      name: "Priya Sharma",
      phone: "919867890123",
      alert_step: 500,
      is_active: true,
      balance: "550.00",
      status: "ALERT",
      alert_level: 1,
      last_activity_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400 * 10000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  let transactions: MockTransaction[] = [
    // Initial entries for Rahul Patel (id 1)
    {
      id: "20000000-0000-0000-0000-000000000001",
      owner_id: OWNER_ID,
      customer_id: "10000000-0000-0000-0000-000000000001",
      customer_name: "Rahul Patel",
      type: "CREDIT",
      amount: "500.00",
      description: "Chai & snacks",
      is_reversal: false,
      reversal_of: null,
      advance_confirmed: false,
      created_at: new Date(Date.now() - 86400 * 3000).toISOString(),
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      owner_id: OWNER_ID,
      customer_id: "10000000-0000-0000-0000-000000000001",
      customer_name: "Rahul Patel",
      type: "CREDIT",
      amount: "800.00",
      description: "Cold drink",
      is_reversal: false,
      reversal_of: null,
      advance_confirmed: false,
      created_at: new Date(Date.now() - 86400 * 2000).toISOString(),
    },
    {
      id: "20000000-0000-0000-0000-000000000003",
      owner_id: OWNER_ID,
      customer_id: "10000000-0000-0000-0000-000000000001",
      customer_name: "Rahul Patel",
      type: "PAYMENT",
      amount: "150.00",
      description: "Cash payment",
      is_reversal: false,
      reversal_of: null,
      advance_confirmed: false,
      created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
    },
  ];

  // Seed 55 entries for Priya Sharma (id 6) for pagination testing (E2E-10)
  const baseTime = Date.now() - 60 * 3600 * 1000;
  for (let i = 1; i <= 55; i++) {
    transactions.push({
      id: `30000000-0000-0000-0000-${i.toString().padStart(12, "0")}`,
      owner_id: OWNER_ID,
      customer_id: "10000000-0000-0000-0000-000000000006",
      customer_name: "Priya Sharma",
      type: "CREDIT",
      amount: "10.00",
      description: `Chai order ${i}`,
      is_reversal: false,
      reversal_of: null,
      advance_confirmed: false,
      created_at: new Date(baseTime + i * 3600 * 1000).toISOString(),
    });
  }

  function computeCustomerRunningBalances(
    customerId: string
  ): (MockTransaction & { running_balance: string; is_reversed: boolean })[] {
    const custTxns = transactions.filter((t) => t.customer_id === customerId);
    // Sort chronological: created_at asc, id asc
    custTxns.sort((a, b) => {
      if (a.created_at !== b.created_at) {
        return a.created_at.localeCompare(b.created_at);
      }
      return a.id.localeCompare(b.id);
    });

    const reversedSet = new Set(
      custTxns
        .filter((t) => t.is_reversal && t.reversal_of)
        .map((t) => t.reversal_of!)
    );

    let runningPaise = 0;
    return custTxns.map((t) => {
      const amtPaise = Math.round(parseFloat(t.amount) * 100);
      if (t.type === "CREDIT") {
        runningPaise += amtPaise;
      } else {
        runningPaise -= amtPaise;
      }
      return {
        ...t,
        running_balance: (runningPaise / 100).toFixed(2),
        is_reversed: reversedSet.has(t.id),
      };
    });
  }

  function updateCustomerBalance(customer: MockCustomer) {
    const entries = computeCustomerRunningBalances(customer.id);
    const finalBalPaise =
      entries.length > 0
        ? Math.round(
            parseFloat(entries[entries.length - 1].running_balance) * 100
          )
        : 0;
    customer.balance = (finalBalPaise / 100).toFixed(2);
    const alertStepPaise = customer.alert_step * 100;

    if (finalBalPaise < 0) {
      customer.status = "ADVANCE";
      customer.alert_level = 0;
    } else if (finalBalPaise === 0) {
      customer.status = "CLEAR";
      customer.alert_level = 0;
    } else if (finalBalPaise >= alertStepPaise) {
      customer.status = "ALERT";
      customer.alert_level = Math.floor(finalBalPaise / alertStepPaise);
    } else {
      customer.status = "OWING";
      customer.alert_level = 0;
    }

    if (entries.length > 0) {
      customer.last_activity_at = entries[entries.length - 1].created_at;
    }
  }

  let ownerProfile = {
    id: OWNER_ID,
    shop_name: "Sharma Tea Stall",
    owner_name: "Ramesh Sharma",
    phone: "919876543210",
    default_alert_step: 500,
    reminder_template:
      "Namaste {name} ji! 🙏\n\nAapke account mein ₹{amount} ka udhaar pending hai.\n\nKripya apna pending payment clear kar dein.\n\nDhanyavaad!",
    created_at: new Date().toISOString(),
  };

  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization, x-client-info, apikey, content-type, prefer, range-unit"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const authHeader = req.headers.authorization || "";
    const isAnon =
      !authHeader ||
      authHeader.includes(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24i"
      );

    // Helper to read JSON body
    const readBody = async () => {
      return new Promise<any>((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    // 1. Health endpoint
    if (pathname === "/auth/v1/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "OK", version: "mock-v1" }));
      return;
    }

    // 2. Auth signIn with password
    if (pathname === "/auth/v1/token") {
      const grantType = parsedUrl.searchParams.get("grant_type");
      const body = await readBody();

      if (grantType === "password" || body.grant_type === "password") {
        if (body.email === OWNER_EMAIL && body.password === OWNER_PASSWORD) {
          const token = createJwt(OWNER_ID, OWNER_EMAIL);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              access_token: token,
              token_type: "bearer",
              expires_in: 86400,
              refresh_token: "mock-refresh-token",
              user: {
                id: OWNER_ID,
                aud: "authenticated",
                role: "authenticated",
                email: OWNER_EMAIL,
                email_confirmed_at: new Date().toISOString(),
                phone: "",
                confirmed_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                app_metadata: { provider: "email", providers: ["email"] },
                user_metadata: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            })
          );
          return;
        }

        // Invalid credentials
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "invalid_grant",
            error_description: "Invalid login credentials",
          })
        );
        return;
      }
    }

    // 3. Auth getUser
    if (pathname === "/auth/v1/user") {
      if (!isAnon) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            id: OWNER_ID,
            aud: "authenticated",
            role: "authenticated",
            email: OWNER_EMAIL,
            email_confirmed_at: new Date().toISOString(),
            phone: "",
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
        return;
      }
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid token" }));
      return;
    }

    // 4. Auth signup (D-10: public signup is disabled)
    if (pathname === "/auth/v1/signup") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "signups_disabled",
          message: "Signups not allowed for this instance",
        })
      );
      return;
    }

    // 5. Auth password reset recovery
    if (pathname === "/auth/v1/recover") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({}));
      return;
    }

    // 6. Auth logout
    if (pathname === "/auth/v1/logout") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({}));
      return;
    }

    // --- PostgREST /rest/v1 routes ---
    // If anonymous, enforce 0005_grants.sql (revoked permissions)
    if (isAnon && pathname.startsWith("/rest/v1/")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          hint: null,
          details: null,
          code: "42501",
          message: "permission denied for schema public",
        })
      );
      return;
    }

    // 7. Settings / Profiles endpoint
    if (pathname === "/rest/v1/profiles" || pathname === "/rest/v1/settings") {
      const isSingle =
        req.headers.accept?.includes("application/vnd.pgrst.object+json") ||
        parsedUrl.searchParams.has("id");

      if (req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(isSingle ? ownerProfile : [ownerProfile]));
        return;
      }

      if (req.method === "PATCH") {
        const body = await readBody();
        if (body.shop_name !== undefined) ownerProfile.shop_name = body.shop_name;
        if (body.owner_name !== undefined) ownerProfile.owner_name = body.owner_name;
        if (body.phone !== undefined) ownerProfile.phone = body.phone;
        if (body.default_alert_step !== undefined)
          ownerProfile.default_alert_step = Number(body.default_alert_step);
        if (body.reminder_template !== undefined)
          ownerProfile.reminder_template = body.reminder_template;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(isSingle ? ownerProfile : [ownerProfile]));
        return;
      }
    }

    // 8. Customer Balances View (`/rest/v1/customer_balances`)
    if (pathname === "/rest/v1/customer_balances") {
      let filtered = [...customers];

      // Filter by is_active
      const isActiveFilter = parsedUrl.searchParams.get("is_active");
      if (isActiveFilter === "eq.true") {
        filtered = filtered.filter((c) => c.is_active === true);
      } else if (isActiveFilter === "eq.false") {
        filtered = filtered.filter((c) => c.is_active === false);
      }

      // Filter by status (e.g. status=eq.ALERT)
      const statusFilter = parsedUrl.searchParams.get("status");
      if (statusFilter && statusFilter.startsWith("eq.")) {
        const statusVal = statusFilter.slice(3);
        filtered = filtered.filter((c) => c.status === statusVal);
      }

      // Order (e.g. order=balance.desc)
      const orderParam = parsedUrl.searchParams.get("order");
      if (orderParam && orderParam.includes("balance.desc")) {
        filtered.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
      }

      // Filter by ID
      const idFilter = parsedUrl.searchParams.get("id");
      if (idFilter && idFilter.startsWith("eq.")) {
        const idVal = idFilter.slice(3);
        filtered = filtered.filter((c) => c.id === idVal);
      }

      // Filter by OR search query: or=(name.ilike.%search%,phone.like.%digits%)
      const orFilter = parsedUrl.searchParams.get("or");
      if (orFilter) {
        const match = orFilter.match(
          /name\.ilike\.%(.*?)%,phone\.like\.%(.*?)%/
        );
        if (match) {
          const searchQ = decodeURIComponent(match[1]).toLowerCase();
          const digits = match[2];
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(searchQ) ||
              c.phone.includes(digits)
          );
        }
      }

      // Limit
      const limitParam = parsedUrl.searchParams.get("limit");
      if (limitParam && !parsedUrl.searchParams.has("id")) {
        const limit = parseInt(limitParam, 10);
        filtered = filtered.slice(0, limit);
      }

      const isSingle =
        req.headers.accept?.includes("application/vnd.pgrst.object+json") ||
        parsedUrl.searchParams.has("id");

      if (isSingle) {
        if (filtered.length > 0) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(filtered[0]));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("null");
        }
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(filtered));
      return;
    }

    // 9. Customers table (`/rest/v1/customers`)
    if (pathname === "/rest/v1/customers") {
      // A. GET (for duplicate check or fetching)
      if (req.method === "GET") {
        let filtered = [...customers];

        const phoneFilter = parsedUrl.searchParams.get("phone");
        if (phoneFilter && phoneFilter.startsWith("eq.")) {
          const phoneVal = phoneFilter.slice(3);
          filtered = filtered.filter((c) => c.phone === phoneVal);
        }

        const idFilter = parsedUrl.searchParams.get("id");
        if (idFilter && idFilter.startsWith("eq.")) {
          const idVal = idFilter.slice(3);
          filtered = filtered.filter((c) => c.id === idVal);
        }

        const neqIdFilter = parsedUrl.searchParams.get("id");
        if (neqIdFilter && neqIdFilter.startsWith("neq.")) {
          const idVal = neqIdFilter.slice(4);
          filtered = filtered.filter((c) => c.id !== idVal);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(filtered));
        return;
      }

      // B. POST (insert customer)
      if (req.method === "POST") {
        const body = await readBody();
        const newCust: MockCustomer = {
          id: crypto.randomUUID(),
          owner_id: OWNER_ID,
          name: body.name || "Customer",
          phone: body.phone,
          alert_step: Number(body.alert_step) || 500,
          is_active: true,
          balance: "0.00",
          status: "CLEAR",
          alert_level: 0,
          last_activity_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        customers.push(newCust);

        const isSingle = req.headers.accept?.includes(
          "application/vnd.pgrst.object+json"
        );
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(isSingle ? newCust : [newCust]));
        return;
      }

      // C. PATCH (update customer)
      if (req.method === "PATCH") {
        const body = await readBody();
        const idFilter = parsedUrl.searchParams.get("id");
        if (idFilter && idFilter.startsWith("eq.")) {
          const idVal = idFilter.slice(3);
          const cust = customers.find((c) => c.id === idVal);
          if (cust) {
            if (body.name !== undefined) cust.name = body.name;
            if (body.phone !== undefined) cust.phone = body.phone;
            if (body.alert_step !== undefined)
              cust.alert_step = Number(body.alert_step);
            if (body.is_active !== undefined) cust.is_active = body.is_active;
            cust.updated_at = new Date().toISOString();

            const isSingle = req.headers.accept?.includes(
              "application/vnd.pgrst.object+json"
            );
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(isSingle ? cust : [cust]));
            return;
          }
        }
      }
    }

    // 10. RPC: create_transaction (`POST /rest/v1/rpc/create_transaction`)
    if (pathname === "/rest/v1/rpc/create_transaction" && req.method === "POST") {
      const body = await readBody();
      const customerId = body.p_customer_id;
      const type = body.p_type as "CREDIT" | "PAYMENT";
      const amountStr = body.p_amount;
      const description = body.p_description ?? null;
      const idempotencyKey = body.p_idempotency_key;
      const confirmAdvance = Boolean(body.p_confirm_advance);

      const customer = customers.find((c) => c.id === customerId);
      if (!customer) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "CUSTOMER_NOT_FOUND",
            details: null,
          })
        );
        return;
      }

      // Idempotency check: if transaction exists with this key
      const existing = transactions.find(
        (t) => t.idempotency_key === idempotencyKey
      );
      if (existing) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            replayed: true,
            transaction: {
              id: existing.id,
              type: existing.type,
              amount: existing.amount,
              description: existing.description,
              created_at: existing.created_at,
            },
            customer: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              alert_step: customer.alert_step.toFixed(2),
            },
            balance_before: null,
            balance_after: customer.balance,
            alert: null,
          })
        );
        return;
      }

      // Credit to inactive customer blocked
      if (type === "CREDIT" && !customer.is_active) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "CUSTOMER_INACTIVE",
            details: null,
          })
        );
        return;
      }

      const beforePaise = Math.round(parseFloat(customer.balance) * 100);
      const amtPaise = Math.round(parseFloat(amountStr) * 100);

      // Advance payment check
      if (type === "PAYMENT" && amtPaise > beforePaise && !confirmAdvance) {
        const advanceAfter = ((amtPaise - beforePaise) / 100).toFixed(2);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "ADVANCE_CONFIRMATION_REQUIRED",
            details: JSON.stringify({
              balance: customer.balance,
              amount: amountStr,
              advance_after: advanceAfter,
            }),
          })
        );
        return;
      }

      // Insert transaction
      const isAdvanceConfirmed = type === "PAYMENT" && amtPaise > beforePaise;
      const newTxn: MockTransaction = {
        id: crypto.randomUUID(),
        owner_id: OWNER_ID,
        customer_id: customer.id,
        customer_name: customer.name,
        type,
        amount: (amtPaise / 100).toFixed(2),
        description: description ? description.trim() : null,
        is_reversal: false,
        reversal_of: null,
        advance_confirmed: isAdvanceConfirmed,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
      };
      transactions.push(newTxn);
      updateCustomerBalance(customer);

      // Calculate alert (only if CREDIT)
      let alert = null;
      if (type === "CREDIT") {
        const alertStepPaise = customer.alert_step * 100;
        const afterPaise = Math.round(parseFloat(customer.balance) * 100);
        const levelBefore =
          beforePaise > 0 ? Math.floor(beforePaise / alertStepPaise) : 0;
        const levelAfter =
          afterPaise > 0 ? Math.floor(afterPaise / alertStepPaise) : 0;
        if (levelAfter > levelBefore) {
          alert = {
            level: levelAfter,
            crossed_amount: (levelAfter * customer.alert_step).toFixed(2),
          };
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          replayed: false,
          transaction: {
            id: newTxn.id,
            type: newTxn.type,
            amount: newTxn.amount,
            description: newTxn.description,
            created_at: newTxn.created_at,
          },
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            alert_step: customer.alert_step.toFixed(2),
          },
          balance_before: (beforePaise / 100).toFixed(2),
          balance_after: customer.balance,
          alert,
        })
      );
      return;
    }

    // 11. RPC: reverse_transaction (`POST /rest/v1/rpc/reverse_transaction`)
    if (pathname === "/rest/v1/rpc/reverse_transaction" && req.method === "POST") {
      const body = await readBody();
      const transactionId = body.p_transaction_id;
      const reason = (body.p_reason || "").trim();
      const idempotencyKey = body.p_idempotency_key;

      if (reason.length < 3 || reason.length > 140) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "VALIDATION_FAILED",
            details: null,
          })
        );
        return;
      }

      // Idempotency replay
      const existing = transactions.find(
        (t) => t.idempotency_key === idempotencyKey
      );
      if (existing) {
        const customer = customers.find((c) => c.id === existing.customer_id)!;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            replayed: true,
            original_id: existing.reversal_of,
            balance_after: customer.balance,
            reversal: {
              id: existing.id,
              type: existing.type,
              amount: existing.amount,
              description: existing.description,
              created_at: existing.created_at,
            },
          })
        );
        return;
      }

      // Find original transaction
      const original = transactions.find((t) => t.id === transactionId);
      if (!original) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "TRANSACTION_NOT_FOUND",
            details: null,
          })
        );
        return;
      }

      if (original.is_reversal) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "CANNOT_REVERSE_REVERSAL",
            details: null,
          })
        );
        return;
      }

      const alreadyReversed = transactions.some(
        (t) => t.is_reversal && t.reversal_of === original.id
      );
      if (alreadyReversed) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: "P0001",
            message: "ALREADY_REVERSED",
            details: null,
          })
        );
        return;
      }

      const customer = customers.find((c) => c.id === original.customer_id)!;
      const reversalTxn: MockTransaction = {
        id: crypto.randomUUID(),
        owner_id: OWNER_ID,
        customer_id: original.customer_id,
        customer_name: original.customer_name,
        type: original.type === "CREDIT" ? "PAYMENT" : "CREDIT",
        amount: original.amount,
        description: reason,
        is_reversal: true,
        reversal_of: original.id,
        advance_confirmed: false,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
      };
      transactions.push(reversalTxn);
      updateCustomerBalance(customer);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          replayed: false,
          original_id: original.id,
          balance_after: customer.balance,
          reversal: {
            id: reversalTxn.id,
            type: reversalTxn.type,
            amount: reversalTxn.amount,
            description: reversalTxn.description,
            created_at: reversalTxn.created_at,
          },
        })
      );
      return;
    }

    // 12. RPC: dashboard_summary (`POST /rest/v1/rpc/dashboard_summary`)
    if (
      pathname === "/rest/v1/rpc/dashboard_summary" ||
      (pathname.startsWith("/rest/v1/rpc/dashboard_summary") && req.method === "POST")
    ) {
      let totalOutstandingPaise = 0;
      let totalAdvancePaise = 0;
      let activeCount = 0;
      let alertCount = 0;

      for (const c of customers) {
        const paise = Math.round(parseFloat(c.balance) * 100);
        if (paise > 0) totalOutstandingPaise += paise;
        if (paise < 0) totalAdvancePaise += Math.abs(paise);
        if (c.is_active) activeCount++;
        if (c.status === "ALERT") alertCount++;
      }

      const todayIST = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const reversedSet = new Set(
        transactions
          .filter((t) => t.is_reversal && t.reversal_of)
          .map((t) => t.reversal_of!)
      );

      let creditTodayPaise = 0;
      let paymentsTodayPaise = 0;

      for (const t of transactions) {
        if (t.is_reversal || reversedSet.has(t.id)) continue;
        const txnDateIST = new Date(t.created_at).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
        if (txnDateIST === todayIST) {
          const amt = Math.round(parseFloat(t.amount) * 100);
          if (t.type === "CREDIT") creditTodayPaise += amt;
          if (t.type === "PAYMENT") paymentsTodayPaise += amt;
        }
      }

      const summary = {
        total_outstanding: (totalOutstandingPaise / 100).toFixed(2),
        total_advance: (totalAdvancePaise / 100).toFixed(2),
        active_customers: activeCount,
        alert_customers: alertCount,
        credit_today: (creditTodayPaise / 100).toFixed(2),
        payments_today: (paymentsTodayPaise / 100).toFixed(2),
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(summary));
      return;
    }

    // 13. Transaction Ledger View (`/rest/v1/transaction_ledger`)
    if (pathname === "/rest/v1/transaction_ledger") {
      const custIdFilter = parsedUrl.searchParams.get("customer_id");
      const custId =
        custIdFilter && custIdFilter.startsWith("eq.")
          ? custIdFilter.slice(3)
          : null;

      let entries: (MockTransaction & {
        running_balance: string;
        is_reversed: boolean;
      })[] = [];

      if (custId) {
        entries = computeCustomerRunningBalances(custId);
      } else {
        // Collect all transactions across all customers for dashboard recent entries
        for (const cust of customers) {
          entries.push(...computeCustomerRunningBalances(cust.id));
        }
      }

      // Sort newest first: created_at desc, id desc
      entries.sort((a, b) => {
        if (a.created_at !== b.created_at) {
          return b.created_at.localeCompare(a.created_at);
        }
        return b.id.localeCompare(a.id);
      });

      // Handle cursor: lt.<iso>
      const createdAtFilter = parsedUrl.searchParams.get("created_at");
      if (createdAtFilter && createdAtFilter.startsWith("lt.")) {
        const ltDate = createdAtFilter.slice(3);
        entries = entries.filter((e) => e.created_at < ltDate);
      }

      // Handle limit
      const limitParam = parsedUrl.searchParams.get("limit");
      const limit = limitParam ? parseInt(limitParam, 10) : 50;
      const result = entries.slice(0, limit);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    // 14. Other transactions endpoints fallback
    if (pathname.startsWith("/rest/v1/transactions")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([]));
      return;
    }

    // Default fallback
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  });

  return server;
}
