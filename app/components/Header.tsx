import Link from "next/link";
import { logout } from "../actions";
import { authMode } from "@/lib/auth";
import { config } from "@/lib/config";

export function Header() {
  const live = config.emailMode === "live";
  return (
    <header className="top">
      <Link href="/" className="brand">
        <span className="brand-mark">₹</span> Payment Reminders
      </Link>
      <div className="top-right">
        <span className={`pill dot ${live ? "live" : "mock"}`} title={live ? "Emails go out via Resend" : "Log-only: no real emails are sent"}>
          {live ? "Live email" : "Mock mode"}
        </span>
        <Link href="/" className="nav-link">Dashboard</Link>
        <Link href="/log" className="nav-link">Send log</Link>
        {authMode() === "password" && (
          <form action={logout}>
            <button className="btn btn-ghost">Sign out</button>
          </form>
        )}
      </div>
    </header>
  );
}

export function SetupBanners() {
  const notes: string[] = [];
  if (authMode() === "open") notes.push("No ADMIN_PASSWORD set — the dashboard is open. Fine locally; set one before deploying.");
  if (!process.env.SUPABASE_URL) notes.push("Using the local demo data file. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for real storage.");
  if (config.emailMode === "mock") notes.push("Mock mode: reminders are logged but not emailed. Set RESEND_API_KEY + EMAIL_FROM to go live.");
  if (!notes.length) return null;
  return (
    <div className="banner">
      {notes.map((n) => (
        <div key={n}>{n}</div>
      ))}
    </div>
  );
}
