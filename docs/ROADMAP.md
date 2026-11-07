# Wedly Product Roadmap

## Vision

Wedly exists to become the most trusted wedding planning platform for couples.

The initial launch focuses on Tamil weddings in the Greater Toronto Area while building a platform that can eventually support all wedding traditions, cultures, and destinations.

Wedly should guide couples from engagement to honeymoon.

Our mission is simple:

**Love. Plan. Celebrate.**

---

# Phase 1 — MVP Stabilization

Goal:
Deliver a polished, trustworthy MVP that couples can actually use.

## Authentication

* Email sign up
* Login
* Password reset
* Google Sign-In
* Proper validation
* Friendly error handling

## Homepage

* Premium hero section
* Better typography
* Better branding
* Responsive layout
* Strong call-to-actions

## Search

* Vendor search
* Category filters
* City filters
* Budget filters
* Fast results

## Vendor Profiles

* Better galleries
* Better layouts
* Better pricing display
* Contact information
* Inquiry forms
* Mobile optimization

## Dashboard

* Countdown
* Budget summary
* Planning progress
* Saved vendors
* Tasks

---

# Phase 2 — Couple Experience

Goal:
Create the best wedding planning experience.

## Onboarding

Collect:

* Faith
* Wedding date
* Guest count
* Wedding city
* Multi-day events
* Budget
* Venue booked?
* Planning stage

## Planning

* Timeline
* Budget tracking
* Task management
* Event management
* Saved vendors
* Inquiry tracking

---

# Phase 3 — Vendor Experience

Goal:
Create the best vendor marketplace.

## Vendor Dashboard

* Claim listing
* Edit profile
* Upload photos
* Manage services
* Respond to inquiries

## Availability

* Calendar
* Blackout dates
* Seasonal pricing

---

# Phase 4 — Premium Features

## Couple Wedding Website

Each couple receives:

wedly.com/couple-name

Including:

* Story
* Schedule
* RSVP
* Registry
* Gallery
* Travel information

---

## Guest List

* RSVP tracking
* Table assignments
* Meal preferences
* Invitation tracking

---

## Auspicious Date Service

* Couple enters birth details
* Generate recommended dates
* Priest review
* PDF certificate
* Digital signature

---

## Honeymoon Registry

* Flight fund
* Hotel fund
* Activity fund
* Cash gifts
* Travel partnerships

---

# Phase 5 — Business Growth

## Vendor Subscriptions

Premium plans

## Advertising

Featured listings

Homepage promotions

## Analytics

Vendor dashboards

Lead analytics

Conversion analytics

## Travel Partnerships

Hotels

Travel agencies

Vacation packages

---

# Long-Term Vision

Wedly becomes the platform couples use from the day they get engaged until after their honeymoon.

Wedding planning.

Vendor discovery.

Guest management.

Wedding websites.

Registries.

Travel.

All in one place.


## Design system refresh — November 2026

- [x] Homepage refresh with approved original line-art illustrations (PR #6).
- [x] Shared palette and common component styling prepared in the site-wide theme branch.
- [x] Brand guide and README updated to reflect ivory, plum and lilac styling.
- [ ] Verify Vercel preview and mobile/desktop contrast, navigation, cards, forms and page layouts.
- [ ] Audit remaining page-specific hard-coded colours and migrate them to semantic tokens.
- [ ] Review authenticated pages (onboarding, dashboard, budget, events, tasks, saved, inquiries) and vendor/admin experiences for visual consistency.

Design work must not be mistaken for completion of roadmap product features.


## PR #8 — Couple experience visual refresh (November 2026)

- [x] Apply semantic purple, plum, ink, muted and lilac tokens across dashboard, budget, tasks, events, inquiries and saved vendors.
- [x] Standardize main content vertical spacing and prominent headings.
- [x] Keep existing Supabase queries, mutations, navigation and form behaviour unchanged.
- [ ] Confirm preview build, responsive layouts, contrast, and authenticated CRUD flows before merging.
- [ ] Follow up on any issues identified during visual QA.


## PR #9 — Authentication and onboarding visual refresh (November 2026)

- [x] Align login and signup cards, links, headings and Google sign-in buttons with the approved purple/ivory palette.
- [x] Align the five-step onboarding progress, selection surfaces and forms with semantic design tokens.
- [x] Preserve authentication, redirects, wedding-type defaults and onboarding database writes.
- [ ] Verify email signup/login, Google OAuth, error messages, onboarding steps and final submission in a Vercel preview.
- [ ] Check mobile layout, keyboard navigation, and colour contrast before merge.

## Existing account routing fix (November 2026)

- [x] Google signup callback checks whether a wedding already exists before choosing dashboard or onboarding.
- [x] Signed-in existing couples opening signup are redirected to dashboard.
- [x] Onboarding checks existing weddings on entry and before insertion.
- [ ] Verify returning Google users, returning email users, first-time signup, and direct onboarding URLs in Vercel preview.
