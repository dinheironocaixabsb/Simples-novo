'use client';

import React from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';

export function Step2Receitas() {
  const receitasMensais = useLucroPresumidoStore((state) => state.receitasMensais);
  const updateReceitaMes = useLucroPresumidoStore((state) => state.updateReceitaMes);
  const setStep = useLucroPresumidoStore((state) => state.setStep);

  const handleInputChange = (mesIndex: number, field: keyof typeof receitasMensais[0], value: string) => {
    // Basic currency parser
    const num = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    updateReceitaMes(mesIndex, { [field]: num });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-[#005696] mb-2">Passo 2: Faturamento</h2>
      <p className="text-gray-600 mb-6">
        Insira as receitas auferidas pela empresa. Separe corretamente a receita de prestação de serviços e a de comércio/indústria, pois as margens de presunção são diferentes.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Mês</th>
              <th className="px-4 py-3" title="Base PIS/COFINS e IRPJ/CSLL 32%">Receita Serviços (R$)</th>
              <th className="px-4 py-3" title="Base PIS/COFINS e IRPJ/CSLL 8%/12%">Receita Comércio (R$)</th>
              <th className="px-4 py-3" title="Não compõe base PIS/COFINS (CST 04/06)">Receita Monofásica/Aliq Zero (R$)</th>
              <th className="px-4 py-3 rounded-tr-lg" title="Apenas das notas CST 01 para deduzir base PIS/COFINS">ICMS Destacado Tributado (R$)</th>
            </tr>
          </thead>
          <tbody>
            {receitasMensais.map((mes, index) => (
              <tr key={mes.mes} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-bold text-gray-800">{mes.mes}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={mes.receitaServicos || ''}
                    onChange={(e) => updateReceitaMes(index, { receitaServicos: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-[#005696] focus:border-[#005696]"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={mes.receitaComercio || ''}
                    onChange={(e) => updateReceitaMes(index, { receitaComercio: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-[#005696] focus:border-[#005696]"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={mes.receitaMonofasica || ''}
                    onChange={(e) => updateReceitaMes(index, { receitaMonofasica: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-[#005696] focus:border-[#005696]"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={mes.icmsDestacado || ''}
                    onChange={(e) => updateReceitaMes(index, { icmsDestacado: Number(e.target.value) })}
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
          onClick={() => setStep(1)}
          className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => setStep(3)} // We will map to Dashboard later
          className="bg-[#005696] hover:bg-[#004a82] text-white px-8 py-2 rounded-lg font-bold transition-colors"
        >
          Avançar (Resultados)
        </button>
      </div>
    </div>
  );
}
