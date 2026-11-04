# Handoff p2-ui-to-orch-customer-screens
Type: DELIVERY
From: UI   To: ORCH   Phase: 2   Date: 2026-11-04

## What is delivered or needed
Delivered Phase 2 Task P2-T2 (Customer Screens: List, Detail, New, Edit, Duplicate ConfirmSheet):

1. **Customer List View & Page (`src/components/screens/CustomerListView.tsx`, `src/app/(app)/customers/page.tsx`)**:
   - Search input with 200ms debounce updating URL query param `?q=`.
   - Segmented filter controls for "Active", "Inactive", "All" updating URL query param `?status=`.
   - "Add customer" button linking to `/customers/new`.
   - Rendered as ruled rows (no cards, no shadows) adhering to Section 7.3:
     - Left: customer name in 18px bold, formatted phone `+91 XXXXX XXXXX`.
     - Right: balance with semantic text status cues via `BalanceLine`.
     - Entire row is pressable and navigates to `/customers/[id]`.
   - Exact Section 7.8 empty states:
     - If no customers exist: "No customers yet. Add your first customer to start recording udhaar." with "Add customer" button.
     - If search produces 0 matches: "No customer matches \"<q>\"."

2. **Add Customer Screen (`src/app/(app)/customers/new/page.tsx`, `CustomerNewForm.tsx`)**:
   - Form fields: Name (1..80 chars), Mobile number (placeholder "98765 43210"), Alert step (prefilled with default alert step from `getSettings()`, default 500).
   - Primary "Save customer" button.
   - When server action returns `DUPLICATE_PHONE`, opens `ConfirmSheet` with existing customer matches, allowing "Save anyway" (resubmitting with `confirmDuplicate: true`) or "Change number" (closing sheet and re-focusing phone field).
   - On success, redirects to `/customers/[id]` to view the created customer.

3. **Customer Details Screen (`src/app/(app)/customers/[id]/page.tsx`, `src/components/screens/CustomerDetailView.tsx`)**:
   - Header with back link `← Customers`, customer name (22px bold), "Edit" link, formatted mobile number, 32px balance hero figure (`Owes ₹X`, `Crossed ₹X` badge on `--alert-wash`, `Settled`, or `Advance ₹X`), and "Alert every ₹X".
   - Two 48px action buttons: [ Add udhaar ] and [ Add payment ].
   - When customer is inactive, "Add udhaar" is disabled and displays copy "Inactive. New udhaar is blocked."
   - [ Send WhatsApp reminder ] outline button:
     - Disabled with visible reason beneath when balance <= 0 ("Nothing is due.") or phone invalid ("Fix the mobile number to send a reminder." with link to Edit).
     - When enabled, opens `ReminderSheet` with local editable text and `buildWhatsAppUrl`.
   - Ledger section placeholder featuring the authentic double red margin rule (`.khata-margin`).
   - If customer ID is not found, calls `notFound()` rendering the Section 7.8 not-found page.

4. **Edit Customer Screen (`src/app/(app)/customers/[id]/edit/page.tsx`, `CustomerEditForm.tsx`)**:
   - Pre-fills current customer data for Name, Mobile number, and Alert step.
   - "Save customer" button with duplicate warning handling via `ConfirmSheet`.
   - Deactivate / Reactivate customer button at the bottom calling `setCustomerActiveAction`.
   - Link back to customer details.

5. **Duplicate ConfirmSheet (`src/components/screens/ConfirmSheet.tsx`)**:
   - Built on `Drawer` primitive.
   - Title: "This number is already saved for <Name>."
   - Displays ruled list of existing registered customers with name and Active/Inactive status.
   - Primary button "Save anyway" and secondary button "Change number".

6. **Reminder Drawer (`src/components/screens/ReminderSheet.tsx`)**:
   - Title "Reminder for <Name>".
   - Read-only phone, editable reminder textarea, "Open WhatsApp" link with Section 7.6.4 helper copy ("This opens WhatsApp with the message ready. Press Send in WhatsApp." -> "WhatsApp opened. Press Send there.").

## Files touched (paths)
- `src/components/screens/CustomerListView.tsx`
- `src/components/screens/CustomerDetailView.tsx`
- `src/components/screens/ConfirmSheet.tsx`
- `src/components/screens/ReminderSheet.tsx`
- `src/app/(app)/customers/page.tsx`
- `src/app/(app)/customers/new/page.tsx`
- `src/app/(app)/customers/new/CustomerNewForm.tsx`
- `src/app/(app)/customers/[id]/page.tsx`
- `src/app/(app)/customers/[id]/edit/page.tsx`
- `src/app/(app)/customers/[id]/edit/CustomerEditForm.tsx`
- `docs/agent-log/handoffs/p2-ui-to-orch-customer-screens.md`

## Contract impact
None. All components consume strict typed contracts from `src/lib/contracts/customers.ts`, `src/lib/server/customers.ts`, and `src/app/(app)/customers/actions.ts`.

## How to verify
1. Navigate to `/customers`:
   - Verify debounced search filters customer list.
   - Verify Active / Inactive / All segmented buttons update list.
   - Verify empty state messages match Section 7.8 verbatim.
2. Navigate to `/customers/new`:
   - Enter details. Test duplicate phone to verify `ConfirmSheet` opens with "Save anyway" and "Change number".
   - Save customer and verify navigation to `/customers/[id]`.
3. Navigate to `/customers/[id]`:
   - Verify 32px balance display, formatted phone, alert step line.
   - Verify "Add udhaar" and "Add payment" buttons.
   - Verify "Send WhatsApp reminder" states ("Nothing is due.", "Fix the mobile number to send a reminder.").
4. Navigate to `/customers/[id]/edit`:
   - Update fields and verify persistence.
   - Test "Deactivate customer" and "Reactivate customer" toggles.

## Known limits
- Ledger entries in customer detail will be fully expanded in Phase 3.

## Blocking question
None.
