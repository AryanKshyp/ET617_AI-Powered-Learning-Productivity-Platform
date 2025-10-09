import FeatureCard from "@/components/dashhome/FeatureCard";
import Syllabus from '@/public/syllabusm.png';
import QuestionBank from '@/public/pyqs.png';
import Quiz from '@/public/quiz.png';

const features = [
  {
    title: "Syllabus Management",
    description: "Upload, manage, and organize syllabus content manually or with AI extraction.",
    image: Syllabus
  },
  {
    title: "Question Bank & PYQs",
    description: "Central repository to manage question banks and import previous papers.",
    image: QuestionBank
  },
  {
    title: "Assignments & Quizzes",
    description: "Create customized papers, track student progress with analytics.",
    image: Quiz
  }
];

export default function FeatureList() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
      {features.map((feature, i) => (
        <FeatureCard key={i} {...feature} />
      ))}
    </section>
  );
}
