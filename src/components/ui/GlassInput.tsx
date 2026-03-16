import React from 'react';

interface Props {
  label?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
  className?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function GlassInput({ 
  label, 
  as = 'input', 
  className = '', 
  children, 
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  ...props 
}: Props) {
  const Component = as;
  
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-sub ml-1">{label}</label>}
      <Component
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-neon-primary/30 focus:border-neon-primary/50 transition-all ${className}`}
        value={value}
        onChange={onChange as any}
        placeholder={placeholder}
        type={as === 'input' ? type : undefined}
        required={required}
        disabled={disabled}
        {...props}
      >
        {children}
      </Component>
    </div>
  );
}
