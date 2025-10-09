import teacher from "@/public/teacher.png"
import Image from "next/image";
export default function Hero() {
  return (
    <section className="relative bg-purple-100">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold">Course Name</h2>
        <p className="text-lg text-gray-600">Professor and TA Name</p>
        <Image src={teacher} alt ="Hero Banner" className="mt-6 rounded-lg shadow-lg"/>
      </div>
    </section>
  );
}
