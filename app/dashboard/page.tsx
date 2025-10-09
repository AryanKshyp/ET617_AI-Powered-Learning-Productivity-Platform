import Header from "@/components/dashhome/header";
import Hero from "@/components/dashhome/hero";
import FeatureList from "@/components/dashhome/FeatureList";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      <FeatureList />
    </div>
  );
}
