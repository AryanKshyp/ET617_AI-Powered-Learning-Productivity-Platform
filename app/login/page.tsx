"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthMode = "login" | "signup";
type UserRole = "student" | "teacher";
type AuthMethod = "password" | "magiclink";

function UnifiedLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [userRole, setUserRole] = useState<UserRole>("student");
    const [authMethod, setAuthMethod] = useState<AuthMethod>("password");

    // Handle query parameters for role preselection
    useEffect(() => {
        const roleParam = searchParams?.get("role");
        if (roleParam === "teacher" || roleParam === "student") {
            setUserRole(roleParam);
        }
    }, [searchParams]);
    
    // Form fields
    const [name, setName] = useState("");
    const [institute, setInstitute] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!email) {
            setError("Email is required");
            return;
        }

        if (authMethod === "password" && !password) {
            setError("Password is required");
            return;
        }

        if (authMode === "signup" && !name) {
            setError("Name is required");
            return;
        }

        if (authMode === "signup" && !institute) {
            setError("Institute is required");
            return;
        }

        if (userRole === "teacher" && authMode === "signup" && !employeeId) {
            setError("Employee ID is required for teachers");
            return;
        }

        setLoading(true);
        try {
            const origin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : undefined);

            // Track the event
            await fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_name: authMode === "login" ? "login_attempt" : "signup_attempt",
                    component: `${userRole}_${authMode}_form`,
                    event_context: userRole,
                    description: `${userRole} ${authMode} initiated via ${authMethod}`,
                    metadata: { name, institute, email, employeeId, authMethod },
                }),
            });

            if (authMethod === "password") {
                if (authMode === "login") {
                    // Login with password
                    const { data, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (signInError) {
                        setError(signInError.message);
                        return;
                    }

                    if (data.user) {
                        router.push("/dashboard");
                    }
                } else {
                    // Sign up with password
                    const { data, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                role: userRole,
                                name,
                                institute,
                                ...(userRole === "teacher" && { employeeId }),
                            },
                            emailRedirectTo: origin ? `${origin}/dashboard` : undefined,
                        },
                    });

                    if (signUpError) {
                        setError(signUpError.message);
                        return;
                    }

                    setMessage("Account created! Please check your email to verify your account.");
                }
            } else {
                // Magic link authentication
                const { error: signInError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        data: {
                            role: userRole,
                            name: authMode === "signup" ? name : undefined,
                            institute: authMode === "signup" ? institute : undefined,
                            ...(userRole === "teacher" && authMode === "signup" && { employeeId }),
                        },
                        emailRedirectTo: origin ? `${origin}/dashboard` : undefined,
                    },
                });

                if (signInError) {
                    setError(signInError.message);
                    return;
                }

                setMessage("Check your email for the magic link!");
            }
        } catch (e: any) {
            setError(e?.message || `${authMode === "login" ? "Login" : "Signup"} failed`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="flex justify-between items-center px-8 py-6">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            ProLearn AI
                        </h1>
                    </Link>
                    <Link 
                        href="/aboutus" 
                        className="text-gray-300 hover:text-white transition-colors font-medium"
                    >
                        About Us
                    </Link>
                </header>

                {/* Main content */}
                <main className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md">
                        {/* Glass morphism card */}
                        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8">
                            {/* Tabs for Login/Signup */}
                            <div className="flex gap-2 mb-6 p-1 bg-black/20 rounded-lg">
                                <button
                                    onClick={() => {
                                        setAuthMode("login");
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                        authMode === "login"
                                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                                            : "text-gray-300 hover:text-white"
                                    }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode("signup");
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                        authMode === "signup"
                                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                                            : "text-gray-300 hover:text-white"
                                    }`}
                                >
                                    Sign Up
                                </button>
                            </div>

                            {/* Role selection */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => {
                                        setUserRole("student");
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                        userRole === "student"
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                                >
                                    🎓 Student
                                </button>
                                <button
                                    onClick={() => {
                                        setUserRole("teacher");
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                        userRole === "teacher"
                                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                                >
                                    👨‍🏫 Teacher
                                </button>
                            </div>

                            {/* Auth method selection */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => {
                                        setAuthMethod("password");
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                        authMethod === "password"
                                            ? "bg-white/20 text-white border-2 border-purple-400"
                                            : "bg-white/5 text-gray-300 hover:bg-white/10 border-2 border-transparent"
                                    }`}
                                >
                                    🔑 Password
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMethod("magiclink");
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                        authMethod === "magiclink"
                                            ? "bg-white/20 text-white border-2 border-blue-400"
                                            : "bg-white/5 text-gray-300 hover:bg-white/10 border-2 border-transparent"
                                    }`}
                                >
                                    ✨ Magic Link
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {authMode === "signup" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                )}

                                {authMode === "signup" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Institute
                                        </label>
                                        <input
                                            type="text"
                                            value={institute}
                                            onChange={(e) => setInstitute(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="Enter your institute"
                                        />
                                    </div>
                                )}

                                {userRole === "teacher" && authMode === "signup" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Employee ID
                                        </label>
                                        <input
                                            type="text"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="Enter your employee ID"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                {authMethod === "password" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {showPassword ? "👁️" : "👁️‍🗨️"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {authMethod === "magiclink" ? "Sending..." : "Processing..."}
                                        </span>
                                    ) : (
                                        authMode === "login" ? "Login" : "Sign Up"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Footer text */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </main>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

export default function UnifiedLogin() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading...</p>
                </div>
            </div>
        }>
            <UnifiedLoginContent />
        </Suspense>
    );
}

