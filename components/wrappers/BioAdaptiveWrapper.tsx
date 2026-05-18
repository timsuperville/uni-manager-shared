import React, { useState, useEffect } from 'react';
import { useBioTelemetry } from '../../hooks/useBioTelemetry';

export interface BioAdaptiveWrapperProps {
  children: React.ReactNode;
  cognitiveLoad?: 'LOW' | 'MEDIUM' | 'HIGH';
}

const CognitiveBrakeAnimation: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[200px] w-full bg-black/5 rounded-lg border border-white/5 animate-pulse">
    <p className="text-white/60 font-mono text-sm tracking-widest uppercase">
      Capacity Limited
    </p>
    <p className="text-white/40 text-xs mt-2">Pacing cognitive load...</p>
  </div>
);

export const BioAdaptiveWrapper: React.FC<BioAdaptiveWrapperProps> = ({
  children,
  cognitiveLoad = 'HIGH'
}) => {
  const { capacityScore } = useBioTelemetry(); // 0-100 score based on HRV/Sleep
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (capacityScore > 40 || cognitiveLoad === 'LOW') {
      setIsUnlocked(true);
      return;
    }
    // Artificial 3-second breathing delay if exhausted and trying to do hard work
    const timer = setTimeout(() => setIsUnlocked(true), 3000);
    return () => clearTimeout(timer);
  }, [capacityScore, cognitiveLoad]);

  if (!isUnlocked) return <CognitiveBrakeAnimation />;
  return <>{children}</>;
};
