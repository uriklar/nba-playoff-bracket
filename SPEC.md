# Feature Spec: Group Identity, Payment Instructions & Payment Tracking

## Resolved Design Decisions

| Decision | Resolution |
|---|---|
| Authentication | None. Name-based identity via localStorage |
| Admin identity | Plain `admin_secret` column on `groups` table, set at creation time, stored in localStorage |
| Payment instructions format | Plain text (textarea) |
| Payment instructions timing | Editable anytime by admin (not just at creation) |
| Admin UI location | Inline on scoreboard page, visible when admin secret matches |
| Payment banner location | Top of every group page (GroupLayout level) |
| Payment banner visibility | Hidden if visitor's participant_name (from localStorage) is marked as paid |
| Participant identity | Stored in localStorage per group on bracket submission |
| Storage | Single localStorage key with JSON keyed by group ID |
| Admin secret storage | Plain text on groups table, verified client-side via Supabase RLS |

## localStorage Schema

Key: `nba_bracket_data`

```json
{
  "<group-id>": {
    "admin_secret": "string (only for creator)",
    "participant_name": "string (set on bracket submission)"
  }
}
```

---

## Feature 1: Show Group Name in Navigation

### Summary
Display the group name in the `GroupNav` bar so users always know which group they're in.

### Database Changes
None.

### Tasks

**1.1 — Fetch group data in GroupLayout and pass to GroupNav**

Currently `GroupNav` only reads `groupId` from URL params. `GroupLayout` needs to fetch the group via `getGroupById(groupId)` and pass the group object (or at minimum the name) to `GroupNav` as a prop.

Files: `src/App.tsx`

**1.2 — Display group name in GroupNav**

Add the group name to the nav bar, next to or near the logo. Should handle the loading state (before group data arrives) gracefully — either show nothing or a skeleton placeholder.

Files: `src/App.tsx`

---

## Feature 2: Admin Secret & Creator Identity

### Summary
When a user creates a group, generate a secret token, store it on the group row, and save it in the creator's localStorage. This secret is used to prove admin status for all subsequent admin actions.

### Database Changes

**`groups` table — add column:**
- `admin_secret` (text, not null, generated at creation time)

### Tasks

**2.1 — Generate and store admin secret on group creation**

Modify `createGroup()` in `src/utils/db.ts` to:
1. Generate a random secret (e.g., 32-char hex string)
2. Include `admin_secret` in the insert payload
3. Return the secret as part of the created group data

Update the `Group` interface to include `admin_secret` (nullable on reads — see 2.3).

Files: `src/utils/db.ts`

**2.2 — Store admin secret in localStorage after group creation**

After `createGroup()` succeeds on the landing page, write the admin secret and group ID to localStorage under the `nba_bracket_data` key.

Files: `src/pages/LandingPage.tsx`

**2.3 — Create localStorage helper utilities**

Create a small utility module for reading/writing the localStorage data:
- `getGroupLocalData(groupId): { admin_secret?: string, participant_name?: string }`
- `setAdminSecret(groupId, secret): void`
- `setParticipantName(groupId, name): void`
- `getAdminSecret(groupId): string | null`
- `getParticipantName(groupId): string | null`

Files: `src/utils/localStorage.ts` (new)

**2.4 — Supabase RLS: restrict admin_secret from reads**

The `admin_secret` column should NOT be returned on normal `select` queries. Two approaches:
- Use a Supabase database function for group creation that returns the secret, but normal selects exclude it
- Or: rely on explicit `.select('id, name, join_code, created_at')` in read queries (exclude `admin_secret` from selects)

The simpler approach: just don't select `admin_secret` in read queries (`getGroupById`, `getGroupByJoinCode`). Only the `createGroup` response includes it.

Files: `src/utils/db.ts`

---

## Feature 3: Payment Instructions

### Summary
The group admin can set/edit plain-text payment instructions. These are stored on the group row and displayed as a banner to unpaid participants.

### Database Changes

**`groups` table — add column:**
- `payment_instructions` (text, nullable, default null)

### Tasks

**3.1 — Add payment instructions update function**

Create a function to update payment instructions, requiring the admin secret for verification:

```
updatePaymentInstructions(groupId, adminSecret, instructions): Promise<boolean>
```

This calls Supabase to update `groups.payment_instructions` where `id = groupId AND admin_secret = adminSecret`. If no rows match, the secret was wrong.

Files: `src/utils/db.ts`

**3.2 — Admin UI: payment instructions editor on scoreboard**

When the visitor has a matching admin secret in localStorage for the current group, show an "Admin Settings" section on the scoreboard page. Contains:
- A textarea showing current payment instructions (or empty)
- A save button
- Success/error feedback

Only visible to the admin.

Files: `src/components/ScoreboardPage.tsx` (or extract a new `AdminPanel.tsx` component)

**3.3 — Payment banner component**

Create a `PaymentBanner` component that:
1. Receives `paymentInstructions` (string | null) and `isPaid` (boolean) as props
2. If `paymentInstructions` is null/empty OR `isPaid` is true, renders nothing
3. Otherwise, renders a prominent banner with the payment instructions text
4. Banner is dismissable per session (sessionStorage flag), similar to ScoringInfo

Files: `src/components/PaymentBanner.tsx` (new)

**3.4 — Integrate PaymentBanner into GroupLayout**

