"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { authAppearance } from "@/components/auth/authAppearance";

export default function SignUpWithDisplayName() {
  const [displayName, setDisplayName] = useState("");
  const [confirmedDisplayName, setConfirmedDisplayName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = displayName.trim();

    if (trimmedName) {
      setConfirmedDisplayName(trimmedName);
    }
  }

  return (
    <AuthShell
      description="Create a profile, set your display name and start building a clearer picture of your personal metrics."
      eyebrow="Create account"
      title="Start tracking with PAD"
    >
      {confirmedDisplayName ? (
        <SignUp
          appearance={authAppearance}
          fallbackRedirectUrl="/dashboard"
          signInUrl="/sign-in"
          routing="path"
          path="/sign-up"
          unsafeMetadata={{ displayName: confirmedDisplayName }}
        />
      ) : (
        <section>
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Display name
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              What should we call you?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This name will be used in your dashboard greeting.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Display name
              </span>
              <input
                autoComplete="given-name"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                maxLength={40}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g. Alex"
                required
                type="text"
                value={displayName}
              />
            </label>

            <button
              className="h-11 w-full rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-teal-700"
              type="submit"
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-semibold text-teal-700" href="/sign-in">
              Sign in
            </Link>
          </p>
        </section>
      )}
    </AuthShell>
  );
}
