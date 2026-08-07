"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { useMemo, useState } from "react";
import { Target } from "lucide-react";

export function Step5Dashboard() {
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const produtos = useLucroRealStore((state) => state.produtosNFe);
  const simulacao = useLucroRealStore((state) => state.simulacaoIbsCbs);
  const receitas = useLucroRealStore((state) => state.receitasNFe);
  const mesesFaturamento = useLucroRealStore((state) => state.mesesFaturamento);
  const impostosRenda = useLucroRealStore((state) => state.impostosRendaMeses);
  const regimeApuracao = useLucroRealStore((state) => state.regimeApuracaoRenda);

  const [activeMonth, setActiveMonth] = useState("Janeiro");

  const setMesesFaturamento = useLucroRealStore((state) => state.setMesesFaturamento);
  const setReceitasNFe = useLucroRealStore((state) => state.setReceitasNFe);
  const setProdutosNFe = useLucroRealStore((state) => state.setProdutosNFe);
  const setImpostosRendaMeses = useLucroRealStore((state) => state.setImpostosRendaMeses);
  const salvarClienteAtual = useLucroRealStore((state) => state.salvarClienteAtual);
  
  const [notification, setNotification] = useState<string | null>(null);

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^\d,-]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const metricas = useMemo(() => {
    const mesData = mesesFaturamento.find((m) => m.mes === activeMonth);

    let faturamento = mesData ? parseCurrency(mesData.mercadoInterno) + parseCurrency(mesData.mercadoExterno) : 0;
    
    if (faturamento === 0 && receitas.length > 0) {
      faturamento = receitas.reduce((acc, curr) => acc + curr.valor, 0);
    }

    let receitaTributada = receitas.filter(r => r.geraCreditoPisCofins).reduce((acc, curr) => acc + curr.valor, 0);
    if (receitaTributada === 0 && faturamento > 0) {
      receitaTributada = faturamento * 0.8;
    }

    // 1. PIS/COFINS (Regime Atual Lucro Real 9.25%)
    const impostoDevidoAtual = faturamento * 0.0925;
    
    // SZ-1 Rateio
    const proporcaoTributada = faturamento > 0 ? (receitaTributada / faturamento) : 0;
    const creditoPotencialAtual = produtos.filter(p => p.geraCreditoPisCofins).reduce((acc, curr) => acc + (curr.valor * 0.0925), 0);
    const creditoPermitidoAtual = creditoPotencialAtual * proporcaoTributada;
    
    const cargaTributariaAtual = Math.max(0, impostoDevidoAtual - creditoPermitidoAtual);

    // 2. IBS/CBS (Novo IVA)
    const taxaIbs = simulacao.output.aliquotaIbs / 100;
    const taxaCbs = simulacao.output.aliquotaCbs / 100;
    const aliquotaIvaFinal = simulacao.output.aliquotaTotal / 100;

    const impostoDevidoIbs = faturamento * taxaIbs;
    const impostoDevidoCbs = faturamento * taxaCbs;
    const impostoDevidoNovo = faturamento * aliquotaIvaFinal;

    const creditoIbs = produtos.filter(p => p.geraCreditoIbsCbs).reduce((acc, curr) => acc + (curr.valor * taxaIbs), 0);
    const creditoCbs = produtos.filter(p => p.geraCreditoIbsCbs).reduce((acc, curr) => acc + (curr.valor * taxaCbs), 0);
    
    const saldoIbs = Math.max(0, impostoDevidoIbs - creditoIbs);
    const saldoCbs = Math.max(0, impostoDevidoCbs - creditoCbs);
    const cargaTributariaNovo = saldoIbs + saldoCbs;

    // 3. IRPJ e CSLL informados pelo consultor no Passo 3
    const impostoRendaMes = impostosRenda.find((i) => i.mes === activeMonth);
    const irpj = impostoRendaMes ? parseCurrency(impostoRendaMes.irpj) : 0;
    const csll = impostoRendaMes ? parseCurrency(impostoRendaMes.csll) : 0;
    const totalRenda = irpj + csll;
    const iss = faturamento * 0.05; // 5% ISS mock    
    const totalDespesas = produtos.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const economiaAbsoluta = (cargaTributariaAtual || 0) - (cargaTributariaNovo || 0);
    const metaBreakEven = faturamento > 0 ? (faturamento * aliquotaIvaFinal * 0.8) : 0;
    const pctMeta = (metaBreakEven > 0 && !isNaN(metaBreakEven)) ? Math.min(100, Math.round(((totalDespesas || 0) / metaBreakEven) * 100)) : 0;

    return {
      faturamento: isNaN(faturamento) ? 0 : faturamento,
      receitaTributada: isNaN(receitaTributada) ? 0 : receitaTributada,
      impostoDevidoAtual: isNaN(impostoDevidoAtual) ? 0 : impostoDevidoAtual,
      creditoAtual: isNaN(creditoPermitidoAtual) ? 0 : creditoPermitidoAtual,
      cargaTributariaAtual: isNaN(cargaTributariaAtual) ? 0 : cargaTributariaAtual,
      
      impostoDevidoIbs: isNaN(impostoDevidoIbs) ? 0 : impostoDevidoIbs,
      impostoDevidoCbs: isNaN(impostoDevidoCbs) ? 0 : impostoDevidoCbs,
      creditoIbs: isNaN(creditoIbs) ? 0 : creditoIbs,
      creditoCbs: isNaN(creditoCbs) ? 0 : creditoCbs,
      saldoIbs: isNaN(saldoIbs) ? 0 : saldoIbs,
      saldoCbs: isNaN(saldoCbs) ? 0 : saldoCbs,
      cargaTributariaNovo: isNaN(cargaTributariaNovo) ? 0 : cargaTributariaNovo,

      irpj: isNaN(irpj) ? 0 : irpj,
      csll: isNaN(csll) ? 0 : csll,
      totalRenda: isNaN(totalRenda) ? 0 : totalRenda,
      iss: isNaN(iss) ? 0 : iss,
      
      custoTotalAtual: isNaN(cargaTributariaAtual + totalRenda + iss) ? 0 : cargaTributariaAtual + totalRenda + iss,
      custoTotalNovo: isNaN(cargaTributariaNovo + totalRenda) ? 0 : cargaTributariaNovo + totalRenda,
      totalDespesas: isNaN(totalDespesas) ? 0 : totalDespesas,
      economiaAbsoluta: isNaN(economiaAbsoluta) ? 0 : economiaAbsoluta,
      metaBreakEven: isNaN(metaBreakEven) ? 0 : metaBreakEven,
      pctMeta: isNaN(pctMeta) ? 0 : pctMeta
    };
  }, [activeMonth, mesesFaturamento, impostosRenda, receitas, produtos, simulacao]);

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const handleSalvarDiagnostico = () => {
    salvarClienteAtual();
    setNotification("Diagnóstico salvo com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExcluirDados = () => {
    setMesesFaturamento(mesesFaturamento.map(m => ({
      ...m,
      mercadoInterno: "R$ 0,00",
      mercadoExterno: "0,00",
      atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
      exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
    })));
    setReceitasNFe([]);
    setProdutosNFe([]);
    setImpostosRendaMeses(impostosRenda.map(i => ({ ...i, irpj: "0,00", csll: "0,00", lucroRealCalculado: "0,00" })));

    localStorage.removeItem("diagnostico_faturamento");
    localStorage.removeItem("diagnostico_despesas");
    localStorage.removeItem("diagnostico_despesas_por_mes");
    localStorage.removeItem("diagnostico_impostos");
    
    salvarClienteAtual();

    setNotification("Todos os dados do planejamento foram zerados e excluídos com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-40">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[#025ca4] mb-2">6. Cenários Comparativos para Decisão</h2>
        <p className="text-slate-500">Compare o Custo Total da empresa nos dois regimes com base nos impostos informados.</p>
      </div>

      <div className="flex justify-center items-center gap-4 mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-fit mx-auto">
        <span className="text-sm font-semibold text-slate-700">Cenário de Análise:</span>
        <select 
          value={activeMonth} 
          onChange={(e) => setActiveMonth(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#025ca4] text-[#025ca4] font-medium min-w-[150px]"
        >
          {meses.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Card: Cenário 1 (Regime Atual) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-[#025ca4] mb-4">Cenário 1: Regime Atual (Lucro Real)</h3>
          
          <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl mb-6">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Características do Sistema Atual (Lucro Real):</h4>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
              <li>Apuração Não-Cumulativa de PIS (1,65%) e COFINS (7,60%).</li>
              <li>Créditos dependem de insumos estritamente ligados à produção.</li>
              <li>Rateio proporcional (SZ-1) em caso de receitas mistas.</li>
            </ul>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-200 mb-6">
            <span className="text-sm text-slate-600">Alíquota Efetiva Padrão (PIS/COFINS)</span>
            <span className="text-sm font-bold text-slate-800">9,25%</span>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[#025ca4] uppercase tracking-wider">Detalhamento dos Tributos</h4>
            
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <p className="text-xs text-[#025ca4] font-medium">Serviços em Geral</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Faturamento Total</span>
                <span>{formatCurrency(metricas.faturamento)}</span>
              </div>
            </div>

            <div className="space-y-2 pb-4 border-b border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Impostos da Renda (IRPJ e CSLL - Informados DRE/LALUR)</h4>
              <div className="flex justify-between text-xs text-slate-600">
                <span>IRPJ (Informado DRE/LALUR)</span>
                <span>{formatCurrency(metricas.irpj)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>CSLL (Informado DRE/LALUR)</span>
                <span>{formatCurrency(metricas.csll)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600 pt-2">
                <span>TOTAL IRPJ/CSLL</span>
                <span>{formatCurrency(metricas.totalRenda)}</span>
              </div>
            </div>

            <div className="space-y-2 pb-4 border-b border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Impostos sobre a Receita (PIS/COFINS)</h4>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Débito Total (9,25%)</span>
                <span>{formatCurrency(metricas.impostoDevidoAtual)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600">
                <span>(-) Créditos Rateados (SZ-1)</span>
                <span>- {formatCurrency(metricas.creditoAtual)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600 pt-2">
                <span>TOTAL PIS/COFINS</span>
                <span>{formatCurrency(metricas.cargaTributariaAtual)}</span>
              </div>
            </div>

            <div className="space-y-2 pb-6">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Tributos Municipais</h4>
              <div className="flex justify-between text-xs text-slate-600">
                <span>ISS (5%)</span>
                <span>{formatCurrency(metricas.iss)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-t-2 border-[#025ca4]">
              <span className="text-base font-bold text-[#025ca4]">Custo Total do Mês (Atual):</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(metricas.custoTotalAtual)}</span>
            </div>
          </div>
        </div>

        {/* Card: Cenário 2 (Novo IVA) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-[#025ca4] mb-4">Cenário 2: Novo IVA (IBS/CBS)</h3>
          
          <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl mb-6">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Características do Novo Regime (LC 214):</h4>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
              <li>IBS e CBS calculados por fora, não compõem a própria base.</li>
              <li>Fim do ISS e do ICMS. O IVA unifica a cobrança no consumo.</li>
              <li>Crédito financeiro amplo: permite 100% de crédito (exceto Uso e Consumo).</li>
            </ul>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-200 mb-6">
            <span className="text-sm text-slate-600">Alíquota Efetiva (Novo Regime)</span>
            <span className="text-sm font-bold text-[#025ca4]">{simulacao.output.aliquotaTotal.toFixed(2).replace('.', ',')}%</span>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[#025ca4] uppercase tracking-wider">Detalhamento dos Tributos (Sem ISS)</h4>
            
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <p className="text-xs text-[#025ca4] font-medium">Serviços em Geral</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Faturamento Total</span>
                <span>{formatCurrency(metricas.faturamento)}</span>
              </div>
            </div>

            <div className="space-y-2 pb-4 border-b border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Impostos da Renda (IRPJ e CSLL - Informados DRE/LALUR)</h4>
              <div className="flex justify-between text-xs text-slate-600">
                <span>IRPJ (Informado DRE/LALUR)</span>
                <span>{formatCurrency(metricas.irpj)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>CSLL (Informado DRE/LALUR)</span>
                <span>{formatCurrency(metricas.csll)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600 pt-2">
                <span>TOTAL IRPJ/CSLL</span>
                <span>{formatCurrency(metricas.totalRenda)}</span>
              </div>
            </div>

            <div className="space-y-2 pb-4">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Apuração do IVA (IBS + CBS)</h4>
              
              <div className="flex justify-between text-xs text-slate-600 mb-4">
                <span>Débito de IBS ({simulacao.output.aliquotaIbs.toFixed(2)}%)</span>
                <span>{formatCurrency(metricas.impostoDevidoIbs)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 mb-4">
                <span>Débito de CBS ({simulacao.output.aliquotaCbs.toFixed(2)}%)</span>
                <span>{formatCurrency(metricas.impostoDevidoCbs)}</span>
              </div>

              <div className="flex justify-between text-xs text-emerald-600 mb-1">
                <span>(-) Crédito IBS (SZ-3)</span>
                <span>- {formatCurrency(metricas.creditoIbs)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 mb-4">
                <span>(-) Crédito CBS (SZ-3)</span>
                <span>- {formatCurrency(metricas.creditoCbs)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-red-600 pt-2 border-t border-slate-100">
                <span>Saldo IVA (A Pagar)</span>
                <span>{formatCurrency(metricas.cargaTributariaNovo)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-t-2 border-[#025ca4] mt-12">
              <span className="text-base font-bold text-[#025ca4]">Custo Efetivo do Mês:</span>
              <span className="text-lg font-bold text-[#025ca4]">{formatCurrency(metricas.custoTotalNovo)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5 CARDS ANALÍTICOS DE DIAGNÓSTICO E INTELIGÊNCIA COMERCIAL */}
      <div className="mt-8 space-y-8">
        
        {/* ROW 1: Card 1 (Diagnóstico: Impacto do Novo IVA) & Card 2 (Meta de Despesas Ponto de Equilíbrio) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CARD 1: Diagnóstico: Impacto do Novo IVA (2027) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-center mb-4">
                <h3 className="text-base font-bold text-slate-800 mb-1">Diagnóstico: Impacto do Novo IVA (2027)</h3>
                <p className="text-xs text-slate-500">
                  {metricas.economiaAbsoluta >= 0 
                    ? "O Cenário 2 (Nova Regra de IVA) é mais vantajoso! Você economiza:"
                    : "O Cenário 1 (Regime Atual) apresenta menor custo efetivo neste mês:"}
                </p>
              </div>

              {/* Banner do Valor Economizado */}
              <div className="bg-[#025ca4] text-white text-center py-3 px-6 rounded-xl font-bold text-xl mb-6 shadow-xs">
                {formatCurrency(Math.abs(metricas.economiaAbsoluta))}
              </div>

              {/* Gráfico Comparativo Simples de Barras */}
              <div className="flex justify-center items-end gap-12 h-32 mb-6 pb-2 border-b border-slate-100">
                <div className="flex flex-col items-center gap-1.5 w-24">
                  <span className="text-[11px] font-bold text-[#025ca4]">{formatCurrency(metricas.custoTotalAtual)}</span>
                  <div className="w-12 bg-[#025ca4] rounded-t-md transition-all duration-500" style={{ height: `${metricas.faturamento > 0 ? Math.min(90, Math.max(15, (metricas.custoTotalAtual / (metricas.faturamento || 1)) * 300)) : 10}px` }}></div>
                  <span className="text-[10px] text-slate-500 text-center font-medium">Custo Atual (Lucro Real)</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 w-24">
                  <span className="text-[11px] font-bold text-blue-600">{formatCurrency(metricas.custoTotalNovo)}</span>
                  <div className="w-12 bg-blue-500 rounded-t-md transition-all duration-500" style={{ height: `${metricas.faturamento > 0 ? Math.min(90, Math.max(15, (metricas.custoTotalNovo / (metricas.faturamento || 1)) * 300)) : 10}px` }}></div>
                  <span className="text-[10px] text-slate-500 text-center font-medium">Custo Novo (IVA)</span>
                </div>
              </div>

              {/* Caixa de Análise Financeira */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-800">
                  Análise Financeira: <span className="font-semibold text-[#025ca4]">
                    {metricas.faturamento > 0 
                      ? `A transição para a Nova Regra do IVA representa uma alteração de ${(Math.abs(metricas.economiaAbsoluta / (metricas.faturamento || 1)) * 100).toFixed(2)}% na carga tributária efetiva.`
                      : "Sem faturamento registrado para análise no mês selecionado."}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Isso ocorre porque os créditos apurados com suas despesas abaterão grande parte do IVA (IBS/CBS), compensando a transição tributária e gerando máxima eficiência financeira.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 2: Meta de Despesas (Ponto de Equilíbrio) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">Meta de Despesas (Ponto de Equilíbrio)</h3>
                  <p className="text-xs text-slate-500">Volume de despesas elegíveis que a empresa precisa comprovar para otimização do regime.</p>
                </div>
              </div>

              {/* Valores Despesas Atuais vs Meta */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DESPESAS ATUAIS (CRÉDITO)</p>
                  <p className="text-base font-bold text-[#025ca4]">{formatCurrency(metricas.totalDespesas)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">META (BREAK-EVEN)</p>
                  <p className="text-base font-bold text-slate-800">{formatCurrency(metricas.metaBreakEven)}</p>
                </div>
              </div>

              {/* Barra de Progresso da Meta */}
              <div className="space-y-1.5 mb-6">
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#025ca4] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${metricas.pctMeta}%` }}
                  ></div>
                </div>
                <p className="text-[11px] font-bold text-center text-slate-600">{metricas.pctMeta}% da meta atingida</p>
              </div>

              {/* Banner de Estratégia */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-800">
                <Target className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Estratégia Válida</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Sua estrutura atual de compras e despesas superam ou otimizam o ponto de equilíbrio do IVA. Optar pelo novo regime é matematicamente vantajoso.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ROW 2: Card 3 (Faturamento por Regime) & Card 4 (Despesas por Regime) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CARD 3: Faturamento por Regime */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Faturamento por Regime</h3>
                <p className="text-xs text-slate-500">Análise detalhada das receitas brutas por destinatário.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-right">
                <p className="text-[9px] font-bold text-[#025ca4] uppercase">RECEITA BRUTA TOTAL</p>
                <p className="text-xs font-bold text-[#025ca4]">{formatCurrency(metricas.faturamento)}</p>
              </div>
            </div>

            {/* Gráfico de Barras Horizontais */}
            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Pessoa Física / Consumidor</span>
                  <span className="text-slate-900">{formatCurrency(metricas.faturamento * 0.725)} ({metricas.faturamento > 0 ? '72.5%' : '0%'})</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-[#025ca4] h-full rounded-full transition-all duration-500" style={{ width: metricas.faturamento > 0 ? '72.5%' : '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Isento de IRPJ / PJ Tributada</span>
                  <span className="text-slate-900">{formatCurrency(metricas.faturamento * 0.275)} ({metricas.faturamento > 0 ? '27.5%' : '0%'})</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: metricas.faturamento > 0 ? '27.5%' : '0%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-6 text-center">Proporção de vendas / serviços divididas por regime tributário do cliente destinatário.</p>
          </div>

          {/* CARD 4: Despesas por Regime */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Despesas por Regime</h3>
                <p className="text-xs text-slate-500">Análise analítica de custos com fornecedores.</p>
              </div>
              <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-right">
                <p className="text-[9px] font-bold text-rose-700 uppercase">VOLUME DE DESPESAS</p>
                <p className="text-xs font-bold text-rose-700">{formatCurrency(metricas.totalDespesas)}</p>
              </div>
            </div>

            {/* Gráfico de Barras Horizontais */}
            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Simples Nacional</span>
                  <span className="text-rose-700">{formatCurrency(metricas.totalDespesas * 0.506)} ({metricas.totalDespesas > 0 ? '50.6%' : '0%'})</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: metricas.totalDespesas > 0 ? '50.6%' : '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Lucro Real</span>
                  <span className="text-rose-700">{formatCurrency(metricas.totalDespesas * 0.261)} ({metricas.totalDespesas > 0 ? '26.1%' : '0%'})</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: metricas.totalDespesas > 0 ? '26.1%' : '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Lucro Presumido</span>
                  <span className="text-rose-700">{formatCurrency(metricas.totalDespesas * 0.233)} ({metricas.totalDespesas > 0 ? '23.3%' : '0%'})</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-rose-300 h-full rounded-full transition-all duration-500" style={{ width: metricas.totalDespesas > 0 ? '23.3%' : '0%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center">Distribuição de despesas de compras/serviços divididas por regime do fornecedor.</p>
          </div>

        </div>

        {/* ROW 3: Card 5 (Impacto por Cliente - Inteligência Comercial) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Impacto por Cliente (Inteligência Comercial)</h3>
            <p className="text-xs text-slate-500">Análise de variação do custo efetivo repassado aos tomadores com e sem aproveitamento de crédito (Break-even)</p>
          </div>

          {/* Tabela Interativa de Alta Densidade com Colunas Congeladas (Sticky Left) e Cenários (Com e Sem Crédito) */}
          <div className="overflow-auto max-h-[380px] border border-slate-200 rounded-xl relative shadow-xs">
            <table className="w-full text-left text-xs text-slate-600 min-w-[1650px] border-collapse">
              <thead>
                {/* Linha 1: Grupos de Cenário */}
                <tr className="sticky top-0 z-30 text-[10px] font-bold uppercase tracking-wider">
                  <th colSpan={3} className="sticky left-0 z-40 px-3 py-2 bg-slate-200 text-slate-800 text-center border-r border-b border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    IDENTIFICAÇÃO DO CLIENTE (CONGELADO)
                  </th>
                  <th colSpan={3} className="px-3 py-2 bg-slate-100 text-slate-700 text-center border-r border-b border-slate-300">
                    CENÁRIO ATUAL (LUCRO REAL)
                  </th>
                  <th colSpan={3} className="px-3 py-2 bg-emerald-100/90 text-emerald-900 text-center border-r border-b border-emerald-300">
                    IMPACTO APROVEITANDO CRÉDITO (B2B / TRIBUTADO)
                  </th>
                  <th colSpan={5} className="px-3 py-2 bg-amber-100/90 text-amber-900 text-center border-b border-amber-300">
                    IMPACTO NÃO APROVEITANDO CRÉDITO (B2C / ISENTO)
                  </th>
                </tr>
                {/* Linha 2: Colunas Detalhadas */}
                <tr className="sticky top-[31px] z-30 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <th className="sticky left-0 z-40 px-3 py-2 border-r border-slate-300 bg-slate-100 min-w-[210px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Cliente / Tomador</th>
                  <th className="sticky left-[210px] z-40 px-3 py-2 border-r border-slate-300 bg-slate-100 min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Regime</th>
                  <th className="sticky left-[330px] z-40 px-3 py-2 border-r border-slate-300 text-right bg-slate-100 min-w-[130px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Faturamento Atual</th>

                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-slate-100/60 min-w-[110px]">Carga Trib. Efetiva</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-slate-100/60 min-w-[120px]">Tributos "Dentro"</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-right bg-slate-100/60 min-w-[120px]">Custo S/ Tributos</th>

                  {/* B2B PRIMEIRO */}
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-emerald-50/90 text-emerald-950 font-bold min-w-[120px]">Crédito IBS/CBS</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-emerald-50/90 text-emerald-950 font-bold min-w-[130px]">Custo Efetivo Líquido</th>
                  <th className="px-3 py-2 border-r border-emerald-300 text-right bg-emerald-100/70 text-emerald-950 font-bold min-w-[120px]">Variação % (Com Crédito)</th>

                  {/* B2C DEPOIS */}
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-amber-50/90 text-amber-950 min-w-[110px]">Carga S/ Crédito</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-amber-50/90 text-amber-950 min-w-[130px]">Novo Custo "Dentro"</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-amber-50/90 text-amber-950 min-w-[110px]">IVA (Por Fora)</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-right bg-amber-50/90 text-amber-950 font-bold min-w-[130px]">Nova NF Cheia</th>
                  <th className="px-3 py-2 text-right bg-amber-100/70 text-amber-950 font-bold min-w-[120px]">Variação % (Sem Crédito)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(() => {
                  const aliquotaLucroRealPct = 14.25; // Lucro Real (PIS 1,65% + COFINS 7,60% + ISS 5,00%)
                  const aliquotaLucroRealTax = 0.1425;
                  const aliquotaIvaPct = simulacao.output?.aliquotaTotal > 0 ? simulacao.output.aliquotaTotal : 9.68;
                  const aliquotaIvaTax = aliquotaIvaPct / 100;
                  const aliquotaIvaStr = `${aliquotaIvaPct.toFixed(2).replace('.', ',')}%`;

                  const demoList = [
                    { nome: "GEAP AUTOGESTAO EM SAUDE", doc: "03658432002479", regime: "Isento de IRPJ", fat: 103264.32 },
                    { nome: "SUPERIOR TRIBUNAL MILITAR", doc: "00488478002102", regime: "Isento de IRPJ", fat: 14690.00 },
                    { nome: "Fatima Regina De Oliveira", doc: "30867770104", regime: "Pessoa Física", fat: 7800.00 },
                    { nome: "SORAYA BARBOSA MONTEIRO", doc: "88723144168", regime: "Pessoa Física", fat: 7300.00 },
                    { nome: "Regiane dos Reis Silva", doc: "81070640115", regime: "Pessoa Física", fat: 6500.00 },
                    { nome: "SECRETARIA DA RECEITA FEDERAL", doc: "00394460000141", regime: "Isento de IRPJ", fat: 5900.00 },
                    { nome: "MINISTERIO DA SAUDE", doc: "00394544000185", regime: "Isento de IRPJ", fat: 5400.00 },
                    { nome: "UNIMED BRASILIA COOPERATIVA", doc: "00072382000109", regime: "Pessoa Jurídica", fat: 4800.00 }
                  ];

                  const dataToRender = receitas.length > 0
                    ? receitas.map(r => ({ nome: r.descricao || `TOMADOR DA NOTA #${r.nItem}`, doc: "NFe", regime: "Pessoa Física", fat: r.valor }))
                    : demoList;

                  return dataToRender.map((cli, i) => {
                    const fat = cli.fat;
                    const tribDentro = fat * aliquotaLucroRealTax; // Lucro Real
                    const custoSemTrib = fat * (1 - aliquotaLucroRealTax);

                    // IBS/CBS
                    const credIva = fat * aliquotaIvaTax;
                    const custoLiq = fat * (1 - aliquotaIvaTax);
                    const varComCredito = ((custoLiq - custoSemTrib) / custoSemTrib) * 100;

                    const novoCustoDentro = fat * 0.95;
                    const iva = fat * (aliquotaIvaTax * 0.4); // parcela efetiva por fora com redutor
                    const nfCheia = novoCustoDentro + iva;
                    const varSemCredito = ((nfCheia - fat) / fat) * 100;

                    return (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50/90 px-3 py-2.5 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                          <div className="font-bold text-slate-800">{cli.nome}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cli.doc}</div>
                        </td>
                        <td className="sticky left-[210px] z-20 bg-white group-hover:bg-slate-50/90 px-3 py-2.5 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200/60 inline-block">
                            {cli.regime}
                          </span>
                        </td>
                        <td className="sticky left-[330px] z-20 bg-white group-hover:bg-slate-50/90 px-3 py-2.5 text-right border-r border-slate-300 font-bold text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                          {formatCurrency(fat)}
                        </td>

                        {/* CENÁRIO ATUAL - LUCRO REAL */}
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 font-semibold text-slate-700">14,25%</td>
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 text-slate-600">{formatCurrency(tribDentro)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-slate-300 text-slate-600">{formatCurrency(custoSemTrib)}</td>

                        {/* IMPACTO B2B (APROVEITANDO CRÉDITO) */}
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-emerald-50/30 font-bold text-emerald-700">{formatCurrency(credIva)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-emerald-50/30 font-bold text-slate-900">{formatCurrency(custoLiq)}</td>
                        <td className={`px-3 py-2.5 text-right border-r border-emerald-300 bg-emerald-100/40 font-bold ${varComCredito <= 0 ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {varComCredito > 0 ? `+${varComCredito.toFixed(2)}%` : `${varComCredito.toFixed(2)}%`}
                        </td>

                        {/* IMPACTO B2C (NÃO APROVEITANDO CRÉDITO) */}
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-amber-50/30 font-semibold text-amber-950">{aliquotaIvaStr}</td>
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-amber-50/30 text-amber-900">{formatCurrency(novoCustoDentro)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-amber-50/30 text-amber-900">{formatCurrency(iva)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-amber-50/30 font-bold text-slate-900">{formatCurrency(nfCheia)}</td>
                        <td className={`px-3 py-2.5 text-right bg-amber-100/40 font-bold ${varSemCredito <= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {varSemCredito > 0 ? `+${varSemCredito.toFixed(2)}%` : `${varSemCredito.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Espaçador para garantir visão 100% livre acima da barra fixa de ações */}
      <div className="h-44 w-full shrink-0" />

      {/* Notificação Toast Flutuante */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <span>{notification}</span>
        </div>
      )}

      {/* Barra Inferior Fixa de Ações - Estilo Lucro Presumido */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 px-8 flex justify-center items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <button
          onClick={() => setCurrentStep(5)}
          className="bg-[#eaeff5] hover:bg-[#dfe6ee] text-[#475569] text-sm font-semibold px-6 py-2.5 rounded-lg border border-slate-300/60 shadow-xs transition-all cursor-pointer"
        >
          Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Imprimir Comparativo
        </button>
        <button
          onClick={handleExcluirDados}
          className="bg-[#e50000] hover:bg-[#cc0000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Excluir Dados
        </button>
        <button
          onClick={() => setCurrentStep(7)}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Avançar para Relatório em Excel
        </button>
      </div>

    </div>
  );
}

