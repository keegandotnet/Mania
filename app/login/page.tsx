import Link from "next/link";
import { LoginForm } from "./ui/LoginForm";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage(props: Props) {
  const searchParams = (await props.searchParams) ?? {};
  const nextPath = searchParams.next ?? "/account";

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-foreground/70">Use your email and password.</p>
      </div>
      {searchParams.error === "auth" ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Authentication failed. Try again.
        </p>
      ) : null}
      <LoginForm nextPath={nextPath} />
      <p className="text-center text-sm text-foreground/70">
        No account?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
