
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-8 h-full min-h-[60vh]">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Oops! A página que você está procurando não foi encontrada.
          </p>
          <Button asChild>
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para o Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
