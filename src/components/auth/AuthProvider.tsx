"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import AuthModal, { type AuthModalHandle } from "@/components/auth/AuthModal";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { SessionUser } from "@/lib/auth/session";

type AuthView = "login" | "register" | "forgot";

// The emailed reset link is the site address with this parameter, e.g. /?reset_token=abc123.
const RESET_TOKEN_PARAM = "reset_token";

// Where the confirmation link from the sign-up email lands: "1" when it worked, "0" when it didn't.
const EMAIL_VERIFIED_PARAM = "email_verified";

const verificationNotices = {
  success: { kind: "success", text: "Имейлът е потвърден. Вече можеш да влезеш в профила си." },
  error: { kind: "error", text: "Връзката за потвърждение е невалидна или изтекла. Влез, за да ти изпратим нова." },
} as const;

const subscribeToNothing = () => () => {};
const readResetToken = () => new URLSearchParams(window.location.search).get(RESET_TOKEN_PARAM);
const readEmailVerified = () => new URLSearchParams(window.location.search).get(EMAIL_VERIFIED_PARAM);

type AuthContextValue = {
  user: SessionUser | null;
  // Applies a change the user just made to their own account, e.g. a new profile picture.
  updateUser: (changes: Partial<SessionUser>) => void;
  isLoggedIn: boolean;
  openLogin: () => void;
  logout: () => Promise<void>;
  // For actions that need an account: returns true when signed in, otherwise opens the login form.
  requireAuth: () => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

type AuthProviderProps = {
  // The signed-in user as the server saw it when rendering the page.
  initialUser: SessionUser | null;
  children: ReactNode;
};

export default function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const router = useRouter();
  const modalRef = useRef<AuthModalHandle>(null);
  const [user, setUser] = useState(initialUser);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const isLoggedIn = user !== null;

  // Arriving from an emailed link shows the modal straight away, until the visitor closes it or moves
  // on to another form: the new-password form for a reset link, the sign-in form with the outcome
  // for an email confirmation link.
  const resetToken = useSyncExternalStore(subscribeToNothing, readResetToken, () => null);
  const emailVerified = useSyncExternalStore(subscribeToNothing, readEmailVerified, () => null);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const resetActive = resetToken !== null && !linkDismissed;
  const verificationActive = emailVerified !== null && !linkDismissed && !resetActive && !isLoggedIn;

  const dismissReset = () => {
    if (resetToken === null && emailVerified === null) return;
    // Drop the parameters from the address bar so a reload or a shared link doesn't reopen the form.
    const url = new URL(window.location.href);
    url.searchParams.delete(RESET_TOKEN_PARAM);
    url.searchParams.delete(EMAIL_VERIFIED_PARAM);
    window.history.replaceState(null, "", url);
    setLinkDismissed(true);
  };

  const showView = (next: AuthView) =>
    modalRef.current?.swap(() => {
      dismissReset();
      setView(next);
      setOpen(true);
    });

  const openLogin = () => {
    dismissReset();
    setView("login");
    setOpen(true);
  };

  const closeModal = () => {
    dismissReset();
    setOpen(false);
  };

  const onLoggedIn = (loggedIn: SessionUser) => {
    dismissReset();
    setUser(loggedIn);
    setOpen(false);
    // Re-render the server parts of the page for the signed-in user.
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const updateUser = (changes: Partial<SessionUser>) => {
    if (user) setUser({ ...user, ...changes });
  };

  const requireAuth = () => {
    if (isLoggedIn) return true;
    openLogin();
    return false;
  };

  return (
    <AuthContext value={{ user, updateUser, isLoggedIn, openLogin, logout, requireAuth }}>
      {children}

      <AuthModal ref={modalRef} open={open || resetActive || verificationActive} onClose={closeModal}>
        {resetActive && <ResetPasswordForm token={resetToken} onLogin={() => showView("login")} />}
        {!resetActive && (verificationActive || view === "login") && (
          <LoginForm
            notice={verificationActive ? verificationNotices[emailVerified === "1" ? "success" : "error"] : undefined}
            onSuccess={onLoggedIn}
            onRegister={() => showView("register")}
            onForgotPassword={() => showView("forgot")}
          />
        )}
        {!resetActive && !verificationActive && view === "register" && <RegisterForm onLogin={() => showView("login")} />}
        {!resetActive && !verificationActive && view === "forgot" && <ForgotPasswordForm onLogin={() => showView("login")} />}
      </AuthModal>
    </AuthContext>
  );
}
