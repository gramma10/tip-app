# Kerasma

Cashless tips, ratings and reviews for hospitality teams. A guest scans a QR or taps an NFC card, picks an amount, rates the service, and pays with Apple Pay, Google Pay or a card. No app and no account needed. The staff member gets paid, the owner sees ratings per person, and every guest is invited to review the venue on Google.

"Kerasma" is a working name. It is set in one place: `BRAND` in [lib/env.ts](lib/env.ts).

## Run it

```bash
npm install
npm run dev
```

With no environment variables, the app runs in **demo mode**:

- An in-memory venue (Thalassa Beach Bar, Naxos) with 7 staff and about 120 days of history.
- Simulated payments.
- One-tap demo sign-in.

Demo data resets whenever the server restarts.

| Try | URL |
|---|---|
| Guest tip page (personal card) | http://localhost:3000/t/maria |
| Guest picks who served them (table card) | http://localhost:3000/t/table-7 |
| Staff member who hasn't set up payouts yet | http://localhost:3000/t/dimitris |
| Owner dashboard, staff app | http://localhost:3000/login |
| Staff invite | http://localhost:3000/join/demo-invite-katerina |

## Checks

```bash
npm run typecheck
npm run lint
npm test            # unit: fees, tokens, analytics, i18n, tip lifecycle
npm run test:e2e    # Playwright on iPhone + Pixel viewports (starts the dev server if needed)
```

Run `npx playwright install chromium` once before the first e2e run.

## How it's built

- **Next.js 16** (App Router, React 19) with Tailwind CSS v4. Cache Components is off on purpose: nearly every route is per-request (sessions, live tips).
- **Data:** the [`Repo`](lib/data/repo.ts) interface has two implementations, [demo](lib/data/demo-repo.ts) and [Supabase](lib/data/supabase-repo.ts). The Supabase one is chosen automatically when its keys are set. Authorization happens in the service layer ([lib/services](lib/services)): every mutation re-derives the venue from the session.
- **Payments:** the [`PaymentProvider`](lib/payments/provider.ts) interface has Stripe Connect ([stripe.ts](lib/payments/stripe.ts)) and a [demo](lib/payments/demo.ts) provider. A Viva.com/IRIS provider can be added here without touching the UI.
- **i18n:** Greek and English, picked from a cookie or `Accept-Language`. QR links stay short (`/t/{code}`), with no locale prefix. The Greek copy avoids gendered articles and vocatives around names.
- **Cards, not people, in the URL:** a QR or NFC card encodes `/t/{code}`. Reassigning the card in the dashboard changes who it pays, with no reprinting.

### Money flow (Stripe)

The app uses destination charges with `application_fee_amount` (see [lib/fees.ts](lib/fees.ts)). The platform pays card processing out of the application fee:

- **Without fee cover:** the staff member receives the tip minus processing and the platform take.
- **With fee cover:** a toggle, **on by default** (`COVER_FEES_BY_DEFAULT`), adds a small amount so the staff member receives 100% of the tip. Guests can switch it off before paying.

  Legal note: the EU Consumer Rights Directive (art. 22) says pre-selected extra payments don't bind consumers, so guests could claim this amount back. Card surcharges are banned outright under PSD2.

Each staff member onboards to an Express-style connected account (Stripe-hosted KYC, weekly Monday payouts). The PaymentIntent is created only when the guest confirms (deferred intent), so abandoned taps cost nothing.

### Reviews

The thank-you screen's prompts come from [lib/review-prompts.ts](lib/review-prompts.ts):

| Rating | Shown |
|---|---|
| 5 stars | "Review on Google" CTA (copies the comment, opens the venue's review box) |
| 4 stars | Neither prompt |
| 1–3 stars | Confirmation that the feedback went privately to the manager. The rating and comment appear in the dashboard's feedback inbox. |

**Policy risk:** asking only 5-star guests for Google reviews is "review gating". Google's review policy prohibits it as fake engagement, and possible penalties include removal of the venue's reviews. EU rules on misleading review practices may also apply. Choosing this is a product decision; to go back, change `googleReview` in `postTipPrompts`.

Reviews only count once their tip is paid. The review and Google-tap actions both need an HMAC token tied to the tip ([lib/tokens.ts](lib/tokens.ts)).

## Going live

1. **Supabase**
   - Create a project.
   - Run [supabase/migrations/20261016000000_init.sql](supabase/migrations/20261016000000_init.sql).
   - Enable email auth and add `https://<your-domain>/auth/callback` as a redirect URL.
2. **Stripe**
   - Enable Connect.
   - Add a webhook to `https://<your-domain>/api/stripe/webhook` for these events: `payment_intent.succeeded`, `payment_intent.canceled`, `charge.refunded` and `account.updated` (Connect).
   - Register your domain for Apple Pay in the Stripe dashboard. Apple Pay does not work on localhost; test on a Vercel preview with a real iPhone.
3. Copy [.env.example](.env.example) to `.env.local` (or Vercel env vars) and fill it in. Set a long random `TIP_TOKEN_SECRET`.
4. Deploy to Vercel.

### Before taking real money

- **Tax:** get a Greek accountant's or lawyer's opinion on whether tips paid *directly* to a staff member's Stripe account qualify for the tax-free electronic-tips allowance. The `payee_mode` column (`staff` | `venue`) supports routing tips to the venue instead if needed.
- **Stripe:** confirm with Stripe that Greek individuals can be Express connected accounts for gratuities.

## Roadmap (v1.1)

- Shift Pool mode: shifts, clock-in and weighted splits, using separate charges and transfers.
- Viva.com / IRIS instant bank payments.
- Web push for new tips.
- Day and shift analytics.
- Owner subscription billing.
- A Redis rate limiter (the current one is per instance).
