
import { Link, useLocation } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]}`}>
        <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
          V
        </span>
        <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
          ox
        </span>
        {isDashboard ? (
          <span className="text-white">emy</span>
        ) : (
          <span className="text-gray-700">emy</span>
        )}
        <span className="text-blue-400 font-normal text-sm ml-0.5">AI</span>
      </div>
    </Link>
  );
};

export default Logo;
