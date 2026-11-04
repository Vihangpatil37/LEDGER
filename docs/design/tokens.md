# Chai Ledger Design Tokens & Foundations

**Status:** Locked per `CHAI_LEDGER_MULTI_AGENT_SPEC.md` (Sections 7.1, 7.2, 7.3).  
**Owner:** `DSYS` (Design System Engineer)  
**Last Updated:** 2026-11-04  

---

## 1. Design Intent & Philosophy

Chai Ledger is a single-owner Udhaar (customer credit) web application engineered specifically for a tea-stall owner operating with one hand, on a mobile phone, in bright ambient daylight, completing entries in 10 to 15 seconds.

It is modeled after a traditional Indian **khata (physical ledger book)** turned into software:
- Crisp, ruled lines separating entries.
- Purposeful ink colors with clear functional semantics.
- Tabular alignment ensuring digits and decimal places align vertically.
- Boldness focused in **one place: the customer ledger** (double vertical margin rule, ruled rows, and running balance).
- Quiet, plain, and fast everywhere else.

---

## 2. Color Tokens

All color variables are defined on `:root` in `src/styles/globals.css`. The application strictly operates in **light mode** (no dark mode).

| Token | Hex Value | Role & Usage Description |
|---|---|---|
| `--paper` | `#F1F3EE` | Page background tone; cool newsprint paper finish |
| `--sheet` | `#FFFFFF` | Ledger pages, inputs, cards/containers, bottom sheets |
| `--ink` | `#17212B` | Primary body text, primary button fill and borders |
| `--ink-soft` | `#4A5866` | Secondary text, timestamps, running balance labels, meta hints |
| `--rule` | `#C9D3DA` | Hairlines between ledger rows, dividers, borders |
| `--rule-margin` | `#B84A42` | The traditional khata margin double-rule only (red ink) |
| `--owed` | `#A3261F` | Udhaar amounts, money owed, "Add udhaar" action button |
| `--paid` | `#1F6B4A` | Payment amounts, advance payments, "Add payment" action button |
| `--alert-ink` | `#8A5A00` | Alert text, warning messages when alert step is crossed |
| `--alert-wash` | `#FBEFD0` | Alert row background, alert banner tint |
| `--focus` | `#2457C5` | High-visibility focus ring outline for accessibility |

### Crucial Semantic Rule for Money Colors
`--owed` and `--paid` must **never** be used to convey information through color alone. Every money figure must always be accompanied by a sign or word cue:
- Udhaar / Owed: e.g., `"Udhaar ₹50"` or `"Owes ₹1,150"`
- Paid / Advance: e.g., `"Paid ₹200"` or `"Advance ₹200"`
- Settled: `"Settled"` in `--ink-soft`

---

## 3. WCAG 2.1 Contrast Ratio Verification

WCAG 2.1 Level AA requires a minimum contrast ratio of **4.5:1** for standard text (< 18pt or < 14pt bold) and **3.0:1** for large text or UI components. All Chai Ledger text tokens exceed 4.5:1 on both `--sheet` (`#FFFFFF`) and `--paper` (`#F1F3EE`).

### Contrast Ratios on `--sheet` (`#FFFFFF`, Lum: 1.000)

| Token | Hex | Text Role | Contrast Ratio | WCAG AA (> 4.5:1) | WCAG AAA (> 7.0:1) |
|---|---|---|---|---|---|
| `--ink` | `#17212B` | Primary text | **16.29:1** | PASS | PASS |
| `--ink-soft` | `#4A5866` | Secondary meta text | **7.29:1** | PASS | PASS |
| `--owed` | `#A3261F` | Udhaar amount | **7.36:1** | PASS | PASS |
| `--paid` | `#1F6B4A` | Payment amount | **6.44:1** | PASS | (Large/Bold: PASS) |
| `--alert-ink` | `#8A5A00` | Alert notice | **5.93:1** | PASS | (Large/Bold: PASS) |

### Contrast Ratios on `--paper` (`#F1F3EE`, Lum: 0.887)

