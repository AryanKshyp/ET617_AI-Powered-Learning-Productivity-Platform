import Header from "@/components/dashhome/header";
import Hero from "@/components/dashhome/hero";
import PYQ from "@/components/questionBank/PyqPage";

export default function DashboardPage() {
  
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <Hero />
            <PYQ />
        </div>
    );
}