import Image from "next/image";
import teacher from "@/public/teacher.png";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-purple-100 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Welcome to your learning hub</h2>
        <p className="text-lg text-gray-600 max-w-2xl">
          Organize materials, explore question banks, and keep every course moving forward from one place.
        </p>
        <Image
          src={teacher}
          alt="Learning experience illustration"
          className="mt-2 rounded-xl shadow-lg"
          priority
        />
      </div>
    </section>
  );
}
