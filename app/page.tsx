// path: app/page.tsx
"use client";

import OfflineStatus from "@/components/pwa/offline-status";
import PWAInstallPrompt from "@/components/pwa/pwa-install-prompt";
import { useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/home/AnimatedBackground";
import HeroContent from "@/components/home/HeroContent";
import ParticlesOverlay from "@/components/home/ParticlesOverlay";
import StatsHighlights from "@/components/home/StatsHighlights";
import { containerVariants, ctaVariants, floatingAnimation, highlightVariants, subtitleVariants, titleVariants } from "@/components/home/variants";
import OutdatedBrowserModal from "@/components/outdated/OutdatedBrowserModal";
import { useOutdatedBrowserCheck } from "@/hooks/useOutdatedBrowserCheck";
import FooterLinks from "@/components/home/FooterLinks"; // IMPORT THE NEW COMPONENT

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const isOutdated = useOutdatedBrowserCheck();
  const textY = useMotionValue(0);

  useEffect(() => {
    if (isOutdated && typeof window !== "undefined") {
      const dismissed = localStorage.getItem("legacyBrowserDismissed");
      if (!dismissed) {
        setShowModal(true);
      }
    }
  }, [isOutdated]);

  const handleCloseModal = () => {
    setShowModal(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("legacyBrowserDismissed", "true");
    }
  };

  if (isOutdated === null) return null;

  return (
    <>
      {/* 
        Strict Single Page Layout:
        - h-[100vh]: Fallback for older browsers
        - h-[100dvh]: Modern mobile viewport fix
        - overflow-hidden: Disables scrolling
      */}
      <div className='relative h-screen supports-height:100dvh:h-100dvh w-full overflow-hidden bg-black/60'>
        
        <div className="fixed inset-0 z-0 pointer-events-none">
           <AnimatedBackground />
           <ParticlesOverlay />
        </div>

        {showModal && <OutdatedBrowserModal handleCloseModal={handleCloseModal} />}

        {/* 
           Flex Container Logic:
           - h-full: Fill viewport
           - justify-evenly: Distribute Hero, Stats, and Footer evenly in available space
           - py-4: Minimal padding to prevent edge touching
        */}
        <div className='relative z-10 flex h-full flex-col items-center justify-evenly px-4 py-4 sm:py-6'>
          
          {/* 1. HERO SECTION (Flexible height) */}
          <div className="shrink-0 w-full max-w-5xl flex justify-center">
            <HeroContent
              variants={{
                containerVariants,
                titleVariants,
                subtitleVariants,
                highlightVariants,
                ctaVariants,
              }}
              floatingAnimation={floatingAnimation}
              textY={textY}
            />
          </div>
          
          {/* 2. STATS SECTION (Compact on mobile) */}
          <div className="w-full flex justify-center shrink scale-90 sm:scale-100 origin-center">
             <StatsHighlights />
          </div>
        </div>

        {/* ADD THE FOOTER COMPONENT HERE */}
        <FooterLinks />

      </div>
      <PWAInstallPrompt />
      <OfflineStatus />
    </>
  );
}