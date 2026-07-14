import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`card ${hover ? "card-hover cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export function StatCard({ label, value, subValue, trend, icon }: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-success-600" : trend === "down" ? "text-error-600" : "text-neutral-500";

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {subValue && <p className={`text-sm font-medium mt-1 ${trendColor}`}>{subValue}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

interface BadgeProps {
  variant?: "success" | "error" | "warning" | "neutral" | "info";
  children: ReactNode;
}

export function Badge({ variant = "neutral", children }: BadgeProps) {
  const variants: Record<string, string> = {
    success: "badge-success",
    error: "badge-error",
    warning: "badge-warning",
    neutral: "badge-neutral",
    info: "badge-info",
  };
  return <span className={variants[variant]}>{children}</span>;
}

interface ChangePctProps {
  value: number;
  showIcon?: boolean;
}

export function ChangePct({ value, showIcon = true }: ChangePctProps) {
  const isPositive = value >= 0;
  const color = isPositive ? "text-success-600" : "text-error-600";
  const bg = isPositive ? "bg-success-50" : "bg-error-50";
  const arrow = isPositive ? "▲" : "▼";

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color} ${bg} px-2 py-0.5 rounded-md`}>
      {showIcon && <span className="text-xs">{arrow}</span>}
      {isPositive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
