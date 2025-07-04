
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, Menu, X, Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/auth/authContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/hooks/useClinic';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { clinic, loading, planStatusLabel } = useClinic();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Header - Starting signOut');
      await signOut();
      console.log('Header - SignOut completed, navigating to home');
      navigate('/');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Header - SignOut error:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAdminAccess = () => {
    navigate('/admin-login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-cliniks flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-heading font-bold text-xl gradient-text">
              Cliniks IA Portal
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-sm font-medium hover:text-[#7f00fa] transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-[#7f00fa] transition-colors">
            Planos
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-[#7f00fa] transition-colors">
            Contato
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover:text-[#7f00fa] hover:bg-[#7f00fa]/10">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:text-[#fb0082] hover:bg-[#fb0082]/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleAuth} className="hover:text-[#7f00fa] hover:bg-[#7f00fa]/10">
                  Entrar
                </Button>
                <Button size="sm" className="bg-gradient-cliniks hover:opacity-90" onClick={handleAuth}>
                  Começar Agora
                </Button>
                <Button variant="outline" size="sm" onClick={handleAdminAccess} className="border-[#7f00fa] text-[#7f00fa] hover:bg-[#7f00fa]/10">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col space-y-4">
            <a href="#features" className="text-sm font-medium hover:text-[#7f00fa] transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-[#7f00fa] transition-colors">
              Planos
            </a>
            <a href="#contact" className="text-sm font-medium hover:text-[#7f00fa] transition-colors">
              Contato
            </a>
            <div className="flex flex-col space-y-2 pt-4 border-t">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover:text-[#7f00fa] hover:bg-[#7f00fa]/10">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:text-[#fb0082] hover:bg-[#fb0082]/10">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleAuth} className="hover:text-[#7f00fa] hover:bg-[#7f00fa]/10">
                    Entrar
                  </Button>
                  <Button size="sm" className="bg-gradient-cliniks hover:opacity-90" onClick={handleAuth}>
                    Começar Agora
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAdminAccess} className="border-[#7f00fa] text-[#7f00fa] hover:bg-[#7f00fa]/10">
                    <Shield className="h-4 w-4 mr-2" />
                    Painel Admin
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
