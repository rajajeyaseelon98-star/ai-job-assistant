# UI QA + Mobile Responsiveness + Premium UI Upgrade Plan

**Scope:** Frontend UI/UX only  
**Constraints:** Do not change business logic, API contracts, database queries, or data flow. Do not introduce breaking changes.  
**Stack:** Next.js App Router, React (JSX), Tailwind CSS  
**QA:** Playwright suite `npm run test:all:qa`

---

## Goals

1. Run Playwright QA suite and fix any UI regressions.
2. Make the entire app 100% mobile responsive.
3. Upgrade UI to a premium, trustworthy, modern SaaS look.
4. Do NOT change business logic, API contracts, or data flow.
5. Do NOT introduce breaking changes.

---

## Design tokens (enforced)

### Colors

- **Background:** `#F8FAFC`
- **Card:** `#FFFFFF`
- **Primary:** `#2563EB`
- **Primary hover:** `#1D4ED8`
- **Text:** `#0F172A`
- **Muted text:** `#64748B`
- **Border:** `#E2E8F0`
- **Surface muted:** `#F1F5F9`

### Typography

- **Heading sizes:** `text-xl` / `text-2xl`
- **Body sizes:** `text-sm` / `text-base`
- **Heading weight:** `font-semibold`
- **Body weight:** `font-normal`
- **Line height:** `leading-relaxed`

### Spacing (8px system)

- **Cards:** `p-4` or `p-6`
- **Sections:** `gap-4` or `gap-6`

### Borders, radius, shadows

- **Cards:** `rounded-xl`, `border border-[#E2E8F0]`, `shadow-sm` (hover `shadow-md`)
- **Inputs/buttons:** `rounded-lg`, consistent height, visible focus ring

---

## Execution plan (test-first, non-breaking)

### Step A — QA baseline (must pass before expanding scope)

- Run: `npm run test:all:qa`
- Classify failures:
  - **UI-only:** selectors, visibility, layout, responsive breakpoints, animations/timing
  - **Non-UI:** ignore (do not change backend/data-flow); only adjust UI to avoid triggering them
- Fix UI-only failures until suite is green.
- Prefer stable selectors:
  - Use existing stable attributes if present
  - If necessary, add **non-breaking** `data-testid` attributes to UI elements to stabilize tests

### Step B — Token enforcement (stop future drift)

- Map tokens into the project’s Tailwind/theme approach:
  - Prefer `tailwind.config.*` theme tokens (or CSS variables if used)
- Ensure global defaults:
  - app background `#F8FAFC`
  - base text `#0F172A`
  - borders `#E2E8F0`
- Standardize shared patterns:
  - Card layout
  - Button variants
  - Input + Label styles

### Step C — Mobile responsiveness sweep (STRICT)

Validate and fix at these widths:

- **320px** (small mobile)
- **375px** (standard mobile)
- **768px** (tablet)
- **1024px+** (desktop)

Rules:

- No horizontal scroll anywhere
- Buttons tappable: **min height 44px**
- Inputs full-width on mobile
- Use Tailwind responsive utilities (`sm`, `md`, `lg`)
- Convert multi-column layouts → single column on mobile
- Fix overflow issues (truncate, wrap, or stack)

Order of operations:

- Global shells (sidebar/topbar/layout containers)
- Forms (stacking, full-width inputs, button grouping)
- Tables/grids (mobile card/stacks, truncation/wrap)
- Overflow “killers” (long text, badges/chips, fixed-width containers)

### Step D — Premium UI upgrade (SaaS trust look)

- Apply tokens consistently:
  - primary actions and hover
  - muted surfaces and border language
  - consistent typography hierarchy and spacing
- No flashy animation; subtle hover elevation only where appropriate

### Step E — Component standardization

Refactor UI to consistently use:

- `Button` (primary/secondary/outline)
- Card layout
- Input + Label

Rules:

- No inline styles unless necessary
- Replace inconsistent UI with shared components
- Do not rename critical props without updating usage

### Step F — UX trust improvements

- Clear loading states (buttons + page transitions where present)
- Disabled submit while pending
- Empty states for lists
- Human-readable error messages (use existing helpers)
- Subtle hover effects (no flashy animations)

### Step G — Final QA + output

- Re-run: `npm run test:all:qa`
- Manual verification:
  - Mobile layout
  - Navigation
  - Forms
  - Buttons
  - Loading states
- Deliverables:
  - List of files modified
  - Summary of UI improvements
  - Any assumptions made

