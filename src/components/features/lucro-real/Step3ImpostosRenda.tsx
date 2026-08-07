"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { Check } from "lucide-react";
import { useState } from "react";

export function Step3ImpostosRenda() {
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const regimeApuracao = useLucroRealStore((state) => state.regimeApuracaoRenda);
  const setRegimeApuracao = useLucroRealStore((state) => state.setRegimeApuracaoRenda);
  const impostosRenda = useLucroRealStore((state) => state.impostosRendaMeses);
  const setImpostosRenda = useLucroRealStore((state) => state.setImpostosRendaMeses);

  const [notification, setNotification] = useState<string | null>(null);

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^\d,-]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const updateImpostoField = (index: number, field: 'irpj' | 'csll', value: string) => {
    const updated = [...impostosRenda];
    updated[index] = { ...updated[index], [field]: value };
    setImpostosRenda(updated);
  };

  const totalIrpj = impostosRenda.reduce((acc, curr) => acc + parseCurrency(curr.irpj), 0);
  const totalCsll = impostosRenda.reduce((acc, curr) => acc + parseCurrency(curr.csll), 0);
  const totalRendaGeral = totalIrpj + totalCsll;

  const handleSalvar = () => {
    setNotification("Valores de IRPJ e CSLL salvos com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExcluir = () => {
    const reset = impostosRenda.map(m => ({ ...m, irpj: "R$ 0,00", csll: "R$ 0,00" }));
    setImpostosRenda(reset);
    setNotification("Valores de IRPJ e CSLL zerados com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl mx-auto pb-40">
      
      {/* Toast de Notificação */}
      {notification && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-[#025ca4] uppercase tracking-wider mb-1">
          3. Impostos sobre a Renda (IRPJ e CSLL)
        </h2>
        <p className="text-slate-500 text-sm">
          Informe a modalidade de apuração do Lucro Real e os valores recolhidos segundo a DRE / LALUR da empresa.
        </p>
      </div>

      <div className="space-y-6">

        {/* Modalidade de Apuração do Lucro Real */}
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Modalidade de Apuração do Lucro Real
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione a forma como a empresa apura e recolhe o IRPJ e a CSLL durante o ano-calendário.
              </p>
            </div>
            <span className="bg-blue-100 text-[#025ca4] border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
              Regime: Lucro Real
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setRegimeApuracao('estimativa_mensal')}
              className={`p-4 rounded-xl border text-left transition-all ${
                regimeApuracao === 'estimativa_mensal'
                  ? 'border-[#025ca4] bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#025ca4]">Estimativa Mensal</span>
                <input
                  type="radio"
                  name="regimeApuracao"
                  checked={regimeApuracao === 'estimativa_mensal'}
                  onChange={() => setRegimeApuracao('estimativa_mensal')}
                  className="text-[#025ca4]"
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Recolhimentos mensais por estimativa ou balancetes de suspensão/redução, com ajuste anual em 31/Dez.
              </p>
            </button>

            <button
              onClick={() => setRegimeApuracao('trimestral')}
              className={`p-4 rounded-xl border text-left transition-all ${
                regimeApuracao === 'trimestral'
                  ? 'border-[#025ca4] bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#025ca4]">Lucro Real Trimestral</span>
                <input
                  type="radio"
                  name="regimeApuracao"
                  checked={regimeApuracao === 'trimestral'}
                  onChange={() => setRegimeApuracao('trimestral')}
                  className="text-[#025ca4]"
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Apuração encerrada e definitiva em 31/Mar, 30/Jun, 30/Set e 31/Dez.
              </p>
            </button>

            <button
              onClick={() => setRegimeApuracao('anual')}
              className={`p-4 rounded-xl border text-left transition-all ${
                regimeApuracao === 'anual'
                  ? 'border-[#025ca4] bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#025ca4]">Lucro Real Anual</span>
                <input
                  type="radio"
                  name="regimeApuracao"
                  checked={regimeApuracao === 'anual'}
                  onChange={() => setRegimeApuracao('anual')}
                  className="text-[#025ca4]"
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Apuração única no encerramento do exercício em 31 de dezembro.
              </p>
            </button>
          </div>
        </div>

        {/* Resumo Consolidado */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Total IRPJ (Ano)</span>
            <span className="text-xl font-bold text-[#025ca4]">{formatCurrency(totalIrpj)}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Total CSLL (Ano)</span>
            <span className="text-xl font-bold text-[#025ca4]">{formatCurrency(totalCsll)}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-700 block mb-1">Total Impostos da Renda</span>
            <span className="text-xl font-black text-red-600">{formatCurrency(totalRendaGeral)}</span>
          </div>
        </div>

        {/* Digitação Mês a Mês */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Valores Informados da DRE / Balancetes (Mês a Mês)
            </h3>
            <span className="text-xs text-slate-500">
              Insira os valores em R$ apurados para cada período
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {impostosRenda.map((m, idx) => {
              const irpjNum = parseCurrency(m.irpj);
              const csllNum = parseCurrency(m.csll);
              const totalMes = irpjNum + csllNum;

              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800">{m.mes}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {m.competencia}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        IRPJ (R$)
                      </label>
                      <input
                        type="text"
                        value={m.irpj}
                        onChange={(e) => updateImpostoField(idx, 'irpj', e.target.value)}
                        placeholder="R$ 0,00"
                        className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        CSLL (R$)
                      </label>
                      <input
                        type="text"
                        value={m.csll}
                        onChange={(e) => updateImpostoField(idx, 'csll', e.target.value)}
                        placeholder="R$ 0,00"
                        className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-medium">Total Renda ({m.mes}):</span>
                    <span className="text-xs font-bold text-red-600">{formatCurrency(totalMes)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Espaçador para garantir visão 100% livre acima da barra fixa de ações */}
      <div className="h-44 w-full shrink-0" />

      {/* Barra Inferior Fixa de Ações - Estilo Lucro Presumido */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 px-8 flex justify-center items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <button
          onClick={() => setCurrentStep(2)}
          className="bg-[#eaeff5] hover:bg-[#dfe6ee] text-[#475569] text-sm font-semibold px-6 py-2.5 rounded-lg border border-slate-300/60 shadow-xs transition-all cursor-pointer"
        >
          Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Imprimir
        </button>
        <button
          onClick={handleSalvar}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Salvar Diagnóstico
        </button>
        <button
          onClick={handleExcluir}
          className="bg-[#e50000] hover:bg-[#cc0000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Excluir Dados
        </button>
        <button
          onClick={() => setCurrentStep(4)}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Avançar para Configuração de Alíquotas
        </button>
      </div>

    </div>
  );
}
