// components/home/AnimatedBackground.tsx
"use client"
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import HnvImg from "@/public/hnv.webp";
import HnvImgMobile from "@/public/hnvmobile.webp";
import useIsMobile from "@/hooks/useIsMobile";

export default function AnimatedBackground() {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const isMobile = useIsMobile();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <>
      {/* THE FIX: Removed solid bg-slate colors that were blocking the image behind the gradient */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-500 ${
        isDarkMode 
          ? "bg-linear-to-b from-slate-900/80 via-slate-900/50 to-slate-900/80" 
          : "bg-linear-to-b from-slate-500/40 via-transparent to-slate-500/40"
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
            isDarkMode ? "opacity-60" : "opacity-90"
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