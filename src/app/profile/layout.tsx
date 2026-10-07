import { redirect } from "next/navigation";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ProfileLayout({ children }: LayoutProps<"/profile">) {
  // The profile pages are only for signed-in users.
  if (!(await getCurrentUser())) redirect("/");

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto flex w-full max-w-7xl gap-5 px-4 py-6 sm:px-6">
        <ProfileSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