| Token | Hex | Text Role | Contrast Ratio | WCAG AA (> 4.5:1) | WCAG AAA (> 7.0:1) |
|---|---|---|---|---|---|
| `--ink` | `#17212B` | Primary text | **14.58:1** | PASS | PASS |
| `--ink-soft` | `#4A5866` | Secondary meta text | **6.53:1** | PASS | (Large/Bold: PASS) |
| `--owed` | `#A3261F` | Udhaar amount | **6.58:1** | PASS | (Large/Bold: PASS) |
| `--paid` | `#1F6B4A` | Payment amount | **5.76:1** | PASS | (Large/Bold: PASS) |
| `--alert-ink` | `#8A5A00` | Alert notice | **5.30:1** | PASS | (Large/Bold: PASS) |

### Contrast Ratios on Alert Wash (`#FBEFD0`, Lum: 0.865)

| Token | Hex | Text Role | Contrast Ratio | WCAG AA (> 4.5:1) |
|---|---|---|---|---|
| `--alert-ink` | `#8A5A00` | Alert message text | **5.18:1** | PASS |
| `--ink` | `#17212B` | Customer name in alert row | **14.24:1** | PASS |

### White Text (`#FFFFFF`) on Solid Button Fills

| Fill Token | Hex | Button Type | Contrast Ratio | WCAG AA (> 4.5:1) |
|---|---|---|---|---|
| `--ink` | `#17212B` | Primary Save / Nav fill | **16.29:1** | PASS |
| `--owed` | `#A3261F` | "Add udhaar" / "Save udhaar" | **7.36:1** | PASS |
| `--paid` | `#1F6B4A` | "Add payment" / "Save payment" | **6.44:1** | PASS |
| `--focus` | `#2457C5` | Focused state / outline | **6.47:1** | PASS |

---

## 4. Radii System

Radius values are strictly bounded by component role. Radii are not arbitrary.

| Token | Value | Applied To | Disallowed On |
|---|---|---|---|
| `--radius-chip` | `6px` | Amount quick-add chips (`+10`, `+50`), Note chips (`Chai`, `Paan`) | Buttons, Sheets, Ledger rows |
| `--radius-control` | `10px` | Form inputs, buttons, segmented controls, dropdown triggers | Chips, Sheets, Ledger rows |
| `--radius-sheet` | `20px` | Top-left and top-right corners of bottom sheets (`Drawer`) only | Standard cards, dialogs, buttons |
| *None* | `0px` | **Ledger rows, table rows, lists, search result lists** | *Never apply radius to rows* |

---

## 5. Touch Target & Spacing Scale

### Touch Target Floor
- `--tap: 48px`: The absolute minimum height and width for all interactive elements (buttons, inputs, bottom navigation tabs, chips, quick action targets).
- Primary mobile action buttons (`Save udhaar`, `Save payment`, customer selection button) use **56px** height for fast, error-free single-handed thumb tapping.

### Spacing Scale
Spacing follows an intentional arithmetic cadence:
- `4px` (`0.25rem`) - Chip gaps, inline icon padding
- `8px` (`0.5rem`) - Compact row padding, chip container spacing
- `12px` (`0.75rem`) - Standard cell padding, margin rule offset (12px from edge)
- `16px` (`1.0rem`) - Screen side margins, form control gaps
- `24px` (`1.5rem`) - Section separation
- `32px` (`2.0rem`) - Screen header spacing, major block separation

---

## 6. Typography System

### Typeface
- **Family:** Atkinson Hyperlegible (via `next/font/google`).
- **Weights:** `400` (Regular) and `700` (Bold) only. No other weights are loaded or used.
- **Why Atkinson Hyperlegible:** Specifically designed for low-vision readers and high legibility of unambiguous digits (`0` vs `O`, `1` vs `I` vs `l`, `8` vs `B`) under harsh glare or small screens.
- **Monospace Banned:** Do not use monospace fonts anywhere.

### Tabular Numerals
- `font-variant-numeric: tabular-nums` must be applied to **every** currency amount, balance, transaction figure, date digit, and phone number. This prevents jitter and ensures decimal places align like a physical ledger.

