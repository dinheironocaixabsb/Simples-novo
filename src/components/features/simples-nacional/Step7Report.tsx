import React, { useState, useRef } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { FileText, Copy, CheckCircle2, ChevronRight, Download, Printer } from 'lucide-react';

export function Step7Report() {
  const { companyData, revenueData, simulationParams, xmlDespesas, xmlFaturamento, setStep, calculationResults, currentMonth, monthlyExpenses, firmData, professionalData } = useDiagnosisStore();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const results = calculationResults[currentMonth];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };
  
  const formatPercent4 = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  };

  if (!results) {
    return (
      <div className="w-full text-center p-12">
        <p className="text-gray-500 mb-4">Os resultados não foram calculados para o mês atual.</p>
        <button onClick={() => setStep(5)} className="bg-[#005696] text-white px-4 py-2 rounded">Ir para Dashboard</button>
      </div>
    );
  }

  const currentExpenseObj = monthlyExpenses[currentMonth];
  const totalExpenses = currentExpenseObj ? (currentExpenseObj.imoveis + currentExpenseObj.aluguel + currentExpenseObj.iptu + currentExpenseObj.luz + currentExpenseObj.agua + currentExpenseObj.telefone + currentExpenseObj.internet + currentExpenseObj.prestadores + currentExpenseObj.seguros + currentExpenseObj.marketing + currentExpenseObj.viagens + currentExpenseObj.depreciacao + currentExpenseObj.despesasGerais + currentExpenseObj.financeiros) : 0;

  const veredito = results.diferenca >= 0 
    ? 'A apuração do IBS e CBS por fora do DAS (Regime Regular) gera ECONOMIA tributária, sendo a opção recomendada.'
    : 'A manutenção do recolhimento unificado do IBS e CBS no DAS (Regime Simplificado) é mais vantajosa (menos custosa).';

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      // Import dinâmico para evitar o erro "self is not defined" no SSR (Next.js)
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin:       10,
        filename:     `Laudo_Tributario_${companyData.cnpj || 'Empresa'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    // Calcula B2B vs B2C
    let proporcaoReal = "Não identificado (Simulação manual sem XMLs). Assumindo 100% de clientes B2B (empresas corporativas tomadoras de crédito) para efeito desta simulação.";
    
    if (xmlFaturamento.length > 0) {
      let b2bSum = 0;
      let b2cSum = 0;
      xmlFaturamento.forEach(xml => {
        if (xml.regime === 'Lucro Real' || xml.regime === 'Lucro Presumido') {
          b2bSum += xml.valor;
        } else {
          b2cSum += xml.valor;
        }
      });
      const total = b2bSum + b2cSum;
      if (total > 0) {
        const pctB2B = Math.round((b2bSum / total) * 100);
        const pctB2C = Math.round((b2cSum / total) * 100);
        proporcaoReal = `${pctB2B}% B2B (Clientes em Lucro Real/Presumido que aproveitam e exigem crédito de IBS/CBS) e ${pctB2C}% B2C/Simples (Clientes Pessoas Físicas ou empresas do Simples Nacional que NÃO tomam crédito de IBS/CBS).`;
      }
    }

    // Projeção Anual (Mês Analisado x 12)
    const annualFaturamento = (revenueData[currentMonth]?.rba || 0) * 12;
    const annualC1 = results.valorDasPadraoTotal * 12;
    const annualDAS2 = results.valorDasPorForaTotal * 12;
    const annualIVA2 = results.saldoIva * 12;
    const annualCustoEfetivoC2 = results.custoEfetivoPorFora * 12;
    const annualEconomia = results.diferenca * 12;
    const annualDespesas = totalExpenses * 12;

    let annualMetaDespesas = 0;
    const custoExtraBruto = (annualDAS2 + annualIVA2) - annualC1;
    const baseCreditoMensal = totalExpenses;
    if (custoExtraBruto > 0 && baseCreditoMensal > 0) {
      annualMetaDespesas = results.metaDespesas * 12;
    }

    const promptText = `Atue como um Consultor Tributário Sênior especializado na Reforma Tributária do Simples Nacional (LC 214/2025). 
Escreva um Plano Estratégico Tributário formal, claro, sem jargões jurídicos complexos, direcionado ao proprietário da empresa.

Dados da Empresa Analisada:
- Razão Social: ${companyData.razaoSocial || 'Não informada'}
- CNPJ: ${companyData.cnpj || 'Não informado'}
- CNAE Principal: ${companyData.cnaePrincipal || 'Não informado'}
- Ano da Simulação: ${simulationParams.anoSimulacao}

