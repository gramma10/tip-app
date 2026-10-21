"use client";

import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/client";
import { formatMoney } from "@/lib/utils";
import type { PayHandlers } from "./pay-types";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Deferred-intent checkout: wallets render before a PaymentIntent exists, and
 * the intent is created only when the guest confirms (so abandoned taps cost nothing).
 */
export default function StripePay(props: PayHandlers & { publishableKey: string }) {
  const { locale } = useI18n();
  stripePromise ??= loadStripe(props.publishableKey);
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: Math.max(props.totalCents ?? 100, 100),
        currency: "eur",
        locale,
        appearance: {
          theme: "stripe",
          variables: {
            fontFamily: "-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif",
            borderRadius: "12px",
            colorPrimary: "#1d1d1f",
          },
        },
      }}
    >
      <Checkout {...props} />
    </Elements>
  );
}

function Checkout({ totalCents, disabled, createTip, onPaid, onError }: PayHandlers) {
  const stripe = useStripe();
  const elements = useElements();
  const { t, locale } = useI18n();
  const [cardOpen, setCardOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [walletsReady, setWalletsReady] = useState(false);

  async function pay(): Promise<string | null> {
    if (!stripe || !elements) return null;
    const { error: submitError } = await elements.submit();
    if (submitError) return submitError.message ?? t("tip.paymentFailed");

    const tip = await createTip();
    if (!tip) return null; // createTip already surfaced the error
    if (!tip.clientSecret) return t("tip.paymentFailed");

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret: tip.clientSecret,
      confirmParams: { return_url: tip.thanksUrl },
      redirect: "if_required",
    });
    if (error) return error.message ?? t("tip.paymentFailed");
    onPaid(tip);
    return null;
  }

  if (disabled || totalCents == null) {
    return (
      <Button size="lg" className="w-full" disabled>
        {t("tip.chooseAmount")}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className={walletsReady ? "" : "min-h-[52px]"}>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 52,
            buttonType: { applePay: "plain", googlePay: "pay" },
            buttonTheme: { applePay: "black", googlePay: "black" },
            paymentMethods: { applePay: "always", googlePay: "always", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
            layout: { maxColumns: 1, overflow: "never" },
          }}
          onReady={() => setWalletsReady(true)}
          onConfirm={async (event) => {
            const message = await pay();
            if (message) {
              event.paymentFailed({ reason: "fail" });
              onError(message);
            }
          }}
        />
      </div>
      <Button variant="secondary" size="lg" className="w-full" onClick={() => setCardOpen(true)}>
        <CreditCard size={20} aria-hidden />
        {t("tip.payWithCard")}
      </Button>

      <Sheet open={cardOpen} onOpenChange={setCardOpen} title={t("tip.payWithCard")}>
        <div className="py-2">
          <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />
        </div>
        <Button
          size="lg"
          className="mt-4 mb-2 w-full"
          disabled={paying}
          onClick={async () => {
            setPaying(true);
            const message = await pay();
            setPaying(false);
            if (message) onError(message);
          }}
        >
          {paying ? t("tip.processing") : t("tip.pay", { amount: formatMoney(totalCents, locale) })}
        </Button>
      </Sheet>
    </div>
  );
}
