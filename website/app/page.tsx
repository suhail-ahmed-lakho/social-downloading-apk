import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ToolsSection from "./components/ToolsSection";
import FeaturesSection from "./components/FeaturesSection";
import PlatformsSection from "./components/PlatformsSection";
import DownloadSection from "./components/DownloadSection";
import FaqSection from "./components/FaqSection";
import Footer from "./components/Footer";
import ThreeBackground3D from "./components/ThreeBackground3D";

export default function Home() {
  return (
    <>
      <ThreeBackground3D />
      <Navbar />
      <main>
        <HeroSection />
        <div className="section-divider" />
        <ToolsSection />
        <div className="section-divider" />
        <FeaturesSection />
        <div className="section-divider" />
        <PlatformsSection />
        <div className="section-divider" />
        <DownloadSection />
        <div className="section-divider" />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
