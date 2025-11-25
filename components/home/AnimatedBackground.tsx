"use client"
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import HnvImg from "@/public/hnv.png";
import HnvImgMobile from "@/public/hnvmobile.png";
import useIsMobile from "@/hooks/useIsMobile";

export default function AnimatedBackground() {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const isMobile = useIsMobile();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <>
      {/* Dynamic gradient overlay that adjusts for dark mode */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-500 ${
        isDarkMode 
          ? "bg-gradient-to-b from-black/70 via-black/40 to-black/70" 
          : "bg-gradient-to-b from-black/40 via-transparent to-black/40"
      }`} />
      
      <motion.div 
        className="fixed inset-0 -z-10" 
        style={{ y: backgroundY }}
      >
        <Image
          src={isMobile ? HnvImgMobile : HnvImg}
          alt="Harinavi Transmission Background"
          fill
          className={`transition-all duration-700 object-cover ${
            isDarkMode ? "opacity-50" : "opacity-80"
          }`}
          priority
          quality={90}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      </motion.div>
    </>
  );
}