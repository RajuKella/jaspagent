import React, {} from "react";
import type { ButtonHTMLAttributes } from "react";

//Defining the fixed type for the button type and its size
type ButtonVariants = "primary" | "secondary" | "danger" | "outline" | "ghost";
type ButtonSize = "lg" | "md" | "sm";

//An inteface is kind of contract for how a component should look
interface LoadingSpinnerProps {
    size? : ButtonSize; // ? means optional and its type is ButtonSize 
    color? : string; // similarly type for the color is string and it is optional
};

//main part of this component where we are adding all the props of button element from html
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariants;
    size? : ButtonSize;
    heightClass?: string;
    widthClass?: string;
    loading?: boolean;
    className?: string;
};

//A helpful spinner component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({size = "md", color = "cuurentColor"}) => {
    //determine the spinner size on the basis of the button size as it will be inside the button
    let spinnerSize = 'h-5 w-5';
    if (size == "sm") spinnerSize = "h-4 w-4";
    if (size=="lg") spinnerSize = "h-6 w-6";

    return(
        <svg
            className={`animate-spin ${spinnerSize} ${color == 'currentColor' ? 'text-current' : color}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            data-testid="loading-spinner" // For testing purposes
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currenColor"
                strokeWidth="4"
            >
            </circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.062 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    )
};

//Main Button Component
const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    widthClass,
    heightClass,
    loading = false,
    className,
    disabled,
    ...rest //capture any other standard button html attribute like onClick , type, etc
}) => {
    const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    whitespace-nowrap
  `;

  // Variant-specific classes
  const variantClasses = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      active:bg-blue-800
    `,
    secondary: `
      bg-gray-400 text-gray-800
      hover:bg-gray-300
      focus:ring-gray-400
      active:bg-gray-400
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
      active:bg-red-800
    `,
    outline: `
      bg-transparent border border-gray-400 text-gray-700
      hover:bg-gray-100
      focus:ring-gray-300
      active:bg-gray-200
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100
      focus:ring-gray-300
      active:bg-gray-200
    `,
  };
  // Size-specific classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Disabled state classes
  const disabledClasses = `
    opacity-50 cursor-not-allowed
    pointer-events-none
  `;

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    heightClass,
    (disabled || loading) ? disabledClasses : "",
    className
  ].filter(Boolean).join(" "); //the filter(Boolean) part removes all empty strings and undefined part

  return(
    <button
        className={combinedClasses}
        disabled={disabled || loading}
        aria-busy={loading ? 'true' : 'false'}
        {...rest}
    >
        {loading ? (
            <LoadingSpinner
                size={size}
                color= {variant === "primary" || variant === "danger" ? "text-white" : "text-current"}
            />
        ) : (
            children
        )}
    </button>
  )

};


export default Button;