
const PlatformInfo = () => {
  return (
    <div className="mt-16 bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-xl p-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Plataforma Cliniks IA Portal
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
          Uma plataforma completa que integra múltiplas ferramentas especializadas para profissionais da estética, 
          com inteligência artificial avançada e recursos de gestão clínica.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">10+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ferramentas Futuras</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">IA</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Integrada</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tipos de Usuário</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Disponível</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            🚀 A ferramenta "Avaliação Inteligente (IA)" está sendo desenvolvida e será o núcleo da plataforma!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformInfo;
