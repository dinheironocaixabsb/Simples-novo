'use client';

import React from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';

export function Step3Despesas() {
  const despesasMensais = useLucroPresumidoStore((state) => state.despesasMensais);
  const updateDespesaMes = useLucroPresumidoStore((state) => state.updateDespesaMes);
  const setStep = useLucroPresumidoStore((state) => state.setStep);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-[#005696] mb-2">Passo 3: Despesas e Compras (IBS/CBS)</h2>
      <p className="text-gray-600 mb-6">
        Informe o valor das compras e despesas que a empresa possui mensalmente para simularmos os créditos na Reforma Tributária.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Mês</th>
              <th className="px-4 py-3" title="Gera crédito cheio de IBS/CBS">Despesas com Crédito Cheio (R$)</th>
              <th className="px-4 py-3 rounded-tr-lg" title="Compras do Simples Nacional geram crédito menor">Compras do Simples Nacional (R$)</th>
            </tr>
          </thead>
          <tbody>
            {despesasMensais.map((mes, index) => (
              <tr key={mes.mes} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-bold text-gray-800">{mes.mes}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={mes.despesasGeraCredito || ''}
                    onChange={(e) => updateDespesaMes(index, { despesasGeraCredito: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-[#005696] focus:border-[#005696]"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={mes.comprasSimplesNacional || ''}
                    onChange={(e) => updateDespesaMes(index, { comprasSimplesNacional: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-[#005696] focus:border-[#005696]"
                    placeholder="0.00"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={() => setStep(2)}
          className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => setStep(4)}
          className="bg-[#005696] hover:bg-[#004a82] text-white px-8 py-2 rounded-lg font-bold transition-colors"
        >
          Calcular Resultados
        </button>
      </div>
    </div>
  );
}
