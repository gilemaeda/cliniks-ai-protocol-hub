
import ProtocoloManual from './ProtocoloManual';

interface NovoProtocoloProps {
  onProtocolCreated: (protocol: any) => void;
}

const NovoProtocolo = ({ onProtocolCreated }: NovoProtocoloProps) => {
  return (
    <div className="space-y-6">
      <ProtocoloManual onProtocolCreated={onProtocolCreated} />
    </div>
  );
};

export default NovoProtocolo;
