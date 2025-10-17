

import Header from "@/components/dashhome/header";
import Hero from "@/components/dashhome/hero";
import SyllabusPage from "@/components/syllabus/Syllabus_management";

export default function DashboardPage() {
  
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <Hero />
            <SyllabusPage />
        </div>
    );
}
