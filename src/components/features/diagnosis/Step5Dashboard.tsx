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

  const results = calculationResults[currentMonth];
  const currentExpenses = (revenueData[currentMonth] as any)?.expenses || 0; // Legacy mapping or from somewhere else, this is a placeholder
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

      {results ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cenário 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-gray-400 overflow-hidden">
              <div className="p-6 pb-2">
                <h3 className="text-lg font-bold text-gray-700">Cenário 1: Simples (Por Dentro)</h3>
              </div>
              <div className="p-6 pt-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">DAS Padrão (Sem CBS/IBS)</span>
                  <span className="font-semibold">{formatCurrency(results.valorDasPadraoTotal)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-700">Alíquota Efetiva Média</span>
                  <span className="font-bold text-purple-700">{formatPercent4(results.aliqEfetivaPadrao)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700">Crédito B2B Transferido</span>
                  <span className="font-semibold text-green-700">{formatCurrency(results.creditoB2BTotal)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg mt-4 border border-gray-200">
                  <span className="font-bold text-gray-800">Custo Total Efetivo</span>
                  <span className="font-bold text-gray-800">{formatCurrency(results.valorDasPadraoTotal)}</span>
                </div>
              </div>
            </div>

            {/* Cenário 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#005696] overflow-hidden">
              <div className="p-6 pb-2">
                <h3 className="text-lg font-bold text-[#005696]">Cenário 2: Simples (Por Fora)</h3>
              </div>
              <div className="p-6 pt-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800">DAS Reduzido</span>
                  <span className="font-semibold text-blue-800">{formatCurrency(results.valorDasPorForaTotal)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-700">Alíquota Efetiva (DAS)</span>
                  <span className="font-bold text-purple-700">{formatPercent4(results.aliqEfetivaPorFora)}</span>
                </div>
                <div className="space-y-2 p-3 bg-indigo-50 rounded-lg">
                  <div className="text-sm font-semibold text-indigo-900 mb-2 border-b border-indigo-200 pb-1">Apuração IVA Dual</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Débito (IBS+CBS)</span>
                    <span className="text-red-600">{formatCurrency(results.debitoIbs + results.debitoCbs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Crédito (IBS+CBS)</span>
                    <span className="text-green-600">{formatCurrency(results.creditoIbs + results.creditoCbs)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-indigo-200 mt-1">
                    <span className="text-indigo-900">Saldo a Pagar</span>
                    <span className="text-indigo-900">{formatCurrency(results.saldoIva)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-3 bg-[#005696] text-white rounded-lg mt-4 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Custo Total Efetivo</span>
                    <span className="font-bold">{formatCurrency(results.custoEfetivoPorFora)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#337aae] pt-2">
                    <span className="text-sm">Carga Tributária</span>
                    <span className="font-bold">{formatPercent4(results.cargaTributariaPorFora)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Veredito */}
          <div className={`rounded-xl shadow-lg border-l-8 ${results.diferenca > 0 ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'}`}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-full ${results.diferenca > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {results.diferenca > 0 ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Veredito do Mês</h3>
                    <p className="text-gray-600">
                      O cenário {results.diferenca > 0 ? <strong className="text-green-700">Por Fora (Cenário 2)</strong> : <strong className="text-red-700">Por Dentro (Cenário 1)</strong>} é mais vantajoso.
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-sm text-gray-500 mb-1">Economia Projetada</div>
                  <div className={`text-3xl font-black ${results.diferenca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.diferenca > 0 ? '+' : ''}{formatCurrency(Math.abs(results.diferenca))}
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
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum cálculo realizado para este mês</h3>
          <p className="text-gray-500 mt-2 mb-6">Clique no botão "Calcular Resultados" para visualizar o comparativo.</p>
          <button 
            className="px-6 py-2 bg-[#005696] hover:bg-[#004375] text-white font-medium rounded-md shadow-sm transition-colors" 
            onClick={handleCalculate}>
            Calcular Resultados
          </button>
        </div>
      )}
    </div>
  );
}
