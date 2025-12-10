import React, { useEffect, useState } from 'react';

const SuccessAnimation = ({ show = true, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
        onComplete?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`flex items-center justify-center mb-6 transition-all duration-500 ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
      <div className="relative">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
          <svg 
            className={`w-8 h-8 text-green-600 transition-all duration-700 ${isAnimating ? 'scale-100' : 'scale-0'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7"
              className={isAnimating ? 'animate-pulse' : ''}
            />
          </svg>
        </div>
        <div className={`absolute inset-0 w-16 h-16 bg-green-200 rounded-full transition-all duration-1000 ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`} />
      </div>
    </div>
  );
};

export default SuccessAnimation;
