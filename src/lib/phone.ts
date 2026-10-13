// The one rule for phone numbers, shared by every form that asks for one and by the server
// checks behind them.

// A Bulgarian number, once the spaces, dashes and brackets people type are taken out: ten
// digits starting with 0, or +359 in place of that 0 — "0876722967" or "+359876722967". The
// digit after the prefix is never 0, which leaves out made-up numbers like "0000888800".
const PHONE_PATTERN = /^(?:0|\+359)[1-9]\d{8}$/;

export const PHONE_ERROR = "Въведи телефон с 10 цифри, напр. 0876722967, или с +359 – +359876722967.";

// "0888 123-456" becomes "0888123456".
export const tidyPhone = (value: string) => value.replace(/[\s().-]/g, "");

export const isPhone = (value: string) => PHONE_PATTERN.test(tidyPhone(value));
