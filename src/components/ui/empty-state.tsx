import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  variant?: 'card' | 'inline';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'card',
  className
}: EmptyStateProps) {
  const content = (
    <>
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div>
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          )}
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={cn("text-center py-12", className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="text-center py-12">
        {content}
      </CardContent>
    </Card>
  );
}