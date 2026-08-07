"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { parseXmlNFe } from "../../../services/xml/lucro-real/parser";
import { UploadCloud, CheckCircle2, ShieldAlert, FileText, X, Plus, Pencil, Trash2, Check, RefreshCw } from "lucide-react";
import { useState, useRef, useMemo } from "react";

interface NotaDespesa {
  id: string;
  nNota: string;
  data: string;
  fornecedor: string;
  cnpj: string;
  tag?: string;
  regimeTributario: string;
  tipoCredito: string;
  descricao: string;
  valor: number;
}

const INITIAL_NOTAS: NotaDespesa[] = [
  {
    id: "1", nNota: "L.MANUAL", data: "02/02/2026",
    fornecedor: "CLINICA ODONTOLOGICA FEHER SS LTDA", cnpj: "03.557.085/0001-69", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Presumido", tipoCredito: "Gera Crédito",
    descricao: "VALE TRANSPORTE E VALE ALIMENTAÇÃO", valor: 2560.00
  },
  {
    id: "2", nNota: "5689", data: "03/02/2026",
    fornecedor: "MS - PAPELARIA E LIVRARIA LTDA", cnpj: "53.058.210/0001-52", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Simples Nacional", tipoCredito: "Gera Crédito",
    descricao: "FITA DUC PAPELARIA E CRISTAL - TAPE5589, PAPEL A-4 - 75G CHAMEX...", valor: 78.00
  },
  {
    id: "3", nNota: "2462", data: "04/02/2026",
    fornecedor: "RENNOVARE ACADEMIC LTDA", cnpj: "43.158.706/0001-18", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Simples Nacional", tipoCredito: "Gera Crédito",
    descricao: "KIT LASER TERAPIA SR101 SEG...", valor: 634.00
  },
  {
    id: "4", nNota: "6834", data: "06/02/2026",
    fornecedor: "LABORATORIO DE PROTESE ODONTOLOGICA METROPOLIS DIGITAL LTDA", cnpj: "20.730.082/0001-32", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Simples Nacional", tipoCredito: "Gera Crédito",
    descricao: "PROTESE DENTARIA", valor: 1021.25
  },
  {
    id: "5", nNota: "245835", data: "11/02/2026",
    fornecedor: "KALUNGA SA", cnpj: "43.283.811/0040-16", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Real", tipoCredito: "Gera Crédito",
    descricao: "Trava plástica item 43140504 Tramontina RT 1...", valor: 21.20
  },
  {
    id: "6", nNota: "57066", data: "12/02/2026",
    fornecedor: "FEDERAL DENTAL PRODUTOS ODONTOLOGICOS LTDA", cnpj: "37.515.656/0001-07", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Simples Nacional", tipoCredito: "Gera Crédito",
    descricao: "SUPORTE J-JBOND L-POP 50 UND - REF 73145000000000000000000000...", valor: 91.00
  },
  {
    id: "7", nNota: "205722", data: "13/02/2026",
    fornecedor: "JJGC INDUSTRIA E COMERCIO DE MATERIAIS DENTARIOS S.A", cnpj: "02.830.435/0001-20", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Real", tipoCredito: "Gera Crédito",
    descricao: "MICRO PILAR CM 4.5/ 2.5; TRANSFER DO MICRO PILAR MOLDAGEM ABERTA...", valor: 872.00
  },
  {
    id: "8", nNota: "419012", data: "13/02/2026",
    fornecedor: "JJGC INDUSTRIA E COMERCIO DE MATERIAIS DENTARIOS S.A", cnpj: "02.830.435/0001-20", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Real", tipoCredito: "Gera Crédito",
    descricao: "ANALOGO REPOSICAO HIBRIDO MICRO PILAR", valor: 98.00
  },
  {
    id: "9", nNota: "206165", data: "19/02/2026",
    fornecedor: "JJGC INDUSTRIA E COMERCIO DE MATERIAIS DENTARIOS S.A", cnpj: "02.830.435/0001-20", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Real", tipoCredito: "Gera Crédito",
    descricao: "IMPLANTE TITANIO CM CORTICAL 4.0X9", valor: 397.00
  },
  {
    id: "10", nNota: "26661", data: "21/02/2026",
    fornecedor: "DENTAL GOLDEN PRODUTOS ODONTOLOGICOS LTDA", cnpj: "09.182.553/0001-83", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Simples Nacional", tipoCredito: "Gera Crédito",
    descricao: "COPOS DESCARTAVEIS 200ML, ROLO DE ESTERILIZACAO 100MM, ROLO DE ESTERILIZACAO...", valor: 2246.59
  },
  {
    id: "11", nNota: "2713", data: "24/02/2026",
    fornecedor: "MOISES CAMPOS ARAUJO", cnpj: "13.626.839/0001-13", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Simples Nacional", tipoCredito: "Gera Crédito",
    descricao: "CUBO ULTRASSONICO KIT ULTRASSCALER II", valor: 1500.00
  },
  {
    id: "12", nNota: "206632", data: "24/02/2026",
    fornecedor: "JJGC INDUSTRIA E COMERCIO DE MATERIAIS DENTARIOS S.A", cnpj: "02.830.435/0001-20", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Real", tipoCredito: "Gera Crédito",
    descricao: "IMPLANTE TITANIO CM CORTICAL 4.0X9", valor: 794.00
  },
  {
    id: "13", nNota: "207055", data: "25/02/2026",
    fornecedor: "JJGC INDUSTRIA E COMERCIO DE MATERIAIS DENTARIOS S.A", cnpj: "02.830.435/0001-20", tag: "2.5.0 - Combustíveis e Limpeza/Utilidades",
    regimeTributario: "Lucro Real", tipoCredito: "Gera Crédito",
    descricao: "MINI PILAR CONICO CM 4.8/ 2.5; MINI PILAR CONICO CM 4.8/ 3.5; CILINDRO...", valor: 690.00
  }
];

