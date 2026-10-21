export const BRAND = "Kerasma";

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  tokenSecret: process.env.TIP_TOKEN_SECRET ?? "dev-only-insecure-secret",
  takeRate: Number(process.env.PLATFORM_TAKE_RATE ?? "0.04"),
};

/** Supabase is the source of truth when configured; otherwise an in-memory demo store is used. */
export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceKey,
);

/** Real card / Apple Pay / Google Pay payments when configured; otherwise simulated payments. */
export const isStripeConfigured = Boolean(env.stripeSecretKey && env.stripePublishableKey);

export const isDemoData = !isSupabaseConfigured;
