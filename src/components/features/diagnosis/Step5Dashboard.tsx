'use client';

import React from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { CheckCircle2, XCircle, TrendingUp, Calculator } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPercent4 = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
};

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function Step5Dashboard() {
  const { 
    calculationResults, 
    currentMonth, 
    setCurrentMonth,
    revenueData,
    xmlFaturamento,
    simulationParams,
    runCalculation,
    setStep, 
    xmlDespesas 
  } = useDiagnosisStore();

  React.useEffect(() => {
    // Cálculo automático / real-time
    runCalculation();
  }, [currentMonth, revenueData, xmlDespesas, runCalculation]);

  const results = calculationResults[currentMonth] || {
    rbaTotal: 0,
    valorDasPadraoTotal: 0,
    valorDasPorForaTotal: 0,
    creditoB2BTotal: 0,
    creditoB2BIbsTotal: 0,
    creditoB2BCbsTotal: 0,
    debitoIbs: 0,
    debitoCbs: 0,
    creditoIbs: 0,
    creditoCbs: 0,
    baseCredito: 0,
    saldoIva: 0,
    custoEfetivoPorFora: 0,
    metaDespesas: 0,
    diferenca: 0,
    aliqEfetivaPadrao: 0,
    aliqEfetivaPorFora: 0,
    cargaTributariaPorFora: 0
  };
  const currentExpenses = (revenueData[currentMonth] as any)?.expenses || 0;
  const breakEvenPercentage = results && results.metaDespesas > 0 
    ? Math.min(100, (currentExpenses / results.metaDespesas) * 100) 
    : 0;

  const clientesMap = React.useMemo(() => {
    const map: Record<string, { nome: string; cnpj: string; faturamentoAtual: number; regime: string }> = {};
    const salesNotes = xmlFaturamento.filter(x => x.monthIndex === currentMonth);
    
    salesNotes.forEach(note => {
      if (!note.tomador) return;
      const key = note.cnpj || note.tomador;
      if (!map[key]) {
        map[key] = {
          nome: note.tomador,
          cnpj: note.cnpj,
          faturamentoAtual: 0,
          regime: note.regime || 'Simples Nacional'
        };
      }
      map[key].faturamentoAtual += (note.valor || 0);
    });
    return Object.values(map).sort((a, b) => b.faturamentoAtual - a.faturamentoAtual);
  }, [xmlFaturamento, currentMonth]);

  const aliqIbs = simulationParams.faturamentoAliquotaIBS / 100;
  const aliqCbs = simulationParams.faturamentoAliquotaCBS / 100;
  const ivaTotalEfetivo = aliqIbs + aliqCbs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#005696]">Dashboard de Comparação</h2>
          <p className="text-gray-600">Analise os cenários para o mês selecionado</p>
        </div>
      </div>

      <div className="flex justify-center w-full mb-6">
        <div className="w-full border border-[#005696] rounded-md bg-[#f0f4f4] py-3 flex items-center justify-center gap-3">
          <span className="font-bold text-[#005696] text-sm">Cenário de Análise:</span>
          <select 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="border border-[#005696] rounded-md text-[#005696] font-bold text-sm px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-[#005696]/20 cursor-pointer w-48 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23005696%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_12px_center]"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Cenário 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#005696] overflow-hidden flex flex-col">
            <div className="p-6 pb-2">
              <h3 className="text-xl font-bold text-[#005696]">Cenário 1: Regime Por Dentro</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Impostos recolhidos integralmente na guia DAS</p>
            </div>
            
            <div className="p-6 pt-4 flex-grow flex flex-col">
              {/* Caixa Explicativa */}
              <div className="bg-[#f8f9fa] border border-[#e9ecef] p-5 rounded-md mb-8 min-h-[190px]">
                <strong className="text-[#005696] text-[15px] block mb-3">Características do Regime:</strong>
                <ul className="text-gray-600 text-[12.5px] pl-5 list-disc space-y-2.5 leading-relaxed font-medium">
                  <li><strong className="text-gray-700">Simplicidade:</strong> Pagamento unificado em guia única (DAS).</li>
                  <li><strong className="text-gray-700">Custo "Cheio" (Sem Abatimento):</strong> O imposto incide sobre o faturamento bruto. Não é possível utilizar despesas da sua operação (como insumos, aluguel e energia) para gerar Créditos e reduzir o valor a pagar.</li>
                  <li><strong className="text-gray-700">Impacto Comercial:</strong> Não permite transferir Crédito integral para clientes PJ, reduzindo competitividade no cenário B2B.</li>
                </ul>
              </div>

              <div className="mt-auto space-y-5">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium text-sm">Alíquota Efetiva Padrão:</span>
                  <span className="font-bold text-[#005696] text-lg">{formatPercent4(results.aliqEfetivaPadrao)}</span>
                </div>
                
                <div className="pt-2">
                  <h4 className="text-[15px] text-gray-700 font-bold mb-3">Detalhamento dos Tributos no DAS</h4>
                  <div className="border-t border-gray-200 pt-3">
                    <h5 className="text-[14px] font-bold text-[#005696] mb-2">Totalização</h5>
                    <div className="text-[14px] text-gray-600 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Tributos Consolidados (IRPJ, CSLL, INSS, etc)</span>
                        <span className="text-gray-700">{formatCurrency(results.valorDasPadraoTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                  <div className="bg-[#f8f9fa] rounded-md p-4">
                    <div className="flex items-center font-bold text-[16px] text-gray-800 mb-4 group relative w-max">
                      Crédito Transferido para B2B
                      <span className="ml-2 flex items-center justify-center w-[15px] h-[15px] rounded-full border border-[#005696] text-[#005696] text-[12px] font-bold cursor-help">i</span>
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[280px] bg-white text-gray-700 border border-gray-200 text-[14px] p-3 rounded shadow-lg font-normal leading-relaxed">
                        Valor de IBS e CBS (antigos PIS/Cofins/ICMS/ISS) pago embutido no DAS que o seu cliente Pessoa Jurídica poderá aproveitar como Crédito (Crédito Presumido). Em geral, esse valor é muito baixo em comparação com a transferência integral do regime 'Por Fora'.
                      </div>
                    </div>
                    <div className="flex justify-between text-[14px] text-gray-500 mb-2 pl-4">
                      <span>• Parcela IBS (Regra de Transição)</span>
                      <span className="text-[#005696]">{formatCurrency(results.creditoB2BIbsTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[14px] text-gray-500 mb-4 pl-4">
                      <span>• Parcela CBS (PIS/Cofins)</span>
                      <span className="text-[#005696]">{formatCurrency(results.creditoB2BCbsTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[15px] font-bold border-t border-gray-200 pt-3">
                      <span className="text-gray-800">Total Transferido</span>
                      <span className="text-[#005696]">{formatCurrency(results.creditoB2BTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 pb-2">
                  <span className="font-bold text-[#005696] text-[16px]">Custo Total do Mês (DAS Único):</span>
                  <span className="font-bold text-[#005696] text-xl">{formatCurrency(results.valorDasPadraoTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cenário 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#005696] overflow-hidden flex flex-col">
            <div className="p-6 pb-2">
              <h3 className="text-xl font-bold text-[#005696]">Cenário 2: Regime Por Fora</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Guia DAS Reduzida + Apuração isolada do IVA (IBS/CBS)</p>
            </div>
            
            <div className="p-6 pt-4 flex-grow flex flex-col">
              {/* Caixa Explicativa */}
              <div className="bg-[#f8f9fa] border border-[#e9ecef] p-5 rounded-md mb-8 min-h-[190px]">
                <strong className="text-[#005696] text-[15px] block mb-3">Características do Regime:</strong>
                <ul className="text-gray-600 text-[12.5px] pl-5 list-disc space-y-2.5 leading-relaxed font-medium">
                  <li><strong className="text-gray-700">Custo Líquido (Com Abatimento):</strong> Permite utilizar as despesas da operação para abater o valor do imposto devido, reduzindo o custo final.</li>
                  <li><strong className="text-gray-700">Gestão:</strong> Exige maior controle das notas fiscais de compras e serviços para garantir o aproveitamento dos Créditos.</li>
                  <li><strong className="text-gray-700">Impacto Comercial:</strong> Permite transferir 100% do Crédito (IBS/CBS) para clientes Pessoa Jurídica, tornando seus preços muito mais competitivos em negociações B2B.</li>
                </ul>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium text-sm">Alíquota Efetiva do DAS (Sem IVA):</span>
                  <span className="font-bold text-[#005696] text-lg">{formatPercent4(results.aliqEfetivaPorFora)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium text-sm">1. Valor do DAS Reduzido:</span>
                  <span className="font-bold text-[#005696] text-lg">{formatCurrency(results.valorDasPorForaTotal)}</span>
                </div>
                
                <div className="pt-2 pb-2">
                  <h4 className="text-[15px] text-gray-700 font-bold mb-3">Detalhamento dos Tributos no DAS Reduzido</h4>
                  <div className="border-t border-gray-200 pt-3">
                    <h5 className="text-[14px] font-bold text-[#005696] mb-2">Totalização</h5>
                    <div className="text-[14px] text-gray-600 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Tributos Residuais</span>
                        <span className="text-gray-700">{formatCurrency(results.valorDasPorForaTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-[15px] text-gray-700 font-bold mb-3">Apuração do IVA (IBS + CBS)</h4>
                  <div className="text-[15px] text-gray-700 space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Débito de IBS:</span>
                      <span className="text-[#005696]">{formatCurrency(results.debitoIbs)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Débito de CBS:</span>
                      <span className="text-[#005696]">{formatCurrency(results.debitoCbs)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Base Líquida de crédito de IBS/CBS:</span>
                      <span className="text-[#005696]">{formatCurrency(results.baseCredito)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Crédito de IBS:</span>
                      <span className="text-[#005696]">{formatCurrency(results.creditoIbs)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Crédito de CBS:</span>
                      <span className="text-[#005696]">{formatCurrency(results.creditoCbs)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-700">2. Saldo do IVA <span className="text-[12px] text-gray-400 font-normal uppercase">(A Pagar)</span>:</span>
                      <span className="text-[#005696]">
                        {formatCurrency(results.saldoIva)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-4 pb-2 mt-4">
                  <span className="font-bold text-[#005696] text-[16px]">Custo Efetivo do Mês (1 + 2):</span>
                  <span className="font-bold text-[#005696] text-xl">{formatCurrency(results.custoEfetivoPorFora)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Veredito e Break-even Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Veredito */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Veredito: Qual a melhor opção?</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              O <strong>Cenário {results.diferenca >= 0 ? '2 (Nova Regra - Por Fora)' : '1 (Regra Atual - Por Dentro)'}</strong> é mais vantajoso! Ficar no cenário {results.diferenca >= 0 ? '1' : '2'} geraria um prejuízo de:
            </p>
            
            <div className="flex justify-center mb-8">
              <div className={`px-6 py-2 rounded-md ${results.diferenca >= 0 ? 'bg-green-600' : 'bg-[#e53935]'} text-white text-2xl font-bold`}>
                {formatCurrency(Math.abs(results.diferenca))}
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="mt-2 mb-8 px-4 flex justify-center">
              <div className="flex items-end h-32 gap-12 border-b border-gray-200 pb-2 relative w-[80%] max-w-[300px]">
                {/* Linhas de fundo do gráfico simuladas */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                  <div className="border-t border-gray-400 w-full"></div>
                  <div className="border-t border-gray-400 w-full"></div>
                  <div className="border-t border-gray-400 w-full"></div>
                  <div className="border-t border-gray-400 w-full"></div>
                </div>

                {/* Bar 1: Custo Atual */}
                <div className="flex flex-col items-center justify-end h-full z-10 flex-1">
                  <span className="text-[#005696] font-bold text-[13px] mb-1 whitespace-nowrap">{formatCurrency(results.valorDasPadraoTotal)}</span>
                  <div 
                    className="w-12 bg-[#004375] rounded-t-sm transition-all duration-500" 
                    style={{ height: `${Math.max(10, (results.valorDasPadraoTotal / Math.max(results.valorDasPadraoTotal, results.custoEfetivoPorFora || 1)) * 100)}%` }}
                  ></div>
                  <span className="text-gray-500 text-[12px] mt-2 whitespace-nowrap font-medium">Custo Atual (Dentro)</span>
                </div>

                {/* Bar 2: Custo Novo */}
                <div className="flex flex-col items-center justify-end h-full z-10 flex-1">
                  <span className="text-[#005696] font-bold text-[13px] mb-1 whitespace-nowrap">{formatCurrency(results.custoEfetivoPorFora)}</span>
                  <div 
                    className="w-12 bg-[#005696] rounded-t-sm transition-all duration-500"
                    style={{ height: `${Math.max(10, (results.custoEfetivoPorFora / Math.max(results.valorDasPadraoTotal, results.custoEfetivoPorFora || 1)) * 100)}%` }}
                  ></div>
                  <span className="text-gray-500 text-[12px] mt-2 whitespace-nowrap font-medium">Custo Novo (Fora)</span>
                </div>
              </div>
            </div>

            {/* Análise Financeira */}
            <div className="mt-auto bg-[#f8f9fa] border border-gray-200 border-l-4 border-l-[#004375] p-4 rounded-md">
              <p className="text-[14px] text-gray-700 leading-relaxed mb-3">
                <strong>Análise Financeira:</strong> A carga tributária efetiva sofreria um <strong className="uppercase">
                  {results.diferenca >= 0 ? 'REDUÇÃO' : 'AUMENTO'} de {formatPercent4(Math.abs(results.aliqEfetivaPorFora - results.aliqEfetivaPadrao))}
                </strong> ao migrar para a Nova Regra (Por Fora).
              </p>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                {results.diferenca >= 0 
                  ? 'Isso indica que sua operação possui um volume de despesas com direito a crédito alto o suficiente para abater o imposto devido, fazendo com que o regime Por Fora seja a opção mais vantajosa para o seu caixa.' 
                  : 'Isso indica que sua operação não possui volume de despesas com direito a crédito suficiente para compensar o IVA "cheio", fazendo com que o DAS unificado (Por Dentro) continue sendo a opção de menor impacto para o seu caixa.'}
              </p>
            </div>
          </div>

          {/* Break-even */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
              <span className="text-red-500">🎯</span> Meta de Despesas (Ponto de Equilíbrio)
            </h3>
            <p className="text-[13px] text-gray-400 mb-6 leading-relaxed">
              Volume de despesas Elegíveis que a empresa precisa comprovar para que o regime "Por Fora" não gere prejuízo.
            </p>
            
            <div className="bg-[#f8f9fa] border border-gray-200 p-5 rounded-md mb-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-[12px] text-gray-500 font-bold mb-1">DESPESAS ATUAIS (CRÉDITO)</div>
                  <div className="text-[#005696] font-bold text-xl">{formatCurrency(currentExpenses)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-gray-500 font-bold mb-1">META (BREAK-EVEN)</div>
                  <div className="text-gray-700 font-bold text-xl">{formatCurrency(results.metaDespesas)}</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                <div 
                  className={`${breakEvenPercentage >= 100 ? 'bg-green-500' : 'bg-[#e53935]'} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${breakEvenPercentage}%` }}
                ></div>
              </div>
              <div className="text-center text-[13px] text-gray-800 font-bold">
                {breakEvenPercentage.toFixed(1).replace('.', ',')}% da meta atingida
              </div>
            </div>

            {breakEvenPercentage < 100 ? (
              <div className="bg-red-50 border border-red-200 border-l-4 border-l-[#e53935] p-4 rounded-md flex gap-3">
                <span className="text-[#e53935] text-lg">⚠️</span>
                <p className="text-[14px] text-[#b71c1c] leading-relaxed">
                  <strong>Alerta de Prejuízo:</strong> Faltam <strong>{formatCurrency(results.metaDespesas - currentExpenses)}</strong> em despesas elegíveis para empatar o jogo. Caso não seja possível realocar fornecedores ou aumentar os créditos, a recomendação matemática é manter o IBS/CBS <strong>POR DENTRO</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-500 p-4 rounded-md flex gap-3">
                <span className="text-green-600 text-lg">✅</span>
                <p className="text-[14px] text-green-800 leading-relaxed">
                  <strong>Meta Atingida!</strong> Suas despesas elegíveis atuais já superam o ponto de equilíbrio, garantindo que o cenário <strong>POR FORA</strong> é matematicamente mais rentável.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Impacto por Cliente Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#005696] overflow-hidden mt-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-[#005696]">Impacto por Cliente (Inteligência Comercial)</h3>
            <p className="text-sm text-[#005696] opacity-80 mt-1">Análise de variação do custo efetivo repassado aos principais tomadores (Break-even)</p>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-40 shadow-sm bg-white">
                <tr className="text-[12px] uppercase text-center border-b border-gray-200">
                  <th colSpan={3} className="px-4 py-2 bg-[#f8fafc] text-[#334155] border-r-2 border-gray-300 font-bold sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Cenário Atual (Cenário 1)</th>
                  <th colSpan={9} className="px-4 py-2 bg-[#f0fdf4] text-[#166534] border-r-2 border-[#bbf7d0] font-bold">Cálculo da Nova Carga Tributária</th>
                  <th colSpan={3} className="px-4 py-2 bg-[#eff6ff] text-[#1e40af] border-r-2 border-[#bfdbfe] font-bold">Impacto Aproveitando Crédito (B2B)</th>
                  <th colSpan={3} className="px-4 py-2 bg-[#fff7ed] text-[#9a3412] font-bold">Impacto Não Aproveitando (PF/Simples)</th>
                </tr>
                <tr className="text-[13px] text-[#475569] border-b border-gray-200 text-center bg-white">
                  <th className="px-4 py-3 sticky left-0 z-30 bg-[#f8fafc] w-[180px] min-w-[180px] max-w-[180px] whitespace-nowrap">Cliente / Tomador</th>
                  <th className="px-4 py-3 sticky left-[180px] z-30 bg-[#f8fafc] w-[100px] min-w-[100px] max-w-[100px] whitespace-nowrap">Regime</th>
                  <th className="px-4 py-3 sticky left-[280px] z-30 bg-[#f8fafc] border-r-2 border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[140px] min-w-[140px] max-w-[140px] whitespace-nowrap">Faturamento Atual</th>
                  
                  <th className="px-4 py-3 whitespace-nowrap">Carga Trib. Atual</th>
                  <th className="px-4 py-3 whitespace-nowrap">Tributos "Dentro"</th>
                  <th className="px-4 py-3 whitespace-nowrap">Custo S/ Tributos</th>
                  <th className="px-4 py-3 whitespace-nowrap">Carga S/ Crédito</th>
                  <th className="px-4 py-3 whitespace-nowrap">Novo Custo "Dentro"</th>
                  <th className="px-4 py-3 whitespace-nowrap">IVA (Por Fora)</th>
                  <th className="px-4 py-3 font-bold bg-[#f0fdf4] text-[#0f172a] whitespace-nowrap">Nova NF Cheia</th>
                  <th className="px-4 py-3 whitespace-nowrap">Crédito IBS</th>
                  <th className="px-4 py-3 border-r-2 border-[#bbf7d0] whitespace-nowrap">Crédito CBS</th>
                  <th className="px-4 py-3 bg-[#eff6ff] whitespace-nowrap">Novo Custo Efetivo</th>
                  <th className="px-4 py-3 bg-[#eff6ff] whitespace-nowrap">Variação (R$)</th>
                  <th className="px-4 py-3 bg-[#eff6ff] border-r-2 border-[#bfdbfe] whitespace-nowrap">Variação (%)</th>
                  <th className="px-4 py-3 bg-[#fff7ed] whitespace-nowrap">Novo Custo Efetivo</th>
                  <th className="px-4 py-3 bg-[#fff7ed] whitespace-nowrap">Variação (R$)</th>
                  <th className="px-4 py-3 bg-[#fff7ed] whitespace-nowrap">Variação (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientesMap.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-8 text-center text-gray-500">Nenhum tomador identificado nas notas para este mês.</td>
                  </tr>
                ) : (
                  clientesMap.map((c, idx) => {
                    const pctTributarioC1 = results.aliqEfetivaPadrao;
                    const pctC2SemIva = results.aliqEfetivaPorFora;
                    
                    const creditoIbsCbsDentro = c.faturamentoAtual * (pctTributarioC1 - pctC2SemIva > 0 ? pctTributarioC1 - pctC2SemIva : 0);
                    const impostoAtualNoCliente = c.faturamentoAtual * pctTributarioC1;
                    const lucroLiquidoAtual = c.faturamentoAtual - impostoAtualNoCliente;
                    const custoEfetivoAtual = (c.regime === 'Lucro Real' || c.regime === 'Lucro Presumido') ? (c.faturamentoAtual - creditoIbsCbsDentro) : c.faturamentoAtual;
                    
                    let baseNova = lucroLiquidoAtual;
                    if (pctC2SemIva < 1) {
                        baseNova = lucroLiquidoAtual / (1 - pctC2SemIva);
                    }
                    
                    const valorIbsDestacado = baseNova * aliqIbs;
                    const valorCbsDestacado = baseNova * aliqCbs;
                    const valorIvaDestacado = valorIbsDestacado + valorCbsDestacado;
                    const novoFaturamentoIvaPorFora = baseNova + valorIvaDestacado;
                    
                    const creditoAproveitando = valorIvaDestacado;
                    const custoEfetivoAproveitando = novoFaturamentoIvaPorFora - creditoAproveitando;
                    const varReaisAproveitando = custoEfetivoAproveitando - custoEfetivoAtual;
                    const varPctAproveitando = custoEfetivoAtual > 0 ? (varReaisAproveitando / custoEfetivoAtual) * 100 : 0;

                    const custoEfetivoNaoAproveitando = novoFaturamentoIvaPorFora;
                    const varReaisNaoAproveitando = custoEfetivoNaoAproveitando - custoEfetivoAtual;
                    const varPctNaoAproveitando = custoEfetivoAtual > 0 ? (varReaisNaoAproveitando / custoEfetivoAtual) * 100 : 0;

                    const formatNum = (num: number) => num.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

                    return (
                      <tr key={idx} className="hover:bg-gray-50 text-right text-[14px] text-gray-600 transition-colors bg-white border-b border-gray-100 group">
                        <td className="px-4 py-3 text-left sticky left-0 z-10 bg-white group-hover:bg-gray-50 w-[180px] min-w-[180px] max-w-[180px]">
                          <div className="font-semibold text-gray-800 truncate" title={c.nome}>{c.nome}</div>
                          <div className="text-[12px] text-gray-500 font-mono mt-0.5">{c.cnpj || 'CPF/Outros'}</div>
                        </td>
                        <td className="px-4 py-3 text-center sticky left-[180px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px]">
                          <span className="bg-[#f1f5f9] text-[#475569] px-2 py-1 rounded text-[12px] font-semibold whitespace-nowrap">{c.regime}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 border-r-2 border-gray-300 whitespace-nowrap sticky left-[280px] z-10 bg-white group-hover:bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[140px] min-w-[140px] max-w-[140px]">
                          <span className="text-[12px] text-gray-400 font-normal mr-1">R$</span>{formatNum(c.faturamentoAtual)}
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatPercent4(pctTributarioC1)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatNum(impostoAtualNoCliente)}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-[#475569]">{formatNum(lucroLiquidoAtual)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatPercent4(pctC2SemIva)}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-[#475569]">{formatNum(baseNova)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatPercent4(ivaTotalEfetivo)}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 bg-[#f0fdf4] whitespace-nowrap">
                          <span className="text-[12px] text-gray-400 font-normal mr-1">R$</span>{formatNum(novoFaturamentoIvaPorFora)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#16a34a] whitespace-nowrap">{formatNum(valorIbsDestacado)}</td>
                        <td className="px-4 py-3 font-semibold text-[#16a34a] border-r-2 border-[#bbf7d0] whitespace-nowrap">{formatNum(valorCbsDestacado)}</td>
                        
                        <td className="px-4 py-3 font-semibold text-[#1e40af] bg-[#eff6ff] whitespace-nowrap">
                          <span className="text-[12px] text-blue-300 font-normal mr-1">R$</span>{formatNum(custoEfetivoAproveitando)}
                        </td>
                        <td className={`px-4 py-3 font-bold bg-[#eff6ff] whitespace-nowrap ${varReaisAproveitando > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                          {varReaisAproveitando > 0 ? '+' : ''}{formatNum(varReaisAproveitando)}
                        </td>
                        <td className={`px-4 py-3 font-bold bg-[#eff6ff] border-r-2 border-[#bfdbfe] whitespace-nowrap ${varReaisAproveitando > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                          {varReaisAproveitando > 0 ? '+' : ''}{varPctAproveitando.toFixed(2).replace('.', ',')}%
                        </td>

                        <td className="px-4 py-3 font-semibold text-[#9a3412] bg-[#fff7ed] whitespace-nowrap">
                          <span className="text-[12px] text-orange-300 font-normal mr-1">R$</span>{formatNum(custoEfetivoNaoAproveitando)}
                        </td>
                        <td className={`px-4 py-3 font-bold bg-[#fff7ed] whitespace-nowrap ${varReaisNaoAproveitando > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                          {varReaisNaoAproveitando > 0 ? '+' : ''}{formatNum(varReaisNaoAproveitando)}
                        </td>
                        <td className={`px-4 py-3 font-bold bg-[#fff7ed] whitespace-nowrap ${varReaisNaoAproveitando > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                          {varReaisNaoAproveitando > 0 ? '+' : ''}{varPctNaoAproveitando.toFixed(2).replace('.', ',')}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <button 
            className="px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md shadow-sm transition-colors text-sm font-medium w-full sm:w-auto"
            onClick={() => setStep(4)}
          >
            Voltar
          </button>
          <button 
            className="px-6 py-2 bg-[#005696] hover:bg-[#004375] text-white rounded-md shadow-sm transition-colors text-sm font-medium w-full sm:w-auto"
            onClick={() => window.print()}
          >
            Imprimir Comparativo
          </button>
          <button 
            className="px-6 py-2 bg-[#e53935] hover:bg-[#c62828] text-white rounded-md shadow-sm transition-colors text-sm font-medium w-full sm:w-auto"
            onClick={() => alert("Função de exclusão em desenvolvimento.")}
          >
            Excluir Dados
          </button>
          <button 
            className="px-6 py-2 bg-[#005696] hover:bg-[#004375] text-white rounded-md shadow-sm transition-colors text-sm font-medium w-full sm:w-auto"
            onClick={() => setStep(6)}
          >
            Avançar para Relatório em Excel
          </button>
        </div>
      </div>
    </div>
  );
}
