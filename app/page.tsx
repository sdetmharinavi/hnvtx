"use client";

import OfflineStatus from "@/components/pwa/offline-status";
import PWAInstallPrompt from "@/components/pwa/pwa-install-prompt";

import { useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

import AnimatedBackground from "@/components/home/AnimatedBackground";
import HeroContent from "@/components/home/HeroContent";
import ParticlesOverlay from "@/components/home/ParticlesOverlay";
import ScrollIndicator from "@/components/home/ScrollIndicator";
import StatsHighlights from "@/components/home/StatsHighlights";
import { containerVariants, ctaVariants, floatingAnimation, highlightVariants, subtitleVariants, titleVariants } from "@/components/home/variants";
import OutdatedBrowserModal from "@/components/outdated/OutdatedBrowserModal";
import { useOutdatedBrowserCheck } from "@/hooks/useOutdatedBrowserCheck";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const isOutdated = useOutdatedBrowserCheck();

  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 500], [0, -50]);

  // Check if browser modal should be shown
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
      <div className='relative min-h-screen w-full overflow-hidden'>
        <AnimatedBackground />
        <ParticlesOverlay />

        {showModal && <OutdatedBrowserModal handleCloseModal={handleCloseModal} />}

        <div className='overflow-hidden relative z-10 flex min-h-screen flex-col items-center justify-center bg-black/60 bg-gradient-to-b from-black/60 via-black/40 to-black/60'>
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
          <StatsHighlights />
        </div>

        <ScrollIndicator />
      </div>
      <PWAInstallPrompt />
      <OfflineStatus />
    </>
  );
}
