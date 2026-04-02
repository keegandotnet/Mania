import Link from "next/link";
import { SignupForm } from "./ui/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
        <p className="mt-2 text-sm text-foreground/70">Create an account with email and password.</p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
