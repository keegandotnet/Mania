import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import {
  primaryButtonLgClass,
  secondaryButtonClass,
  secondaryButtonLgClass,
  sectionCardClass,
  toneBadgeClass,
} from "@/app/components/ui";

type Props = {
  email?: string | null;
  nextPath?: string;
};

export function SignedInAuthCard({ email, nextPath = "/account" }: Props) {
  return (
    <section className={sectionCardClass}>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-secondary">
        Session active
      </p>
      <h2 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl">
        You&apos;re already signed in.
      </h2>
      <p className="mt-4 text-sm leading-7 text-foreground-secondary">
        Keep playing with this account, or sign out if you meant to switch
        profiles.
      </p>

      {email ? (
        <div className="mt-5 rounded-2xl border-2 border-foreground bg-accent-lime/30 p-4 landing-sticker-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-lime-fg">
            Current account
          </p>
          <p className="mt-2 break-all text-sm font-bold text-foreground">
            {email}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Link href={nextPath} className={`${primaryButtonLgClass} w-full`}>
          Continue
        </Link>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/play" className={`${secondaryButtonLgClass} w-full`}>
            Play
          </Link>
          <Link href="/results" className={`${secondaryButtonLgClass} w-full`}>
            Results
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t-2 border-foreground/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className={toneBadgeClass("lime")}>Ready to play</span>
        <form action={signOutAction}>
          <button type="submit" className={`${secondaryButtonClass} w-full sm:w-auto`}>
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
