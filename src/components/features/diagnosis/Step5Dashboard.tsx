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
  const { revenueData, currentMonth, setCurrentMonth, calculationResults, runCalculation, setStep, xmlDespesas } = useDiagnosisStore();

  React.useEffect(() => {
    // Cálculo automático / real-time
    runCalculation();
  }, [currentMonth, revenueData, xmlDespesas, runCalculation]);

  const handleCalculate = () => {
    runCalculation();
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#005696]">Dashboard de Comparação</h2>
          <p className="text-gray-600">Analise os cenários para o mês selecionado</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md shadow-sm transition-colors text-sm font-medium"
            onClick={() => setStep(4)}>Voltar
          </button>
          <button 
            className="flex items-center px-4 py-2 bg-[#005696] hover:bg-[#004375] text-white rounded-md shadow-sm transition-colors text-sm font-medium"
            onClick={handleCalculate}>
            <Calculator className="w-4 h-4 mr-2" />
            Calcular Resultados
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {months.map((month, index) => (
          <button
            key={month}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
              currentMonth === index 
                ? "bg-[#005696] text-white border-[#005696] hover:bg-[#004375]" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setCurrentMonth(index)}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Cenário 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-gray-400 overflow-hidden flex flex-col">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-bold text-gray-700">Cenário 1: Regime Por Dentro</h3>
              <p className="text-sm text-gray-500 mt-1">Guia DAS Padrão (Unificada)</p>
            </div>
            
            <div className="p-6 pt-4 flex-grow flex flex-col">
              {/* Caixa Explicativa */}
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-md mb-6 min-h-[190px]">
                <strong className="text-gray-700 text-[13px] block mb-2">Características do Regime:</strong>
                <ul className="text-gray-600 text-[12.5px] pl-5 list-disc space-y-1.5 leading-relaxed">
                  <li><strong>Simplicidade:</strong> Pagamento unificado em guia única (DAS).</li>
                  <li><strong>Custo "Cheio" (Sem Abatimento):</strong> O imposto incide sobre o faturamento bruto. Não é possível utilizar despesas da sua operação (como insumos, aluguel e energia) para gerar Créditos e reduzir o valor a pagar.</li>
                  <li><strong>Impacto Comercial:</strong> Não permite transferir Crédito integral para clientes PJ, reduzindo competitividade no cenário B2B.</li>
                </ul>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Alíquota Efetiva Padrão:</span>
                  <span className="font-bold text-gray-700 text-lg">{formatPercent4(results.aliqEfetivaPadrao)}</span>
                </div>

                <hr className="border-t border-dashed border-gray-200" />
                
                <div className="py-2">
                  <h4 className="text-[13px] text-gray-500 font-bold mb-3">Detalhamento dos Tributos no DAS</h4>
                  <div className="text-[13px] text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Tributos (IRPJ, CSLL, INSS, etc)</span>
                      <span>{formatCurrency(results.valorDasPadraoTotal)}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-dashed border-gray-200" />
                
                <div className="bg-[#493626] bg-opacity-5 p-3 rounded-md mt-2">
                  <div className="flex items-center font-bold text-sm text-gray-800 mb-2 group relative">
                    Crédito Transferido para B2B
                    <span className="ml-2 flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-gray-500 text-[10px] font-normal cursor-help">i</span>
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[280px] bg-gray-800 text-white text-[12px] p-2.5 rounded shadow-lg font-normal leading-relaxed">
                      Valor de IBS e CBS (antigos PIS/Cofins/ICMS/ISS) pago embutido no DAS que o seu cliente Pessoa Jurídica poderá aproveitar como Crédito (Crédito Presumido). Em geral, esse valor é muito baixo em comparação com a transferência integral do regime 'Por Fora'.
                    </div>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-600 mb-1 pl-4">
                    <span>• Parcela IBS (Regra de Transição)</span>
                    <span className="font-medium text-gray-700">{formatCurrency(results.creditoB2BIbsTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-600 mb-2 pl-4">
                    <span>• Parcela CBS (PIS/Cofins)</span>
                    <span className="font-medium text-gray-700">{formatCurrency(results.creditoB2BCbsTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-bold border-t border-gray-200/50 pt-2 mt-1">
                    <span>Total Transferido</span>
                    <span className="text-gray-800">{formatCurrency(results.creditoB2BTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-2">
                  <span className="font-bold text-gray-800 text-[15px]">Custo Total do Mês (DAS Único):</span>
                  <span className="font-bold text-gray-800 text-lg">{formatCurrency(results.valorDasPadraoTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cenário 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#005696] overflow-hidden flex flex-col">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-bold text-[#005696]">Cenário 2: Regime Por Fora</h3>
              <p className="text-sm text-gray-500 mt-1">Guia DAS Reduzida + Apuração isolada do IVA (IBS/CBS)</p>
            </div>
            
            <div className="p-6 pt-4 flex-grow flex flex-col">
              {/* Caixa Explicativa */}
              <div className="bg-[#75B743] bg-opacity-5 border border-green-100 p-4 rounded-md mb-6 min-h-[190px]">
                <strong className="text-[#005696] text-[13px] block mb-2">Características do Regime:</strong>
                <ul className="text-gray-600 text-[12.5px] pl-5 list-disc space-y-1.5 leading-relaxed">
                  <li><strong>Custo Líquido (Com Abatimento):</strong> Permite utilizar as despesas da operação para abater o valor do imposto devido, reduzindo o custo final.</li>
                  <li><strong>Gestão:</strong> Exige maior controle das notas fiscais de compras e serviços para garantir o aproveitamento dos Créditos.</li>
                  <li><strong>Impacto Comercial:</strong> Permite transferir 100% do Crédito (IBS/CBS) para clientes Pessoa Jurídica, tornando seus preços muito mais competitivos em negociações B2B.</li>
                </ul>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Alíquota Efetiva do DAS (Sem IVA):</span>
                  <span className="font-bold text-[#005696] text-lg">{formatPercent4(results.aliqEfetivaPorFora)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600 text-sm">1. Valor do DAS Reduzido:</span>
                  <span className="font-bold text-[#005696] text-base">{formatCurrency(results.valorDasPorForaTotal)}</span>
                </div>

                <hr className="border-t border-dashed border-gray-200" />
                
                <div className="py-2">
                  <h4 className="text-[13px] text-gray-500 font-bold mb-3">Detalhamento dos Tributos no DAS Reduzido</h4>
                  <div className="text-[13px] text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Tributos Residuais</span>
                      <span>{formatCurrency(results.valorDasPorForaTotal)}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-dashed border-gray-200" />
                
                <div className="py-2">
                  <h4 className="text-[13px] text-gray-500 font-bold mb-3">2. Apuração do IVA (IBS + CBS)</h4>
                  <div className="text-[13px] text-gray-600 space-y-2 pl-2">
                    <div className="flex justify-between">
                      <span>Débito de IBS:</span>
                      <span className="text-gray-800">{formatCurrency(results.debitoIbs)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Débito de CBS:</span>
                      <span className="text-gray-800">{formatCurrency(results.debitoCbs)}</span>
                    </div>
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>(-) Crédito de IBS (Compras):</span>
                      <span>{formatCurrency(results.creditoIbs)}</span>
                    </div>
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>(-) Crédito de CBS (Compras):</span>
                      <span>{formatCurrency(results.creditoCbs)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-100 mt-2">
                      <span>Saldo de IBS (Pagar/Credor):</span>
                      <span className={results.debitoIbs - results.creditoIbs >= 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(results.debitoIbs - results.creditoIbs)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold pb-2">
                      <span>Saldo de CBS (Pagar/Credor):</span>
                      <span className={results.debitoCbs - results.creditoCbs >= 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(results.debitoCbs - results.creditoCbs)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-2">
                  <span className="font-bold text-[#005696] text-[15px]">Custo Total do Mês (DAS Reduzido + Saldo IVA):</span>
                  <span className="font-bold text-[#005696] text-lg">{formatCurrency(results.custoEfetivoPorFora)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Veredito */}
        <div className={`rounded-xl shadow-lg border-l-8 ${results.diferenca >= 0 ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'}`}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${results.diferenca >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {results.diferenca >= 0 ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Veredito do Mês</h3>
                  <p className="text-gray-600">
                    O cenário {results.diferenca >= 0 ? <strong className="text-green-700">Por Fora (Cenário 2)</strong> : <strong className="text-red-700">Por Dentro (Cenário 1)</strong>} é mais vantajoso.
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-sm text-gray-500 mb-1">Economia Projetada</div>
                <div className={`text-3xl font-black ${results.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.diferenca >= 0 ? '+' : ''}{formatCurrency(Math.abs(results.diferenca))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Break-even */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Análise de Break-even (Meta de Despesas)
            </h3>
          </div>
          <div className="p-6 pt-4 space-y-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Despesas Atuais (Estimadas): {formatCurrency(currentExpenses)}</span>
              <span className="font-bold text-blue-600">Meta Necessária: {formatCurrency(results.metaDespesas)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${breakEvenPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              Para que o regime "Por Fora" seja mais vantajoso, suas despesas com direito a crédito devem atingir a meta acima.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
