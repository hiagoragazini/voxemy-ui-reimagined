
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]}`}>
        <span className="bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
          V
        </span>
        <span className="bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
          ox
        </span>
        <span className="text-primary">emy</span>
        <span className="text-blue-500 font-normal text-sm ml-0.5">AI</span>
      </div>
    </Link>
  );
};

export default Logo;
