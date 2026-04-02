import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getMyGameState, type MyGameState } from "@/app/actions/mania";
import { PlayShell } from "./PlayShell";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/play");
  }

  const result = await getMyGameState();
  const initialState: MyGameState = result.ok
    ? result.data
    : {
        viewerId: user.id,
        email: user.email ?? user.id,
        group: null,
        game: null,
        round: null,
        hasReviewed: false,
        revealedDetail: null,
      };

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Play</h1>
      <PlayShell initialState={initialState} />
    </main>
  );
}
