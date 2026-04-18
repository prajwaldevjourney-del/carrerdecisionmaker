import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Values from "@/components/landing/Values";
import HowItWorks from "@/components/landing/HowItWorks";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Values />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