### Type Scale
| Size | Weight | Usage |
|---|---|---|
| `14px` | Regular (`400`) / Bold (`700`) | Meta text, timestamps, day headers (`Today`, `Yesterday`), running balance |
| `16px` | Regular (`400`) | Standard body copy, form input text (prevents iOS auto-zoom on focus) |
| `18px` | Bold (`700`) | List names, wordmark "Chai Ledger" |
| `22px` | Bold (`700`) | Screen titles, sheet headers |
| `32px` | Bold (`700`) | Amount input field (`₹50`), hero customer balance figure (`₹1,150`) |

### Editorial Rules
- **Sentence case everywhere:** (e.g., "Add customer", "Save udhaar", "Payment is more than the balance"). No ALL CAPS, no Title Case.
- **Line length:** Maintained under 70 characters for rapid scanning.

---

## 7. Khata Ledger Specification

The customer ledger (`src/components/ledger/LedgerList.tsx`) is the single memorable element:
1. **Double Margin Rule:** Two vertical `1px` lines of `--rule-margin` (`#B84A42`), spaced `3px` apart, inset `12px` from the left edge of the white `--sheet`.
2. **Hairlines:** Single `1px` horizontal lines of `--rule` (`#C9D3DA`) separating consecutive entries.
3. **Day Headers:** Inset day labels ("Today", "Yesterday", "4 Nov") in `14px` bold `--ink-soft` on `--paper`.
4. **Row Composition:**
   - Left: Time (`14px`) and Note (`16px`).
   - Right: Transaction amount (`Udhaar ₹50` in `--owed` or `Paid ₹200` in `--paid`), right-aligned, with running balance (`14px` `--ink-soft`) directly below it.

---

## 8. Motion & Micro-Interactions

Motion budget is strictly limited to intentional user-action feedback:
1. **Bottom Sheet Slide:** `150ms ease-out` translateY on drawer open/dismiss.
2. **Button Press Feedback:** `transform: scale(0.98)` on `:active`, transitioning over `100ms`.
3. **Balance Figure Update:** In-place replacement on result sheet (`150ms` opacity transition).

### Prohibitions & Accessibility
- **No decorative motion:** No page-load animations, no staggered entrance fades, no scroll-triggered reveals, no hover lifts on rows.
- **Prefers-reduced-motion:** When `prefers-reduced-motion: reduce` is detected, all transitions and animations are set to `0ms !important`.

---

## 9. Focus & Accessibility Controls

- **Focus Ring:** Every interactive element when focused via keyboard receives an explicit focus outline:
  ```css
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  ```
- **Form Error Announcements:** All inline validation errors use `role="alert"` and link to inputs via `aria-describedby`.
- **Language & Region:** `<html lang="en-IN">` with Indian numbering formats (`₹1,00,000`).

---

## 10. The 12 Banned Patterns (Section 7.3)

QA strictly checks against these 12 patterns:

1. **Gradient fills or gradient text anywhere:** All fills and text colors are flat solid tokens.
2. **Rows of identical rounded cards with shadows:** Lists must be ruled rows on a clean sheet, not card grids.
3. **ALL CAPS labels, tracked-out eyebrow labels, numbered markers (01, 02), or "WORD — fragment" labels:** All UI text is plain sentence case.
4. **Single accented word inside a heading:** Headings are rendered uniformly in `--ink`.
5. **Emoji as UI icons:** Emoji are banned in the interface. The `🙏` emoji appears exclusively inside the Hinglish WhatsApp reminder text.
6. **Colored circle avatars with initials:** Never render circular initial badges; display the customer name plainly.
7. **Metadata strings joined with middle dots ("A · B · C"):** Use separate ruled lines or clean definition lists.
8. **Hero banners, illustrations, stock icon grids, or decorative blobs:** The app is a working tool, not a landing page.
9. **Fade-and-slide-in on sections or hover lifts on rows:** Micro-interactions are restricted to press feedback and sheet slides.
10. **Toasts for money results:** Financial results must use the modal `ResultSheet` (Section 7.6.4).
11. **Generic SaaS copy:** Never write "Welcome back!", "Oops!", "Something went wrong", or "Submit". Copy must strictly follow Section 7.8.
12. **Default shadcn zinc look, default `Card`, or `rounded-xl` on everything:** All primitives are restyled to the Chai Ledger tokens.
