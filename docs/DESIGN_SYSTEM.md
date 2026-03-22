# Design system — Navy · White · Blue

**Purpose:** Premium SaaS UI tokens and reusable components. **Update** when changing `tailwind.config.ts` or `app/globals.css`.

## Colors (exact)

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#F8FAFC` | Page background |
| `foreground` / `text` | `#0F172A` | Headings, primary body |
| `text-muted` | `#64748B` | Secondary copy |
| `primary` | `#2563EB` | CTAs, links, focus |
| `primary-hover` | `#1D4ED8` | Primary hover |
| `border` | `#E2E8F0` | Dividers, inputs |
| `card` | `#FFFFFF` | Cards, panels |
| `surface-muted` | `#F1F5F9` | Subtle fills, hover rows |
| `surface-column` | `#F1F5F9` | Kanban columns |

Tailwind: `bg-background`, `text-foreground`, `text-text-muted`, `border-border`, `bg-primary`, `hover:bg-primary-hover`, `bg-surface-muted`, `bg-surface-column`.

## Shadows

- `shadow-card` — default card elevation  
- `shadow-card-md` — hover / dropdowns  
- `shadow-nav` — sticky header bottom edge  

## Components

| File | Role |
|------|------|
| `components/ui/Button.tsx` | `primary` · `secondary` · `outline` · `ghost` · `destructive`; sizes `sm` · `md` · `lg` |
| `components/ui/Card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `components/ui/Input.tsx` | `Input`, `Textarea`, `Select` (forwardRef) |
| `components/ui/Label.tsx` | `Label` |
| `lib/utils/cn.ts` | Class name merge helper |

## CSS utilities (`globals.css`)

- `.input-field` — borders, focus ring `ring-primary/20`, transitions  
- `.label-field` — form labels  
- `.card-elevated` — optional hover lift  

## Patterns

```tsx
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

<Button variant="primary" size="md">Save</Button>
<Button variant="secondary">Cancel</Button>

<input className="input-field" />
<label className="label-field">Email</label>
```

## Kanban

- Columns: `bg-surface-column`, dashed border on drag hover, `border-border`  
- Cards: `rounded-xl border-border bg-card shadow-card transition-all duration-200`  
- Status chips: `types/application.ts` → `STATUS_COLORS`  

## Principles

- 8px spacing grid (`gap-2` = 8px, `p-4` = 16px)  
- Transitions: `duration-200` / `ease-in-out`  
- Corners: `rounded-lg` (buttons), `rounded-xl` (cards)  
- No heavy gradients; single accent blue  
