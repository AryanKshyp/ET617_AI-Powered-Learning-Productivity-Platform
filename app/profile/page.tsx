"use client";

import Header from "@/components/dashhome/header";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, FormEvent } from "react";

type UserProfile = {
  email: string;
  fullName: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        if (!cancelled) {
          setError("Failed to load your profile. Please try again.");
        }
        return;
      }

      if (!userData.user) {
        if (!cancelled) {
          setError("You need to be signed in to view this page.");
        }
        return;
      }

      const userProfile: UserProfile = {
        email: userData.user.email ?? "",
        fullName: (userData.user.user_metadata?.full_name as string | undefined) ?? "",
      };

      if (!cancelled) {
        setProfile(userProfile);
        setFullName(userProfile.fullName);
      }
    };

    loadProfile()
      .catch(() => {
        if (!cancelled) {
          setError("Unexpected error loading profile.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("You must be signed in to update your profile.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      });

      if (updateError) {
        throw updateError;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: fullName.trim(),
            }
          : prev,
      );
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Personal Information</h1>

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow">Loading your profile...</div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-6 text-red-700 shadow">{error}</div>
        ) : !profile ? (
          <div className="rounded-lg bg-yellow-50 p-6 text-yellow-700 shadow">
            We could not find your profile information.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={profile.email}
                disabled
                className="mt-2 w-full rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {success && <p className="text-sm text-green-600">{success}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white shadow hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

