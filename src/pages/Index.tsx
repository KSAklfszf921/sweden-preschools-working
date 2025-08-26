import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedPreschools } from "@/components/FeaturedPreschools";
import { Statistics } from "@/components/Statistics";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <FeaturedPreschools />
      <Statistics />
      <Footer />
    </div>
  );
};

export default Index;
