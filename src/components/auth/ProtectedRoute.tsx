
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Como não precisamos mais de autenticação, retornamos diretamente o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;
