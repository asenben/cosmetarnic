// The ways a seller can hand over a product. Chosen once in the profile settings and shown on all
// of the seller's listings (see syncContact in src/lib/auth/profile.ts).
export const DELIVERY_OPTIONS = [
  { value: "pickup", label: "Лично предаване" },
  { value: "econt", label: "Еконт" },
  { value: "speedy", label: "Спиди" },
  { value: "boxnow", label: "BoxNow" },
  { value: "pigeon", label: "Pigeon" },
  // Any other way, e.g. another courier; the details are agreed in the messages.
  { value: "other", label: "Друго" },
] as const;

export const DELIVERIES = DELIVERY_OPTIONS.map(({ value }) => value);
export type Delivery = (typeof DELIVERY_OPTIONS)[number]["value"];

// The known ways out of what was sent, in the order above; anything else is dropped.
export const readDeliveries = (input: unknown): Delivery[] =>
  Array.isArray(input) ? DELIVERIES.filter((value) => input.includes(value)) : [];

export const deliveryLabels = (delivery: string[]) =>
  DELIVERY_OPTIONS.filter(({ value }) => delivery.includes(value)).map(({ label }) => label);
