import Header from "@/components/dashhome/header";
import Hero from "@/components/dashhome/hero";
import GenerationMenu from "@/components/generation/Selection";

export default function DashboardPage() {
  
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <Hero />
            <GenerationMenu />
        </div>
    );
}