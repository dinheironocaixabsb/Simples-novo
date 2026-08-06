'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDiagnosisStore } from '../../store/useDiagnosisStore';
import { useClientStore } from '../../store/useClientStore';
import { useLucroPresumidoStore } from '../../store/useLucroPresumidoStore';
import { Check, Settings, Trash2, Upload, ArrowLeft } from 'lucide-react';
import { ImportModal } from '../features/simples-nacional/ImportModal';
import { WhiteLabelModal } from '../features/simples-nacional/WhiteLabelModal';

const STEPS = [
  { id: 1, title: '1. Dados Cadastrais' },
  { id: 2, title: '2. Dados de Receitas' },
  { id: 3, title: '3. Despesas e Créditos (IBS/CBS)' },
  { id: 4, title: '4. Configuração de Alíquotas (Débitos IBS/CBS)' },
  { id: 5, title: '5. Cenários Tributários' },
  { id: 6, title: '6. Relatório em Excel' },
  { id: 7, title: '7. Relatório Oficial' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isSimplesNacional = pathname?.startsWith('/simples-nacional');
  const isLucroPresumido = pathname?.startsWith('/lucro-presumido');
  const isLucroReal = pathname?.startsWith('/lucro-real');
  const isHome = pathname === '/';

  // Usa o store correto para a etapa e navegação
  const { currentStep: stepSimples, setStep: setStepSimples, saveClient: saveSimples } = useDiagnosisStore();
  const { currentStep: stepPresumido, setStep: setStepPresumido, saveClient: savePresumido } = useLucroPresumidoStore();
  
  const currentStep = isLucroPresumido ? stepPresumido : stepSimples;
  const setStep = isLucroPresumido ? setStepPresumido : setStepSimples;
  
  const savedClients = useClientStore(state => state.clients);
  const activeClientId = useClientStore(state => state.activeClientId);
  const companyData = useClientStore(state => state.activeCompanyData);
  const firmData = useClientStore(state => state.activeFirmData);
  const loadClient = useClientStore(state => state.loadClient);
  const deleteClient = useClientStore(state => state.deleteClient);
  const newClient = useClientStore(state => state.newClient);

  const saveClient = () => {
    if (isSimplesNacional) saveSimples();
    else if (isLucroPresumido) savePresumido();
    else {
       // Se for global, apenas salva os dados cadastrais
       useClientStore.getState().saveClient({});
    }
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isWhiteLabelModalOpen, setIsWhiteLabelModalOpen] = useState(false);

  const handleSave = () => {
    if (!companyData.cnpj) {
      alert('Por favor, cadastre a empresa (CNPJ) nos Dados Cadastrais antes de salvar.');
      return false;
    }
    saveClient();
    return true;
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    
    const wantsToSave = confirm('Deseja salvar as alterações do cliente atual antes de mudar de cliente ou criar um novo?');
    if (wantsToSave) {
      const saved = handleSave();
      if (!saved) {
        const proceed = confirm('Deseja descartar os dados atuais não salvos e prosseguir?');
        if (!proceed) {
          e.target.value = activeClientId || '__new__';
          return;
        }
      }
    }

    if (val === '__new__') {
      newClient();
    } else if (val) {
      loadClient(val);
    }
  };

  const handleNewClient = () => {
    const wantsToSave = confirm('Deseja salvar as alterações do cliente atual antes de limpar tudo?');
    if (wantsToSave) {
      const saved = handleSave();
      if (!saved) {
        const proceed = confirm('Deseja descartar os dados atuais não salvos e limpar tudo?');
        if (!proceed) return;
      }
    }
    newClient();
  };

  const handleDelete = () => {
    if (activeClientId && window.confirm('Deseja realmente excluir este diagnóstico?')) {
      deleteClient(activeClientId);
      newClient(); // Clear the form after deletion
    }
  };

  return (
    <aside className="w-[280px] bg-[#f8fafc] border-r border-gray-200 h-screen sticky top-0 flex flex-col shadow-sm z-10 overflow-y-auto">
      {/* Header / Logo */}
      <div className="p-4 flex flex-col items-center border-b border-gray-200">
        {firmData.logo ? (
          <div 
            className="w-full max-w-[160px] h-[60px] flex items-center justify-center mb-3 cursor-pointer"
            onClick={() => setIsWhiteLabelModalOpen(true)}
            title="Clique para alterar a logo"
          >
            <img 
              src={firmData.logo} 
              alt="Logo Consultoria" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        ) : (
          <div 
            onClick={() => setIsWhiteLabelModalOpen(true)}
            className="bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors cursor-pointer w-full max-w-[160px] h-[60px] rounded flex items-center justify-center text-slate-500 text-sm mb-3"
            title="Clique para adicionar sua logo"
          >
            Sua Logo Aqui
          </div>
        )}
        <button 
          onClick={() => setIsWhiteLabelModalOpen(true)}
          className="w-full bg-[#005696] hover:bg-[#004a82] text-white text-[15px] font-medium py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Configurações do Sistema
        </button>
      </div>

      {!isHome && (
        <div className="px-4 pt-4">
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[14px] font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      )}

      {/* Client Manager (For all regimes) */}
      {!isHome && (
        <div className="p-4 pt-0 mb-4">
          <label className="text-[14px] font-bold text-[#005696] uppercase tracking-wider mb-2 block text-center">
            DIAGNÓSTICO DE CLIENTES
          </label>
        <div className="flex gap-2 mb-2">
          <select 
            className="flex-1 text-[15px] border border-gray-300 rounded px-2 py-2 bg-white outline-none font-medium text-gray-700"
            value={activeClientId || '__new__'}
            onChange={handleClientChange}
          >
            <option value="__new__">-- Novo Diagnóstico --</option>
            {savedClients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button 
            type="button"
            onClick={() => {
              if (activeClientId) {
                handleDelete();
              } else {
                if (window.confirm('Deseja limpar todos os dados não salvos da tela?')) {
                  useDiagnosisStore.getState().newClient();
                }
              }
            }}
            title={activeClientId ? "Excluir diagnóstico selecionado" : "Limpar dados da tela"}
            className="w-[34px] h-[34px] flex items-center justify-center bg-[#ffe4e6] text-[#e11d48] rounded border border-[#fecdd3] hover:bg-[#fecdd3] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <button 
            onClick={handleSave}
            className="flex-1 bg-[#005696] hover:bg-[#004a82] text-white text-[15px] font-bold py-1.5 rounded transition-colors shadow-sm"
          >
            Salvar Atual
          </button>
          <button 
            onClick={handleNewClient}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[15px] font-bold py-1.5 rounded transition-colors"
          >
            Novo Cliente +
          </button>
        </div>
        
        <div className="flex items-center gap-2 bg-[#f0fdf4] text-[#166534] text-[14px] font-medium px-3 py-2 rounded border border-[#bbf7d0]">
          <div className="bg-[#22c55e] rounded-sm text-white w-3 h-3 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          Alterações salvas<br/>automaticamente
        </div>
      </div>
      )}

      {/* Navigation */}
      {(isSimplesNacional || isLucroPresumido) && (
        <nav className="flex-1 px-4">
          <ul className="space-y-1.5">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              
              return (
                <li key={step.id}>
                  <button
                    onClick={() => setStep(step.id)}
                    className={`w-full text-left px-4 py-3 text-[15px] rounded-md transition-colors
                      ${isActive 
                        ? 'bg-[#005696] text-white font-bold' 
                        : 'text-[#4b5563] hover:bg-gray-100'}
                    `}
                  >
                    {step.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Footer */}
      {isSimplesNacional && (
        <div className="p-4 mt-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="w-full bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] text-[14px] font-bold py-3 px-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors text-center shadow-sm"
          >
            <Upload className="w-4 h-4" />
            IMPORTAR EXTRATO DO<br/>SIMPLES NACIONAL - PGDAS-D
          </button>
        </div>
      )}

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />

      <WhiteLabelModal 
        isOpen={isWhiteLabelModalOpen} 
        onClose={() => setIsWhiteLabelModalOpen(false)} 
      />
    </aside>
  );
}
