import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "normal" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    normal: "h-8 w-8",
    large: "h-12 w-12"
  };
  
  const spinnerSize = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.normal;
  
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${spinnerSize}`}></div>
    </div>
  );
};

export { LoadingSpinner };
export default LoadingSpinner;