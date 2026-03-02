import React from 'react';
import { motion } from 'motion/react';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function GlowButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick,
  type = 'button',
  disabled = false,
  ...props 
}: Props) {
  const variants = {
    primary: 'bg-neon-primary text-bg-start shadow-[0_0_20px_rgba(0,255,156,0.4)] hover:shadow-[0_0_30px_rgba(0,255,156,0.6)]',
    secondary: 'bg-neon-secondary text-bg-start shadow-[0_0_20px_rgba(91,225,255,0.4)] hover:shadow-[0_0_30px_rgba(91,225,255,0.6)]',
    outline: 'bg-transparent border border-neon-primary/50 text-neon-primary hover:bg-neon-primary/10',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-bold',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
