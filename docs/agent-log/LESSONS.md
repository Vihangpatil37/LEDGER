# Shared Lessons Log

Format: `YYYY-MM-DD | <agent> | <area> | Symptom -> Cause -> Rule to follow next time`

2026-11-04 | ORCH | env | pnpm not in default PATH -> global install via npm required -> pnpm pinned at 12.16.1
2026-11-04 | API | scaffold | pnpm v12 ERR_PNPM_IGNORED_BUILDS -> pnpm v12 blocks lifecycle scripts by default -> run pnpm approve-builds --all or configure allowBuilds in pnpm-workspace.yaml
2026-11-04 | API | scaffold | Pinned dependencies in package.json: next@15.1.7, react@19.0.0, vitest@3.0.5, @supabase/supabase-js@2.49.1, @supabase/ssr@0.5.2, tailwindcss@3.4.17
2026-11-04 | UI | types | CustomerDetailView accessed entry.balanceAfter -> LedgerEntry contract names running balance runningBalance -> Check Section 6.3 contracts before referencing transaction balance fields

