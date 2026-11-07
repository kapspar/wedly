# Wedly Brand Guide — November 2026

## Identity

**Wedly — Love. Plan. Celebrate.**

A warm, elegant and accessible wedding-planning platform, initially focused on GTA Tamil couples and designed to welcome other communities over time. The brand should feel personal, joyful, trustworthy and organized, never childish, generic or visually noisy.

## Approved palette

| Token | Hex | Use |
| --- | --- | --- |
| Primary purple | `#893D87` | Primary actions and links |
| Deep plum | `#62245D` | Headings, logo and strong accents |
| Warm ivory | `#FBF7FA` | Site backgrounds |
| Soft lilac | `#F3E9F2` | Subtle backgrounds and icon containers |
| Lilac section | `#F5EBF4` | Alternating sections |
| Ink | `#322634` | Body text |
| Muted ink | `#615561` | Secondary text |
| Soft border | `#EADCE9` | Cards and fields |

Avoid reintroducing peach and rose-gold as dominant UI colours. Legacy CSS tokens are mapped to the approved palette in `src/app/globals.css` until existing pages can be migrated safely.

## Typography

- Headlines: Playfair Display
- Body and functional UI: Inter
- Wordmark: Cormorant Garamond

Keep headlines editorial and controls highly legible. Maintain accessible contrast, clear focus indicators, generous whitespace and responsive mobile-first layouts.

## Illustration system

Use the **exact approved black-line illustrations**, not AI-generated substitutes or code recreations:

- `public/illustrations/wedly-reception.png` — homepage hero
- `public/illustrations/wedly-hindu.png` — Hindu ceremony section
- `public/illustrations/wedly-catholic.png` — Catholic/Christian ceremony section

Preserve their proportions and transparent backgrounds. Avoid stretching, colourizing, adding backgrounds or placing all three in the hero. Additional illustrations must match the same restrained line-art language.

## Components and voice

Use shared `Button`, `Card`, `Input`, `Navbar` and `Footer` components. Primary buttons use purple with white text; cards are white with subtle lilac borders; input focus is purple. Write in a welcoming, confident and practical voice. Keep the slogan **Love. Plan. Celebrate.**

## Scope

The refresh is visual only: no changes to auth, permissions, vendor data, budget calculations or business workflows. Test mobile and desktop layouts before merging.


## Couple experience pages

Dashboard, budget, tasks, events, inquiries and saved vendors should use the shared `text-plum`, `text-ink`, `text-muted`, `text-primary`, `bg-primary-soft` and `border-border-soft` utilities. Preserve existing task, budget and event persistence behaviour when changing visual styles. Status indicators must remain legible and convey meaning through text, not colour alone.


## Authentication and onboarding

Use the same ivory background, plum editorial headings, soft lilac borders and purple primary controls on login, signup and wedding onboarding. Keep Google branding intact within its sign-in button. Do not change Supabase auth, wedding-type defaults or step validation as part of visual-only work. Review all five onboarding steps on mobile before release.
