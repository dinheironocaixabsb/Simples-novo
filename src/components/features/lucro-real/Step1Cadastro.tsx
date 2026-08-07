"use client";

import { useLucroRealStore } from "../../../store/useLucroRealStore";
import { User, Folder, Puzzle, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { detectarRedutorPorCnae } from "../../../services/tax-engine/lucro-real/lc214Redutor";

export function Step1Cadastro() {
  const setCurrentStep = useLucroRealStore((state) => state.setCurrentStep);
  const setActiveClient = useLucroRealStore((state) => state.setActiveClient);
  const setSimulacaoIbsCbs = useLucroRealStore((state) => state.setSimulacaoIbsCbs);
  const setEmpresa = useLucroRealStore((state) => state.setEmpresa);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [ie, setIe] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cnaePrincipal, setCnaePrincipal] = useState("");
  
  // Array com 14 posições vazias para os CNAEs secundários
  const [cnaesSecundarios, setCnaesSecundarios] = useState<string[]>(Array(14).fill(""));

  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

  const redutorInfo = detectarRedutorPorCnae(cnaePrincipal, cnaesSecundarios);

  useEffect(() => {
    setSimulacaoIbsCbs({ redutor: redutorInfo.redutor });
  }, [cnaePrincipal, JSON.stringify(cnaesSecundarios), setSimulacaoIbsCbs]);

  const handleExportarJSON = () => {
    const data = JSON.stringify(useLucroRealStore.getState(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostico_${cnpj || 'cliente'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.empresa) {
            setEmpresa(imported.empresa);
            alert("Dados cadastrais importados com sucesso!");
          }
        } catch (err) {
          alert("Erro ao importar arquivo JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const fetchCnpjData = async (cnpjLimpo: string) => {
    if (cnpjLimpo.length !== 14) return;
    
    setIsLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (response.ok) {
        const data = await response.json();
        setRazaoSocial(data.razao_social || "");
        setCnaePrincipal(`${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}`);
        setCep(data.cep || "");
        
        const end = `${data.logradouro}, ${data.numero} - ${data.bairro} - ${data.municipio}/${data.uf}`;
        setEndereco(end);
        
        // Responsável (QSA)
        if (data.qsa && data.qsa.length > 0) {
          const socio = data.qsa[0];
          setResponsavel(`${socio.nome_socio} - CPF: ${socio.cnpj_cpf_do_socio}`);
        } else {
          setResponsavel("");
        }

        // Puxando CNAEs secundários (se houver)
        if (data.cnaes_secundarios && data.cnaes_secundarios.length > 0) {
          const novosSecundarios = [...cnaesSecundarios];
          data.cnaes_secundarios.forEach((cnae: any, i: number) => {
            if (i < 14) {
              novosSecundarios[i] = `${cnae.codigo} - ${cnae.descricao}`;
            }
          });
          setCnaesSecundarios(novosSecundarios);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);

    const limpo = formatted.replace(/\D/g, '');
    if (limpo.length === 14) {
      fetchCnpjData(limpo);
    }
  };

  const [notification, setNotification] = useState<string | null>(null);

  const handleSave = () => {
    setEmpresa({
      cnpj,
      razaoSocial: razaoSocial || "Clínica Odontológica Exemplo LTDA",
      nomeFantasia: razaoSocial || "Clínica Odontológica",
      inscricaoEstadual: ie,
      cnaePrincipal,
      atividadePrincipal: "Serviços Odontológicos",
      regimeAtual: "Lucro Real",
      endereco,
      representante: responsavel,
      email: "",
      telefone: ""
    });
    setActiveClient({ 
      id: crypto.randomUUID(), 
      workspace_id: 'default', 
      cnpj: cnpj || "00.000.000/0001-00", 
      name: razaoSocial || "Clínica Odontológica Exemplo LTDA" 
    });
    setNotification("Diagnóstico cadastral salvo com sucesso!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAvancar = () => {
    handleSave();
    setCurrentStep(2);
  };

  const handleExcluir = () => {
    setCnpj("");
    setRazaoSocial("");
    setResponsavel("");
    setIe("");
    setCep("");
    setEndereco("");
    setCnaePrincipal("");
    setCnaesSecundarios(Array(14).fill(""));
    setEmpresa({
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
      inscricaoEstadual: "",
      cnaePrincipal: "",
      atividadePrincipal: "",
      regimeAtual: "Lucro Real",
      endereco: "",
      representante: "",
      email: "",
      telefone: ""
    });
    setNotification("Dados cadastrais zerados com sucesso!");
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

      {/* Header Fixo como na Imagem */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-[#025ca4] uppercase tracking-wider mb-1">DADOS CADASTRAIS</h2>
        <p className="text-slate-500 text-sm">Informe os dados cadastrais da empresa.</p>
      </div>

      <div className="space-y-6">
        
        {/* Bloco 1: Identificação da Empresa */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 border-b-2 border-[#025ca4] pb-2 mb-6 w-fit pr-8">
            <User className="w-5 h-5 text-[#025ca4]" />
            <h3 className="text-sm font-bold text-[#025ca4]">Identificação da Empresa</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Razão Social / Nome</label>
              <input 
                type="text" 
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Responsável perante a Receita Federal</label>
              <input 
                type="text" 
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome - CPF: ***000000**"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CNPJ {isLoadingCnpj && <span className="text-blue-500 font-normal">(Buscando...)</span>}</label>
                <input 
                  type="text" 
                  value={cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Inscrição Estadual/Municipal</label>
                <input 
                  type="text" 
                  value={ie}
                  onChange={(e) => setIe(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CEP</label>
                <input 
                  type="text" 
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Endereço</label>
              <input 
                type="text" 
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Atividades (CNAEs) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 border-b-2 border-[#025ca4] pb-2 mb-6 w-fit pr-8">
            <Folder className="w-5 h-5 text-[#025ca4]" />
            <h3 className="text-sm font-bold text-[#025ca4]">Atividades (CNAEs)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">CNAE Principal</label>
              <input 
                type="text" 
                value={cnaePrincipal}
                onChange={(e) => setCnaePrincipal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 focus:border-[#025ca4] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">CNAEs Secundários (Até 14)</label>
              <div className="grid grid-cols-4 gap-3">
                {cnaesSecundarios.map((cnae, index) => (
                  <input 
                    key={index}
                    type="text" 
                    value={cnae}
                    placeholder={`${index + 2} CNAE Secundário`}
                    onChange={(e) => {
                      const newCnaes = [...cnaesSecundarios];
                      newCnaes[index] = e.target.value;
                      setCnaesSecundarios(newCnaes);
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-600 focus:border-[#025ca4] outline-none truncate"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Inteligência LC 214 (Exibido apenas quando houver benefício de redução) */}
        {redutorInfo.temBeneficio && (
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-4 items-start shadow-sm animate-in fade-in duration-300">
            <div className="bg-orange-100 p-2 rounded shrink-0">
              <Puzzle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Inteligência Tributária (LC 214)</h4>
              <p className="text-xs text-slate-600 mt-1">
                {redutorInfo.descricao}
              </p>
            </div>
          </div>
        )}
        
      </div>

      {/* Input Oculto para Importação JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportarJSON}
        accept=".json"
        className="hidden"
      />

      {/* Espaçador para garantir visão 100% livre acima da barra fixa de ações */}
      <div className="h-44 w-full shrink-0" />

      {/* Barra Inferior Fixa de Ações - Estilo Lucro Presumido */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 px-8 flex justify-center items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <button 
          onClick={() => window.print()}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Imprimir
        </button>
        <button 
          onClick={handleSave}
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
          onClick={handleAvancar}
          className="bg-[#005696] hover:bg-[#004376] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md transition-all cursor-pointer ml-2"
        >
          Avançar para Receitas
        </button>
      </div>

    </div>
  );
}
