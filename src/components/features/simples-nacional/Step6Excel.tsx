'use client';

import React, { useState } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { exportSimplesNacionalExcel } from '../../../services/tax-engine/excelExportSimples';
import { useClientStore } from '../../../store/useClientStore';

export function Step6Excel() {
  const { 
    setStep, revenueData, simulationParams, 
    calculationResults, monthlyExpenses, runCalculation
  } = useDiagnosisStore();
  const { 
    activeCompanyData: companyData, 
    activeFirmData: firmData, 
    activeProfessionalData: professionalData,
    activeXmlDespesas: xmlDespesas, 
    activeXmlFaturamento: xmlFaturamento 
  } = useClientStore();
  const [period, setPeriod] = useState('all');
  const [year, setYear] = useState('2026');

  const exportExcel = async () => {
    const monthMap: Record<string, number> = {
      jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
      jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
    };
    const targetMonthIndex = period !== 'all' ? monthMap[period] : -1;
    const filterByMonth = (items: any[]) => {
      if (targetMonthIndex === -1) return items;
      return items.filter(x => {
        if (!x.data) return false;
        const parts = x.data.includes('/') ? x.data.split('/') : x.data.split('-');
        const monthStr = x.data.includes('/') ? parts[1] : parts[1];
        const m = parseInt(monthStr, 10) - 1;
        return m === targetMonthIndex;
      });
    };

    const filteredFaturamento = filterByMonth(xmlFaturamento);
    
    const updatedCalcResults = { ...calculationResults };
    
    // Força o cálculo caso ainda não exista para o(s) mês(es)
    if (targetMonthIndex !== -1) {
      if (!updatedCalcResults[targetMonthIndex]) {
        updatedCalcResults[targetMonthIndex] = runCalculation(targetMonthIndex);
      }
    } else {
      for (let i = 0; i < 12; i++) {
        if (!updatedCalcResults[i] && revenueData[i]?.rba > 0) {
          updatedCalcResults[i] = runCalculation(i);
        }
      }
    }

    const sampleCalc = targetMonthIndex !== -1 
       ? updatedCalcResults[targetMonthIndex] 
       : (updatedCalcResults[0] || Object.values(updatedCalcResults).find(c => c !== null && c !== undefined) || runCalculation(0));
    
    // Fallback numbers if undefined
    const cargaAtual = sampleCalc?.aliqEfetivaPadrao || 0;
    const cargaSemCredito = sampleCalc?.aliqEfetivaPorFora || 0;
    const aliqIbs = (simulationParams?.faturamentoAliquotaIBS || 1) / 100;
    const aliqCbs = (simulationParams?.faturamentoAliquotaCBS || 8.55) / 100;
    const ivaPorFora = aliqIbs + aliqCbs;

    const clientesMap: Record<string, any> = {};
    filteredFaturamento.forEach(x => {
      const tomador = x.tomador || 'Não Informado';
      if (!clientesMap[tomador]) {
         clientesMap[tomador] = {
            nome: tomador,
            regime: x.regime || 'Pessoa Física',
            faturamentoAtual: 0
         };
      }
      clientesMap[tomador].faturamentoAtual += (Number(x.valor) || 0);
    });

    const realImpactoClientes = Object.values(clientesMap).map(ic => {
       const tributosDentroAtual = ic.faturamentoAtual * cargaAtual;
       const custoSemTributos = ic.faturamentoAtual - tributosDentroAtual;
       const novoCustoDentro = custoSemTributos / (1 - cargaSemCredito);
       const novaNfCheia = novoCustoDentro / (1 - ivaPorFora);
       const creditoIbs = novaNfCheia * aliqIbs;
       const creditoCbs = novaNfCheia * aliqCbs;
       const totalCredito = creditoIbs + creditoCbs;
       const novoCustoEfetivoAproveitando = novaNfCheia - totalCredito;
       const variacaoReaisAproveitando = novoCustoEfetivoAproveitando - ic.faturamentoAtual;
       const variacaoPctAproveitando = ic.faturamentoAtual > 0 ? variacaoReaisAproveitando / ic.faturamentoAtual : 0;
       
       const novoCustoEfetivoNaoAproveitando = novaNfCheia;
       const variacaoReaisNaoAproveitando = novoCustoEfetivoNaoAproveitando - ic.faturamentoAtual;
       const variacaoPctNaoAproveitando = ic.faturamentoAtual > 0 ? variacaoReaisNaoAproveitando / ic.faturamentoAtual : 0;

       return {
          ...ic,
          cargaAtual, tributosDentroAtual, custoSemTributos, cargaSemCredito,
          novoCustoDentro, ivaPorFora, novaNfCheia, creditoIbs, creditoCbs,
          novoCustoEfetivoAproveitando, variacaoReaisAproveitando, variacaoPctAproveitando,
          novoCustoEfetivoNaoAproveitando, variacaoReaisNaoAproveitando, variacaoPctNaoAproveitando
       };
    });

    // We already built updatedCalcResults earlier

    await exportSimplesNacionalExcel(
      companyData,
      firmData,
      professionalData,
      xmlFaturamento,
      xmlDespesas,
      updatedCalcResults,
      revenueData,
      monthlyExpenses,
      realImpactoClientes,
      period
    );
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f2937] uppercase tracking-wide">Relatório Analítico em Excel</h1>
        <p className="text-[#6b7280] text-[15px]">Exporte o planejamento tributário completo em formato de planilha (.xlsx) para apresentação ou análise detalhada.</p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] border-t-[5px] border-t-[#005696] p-10 text-center">
        <div className="bg-[rgba(0,86,150,0.1)] text-[#005696] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        
        <h2 className="text-[#005696] text-[24px] font-bold mb-4">Gerar Planilha de Planejamento Tributário</h2>
        <p className="text-gray-500 text-[14.5px] max-w-[600px] mx-auto mb-8 leading-relaxed">
          Gere um arquivo profissional do Excel organizado em abas com toda a memória de cálculo do diagnóstico tributário (Reforma Tributária - LC 214). Ideal para compartilhar com a diretoria, clientes ou auditoria.
        </p>

        <div className="max-w-[600px] mx-auto mb-10 text-left bg-[#fafafa] border border-dashed border-[#e5e7eb] rounded-lg p-6">
          <strong className="text-[#005696] text-[15px] block mb-4 border-b border-[#eaeaea] pb-2">Planilhas inclusas no relatório premium:</strong>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13.5px]">
            <div className="flex items-center gap-2.5">
              <span className="text-[#005696] font-bold text-lg">📄</span>
              <div>
                <strong className="block text-gray-800">1. Identificação do Cliente</strong>
                <span className="block text-[11.5px] text-gray-500">Informações cadastrais e alíquotas do IVA</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#005696] font-bold text-lg">🧾</span>
              <div>
                <strong className="block text-gray-800">2. Faturamento (Notas)</strong>
                <span className="block text-[11.5px] text-gray-500">Notas de faturamento importadas via XML</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#005696] font-bold text-lg">🛒</span>
              <div>
                <strong className="block text-gray-800">3. Despesas (Notas)</strong>
                <span className="block text-[11.5px] text-gray-500">Notas de despesas importadas via XML</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#005696] font-bold text-lg">⚖️</span>
              <div>
                <strong className="block text-gray-800">4. Cenários Tributários</strong>
                <span className="block text-[11.5px] text-gray-500">Análise comparativa Regime por Dentro vs. por Fora</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#005696] font-bold text-lg">📊</span>
              <div>
                <strong className="block text-gray-800">5. Dashboard Comparativo</strong>
                <span className="block text-[11.5px] text-gray-500">Resumo anual e economia mensal detalhada</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#005696] font-bold text-lg">🎯</span>
              <div>
                <strong className="block text-gray-800">6. Impacto por Cliente</strong>
                <span className="block text-[11.5px] text-gray-500">Variação do custo por tomador (Inteligência)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro de Período */}
        <div className="max-w-[600px] mx-auto mb-8 text-left bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-sm">
          <strong className="text-[#005696] text-[14.5px] block mb-4 border-b border-[#eaeaea] pb-2">Opções de Exportação:</strong>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-bold text-gray-500 mb-1.5">Período (Mês):</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full p-2.5 border border-[#e5e7eb] rounded-md text-[13.5px] text-[#005696] bg-white outline-none focus:border-[#75b743]">
                <option value="all">Ano Completo (Relatório Anual)</option>
                <option value="jan">Janeiro</option>
                <option value="fev">Fevereiro</option>
                <option value="mar">Março</option>
                <option value="abr">Abril</option>
                <option value="mai">Maio</option>
                <option value="jun">Junho</option>
                <option value="jul">Julho</option>
                <option value="ago">Agosto</option>
                <option value="set">Setembro</option>
                <option value="out">Outubro</option>
                <option value="nov">Novembro</option>
                <option value="dez">Dezembro</option>
              </select>
            </div>
            <div>
              <label className="block text-[15px] font-bold text-gray-500 mb-1.5">Ano:</label>
              <select value={year} onChange={e => setYear(e.target.value)} className="w-full p-2.5 border border-[#e5e7eb] rounded-md text-[13.5px] text-[#005696] bg-white outline-none focus:border-[#75b743]">
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={exportExcel} className="bg-[#005696] hover:bg-[#004a82] text-white py-4 px-9 font-bold text-[16px] rounded-lg flex items-center justify-center mx-auto gap-2.5 transition-colors shadow-md">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
            <path d="M5.18 4.85a.25.25 0 0 1 .4-.2l2.69 2.02a.25.25 0 0 1 0 .4L5.58 9.09a.25.25 0 0 1-.4-.2V7.72a.25.25 0 0 0-.25-.25H3.25a.25.25 0 0 1-.25-.25V5.91a.25.25 0 0 1 .25-.25H4.93a.25.25 0 0 0 .25-.25V4.85z"/>
          </svg>
          EXPORTAR PLANILHA PREMIUM (.xlsx)
        </button>
      </div>

      {/* Rodapé de Ações */}
      <div className="mt-8 flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200">
        <button 
          onClick={() => setStep(5)}
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-[15px] py-2 px-5 rounded transition-colors shadow-sm"
        >
          Voltar
        </button>
        <button className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[15px] py-2 px-5 rounded transition-colors shadow-sm">
          Excluir Dados
        </button>
        <button 
          onClick={() => setStep(7)}
          className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2 px-5 rounded transition-colors shadow-sm"
        >
          Avançar para Relatório Oficial
        </button>
      </div>
    </div>
  );
}
