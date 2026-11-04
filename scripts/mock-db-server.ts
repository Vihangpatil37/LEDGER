import { createMockSupabaseServer } from "../tests/e2e/mock-supabase";

const PORT = 54321;
const HOST = "127.0.0.1";

const server = createMockSupabaseServer();
server.listen(PORT, HOST, () => {
  console.log(`[Mock Supabase Server] Listening on http://${HOST}:${PORT}`);
  console.log(`[Mock Supabase Server] Owner email: owner@chailedger.local`);
  console.log(`[Mock Supabase Server] Password: password123`);
});
