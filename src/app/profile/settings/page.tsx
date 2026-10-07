import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/profile/SettingsForm";
import type { SessionRow } from "@/components/profile/SecuritySettings";
import { getProfile } from "@/lib/auth/profile";
import { listSessions } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Настройки",
};

const signInTime = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

// A short name for the device from its browser's User-Agent header, e.g. "Windows • Chrome".
function describeDevice(userAgent: string | null) {
  if (!userAgent) return { device: "Непознато устройство", mobile: false };

  const system =
    [
      ["iPhone", /iPhone/],
      ["iPad", /iPad/],
      ["Android", /Android/],
      ["Windows", /Windows/],
      ["macOS", /Mac OS X|Macintosh/],
      ["Linux", /Linux/],
    ].find(([, pattern]) => (pattern as RegExp).test(userAgent))?.[0] ?? "Непозната система";
  // Order matters: Edge and Opera also call themselves Chrome, and Chrome also calls itself Safari.
  const browser =
    [
      ["Edge", /Edg\//],
      ["Opera", /OPR\//],
      ["Firefox", /Firefox\//],
      ["Chrome", /Chrome\/|CriOS\//],
      ["Safari", /Safari\//],
    ].find(([, pattern]) => (pattern as RegExp).test(userAgent))?.[0] ?? "непознат браузър";

  return { device: `${system} • ${browser}`, mobile: /iPhone|iPad|Android|Mobile/.test(userAgent) };
}

export default async function ProfileSettings() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [profile, signedIn] = await Promise.all([getProfile(user.id), listSessions(user.id)]);
  const sessions: SessionRow[] = signedIn.map((session) => ({
    id: session.id,
    ...describeDevice(session.userAgent),
    signedIn: signInTime.format(new Date(session.createdAt)),
    current: session.current,
  }));

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Настройки</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Управлявай своя профил, сигурност и предпочитания.</p>
      <SettingsForm profile={profile} sessions={sessions} />
    </div>
  );
}
