import Image from "next/image";

export default function FeatureCard({ title, description, image }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex gap-4 hover:shadow-lg transition">
    <Image src={image} alt={title} className="w-16 h-16" />
      
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
