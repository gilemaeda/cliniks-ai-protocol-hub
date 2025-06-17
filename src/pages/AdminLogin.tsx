
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verifica se já está autenticado
  const checkAuth = () => {
    const adminAuth = localStorage.getItem('cliniks_admin_auth');
    const adminData = localStorage.getItem('cliniks_admin_data');
    return adminAuth === 'authenticated' && adminData;
  };

  useState(() => {
    if (checkAuth()) {
      setIsAuthenticated(true);
    }
  });

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hash da senha para comparação
      const hashedPassword = await hashPassword(password);

      // Buscar o administrador no banco
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !adminData) {
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos.",
          variant: "destructive"
        });
        return;
      }

      // Verificar senha (para o admin temporário, usar a senha hardcoded)
      let isValidPassword = false;
      if (email === 'admin@cliniks.com.br' && password === 'cliniks@2024') {
        isValidPassword = true;
      } else {
        isValidPassword = adminData.password_hash === hashedPassword;
      }

      if (isValidPassword) {
        localStorage.setItem('cliniks_admin_auth', 'authenticated');
        localStorage.setItem('cliniks_admin_data', JSON.stringify({
          id: adminData.id,
          email: adminData.email,
          full_name: adminData.full_name,
          is_master: adminData.is_master
        }));
        
        setIsAuthenticated(true);
        
        toast({
          title: "Login administrativo realizado!",
          description: `Bem-vindo, ${adminData.full_name}!`
        });
        
        navigate('/admin');
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect se já autenticado
  if (isAuthenticated || checkAuth()) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl gradient-text">
                Painel Administrativo
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cliniks IA Portal
              </p>
            </div>
          </div>
          <CardTitle className="text-red-700 dark:text-red-300">Acesso Restrito</CardTitle>
          <CardDescription>
            Entre com suas credenciais administrativas para acessar o painel de controle da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Administrativo
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cliniks.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-red-200 focus:border-red-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha administrativa"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-red-200 focus:border-red-400 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" 
              disabled={loading}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <Shield className="h-4 w-4 mr-2" />
              Entrar no Painel
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ← Voltar ao site principal
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
