"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { RedutorType } from "../../../services/tax-engine/lucro-real/ibsCbs";
import { HelpCircle, Check } from "lucide-react";
import { useState } from "react";

export function Step3Aliquotas() {
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const simulacao = useLucroRealStore((state) => state.simulacaoIbsCbs);
  const setSimulacao = useLucroRealStore((state) => state.setSimulacaoIbsCbs);

  const [notification, setNotification] = useState<string | null>(null);

  // Estados locais para os campos editáveis da UI
  const [aliqIms, setAliqIcms] = useState("");
  const [aliqIss, setAliqIss] = useState("");
  const [creditoEstoque, setCreditoEstoque] = useState("");
  const [tipoSimples, setTipoSimples] = useState("das");
  const [aliqSimples, setAliqSimples] = useState("4,00");

  const [aliqCreditoIbs, setAliqCreditoIbs] = useState("0,10");
  const [aliqCreditoCbs, setAliqCreditoCbs] = useState("9,45");

  // Funções dos botões da barra inferior
  const handleImprimir = () => {
    window.print();
  };

  const handleSalvar = () => {
    setNotification("Configuração de alíquotas salva com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExcluir = () => {
    setSimulacao({ ano: 2026, redutor: 'NONE' });
    setAliqIcms("");
    setAliqIss("");
    setCreditoEstoque("");
    setAliqSimples("4,00");
    setAliqCreditoIbs("0,10");
    setAliqCreditoCbs("9,45");
    setNotification("Alíquotas redefinidas para o padrão!");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl mx-auto pb-40">
      
      {/* Toast de Notificação */}
      {notification && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Fixo */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-[#025ca4] uppercase tracking-wider mb-1">
          4. Configuração de Alíquotas (IBS/CBS)
        </h2>
        <p className="text-slate-500 text-sm">
          Informe as Alíquotas do IBS e CBS para o cenário do novo IVA (Por Fora).
        </p>
      </div>

      <div className="space-y-6">
        
        {/* BLOCO SUPERIOR: 2 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Esquerdo: Entendendo o Novo IVA Dual */}
          <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                Entendendo o Novo IVA Dual (LC 214)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                Com a Reforma Tributária, as empresas optantes pelo <strong>Lucro Presumido</strong> estão inseridas na sistemática regular (não-cumulativa) de apuração do <strong>IBS</strong> e da <strong>CBS</strong>.
              </p>
              
              <h4 className="text-xs font-bold text-slate-800 mb-1.5">
                Mecânica Estratégica:
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Neste regime, a empresa debitará as alíquotas plenas (ou com os redutores legais) sobre suas receitas e terá o direito fundamental de transferir <strong>crédito integral (100%)</strong> do imposto recolhido aos seus clientes Pessoa Jurídica (operações B2B).
              </p>
            </div>
          </div>

          {/* Card Direito: Alíquotas Aplicáveis */}
          <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">
              Alíquotas Aplicáveis
            </h3>

            {/* Ano de Simulação */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Ano de Simulação (Resolução CGIBS 06/2026):
              </label>
              <select
                value={simulacao.input.ano}
                onChange={(e) => setSimulacao({ ano: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
              >
                <option value={2027}>Transição (2027 a 2028) - Extinção PIS/COFINS</option>
                <option value={2026}>Ano 2026 (Alíquota Teste 0,1% / 0,9%)</option>
                <option value={2029}>Pós-Transição Progressivo (2029 a 2032)</option>
                <option value={2033}>Alíquota Cheia (2033 em diante)</option>
              </select>
            </div>

            {/* Alíq IBS e CBS (Débito) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ALÍQ. IBS (%)
                </label>
                <input
                  type="text"
                  value={simulacao.output.aliquotaIbs.toFixed(2).replace('.', ',')}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ALÍQ. CBS (%)
                </label>
                <input
                  type="text"
                  value={simulacao.output.aliquotaCbs.toFixed(2).replace('.', ',')}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-bold outline-none"
                />
              </div>
            </div>

            {/* Alíq ICMS e ISS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                  ALÍQ. ICMS (%) <span title="Alíquota interna de ICMS do estado do contribuinte"><HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" /></span>
                </label>
                <input
                  type="text"
                  value={aliqIms}
                  onChange={(e) => setAliqIcms(e.target.value)}
                  placeholder="Ex: 18,00"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                  ALÍQ. ISS (%) <span title="Alíquota de ISS do município do contribuinte"><HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" /></span>
                </label>
                <input
                  type="text"
                  value={aliqIss}
                  onChange={(e) => setAliqIss(e.target.value)}
                  placeholder="Ex: 5,00"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                />
              </div>
            </div>

            {/* Crédito Presumido de Estoque */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-2">
                Crédito Presumido de Estoque (Transição LC 214) <span title="Crédito sobre estoque na virada da transição"><HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" /></span>
              </label>
              <input
                type="text"
                value={creditoEstoque}
                onChange={(e) => setCreditoEstoque(e.target.value)}
                placeholder="Valor Mensal do Abatimento (R$)"
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
              />
            </div>

            {/* Redutor de Alíquota IBS/CBS */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Redutor de Alíquota IBS/CBS (LC 214):
              </label>
              <select
                value={simulacao.input.redutor}
                onChange={(e) => setSimulacao({ redutor: e.target.value as RedutorType })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
              >
                <option value="NONE">Nenhum (Alíquota Cheia - 100%)</option>
                <option value="30%">Redução de 30% (Profissões Regulamentadas)</option>
                <option value="40%">Redução de 40% (Serviços de Alimentação - Restaurantes/Bares)</option>
                <option value="60%">Redução de 60% (Educação, Saúde, Transp. Coletivo...)</option>
              </select>

              <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1 mt-2 leading-relaxed">
                <p>* A redução se aplica <strong>diretamente sobre a alíquota</strong> (ex: se 26,5% com redução de 30%, a alíquota efetiva vira 18,55%).</p>
                <p>* <strong>Atenção:</strong> Cada redução possui requisitos específicos na LC 214. A redução de 30% aplica-se a serviços de profissões regulamentadas (ex: advogados, médicos, engenheiros, contadores, arquitetos). A redução de 60% foca em serviços de saúde, educação, entre outros. A isenção (100%) aplica-se a casos muito específicos, como o transporte público coletivo de passageiros.</p>
              </div>
            </div>

            {/* Destaque Amarelo: Créditos de Fornecedores do Simples Nacional */}
            <div className="border-2 border-amber-400 bg-amber-50/20 rounded-xl p-3.5 space-y-3">
              <label className="text-xs font-bold text-amber-900 block">
                Créditos de Fornecedores do Simples Nacional:
              </label>
              <select
                value={tipoSimples}
                onChange={(e) => setTipoSimples(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-amber-500"
              >
                <option value="das">Por Dentro do DAS (Fração de IBS/CBS Estimada)</option>
                <option value="zero">Sem Crédito de Simples Nacional</option>
              </select>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Alíquota Média Estimada (%)
                </label>
                <input
                  type="text"
                  value={aliqSimples}
                  onChange={(e) => setAliqSimples(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-amber-500"
                />
              </div>
            </div>

          </div>
        </div>

        {/* BLOCO INFERIOR: 2 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Esquerdo: Direito ao Crédito (No-Cumulatividade) */}
          <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                Direito ao Crédito (No-Cumulatividade)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                No <strong>Lucro Presumido</strong> (regime regular "Por Fora"), sua empresa tem o direito constitucional de <strong>descontar o imposto pago nas aquisições e despesas</strong> do valor do imposto devido sobre o faturamento, evitando a tributação em cascata.
              </p>
              
              <h4 className="text-xs font-bold text-slate-800 mb-1.5">
                Como funciona o cálculo?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                As alíquotas preenchidas abaixo simularão a recuperação de impostos sobre os gastos estritamente vinculados sua atividade (insumos, manutenção, prestadores). Vale ressaltar que a maior despesa de muitas empresas, <strong>a folha de pagamento (salários e encargos), NÃO gera crédito</strong> no novo IVA, o que exige atenção no planejamento.
              </p>
            </div>
          </div>

          {/* Card Direito: Alíquotas Gerais para Crédito */}
          <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">
              Alíquotas Gerais para Crédito
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ALÍQ. IBS (%)
                </label>
                <input
                  type="text"
                  value={aliqCreditoIbs}
                  onChange={(e) => setAliqCreditoIbs(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ALÍQ. CBS (%)
                </label>
                <input
                  type="text"
                  value={aliqCreditoCbs}
                  onChange={(e) => setAliqCreditoCbs(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Espaçador para garantir visão 100% livre acima da barra fixa de ações */}
      <div className="h-44 w-full shrink-0" />

      {/* Barra Inferior Fixa de Ações - Estilo Lucro Presumido */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 px-8 flex justify-center items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <button
          onClick={() => setCurrentStep(3)}
          className="bg-[#eaeff5] hover:bg-[#dfe6ee] text-[#475569] text-sm font-semibold px-6 py-2.5 rounded-lg border border-slate-300/60 shadow-xs transition-all cursor-pointer"
        >
          Voltar
        </button>
        <button
          onClick={handleImprimir}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Imprimir
        </button>
        <button
          onClick={handleSalvar}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Salvar Diagnóstico
        </button>
        <button
          onClick={handleExcluir}
          className="bg-[#e50000] hover:bg-[#cc0000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Excluir Dados
        </button>
        <button
          onClick={() => setCurrentStep(5)}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Avançar para Despesas e Créditos
        </button>
      </div>

    </div>
  );
}
