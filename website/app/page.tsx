import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ToolsSection from "./components/ToolsSection";
import FeaturesSection from "./components/FeaturesSection";
import PlatformsSection from "./components/PlatformsSection";
import DownloadSection from "./components/DownloadSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
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
      </main>
      <Footer />
    </>
  );
}
