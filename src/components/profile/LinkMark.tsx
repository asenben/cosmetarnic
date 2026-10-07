import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import type { ProfileLinkKey } from "@/lib/auth/profileLinks";

type LinkMarkProps = {
  site: ProfileLinkKey;
  // "lg" on the profile page, "sm" next to the fields in the settings.
  size?: "sm" | "lg";
};

// The round mark for each site a profile can link to. OLX and Bazar.bg have no icon in the icon
// library, so they get a plain badge with the site's name instead of a logo.
export default function LinkMark({ site, size = "sm" }: LinkMarkProps) {
  const large = size === "lg";
  const circle = `flex shrink-0 items-center justify-center rounded-full text-white ${large ? "size-10" : "size-7"}`;
  const icon = large ? "size-5.5" : "size-4";

  switch (site) {
    case "instagram":
      return (
        <span aria-hidden className={`${circle} bg-linear-to-tr from-amber-400 via-rose-500 to-purple-600`}>
          <FaInstagram className={icon} />
        </span>
      );
    case "tiktok":
      return (
        <span aria-hidden className={`${circle} bg-black`}>
          <FaTiktok className={large ? "size-5" : "size-3.5"} />
        </span>
      );
    case "facebook":
      return (
        <span aria-hidden className={`${circle} bg-facebook`}>
          <FaFacebookF className={large ? "size-5" : "size-3.5"} />
        </span>
      );
    case "olx":
      return (
        <span aria-hidden className={`${circle} bg-teal-950 font-extrabold tracking-tight ${large ? "text-sm" : "text-[9px]"}`}>
          ol<span className="text-teal-300">x</span>
        </span>
      );
    case "bazar":
      return (
        <span aria-hidden className={`${circle} bg-orange-500 font-extrabold ${large ? "text-xl" : "text-sm"}`}>
          b
        </span>
      );
  }
}
