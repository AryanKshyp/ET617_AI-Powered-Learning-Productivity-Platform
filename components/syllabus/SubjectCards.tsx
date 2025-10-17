"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Subject {
  code: string;
  name: string;
  image: string;
  slug: string;
}

interface SubjectCardProps {
  subject: Subject;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden group"
    >
      <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
        <img
          src={subject.image}
          alt={subject.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 text-center">
        <p className="text-xl font-extrabold text-[#4A47A3] group-hover:text-[#6A67D6] transition-colors">
          {subject.code}
        </p>
        <p className="text-sm text-gray-600 truncate">{subject.name}</p>
      </div>
    </div>
  );
};

export default SubjectCard;
