import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  className,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    fullScreen ? "min-h-screen" : "py-8",
    className
  );
  
  return (
    <div className={containerClasses}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-muted-foreground")} />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}