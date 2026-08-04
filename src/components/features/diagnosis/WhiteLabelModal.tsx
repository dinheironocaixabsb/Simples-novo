import React, { useRef } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { X, Upload, Trash2, Building, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function WhiteLabelModal({ isOpen, onClose }: Props) {
  const { firmData, professionalData, updateFirmData, updateProfessionalData } = useDiagnosisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateFirmData({ logo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    updateFirmData({ logo: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-[800px] max-w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-[#005696] flex items-center gap-2">
            <Building className="w-5 h-5" />
            Configurações do Sistema (White Label)
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dados da Empresa (Consultoria) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#005696]" />
                Dados da Sua Empresa (Consultoria)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Esses dados aparecerão no cabeçalho do Laudo gerado para o cliente atual.
              </p>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Nome da Consultoria / Escritório</label>
                <input 
                  type="text" 
                  value={firmData.nome}
                  onChange={(e) => updateFirmData({ nome: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="Sua Empresa Contábil" 
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">E-mail de Contato</label>
                <input 
                  type="email" 
                  value={firmData.email}
                  onChange={(e) => updateFirmData({ email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="contato@empresa.com.br" 
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={firmData.telefone}
                  onChange={(e) => updateFirmData({ telefone: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="(00) 00000-0000" 
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Endereço Completo</label>
                <input 
                  type="text" 
                  value={firmData.endereco}
                  onChange={(e) => updateFirmData({ endereco: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="Rua Exemplo, 100 - Bairro" 
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Logomarca (Recomendado PNG/JPG até 2MB)</label>
                <div className="flex items-center gap-4">
                  {firmData.logo ? (
                    <div className="relative border p-2 rounded bg-gray-50 flex items-center justify-center w-32 h-16">
                      <img src={firmData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      <button 
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Remover Logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-2">
                      Sem Logo
                    </div>
                  )}
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {firmData.logo ? 'Trocar Logo' : 'Enviar Logo'}
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

            </div>

            {/* Profissional Responsável */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#005696]" />
                Profissional Responsável (Global)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Esses dados persistirão para todos os novos diagnósticos que você criar.
              </p>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={professionalData.nome}
                  onChange={(e) => updateProfessionalData({ nome: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="João da Silva" 
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Cargo / Função</label>
                <input 
                  type="text" 
                  value={professionalData.cargo}
                  onChange={(e) => updateProfessionalData({ cargo: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="Contador Responsável" 
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1">Registro Profissional (Ex: CRC / OAB)</label>
                <input 
                  type="text" 
                  value={professionalData.crc}
                  onChange={(e) => updateProfessionalData({ crc: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[16px] focus:outline-none focus:border-[#005696]" 
                  placeholder="CRC/SP 123456/O" 
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[#005696] hover:bg-[#004a82] text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Salvar e Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
