// The links a user can add to their profile: social profiles and their pages on other marketplaces.
// Shared by the settings form (labels, placeholders) and the server (checking what was typed).

export const profileLinks = [
  { key: "instagram", group: "social", label: "Instagram", domains: ["instagram.com"], example: "https://instagram.com/ime" },
  { key: "tiktok", group: "social", label: "TikTok", domains: ["tiktok.com"], example: "https://tiktok.com/@ime" },
  { key: "facebook", group: "social", label: "Facebook", domains: ["facebook.com", "fb.com"], example: "https://facebook.com/ime.familia" },
  { key: "olx", group: "marketplace", label: "OLX", domains: ["olx.bg"], example: "https://www.olx.bg/d/profile/ime" },
  { key: "bazar", group: "marketplace", label: "Bazar.bg", domains: ["bazar.bg"], example: "https://bazar.bg/user/ime" },
] as const;

export type ProfileLinkKey = (typeof profileLinks)[number]["key"];
// `public` is the user's choice of whether the link is shown on their public profile.
export type ProfileLink = { url: string; public: boolean };
export type ProfileLinks = Record<ProfileLinkKey, ProfileLink>;

const LINK_MAX = 200;

// Every link is optional. Returns the tidied address ("" when left empty) or what is wrong with it.
export function checkProfileLink(key: ProfileLinkKey, input: unknown): { value: string; error?: string } {
  const typed = typeof input === "string" ? input.trim() : "";
  if (!typed) return { value: "" };

  const { label, domains, example } = profileLinks.find((link) => link.key === key)!;
  const error = `Въведи адрес на профил в ${label}, например ${example.replace("https://", "")}.`;

  let url: URL;
  try {
    // People paste "facebook.com/..." as often as the full address.
    url = new URL(/^https?:\/\//i.test(typed) ? typed : `https://${typed}`);
  } catch {
    return { value: typed, error };
  }

  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const onSite = domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  // The address has to point at a profile, not just at the site's front page.
  if (!onSite || url.pathname.replace(/\/+$/, "") === "" || typed.length > LINK_MAX) {
    return { value: typed, error };
  }

  // Always https and without the page fragment; the query stays, since some profile addresses use it.
  return { value: `https://${url.hostname.toLowerCase()}${url.pathname}${url.search}` };
}

// What is stored for a user, turned into one entry per link. Links saved before the "public"
// switch existed are plain addresses, and count as public.
export function readProfileLinks(stored: unknown): ProfileLinks {
  const saved = typeof stored === "object" && stored !== null ? (stored as Record<string, unknown>) : {};
  const links = {} as ProfileLinks;
  for (const { key } of profileLinks) {
    const entry = saved[key];
    if (typeof entry === "string") links[key] = { url: entry, public: true };
    else if (typeof entry === "object" && entry !== null && "url" in entry && typeof entry.url === "string") {
      links[key] = { url: entry.url, public: !("public" in entry) || entry.public !== false };
    } else links[key] = { url: "", public: true };
  }
  return links;
}
