"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      {confirmedDisplayName ? (
        <SignUp
          fallbackRedirectUrl="/dashboard"
          signInUrl="/sign-in"
          routing="path"
          path="/sign-up"
          unsafeMetadata={{ displayName: confirmedDisplayName }}
        />
      ) : (
        <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-500">Create account</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              What should we call you?
            </h1>
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
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                maxLength={40}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g. Alex"
                required
                type="text"
                value={displayName}
              />
            </label>

            <button
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              type="submit"
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-medium text-slate-900" href="/sign-in">
              Sign in
            </Link>
          </p>
        </section>
      )}
    </main>
  );
}
