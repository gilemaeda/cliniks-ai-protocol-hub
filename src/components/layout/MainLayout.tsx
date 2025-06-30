import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClinic } from '@/contexts/ClinicContext';

const PLAN_COLORS: Record<string, string> = {
  bronze: 'bg-yellow-700 text-white',
  prata: 'bg-gray-400 text-white',
  ouro: 'bg-yellow-400 text-white',
};

type MainLayoutProps = {
  children?: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { clinic, loading } = useClinic();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: clinic?.brand_colors?.background || '#18181b',
        transition: 'background-color 0.3s',
      }}
    >
      {/* Header global */}
      <header
        className="shadow-md"
        style={{
          background: clinic?.brand_colors?.header
            ? clinic.brand_colors.header
            : 'linear-gradient(to right, #1e40af, #6d28d9, #be185d)',
          transition: 'background 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex flex-row justify-between items-center py-2 gap-2 min-h-[56px]">
            {/* Logotipo Cliniks IA */}
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/ed86d62a-a928-44f7-8e5f-ec4200aedbb3.png"
                alt="Cliniks IA Logo"
                className="h-10 w-10 rounded-full bg-white shadow-md object-contain border-2 border-pink-400 p-1"
              />
              <div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="text-xl font-extrabold text-white drop-shadow-md tracking-tight hover:underline focus:outline-none"
                    title="Voltar para o Dashboard"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    {clinic?.name || 'Cliniks IA'}
                  </button>
                  {clinic?.plan && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shadow ml-1 ${PLAN_COLORS[clinic.plan] || 'bg-gray-200 text-gray-800'}`}
                      title={`Plano ${clinic.plan.charAt(0).toUpperCase() + clinic.plan.slice(1)}`}
                    >
                      <span className="capitalize">{clinic.plan}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/80 font-medium">Plataforma Cliniks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Área de perfil clicável */}
              <button
                className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1 shadow-md hover:bg-white/90 transition cursor-pointer group"
                onClick={() => {
                  if (profile?.role === 'clinic_owner') {
                    window.location.href = '/configuracao-clinica';
                  } else {
                    window.location.href = '/configuracao-profissional';
                  }
                }}
                title="Ir para configurações"
              >
                <Avatar className="h-9 w-9 ring-2 ring-pink-400">
                  <AvatarImage src={clinic?.logo_url} alt={clinic?.name} className="object-contain" />
                  <AvatarFallback>{profile?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-base font-bold text-gray-900 leading-tight">{profile?.full_name}</p>
                  <Badge variant="secondary" className="mt-0.5 text-[10px] px-2 py-0.5">
                    {profile?.role === 'clinic_owner' ? 'Proprietário' : 'Profissional'}
                  </Badge>
                </div>
                <span className="ml-2 text-gray-500 group-hover:text-pink-600 transition">
                  {/* Ícone engrenagem */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7.94-2.34a1 1 0 0 0 .25-1.09l-1-1.73a1 1 0 0 1 0-.94l1-1.73a1 1 0 0 0-.25-1.09l-2-2a1 1 0 0 0-1.09-.25l-1.73 1a1 1 0 0 1-.94 0l-1.73-1a1 1 0 0 0-1.09.25l-2 2a1 1 0 0 0-.25 1.09l1 1.73a1 1 0 0 1 0 .94l-1 1.73a1 1 0 0 0 .25 1.09l2 2a1 1 0 0 0 1.09.25l1.73-1a1 1 0 0 1 .94 0l1.73 1a1 1 0 0 0 1.09-.25l2-2Z"/></svg>
                </span>
              </button>
              {/* Botão sair pequeno */}
              <Button variant="ghost" size="icon" className="rounded-full p-2 text-white hover:bg-pink-700/80" onClick={signOut} title="Sair">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner global - Agora fora do fluxo principal para ser full-width */}
      {clinic?.banner_url && (
        <div className="w-full h-[140px] bg-gray-900">
          <img
            src={clinic.banner_url} // O context já trata a URL
            alt="Banner da Clínica"
            className="w-full h-full object-cover object-top"
          />
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children ? children : <Outlet />}
      </main>
    </div>
  );
}
