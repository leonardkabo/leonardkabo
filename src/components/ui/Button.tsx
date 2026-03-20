/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Link, LinkProps } from 'react-router-dom';

interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: LucideIcon;
  isLoading?: boolean;
  children?: React.ReactNode;
}

type ButtonProps = ButtonBaseProps & HTMLMotionProps<'button'> & { to?: never };
type ButtonLinkProps = ButtonBaseProps & HTMLMotionProps<'a'> & { to: string } & Omit<LinkProps, 'children'>;

const MotionLink = motion(Link);

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading,
  children,
  className = '',
  to,
  ...props
}: ButtonProps | ButtonLinkProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none";
  
  const variants = {
    primary: "bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700",
    secondary: "bg-gray-900 text-white shadow-xl shadow-gray-900/10 hover:bg-gray-800",
    outline: "bg-white text-gray-700 border-2 border-gray-100 hover:border-blue-600/20 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-transparent",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-transparent",
    warning: "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border border-transparent",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-xl",
    md: "px-8 py-4 rounded-2xl",
    lg: "px-10 py-5 text-lg rounded-[2rem]",
    icon: "w-12 h-12 rounded-2xl p-0",
  };

  const content = (
    <>
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 16 : 20} className={children ? "mr-2" : ""} />}
          {children}
        </>
      )}
    </>
  );

  const commonProps = {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98, y: 0 },
    className: `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`,
    ...props
  };

  if (to) {
    return (
      <MotionLink
        to={to}
        {...commonProps as any}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button {...commonProps as any}>
      {content}
    </motion.button>
  );
}
