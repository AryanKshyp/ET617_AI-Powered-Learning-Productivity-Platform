"use client";
import { useState } from "react";
import classroom from "@/public/classroom.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TeacherLogin() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        router.push("/dashboard");
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
                    <form className="space-y-4">
                        <div>
                            <label className="block mb-1">Name</label>
                            <input type="text" className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block mb-1">Surname</label>
                            <input type="text" className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block mb-1">Email</label>
                            <input type="email" className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block mb-1">Employee ID</label>
                            <input type="text" className="w-full border px-3 py-2 rounded-md" />
                        </div>
                        <button
                            type="submit"
                            onClick={handleClick}
                            className="w-full py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
                        >
                            Submit
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
