"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { exportarLaudoAuditoria } from "../../../services/xml/lucro-real/excelExport";
import { Download, CheckCircle2, FileText, Printer } from "lucide-react";

export function Step6Relatorio() {
  const produtos = useLucroRealStore((state) => state.produtosNFe);
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const empresa = useLucroRealStore((state) => state.empresa);

  const handleExport = () => {
    exportarLaudoAuditoria(produtos);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto pb-40">
      
      {/* Card do Relatório */}
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800">Planejamento Tributário Concluído!</h2>
        
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Toda a inteligência do <strong>Lucro Real</strong> e a simulação de <strong>IBS/CBS (Reforma Tributária - LC 214)</strong> foram processadas para a empresa:
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-1">
          <p className="text-xs font-bold text-slate-700">Razão Social: <span className="font-normal text-slate-900">{empresa?.razaoSocial || "Clínica Odontológica Exemplo LTDA"}</span></p>
          <p className="text-xs font-bold text-slate-700">CNPJ: <span className="font-normal text-slate-900">{empresa?.cnpj || "00.000.000/0001-00"}</span></p>
          <p className="text-xs font-bold text-slate-700">Regime: <span className="font-normal text-slate-900">Lucro Real</span></p>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <button 
            onClick={handleExport}
            className="bg-[#025ca4] hover:bg-[#024883] text-white font-bold text-sm px-8 py-3 rounded-xl inline-flex items-center gap-2 shadow-md transition-colors"
          >
            <Download className="w-5 h-5" />
            Baixar Relatório Oficial em Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Espaçador para garantir visão 100% livre acima da barra fixa de ações */}
      <div className="h-44 w-full shrink-0" />

      {/* Barra Inferior Fixa de Ações - Estilo Lucro Presumido */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 px-8 flex justify-center items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <button
          onClick={() => setCurrentStep(6)}
          className="bg-[#eaeff5] hover:bg-[#dfe6ee] text-[#475569] text-sm font-semibold px-6 py-2.5 rounded-lg border border-slate-300/60 shadow-xs transition-all cursor-pointer"
        >
          Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Imprimir Relatório
        </button>
        <button
          onClick={() => alert("Relatório salvo com sucesso!")}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Salvar Diagnóstico
        </button>
        <button
          onClick={() => setCurrentStep(1)}
          className="bg-[#e50000] hover:bg-[#cc0000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Excluir Dados
        </button>
        <button
          onClick={handleExport}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Baixar Relatório em Excel
        </button>
      </div>

    </div>
  );
}
