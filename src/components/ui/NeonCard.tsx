import React from 'react';
import { motion } from 'motion/react';

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'accent';
}

export default function NeonCard({ children, className = '', glowColor = 'primary' }: Props) {
  const glowStyles = {
    primary: 'shadow-[0_0_30px_rgba(0,255,156,0.1)] border-neon-primary/20',
    secondary: 'shadow-[0_0_30px_rgba(91,225,255,0.1)] border-neon-secondary/20',
    accent: 'shadow-[0_0_30px_rgba(255,138,61,0.1)] border-accent/20',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`glass-panel p-6 ${glowStyles[glowColor]} ${className}`}
    >
      {children}
    </motion.div>
  );
}
