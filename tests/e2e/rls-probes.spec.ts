import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

/**
 * Security & RLS Probes Test Suite
 * Spec reference: D:\Personal\home\CHAI_LEDGER_MULTI_AGENT_SPEC.md Sections 5.2, 5.5, 5.6, 9.2 (RLS-*), 9.4
 *
 * Test cases:
 * - RLS-01: Anonymous role cannot select any table, view or call any RPC.
 * - RLS-02: Public signup is rejected (enable_signup = false, D-10).
 * - RLS-03: PostgREST tables and views anonymous probes (profiles, customers, transactions, customer_balances, transaction_ledger).
 * - RLS-04: Anonymous RPC probe: create_transaction rejected.
 * - RLS-05: Anonymous RPC probe: reverse_transaction rejected.
 * - RLS-06: Anonymous RPC probe: dashboard_summary rejected.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A_9tQ0f_m_cI7_V-oYq9p5_N-QkLqE7vT4wW7E";

/**
 * Helper to check if Supabase service is reachable at SUPABASE_URL
 */
async function checkSupabaseReachability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    return res !== null && (res.status === 200 || res.status === 404);
  } catch {
    return false;
  }
}

test.describe("Security & RLS Probes (RLS-*)", () => {
  let isSupabaseOnline = false;

  test.beforeAll(async () => {
    isSupabaseOnline = await checkSupabaseReachability();
  });

  test.describe("Static Security Invariants (Config & Migration Audits)", () => {
    test("RLS-01: verify 0005_grants.sql revokes all table and function permissions from anon", async () => {
      const grantsPath = path.resolve(
        process.cwd(),
        "supabase/migrations/0005_grants.sql"
      );
      expect(fs.existsSync(grantsPath)).toBe(true);

      const content = fs.readFileSync(grantsPath, "utf-8");

      // Verify anon table revocations
      expect(content).toContain(
        "revoke all on all tables in schema public from anon;"
      );

      // Verify anon RPC revocations
      expect(content).toMatch(
        /revoke execute on function public\.create_transaction/
      );
      expect(content).toMatch(
        /revoke execute on function public\.reverse_transaction/
      );
      expect(content).toMatch(
        /revoke execute on function public\.dashboard_summary/
      );
    });

    test("RLS-01: verify 0002_rls.sql enables Row Level Security on all core tables", async () => {
      const rlsPath = path.resolve(
        process.cwd(),
        "supabase/migrations/0002_rls.sql"
      );
      expect(fs.existsSync(rlsPath)).toBe(true);

      const content = fs.readFileSync(rlsPath, "utf-8");

      expect(content).toContain(
        "alter table public.profiles     enable row level security;"
      );
      expect(content).toContain(
        "alter table public.customers    enable row level security;"
      );
      expect(content).toContain(
        "alter table public.transactions enable row level security;"
      );

      // Verify no direct write policy exists for transactions
      expect(content).not.toMatch(/create policy.*insert.*on public\.transactions/i);
      expect(content).not.toMatch(/create policy.*update.*on public\.transactions/i);
      expect(content).not.toMatch(/create policy.*delete.*on public\.transactions/i);
    });

    test("RLS-02: verify supabase/config.toml strictly disables public signup", async () => {
      const configPath = path.resolve(
        process.cwd(),
        "supabase/config.toml"
      );
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, "utf-8");

      // D-10: Public signup is disabled
      expect(content).toMatch(/\[auth\][\s\S]*enable_signup\s*=\s*false/);
    });
  });

  test.describe("PostgREST Anonymous Table & View Probes", () => {
    const resources = [
      "profiles",
      "customers",
      "transactions",
      "customer_balances",
      "transaction_ledger",
    ];

    for (const resource of resources) {
      test(`RLS-03: direct anonymous GET /rest/v1/${resource} is denied or returns 0 rows`, async () => {
        if (!isSupabaseOnline) {
          test.skip(
            true,
            `Supabase server offline at ${SUPABASE_URL}; static audit validated. Skipping live probe.`
          );
          return;
        }

        const endpoint = `${SUPABASE_URL}/rest/v1/${resource}?select=*`;
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        // Due to Migration 0005: "revoke all on all tables in schema public from anon",
        // PostgREST typically returns HTTP 401 Unauthorized, 403 Forbidden,
        // or an empty array [] if RLS hides all rows.
        if (res.status === 200) {
          const body = await res.json();
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBe(0);
        } else {
          expect([401, 403, 404]).toContain(res.status);
        }
      });
    }
  });

  test.describe("Anonymous RPC Execution Probes", () => {
    test("RLS-04: anonymous POST /rest/v1/rpc/create_transaction is rejected", async () => {
      if (!isSupabaseOnline) {
        test.skip(
          true,
          `Supabase server offline at ${SUPABASE_URL}; static audit validated. Skipping live probe.`
        );
        return;
      }

      const endpoint = `${SUPABASE_URL}/rest/v1/rpc/create_transaction`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_customer_id: "10000000-0000-0000-0000-000000000001",
          p_type: "CREDIT",
          p_amount: "50.00",
          p_note: "Probe attempt",
          p_idempotency_key: "00000000-0000-0000-0000-000000000099",
          p_confirm_advance: false,
        }),
      });

      // Must be rejected (401, 403, or 404)
      expect([401, 403, 404]).toContain(res.status);
    });

    test("RLS-05: anonymous POST /rest/v1/rpc/reverse_transaction is rejected", async () => {
      if (!isSupabaseOnline) {
        test.skip(
          true,
          `Supabase server offline at ${SUPABASE_URL}; static audit validated. Skipping live probe.`
        );
        return;
      }

      const endpoint = `${SUPABASE_URL}/rest/v1/rpc/reverse_transaction`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_original_id: "20000000-0000-0000-0000-000000000001",
          p_reason: "Illegal anonymous reversal",
          p_idempotency_key: "00000000-0000-0000-0000-000000000098",
        }),
      });

      expect([401, 403, 404]).toContain(res.status);
    });

    test("RLS-06: anonymous POST /rest/v1/rpc/dashboard_summary is rejected", async () => {
      if (!isSupabaseOnline) {
        test.skip(
          true,
          `Supabase server offline at ${SUPABASE_URL}; static audit validated. Skipping live probe.`
        );
        return;
      }

      const endpoint = `${SUPABASE_URL}/rest/v1/rpc/dashboard_summary`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      });

      expect([401, 403, 404]).toContain(res.status);
    });
  });

  test.describe("Supabase JS Client Security Probes", () => {
    test("RLS-01: supabase client with anon key cannot read private customer records", async () => {
      if (!isSupabaseOnline) {
        test.skip(
          true,
          `Supabase server offline at ${SUPABASE_URL}; static audit validated. Skipping live probe.`
        );
        return;
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase.from("customers").select("*");

      // Either PostgREST returns a permission denied error, or RLS returns an empty list
      if (error) {
        expect(error.message).toBeTruthy();
      } else {
        expect(data).toHaveLength(0);
      }
    });

    test("RLS-02: public signup attempt via Supabase client is rejected", async () => {
      if (!isSupabaseOnline) {
        test.skip(
          true,
          `Supabase server offline at ${SUPABASE_URL}; static audit validated. Skipping live probe.`
        );
        return;
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase.auth.signUp({
        email: "unauthorized_signup_probe@chailedger.test",
        password: "HackerPassword123!",
      });

      // When enable_signup = false, Supabase Auth must return an error (or user/session is null)
      // and must never establish an active session
      expect(data.session).toBeNull();
      expect(
        error !== null || data.user === null || data.user?.identities?.length === 0
      ).toBe(true);

      if (error) {
        expect(error.message.toLowerCase()).toMatch(
          /signup|disabled|not allowed|closed|forbidden|user already registered/i
        );
      }
    });
  });
});
