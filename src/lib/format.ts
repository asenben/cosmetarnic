const euro = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" });

// What is shown for a price of nothing: a listing given away, or a product somebody is looking
// to get for free.
export const FREE_LABEL = "Безплатно";

// A price as the site shows it: "12,50 €", or "Безплатно" when it is 0.
export const formatPrice = (price: number) => (price === 0 ? FREE_LABEL : euro.format(price));
