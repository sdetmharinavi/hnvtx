// hooks/useIsMobile.tsx
import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth < breakpoint;
      
      // Check user agent for mobile indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'mobile', 'android', 'iphone', 'ipad', 'ipod', 
        'blackberry', 'windows phone', 'opera mini'
      ];
      const isMobileAgent = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );
      
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Combine all checks - prioritize screen size but consider other factors
      const mobile = isSmallScreen || (isMobileAgent && hasTouch);
      
      setIsMobile(mobile);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    // Listen for orientation changes (mobile specific)
    window.addEventListener('orientationchange', checkDevice);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;

// Usage examples:
// const isMobile = useIsMobile(); // Uses default 768px breakpoint
// const isMobile = useIsMobile(1024); // Custom breakpoint
// const isMobile = useIsMobile(480); // Smaller breakpoint for strict mobile-only