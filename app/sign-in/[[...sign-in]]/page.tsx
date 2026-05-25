import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { authAppearance } from "@/components/auth/authAppearance";

export default function SignInPage() {
  return (
    <AuthShell
      description="Use your account to return to your dashboard, review recent entries and keep your trends current."
      eyebrow="Welcome back"
      title="Sign in to PAD"
    >
      <SignIn
        appearance={authAppearance}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
        routing="path"
        path="/sign-in"
      />
    </AuthShell>
  );
}
