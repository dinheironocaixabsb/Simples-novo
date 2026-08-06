import React, { useState } from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ComposedChart, CartesianGrid, Line } from 'recharts';

const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function Step5Resultados() {
  const { receitasMensais, despesasMensais, config, setStep } = useLucroPresumidoStore();
  const [selectedMonth, setSelectedMonth] = useState(0);

  const receita = receitasMensais[selectedMonth];
  const despesa = despesasMensais[selectedMonth];

  // ================= CÁLCULOS =================
  const faturamento = (receita?.receitas?.mercadoInterno || 0) + (receita?.receitas?.mercadoExterno || 0) + (receita?.receitas?.anexo1 || 0) + (receita?.receitas?.anexo5 || 0) + (receita?.receitas?.anexo7 || 0) + (receita?.receitas?.anexo8 || 0) + (receita?.receitas?.cst04 || 0) + (receita?.receitas?.cst06Monofasico || 0) + (receita?.receitas?.cst06AliquotaZero || 0);

  // IRPJ e CSLL
  const baseIrpj = faturamento * 0.08;
  const baseCsll = faturamento * 0.12;
  const irpjNormal = baseIrpj * 0.15;
  const irpjAdicional = Math.max(0, baseIrpj - 20000) * 0.10;
  const csllNormal = baseCsll * 0.09;
  const totalIrpjCsll = irpjNormal + irpjAdicional + csllNormal;

  // PIS / COFINS
  const isencaoPisCofins = (receita?.receitas?.cst04 || 0) + (receita?.receitas?.cst06Monofasico || 0) + (receita?.receitas?.cst06AliquotaZero || 0);
  const basePisCofins = faturamento - isencaoPisCofins;
  const pisCumulativo = basePisCofins * 0.0065;
  const cofinsCumulativo = basePisCofins * 0.03;
  const totalPisCofins = pisCumulativo + cofinsCumulativo;

  // TRIBUTOS ESTADUAIS
  const icmsAtual = receita?.exclusoes?.icmsPisCofins || 0; 
  const custoTotalAtual = totalIrpjCsll + totalPisCofins + icmsAtual;
  const aliquotaEfetivaAtual = faturamento > 0 ? (custoTotalAtual / faturamento) * 100 : 0;

  // NOVO IVA
  const baseIbsCbs = faturamento; 
  const debitoIbs = baseIbsCbs * config.aliquotaIbsDebito;
  const debitoCbs = baseIbsCbs * config.aliquotaCbsDebito;

  const despesasElegiveis = (despesa?.despesaGeral || 0) + (despesa?.despesaCreditoIntegral || 0) + (despesa?.despesaAnexo15 || 0) + (despesa?.despesaAnexo7 || 0) + (despesa?.despesaAnexo8 || 0);
  const creditoIbs = despesasElegiveis * config.aliquotaIbsCreditoGeral;
  const creditoCbs = despesasElegiveis * config.aliquotaCbsCreditoGeral;

  const saldoIva = Math.max(0, (debitoIbs + debitoCbs) - (creditoIbs + creditoCbs));
  
  const custoEfetivoFuturo = totalIrpjCsll + saldoIva + icmsAtual;
  const aliquotaEfetivaFutura = faturamento > 0 ? (custoEfetivoFuturo / faturamento) * 100 : 0;

  // IMPACTO
  const diferenca = custoTotalAtual - custoEfetivoFuturo;
  const isVantajoso = diferenca > 0;
  const aumento = custoEfetivoFuturo - custoTotalAtual;
  const percentualAumento = custoTotalAtual > 0 ? (aumento / custoTotalAtual) * 100 : 0;

  // BREAK EVEN
  const impostoMaximo = custoTotalAtual - totalIrpjCsll - icmsAtual; 
  const creditosNecessarios = Math.max(0, (debitoIbs + debitoCbs) - impostoMaximo);
  const metaDespesas = (config.aliquotaIbsCreditoGeral + config.aliquotaCbsCreditoGeral) > 0 ? creditosNecessarios / (config.aliquotaIbsCreditoGeral + config.aliquotaCbsCreditoGeral) : 0;
  const percentualAtingido = metaDespesas > 0 ? Math.min(100, (despesasElegiveis / metaDespesas) * 100) : 100;
  const faltaDespesas = Math.max(0, metaDespesas - despesasElegiveis);

  const formatCurrency = (val: number) => 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // MOCK DATA FOR CHARTS & TABLES (to match video exactly)
  const diagnosticoData = [
    { name: 'CUSTO ATUAL (PRESUMIDO)', value: custoTotalAtual },
    { name: 'CUSTO NOVO (IVA)', value: custoEfetivoFuturo }
  ];

  const faturamentoData = [
    { name: 'Pessoa Física', value: 22812.50, percent: '6.9%' },
    { name: 'Lucro Presumido', value: 69965.80, percent: '21.1%' },
    { name: 'Isento de IRPJ', value: 217085.70, percent: '65.3%' },
  ];

  const despesasData = [
    { name: 'Lucro Real', value: 23197.06, percent: '6.5%' },
    { name: 'Lucro Presumido', value: 333613.24, percent: '93.0%' },
  ];

  const clientesTabela = [
    { nome: 'LUCIA GOMES PE...', regime: 'Pessoa Física', faturamento: 410.00, carga: '6,26%', novoDentro: 404.01, ivaFora: '25,80%', nfCheia: 508.24, credito: 104.23, novoEfetivo: 404.01, variacaoRs: -5.99, variacaoPct: '-1,46%' },
    { nome: 'SA LUXO CARGA...', regime: 'Lucro Presumido', faturamento: 360.00, carga: '6,26%', novoDentro: 354.74, ivaFora: '25,80%', nfCheia: 446.26, credito: 91.52, novoEfetivo: 354.74, variacaoRs: -5.26, variacaoPct: '-1,46%' },
    { nome: 'CIGA COZINHA IN...', regime: 'Lucro Presumido', faturamento: 324.00, carga: '6,26%', novoDentro: 319.26, ivaFora: '25,80%', nfCheia: 401.63, credito: 82.37, novoEfetivo: 319.26, variacaoRs: -4.74, variacaoPct: '-1,46%' },
    { nome: 'NADJA MARIA M...', regime: 'Pessoa Física', faturamento: 273.00, carga: '6,26%', novoDentro: 269.01, ivaFora: '25,80%', nfCheia: 338.41, credito: 69.40, novoEfetivo: 269.01, variacaoRs: -3.99, variacaoPct: '-1,46%' },
    { nome: 'CASTROS PET SH...', regime: 'Simples Nacional', faturamento: 260.00, carga: '6,26%', novoDentro: 256.20, ivaFora: '25,80%', nfCheia: 322.30, credito: 66.10, novoEfetivo: 256.20, variacaoRs: -3.80, variacaoPct: '-1,46%' },
  ];

  return (
    <div className="w-full bg-[#f8fafc] p-6 animate-fade-in min-h-screen text-[#1e293b]">
      
      {/* 1. HEADER E SELECTOR */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col items-center">
        <h1 className="text-[26px] font-bold text-[#1e293b] mb-1">Cenários Comparativos para Decisão</h1>
        <p className="text-gray-500 text-[14px] mb-6">Compare o Custo Total da empresa nos dois regimes e decida a melhor opção.</p>
        
        <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-lg shadow-sm border border-blue-200">
          <span className="text-[13px] font-bold text-[#005696]">Cenário de Análise:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border-none bg-transparent font-medium text-[14px] outline-none cursor-pointer text-gray-700"
          >
            {FULL_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* 2. CARACTERÍSTICAS (O TOPO QUE FALTAVA) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        
        {/* Lado A: Características Atual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex-1">
            <h2 className="text-[18px] font-bold text-[#005696] mb-1">Cenário 1: Regime Cumulativo (Lucro Presumido)</h2>
            <p className="text-[13px] text-gray-500 mb-4">Tributação incidindo sobre o faturamento bruto ("Por Dentro")</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-[12px] text-gray-600 space-y-2">
              <div className="font-bold text-[#005696] mb-1">Características do Sistema Atual (Lucro Presumido):</div>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Tributação Cumulativa (PIS/COFINS):</strong> O PIS e a COFINS (3,65%) incidem diretamente sobre o faturamento, sem a possibilidade de descontar créditos das despesas e insumos da empresa.</li>
                <li><strong>Cálculo do ICMS e ISS:</strong> O ICMS possui sistemática própria com créditos restritos, enquanto o ISS incide sobre o valor total da prestação do serviço, também de forma cumulativa.</li>
                <li><strong>Vantagem Comercial B2B:</strong> Permite transferir créditos tributários (PIS, COFINS e ICMS destacado) para clientes Pessoa Jurídica Lucro Real, mantendo a competitividade da sua empresa nas negociações.</li>
              </ul>
            </div>
          </div>
          <div className="bg-[#f8fafc] p-4 flex justify-between items-center border-t border-gray-100">
            <span className="font-bold text-gray-700 text-[14px]">Alíquota Efetiva Padrão:</span>
            <span className="font-bold text-[#1e293b] text-[16px]">{aliquotaEfetivaAtual.toFixed(2)}%</span>
          </div>
        </div>

        {/* Lado B: Características Futuro */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex-1">
            <h2 className="text-[18px] font-bold text-[#005696] mb-1">Cenário 2: Novo IVA (IBS/CBS)</h2>
            <p className="text-[13px] text-gray-500 mb-4">Regime Não-Cumulativo Total ("Por Fora")</p>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded p-4 text-[12px] text-gray-600 space-y-2">
              <div className="font-bold text-[#005696] mb-1">Características do Novo Regime:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Custo Líquido (Com Abatimento):</strong> Permite utilizar as despesas da operação para abater o valor do imposto (IVA) devido, gerando créditos tributários e reduzindo o impacto final.</li>
                <li><strong>Gestão:</strong> Exige maior controle das notas fiscais de compras e tomadas de serviços (insumos) para garantir o máximo de aproveitamento de créditos permitidos em Lei.</li>
                <li><strong>Impacto Comercial:</strong> Permite transferir 100% do crédito de IBS e CBS para clientes Pessoa Jurídica, tornando seus preços muito mais atrativos em negociações B2B.</li>
              </ul>
            </div>
          </div>
          <div className="bg-[#f8fafc] p-4 flex justify-between items-center border-t border-gray-100">
            <span className="font-bold text-gray-700 text-[14px]">Alíquota Efetiva (Novo Regime):</span>
            <span className="font-bold text-[#005696] text-[16px]">{aliquotaEfetivaFutura.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* 3. DETALHAMENTO MATEMÁTICO (TABELA QUE FIZEMOS ANTES) */}
      <h3 className="text-[14px] font-bold text-gray-500 mb-3 uppercase px-2">Detalhamento dos Tributos no Sistema Atual (Sem IVA)</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-[13px]">
        
        {/* Lado A: Detalhamento Atual */}
        <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-[14px] font-bold text-[#005696] mb-3 uppercase">Comércio</div>
          <div className="flex justify-between py-1 border-b border-gray-50 text-gray-500">
            <span>Base IRPJ (8%)</span>
            <span>{formatCurrency(baseIrpj)}</span>
          </div>
          <div className="flex justify-between py-1 text-gray-500 border-b border-gray-50">
            <span>Base CSLL (12%)</span>
            <span>{formatCurrency(baseCsll)}</span>
          </div>

          <div className="text-[#005696] font-bold mt-4 mb-2 text-[12px] uppercase">IMPOSTOS DA RENDA (IRPJ E CSLL)</div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>IRPJ Normal (15%)</span>
            <span>{formatCurrency(irpjNormal)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>IRPJ Adicional (10%)</span>
            <span>{formatCurrency(irpjAdicional)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-200 pb-2">
            <span>CSLL (9%)</span>
            <span>{formatCurrency(csllNormal)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#cc0000] font-bold border-b border-gray-200">
            <span>TOTAL IRPJ/CSLL</span>
            <span>{formatCurrency(totalIrpjCsll)}</span>
          </div>

          <div className="text-[#005696] font-bold mt-4 mb-2 text-[12px] uppercase">IMPOSTOS SOBRE A RECEITA (PIS/COFINS)</div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>Base PIS/COFINS (Líquida)</span>
            <span>{formatCurrency(basePisCofins)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>Isenção Monofásica/Zero</span>
            <span>{formatCurrency(isencaoPisCofins)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>PIS Cumulativo (0,65%)</span>
            <span>{formatCurrency(pisCumulativo)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-200 pb-2">
            <span>COFINS Cumulativo (3%)</span>
            <span>{formatCurrency(cofinsCumulativo)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#cc0000] font-bold border-b border-gray-200">
            <span>TOTAL PIS/COFINS</span>
            <span>{formatCurrency(totalPisCofins)}</span>
          </div>

          <div className="text-[#005696] font-bold mt-4 mb-2 text-[12px] uppercase">TRIBUTOS ESTADUAIS/MUNICIPAIS</div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>ICMS (Estadual)</span>
            <span className="text-[#cc0000]">{formatCurrency(icmsAtual)}</span>
          </div>

          <div className="flex justify-between items-center py-4 mt-auto">
            <span className="font-bold text-[#005696] text-[14px]">Custo Total do Mês (Sistema Atual):</span>
            <span className="font-bold text-[#cc0000] text-[15px]">{formatCurrency(custoTotalAtual)}</span>
          </div>
        </div>

        {/* Lado B: Detalhamento Futuro */}
        <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex justify-between py-1 text-gray-500 mt-[33px] border-b border-gray-50">
            <span>Base CSLL (12%)</span>
            <span>{formatCurrency(baseCsll)}</span>
          </div>

          <div className="text-[#005696] font-bold mt-4 mb-2 text-[12px] uppercase">IMPOSTOS DA RENDA (IRPJ E CSLL)</div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>IRPJ Normal (15%)</span>
            <span>{formatCurrency(irpjNormal)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>IRPJ Adicional (10%)</span>
            <span>{formatCurrency(irpjAdicional)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-200 pb-2">
            <span>CSLL (9%)</span>
            <span>{formatCurrency(csllNormal)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#cc0000] font-bold border-b border-gray-200">
            <span>TOTAL IRPJ/CSLL</span>
            <span>{formatCurrency(totalIrpjCsll)}</span>
          </div>

          <div className="text-[#005696] font-bold mt-4 mb-2 text-[12px] uppercase">Apuração do IVA (IBS + CBS)</div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>Base Líquida (Débitos):</span>
            <span>{formatCurrency(baseIbsCbs)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-100 pb-2 mb-1">
            <span>Base Líquida (Créditos):</span>
            <span>{formatCurrency(despesasElegiveis)}</span>
          </div>
          
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>Débito de IBS:</span>
            <span className="text-[#cc0000]">{formatCurrency(debitoIbs)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>Débito de CBS:</span>
            <span className="text-[#cc0000]">{formatCurrency(debitoCbs)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>Crédito de IBS:</span>
            <span className="text-[#005696]">{formatCurrency(creditoIbs)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-gray-600 border-b border-gray-200 pb-2">
            <span>Crédito de CBS:</span>
            <span className="text-[#005696]">{formatCurrency(creditoCbs)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#cc0000] font-bold border-b border-gray-200">
            <span>Saldo do IVA <span className="text-[10px] font-normal text-gray-500">(A Pagar):</span></span>
            <span>{formatCurrency(saldoIva)}</span>
          </div>

          <div className="text-[#005696] font-bold mt-4 mb-2 text-[12px] uppercase">TRIBUTOS ESTADUAIS/MUNICIPAIS (TRANSIÇÃO)</div>
          <div className="flex justify-between py-1.5 text-gray-600">
            <span>ICMS (Transição)</span>
            <span className="text-[#cc0000]">{formatCurrency(icmsAtual)}</span>
          </div>

          <div className="flex justify-between items-center py-4 mt-auto">
            <span className="font-bold text-[#005696] text-[14px]">Custo Efetivo do Mês:</span>
            <span className="font-bold text-[#cc0000] text-[15px]">{formatCurrency(custoEfetivoFuturo)}</span>
          </div>
        </div>
      </div>

      {/* 4. CARDS INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Card 1: Diagnóstico */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
          <h3 className="text-[18px] font-bold text-gray-800 mb-2">Diagnóstico: Impacto do Novo IVA (2027)</h3>
          <p className="text-[13px] text-gray-500 mb-6 px-4">
            O <strong>{isVantajoso ? 'Cenário 2 (Novo IVA)' : 'Cenário 1 (Regra Atual)'}</strong> é mais vantajoso! Ficar no cenário {isVantajoso ? '1' : '2'} geraria um {isVantajoso ? 'desperdício' : 'aumento de carga'} de:
          </p>
          <div className={`w-full max-w-sm py-3 rounded text-white font-bold text-[22px] mb-8 ${isVantajoso ? 'bg-green-600' : 'bg-[#cc0000]'}`}>
            {formatCurrency(Math.abs(diferenca))}
          </div>

          <div className="h-[180px] w-full max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={diagnosticoData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => `R$ ${Number(val).toLocaleString('pt-BR', {minimumFractionDigits:2})}`} />
                <Bar dataKey="value" barSize={50} radius={[2, 2, 0, 0]}>
                  {diagnosticoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#cbd5e1' : '#005696'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="value" stroke="#334155" strokeWidth={2} dot={{ r: 4, fill: '#334155', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-4 text-[12px] text-left w-full mt-6">
            <p className="mb-2">
              <strong>Análise Financeira:</strong> A transição para a Nova Regra de IVA trará um 
              <strong> {isVantajoso ? 'REDUÇÃO' : 'AUMENTO'} de {percentualAumento.toFixed(2)}%</strong> na carga tributária efetiva.
            </p>
            <p className="text-gray-500">
              Isso indica que sua operação {isVantajoso ? 'possui' : 'não possui'} volume de despesas com direito a crédito suficiente para compensar o aumento das alíquotas de IBS/CBS durante a transição. {isVantajoso ? 'Ótima notícia!' : 'É necessário reavaliar o planejamento e repasse de custos.'}
            </p>
          </div>
        </div>

        {/* Card 2: Meta de Despesas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#005696]" />
            <h3 className="text-[16px] font-bold text-gray-800">Meta de Despesas (Ponto de Equilíbrio)</h3>
          </div>
          <p className="text-[12px] text-gray-500 mb-8">
            Volume de despesas elegíveis que a empresa precisa comprovar para que o regime "Por Fora" não gere prejuízo.
          </p>

          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[11px] font-bold text-[#005696] uppercase mb-1">DESPESAS ATUAIS (CRÉDITO)</div>
              <div className="text-[20px] font-bold text-gray-800">{formatCurrency(despesasElegiveis)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">META (BREAK-EVEN)</div>
              <div className="text-[18px] font-bold text-gray-800">{formatCurrency(metaDespesas)}</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-[#cc0000] h-full transition-all" style={{ width: `${percentualAtingido}%` }}></div>
          </div>
          <div className="text-right text-[11px] font-bold text-gray-500 mb-8">
            {percentualAtingido.toFixed(1)}% da meta atingida
          </div>

          {!isVantajoso && faltaDespesas > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4 flex gap-3 text-red-800 text-[12px] mt-auto">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <div>
                <strong>Alerta de Prejuízo:</strong> Faltam <strong>{formatCurrency(faltaDespesas)}</strong> em despesas elegíveis para empatar o jogo. Caso não seja possível aumentar os créditos, o IVA trará prejuízos frente ao PIS/COFINS atual.
              </div>
            </div>
          )}
          {isVantajoso && (
            <div className="bg-green-50 border border-green-200 rounded p-4 flex gap-3 text-green-800 text-[12px] mt-auto">
              <Info className="w-5 h-5 shrink-0 text-green-600" />
              <div>
                <strong>Meta Atingida!</strong> Sua empresa já possui volume de despesas elegíveis suficientes para tornar a migração vantajosa.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. GRÁFICOS HORIONTAIS (FATURAMENTO E DESPESAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Faturamento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#001736]">Faturamento por Regime</h3>
              <p className="text-[11px] text-gray-500">Análise detalhada das receitas brutas</p>
            </div>
            <div className="bg-[#f0f9ff] border border-[#bae6fd] text-[#0284c7] px-3 py-1.5 rounded text-[10px] font-bold text-center">
              <div>RECEITA BRUTA TOTAL</div>
              <div className="text-[14px]">R$ 332.341,00</div>
            </div>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val) => `R$ ${Number(val).toLocaleString('pt-BR', {minimumFractionDigits:2})}`} />
                <Bar dataKey="value" fill="#005696" radius={[0, 4, 4, 0]} barSize={16}>
                  {faturamentoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#005696" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-2">Proporção de vendas / serviços PJ divididas por regime tributário do cliente destinatário.</div>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#001736]">Despesas por Regime</h3>
              <p className="text-[11px] text-gray-500">Análise analítica de custos com fornecedores</p>
            </div>
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] px-3 py-1.5 rounded text-[10px] font-bold text-center">
              <div>VOLUME DE DESPESAS</div>
              <div className="text-[14px]">R$ 356.810,30</div>
            </div>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={despesasData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                <Tooltip cursor={{fill: '#fcffbb'}} formatter={(val) => `R$ ${Number(val).toLocaleString('pt-BR', {minimumFractionDigits:2})}`} />
                <Bar dataKey="value" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={16}>
                  {despesasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#dc2626" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-2">Distribuição de despesas de compras/serviços divididas por regime do fornecedor.</div>
        </div>
      </div>

      {/* 6. TABELA DE IMPACTO POR CLIENTE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[16px] font-bold text-[#005696]">Impacto por Cliente (Inteligência Comercial)</h3>
          <p className="text-[11px] text-gray-500">Análise de variação do custo efetivo repassado aos principais tomadores (Break-even)</p>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[350px] p-4 pt-0 custom-scrollbar">
          <table className="w-full text-[11px] text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="border-b border-gray-200 p-2 bg-white" colSpan={2}></th>
                <th className="border-b-2 border-gray-200 p-2 text-center font-bold text-gray-500 text-[10px] bg-white" colSpan={2}>CENÁRIO ATUAL</th>
                <th className="border-b-2 border-green-500 p-2 text-center font-bold text-green-700 text-[10px] bg-white" colSpan={3}>CÁLCULO DA NOVA CARGA TRIBUTÁRIA</th>
                <th className="border-b-2 border-blue-500 p-2 text-center font-bold text-blue-700 text-[10px] bg-white" colSpan={4}>IMPACTO APROVEITANDO CRÉDITO (B2B)</th>
              </tr>
              <tr className="border-b border-gray-100 bg-white shadow-sm">
                <th className="p-3 font-semibold text-gray-700 bg-white">Cliente / Tomador</th>
                <th className="p-3 font-semibold text-gray-700 bg-white">Regime</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Faturamento Atual</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Carga S/ Crédito</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Novo Custo "Dentro"</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">IVA (Por Fora)</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Nova NF Cheia</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Crédito IBS/CBS</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Novo Custo Efetivo</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Variação (R$)</th>
                <th className="p-3 font-semibold text-gray-700 text-center bg-white">Variação (%)</th>
              </tr>
            </thead>
            <tbody>
              {clientesTabela.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-700">{c.nome}</td>
                  <td className="p-3 text-gray-500">{c.regime}</td>
                  <td className="p-3 text-center font-bold text-gray-700">{formatCurrency(c.faturamento)}</td>
                  <td className="p-3 text-center text-gray-600">{c.carga}</td>
                  <td className="p-3 text-center text-gray-600">{formatCurrency(c.novoDentro)}</td>
                  <td className="p-3 text-center text-gray-600">{c.ivaFora}</td>
                  <td className="p-3 text-center font-bold text-green-700">{formatCurrency(c.nfCheia)}</td>
                  <td className="p-3 text-center font-bold text-green-600">{c.credito.toFixed(2)}</td>
                  <td className="p-3 text-center font-bold text-blue-700">{formatCurrency(c.novoEfetivo)}</td>
                  <td className="p-3 text-center text-gray-700">{c.variacaoRs.toFixed(2)}</td>
                  <td className="p-3 text-center text-gray-700">{c.variacaoPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. ACTIONS (BOTTOM) */}
      <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200 mt-4">
        <button onClick={() => setStep(4)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-[13px] py-2 px-5 rounded shadow-sm transition-colors">Voltar</button>
        <button className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[13px] py-2 px-5 rounded shadow-sm transition-colors">Imprimir Comparativo</button>
        <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[13px] py-2 px-5 rounded shadow-sm transition-colors">Excluir Dados</button>
        <button onClick={() => setStep(6)} className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[13px] py-2 px-5 rounded shadow-sm transition-colors">Avançar para Relatório em Excel</button>
      </div>

    </div>
  );
}
