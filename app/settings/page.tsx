import { ownerStore } from "@/lib/session";
import { emailSettings } from "@/lib/settings";
import { Header } from "../components/Header";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const store = await ownerStore();
  const email = await emailSettings(store);
  const keyHint =
    email.source.apiKey === "env"
      ? "Set in hosting environment (RESEND_API_KEY) — that value is used."
      : email.apiKey
        ? `Saved (…${email.apiKey.slice(-4)}). Leave blank to keep it.`
        : "Not set — reminders are only logged, not emailed.";

  return (
    <main className="wrap">
      <Header mode={email.mode} />
      <div className="section-head head-wrap">
        <h2 className="section-title">Settings</h2>
        <span className={`pill dot ${email.mode === "live" ? "live" : "mock"}`}>
          {email.mode === "live" ? "Live — emails are being sent" : "Mock — nothing is emailed yet"}
        </span>
      </div>
      <SettingsForm
        keyHint={keyHint}
        from={email.from}
        replyTo={email.replyTo}
        businessName={email.businessName === "Our team" ? "" : email.businessName}
        fromLocked={email.source.from === "env"}
      />
      <div className="panel" style={{ marginTop: 16, fontSize: 14, color: "var(--ink-2)" }}>
        <b style={{ color: "var(--ink)" }}>About the sender address.</b> Resend only delivers to your customers from a
        domain you have verified in Resend (Domains → Add domain, then add the DNS records it shows). Until then you
        can use <code>onboarding@resend.dev</code>, which only delivers to the email address of your own Resend
        account — handy for a test, but reminders to customers will fail and show as “Email failed”.
      </div>
    </main>
  );
}
