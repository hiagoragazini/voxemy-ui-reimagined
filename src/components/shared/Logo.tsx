
import Link from "next/link";

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
    <Link href="/" className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]}`}>
        <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
          V
        </span>
        <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
          ox
        </span>
        <span className="text-white">emy</span>
        <span className="text-blue-400 font-normal text-sm ml-0.5">AI</span>
      </div>
    </Link>
  );
};

export default Logo;