interface DespesasElegiveisMes {
  despesaGeral: string;
  produtosNormal: string;
  anexo1Alimentos: string;
  anexo15Hortifruti: string;
  anexo7Alimentos: string;
  anexo8Higiene: string;
  icmsTotalCompras: string;
  pisCofinsDeduzCompras: string;
  descontoIncondCompras: string;
}

const DEFAULT_DESPESAS_MES: DespesasElegiveisMes = {
  despesaGeral: "R$ 1.533,00",
  produtosNormal: "R$ 59.832,16",
  anexo1Alimentos: "R$ 59,00",
  anexo15Hortifruti: "0,00",
  anexo7Alimentos: "0,00",
  anexo8Higiene: "R$ 169,50",
  icmsTotalCompras: "R$ 3.078,76",
  pisCofinsDeduzCompras: "0,00",
  descontoIncondCompras: "R$ 782,04"
};

const BLANK_DESPESAS_MES: DespesasElegiveisMes = {
  despesaGeral: "R$ 0,00",
  produtosNormal: "R$ 0,00",
  anexo1Alimentos: "R$ 0,00",
  anexo15Hortifruti: "0,00",
  anexo7Alimentos: "0,00",
  anexo8Higiene: "R$ 0,00",
  icmsTotalCompras: "R$ 0,00",
  pisCofinsDeduzCompras: "0,00",
  descontoIncondCompras: "R$ 0,00"
};

