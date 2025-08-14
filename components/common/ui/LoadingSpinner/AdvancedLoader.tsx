"use client";

import React, { useState, useEffect } from "react";

const AdvancedLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: "Loading assets..." },
      { progress: 40, text: "Connecting to server..." },
      { progress: 60, text: "Fetching data..." },
      { progress: 80, text: "Preparing interface..." },
      { progress: 100, text: "Almost ready..." },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setLoadingProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className='fixed inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto px-6'>
          {/* Logo or Brand */}
          <div className='mb-8'>
            <div className='w-16 h-16 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
              <div className='w-8 h-8 bg-white rounded-sm'></div>
            </div>
          </div>

          {/* Main Loader */}
          <div className='relative mb-8'>
            <div className='w-32 h-32 mx-auto relative'>
              <svg className='w-32 h-32 transform -rotate-90' viewBox='0 0 100 100'>
                <circle cx='50' cy='50' r='40' stroke='rgba(255,255,255,0.2)' strokeWidth='8' fill='none' />
                <circle
                  cx='50'
                  cy='50'
                  r='40'
                  stroke='white'
                  strokeWidth='8'
                  fill='none'
                  strokeLinecap='round'
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - loadingProgress / 100)}`}
                  className='transition-all duration-500 ease-out'
                />
              </svg>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-white text-2xl font-bold'>{loadingProgress}%</span>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className='mb-6'>
            <p className='text-white text-lg font-medium'>{loadingText}</p>
          </div>

          {/* Progress Bar */}
          <div className='w-full bg-white bg-opacity-20 rounded-full h-2 mb-4'>
            <div className='bg-white rounded-full h-2 transition-all duration-500 ease-out' style={{ width: `${loadingProgress}%` }}></div>
          </div>

          {/* Dots Animation */}
          <div className='flex justify-center space-x-2'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='w-2 h-2 bg-white rounded-full animate-pulse'
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1s",
                }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdvancedLoader;
