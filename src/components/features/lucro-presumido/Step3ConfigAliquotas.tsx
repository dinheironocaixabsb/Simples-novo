'use client';

import React from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';

export function Step3ConfigAliquotas() {
  const config = useLucroPresumidoStore((state) => state.config);
  const updateConfig = useLucroPresumidoStore((state) => state.updateConfig);
  const setStep = useLucroPresumidoStore((state) => state.setStep);
  const saveClient = useLucroPresumidoStore((state) => state.saveClient);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseCurrencyInput = (val: string) => {
    const num = parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
    return num;
  };

  const handleAnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ano = e.target.value;
    let newIbs = config.aliquotaIbsDebito;
    let newCbs = config.aliquotaCbsDebito;

    switch (ano) {
      case "Transição (2026) - Início CBS/IBS":
        newIbs = 0.001; // 0,10%
        newCbs = 0.009; // 0,90%
        break;
      case "Transição (2027 a 2028) - Extinção PIS/COFINS":
        newIbs = 0.001; // 0,10%
        newCbs = 0.089; // 8,90% (CBS Cheia)
        break;
      case "Transição (2029)":
        newIbs = 0.01; // 1,00%
        newCbs = 0.089;
        break;
      case "Transição (2030)":
        newIbs = 0.02; // 2,00%
        newCbs = 0.089;
        break;
      case "Transição (2031)":
        newIbs = 0.03; // 3,00%
        newCbs = 0.089;
        break;
      case "Transição (2032)":
        newIbs = 0.04; // 4,00%
        newCbs = 0.089;
        break;
      case "Regime Definitivo (2033+)":
        newIbs = 0.17; // 17,00% (IBS Cheio)
        newCbs = 0.089; // 8,90% (CBS Cheia)
        break;
    }

    updateConfig({ 
      anoSimulacao: ano,
      aliquotaIbsDebito: newIbs,
      aliquotaCbsDebito: newCbs,
      aliquotaIbsCreditoGeral: newIbs,
      aliquotaCbsCreditoGeral: newCbs
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#1f2937] tracking-wide">Passo 4: Configuração de Alíquotas</h2>
        <p className="text-[#6b7280] text-sm mt-1">Informe as alíquotas de IBS e CBS para o cálculo do novo IVA (Por Fora).</p>
      </div>

      <div className="p-6 flex gap-8">
        
        {/* Coluna Esquerda - Textos Educativos */}
        <div className="w-1/2 flex flex-col justify-between">
          <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-bold text-[#005696] mb-3">Entendendo o Novo IVA Dual (LC 214)</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Com a Reforma Tributária, as empresas optantes pelo <strong>Lucro Presumido</strong> estão inseridas na sistemática regular (não cumulativa) de apuração do <strong>IBS</strong> e da <strong>CBS</strong>.
            </p>
            <h4 className="text-sm font-bold text-gray-800 mb-2">Mecânica Estratégica:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              Neste regime, a empresa debitará as alíquotas plenas (ou com os redutores legais) sobre suas receitas e terá o direito fundamental de transferir <strong>crédito integral (100%)</strong> do imposto recolhido aos seus clientes Pessoa Jurídica (operações B2B).
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Direito ao Crédito (Não-Cumulatividade)</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              No Lucro Presumido (regime regular "Por Fora"), sua empresa tem o direito constitucional de <strong>descontar o imposto pago nas aquisições e despesas</strong> do valor do imposto devido sobre o faturamento, evitando a tributação em cascata.
            </p>
            <h4 className="text-sm font-bold text-gray-800 mb-2">Como funciona o cálculo?</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              As alíquotas preenchidas abaixo simularão a recuperação de impostos sobre os gastos estritamente vinculados a atividade (insumos, manutenção, prestadores). Vale ressaltar que a maior despesa de muitas empresas, a <strong>folha de pagamento (salários e encargos), NÃO gera crédito</strong> no novo IVA, o que exige atenção no planejamento.
            </p>
          </div>
        </div>

        {/* Coluna Direita - Configurações */}
        <div className="w-1/2 flex flex-col gap-6">
          
          {/* Card 1: Alíquotas Aplicáveis */}
          <div className="border border-[#005696] rounded-lg p-5 bg-white shadow-sm">
            <h3 className="text-[15px] font-bold text-[#005696] mb-4">Alíquotas Aplicáveis</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Ano de Simulação (Resolução CGIBS 06/2026):</label>
              <select 
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#005696] focus:ring-1 focus:ring-[#005696] outline-none"
                value={config.anoSimulacao || 'Transição (2026) - Início CBS/IBS'}
                onChange={handleAnoChange}
              >
                <option value="Transição (2026) - Início CBS/IBS">Transição (2026) - Início CBS/IBS</option>
                <option value="Transição (2027 a 2028) - Extinção PIS/COFINS">Transição (2027 a 2028) - Extinção PIS/COFINS</option>
                <option value="Transição (2029)">Transição (2029)</option>
                <option value="Transição (2030)">Transição (2030)</option>
                <option value="Transição (2031)">Transição (2031)</option>
                <option value="Transição (2032)">Transição (2032)</option>
                <option value="Regime Definitivo (2033+)">Regime Definitivo (2033+)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ALÍQ. IBS (%)</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaIbsDebito ?? 0.17) * 100).toFixed(4))}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) / 100;
                    updateConfig({ aliquotaIbsDebito: val, aliquotaIbsCreditoGeral: val });
                  }}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#005696]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ALÍQ. CBS (%)</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaCbsDebito ?? 0.089) * 100).toFixed(4))}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) / 100;
                    updateConfig({ aliquotaCbsDebito: val, aliquotaCbsCreditoGeral: val });
                  }}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#005696]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1" title="ICMS atual para simulação de transição">ALÍQ. ICMS (%) ℹ️</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaIcms ?? 0.18) * 100).toFixed(4))}
                  onChange={(e) => updateConfig({ aliquotaIcms: parseFloat(e.target.value) / 100 })}
                  className="w-full border border-gray-300 rounded p-2 text-sm text-gray-500 focus:border-[#005696]" 
                  placeholder="Ex: 18,00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1" title="ISS atual para simulação de transição">ALÍQ. ISS (%) ℹ️</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaIss ?? 0.05) * 100).toFixed(4))}
                  onChange={(e) => updateConfig({ aliquotaIss: parseFloat(e.target.value) / 100 })}
                  className="w-full border border-gray-300 rounded p-2 text-sm text-gray-500 focus:border-[#005696]" 
                  placeholder="Ex: 5,00"
                />
              </div>
            </div>

            <div className="mb-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-1">Crédito Presumido de Estoque (Transição LC 214) ℹ️</label>
              <input 
                type="text" 
                value={config.creditoPresumidoEstoque || ''}
                onChange={(e) => updateConfig({ creditoPresumidoEstoque: parseCurrencyInput(e.target.value) })}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#005696]" 
                placeholder="Valor Mensal de Abatimento (R$)"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Redutor de Alíquota IBS/CBS (LC 214)</label>
              <select 
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#005696]"
                value={(config.redutorIbsCbs ?? 0).toString()}
                onChange={(e) => updateConfig({ redutorIbsCbs: parseFloat(e.target.value) })}
              >
                <option value="0">Sem Redutor (Regra Geral 100%)</option>
                <option value="0.3">Redução de 30% (Aplica-se 70%)</option>
                <option value="0.6">Redução de 60% (Aplica-se 40%)</option>
                <option value="1">Redução de 100% (Isenção)</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                * A redução de 30% é aplicada sobre a alíquota de profissões regulamentadas (advogados, médicos, engenheiros, contadores, arquitetos). A redução de 60% foca em serviços de saúde, educação, entre outros. A isenção (100%) aplica-se a casos muito específicos, como o transporte público coletivo de passageiros.
              </p>
            </div>
          </div>

          {/* Card 2: Créditos de Fornecedores do Simples Nacional */}
          <div className="border border-[#eab308] rounded-lg p-5 bg-[#fefce8] shadow-sm">
            <h3 className="text-[14px] font-bold text-[#a16207] mb-3">Créditos de Fornecedores do Simples Nacional</h3>
            <div className="mb-4">
              <select 
                className="w-full border border-[#fde047] rounded p-2 text-sm bg-white text-gray-700 focus:border-[#ca8a04]"
                value={config.tipoCreditoSimples || 'por_dentro_estimado'}
                onChange={(e) => updateConfig({ tipoCreditoSimples: e.target.value as any })}
              >
                <option value="por_dentro_estimado">Por Dentro do DAS (Fração de IBS/CBS Estimada)</option>
                <option value="por_fora_destacado">Por Fora do DAS (Regime Regular Destacado na NF)</option>
              </select>
            </div>

            {(config.tipoCreditoSimples || 'por_dentro_estimado') === 'por_dentro_estimado' ? (
              <div>
                <label className="block text-xs font-bold text-[#854d0e] mb-1">Alíquota Média Estimada (%)</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaMediaSimples ?? 0.04) * 100).toFixed(4))}
                  onChange={(e) => updateConfig({ aliquotaMediaSimples: parseFloat(e.target.value) / 100 })}
                  className="w-full border border-[#fde047] rounded p-2 text-sm focus:border-[#ca8a04]" 
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#854d0e] mb-1">ALÍQ. IBS Fornecedor (%)</label>
                  <input 
                    type="number" 
                    value={Number(((config.aliquotaIbsFornecedorSimples ?? 0.001) * 100).toFixed(4))}
                    onChange={(e) => updateConfig({ aliquotaIbsFornecedorSimples: parseFloat(e.target.value) / 100 })}
                    className="w-full border border-[#fde047] rounded p-2 text-sm focus:border-[#ca8a04]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#854d0e] mb-1">ALÍQ. CBS Fornecedor (%)</label>
                  <input 
                    type="number" 
                    value={Number(((config.aliquotaCbsFornecedorSimples ?? 0.009) * 100).toFixed(4))}
                    onChange={(e) => updateConfig({ aliquotaCbsFornecedorSimples: parseFloat(e.target.value) / 100 })}
                    className="w-full border border-[#fde047] rounded p-2 text-sm focus:border-[#ca8a04]" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Alíquotas Gerais para Crédito */}
          <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
            <h3 className="text-[14px] font-bold text-gray-800 mb-3">Alíquotas Gerais para Crédito</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ALÍQ. IBS (%)</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaIbsCreditoGeral ?? 0.17) * 100).toFixed(4))}
                  onChange={(e) => updateConfig({ aliquotaIbsCreditoGeral: parseFloat(e.target.value) / 100 })}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-gray-400" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ALÍQ. CBS (%)</label>
                <input 
                  type="number" 
                  value={Number(((config.aliquotaCbsCreditoGeral ?? 0.089) * 100).toFixed(4))}
                  onChange={(e) => updateConfig({ aliquotaCbsCreditoGeral: parseFloat(e.target.value) / 100 })}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-gray-400" 
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      <div className="flex justify-center gap-4 py-6 border-t border-gray-200 mt-4">
        <button
          onClick={() => setStep(3)}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-[13px] font-bold rounded shadow-sm hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={saveClient}
          className="px-6 py-2 bg-[#005696] text-white text-[13px] font-bold rounded shadow-sm hover:bg-[#004a82] transition-colors"
        >
          Salvar Diagnóstico
        </button>
        <button
          onClick={() => setStep(5)}
          className="px-6 py-2 bg-[#005696] text-white text-[13px] font-bold rounded shadow-sm hover:bg-[#004a82] transition-colors flex items-center gap-2"
        >
          Avançar para Resultados / Dashboard
        </button>
      </div>

    </div>
  );
}
