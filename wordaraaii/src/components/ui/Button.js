'use client';

import React from 'react';

const Button = React.forwardRef(({ className, variant = 'primary', children, ...props }, ref) => {
  const baseClasses = "font-semibold transition-transform duration-200 ease-in-out active:scale-95 h-12";
  
  const variantClasses = {
    primary: 'primary-button',
    secondary: 'primary-button', // Use same blue theme for all buttons
    google: 'primary-button'     // Google button also uses blue theme
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
