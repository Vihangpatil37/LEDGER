import { describe, expect, it } from "vitest";
import { dayLabelIST, formatIST } from "@/lib/ist";

describe("IST Library", () => {
  describe("IST-01: Midnight rollover and calendar day comparison", () => {
    // 18:30 UTC is exactly 00:00 (midnight) in IST (+05:30).
    // Given a reference "now" on 4 Nov 2026 (e.g. 10:00 AM IST / 04:30 UTC):
    const nowNov4 = new Date("2026-11-04T04:30:00Z");

    it("evaluates 18:29 UTC on 3 Nov as Yesterday in IST (23:59 IST on 3 Nov)", () => {
      const instantBeforeMidnight = new Date("2026-11-03T18:29:00Z");
      expect(dayLabelIST(instantBeforeMidnight, nowNov4)).toBe("Yesterday");
    });

    it("evaluates 18:31 UTC on 3 Nov as Today in IST (00:01 IST on 4 Nov)", () => {
      const instantAfterMidnight = new Date("2026-11-03T18:31:00Z");
      expect(dayLabelIST(instantAfterMidnight, nowNov4)).toBe("Today");
    });

    it("evaluates 18:29 UTC on 3 Nov as Today if reference now is also on 3 Nov IST", () => {
      const nowNov3 = new Date("2026-11-03T18:29:30Z");
      const instantNov3 = new Date("2026-11-03T18:29:00Z");
      expect(dayLabelIST(instantNov3, nowNov3)).toBe("Today");
    });
  });

  describe("formatIST outputs", () => {
    // 2026-11-04T13:12:00Z + 5h30m = 2026-11-04 18:42:00 IST -> 6:42 pm
    const sample = new Date("2026-11-04T13:12:00Z");
    const refSameYear = new Date("2026-11-04T13:12:00Z");

    it("formats time as 6:42 pm", () => {
      expect(formatIST(sample, "time")).toBe("6:42 pm");
    });

    it("formats date as 4 Nov for current IST year", () => {
      expect(formatIST(sample, "date", refSameYear)).toBe("4 Nov");
    });

    it("formats datetime as 4 Nov, 6:42 pm", () => {
      expect(formatIST(sample, "datetime", refSameYear)).toBe("4 Nov, 6:42 pm");
    });

    it("includes year when not the current IST year", () => {
      const lastYear = new Date("2025-11-04T13:12:00Z");
      expect(formatIST(lastYear, "date", refSameYear)).toBe("4 Nov 2025");
      expect(formatIST(lastYear, "datetime", refSameYear)).toBe("4 Nov 2025, 6:42 pm");
    });
  });
});