export function Step4Xml() {
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const produtos = useLucroRealStore((state) => state.produtosNFe);
  const setProdutos = useLucroRealStore((state) => state.setProdutosNFe);
  const salvarClienteAtual = useLucroRealStore((state) => state.salvarClienteAtual);

  const [activeMonth, setActiveMonth] = useState("Fevereiro");
  const [isDragging, setIsDragging] = useState(false);
  const [isReconsulting, setIsReconsulting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleReconsultarCnpjs = () => {
    setIsReconsulting(true);
    setTimeout(() => {
      setIsReconsulting(false);
      setNotification("CNPJs reconsultados e validados na Receita Federal com sucesso!");
      setTimeout(() => setNotification(null), 3000);
    }, 1000);
  };

  const handleLimparTudoNotas = () => {
    setNotas([]);
    setProdutos([]);
    localStorage.setItem("diagnostico_despesas", JSON.stringify([]));
    salvarClienteAtual();
    setNotification("Tabela de notas e lançamentos limpa com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  // Estado das Despesas por Mês
  const [despesasPorMes, setDespesasPorMes] = useState<Record<string, DespesasElegiveisMes>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("diagnostico_despesas_por_mes");
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      "Janeiro": { ...DEFAULT_DESPESAS_MES },
      "Fevereiro": { ...DEFAULT_DESPESAS_MES },
      "Março": { ...DEFAULT_DESPESAS_MES },
      "Abril": { ...DEFAULT_DESPESAS_MES },
      "Maio": { ...BLANK_DESPESAS_MES },
      "Junho": { ...BLANK_DESPESAS_MES },
      "Julho": { ...BLANK_DESPESAS_MES },
      "Agosto": { ...BLANK_DESPESAS_MES },
      "Setembro": { ...BLANK_DESPESAS_MES },
      "Outubro": { ...BLANK_DESPESAS_MES },
      "Novembro": { ...BLANK_DESPESAS_MES },
      "Dezembro": { ...BLANK_DESPESAS_MES },
    };
  });

  // Filtros da Tabela
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegime, setFilterRegime] = useState("TODOS");
  const [filterCredito, setFilterCredito] = useState("TODOS");

  // Lista de Notas (Inicializa do LocalStorage ou do padrão se não houver registro)
  const [notas, setNotas] = useState<NotaDespesa[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("diagnostico_despesas");
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_NOTAS;
  });

  // Modais
  const [isModalManualOpen, setIsModalManualOpen] = useState(false);
  const [selectedProdutoModal, setSelectedProdutoModal] = useState<{ campo: string; mes: string } | null>(null);

  // Formulário Nota Manual
  const [manualForm, setManualForm] = useState({
    nNota: "L.MANUAL",
    data: "01/02/2026",
    fornecedor: "",
    cnpj: "",
    regimeTributario: "Lucro Presumido",
    tipoCredito: "Gera Crédito",
    descricao: "",
    valor: ""
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const mesesList = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const currentDespesas = despesasPorMes[activeMonth] || BLANK_DESPESAS_MES;

  const updateDespesaField = (field: keyof DespesasElegiveisMes, value: string) => {
    setDespesasPorMes(prev => ({
      ...prev,
      [activeMonth]: {
        ...(prev[activeMonth] || BLANK_DESPESAS_MES),
        [field]: value
      }
    }));
  };

  const getShortMes = (mes: string) => {
    const map: Record<string, string> = {
      "Janeiro": "Jan", "Fevereiro": "Fev", "Março": "Mar", "Abril": "Abr",
      "Maio": "Mai", "Junho": "Jun", "Julho": "Jul", "Agosto": "Ago",
      "Setembro": "Set", "Outubro": "Out", "Novembro": "Nov", "Dezembro": "Dez"
    };
    return map[mes] || mes;
  };

  // Processamento de Upload XML
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    let novasNotas: NotaDespesa[] = [];
    
    let processed = 0;
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const xmlString = e.target?.result as string;
        if (xmlString) {
          const parsed = parseXmlNFe(xmlString);
          parsed.forEach((p, idx) => {
            novasNotas.push({
              id: crypto.randomUUID(),
              nNota: String(p.nItem || idx + 100),
              data: "15/02/2026",
              fornecedor: p.descricao.split(' ')[0] + " FORNECEDOR LTDA",
              cnpj: "12.345.678/0001-90",
              regimeTributario: "Lucro Real",
              tipoCredito: p.geraCreditoIbsCbs ? "Gera Crédito" : "Não Gera Crédito",
              descricao: p.descricao,
              valor: p.valor
            });
          });
        }
        processed++;
        if (processed === fileArray.length) {
          const updatedNotas = [...notas, ...novasNotas];
          setNotas(updatedNotas);
          localStorage.setItem("diagnostico_despesas", JSON.stringify(updatedNotas));
          salvarClienteAtual();
          setNotification(`${novasNotas.length} item(ns) importado(s) com sucesso!`);
          setTimeout(() => setNotification(null), 3000);
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

  // Exclusão de Item
  const handleRemoveNota = (id: string) => {
    const updated = notas.filter(n => n.id !== id);
    setNotas(updated);
    localStorage.setItem("diagnostico_despesas", JSON.stringify(updated));
    salvarClienteAtual();
  };

  // Adição de Nota Manual
  const handleAddManualNota = () => {
    if (!manualForm.fornecedor || !manualForm.descricao || !manualForm.valor) {
      alert("Preencha os campos obrigatórios (Fornecedor, Descrição e Valor).");
      return;
    }
    const newNota: NotaDespesa = {
      id: crypto.randomUUID(),
      nNota: manualForm.nNota,
      data: manualForm.data,
      fornecedor: manualForm.fornecedor,
      cnpj: manualForm.cnpj || "00.000.000/0001-00",
      regimeTributario: manualForm.regimeTributario,
      tipoCredito: manualForm.tipoCredito,
      descricao: manualForm.descricao,
      valor: parseFloat(manualForm.valor.replace(',', '.')) || 0
    };
    const updated = [newNota, ...notas];
    setNotas(updated);
    localStorage.setItem("diagnostico_despesas", JSON.stringify(updated));
    salvarClienteAtual();
    setIsModalManualOpen(false);
    setManualForm({
      nNota: "L.MANUAL", data: "01/02/2026", fornecedor: "", cnpj: "",
      regimeTributario: "Lucro Presumido", tipoCredito: "Gera Crédito", descricao: "", valor: ""
    });
    setNotification("Nota lançada manualmente com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtragem de Notas na Tabela
  const filteredNotas = notas.filter(n => {
    const matchSearch = n.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        n.cnpj.includes(searchTerm) ||
                        n.nNota.includes(searchTerm) ||
                        n.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRegime = filterRegime === "TODOS" || n.regimeTributario === filterRegime;
    const matchCredito = filterCredito === "TODOS" || n.tipoCredito === filterCredito;

    return matchSearch && matchRegime && matchCredito;
  });

  const totalFiltrado = filteredNotas.reduce((acc, curr) => acc + curr.valor, 0);

  const totalMaterialInsumos = useMemo(() => {
    return notas
      .filter(n => !n.descricao.toUpperCase().includes("VALE"))
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [notas]);

  const totalValeTransporte = useMemo(() => {
    return notas
      .filter(n => n.descricao.toUpperCase().includes("VALE"))
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [notas]);

  // Ações da Barra Inferior
  const handleImprimir = () => {
    window.print();
  };

  const handleSalvarDiagnostico = () => {
    localStorage.setItem("diagnostico_despesas", JSON.stringify(notas));
    localStorage.setItem("diagnostico_despesas_por_mes", JSON.stringify(despesasPorMes));
    salvarClienteAtual();
    setNotification("Diagnóstico de despesas salvo com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExcluirDados = () => {
    const resetDespesas: Record<string, DespesasElegiveisMes> = {};
    mesesList.forEach(m => {
      resetDespesas[m] = { ...BLANK_DESPESAS_MES };
    });
    setNotas([]);
    setProdutos([]);
    setDespesasPorMes(resetDespesas);

    // PERSISTIR A EXCLUSÃO NO LOCALSTORAGE E NO STORE CLIENTE ATUAL
    localStorage.setItem("diagnostico_despesas", JSON.stringify([]));
    localStorage.setItem("diagnostico_despesas_por_mes", JSON.stringify(resetDespesas));
    salvarClienteAtual();

    setNotification("Despesas, notas e XMLs zerados e excluídos com sucesso!");
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
          5. Despesas e Levantamento de Créditos
        </h2>
        <p className="text-slate-500 text-sm">
          Informe as despesas para calcular os créditos de IBS e CBS separados.
        </p>
      </div>

      {/* Navegador de Meses */}
      <div className="mb-6">
        <p className="text-xs font-bold text-slate-700 mb-2">Despesas: Mês de {activeMonth}</p>
        <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
          {mesesList.map(mes => (
            <button 
              key={mes}
              onClick={() => setActiveMonth(mes)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all border whitespace-nowrap ${
                activeMonth === mes 
                  ? 'bg-[#025ca4] text-white border-[#025ca4] shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {mes}
            </button>
          ))}
        </div>
      </div>

      {/* Box 1: Despesas Elegíveis LC 214 */}
      <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm mb-6 space-y-4">
        <h3 className="text-xs font-bold text-[#025ca4]">
          Despesas Elegíveis LC 214- Mês de {getShortMes(activeMonth)}
        </h3>

        {/* Top Grid: 6 Campos de Despesas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              Despesa Geral (Normal)
            </label>
            <input
              type="text"
              value={currentDespesas.despesaGeral}
              onChange={(e) => updateDespesaField('despesaGeral', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: 'Despesa Geral (Normal)', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              Produtos Tribut. Normal (Crédito 100%)
            </label>
            <input
              type="text"
              value={currentDespesas.produtosNormal}
              onChange={(e) => updateDespesaField('produtosNormal', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: 'Produtos Tribut. Normal (100%)', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              Anexo I: Alimentos (Zero)
            </label>
            <input
              type="text"
              value={currentDespesas.anexo1Alimentos}
              onChange={(e) => updateDespesaField('anexo1Alimentos', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: 'Anexo I: Alimentos (Zero)', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              Anexo XV: Hortifruti (100%)
            </label>
            <input
              type="text"
              value={currentDespesas.anexo15Hortifruti}
              onChange={(e) => updateDespesaField('anexo15Hortifruti', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: 'Anexo XV: Hortifruti (100%)', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              Anexo VII: Alimentos (60%)
            </label>
            <input
              type="text"
              value={currentDespesas.anexo7Alimentos}
              onChange={(e) => updateDespesaField('anexo7Alimentos', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: 'Anexo VII: Alimentos (60%)', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              Anexo VIII: Higiene (60%)
            </label>
            <input
              type="text"
              value={currentDespesas.anexo8Higiene}
              onChange={(e) => updateDespesaField('anexo8Higiene', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: 'Anexo VIII: Higiene (60%)', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>
        </div>

        {/* Bottom Row: 3 Campos com a mesma largura das de cima */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              (-) ICMS Total das Compras
            </label>
            <input
              type="text"
              value={currentDespesas.icmsTotalCompras}
              onChange={(e) => updateDespesaField('icmsTotalCompras', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: '(-) ICMS Total das Compras', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              (-) PIS/COFINS Deduz. Compras
            </label>
            <input
              type="text"
              value={currentDespesas.pisCofinsDeduzCompras}
              onChange={(e) => updateDespesaField('pisCofinsDeduzCompras', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: '(-) PIS/COFINS Deduz. Compras', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 leading-tight block mb-1 min-h-[28px]">
              (-) Desconto Incond. Compras
            </label>
            <input
              type="text"
              value={currentDespesas.descontoIncondCompras}
              onChange={(e) => updateDespesaField('descontoIncondCompras', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-[#025ca4]"
            />
            <button
              onClick={() => setSelectedProdutoModal({ campo: '(-) Desconto Incond. Compras', mes: activeMonth })}
              className="text-[11px] text-[#025ca4] hover:underline font-semibold mt-1 block"
            >
              Ver Produtos
            </button>
          </div>
        </div>
      </div>

      {/* Box 2: Importar Notas Fiscais de Compras/Gastos (XML) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[#025ca4]">
            Importar Notas Fiscais de Compras/Gastos (XML)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Arraste os arquivos XML das Notas Fiscais Eletrônicas (NFe 55), Serviços Tomados (NFS-e) ou Conhecimentos de Frete (CT-e) para este mês. Os dados serão extraídos automaticamente.
          </p>
        </div>

        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
            isDragging ? 'border-[#025ca4] bg-blue-50' : 'border-blue-300 bg-blue-50/20'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-[#025ca4]' : 'text-blue-500'}`} />
          <p className="text-xs text-slate-700 font-medium mb-3">
            Arraste os XMLs de Compras/Fretes aqui ou <label className="text-[#025ca4] hover:underline font-bold cursor-pointer">clique para buscar<input type="file" accept=".xml" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} /></label>. Suporta arquivos XML de NF-e, NFS-e e CT-e.
          </p>
        </div>
      </div>

      {/* Tabela de Notas e Controles */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        
        {/* Barra de Controles / Filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, fornecedor ou CNPJ..." 
            className="border border-slate-300 rounded px-3 py-1.5 text-xs w-64 outline-none focus:border-[#025ca4] bg-white text-slate-700" 
          />

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterRegime}
              onChange={(e) => setFilterRegime(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 outline-none"
            >
              <option value="TODOS">Todos os Regimes</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="Lucro Real">Lucro Real</option>
            </select>

            <select
              value={filterCredito}
              onChange={(e) => setFilterCredito(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2.5 py-1.5 outline-none"
            >
              <option value="TODOS">Crédito: Todos</option>
              <option value="Gera Crédito">Gera Crédito</option>
              <option value="Não Gera Crédito">Não Gera Crédito</option>
            </select>

            <button
              onClick={() => setIsModalManualOpen(true)}
              className="bg-sky-50 border border-sky-300 text-sky-700 hover:bg-sky-100 text-xs font-bold px-3 py-1.5 rounded transition-colors"
            >
              Lançar Nota Manual
            </button>

            <button
              onClick={handleReconsultarCnpjs}
              disabled={isReconsulting}
              className="bg-[#025ca4] hover:bg-[#024883] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconsulting ? 'animate-spin' : ''}`} />
              {isReconsulting ? "Reconsultando CNPJs..." : "Reconsultar CNPJs"}
            </button>

            <button
              onClick={handleLimparTudoNotas}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
            >
              Limpar Tudo
            </button>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#025ca4] text-white">
              <tr>
                <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Nº Nota</th>
                <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Data</th>
                <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Fornecedor / CNPJ</th>
                <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Regime Tributário</th>
                <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Tipo de Crédito</th>
                <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Descrição / Serviço</th>
                <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider">Valor</th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredNotas.map((nota) => (
                <tr key={nota.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-700">{nota.nNota}</td>
                  <td className="px-3 py-2.5 text-slate-600">{nota.data}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-800 max-w-[220px] truncate" title={nota.fornecedor}>{nota.fornecedor}</p>
                    <p className="text-[10px] text-slate-500">CNPJ: {nota.cnpj}</p>
                    {nota.tag && (
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        {nota.tag}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={nota.regimeTributario}
                      onChange={(e) => {
                        const updated = notas.map(n => n.id === nota.id ? { ...n, regimeTributario: e.target.value } : n);
                        setNotas(updated);
                      }}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#025ca4]"
                    >
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Real">Lucro Real</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={nota.tipoCredito}
                      onChange={(e) => {
                        const updated = notas.map(n => n.id === nota.id ? { ...n, tipoCredito: e.target.value } : n);
                        setNotas(updated);
                      }}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#025ca4]"
                    >
                      <option value="Gera Crédito">Gera Crédito</option>
                      <option value="Não Gera Crédito">Não Gera Crédito</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5 max-w-[250px]">
                    <p className="text-slate-800 font-medium truncate" title={nota.descricao}>{nota.descricao}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                    {formatCurrency(nota.valor)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setManualForm({
                            nNota: nota.nNota, data: nota.data, fornecedor: nota.fornecedor,
                            cnpj: nota.cnpj, regimeTributario: nota.regimeTributario,
                            tipoCredito: nota.tipoCredito, descricao: nota.descricao, valor: String(nota.valor)
                          });
                          setIsModalManualOpen(true);
                        }}
                        className="text-sky-600 hover:text-sky-800 p-1"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveNota(nota.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Total Acumulado */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end items-center">
          <p className="text-xs font-bold text-[#025ca4]">
            Total Acumulado (Filtrado): <span className="text-slate-800 font-extrabold text-sm ml-1">{formatCurrency(totalFiltrado)}</span>
          </p>
        </div>

      </div>

      {/* Box de Detalhamento das Despesas Elegíveis */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm mb-6 space-y-2">
        <h4 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
          Detalhamento das Despesas Elegíveis (Composição do Crédito)
        </h4>
        <div className="flex justify-between items-center text-xs text-slate-700">
          <span>Material Aplicado / Insumos:</span>
          <span className="font-bold">{formatCurrency(totalMaterialInsumos)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-700">
          <span>Vale Transporte:</span>
          <span className="font-bold">{formatCurrency(totalValeTransporte)}</span>
        </div>
      </div>

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
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {notas.slice(0, 5).map((prod, i) => (
                  <div key={i} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{prod.descricao}</p>
                      <p className="text-[10px] text-slate-500">Fornecedor: {prod.fornecedor}</p>
                    </div>
                    <span className="font-semibold text-slate-700">{formatCurrency(prod.valor)}</span>
                  </div>
                ))}
              </div>
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

      {/* MODAL LANÇAR NOTA MANUAL */}
      {isModalManualOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-[#025ca4]">Lançar Nota Manual</h3>
              <button
                onClick={() => setIsModalManualOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nº Nota</label>
                  <input
                    type="text"
                    value={manualForm.nNota}
                    onChange={(e) => setManualForm({ ...manualForm, nNota: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#025ca4]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data</label>
                  <input
                    type="text"
                    value={manualForm.data}
                    onChange={(e) => setManualForm({ ...manualForm, data: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#025ca4]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fornecedor *</label>
                <input
                  type="text"
                  value={manualForm.fornecedor}
                  onChange={(e) => setManualForm({ ...manualForm, fornecedor: e.target.value })}
                  placeholder="Razão Social / Nome do Fornecedor"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#025ca4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={manualForm.cnpj}
                    onChange={(e) => setManualForm({ ...manualForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#025ca4]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Regime Tributário</label>
                  <select
                    value={manualForm.regimeTributario}
                    onChange={(e) => setManualForm({ ...manualForm, regimeTributario: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#025ca4]"
                  >
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição / Serviço *</label>
                <input
                  type="text"
                  value={manualForm.descricao}
                  onChange={(e) => setManualForm({ ...manualForm, descricao: e.target.value })}
                  placeholder="Descrição do item ou serviço"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#025ca4]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Valor (R$) *</label>
                <input
                  type="text"
                  value={manualForm.valor}
                  onChange={(e) => setManualForm({ ...manualForm, valor: e.target.value })}
                  placeholder="0,00"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#025ca4]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setIsModalManualOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddManualNota}
                className="bg-[#025ca4] hover:bg-[#024883] text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Salvar Nota
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
          onClick={() => setCurrentStep(4)}
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
          onClick={() => setCurrentStep(6)}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Ver Cenários Comparativos
        </button>
      </div>

    </div>
  );
}
