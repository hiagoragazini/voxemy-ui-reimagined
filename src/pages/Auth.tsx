
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import Logo from '@/components/shared/Logo';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const { signIn, signUp, loading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(loginForm.email, loginForm.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    try {
      await signUp(registerForm.email, registerForm.password, {
        full_name: registerForm.fullName,
      });
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
      setActiveTab('login');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="justify-center" />
          <p className="mt-2 text-muted-foreground">Sua plataforma para gerenciar agentes de voz</p>
        </div>
        
        <Card className="border-border/40 bg-background/95 shadow-lg backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Bem-vindo à Voxemy</CardTitle>
            <CardDescription>
              Entre ou crie uma conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        className="pl-10"
                        type="email"
                        name="email"
                        placeholder="exemplo@email.com"
                        value={loginForm.email}
                        onChange={handleLoginChange}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <a
                        href="#"
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        className="pl-10 pr-10"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Sua senha"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        className="pl-10"
                        type="text"
                        name="fullName"
                        placeholder="Seu nome completo"
                        value={registerForm.fullName}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        className="pl-10"
                        type="email"
                        name="email"
                        placeholder="exemplo@email.com"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        className="pl-10 pr-10"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Crie uma senha forte"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirme a senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        className="pl-10"
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Digite a senha novamente"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="border-border/30 bg-background hover:bg-muted">
                Google
              </Button>
              <Button variant="outline" className="border-border/30 bg-background hover:bg-muted">
                Microsoft
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
