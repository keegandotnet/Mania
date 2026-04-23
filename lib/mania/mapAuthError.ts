function contains(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

export function mapSupabaseAuthErrorMessage(message: string, fallback: string): string {
  const haystack = message.toLowerCase();

  if (contains(haystack, "invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (contains(haystack, "email not confirmed")) {
    return "Check your email to confirm your account before signing in.";
  }
  if (contains(haystack, "user already registered")) {
    return "An account with this email already exists.";
  }
  if (contains(haystack, "password should")) {
    return "Password does not meet the current requirements.";
  }
  if (contains(haystack, "signup is disabled")) {
    return "Sign-ups are currently unavailable.";
  }

  return fallback;
}
