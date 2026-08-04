"use client";

import React from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import CurrencyInput from 'react-currency-input-field';

export const Step3Config: React.FC = () => {
  const { simulationParams, updateSimulationParams, setStep } = useDiagnosisStore();

  const handleChange = (field: keyof typeof simulationParams, value: any) => {
    if (field === 'anoSimulacao') {
      let faturamentoAliquotaIBS = simulationParams.faturamentoAliquotaIBS;
      let faturamentoAliquotaCBS = simulationParams.faturamentoAliquotaCBS;
      let despesasAliquotaIBS = simulationParams.despesasAliquotaIBS;
      let despesasAliquotaCBS = simulationParams.despesasAliquotaCBS;

      switch (value) {
        case '2026':
          faturamentoAliquotaIBS = 0.10; faturamentoAliquotaCBS = 0.90;
          despesasAliquotaIBS = 0.10; despesasAliquotaCBS = 0.90;
          break;
        case '2029':
          faturamentoAliquotaIBS = 1.00; faturamentoAliquotaCBS = 8.80;
          despesasAliquotaIBS = 1.00; despesasAliquotaCBS = 8.80;
          break;
        case '2030':
          faturamentoAliquotaIBS = 2.00; faturamentoAliquotaCBS = 8.80;
          despesasAliquotaIBS = 2.00; despesasAliquotaCBS = 8.80;
          break;
        case '2031':
          faturamentoAliquotaIBS = 3.00; faturamentoAliquotaCBS = 8.80;
          despesasAliquotaIBS = 3.00; despesasAliquotaCBS = 8.80;
          break;
        case '2032':
          faturamentoAliquotaIBS = 4.00; faturamentoAliquotaCBS = 8.80;
          despesasAliquotaIBS = 4.00; despesasAliquotaCBS = 8.80;
          break;
        case 'definitivo':
          faturamentoAliquotaIBS = 17.00; faturamentoAliquotaCBS = 8.80;
          despesasAliquotaIBS = 17.00; despesasAliquotaCBS = 8.80;
          break;
      }

      updateSimulationParams({ 
        anoSimulacao: value,
        faturamentoAliquotaIBS, faturamentoAliquotaCBS,
        despesasAliquotaIBS, despesasAliquotaCBS
      });
      return;
    }

    updateSimulationParams({ [field]: value });
  };

  const handleNext = () => {
    setStep(4);
  };

  const handleBack = () => {
    setStep(2);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6 border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Configuração de Alíquotas
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Informe as Alíquotas do IBS e CBS para o cenário do novo IVA (Por Fora).
        </p>
      </div>

      {/* LINHA 1: DÉBITOS */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Lado Esquerdo: Informativo */}
        <div className="lg:w-1/3">
          <div className="h-full border-l-4 border-[#005696] bg-white p-5 border-t border-r border-b border-gray-200 rounded-r-md">
            <h3 className="font-bold text-[#005696] mb-2 text-sm">Entendendo o Novo IVA Dual (LC 214)</h3>
            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              Com a Reforma Tributária, as empresas do Simples Nacional podem optar por recolher o <strong>IBS</strong> e a <strong>CBS</strong> de forma isolada ("Por Fora" do DAS).
            </p>
            <h3 className="font-bold text-gray-800 mb-1 text-sm">Vantagem Estratégica:</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              Ao preencher estas alíquotas e apurar pelo regime regular, sua empresa passará a transferir o <strong>Crédito Integral (100%)</strong> na Nota Fiscal para os seus clientes Pessoa Jurídica, tornando seus preços muito mais competitivos em negociações B2B.
            </p>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="lg:w-2/3">
          <div className="bg-white border border-gray-200 p-5 rounded-md h-full">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Alíquotas Aplicáveis</h3>
            
            <div className="mb-4">
              <label className="block text-[12px] font-bold text-gray-700 mb-1">
                Ano de Simulação (Resolução CGSN 06/2026):
              </label>
              <select
                value={simulationParams.anoSimulacao}
                onChange={(e) => handleChange('anoSimulacao', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
              >
                <option value="2026">Transição (2026 a 2028)</option>
                <option value="2029">Transição (2029)</option>
                <option value="2030">Transição (2030)</option>
                <option value="2031">Transição (2031)</option>
                <option value="2032">Transição (2032)</option>
                <option value="definitivo">Regime Definitivo (2033+)</option>
              </select>
            </div>

            <div className="mb-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulationParams.ultrapassouSublimite}
                  onChange={(e) => handleChange('ultrapassouSublimite', e.target.checked)}
                  className="w-4 h-4 text-[#005696] rounded border-gray-300 focus:ring-[#005696]"
                />
                <span className="ml-2 text-[12px] text-gray-700">
                  Empresa ultrapassou o sublimite de R$ 3,6M no ano-calendário (ICMS/IBS recolhidos por fora)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  ALÍQ. IBS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={simulationParams.faturamentoAliquotaIBS}
                  onChange={(e) => handleChange('faturamentoAliquotaIBS', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  ALÍQ. CBS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={simulationParams.faturamentoAliquotaCBS}
                  onChange={(e) => handleChange('faturamentoAliquotaCBS', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-bold text-gray-700 mb-1">
                Crédito Presumido de Estoque (Transição LC 214) <span className="text-[#005696] ml-1">🛈</span>
              </label>
              <CurrencyInput
                id="creditoEstoqueVal"
                name="creditoEstoqueVal"
                placeholder="Valor Mensal do Abatimento (R$)"
                decimalsLimit={2}
                decimalSeparator=","
                groupSeparator="."
                prefix="R$ "
                value={simulationParams.creditoEstoqueVal}
                onValueChange={(value) => handleChange('creditoEstoqueVal', value ? parseFloat(value.replace(',', '.')) : 0)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[12px] font-bold text-gray-700 mb-1">
                Redutor de Alíquota IBS/CBS (LC 214):
              </label>
              <select
                value={simulationParams.redutorIbsCbs}
                onChange={(e) => handleChange('redutorIbsCbs', parseFloat(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696] mb-2"
              >
                <option value={0}>Sem Redutor (Regra Geral 100%)</option>
                <option value={0.3}>Redução de 30%</option>
                <option value={0.6}>Redução de 60%</option>
                <option value={1}>Isenção (100%)</option>
              </select>
              <p className="text-[10px] text-gray-500 leading-tight mb-1">
                * A redução se aplica <strong>diretamente sobre a alíquota</strong> (ex: se 26,5% com redução de 30%, a alíquota efetiva vira 18,55%).
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                * <strong>Atenção:</strong> Cada redução possui requisitos específicos na LC 214. A redução de 30% aplica-se a serviços de profissões regulamentadas (ex: advogados, médicos, engenheiros, contadores, arquitetos). A redução de 60% foca em serviços de saúde, educação, entre outros. A isenção (100%) aplica-se a casos muito específicos, como o transporte público coletivo de passageiros.
              </p>
            </div>

            {/* Caixa Amarela */}
            <div className="bg-[#FFFDF0] border border-[#FBEFA3] rounded-md p-4 mt-auto">
              <label className="block text-[12px] font-bold text-gray-700 mb-1">
                Créditos de Fornecedores do Simples Nacional:
              </label>
              <select
                value={simulationParams.regimeCreditoSn}
                onChange={(e) => handleChange('regimeCreditoSn', e.target.value)}
                className="w-full p-2 border border-[#FBEFA3] rounded text-sm text-gray-700 bg-white focus:outline-none focus:border-[#005696] mb-4"
              >
                <option value="porDentro">Por Dentro do DAS (Fração de IBS/CBS Estimada)</option>
                <option value="porFora">Por Fora do DAS (Regime Regular Destacado na NF)</option>
              </select>

              {simulationParams.regimeCreditoSn === 'porDentro' ? (
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">
                    Alíquota Média Estimada (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={simulationParams.snAliqDentro}
                    onChange={(e) => handleChange('snAliqDentro', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#FBEFA3] bg-white rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1">
                      Alíq. IBS Fornecedor (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={simulationParams.snAliqIbsFora}
                      onChange={(e) => handleChange('snAliqIbsFora', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#FBEFA3] bg-white rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1">
                      Alíq. CBS Fornecedor (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={simulationParams.snAliqCbsFora}
                      onChange={(e) => handleChange('snAliqCbsFora', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#FBEFA3] bg-white rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* LINHA 2: CRÉDITOS */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Lado Esquerdo: Informativo */}
        <div className="lg:w-1/3">
          <div className="h-full border-l-4 border-[#005696] bg-white p-5 border-t border-r border-b border-gray-200 rounded-r-md">
            <h3 className="font-bold text-[#005696] mb-2 text-sm">Direito ao Crédito (Não-Cumulatividade)</h3>
            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              No regime regular ("Por Fora"), sua empresa tem o direito constitucional de <strong>descontar o imposto pago nas aquisições e despesas</strong> do valor do imposto devido sobre o faturamento, evitando a tributação em cascata.
            </p>
            <h3 className="font-bold text-gray-800 mb-1 text-sm">Como funciona o cálculo?</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              As alíquotas preenchidas abaixo simularão a recuperação de impostos sobre os gastos estritamente vinculados à sua atividade (insumos, manutenção, prestadores). Vale ressaltar que a maior despesa de muitas empresas, <strong>a folha de pagamento (salários e encargos), NÃO gera Crédito</strong> no novo IVA, o que exige atenção no planejamento.
            </p>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="lg:w-2/3">
          <div className="bg-white border border-gray-200 p-5 rounded-md h-full">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Alíquotas Gerais para Crédito</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  ALÍQ. IBS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={simulationParams.despesasAliquotaIBS}
                  onChange={(e) => handleChange('despesasAliquotaIBS', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  ALÍQ. CBS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={simulationParams.despesasAliquotaCBS}
                  onChange={(e) => handleChange('despesasAliquotaCBS', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[#005696]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ GERAL DE BOTÕES */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={handleBack}
          className="px-5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          className="px-5 py-2.5 bg-[#005696] text-white rounded-md text-sm font-semibold hover:bg-[#004375] transition-colors"
        >
          Imprimir
        </button>
        <button
          className="px-5 py-2.5 bg-[#005696] text-white rounded-md text-sm font-semibold hover:bg-[#004375] transition-colors"
        >
          Salvar Diagnóstico
        </button>
        <button
          className="px-5 py-2.5 bg-[#cc0000] text-white rounded-md text-sm font-semibold hover:bg-[#a30000] transition-colors"
        >
          Excluir Dados
        </button>
        <button
          onClick={handleNext}
          className="px-5 py-2.5 bg-[#005696] text-white rounded-md text-sm font-semibold hover:bg-[#004375] transition-colors"
        >
          Avançar para Despesas e Créditos
        </button>
      </div>
    </div>
  );
};
