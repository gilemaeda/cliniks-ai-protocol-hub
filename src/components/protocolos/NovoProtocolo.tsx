
// Removido: ProtocoloManual não existe mais

interface NovoProtocoloProps {
  onProtocolCreated: (protocol: any) => void;
}

const NovoProtocolo = ({ onProtocolCreated }: NovoProtocoloProps) => {
  return (
    <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Protocolo manual em desenvolvimento</p>
        </div>
    </div>
  );
};

export default NovoProtocolo;
