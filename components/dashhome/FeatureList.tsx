import FeatureCard from "@/components/dashhome/FeatureCard";
import Syllabus from '@/public/syllabusm.png';
import QuestionBank from '@/public/pyqs.png';
import Quiz from '@/public/quiz.png';
import Link from 'next/link'; 

const features = [
  {
    title: "Syllabus Management",
    description: "Upload, manage, and organize syllabus content manually or with AI extraction.",
    image: Syllabus,
    // Add a slug or route for navigation
    href: "/dashboard/syllabus" // Placeholder path
  },
  {
    title: "Question Bank & PYQs",
    description: "Central repository to manage question banks and import previous papers.",
    image: QuestionBank,
    // Add a slug or route for navigation
    href: "/dashboard/question-bank" // Placeholder path
  },
  {
    title: "Assignments & Quizzes",
    description: "Create customized papers, track student progress with analytics.",
    image: Quiz,
    // Add a slug or route for navigation
    href: "/dashboard/quizzes" // Placeholder path
  },
  {
    title: "Productivity & Wellness",
    description: "Focus timers, task boards, wellness tracking, games, and analytics.",
    image: Quiz, // Using Quiz image as placeholder
    href: "/productivity"
  }
];



export default function FeatureList() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, i) => (
        // 1. Wrap the FeatureCard with the Link component
        <Link href={feature.href} key={i}>
          {/* 2. Pass all other properties to FeatureCard. 
               Note: You might need to adjust FeatureCard to 
               ensure it renders its content as a clickable element 
               (e.g., using a div with an appropriate cursor and hover state). 
               The Link component makes the area clickable.
          */}
          <FeatureCard 
            title={feature.title} 
            description={feature.description} 
            image={feature.image} 
          />
        </Link>
      ))}
    </section>
  );
}
