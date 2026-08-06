'use client';

import React, { useState } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import * as XLSX from 'xlsx';
import { useClientStore } from '../../../store/useClientStore';

export function Step6Excel() {
  const { 
    setStep, revenueData, simulationParams, 
    calculationResults, monthlyExpenses
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

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Identificação do Cliente + White Label
    const identificacaoData = [
      { Categoria: 'CLIENTE', Campo: 'Razão Social', Valor: companyData.razaoSocial },
      { Categoria: 'CLIENTE', Campo: 'CNPJ', Valor: companyData.cnpj },
      { Categoria: 'CLIENTE', Campo: 'CNAE Principal', Valor: companyData.cnaePrincipal },
      { Categoria: 'CONSULTORIA', Campo: 'Nome', Valor: firmData.nome },
      { Categoria: 'CONSULTORIA', Campo: 'E-mail', Valor: firmData.email },
      { Categoria: 'CONSULTORIA', Campo: 'Telefone', Valor: firmData.telefone },
      { Categoria: 'PROFISSIONAL', Campo: 'Nome', Valor: professionalData.nome },
      { Categoria: 'PROFISSIONAL', Campo: 'Registro (CRC)', Valor: professionalData.crc },
    ];
    const ws1 = XLSX.utils.json_to_sheet(identificacaoData);
    if (ws1['!ref']) ws1['!autofilter'] = { ref: ws1['!ref'] };
    XLSX.utils.book_append_sheet(wb, ws1, "1. Identificação");

    // 2. Faturamento (XMLs se disponíveis)
    let ws2;
    if (xmlFaturamento.length > 0) {
      ws2 = XLSX.utils.json_to_sheet(xmlFaturamento.map(x => ({
        Emissão: x.data,
        Nota: x.numero,
        CNPJ_Cliente: x.cnpj,
        Nome_Cliente: x.tomador,
        Valor: x.valor,
        Regime_Tributário: x.regime,
      })));
    } else {
      ws2 = XLSX.utils.json_to_sheet([{ Nota: 'Sem notas de faturamento importadas via XML' }]);
    }
    if (ws2['!ref']) ws2['!autofilter'] = { ref: ws2['!ref'] };
    XLSX.utils.book_append_sheet(wb, ws2, "2. Faturamento (Notas)");

    // 3. Despesas (XMLs e Manuais)
    let ws3;
    if (xmlDespesas.length > 0) {
      ws3 = XLSX.utils.json_to_sheet(xmlDespesas.map(x => ({
        Fornecedor: x.fornecedor,
        CNPJ_Fornecedor: x.cnpj,
        Data: x.data,
        Valor: x.valor,
        Regime_Tributário: x.regime,
        Natureza_Operação: x.tipoDespesa,
        IBS_Destacado: 0,
        CBS_Destacado: 0,
        Origem: x.fileName === 'Lançamento Manual' ? 'Manual' : 'XML Importado'
      })));
    } else {
      ws3 = XLSX.utils.json_to_sheet([{ Nota: 'Sem despesas importadas ou lançadas' }]);
    }
    if (ws3['!ref']) ws3['!autofilter'] = { ref: ws3['!ref'] };
    XLSX.utils.book_append_sheet(wb, ws3, "3. Despesas (Analítico)");

    // 4. Cenários Mensais (Consolidado)
    const cenariosData = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 0; i < 12; i++) {
      const result = calculationResults[i];
      if (result) {
        cenariosData.push({
          Mês: months[i],
          Faturamento: revenueData[i]?.rba || 0,
          Despesas_Elegíveis: monthlyExpenses[i]?.despesaGeral || 0, // Simplified for brevity
          Custo_DAS_Padrao: result.valorDasPadraoTotal,
          Custo_Por_Fora_Efetivo: result.custoEfetivoPorFora,
          DAS_Reduzido: result.valorDasPorForaTotal,
          Saldo_IVA_Pagar: result.saldoIva,
          Economia_Mes: result.diferenca,
          Meta_Despesas_BreakEven: result.metaDespesas
        });
      }
    }
    const ws4 = cenariosData.length > 0 
      ? XLSX.utils.json_to_sheet(cenariosData) 
      : XLSX.utils.json_to_sheet([{ Nota: 'Nenhum cálculo efetuado ainda.' }]);
    
    if (ws4['!ref']) ws4['!autofilter'] = { ref: ws4['!ref'] };
    XLSX.utils.book_append_sheet(wb, ws4, "4. Consolidação Cenários");

    XLSX.writeFile(wb, `Planejamento_Tributario_${companyData.razaoSocial || 'Cliente'}.xlsx`);
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f2937] uppercase tracking-wide">Relatório Analítico em Excel</h1>
        <p className="text-[#6b7280] text-[15px]">Exporte o planejamento tributário completo em formato de planilha (.xlsx) para apresentação ou análise detalhada.</p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] border-t-[5px] border-t-[#75b743] p-10 text-center">
        <div className="bg-[rgba(117,183,67,0.1)] text-[#75b743] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
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
              <span className="text-[#75b743] font-bold text-lg">📄</span>
              <div>
                <strong className="block text-gray-800">1. Identificação do Cliente</strong>
                <span className="block text-[11.5px] text-gray-500">Informações cadastrais e alíquotas do IVA</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#75b743] font-bold text-lg">🧾</span>
              <div>
                <strong className="block text-gray-800">2. Faturamento (Notas)</strong>
                <span className="block text-[11.5px] text-gray-500">Notas de faturamento importadas via XML</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#75b743] font-bold text-lg">🛒</span>
              <div>
                <strong className="block text-gray-800">3. Despesas (Notas)</strong>
                <span className="block text-[11.5px] text-gray-500">Notas de despesas importadas via XML</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#75b743] font-bold text-lg">⚖️</span>
              <div>
                <strong className="block text-gray-800">4. Cenários Tributários</strong>
                <span className="block text-[11.5px] text-gray-500">Análise comparativa Regime por Dentro vs. por Fora</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#75b743] font-bold text-lg">📊</span>
              <div>
                <strong className="block text-gray-800">5. Dashboard Comparativo</strong>
                <span className="block text-[11.5px] text-gray-500">Resumo anual e economia mensal detalhada</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#75b743] font-bold text-lg">🎯</span>
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

        <button onClick={exportExcel} className="bg-[#75b743] hover:bg-[#63a035] text-white py-4 px-9 font-bold text-[16px] rounded-lg flex items-center justify-center mx-auto gap-2.5 transition-colors shadow-md">
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
