"use client";

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClientStore, GlobalClient } from '@/store/useClientStore';
import { CheckCircle2, TrendingDown, TrendingUp, AlertCircle, Calculator } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ComparativoPage() {
  const clients = useClientStore((state) => state.clients);
  const [selectedId, setSelectedId] = useState<string>('');

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedId) || null;
  }, [clients, selectedId]);

  // Função provisória para estimar os impostos com base nos XMLs (MVP para o teste)
  const results = useMemo(() => {
    if (!selectedClient) return null;

    // Faturamento bruto
    const totalFaturamento = (selectedClient.xmlFaturamento || []).reduce((acc, item) => acc + item.valor, 0);

    // Se não tiver faturamento, retorna zero
    if (totalFaturamento === 0) {
      return {
        faturamento: 0,
        simples: 0,
        presumido: 0,
        real: 0,
        vencedor: null as { regime: string, valor: number } | null
      };
    }

    // AQUI ENTRARÃO OS MOTORES ISOLADOS. 
    // Para o MVP de navegação, estamos usando alíquotas fixas simuladas:
    const cargaSimples = 0.08; // 8% simulado
    const cargaPresumido = 0.12; // 12% simulado
    const cargaReal = 0.15; // 15% simulado

    const simples = totalFaturamento * cargaSimples;
    const presumido = totalFaturamento * cargaPresumido;
    const real = totalFaturamento * cargaReal;

    const values = [
      { regime: 'Simples Nacional', valor: simples },
      { regime: 'Lucro Presumido', valor: presumido },
      { regime: 'Lucro Real', valor: real },
    ];

    // Ordenar do menor para o maior
    values.sort((a, b) => a.valor - b.valor);

    return {
      faturamento: totalFaturamento,
      simples,
      presumido,
      real,
      vencedor: values[0]
    };
  }, [selectedClient]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-[#005696]" />
            <h2 className="text-2xl font-bold text-[#005696]">Planejamento Tributário Comparativo</h2>
          </div>
          <p className="text-gray-600 mb-6">Selecione um cliente para cruzar os dados entre os 3 regimes tributários.</p>

          <div className="max-w-md">
            <label className="block text-sm font-bold text-gray-700 mb-2">Cliente para Simulação:</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:bg-white outline-none focus:border-[#005696] focus:ring-2 focus:ring-[#005696]/20 transition-all text-gray-800 font-medium"
            >
              <option value="">-- Selecione um Cliente --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} (CNPJ: {c.companyData.cnpj || c.id})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resultados */}
        {selectedClient && results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Banner de Recomendação */}
            {results.faturamento > 0 ? (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md p-6 text-white flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-emerald-50 font-medium text-sm mb-1 uppercase tracking-wider">Regime Mais Vantajoso Recomendado</h3>
                  <div className="text-2xl font-bold">{results.vencedor?.regime}</div>
                  <p className="text-emerald-100 mt-1 text-sm">
                    Economia estimada ao escolher este regime baseado no faturamento bruto de {formatCurrency(results.faturamento)}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex items-center gap-4 text-orange-800">
                <AlertCircle className="w-6 h-6 shrink-0 text-orange-500" />
                <p>Este cliente não possui XMLs de faturamento lançados. Para um comparativo real, lance o faturamento nos módulos anteriores.</p>
              </div>
            )}

            {/* Cards dos Regimes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Simples Nacional */}
              <div className={`bg-white rounded-xl shadow-sm border p-6 relative overflow-hidden transition-all ${results.vencedor?.regime === 'Simples Nacional' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}>
                {results.vencedor?.regime === 'Simples Nacional' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 uppercase rounded-bl-lg">Vencedor</div>
                )}
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Simples Nacional</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(results.simples)}</div>
                <p className="text-sm text-gray-500">Carga tributária total estimada</p>
              </div>

              {/* Lucro Presumido */}
              <div className={`bg-white rounded-xl shadow-sm border p-6 relative overflow-hidden transition-all ${results.vencedor?.regime === 'Lucro Presumido' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}>
                {results.vencedor?.regime === 'Lucro Presumido' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 uppercase rounded-bl-lg">Vencedor</div>
                )}
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Lucro Presumido</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(results.presumido)}</div>
                <p className="text-sm text-gray-500">Carga tributária total estimada</p>
              </div>

              {/* Lucro Real */}
              <div className={`bg-white rounded-xl shadow-sm border p-6 relative overflow-hidden transition-all ${results.vencedor?.regime === 'Lucro Real' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}>
                {results.vencedor?.regime === 'Lucro Real' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 uppercase rounded-bl-lg">Vencedor</div>
                )}
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Lucro Real</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(results.real)}</div>
                <p className="text-sm text-gray-500">Carga tributária total estimada</p>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
