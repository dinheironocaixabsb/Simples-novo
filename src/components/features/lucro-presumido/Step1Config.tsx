'use client';

import React from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';

export function Step1Config() {
  const config = useLucroPresumidoStore((state) => state.config);
  const updateConfig = useLucroPresumidoStore((state) => state.updateConfig);
  const setStep = useLucroPresumidoStore((state) => state.setStep);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-[#005696] mb-6">Passo 1: Configurações Iniciais</h2>
      
      <div className="space-y-6 max-w-2xl">
        
        {/* Checkbox Equiparada Hospitalar */}
        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="isEquiparadaHospitalar"
            checked={config.isEquiparadaHospitalar}
            onChange={(e) => updateConfig({ isEquiparadaHospitalar: e.target.checked })}
            className="mt-1 w-5 h-5 text-[#005696] rounded border-gray-300 focus:ring-[#005696]"
          />
          <div>
            <label htmlFor="isEquiparadaHospitalar" className="font-bold text-gray-800 text-lg cursor-pointer">
              Equiparada Hospitalar
            </label>
            <p className="text-sm text-gray-600 mt-1">
              Marque esta opção apenas se a empresa for uma Clínica Médica, Odontológica, etc. que cumpra os requisitos legais e possua decisão favorável para usar a presunção reduzida (IRPJ 8% e CSLL 12%).
            </p>
          </div>
        </div>

        {/* Informações Informativas sobre o PIS/COFINS */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">Regime de PIS/COFINS</h3>
          <p className="text-sm text-blue-800">
            Empresas no Lucro Presumido via de regra sujeitam-se ao regime <strong>Cumulativo</strong>, com alíquotas fixadas em:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-blue-800 ml-2">
            <li><strong>PIS:</strong> {(config.aliquotaPisCumulativo * 100).toFixed(2).replace('.', ',')}%</li>
            <li><strong>COFINS:</strong> {(config.aliquotaCofinsCumulativo * 100).toFixed(2).replace('.', ',')}%</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={() => setStep(2)}
            className="bg-[#005696] hover:bg-[#004a82] text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Avançar para Receitas
          </button>
        </div>
      </div>
    </div>
  );
}
