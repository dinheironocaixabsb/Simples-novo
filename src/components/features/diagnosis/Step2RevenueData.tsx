'use client';

import React, { useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { AnexoId } from '../../../domain/types/tax.types';
import { Step3SalesXml } from './Step3SalesXml';

export function Step2RevenueData() {
  const { revenueData, updateRevenueData, setStep } = useDiagnosisStore();
  const [activeTab, setActiveTab] = useState<'extrato' | 'xml'>('extrato');

  const handleAnexoToggle = (monthIndex: number, anexo: AnexoId) => {
    const isAtivo = revenueData[monthIndex].anexosAtivos.includes(anexo);
    if (isAtivo) {
      updateRevenueData(monthIndex, { anexosAtivos: revenueData[monthIndex].anexosAtivos.filter(a => a !== anexo) });
    } else {
      updateRevenueData(monthIndex, { anexosAtivos: [...revenueData[monthIndex].anexosAtivos, anexo] });
    }
  };

  const handleAnexoDataChange = (monthIndex: number, anexo: AnexoId, field: string, value: any) => {
    updateRevenueData(monthIndex, {
      anexosData: {
        ...revenueData[monthIndex].anexosData,
        [anexo]: {
          ...revenueData[monthIndex].anexosData[anexo],
          [field]: value
        }
      }
    });
  };

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f2937] tracking-wide">Dados de Receitas</h1>
        <p className="text-[#6b7280] text-[15px]">Preencha as receitas da empresa.</p>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
        <button 
          onClick={() => setActiveTab('extrato')}
          className={`px-6 py-3 font-bold text-[14px] transition-colors rounded-t-lg
            ${activeTab === 'extrato' ? 'bg-white text-[#005696] border-t-2 border-l-2 border-r-2 border-[#005696] mb-[-2px]' : 'bg-[#e5e7eb] text-gray-600 hover:bg-gray-200'}
          `}
        >
          Extrato do Simples Nacional
        </button>
        <button 
          onClick={() => setActiveTab('xml')}
          className={`px-6 py-3 font-bold text-[14px] transition-colors rounded-t-lg
            ${activeTab === 'xml' ? 'bg-white text-[#005696] border-t-2 border-l-2 border-r-2 border-[#005696] mb-[-2px]' : 'bg-[#e5e7eb] text-gray-600 hover:bg-gray-200'}
          `}
        >
          Notas Fiscais de Vendas e Serviços Prestados (XML)
        </button>
      </div>

      <div className="bg-white rounded-b-lg shadow-sm border border-[#e5e7eb] p-6">
        {activeTab === 'extrato' && (
          <div className="flex flex-col gap-6">
            {revenueData.map((monthData, monthIndex) => (
              <div key={monthIndex} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 mb-4 items-end">
                  <div className="pb-2">
                    <h3 className="text-[#0369a1] font-bold text-[16px] inline-block border-b-2 border-[#0369a1] pb-1">
                      Mês: {months[monthIndex]}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-700">Competência</label>
                    <input 
                      type="text" 
                      value={monthData.competencia || ''}
                      onChange={(e) => updateRevenueData(monthIndex, { competencia: e.target.value })}
                      placeholder={`${(monthIndex + 1).toString().padStart(2, '0')}/AAAA`}
                      className="border border-[#d1d5db] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-700">RBT12 (Receita Bruta 12 Meses)</label>
                    <CurrencyInput
                      value={monthData.rbt12}
                      decimalsLimit={2}
                      decimalScale={2}
                      decimalSeparator=","
                      groupSeparator="."
                      onValueChange={(value, name, values) => updateRevenueData(monthIndex, { rbt12: values?.float || 0 })}
                      className="border border-[#d1d5db] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                      placeholder="0,00" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-700">RBA (Receita Bruta Acumulada)</label>
                    <CurrencyInput
                      value={monthData.rba}
                      decimalsLimit={2}
                      decimalScale={2}
                      decimalSeparator=","
                      groupSeparator="."
                      onValueChange={(value, name, values) => updateRevenueData(monthIndex, { rba: values?.float || 0 })}
                      className="border border-[#d1d5db] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                      placeholder="0,00" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-700">RBAA (Receita Ano Anterior)</label>
                    <CurrencyInput
                      value={monthData.rbaa}
                      decimalsLimit={2}
                      decimalScale={2}
                      decimalSeparator=","
                      groupSeparator="."
                      onValueChange={(value, name, values) => updateRevenueData(monthIndex, { rbaa: values?.float || 0 })}
                      className="border border-[#d1d5db] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                      placeholder="0,00" 
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-[13px] font-bold text-[#374151] mb-3 block">
                    Selecione as Atividades (Anexos) do Mês:
                  </label>
                  <div className="flex flex-wrap gap-5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <label key={num} className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={monthData.anexosAtivos.includes(num.toString() as AnexoId)}
                          onChange={() => handleAnexoToggle(monthIndex, num.toString() as AnexoId)}
                          className="w-3.5 h-3.5 text-[#005696] rounded border-gray-300 focus:ring-[#005696]"
                        />
                        Anexo {num === 1 ? 'I' : num === 2 ? 'II' : num === 3 ? 'III' : num === 4 ? 'IV' : 'V'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Blocos Dinâmicos de Anexos */}
                <div className="mt-5 space-y-4">
                  {['1', '2', '3', '4', '5'].map((anexo) => {
                    if (!monthData.anexosAtivos.includes(anexo as AnexoId)) return null;
                    const anexoName = anexo === '1' ? 'I (Comércio)' : anexo === '2' ? 'II (Indústria)' : anexo === '3' ? 'III (Serviços)' : anexo === '4' ? 'IV (Serviços)' : 'V (Serviços)';
                    
                    return (
                      <div key={anexo} className="pt-4 border-t border-gray-100">
                        <div className="mb-3 inline-block border-b-2 border-[#005696] pb-1">
                          <h4 className="text-[#005696] font-bold text-[14px]">
                            Receitas - Anexo {anexoName}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-gray-700">Mercado Interno (R$)</label>
                            <CurrencyInput
                              value={monthData.anexosData[anexo as AnexoId].mercadoInterno}
                              decimalsLimit={2}
                              decimalScale={2}
                              decimalSeparator=","
                              groupSeparator="."
                              onValueChange={(value, name, values) => handleAnexoDataChange(monthIndex, anexo as AnexoId, 'mercadoInterno', values?.float || 0)}
                              className="border border-[#d1d5db] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                              placeholder="0,00" 
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-gray-700">Mercado Externo (R$)</label>
                            <CurrencyInput
                              value={monthData.anexosData[anexo as AnexoId].mercadoExterno}
                              decimalsLimit={2}
                              decimalScale={2}
                              decimalSeparator=","
                              groupSeparator="."
                              onValueChange={(value, name, values) => handleAnexoDataChange(monthIndex, anexo as AnexoId, 'mercadoExterno', values?.float || 0)}
                              className="border border-[#d1d5db] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]" 
                              placeholder="0,00" 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'xml' && (
          <div className="xml-tab-content">
            <Step3SalesXml />
          </div>
        )}
      </div>

      {/* Rodapé de Ações */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center pt-6 mb-4">
        <button 
          onClick={() => setStep(1)}
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-[13px] py-2 px-6 rounded transition-colors shadow-sm"
        >
          Voltar
        </button>
        <button 
          className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[13px] py-2 px-6 rounded transition-colors shadow-sm"
        >
          Imprimir
        </button>
        <button 
          className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[13px] py-2 px-6 rounded transition-colors shadow-sm"
        >
          Salvar Diagnóstico
        </button>
        <button 
          className="bg-[#cc0000] hover:bg-[#a30000] text-white font-bold text-[13px] py-2 px-6 rounded transition-colors shadow-sm"
        >
          Excluir Dados
        </button>
        <button 
          onClick={() => setStep(3)}
          className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[13px] py-2 px-6 rounded transition-colors shadow-sm ml-auto"
        >
          Avançar para Configuração
        </button>
      </div>
    </div>
  );
}