Add the `PaymentBanner` above the `<Routes>` in `GroupLayout` so it appears on every group page. GroupLayout needs to:
1. Fetch the group data (reuse from Feature 1 work)
2. Read participant_name from localStorage
3. Check payment status for that participant (from Feature 4)
4. Pass `paymentInstructions` and `isPaid` to the banner

Files: `src/App.tsx`

---

## Feature 4: Payment Tracking

### Summary
The admin can mark participants as paid/unpaid. Paid participants don't see the payment banner.

### Database Changes

**New table: `group_payments`**
- `id` (uuid, primary key, default gen_random_uuid())
- `group_id` (uuid, not null, references groups.id)
- `participant_name` (text, not null)
- `paid` (boolean, not null, default false)
- `updated_at` (timestamptz, default now())
- Unique constraint on `(group_id, participant_name)`

**RLS policy considerations:**
- Anyone can read payment status (needed to check banner visibility)
- Writes require admin secret verification — either via RLS function or by including admin_secret in the request and matching against groups table

### Tasks

**4.1 — Create group_payments table in Supabase**

Run the migration to create the table with the schema above. Add appropriate indexes on `group_id`.

**4.2 — Payment status DB functions**

Add to `src/utils/db.ts`:
- `getPaymentStatus(groupId, participantName): Promise<boolean>` — returns whether this participant is marked as paid
- `getGroupPayments(groupId): Promise<Array<{ participant_name: string, paid: boolean }>>` — returns all payment statuses for a group (admin use)
- `togglePaymentStatus(groupId, participantName, paid, adminSecret): Promise<boolean>` — sets payment status, verified by admin secret

For `togglePaymentStatus`, the admin secret verification approach: use a Supabase RPC function that accepts the secret and checks it against the groups table, OR do a two-step client-side check (verify secret, then upsert). The RPC approach is cleaner.

Files: `src/utils/db.ts`

**4.3 — Admin UI: payment status toggles on scoreboard**

When the admin secret is present, add a "Paid" column to the scoreboard table with a toggle/checkbox for each participant. Clicking it calls `togglePaymentStatus()`.

The list of participants comes from the existing scoreboard data (submissions). The payment status is overlaid from `getGroupPayments()`.

Files: `src/components/ScoreboardPage.tsx`

**4.4 — Store participant name in localStorage on bracket submission**

When a user submits a bracket, save their name to localStorage under the current group ID. This is used later to look up their payment status for the banner.

Files: `src/hooks/useBracketSubmission.ts`

**4.5 — Check payment status in GroupLayout for banner**

GroupLayout reads the participant name from localStorage, calls `getPaymentStatus()`, and passes the result to `PaymentBanner`.

Files: `src/App.tsx`

---

## Implementation Order

The tasks have dependencies. Recommended order:

```
Phase 1 — Foundation
  2.3  localStorage utilities
  2.1  admin_secret generation in createGroup
  2.2  store admin secret on creation
  2.4  exclude admin_secret from read queries

Phase 2 — Group Name in Nav
  1.1  fetch group data in GroupLayout
  1.2  display group name in GroupNav

Phase 3 — Payment Instructions
  3.1  payment instructions update function
  3.2  admin UI: payment instructions editor
  3.3  PaymentBanner component
  3.4  integrate PaymentBanner into GroupLayout

Phase 4 — Payment Tracking
  4.1  create group_payments table
  4.2  payment status DB functions
  4.3  admin UI: payment toggles on scoreboard
  4.4  store participant name on submission
  4.5  check payment status for banner
```

Phase 1 is a prerequisite for everything else. Phases 2-4 can be parallelized after Phase 1 is complete, though Phase 4.5 depends on Phase 3.3 (the banner component).

---

## Supabase Migration Summary

```sql
-- Add admin_secret to groups
ALTER TABLE groups ADD COLUMN admin_secret text NOT NULL DEFAULT '';
-- Backfill existing groups with random secrets
UPDATE groups SET admin_secret = encode(gen_random_bytes(16), 'hex') WHERE admin_secret = '';

-- Add payment_instructions to groups
ALTER TABLE groups ADD COLUMN payment_instructions text;

-- Create group_payments table
CREATE TABLE group_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, participant_name)
);

CREATE INDEX idx_group_payments_group_id ON group_payments(group_id);

-- RPC function for admin-verified payment toggle
CREATE OR REPLACE FUNCTION toggle_payment_status(
  p_group_id uuid,
  p_participant_name text,
  p_paid boolean,
  p_admin_secret text
) RETURNS boolean AS $$
DECLARE
  v_match boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM groups WHERE id = p_group_id AND admin_secret = p_admin_secret
  ) INTO v_match;

  IF NOT v_match THEN
    RETURN false;
  END IF;

  INSERT INTO group_payments (group_id, participant_name, paid, updated_at)
  VALUES (p_group_id, p_participant_name, p_paid, now())
  ON CONFLICT (group_id, participant_name)
  DO UPDATE SET paid = p_paid, updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function for admin-verified payment instructions update
CREATE OR REPLACE FUNCTION update_payment_instructions(
  p_group_id uuid,
  p_instructions text,
  p_admin_secret text
) RETURNS boolean AS $$
DECLARE
  v_match boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM groups WHERE id = p_group_id AND admin_secret = p_admin_secret
  ) INTO v_match;

  IF NOT v_match THEN
    RETURN false;
  END IF;

  UPDATE groups SET payment_instructions = p_instructions WHERE id = p_group_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
