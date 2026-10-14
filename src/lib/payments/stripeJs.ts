// Stripe's script for the browser, which draws the card fields. Stripe requires it to be loaded
// from its own address, so nothing is installed; these are the few parts of it the site uses.

type StripeError = { type: string; message?: string };

export type StripeElement = {
  mount: (target: HTMLElement) => void;
  destroy: () => void;
  on: (event: "ready" | "loaderror", handler: () => void) => void;
};

export type StripeElements = {
  create: (type: "payment", options?: Record<string, unknown>) => StripeElement;
};

export type StripeClient = {
  elements: (options: Record<string, unknown>) => StripeElements;
  confirmPayment: (options: {
    elements: StripeElements;
    confirmParams: {
      return_url: string;
      payment_method_data?: { billing_details: { address: { country: string } } };
    };
    redirect: "if_required";
  }) => Promise<{ error?: StripeError; paymentIntent?: { id: string } }>;
};

declare global {
  interface Window {
    Stripe?: (key: string, options?: Record<string, unknown>) => StripeClient;
  }
}

const SCRIPT_URL = "https://js.stripe.com/v3/";

let script: Promise<void> | undefined;

// Loads the script once, however many times it is asked for.
export function loadStripe(publishableKey: string): Promise<StripeClient> {
  script ??= new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = SCRIPT_URL;
    tag.onload = () => resolve();
    tag.onerror = () => {
      // So that the next try loads it again.
      script = undefined;
      tag.remove();
      reject(new Error("Stripe's script could not be loaded"));
    };
    document.head.append(tag);
  });

  return script.then(() => {
    if (!window.Stripe) throw new Error("Stripe's script could not be loaded");
    return window.Stripe(publishableKey, { locale: "bg" });
  });
}
