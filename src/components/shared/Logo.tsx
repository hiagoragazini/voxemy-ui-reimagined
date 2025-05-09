
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
        <span className="text-blue-500">V</span>
        <span className="text-blue-500">ox</span>
        <span className="text-blue-600">emy</span>
        <span className="text-blue-400 font-normal text-sm ml-0.5">AI</span>
      </div>
    </Link>
  );
};

export default Logo;
