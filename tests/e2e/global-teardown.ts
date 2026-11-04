export default async function globalTeardown() {
  const server = (globalThis as any).__MOCK_SUPABASE_SERVER__;
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}
