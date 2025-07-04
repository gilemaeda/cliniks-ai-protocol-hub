
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/auth/authContext';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, User, Building2 } from 'lucide-react';
import PasswordReset from '@/components/auth/PasswordReset';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  console.log('Auth - Current state:', { user: !!user, authLoading });

  // Verificar se é reset de senha
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setShowPasswordReset(true);
    }
  }, [searchParams]);

  // Redirect if already authenticated and not loading
  useEffect(() => {
    if (user && !authLoading) {
      console.log('Auth - User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-pink-500/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-pink-500/20 p-4">
        <PasswordReset onBack={() => setShowPasswordReset(false)} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log('Auth - Attempting login for:', email);
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Auth - Login error:', error);
          
          // Mensagens de erro mais específicas para login
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Credenciais inválidas",
              description: "Email ou senha incorretos. Verifique e tente novamente.",
              variant: "destructive"
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email não confirmado",
              description: "Por favor, verifique seu email e confirme sua conta antes de fazer login.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro no login",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          console.log('Auth - Login successful');
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo de volta!"
          });
        }
      } else {
        // Validações básicas antes de tentar o cadastro
        if (!email || !password || !fullName) {
          toast({
            title: "Dados incompletos",
            description: "Por favor, preencha todos os campos obrigatórios.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        console.log('Auth - Attempting signup for:', email);
        const { error } = await signUp(email, password, {
          full_name: fullName,
          cpf,
          phone,
          clinic_name: clinicName,
          cnpj,
          role: 'clinic_owner'
        });
        
        if (error) {
          console.error('Auth - Signup error:', error);
          
          // Mensagens de erro mais específicas para cadastro
          if (error.message.includes('already registered')) {
            toast({
              title: "Email já cadastrado",
              description: "Este email já está em uso. Tente fazer login ou recuperar sua senha.",
              variant: "destructive"
            });
          } else if (error.message.includes('password')) {
            toast({
              title: "Senha inválida",
              description: "A senha deve ter pelo menos 6 caracteres.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro no cadastro",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          console.log('Auth - Signup successful');
          toast({
            title: "Cadastro realizado com sucesso!",
            description: "Verifique seu e-mail para confirmar a conta."
          });
          
          // Limpar os campos após cadastro bem-sucedido
          setEmail('');
          setPassword('');
          setFullName('');
          setCpf('');
          setPhone('');
          setClinicName('');
          setCnpj('');
          
          // Opcional: redirecionar para a página de login
          setIsLogin(true);
        }
      }
    } catch (error: unknown) {
      console.error('Auth - Unexpected error:', error);
      
      // Tratamento de erro genérico mais informativo
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ocorreu um erro inesperado. Tente novamente.";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-pink-500/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cliniks IA Portal
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="proprietario" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="proprietario" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Proprietário</span>
              </TabsTrigger>
              <TabsTrigger value="profissional" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profissional</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="proprietario" className="space-y-4">
              <div className="text-center mb-4">
                <CardTitle>{isLogin ? 'Entrar como Proprietário' : 'Cadastrar Clínica'}</CardTitle>
                <CardDescription>
                  {isLogin 
                    ? 'Entre com suas credenciais para acessar o portal'
                    : 'Cadastre sua clínica para começar a usar o portal'
                  }
                </CardDescription>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium">
                        Nome Completo
                      </label>
                      <Input
                        id="fullName"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cpf" className="text-sm font-medium">
                        CPF
                      </label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Telefone
                      </label>
                      <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="clinicName" className="text-sm font-medium">
                        Nome da Clínica <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <Input
                          id="clinicName"
                          placeholder="Nome da sua clínica"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cnpj" className="text-sm font-medium">
                        CNPJ <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin 
                    ? 'Não tem conta? Cadastre-se'
                    : 'Já tem conta? Faça login'
                  }
                </button>
              </div>
            </TabsContent>
            
            <TabsContent value="profissional" className="space-y-4">
              <div className="text-center mb-4">
                <CardTitle>Acesso Profissional</CardTitle>
                <CardDescription>
                  Entre com suas credenciais de profissional
                </CardDescription>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="prof-email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <Input
                    id="prof-email"
                    type="email"
                    placeholder="profissional@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="prof-password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="prof-password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <User className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </form>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
