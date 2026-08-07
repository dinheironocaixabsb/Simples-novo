"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { parseXmlNFe, ProdutoNota } from "../../../services/xml/lucro-real/parser";
import { UploadCloud, CheckCircle2, ShieldAlert, DollarSign, FileText, X, Check } from "lucide-react";
import { useState, useRef } from "react";

interface MesFaturamento {
  mes: string;
  competencia: string;
  atividades: {
    industria: boolean;
    comercio: boolean;
    servicos: boolean;
    equipHospitalar: boolean;
    transpCargas: boolean;
    transpPassageiros: boolean;
  };
  mercadoInterno: string;
  mercadoExterno: string;
  exclusoes: {
    descontosIncondicionais: string;
    devolucoesVendas: string;
    issExcluidoLc214: string;
    icmsPisCofins: string;
    icmsIbsCbs: string;
    pisCofinsIbsCbs: string;
  };
}

const INITIAL_MESES: MesFaturamento[] = [
  {
    mes: "Janeiro", competencia: "01/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 73.612,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 1.570,24", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Fevereiro", competencia: "02/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 88.590,14", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Março", competencia: "03/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 100.582,90", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 1.771,72", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Abril", competencia: "04/2026",
    atividades: { industria: false, comercio: false, servicos: true, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 79.391,14", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 1.587,82", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Maio", competencia: "05/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Junho", competencia: "06/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Julho", competencia: "07/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Agosto", competencia: "08/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Setembro", competencia: "09/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Outubro", competencia: "10/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Novembro", competencia: "11/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  },
  {
    mes: "Dezembro", competencia: "12/2026",
    atividades: { industria: false, comercio: false, servicos: false, equipHospitalar: false, transpCargas: false, transpPassageiros: false },
    mercadoInterno: "R$ 0,00", mercadoExterno: "0,00",
    exclusoes: { descontosIncondicionais: "R$ 0,00", devolucoesVendas: "R$ 0,00", issExcluidoLc214: "R$ 0,00", icmsPisCofins: "R$ 0,00", icmsIbsCbs: "R$ 0,00", pisCofinsIbsCbs: "R$ 0,00" }
  }
];

export function Step2Faturamento() {
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const receitas = useLucroRealStore((state) => state.receitasNFe);
  const setReceitas = useLucroRealStore((state) => state.setReceitasNFe);
  const meses = useLucroRealStore((state) => state.mesesFaturamento);
  const setMeses = useLucroRealStore((state) => state.setMesesFaturamento);

  const [activeTab, setActiveTab] = useState<'digitacao' | 'xml'>('digitacao');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProdutoModal, setSelectedProdutoModal] = useState<{ campo: string; mes: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const parseCurrencyNumber = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const updateMesField = (index: number, path: string, value: any) => {
    const updated = [...meses];
    if (path.startsWith('atividades.')) {
      const field = path.split('.')[1] as keyof MesFaturamento['atividades'];
      updated[index].atividades[field] = value;
    } else if (path.startsWith('exclusoes.')) {
      const field = path.split('.')[1] as keyof MesFaturamento['exclusoes'];
      updated[index].exclusoes[field] = value;
    } else {
      (updated[index] as any)[path] = value;
      if (path === 'mercadoInterno' || path === 'mercadoExterno') {
        const numVal = parseCurrencyNumber(value);
        const outroVal = path === 'mercadoInterno' ? parseCurrencyNumber(updated[index].mercadoExterno) : parseCurrencyNumber(updated[index].mercadoInterno);
        if (numVal === 0 && outroVal === 0) {
          updated[index].atividades = {
            industria: false,
            comercio: false,
            servicos: false,
            equipHospitalar: false,
            transpCargas: false,
            transpPassageiros: false
          };
        } else if (numVal > 0 && !Object.values(updated[index].atividades).some(Boolean)) {
          updated[index].atividades.servicos = true;
        }
      }
    }
    setMeses(updated);
  };

  // Funções para a Barra de Ações Inferior
  const handleImprimir = () => {
    window.print();
  };

  const handleSalvarDiagnostico = () => {
    localStorage.setItem("diagnostico_faturamento", JSON.stringify(meses));
    setNotification("Diagnóstico de faturamento salvo com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportar = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(meses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `diagnostico_faturamento_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    setNotification("Arquivo JSON exportado com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportarJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (Array.isArray(imported)) {
            setMeses(imported);
            setNotification("Dados de faturamento importados com sucesso!");
            setTimeout(() => setNotification(null), 3000);
          }
        } catch (err) {
          alert("Erro ao importar o arquivo. Formato JSON inválido.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExcluirDados = () => {
    const reset = meses.map(m => ({
      ...m,
      atividades: {
        industria: false,
        comercio: false,
        servicos: false,
        equipHospitalar: false,
        transpCargas: false,
        transpPassageiros: false
      },
      mercadoInterno: "R$ 0,00",
      mercadoExterno: "0,00",
      exclusoes: {
        descontosIncondicionais: "R$ 0,00",
        devolucoesVendas: "R$ 0,00",
        issExcluidoLc214: "R$ 0,00",
        icmsPisCofins: "R$ 0,00",
        icmsIbsCbs: "R$ 0,00",
        pisCofinsIbsCbs: "R$ 0,00"
      }
    }));
    setMeses(reset);
    setReceitas([]);
    setNotification("Dados de faturamento zerados e segmentos desmarcados!");
    setTimeout(() => setNotification(null), 3000);
  };

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    let todasAsNovasReceitas: any[] = [];
    
    let processed = 0;
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const xmlString = e.target?.result as string;
        if (xmlString) {
          const parsed = parseXmlNFe(xmlString);
          todasAsNovasReceitas = [...todasAsNovasReceitas, ...parsed];
        }
        processed++;
        if (processed === fileArray.length) {
          setReceitas([...receitas, ...todasAsNovasReceitas]);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const receitaTributada = receitas
    .filter(r => r.geraCreditoPisCofins)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const receitaIsenta = receitas
    .filter(r => !r.geraCreditoPisCofins)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const faturamentoTotal = receitaTributada + receitaIsenta;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-5xl mx-auto pb-40">
      
      {/* Toast de Notificação */}
      {notification && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Input Oculto para Importação JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportarJSON}
        accept=".json"
        className="hidden"
      />

      {/* Header Fixo */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-[#025ca4] uppercase tracking-wider mb-1">
          2. Dados de Receitas
        </h2>
        <p className="text-slate-500 text-sm">
          Informe as receitas faturadas mês a mês por segmento de atividade.
        </p>
      </div>

      {/* Navegação de Abas */}
      <div className="flex border-b border-slate-200 mb-6 bg-slate-100/60 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab('digitacao')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'digitacao'
              ? 'bg-white text-[#025ca4] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Digitação de Receitas
        </button>
        <button
          onClick={() => setActiveTab('xml')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'xml'
              ? 'bg-white text-[#025ca4] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Notas Fiscais de Vendas e Serviços Prestados (XML)
        </button>
      </div>

      {/* ABA 1: DIGITAÇÃO DE RECEITAS */}
      {activeTab === 'digitacao' && (
        <div className="space-y-6">
          {meses.map((mesData, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              
              {/* Topo do Mês - Card de Competência Alinhado à Esquerda */}
              <div className="flex justify-start items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Competência</span>
                  <input
                    type="text"
                    value={mesData.competencia}
                    onChange={(e) => updateMesField(idx, 'competencia', e.target.value)}
                    placeholder="MM/AAAA"
                    className="w-28 bg-white border border-slate-300 rounded px-3 py-1 text-center text-xs font-medium text-slate-700 outline-none focus:border-[#025ca4]"
                  />
                </div>
              </div>

              {/* Segmentos de Atividade / Receita */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Segmentos de Atividade / Receita
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-6 text-xs text-slate-700 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mesData.atividades.industria}
                      onChange={(e) => updateMesField(idx, 'atividades.industria', e.target.checked)}
                      className="rounded text-[#025ca4] focus:ring-0"
                    />
                    Indústria
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mesData.atividades.comercio}
                      onChange={(e) => updateMesField(idx, 'atividades.comercio', e.target.checked)}
                      className="rounded text-[#025ca4] focus:ring-0"
                    />
                    Comércio
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mesData.atividades.servicos}
                      onChange={(e) => updateMesField(idx, 'atividades.servicos', e.target.checked)}
                      className="rounded text-[#025ca4] focus:ring-0"
                    />
                    Serviços
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mesData.atividades.equipHospitalar}
                      onChange={(e) => updateMesField(idx, 'atividades.equipHospitalar', e.target.checked)}
                      className="rounded text-[#025ca4] focus:ring-0"
                    />
                    Equip. Hospitalar
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mesData.atividades.transpCargas}
                      onChange={(e) => updateMesField(idx, 'atividades.transpCargas', e.target.checked)}
                      className="rounded text-[#025ca4] focus:ring-0"
                    />
                    Transp. Cargas
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mesData.atividades.transpPassageiros}
                      onChange={(e) => updateMesField(idx, 'atividades.transpPassageiros', e.target.checked)}
                      className="rounded text-[#025ca4] focus:ring-0"
                    />
                    Transp. Passageiros
                  </label>
                </div>
              </div>

              {/* Subcard da Atividade Selecionada (Serviços em Geral) */}
              {mesData.atividades.servicos && (
                <div className="border border-blue-200 bg-blue-50/20 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800">Serviços em Geral</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Mercado Interno (R$)
                      </label>
                      <input
                        type="text"
                        value={mesData.mercadoInterno}
                        onChange={(e) => updateMesField(idx, 'mercadoInterno', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                      />
                      <button
                        onClick={() => setSelectedProdutoModal({ campo: 'Mercado Interno', mes: mesData.mes })}
                        className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                      >
                        Ver Produtos
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Mercado Externo (R$)
                      </label>
                      <input
                        type="text"
                        value={mesData.mercadoExterno}
                        onChange={(e) => updateMesField(idx, 'mercadoExterno', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                      />
                      <button
                        onClick={() => setSelectedProdutoModal({ campo: 'Mercado Externo', mes: mesData.mes })}
                        className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                      >
                        Ver Produtos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Exclusões da Base ISS/CBS (Detalhamento) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#025ca4] flex items-center gap-1">
                    <span>$</span> Exclusões da Base ISS/CBS (Detalhamento)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Informe abaixo os valores que não compõem a base de cálculo. O sistema deduzirá a soma destes automaticamente. Obs: O ISS e ICMS da operação já serão deduzidos automaticamente. NUNCA lance Devolução de compras.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
                      Descontos Incondicionais
                    </label>
                    <input
                      type="text"
                      value={mesData.exclusoes.descontosIncondicionais}
                      onChange={(e) => updateMesField(idx, 'exclusoes.descontosIncondicionais', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                    />
                    <button
                      onClick={() => setSelectedProdutoModal({ campo: 'Descontos Incondicionais', mes: mesData.mes })}
                      className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                    >
                      Ver Produtos
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
                      Devoluções de Vendas
                    </label>
                    <input
                      type="text"
                      value={mesData.exclusoes.devolucoesVendas}
                      onChange={(e) => updateMesField(idx, 'exclusoes.devolucoesVendas', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                    />
                    <button
                      onClick={() => setSelectedProdutoModal({ campo: 'Devoluções de Vendas', mes: mesData.mes })}
                      className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                    >
                      Ver Produtos
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
                      ISS Excluído da Base (LC 214)
                    </label>
                    <input
                      type="text"
                      value={mesData.exclusoes.issExcluidoLc214}
                      onChange={(e) => updateMesField(idx, 'exclusoes.issExcluidoLc214', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                    />
                    <button
                      onClick={() => setSelectedProdutoModal({ campo: 'ISS Excluído da Base (LC 214)', mes: mesData.mes })}
                      className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                    >
                      Ver Produtos
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
                      ICMS destacado a excluir da base de cálculo do PIS/COFINS
                    </label>
                    <input
                      type="text"
                      value={mesData.exclusoes.icmsPisCofins}
                      onChange={(e) => updateMesField(idx, 'exclusoes.icmsPisCofins', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                    />
                    <button
                      onClick={() => setSelectedProdutoModal({ campo: 'ICMS destacado PIS/COFINS', mes: mesData.mes })}
                      className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                    >
                      Ver Produtos
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
                      ICMS Total a excluir da base do IBS/CBS
                    </label>
                    <input
                      type="text"
                      value={mesData.exclusoes.icmsIbsCbs}
                      onChange={(e) => updateMesField(idx, 'exclusoes.icmsIbsCbs', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                    />
                    <button
                      onClick={() => setSelectedProdutoModal({ campo: 'ICMS Total IBS/CBS', mes: mesData.mes })}
                      className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                    >
                      Ver Produtos
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
                      PIS/COFINS a excluir da base do IBS/CBS
                    </label>
                    <input
                      type="text"
                      value={mesData.exclusoes.pisCofinsIbsCbs}
                      onChange={(e) => updateMesField(idx, 'exclusoes.pisCofinsIbsCbs', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
                    />
                    <button
                      onClick={() => setSelectedProdutoModal({ campo: 'PIS/COFINS a excluir IBS/CBS', mes: mesData.mes })}
                      className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
                    >
                      Ver Produtos
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ABA 2: UPLOAD E ANÁLISE DE XML */}
      {activeTab === 'xml' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
              isDragging ? 'border-[#025ca4] bg-blue-50' : 'border-slate-300 bg-slate-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#025ca4]' : 'text-slate-400'}`} />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Arraste e solte seus XMLs de Saída aqui</h3>
            <p className="text-slate-500 text-sm mb-6">Você pode selecionar centenas de arquivos de uma só vez (Ilimitado).</p>
            <label className="bg-[#025ca4] hover:bg-[#024883] text-white px-6 py-2.5 rounded-lg cursor-pointer transition-colors inline-block font-medium text-xs">
              Selecionar Arquivos (XML)
              <input 
                type="file" 
                accept=".xml" 
                multiple
                className="hidden" 
                onChange={(e) => handleFileUpload(e.target.files)} 
              />
            </label>
          </div>

          {receitas.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Faturamento Total</p>
                  <p className="text-xl font-bold text-[#025ca4]">{formatCurrency(faturamentoTotal)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium">Receita Tributada (Normal)</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(receitaTributada)}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium">Receita Monofásica/Isenta</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(receitaIsenta)}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-[#025ca4] text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Descrição / NCM</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Valor da Venda</th>
                      <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider">Classificação Tributária</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {receitas.map((p, idx) => {
                      const isTributada = p.geraCreditoPisCofins; 
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-500">{p.nItem}</td>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 font-medium truncate max-w-[300px]" title={p.descricao}>{p.descricao}</p>
                            <p className="text-xs text-slate-500">NCM: {p.ncm} | CFOP: {p.cfop}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(p.valor)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                isTributada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                               {isTributada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                               {isTributada ? 'Tributada (Normal)' : 'Isenta / Monofásica'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE PRODUTOS / DETALHAMENTO */}
      {selectedProdutoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#025ca4]">Detalhamento de Produtos</h3>
                <p className="text-xs text-slate-500">
                  Campo: <strong>{selectedProdutoModal.campo}</strong> | Mês: <strong>{selectedProdutoModal.mes}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedProdutoModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs text-slate-600">
              {receitas.length > 0 ? (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {receitas.map((prod, i) => (
                    <div key={i} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{prod.descricao}</p>
                        <p className="text-[10px] text-slate-500">NCM: {prod.ncm}</p>
                      </div>
                      <span className="font-semibold text-slate-700">{formatCurrency(prod.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum XML de produto vinculado a este campo no momento.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedProdutoModal(null)}
                className="bg-[#025ca4] hover:bg-[#024883] text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Espaçador para garantir visão 100% livre acima da barra fixa de ações */}
      <div className="h-44 w-full shrink-0" />

      {/* Barra Inferior Fixa de Ações - Estilo Lucro Presumido */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 px-8 flex justify-center items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <button
          onClick={() => setCurrentStep(1)}
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
          onClick={handleSalvarDiagnostico}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Salvar Diagnóstico
        </button>
        <button
          onClick={handleExcluirDados}
          className="bg-[#e50000] hover:bg-[#cc0000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Excluir Dados
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Avançar para Impostos da Renda
        </button>
      </div>

    </div>
  );
}