Cenário Selecionado para Análise no Laudo:
- Faturamento do Período: ${formatCurrency(revenueData[currentMonth]?.rba || 0)}
- Cenário 1 (DAS Unificado): ${formatCurrency(results.valorDasPadraoTotal)} (Transfere ${formatCurrency(results.creditoB2BTotal)} de crédito de IBS/CBS)
- Cenário 2 (Recolhimento Por Fora): ${formatCurrency(results.custoEfetivoPorFora)} (DAS Reduzido + Saldo IVA a Pagar/Credor)
- Despesas Elegíveis a Crédito no Período: ${formatCurrency(totalExpenses)}
- Créditos de Despesas Aproveitados (IBS/CBS): ${formatCurrency(results.creditoIbs + results.creditoCbs)}
- Economia Líquida Estimada no Período: ${formatCurrency(results.diferenca)}
- Veredito Técnico do Laudo: "${veredito}"

Consolidado Anual Estimado (Base Projetada x12):
- Faturamento Anual: ${formatCurrency(annualFaturamento)}
- Cenário 1 (DAS Unificado): ${formatCurrency(annualC1)}
- Cenário 2 (Recolhimento Por Fora): ${formatCurrency(annualCustoEfetivoC2)} (DAS Reduzido de ${formatCurrency(annualDAS2)} + Saldo IVA de ${formatCurrency(annualIVA2)})
- Economia Líquida Anual: ${formatCurrency(annualEconomia)}
- Total de Despesas Elegíveis a Crédito no Ano: ${formatCurrency(annualDespesas)}
- Ponto de Equilíbrio das Despesas (Break-Even Anual): ${formatCurrency(annualMetaDespesas)}
- Perfil Fiscal Estimado dos Clientes (com base nos XMLs de Venda): ${proporcaoReal}

