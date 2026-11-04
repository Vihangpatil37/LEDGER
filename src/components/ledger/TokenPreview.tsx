import React from "react";

export function TokenPreview() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <header className="border-b border-[var(--rule)] pb-4">
        <h1 className="text-[22px] font-bold leading-tight">Chai Ledger — Design System Tokens</h1>
        <p className="text-[14px] text-[var(--ink-soft)] mt-1">
          Strict verification of tokens, typography, radii, and khata ledger aesthetic.
        </p>
      </header>

      {/* Palette Swatches */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-bold">1. Color Tokens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--paper</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#F1F3EE</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--sheet</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#FFFFFF</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--ink)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--ink</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#17212B</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--ink-soft)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--ink-soft</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#4A5866</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--rule)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--rule</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#C9D3DA</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--rule-margin)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--rule-margin</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#B84A42</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--owed)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--owed</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#A3261F</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--paid)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--paid</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#1F6B4A</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--alert-wash)] border border-[var(--alert-ink)] rounded-[var(--radius-chip)] mb-2 flex items-center justify-center">
              <span className="text-[14px] font-bold text-[var(--alert-ink)]">Alert text</span>
            </div>
            <p className="text-[14px] font-bold">--alert-ink / wash</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#8A5A00 / #FBEFD0</p>
          </div>
          <div className="p-3 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
            <div className="h-10 w-full bg-[var(--focus)] rounded-[var(--radius-chip)] mb-2" />
            <p className="text-[14px] font-bold">--focus</p>
            <p className="text-[14px] text-[var(--ink-soft)]">#2457C5</p>
          </div>
        </div>
      </section>

      {/* Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-bold">2. Atkinson Hyperlegible Typography Scale</h2>
        <div className="p-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)] space-y-3">
          <div>
            <span className="text-[14px] text-[var(--ink-soft)] block">32px Hero / Balance / Amount Input</span>
            <p className="text-[32px] font-bold tabular-nums text-[var(--owed)]">₹1,150.00</p>
          </div>
          <div className="border-t border-[var(--rule)] pt-2">
            <span className="text-[14px] text-[var(--ink-soft)] block">22px Screen Title</span>
            <p className="text-[22px] font-bold">Add udhaar entry</p>
          </div>
          <div className="border-t border-[var(--rule)] pt-2">
            <span className="text-[14px] text-[var(--ink-soft)] block">18px List Name & Wordmark</span>
            <p className="text-[18px] font-bold">Rahul Patel</p>
          </div>
          <div className="border-t border-[var(--rule)] pt-2">
            <span className="text-[14px] text-[var(--ink-soft)] block">16px Body Copy (Minimum for inputs)</span>
            <p className="text-[16px]">Fast, single-owner udhaar credit recording for tea stalls.</p>
          </div>
          <div className="border-t border-[var(--rule)] pt-2">
            <span className="text-[14px] text-[var(--ink-soft)] block">14px Meta Text & Timestamps</span>
            <p className="text-[14px] text-[var(--ink-soft)] tabular-nums">4 Nov, 6:42 pm IST</p>
          </div>
        </div>
      </section>

      {/* Tabular Numerals Verification */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-bold">3. Tabular Numerals Alignment Verification</h2>
        <div className="p-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-control)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--rule)] text-[14px] text-[var(--ink-soft)]">
                <th className="py-2">Customer</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
                <th className="py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)] tabular-nums">
              <tr>
                <td className="py-2 font-bold">Amit Shah</td>
                <td className="py-2 text-right text-[var(--owed)]">₹1,000.00</td>
                <td className="py-2 text-right">—</td>
                <td className="py-2 text-right font-bold text-[var(--owed)]">₹1,000.00</td>
              </tr>
              <tr>
                <td className="py-2 font-bold">Jay Mehta</td>
                <td className="py-2 text-right">—</td>
                <td className="py-2 text-right text-[var(--paid)]">₹500.00</td>
                <td className="py-2 text-right font-bold text-[var(--paid)]">₹500.00</td>
              </tr>
              <tr>
                <td className="py-2 font-bold">Ramesh Bhai</td>
                <td className="py-2 text-right text-[var(--owed)]">₹50.00</td>
                <td className="py-2 text-right">—</td>
                <td className="py-2 text-right font-bold text-[var(--owed)]">₹550.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Khata Ledger Memorable Component Preview */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-bold">4. Khata Ledger Sheet (Double Margin Rule)</h2>
        <div className="bg-[var(--sheet)] border border-[var(--rule)] shadow-sm">
          {/* Day Header */}
          <div className="bg-[var(--paper)] px-4 py-1.5 border-b border-[var(--rule)] text-[14px] font-bold text-[var(--ink-soft)]">
            Today
          </div>

          {/* Ledger Sheet with Khata Margin */}
          <div className="khata-margin divide-y divide-[var(--rule)]">
            <div className="py-3 pr-4 flex items-center justify-between">
              <div>
                <span className="text-[14px] text-[var(--ink-soft)] block tabular-nums">6:42 pm</span>
                <span className="text-[16px] font-bold">Chai</span>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-[16px] font-bold text-[var(--owed)] block">Udhaar ₹50</span>
                <span className="text-[14px] text-[var(--ink-soft)]">Balance ₹1,150</span>
              </div>
            </div>

            <div className="py-3 pr-4 flex items-center justify-between">
              <div>
                <span className="text-[14px] text-[var(--ink-soft)] block tabular-nums">4:10 pm</span>
                <span className="text-[16px] font-bold">Payment</span>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-[16px] font-bold text-[var(--paid)] block">Paid ₹200</span>
                <span className="text-[14px] text-[var(--ink-soft)]">Balance ₹1,100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Touch Target & Radii Controls */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-bold">5. Radii & Touch Target (≥ 48px)</h2>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[14px] text-[var(--ink-soft)] w-full">Quick-add chips (--radius-chip: 6px, 44px min height):</span>
            <button type="button" className="chip-target px-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-chip)] font-bold tabular-nums">
              +10
            </button>
            <button type="button" className="chip-target px-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-chip)] font-bold tabular-nums">
              +20
            </button>
            <button type="button" className="chip-target px-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-chip)] font-bold tabular-nums">
              +50
            </button>
            <button type="button" className="chip-target px-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-chip)] font-bold tabular-nums">
              +100
            </button>
            <button type="button" className="chip-target px-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[var(--radius-chip)] text-[var(--ink-soft)]">
              Clear
            </button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <span className="text-[14px] text-[var(--ink-soft)] w-full">Buttons (--radius-control: 10px, 48px min height):</span>
            <button type="button" className="tap-target px-6 bg-[var(--owed)] text-white font-bold rounded-[var(--radius-control)]">
              Save udhaar
            </button>
            <button type="button" className="tap-target px-6 bg-[var(--paid)] text-white font-bold rounded-[var(--radius-control)]">
              Save payment
            </button>
            <button type="button" className="tap-target px-6 bg-[var(--ink)] text-white font-bold rounded-[var(--radius-control)]">
              Log in
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
