import type { ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import Avatar from "@/components/Avatar";
import LinkMark from "@/components/profile/LinkMark";
import { profileLinks, type ProfileLinks } from "@/lib/auth/profileLinks";

const fullDate = new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" });

type ProfileHeaderProps = {
  username: string;
  // The URL of the profile picture, or null while the account has none.
  avatar: string | null;
  city: string;
  memberSince: Date;
  links: ProfileLinks;
  // What stands beside the name: the edit button on the owner's own page, nothing on the public one.
  action?: ReactNode;
};

// The top of a profile: the picture, the name, the town, the date of joining and the public links.
// The same on the owner's own page and on the page everybody sees.
export default function ProfileHeader({ username, avatar, city, memberSince, links, action }: ProfileHeaderProps) {
  // Only the links that were filled in and left switched to "public" in the settings.
  const shownLinks = profileLinks.filter(({ key }) => links[key].url && links[key].public);

  return (
    // On phones everything is centred under the picture; from tablets up it is beside it.
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-8 sm:text-left">
      <Avatar name={username} src={avatar} className="size-24 text-3xl ring-4 ring-brand-pale/50 sm:size-36 sm:text-5xl" />

      <div className="w-full min-w-0 flex-1">
        <div className="flex flex-col items-center gap-x-4 gap-y-3 sm:flex-row sm:flex-wrap">
          <h1 className="max-w-full min-w-0 truncate text-2xl font-bold text-brand-ink sm:text-3xl">{username}</h1>
          {action}
        </div>

        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-brand-ink/60 sm:justify-start sm:text-base">
          {city && (
            <>
              <li className="flex items-center gap-2">
                <MapPin className="size-5 shrink-0" aria-hidden />
                {city}
              </li>
              <li aria-hidden className="hidden text-brand-ink/30 sm:block">
                |
              </li>
            </>
          )}
          <li className="flex items-center gap-2">
            <CalendarDays className="size-5 shrink-0" aria-hidden />
            Член от {fullDate.format(memberSince)}
          </li>
        </ul>

        {/* The public links sit right under the name, with no box around them. */}
        {shownLinks.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            {shownLinks.map(({ key, label }) => (
              <li key={key}>
                <a
                  href={links[key].url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={label}
                  title={label}
                  className="block rounded-full transition-opacity hover:opacity-80"
                >
                  <LinkMark site={key} size="lg" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
