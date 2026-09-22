import { PageShell, sectionCardClass } from "@/app/components/ui";
import { ResetPasswordForm } from "./ui/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <div className={sectionCardClass}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-secondary">Account recovery</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Choose a new password.</h1>
          <p className="mt-3 text-sm leading-7 text-foreground-secondary">Use at least eight characters. This link must be opened from the reset email.</p>
          <div className="mt-6"><ResetPasswordForm /></div>
        </div>
      </section>
    </PageShell>
  );
}
