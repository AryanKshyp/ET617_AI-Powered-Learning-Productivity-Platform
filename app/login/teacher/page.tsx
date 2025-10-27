"use client";
import { useState } from "react";
import classroom from "@/public/classroom.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherLogin() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const [name, setName] = useState("");
    const [Institute, setInstitute] = useState("");
    const [email, setEmail] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        if (!email) {
            setError("Email is required");
            return;
        }
        setLoading(true);
        try {
            const origin = typeof window !== "undefined" ? window.location.origin : undefined;

            await fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_name: "login_attempt",
                    component: "teacher_login_form",
                    event_context: "teacher",
                    description: "Teacher login initiated via magic link",
                    metadata: { name, Institute, email, employeeId },
                }),
            });

            const { error: signInError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    data: { role: "teacher", name, Institute, employeeId },
                    emailRedirectTo: origin ? `${origin}/dashboard` : undefined,
                },
            });

            if (signInError) {
                setError(signInError.message);
                return;
            }
            setMessage("Check your email for the login link.");
        } catch (e: any) {
            setError(e?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
            <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-200">
                <h1 className="text-2xl font-bold text-purple-700">ProLearn AI</h1>
                <nav className="flex items-center gap-8">
                    <a href="/aboutus" className="hover:text-purple-700">About Us</a>

                    {/* Login dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setOpen(!open)}
                            className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
                        >
                            Log In
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg overflow-hidden">
                                <Link
                                    href="/login/student"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                >
                                    Student
                                </Link>
                                <Link
                                    href="/login/teacher"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                >
                                    Teacher
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>
            </header>
            <main className="flex flex-col lg:flex-row items-center justify-center px-8 py-12 gap-8">
                {/* Left: Image */}
                <div className="lg:w-1/2">
                    <img src="/classroom.png" alt="Teacher Login" className="rounded-lg shadow-lg" />
                </div>

                {/* Right: Form */}
                <div className="lg:w-1/2 max-w-md bg-gray-50 p-6 rounded-xl shadow">
                    <h2 className="text-2xl font-bold mb-6 text-center">Login Into Your Teacher Account</h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block mb-1">Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block mb-1">Institute</label>
                            <input type="text" value={Institute} onChange={(e) => setInstitute(e.target.value)} className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block mb-1">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block mb-1">Employee ID</label>
                            <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        {message && <p className="text-green-700 text-sm">{message}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60"
                        >
                            {loading ? "Sending Link..." : "Submit"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
