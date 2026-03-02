import React from 'react';
import { motion } from 'motion/react';

interface Props {
  number: string;
  icon: string;
  label: string;
  description?: string;
  onClick: () => void;
  key?: React.Key;
}

export default function CategoryCard({ number, icon, label, description, onClick }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-panel p-6 flex flex-col items-start text-left relative overflow-hidden group border-white/5 hover:border-neon-primary/30 transition-all duration-300"
    >
      {/* Background Glow */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-primary/5 rounded-full blur-3xl group-hover:bg-neon-primary/10 transition-colors" />
      
      <span className="text-4xl font-bold text-white/10 mb-4 group-hover:text-neon-primary/20 transition-colors">
        {number}
      </span>
      
      <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      
      <h3 className="text-lg font-bold text-text-main mb-1 group-hover:text-neon-primary transition-colors">
        {label}
      </h3>
      
      {description && (
        <p className="text-xs text-text-sub line-clamp-2">
          {description}
        </p>
      )}
    </motion.button>
  );
}
