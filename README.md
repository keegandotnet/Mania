## Mania

## Getting Started

Create `.env.local` before starting the app. This project expects Supabase public client values on both the server and browser.

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-or-hosted-anon-key
```

For a local Supabase stack started with `supabase start`, the anon key is shown by:

```bash
supabase status
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Useful project docs:

- [docs/supabase-cli.md](./docs/supabase-cli.md)
- [docs/auth.md](./docs/auth.md)
- [docs/security.md](./docs/security.md)
