import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  to, 
  href, 
  onClick,
  type = 'button',
  className = ''
}: ButtonProps) => {
  const baseClasses = variant === 'primary' 
    ? 'btn-primary' 
    : 'btn-secondary';
  
  // Internal link with React Router
  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {children}
      </Link>
    );
  }
  
  // External link
  if (href) {
    return (
      <a 
        href={href} 
        className={`${baseClasses} ${className}`}
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  
  // Button
  return (
    <button 
      type={type} 
      className={`${baseClasses} ${className}`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;