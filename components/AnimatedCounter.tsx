"use client";

import React from 'react';
import useCountUp from '@/hooks/useCountUp';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2000,
  suffix = '',
  className = ''
}) => {
  const { count, elementRef } = useCountUp({ 
    end, 
    duration,
    startOnView: true 
  });

  const formatNumber = (num: number) => {
    const roundedNum = Math.floor(num);
    if (roundedNum >= 1000) {
      const thousands = Math.floor(roundedNum / 1000);
      const remainder = roundedNum % 1000;
      if (remainder === 0) {
        return `${thousands},000`;
      }
      return `${thousands},${remainder.toString().padStart(3, '0')}`;
    }
    return roundedNum.toString();
  };

  return (
    <span 
      ref={elementRef} 
      className={className}
    >
      {formatNumber(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;