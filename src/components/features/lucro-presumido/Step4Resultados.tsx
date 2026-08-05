'use client';

import React, { useMemo } from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';
import { calcularLucroPresumidoAnual } from '../../../services/tax-engine/lucroPresumidoCalculator';

export function Step4Resultados() {
  const { config, receitasMensais, despesasMensais, setStep } = useLucroPresumidoStore();

  const resultados = useMemo(() => {
    return calcularLucroPresumidoAnual(receitasMensais, despesasMensais, config);
  }, [receitasMensais, despesasMensais, config]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-[#005696] mb-6">Dashboard de Resultados: Lucro Presumido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Receita Bruta Total</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(resultados.receitaBrutaTotal)}</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Carga Sistema Atual</h3>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(resultados.cargaTributariaTotal)}</p>
            <p className="text-sm text-blue-700 mt-1">
              {((resultados.cargaTributariaTotal / (resultados.receitaBrutaTotal || 1)) * 100).toFixed(2)}% da receita
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2">Carga Nova (Reforma)</h3>
            <p className="text-3xl font-bold text-green-900">{formatCurrency(resultados.cargaReformaTotal)}</p>
            <p className="text-sm text-green-700 mt-1">
              {((resultados.cargaReformaTotal / (resultados.receitaBrutaTotal || 1)) * 100).toFixed(2)}% da receita
            </p>
          </div>
        </div>

        {/* Detalhamento Sistema Atual */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Detalhamento: Sistema Atual (Lucro Presumido)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="block text-xs text-gray-500 uppercase font-bold">IRPJ</span>
            <span className="block text-lg font-bold text-gray-800">{formatCurrency(resultados.totalIrpj)}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="block text-xs text-gray-500 uppercase font-bold">CSLL</span>
            <span className="block text-lg font-bold text-gray-800">{formatCurrency(resultados.totalCsll)}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="block text-xs text-gray-500 uppercase font-bold">PIS</span>
            <span className="block text-lg font-bold text-gray-800">{formatCurrency(resultados.totalPis)}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="block text-xs text-gray-500 uppercase font-bold">COFINS</span>
            <span className="block text-lg font-bold text-gray-800">{formatCurrency(resultados.totalCofins)}</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="block text-xs text-gray-500 uppercase font-bold">ISS Estimado</span>
            <span className="block text-lg font-bold text-gray-800">{formatCurrency(resultados.totalIss)}</span>
          </div>
        </div>

        {/* Detalhamento Reforma Tributária */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Detalhamento: Reforma Tributária (IBS/CBS)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
            <span className="block text-sm text-red-800 font-bold mb-1">Total Débitos (IBS+CBS)</span>
            <span className="block text-2xl font-bold text-red-900">{formatCurrency(resultados.totalDebitoIbs + resultados.totalDebitoCbs)}</span>
          </div>
          <div className="p-4 border border-green-100 bg-green-50 rounded-lg">
            <span className="block text-sm text-green-800 font-bold mb-1">Total Créditos (IBS+CBS)</span>
            <span className="block text-2xl font-bold text-green-900">{formatCurrency(resultados.totalCreditoIbs + resultados.totalCreditoCbs)}</span>
          </div>
          <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
            <span className="block text-sm text-blue-800 font-bold mb-1">Saldo a Pagar (IBS+CBS)</span>
            <span className="block text-2xl font-bold text-blue-900">{formatCurrency(resultados.saldoIbsCbs)}</span>
          </div>
        </div>

        {/* Alerta de Impacto */}
        <div className={`p-6 rounded-xl border ${resultados.diferenca >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`text-lg font-bold mb-2 ${resultados.diferenca >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {resultados.diferenca >= 0 ? 'Economia Projetada com a Reforma' : 'Aumento de Carga Projetado com a Reforma'}
          </h3>
          <p className={`text-3xl font-bold ${resultados.diferenca >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(Math.abs(resultados.diferenca))}
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {resultados.diferenca >= 0 
              ? 'A Reforma Tributária apresenta um cenário mais favorável para a empresa considerando os créditos aproveitados.' 
              : 'A empresa terá um aumento na carga tributária com as novas regras do IVA Dual.'}
          </p>
        </div>

        <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
          <button
            onClick={() => setStep(3)}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Voltar para Despesas
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-black text-white px-8 py-2 rounded-lg font-bold transition-colors"
          >
            Imprimir Relatório
          </button>
        </div>
      </div>
    </div>
  );
}
