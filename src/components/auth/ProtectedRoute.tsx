
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Se ainda está carregando, mostramos um indicador de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-violet-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Se o usuário não está autenticado, redirecionamos para a página de login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Se o usuário está autenticado, renderizamos o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
