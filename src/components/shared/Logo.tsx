
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dashboard";
}

const Logo = ({ className = "", size = "md", variant = "default" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const colorClasses = {
    default: {
      main: "text-blue-800",
      end: "text-blue-900",
      suffix: "text-blue-700",
    },
    dashboard: {
      main: "text-violet-600",
      end: "text-violet-700",
      suffix: "text-violet-500",
    },
  };

  const colors = colorClasses[variant];

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]}`}>
        <span className={colors.main}>V</span>
        <span className={colors.main}>ox</span>
        <span className={colors.end}>emy</span>
        <span className={`${colors.suffix} font-normal text-sm ml-0.5`}>AI</span>
      </div>
    </Link>
  );
};

export default Logo;
