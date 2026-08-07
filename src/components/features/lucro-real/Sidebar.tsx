"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { Settings, Plus, Trash2, Check, X, Building2, Sliders, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const router = useRouter();
  const currentStep = useLucroRealStore((state) => state.currentStep);
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);

  const clientes = useLucroRealStore((state) => state.clientes);
  const selectedClientId = useLucroRealStore((state) => state.selectedClientId);
  const selectCliente = useLucroRealStore((state) => state.selectCliente);
  const novoCliente = useLucroRealStore((state) => state.novoCliente);
  const salvarClienteAtual = useLucroRealStore((state) => state.salvarClienteAtual);
  const excluirClienteAtual = useLucroRealStore((state) => state.excluirClienteAtual);

  const systemSettings = useLucroRealStore((state) => state.systemSettings);
  const setSystemSettings = useLucroRealStore((state) => state.setSystemSettings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [tempLogoText, setTempLogoText] = useState(systemSettings.logoText);
  const [tempConsultoriaName, setTempConsultoriaName] = useState(systemSettings.consultoriaName);

  const steps = [
    { id: 1, label: "Dados Cadastrais" },
    { id: 2, label: "Dados de Receitas" },
    { id: 3, label: "Impostos sobre a Renda (IRPJ/CSLL)" },
    { id: 4, label: "Configuração de Alíquotas (IBS/CBS)" },
    { id: 5, label: "Despesas e Créditos" },
    { id: 6, label: "Cenários Comparativos" },
    { id: 7, label: "Relatório Oficial" },
  ];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSalvarAtual = () => {
    salvarClienteAtual();
    showToast("Diagnóstico do cliente salvo com sucesso!");
  };

  const handleNovoCliente = () => {
    novoCliente();
    showToast("Novo cliente pronto para cadastro!");
  };

  const handleExcluirCliente = () => {
    excluirClienteAtual();
    showToast("Cliente removido do cadastro.");
  };

  const handleSaveSettings = () => {
    setSystemSettings({ logoText: tempLogoText, consultoriaName: tempConsultoriaName });
    setIsSettingsOpen(false);
    showToast("Configurações do sistema atualizadas!");
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col shadow-xs overflow-hidden z-30">
      
      {/* Toast de Notificação do Sidebar */}
      {notification && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Topo Logo e Configurações */}
      <div className="p-5 border-b border-slate-100 flex flex-col items-center gap-3">
        <div className="bg-slate-100/80 border border-slate-200/80 text-slate-500 w-full py-4 text-center text-sm font-semibold rounded-xl truncate px-2">
          {systemSettings.logoText || "Sua Logo Aqui"}
        </div>
        <button 
          onClick={() => {
            setTempLogoText(systemSettings.logoText);
            setTempConsultoriaName(systemSettings.consultoriaName);
            setIsSettingsOpen(true);
          }}
          className="bg-[#025ca4] hover:bg-[#024883] text-white text-xs py-2 px-4 w-full rounded-full font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Settings className="w-3.5 h-3.5" />
          Configurações do Sistema
        </button>
        <button 
          onClick={() => router.push('/')}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs py-2 px-4 w-full rounded-full font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao Início
        </button>
      </div>

      {/* Diagnóstico de Clientes */}
      <div className="p-5 border-b border-slate-100 space-y-3">
        <p className="text-xs font-bold text-[#025ca4] uppercase tracking-wider">Diagnóstico de Clientes</p>
        <div>
          <select 
            value={selectedClientId}
            onChange={(e) => selectCliente(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#025ca4] truncate"
          >
            {clientes.map((cli) => (
              <option key={cli.id} value={cli.id}>
                {cli.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleSalvarAtual}
            className="flex-1 bg-[#025ca4] hover:bg-[#024883] text-white text-xs font-semibold py-2 rounded-lg text-center transition-colors truncate"
          >
            Salvar Atual
          </button>
          <button 
            onClick={handleNovoCliente}
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold py-2 rounded-lg text-center hover:bg-slate-50 transition-colors truncate"
          >
            Novo Cliente +
          </button>
          <button 
            onClick={handleExcluirCliente}
            className="bg-red-50 text-red-500 border border-red-200 rounded-lg px-2.5 py-2 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
            title="Excluir Cliente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-xl flex items-center gap-2">
           <Check className="w-4 h-4 text-emerald-500 shrink-0" />
           <p className="text-xs text-emerald-600 font-medium leading-tight">Alterações salvas automaticamente</p>
        </div>
      </div>

      {/* Navegação de 7 Passos sem Negrito */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {steps.map((step) => {
          const isActive = currentStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-left leading-snug ${
                isActive 
                  ? "bg-[#025ca4] text-white shadow-md font-semibold" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#025ca4]"
              }`}
            >
              <span>{step.id}. {step.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modal de Configurações do Sistema */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#025ca4]" />
                <h3 className="text-base font-bold text-slate-800">Configurações do Sistema</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Texto da Logo / Empresa Consultoria
                </label>
                <input
                  type="text"
                  value={tempLogoText}
                  onChange={(e) => setTempLogoText(e.target.value)}
                  placeholder="Sua Logo Aqui"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#025ca4]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome da Consultoria Tributária
                </label>
                <input
                  type="text"
                  value={tempConsultoriaName}
                  onChange={(e) => setTempConsultoriaName(e.target.value)}
                  placeholder="TaxAdvisory Consultoria"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#025ca4]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                className="bg-[#025ca4] hover:bg-[#024883] text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors shadow-xs"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
