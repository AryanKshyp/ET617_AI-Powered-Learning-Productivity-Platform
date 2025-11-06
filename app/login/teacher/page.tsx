"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherLogin() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to unified login page with teacher role preselected
        router.replace("/login?role=teacher");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Redirecting to login...</p>
            </div>
        </div>
    );
}