Diretrizes para Redação do Relatório Estratégico Tributário:
1. Apresente uma introdução amigável e de fácil leitura explicando os impactos práticos da Reforma Tributária (Lei Complementar 214/2025) no nicho de mercado e atividade da empresa.
2. Analise a viabilidade financeira da opção pelo regime "Por Fora" baseando-se no Break-Even anual, na economia tributária acumulada e na carteira de clientes PJ.
3. Proponha ações comerciais específicas para não perder os clientes que NÃO aproveitam créditos de IBS/CBS (ex: pessoas físicas ou pequenos negócios do Simples Nacional), buscando contrabalancear o diferencial de preço.
4. Explique de forma didática se a divisão de CNPJs (cisão) ou estratégias de precificação são adequadas com base na proporção real de vendas B2B vs B2C.
5. Conclua com um plano de ação claro, listando os prazos legais cruciais (como o período de opção de 01 a 30 de setembro de 2026, conforme a Resolução CGSN nº 186/2026).`;

    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
      alert('Não foi possível copiar automaticamente para a área de transferência.');
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1f2937] uppercase tracking-wide">7. Relatório Oficial</h1>
          <p className="text-[#6b7280] text-[15px]">Gere um laudo estratégico e detalhado para apresentar ao seu cliente.</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-[#005696] hover:bg-[#004375] text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Download className="w-5 h-5" />
          )}
          {isGenerating ? 'Gerando PDF...' : 'Gerar Laudo PDF'}
        </button>
      </div>

      {/* Report Preview */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden relative">
        <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Visualização da Impressão</div>
        
        {/* Printable Area */}
        <div ref={reportRef} className="p-10 bg-white text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* Cabeçalho White Label */}
          <div className="flex justify-between items-start border-b-2 border-[#005696] pb-6 mb-8">
            <div>
              {firmData.logo ? (
                <img src={firmData.logo} alt="Logo Consultoria" className="h-16 object-contain mb-4" />
              ) : (
                <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400 mb-4">Sem Logo</div>
              )}
              <h2 className="font-black text-xl text-[#005696]">{firmData.nome || 'NOME DA CONSULTORIA NÃO INFORMADO'}</h2>
              <p className="text-sm text-gray-600">{firmData.endereco}</p>
              <p className="text-sm text-gray-600">Tel: {firmData.telefone} | Email: {firmData.email}</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black text-gray-800 uppercase">Laudo Tributário</h1>
              <p className="text-md text-gray-500 mt-1">Reforma Tributária (LC 214)</p>
              <p className="text-sm text-gray-400 mt-2">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="mb-8">
            <h3 className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase text-sm mb-4">1. Identificação do Cliente</h3>
            <div className="grid grid-cols-2 gap-4 px-4 text-sm">
              <div><strong className="text-gray-600">Razão Social:</strong> {companyData.razaoSocial}</div>
              <div><strong className="text-gray-600">CNPJ:</strong> {companyData.cnpj}</div>
              <div><strong className="text-gray-600">CNAE Principal:</strong> {companyData.cnaePrincipal}</div>
              <div><strong className="text-gray-600">Responsável:</strong> {companyData.responsavelReceita}</div>
            </div>
          </div>

          {/* Resumo Técnico IA (Simulado/Estático por enquanto, ou substituído pelo resultado da IA) */}
          <div className="mb-8">
            <h3 className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase text-sm mb-4">2. Parecer Técnico (IA)</h3>
            <div className="px-4 text-sm leading-relaxed text-justify space-y-4">
              <p>Prezado(a) empreendedor(a), com a aprovação da Reforma Tributária (Lei Complementar 214/2025), o Simples Nacional sofreu profundas mudanças estruturais em relação à sistemática de apuração e recolhimento dos novos tributos (IBS e CBS).</p>
              <p>Baseado na análise da competência atual, projetamos que o faturamento da empresa no cenário analisado corresponde a <strong>{formatCurrency(revenueData[currentMonth]?.rba || 0)}</strong>, com despesas elegíveis para crédito estimadas em <strong>{formatCurrency(totalExpenses)}</strong>.</p>
              <p className="font-bold text-[#005696]">{veredito}</p>
            </div>
          </div>

          {/* Comparativo Matemático */}
          <div className="mb-12">
            <h3 className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase text-sm mb-4">3. Memória de Cálculo (Comparativo)</h3>
            <div className="px-4">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="border border-gray-200 p-3">Métrica Analisada</th>
                    <th className="border border-gray-200 p-3 bg-red-50 text-red-900 w-1/3">Cenário 1: Por Dentro (DAS Padrão)</th>
                    <th className="border border-gray-200 p-3 bg-green-50 text-green-900 w-1/3">Cenário 2: Por Fora (IBS/CBS Separado)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">DAS Inicial / Padrão</td>
                    <td className="border border-gray-200 p-3">{formatCurrency(results.valorDasPadraoTotal)}</td>
                    <td className="border border-gray-200 p-3">{formatCurrency(results.valorDasPorForaTotal)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">Alíquota Efetiva Média</td>
                    <td className="border border-gray-200 p-3">{formatPercent4(results.aliqEfetivaPadrao)}</td>
                    <td className="border border-gray-200 p-3">{formatPercent4(results.aliqEfetivaPorFora)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">Débitos IBS/CBS</td>
                    <td className="border border-gray-200 p-3 text-gray-400 text-center">-</td>
                    <td className="border border-gray-200 p-3">{formatCurrency(results.debitoIbs + results.debitoCbs)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">Créditos IBS/CBS</td>
                    <td className="border border-gray-200 p-3 text-gray-400 text-center">-</td>
                    <td className="border border-gray-200 p-3 text-green-700">-{formatCurrency(results.creditoIbs + results.creditoCbs)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">Saldo IVA a Pagar (Guia Separada)</td>
                    <td className="border border-gray-200 p-3 text-gray-400 text-center">-</td>
                    <td className="border border-gray-200 p-3">{formatCurrency(results.saldoIva)}</td>
                  </tr>
                  <tr className="font-bold text-[15px] bg-gray-50">
                    <td className="border border-gray-200 p-3">CUSTO TOTAL EFETIVO</td>
                    <td className="border border-gray-200 p-3">{formatCurrency(results.valorDasPadraoTotal)}</td>
                    <td className="border border-gray-200 p-3">{formatCurrency(results.custoEfetivoPorFora)}</td>
                  </tr>
                </tbody>
              </table>
              <div className={`mt-6 p-4 rounded text-center border font-bold text-lg ${results.diferenca >= 0 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                {results.diferenca >= 0 ? 'ECONOMIA COM O REGIME POR FORA: ' : 'PREJUÍZO COM O REGIME POR FORA: '}
                {formatCurrency(Math.abs(results.diferenca))}
              </div>
            </div>
          </div>

          {/* Assinatura */}
          <div className="mt-20 pt-8 flex justify-center text-center">
            <div className="w-1/2">
              <div className="border-t border-gray-800 mb-2"></div>
              <p className="font-bold text-gray-800">{professionalData.nome || 'Profissional Responsável'}</p>
              <p className="text-sm text-gray-600">{professionalData.cargo || 'Consultor Tributário'}</p>
              {professionalData.crc && <p className="text-sm text-gray-600">Registro: {professionalData.crc}</p>}
            </div>
          </div>

        </div>
      </div>

      {/* Ação de IA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
          <FileText className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-bold mb-2">Gerar Relatório Estratégico com IA</h3>
          <p className="text-blue-100 mb-6">
            O sistema gerará um super prompt formatado (em Markdown) contendo todos os dados, números e cálculos complexos já mastigados. 
            Basta copiar e colar no ChatGPT, Gemini ou Claude para gerar um Laudo Estratégico completo e persuasivo para o seu cliente!
          </p>
          
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-bold transition-all shadow-sm"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copiado para Área de Transferência!' : 'Copiar Prompt Inteligente para IA'}
          </button>
        </div>
      </div>

      {/* Rodapé de Ações */}
      <div className="mt-8 flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200">
        <button 
          onClick={() => setStep(6)}
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-[15px] py-2 px-5 rounded transition-colors shadow-sm"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
