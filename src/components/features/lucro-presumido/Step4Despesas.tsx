'use client';

import React, { useState } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';
import CurrencyInput from 'react-currency-input-field';
import { UploadCloud, Trash2, Edit2, FileText, Search, FilePlus } from 'lucide-react';
import { parseExpenseXml } from '../../../services/xml/xml-parser';
import { useClientStore } from '../../../store/useClientStore';
import { consultarCnpj } from '../../../services/cnpj-service';
import { ParsedXmlExpense, ExpenseCategory } from '../../../domain/types/xml.types';
import JSZip from 'jszip';
import { ProductDetailsModal } from '../simples-nacional/ProductDetailsModal';

const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCnpj = (val: string) => {
  const v = val.replace(/\D/g, '').slice(0, 14);
  return v.replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatDate = (val: string) => {
  const v = val.replace(/\D/g, '').slice(0, 8);
  return v.replace(/^(\d{2})(\d)/, '$1/$2')
          .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
};

export function Step4Despesas() {
  const { 
    cnpjCache, addCnpjToCache 
  } = useDiagnosisStore();
  
  const { 
    despesasMensais: monthlyExpenses, 
    updateDespesaMes: updateMonthlyExpenses, 
    currentMonth, setCurrentMonth,
    setStep, saveClient
  } = useLucroPresumidoStore();
  
  const {
    activeCompanyData: companyData,
    activeXmlDespesas: xmlDespesas,
    addXmlDespesa,
    removeXmlDespesa,
    setXmlDespesas,
    updateXmlExpenseStatus,
    expenseCategories,
    addExpenseCategory,
    clearExpenses
  } = useClientStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isReconsultando, setIsReconsultando] = useState(false);
  const [productModalState, setProductModalState] = useState<{ isOpen: boolean, title: string, produtos: any[] }>({ isOpen: false, title: '', produtos: [] });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegime, setFilterRegime] = useState('Todos os Regimes');
  const [filterCredit, setFilterCredit] = useState('Crédito: Todos');
  
  // Manual form state
  const [manualNumNota, setManualNumNota] = useState('');
  const [manualData, setManualData] = useState('');
  const [manualCnpj, setManualCnpj] = useState('');
  const [manualProvider, setManualProvider] = useState('');
  const [manualRegime, setManualRegime] = useState('Lucro Presumido');
  const [manualTipoCredito, setManualTipoCredito] = useState('Gera Crédito de IBS/CBS');
  const [manualCategoria, setManualCategoria] = useState('Compras / Insumos / Mercadorias');
  const [manualDesc, setManualDesc] = useState('');
  const [manualValor, setManualValor] = useState('');
  const [manualIcms, setManualIcms] = useState('');
  const [manualPis, setManualPis] = useState('');
  const [manualCofins, setManualCofins] = useState('');
  const [manualDesconto, setManualDesconto] = useState('');
  const [isConsultingManual, setIsConsultingManual] = useState(false);
  
  // Buscar informações do CNPJ automaticamente
  React.useEffect(() => {
    const checkManualCnpj = async () => {
      if (manualCnpj.length === 18) {
        setIsConsultingManual(true);
        try {
          const info = await consultarCnpj(manualCnpj);
          if (info) {
            setManualProvider(info.razaoSocial);
            setManualRegime(info.regime);
          }
        } catch (err) {
          // Silent fail on auto-fetch
        } finally {
          setIsConsultingManual(false);
        }
      }
    };
    checkManualCnpj();
  }, [manualCnpj]);
  
  // Recalcular totais sempre que xmlDespesas mudar
  React.useEffect(() => {
    const fromXml = xmlDespesas.filter(x => x.monthIndex === currentMonth);
    let geral = 0, integral = 0, anexo1 = 0, anexo15 = 0, anexo7 = 0, anexo8 = 0;
    let icms = 0, pisCofins = 0, descontos = 0;

    fromXml.forEach(x => {
      let isCredit = x.tipoDespesa === "Gera Crédito de IBS/CBS" || x.tipoDespesa === "Gera crédito" || x.tipoDespesa === 'true';
      if (!isCredit) return;

      if (x.category?.toLowerCase().includes('anexo i') || x.category?.toLowerCase().includes('anexo 1') || x.category?.toLowerCase().includes('zero')) {
        anexo1 += x.valor;
      } else if (x.category?.toLowerCase().includes('anexo xv') || x.category?.toLowerCase().includes('anexo 15') || x.category?.toLowerCase().includes('hortifruti')) {
        anexo15 += x.valor;
      } else if (x.category?.toLowerCase().includes('anexo vii') || x.category?.toLowerCase().includes('anexo 7') || x.category?.toLowerCase().includes('alimento')) {
        anexo7 += x.valor;
      } else if (x.category?.toLowerCase().includes('anexo viii') || x.category?.toLowerCase().includes('anexo 8') || x.category?.toLowerCase().includes('higiene')) {
        anexo8 += x.valor;
      } else if (x.category?.toLowerCase().includes('normal') || x.category?.toLowerCase().includes('crédito 100%')) {
        integral += x.valor;
      } else {
        geral += x.valor;
      }

      icms += x.deducoes?.icms || 0;
      pisCofins += x.deducoes?.pisCofins || 0;
      descontos += x.deducoes?.desconto || 0;
    });

    updateMonthlyExpenses(currentMonth, {
      despesaGeral: geral,
      despesaCreditoIntegral: integral,
      despesaAnexo1: anexo1,
      despesaAnexo15: anexo15,
      despesaAnexo7: anexo7,
      despesaAnexo8: anexo8,
      deducaoIcmsIss: icms,
      deducaoPisCofins: pisCofins,
      deducaoDescontos: descontos
    });
  }, [xmlDespesas, currentMonth, updateMonthlyExpenses]);
  
  const handleAddManual = () => {
    if (!manualDesc || !manualValor || !manualProvider) {
      alert("Preencha descrição, fornecedor e valor.");
      return;
    }
    const numericValue = parseFloat(manualValor.replace(/,/g, '.'));
    const nIcms = parseFloat(manualIcms.replace(/,/g, '.')) || 0;
    const nPis = parseFloat(manualPis.replace(/,/g, '.')) || 0;
    const nCofins = parseFloat(manualCofins.replace(/,/g, '.')) || 0;
    const nDesconto = parseFloat(manualDesconto.replace(/,/g, '.')) || 0;
    
    const manualExpense: ParsedXmlExpense = {
      id: 'manual-' + Date.now(),
      chave: '',
      numero: manualNumNota || 'Manual',
      data: manualData || `15/${String(currentMonth + 1).padStart(2, '0')}/2024`,
      monthIndex: currentMonth,
      fornecedor: manualProvider,
      cnpj: manualCnpj,
      regime: manualRegime as any,
      tipoDespesa: manualTipoCredito,
      descricao: manualDesc,
      valor: numericValue,
      category: manualCategoria,
      fileName: 'Lançamento Manual',
      xmlType: 'NFSe',
      isConsultingCnpj: false,
      deducoes: { icms: nIcms, pisCofins: nPis + nCofins, desconto: nDesconto, iss: 0 }
    };
    
    addXmlDespesa(manualExpense);
    setShowManualModal(false);
    
    // Clear form
    setManualNumNota('');
    setManualData('');
    setManualCnpj('');
    setManualProvider('');
    setManualDesc('');
    setManualValor('');
    setManualIcms('');
    setManualPis('');
    setManualCofins('');
    setManualDesconto('');
  };

  const handleAddCategory = () => {
     if (newCategoryName.trim()) {
        addExpenseCategory({ id: 'cat-' + Date.now(), nome: newCategoryName.trim() });
        setManualCategoria(newCategoryName.trim());
        setNewCategoryName('');
        setShowCategoryModal(false);
     }
  };

  const handleViewProducts = (tipoCst: string, label: string) => {
    let extractedProdutos: any[] = [];
    const currentXmls = xmlDespesas.filter(x => x.monthIndex === currentMonth);
    
    currentXmls.forEach(n => {
      let include = false;
      const isCredit = n.tipoDespesa === "Gera Crédito de IBS/CBS" || n.tipoDespesa === "Gera crédito" || n.tipoDespesa === "Gera crédito de IBS/CBS" || n.tipoDespesa === 'true';
      
      if (tipoCst === 'despesaGeral' && isCredit) include = true;
      if (tipoCst === 'icms_compras' && n.deducoes?.icms) include = true;
      if (tipoCst === 'pis_cofins_compras' && n.deducoes?.pisCofins) include = true;
      if (tipoCst === 'desconto_incondicional' && n.deducoes?.desconto) include = true;
      
      if (include) {
         if (n.produtosDetalhados && n.produtosDetalhados.length > 0) {
            extractedProdutos.push(...n.produtosDetalhados);
         } else {
            const icms = tipoCst === 'icms_compras' ? (n.deducoes?.icms || 0) : 0;
            const pisCofins = tipoCst === 'pis_cofins_compras' ? (n.deducoes?.pisCofins || 0) : 0;
            const desconto = tipoCst === 'desconto_incondicional' ? (n.deducoes?.desconto || 0) : 0;
            const liquido = n.valor - icms - pisCofins - desconto;

            extractedProdutos.push({
               nome: n.descricao || n.category || 'Serviço/Frete',
               valorBruto: n.valor,
               desconto: n.deducoes?.desconto || 0,
               icms: n.deducoes?.icms || 0,
               pisCofins: n.deducoes?.pisCofins || 0,
               valorLiquido: liquido,
               cfop: '',
               ncm: '',
               isAlimento60: false,
               isHigiene60: false,
               isAnexo1: false,
               isAnexo15: false,
               isRevenda: false,
               isFrete: false,
               isDevolucao: false,
               cstPis: '',
               cstCofins: '',
               numeroNota: n.numero,
               dataEmissao: n.data,
               cliente: n.fornecedor
            });
         }
      }
    });

    if (extractedProdutos.length === 0) {
      alert("Nenhum produto ou valor encontrado com esta classificação neste mês.");
      return;
    }

    setProductModalState({ isOpen: true, title: label, produtos: extractedProdutos });
  };

  const currentMonthXmls = xmlDespesas.filter(x => {
    if (x.monthIndex !== currentMonth) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        (x.numero || '').toLowerCase().includes(term) || 
        (x.fornecedor || '').toLowerCase().includes(term) || 
        (x.cnpj || '').includes(term)
      );
      if (!matchesSearch) return false;
    }

    if (filterRegime !== 'Todos os Regimes' && x.regime !== filterRegime) return false;

    if (filterCredit === 'Gerar crédito IBS/CBS') {
       const isCredit = x.tipoDespesa === "Gera Crédito de IBS/CBS" || x.tipoDespesa === "Gera crédito" || x.tipoDespesa === "Gera crédito de IBS/CBS" || x.tipoDespesa === 'true';
       if (!isCredit) return false;
    } else if (filterCredit === 'Sem direito a crédito IBS/CBS') {
       const isCredit = x.tipoDespesa === "Gera Crédito de IBS/CBS" || x.tipoDespesa === "Gera crédito" || x.tipoDespesa === "Gera crédito de IBS/CBS" || x.tipoDespesa === 'true';
       if (isCredit) return false;
    }
    
    return true;
  });
  const totalAcumulado = currentMonthXmls.reduce((acc, curr) => acc + curr.valor, 0);

  const formatCpfCnpj = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return val;
  };

  const getNaturezaJuridica = (nome: string, cnpj: string) => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 11) return 'Pessoa Física';
    
    const upper = (nome || '').toUpperCase();
    if (upper.includes('LTDA') || upper.includes('LIMITADA')) return '206-2 - Sociedade Empresária Limitada';
    if (upper.includes('S.A') || upper.includes('S/A') || upper.includes('S A')) return '205-4 - Sociedade Anônima Fechada';
    if (upper.includes('CONDOMINIO')) return '308-5 - Condomínio Edilício';
    if (upper.includes('ASSOCIA')) return '399-9 - Associação Privada';
    return '213-5 - Empresário (Individual)';
  };

  const handleUpdateRegime = (id: string, newRegime: string) => {
    const newXmls = xmlDespesas.map(x => x.id === id ? { ...x, regime: newRegime as any } : x);
    setXmlDespesas(newXmls);
  };

  const checkCnpjs = async (xmlsToCheck: ParsedXmlExpense[]) => {
    const uniqueDocs = Array.from(new Set(xmlsToCheck.map(x => x.cnpj).filter(c => c && (c.replace(/\D/g, '').length === 14 || c.replace(/\D/g, '').length === 11))));
    
    for (const doc of uniqueDocs) {
      const isCpf = doc.replace(/\D/g, '').length === 11;

      if (isCpf) {
        useClientStore.getState().activeXmlDespesas.forEach(x => {
          if (x.cnpj === doc) updateXmlExpenseStatus(x.id, { isConsultingCnpj: true });
        });
        await new Promise(r => setTimeout(r, 600)); // fake delay for UI
        useClientStore.getState().activeXmlDespesas.forEach(x => {
          if (x.cnpj === doc) updateXmlExpenseStatus(x.id, { regime: "Pessoa Física", isConsultingCnpj: false });
        });
        continue;
      }
      
      const cnpj = doc;
      if (useDiagnosisStore.getState().cnpjCache[cnpj]) {
        const regime = useDiagnosisStore.getState().cnpjCache[cnpj];
        useClientStore.getState().activeXmlDespesas.forEach(x => {
          if (x.cnpj === cnpj && x.regime !== regime) {
            updateXmlExpenseStatus(x.id, { regime, isConsultingCnpj: false });
          }
        });
        continue;
      }
      
      // Marcar como consultando
      useClientStore.getState().activeXmlDespesas.forEach(x => {
        if (x.cnpj === cnpj) updateXmlExpenseStatus(x.id, { isConsultingCnpj: true });
      });
      
      const info = await consultarCnpj(cnpj);
      if (info) {
        addCnpjToCache(cnpj, info.regime);
        useClientStore.getState().activeXmlDespesas.forEach(x => {
          if (x.cnpj === cnpj) updateXmlExpenseStatus(x.id, { regime: info.regime as any, isConsultingCnpj: false });
        });
      } else {
        useClientStore.getState().activeXmlDespesas.forEach(x => {
          if (x.cnpj === cnpj) updateXmlExpenseStatus(x.id, { isConsultingCnpj: false });
        });
      }
      
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const handleReconsultar = async () => {
    setIsReconsultando(true);
    await checkCnpjs(currentMonthXmls);
    setIsReconsultando(false);
  };

  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);
    try {
      const files = Array.from(e.target.files);
      const parsedXmls: ParsedXmlExpense[] = [];
      
      const parseAndAdd = async (text: string, filename: string) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const parsed = parseExpenseXml(xmlDoc, filename, companyData.cnpj);
        parsed.isConsultingCnpj = false;
        parsedXmls.push(parsed);
      };

      for (const file of files) {
        const name = file.name.toLowerCase();
        if (name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          for (const relativePath in zip.files) {
            const zipEntry = zip.files[relativePath];
            if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.xml')) {
              try {
                const text = await zipEntry.async("string");
                await parseAndAdd(text, zipEntry.name);
              } catch (err: any) {
                console.error(`Erro ao processar ${zipEntry.name}:`, err);
              }
            }
          }
        } else if (name.endsWith('.xml')) {
          const text = await file.text();
          await parseAndAdd(text, file.name);
        }
      }
      
      const generateUniqueKey = (xml: ParsedXmlExpense) => {
        if (xml.xmlType === 'NFe' || xml.xmlType === 'CTe') return xml.chave;
        const cleanCnpj = xml.cnpj ? xml.cnpj.replace(/\D/g, '') : '';
        return `${xml.numero}-${cleanCnpj}-${xml.data}`;
      };

      const existingKeys = new Set(xmlDespesas.map(generateUniqueKey));
      const uniqueNewXmls: ParsedXmlExpense[] = [];

      for (const parsed of parsedXmls) {
        const key = generateUniqueKey(parsed);
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          if (cnpjCache[parsed.cnpj]) {
            parsed.regime = cnpjCache[parsed.cnpj] as any;
          }
          uniqueNewXmls.push(parsed);
        }
      }
      
      const newAllXmls = [...xmlDespesas, ...uniqueNewXmls];
      setXmlDespesas(newAllXmls);
      
      if (uniqueNewXmls.length > 0) {
        checkCnpjs(uniqueNewXmls);
      }
    } catch (err: any) {
      alert(`Erro ao processar XML: ${err.message}`);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const InputCard = ({ title, highlight, field, exportKey }: { title: string, highlight?: boolean, field: string, exportKey: string }) => (
    <div className="flex flex-col">
      <label className="text-[13px] font-semibold text-gray-800 leading-tight mb-1 min-h-[32px] flex items-end">
        {title}
      </label>
      <CurrencyInput
        value={(monthlyExpenses[currentMonth] as any)?.[field] || 0}
        onValueChange={(val) => updateMonthlyExpenses(currentMonth, { [field]: Number((val || '0').replace(/\D/g, '')) / 100 })}
        decimalsLimit={2} decimalSeparator="," groupSeparator="."
        className={`w-full px-3 py-1.5 text-[15px] rounded outline-none border ${highlight ? 'border-red-300 text-gray-600 bg-white' : 'border-[#cbd5e1] text-gray-600 bg-white'} focus:border-[#005696]`}
        placeholder="0,00"
      />
      <button onClick={() => handleViewProducts(exportKey, title)} className="mt-1 bg-[#eef3f7] hover:bg-[#e2eaf1] text-[12px] font-bold text-[#005696] py-1 rounded w-full text-left px-2 transition-colors">
        Ver Produtos
      </button>
    </div>
  );

  return (
    <div className="w-full text-gray-800">
      
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#001736] mb-1">Passo 3: Despesas e Créditos (IBS/CBS)</h1>
        <p className="text-gray-500 text-[15px]">Informe as despesas para calcular os Créditos de IBS e CBS separados.</p>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <div className="text-[14px] font-bold text-gray-800 mb-2">Despesas: Mês de {FULL_MONTHS[currentMonth]}</div>
        <div className="flex flex-wrap gap-2">
          {FULL_MONTHS.map((month, idx) => (
            <button
              key={month}
              onClick={() => setCurrentMonth(idx)}
              className={`min-w-[90px] py-2 px-4 text-[14px] font-bold rounded transition-colors border ${
                currentMonth === idx 
                  ? 'bg-[#005696] border-[#005696] text-white shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* LC 214 Panel */}
      <div className="bg-[#fcfdfd] border border-gray-200 border-l-[3px] border-l-[#005696] rounded-md p-6 mb-8 shadow-sm">
        <h3 className="text-[#003b6e] font-bold text-[15px] mb-5">Despesas Elegíveis LC 214: Mês de {SHORT_MONTHS[currentMonth]}</h3>
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6 mb-6">
          <InputCard title="Despesa Geral (Normal)" highlight={false} field="despesaGeral" exportKey="despesaGeral" />
          <InputCard title="Produtos Tribut. Normal (Crédito 100%)" highlight={true} field="despesaCreditoIntegral" exportKey="despesaCreditoIntegral" />
          <InputCard title="Anexo I: Alimentos (Zero)" highlight={false} field="despesaAnexo1" exportKey="despesaAnexo1" />
          <InputCard title="Anexo XV: Hortifruti (100%)" highlight={false} field="despesaAnexo15" exportKey="despesaAnexo15" />
          <InputCard title="Anexo VII: Alimentos (60%)" highlight={false} field="despesaAnexo7" exportKey="despesaAnexo7" />
          <InputCard title="Anexo VIII: Higiene (60%)" highlight={false} field="despesaAnexo8" exportKey="despesaAnexo8" />
        </div>
        
        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6">
          <InputCard title="(-) ICMS / ISS Destac. Compras/Serviços" highlight={true} field="deducaoIcmsIss" exportKey="icms_compras" />
          <InputCard title="(-) PIS/COFINS Destac. Compras/Serviços" highlight={true} field="deducaoPisCofins" exportKey="pis_cofins_compras" />
          <InputCard title="(-) Desconto Incond. Compras/Serviços" highlight={true} field="deducaoDescontos" exportKey="desconto_incondicional" />
        </div>
      </div>

      {/* XML Area Title & Subtitle */}
      <div className="mb-2">
        <h2 className="text-[#003b6e] font-bold text-[15px] mb-0.5">
          Importar Notas Fiscais de Compras/Gastos (XML)
        </h2>
        <p className="text-[14px] text-gray-500">
          Arraste os arquivos XML das Notas Fiscais de Mercadorias (NF-e), Serviços Tomados (NFS-e) ou Conhecimentos de Frete (CT-e) para esta área. Os dados serão extraídos automaticamente.
        </p>
      </div>

      {/* XML Dropzone */}
      <div className="mb-8 p-10 bg-[#fbfcfd] border border-gray-200 rounded text-center relative hover:bg-blue-50/50 transition-colors border-dashed cursor-pointer">
        <input 
          type="file" 
          multiple 
          accept=".xml,.zip" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={handleXmlUpload} 
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <FilePlus className="w-8 h-8 text-[#005696]" strokeWidth={1.5} />
          <p className="text-[16px] text-gray-700">Arraste os XMLs ou .ZIP de Compras/Fretes aqui ou <span className="text-[#005696] font-bold">clique para buscar</span></p>
          <p className="text-[13px] text-gray-400 font-medium">Suporta arquivos XML/ZIP de NF-e, NFS-e e CT-e</p>
        </div>
      </div>

      {/* Toolbar & Tabela */}
      <div className="bg-white border border-gray-200 rounded shadow-sm mb-6">
        <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar por número, fornecedor ou CNPJ..." className="w-full text-[15px] border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={filterRegime} onChange={e=>setFilterRegime(e.target.value)} className="text-[15px] border border-gray-300 rounded px-2 py-1.5 outline-none text-gray-700 bg-white">
            <option value="Todos os Regimes">Todos os Regimes</option>
            <option value="Lucro Presumido">Lucro Presumido</option>
            <option value="Simples Nacional">Simples Nacional</option>
            <option value="Lucro Real">Lucro Real</option>
            <option value="Isento de IRPJ">Isento de IRPJ</option>
            <option value="Pessoa Física">Pessoa Física</option>
          </select>
          <select value={filterCredit} onChange={e=>setFilterCredit(e.target.value)} className="text-[15px] border border-gray-300 rounded px-2 py-1.5 outline-none text-gray-700 bg-white">
            <option value="Crédito: Todos">Crédito: Todos</option>
            <option value="Gerar crédito IBS/CBS">Gerar crédito IBS/CBS</option>
            <option value="Sem direito a crédito IBS/CBS">Sem direito a crédito IBS/CBS</option>
          </select>
          <button 
            onClick={() => setShowManualModal(true)}
            className="text-[15px] font-bold bg-white border border-[#005696] text-[#005696] hover:bg-blue-50 px-4 py-1.5 rounded transition-colors"
          >
            Lançar Nota Manual
          </button>
          <button 
            onClick={handleReconsultar}
            disabled={isReconsultando}
            className={`text-[15px] font-bold text-white px-4 py-1.5 rounded transition-colors ${
              isReconsultando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004a82] hover:bg-[#003d6b]'
            }`}
          >
            {isReconsultando ? 'Consultando...' : 'Reconsultar CNPJs'}
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Tem certeza que deseja excluir todas as despesas?")) clearExpenses();
            }}
            className="text-[15px] font-bold bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-1.5 rounded transition-colors"
          >
            Limpar Tudo
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] text-left">
            <thead className="bg-[#003b6e] text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold whitespace-nowrap">Nº Nota</th>
                <th className="px-3 py-2.5 font-bold whitespace-nowrap">Data</th>
                <th className="px-3 py-2.5 font-bold min-w-[200px]">Fornecedor / CNPJ</th>
                <th className="px-3 py-2.5 font-bold whitespace-nowrap">Regime Tributário</th>
                <th className="px-3 py-2.5 font-bold whitespace-nowrap">Tipo de Crédito</th>
                <th className="px-3 py-2.5 font-bold min-w-[200px]">Descrição / Serviço</th>
                <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap">Valor</th>
                <th className="px-3 py-2.5 font-bold text-center whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentMonthXmls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500 font-medium">
                    Nenhum XML de compra importado ainda.
                  </td>
                </tr>
              ) : currentMonthXmls.map(xml => (
                <tr key={xml.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-[15px]">{xml.numero}</td>
                  <td className="px-3 py-2 text-[15px] text-gray-500">{xml.data}</td>
                  <td className="px-3 py-2">
                    <div className="font-bold text-[#003b6e] text-[15px] truncate max-w-[250px]">{xml.fornecedor}</div>
                    <div className="text-[14px] text-gray-500 font-medium">CNPJ: {xml.cnpj ? formatCpfCnpj(xml.cnpj) : 'Não informado'}</div>
                    {xml.cnpj && <div className="text-[13px] font-medium text-[#10b981] italic mt-0.5">{getNaturezaJuridica(xml.fornecedor, xml.cnpj)}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {xml.isConsultingCnpj ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 w-full max-w-[140px] justify-center">
                        Consultando...
                      </span>
                    ) : (
                      <select 
                        value={xml.regime} 
                        onChange={(e) => handleUpdateRegime(xml.id, e.target.value)}
                        className="text-[14px] font-medium border border-gray-300 rounded px-1.5 py-1 outline-none text-[#003b6e] bg-white w-full max-w-[140px] shadow-sm"
                      >
                        <option value="Lucro Presumido">Lucro Presumido</option>
                        <option value="Simples Nacional">Simples Nacional</option>
                        <option value="Lucro Real">Lucro Real</option>
                        <option value="Isento de IRPJ">Isento de IRPJ</option>
                        <option value="Pessoa Física">Pessoa Física</option>
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{xml.tipoDespesa}</td>
                  <td className="px-3 py-2 text-gray-700">{xml.descricao || xml.category}</td>
                  <td className="px-3 py-2 text-right font-bold text-[#005696]">R$ {xml.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => removeXmlDespesa(xml.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-[#f9fafb] border-t border-gray-200 text-right text-[16px] font-bold text-[#003b6e]">
          Total Acumulado (Filtrado): R$ {totalAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Detalhamento das Despesas Elegíveis (Composição do Crédito) */}
      {currentMonthXmls.length > 0 && (
        <div className="mt-6 border border-dashed border-gray-300 rounded-lg bg-white overflow-hidden p-4">
          <div className="mb-4 pb-2 border-b border-gray-200">
            <h3 className="text-[15px] font-bold text-[#334155]">Detalhamento das Despesas Elegíveis (Composição do Crédito)</h3>
          </div>
          <div className="text-[14px] text-[#475569] flex flex-col gap-2">
            {Object.entries(
              currentMonthXmls
                .filter(xml => xml.tipoDespesa === "Gera crédito de IBS/CBS" || xml.tipoDespesa === "Gera Crédito de IBS/CBS" || xml.tipoDespesa === "Gera crédito" || xml.tipoDespesa === 'true')
                .reduce((acc, xml) => {
                  let baseLabel = "Outras Despesas";
                  const desc = (xml.descricao || xml.category || "").toUpperCase();
                  const fornecedor = (xml.fornecedor || "").toUpperCase();
                  
                  if (xml.xmlType === 'NFSe' || xml.category === 'Serviços Profissionais / Contabilidade' || xml.category === 'servicos') {
                     if (desc.includes('CONTÁB') || desc.includes('CONTAB') || fornecedor.includes('CONTAB')) {
                        baseLabel = "Contabilidade Externa";
                     } else {
                        baseLabel = "Outros Prestadores de Serviço";
                     }
                  } else if (xml.xmlType === 'CTe' || desc.includes('FRETE')) {
                     baseLabel = "Serviços de Transporte / Frete";
                  } else if (xml.xmlType === 'NFe' || xml.category === 'insumos') {
                     baseLabel = "Aquisição de Insumos / Mercadorias";
                  }
              
                  if (xml.regime === 'Simples Nacional') {
                     baseLabel += " (Simples Nacional)";
                  }
                  
                  const issToDeduct = (xml.xmlType === 'NFSe' || xml.fileName === 'Lançamento Manual') ? (xml.deducoes?.iss || 0) : 0;
                  
                  const isDeductible = xml.regime !== 'Simples Nacional' || xml.xmlType === 'NFSe' || xml.fileName === 'Lançamento Manual';
                  let deducoes = 0;
                  if (isDeductible) {
                      deducoes = (xml.deducoes?.icms || 0) + (xml.deducoes?.pisCofins || 0) + (xml.deducoes?.desconto || 0) + issToDeduct;
                  }
                  
                  const valorLiquido = xml.valor - deducoes;
              
                  if (!acc[baseLabel]) acc[baseLabel] = 0;
                  acc[baseLabel] += Math.max(0, valorLiquido);
                  return acc;
                }, {} as Record<string, number>)
            ).map(([label, value], idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span>{label}</span>
                <span className="font-semibold text-gray-800">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            
            {Object.keys(currentMonthXmls.filter(xml => xml.tipoDespesa === "Gera crédito de IBS/CBS" || xml.tipoDespesa === "Gera Crédito de IBS/CBS" || xml.tipoDespesa === "Gera crédito" || xml.tipoDespesa === 'true')).length === 0 && (
              <div className="text-gray-400 italic">Nenhuma despesa elegível detalhada para este mês.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal Lançamento Manual */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[550px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 flex justify-between items-center bg-[#003b6e] text-white">
              <h3 className="font-bold text-[15px]">Lançamento Manual de Despesa</h3>
              <button onClick={() => setShowManualModal(false)} className="text-white/70 hover:text-white font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Número da Nota</label>
                  <input type="text" value={manualNumNota} onChange={e=>setManualNumNota(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Ex: 17" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Data de Emissão</label>
                  <input type="text" value={manualData} onChange={(e: any)=>setManualData(formatDate(e.target.value))} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="DD/MM/AAAA" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">
                    CNPJ do Fornecedor
                    {isConsultingManual && <span className="text-[#005696] font-normal ml-2 text-[11px] animate-pulse">(Consultando...)</span>}
                  </label>
                  <input type="text" value={manualCnpj} onChange={(e: any)=>setManualCnpj(formatCnpj(e.target.value))} className={`w-full text-[15px] border rounded px-3 py-2 outline-none focus:border-blue-500 ${isConsultingManual ? 'border-[#005696] bg-blue-50' : 'border-gray-300'}`} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Fornecedor (Razão Social)</label>
                  <input type="text" value={manualProvider} onChange={e=>setManualProvider(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Nome do Fornecedor" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Regime Tributário</label>
                  <select value={manualRegime} onChange={e=>setManualRegime(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white">
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Isento de IRPJ">Isento de IRPJ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Tipo de Crédito</label>
                  <select value={manualTipoCredito} onChange={e=>setManualTipoCredito(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white">
                    <option value="Gera Crédito de IBS/CBS">Gera Crédito de IBS/CBS</option>
                    <option value="Sem Crédito">Sem Crédito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1">Categoria da Despesa</label>
                <div className="flex gap-2">
                  <select value={manualCategoria} onChange={e=>setManualCategoria(e.target.value)} className="flex-1 text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white">
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowCategoryModal(true)} className="bg-[#005696] hover:bg-[#004a82] text-white p-2 rounded flex items-center justify-center transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Descrição / Serviço</label>
                  <input type="text" value={manualDesc} onChange={e=>setManualDesc(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Ex: Serviços de T.I." />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Valor Bruto (R$)</label>
                  <CurrencyInput
                    value={manualValor}
                    onValueChange={(val) => setManualValor(val || '')}
                    prefix="R$ "
                    decimalsLimit={2}
                    decimalSeparator=","
                    groupSeparator="."
                    className="w-full text-[15px] font-bold text-[#005696] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Descontos Incondicionais</label>
                  <CurrencyInput value={manualDesconto} onValueChange={val => setManualDesconto(val || '')} prefix="R$ " decimalsLimit={2} decimalSeparator="," groupSeparator="." className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">ICMS Destacado</label>
                  <CurrencyInput value={manualIcms} onValueChange={val => setManualIcms(val || '')} prefix="R$ " decimalsLimit={2} decimalSeparator="," groupSeparator="." className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="R$ 0,00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">PIS Destacado</label>
                  <CurrencyInput value={manualPis} onValueChange={val => setManualPis(val || '')} prefix="R$ " decimalsLimit={2} decimalSeparator="," groupSeparator="." className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">COFINS Destacada</label>
                  <CurrencyInput value={manualCofins} onValueChange={val => setManualCofins(val || '')} prefix="R$ " decimalsLimit={2} decimalSeparator="," groupSeparator="." className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="R$ 0,00" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg border-t border-gray-200">
              <button onClick={() => setShowManualModal(false)} className="px-5 py-2 text-[15px] font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-sm">Cancelar</button>
              <button onClick={handleAddManual} className="px-5 py-2 text-[15px] font-bold text-white bg-[#005696] hover:bg-[#004a82] rounded shadow-sm">Salvar Despesa</button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end pt-4 mt-8 border-t border-gray-200">
        <button onClick={() => setStep(2)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-[15px] py-2 px-5 rounded shadow-sm">Voltar</button>
        <button className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Imprimir</button>
        <button onClick={saveClient} className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Salvar Diagnóstico</button>
        <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Excluir Dados</button>
        <button onClick={() => setStep(4)} className="bg-[#004a82] hover:bg-[#003d6b] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Configuração de Alíquotas</button>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[400px] overflow-hidden flex flex-col">
            <div className="p-4 flex justify-between items-center bg-[#003b6e] text-white">
              <h3 className="font-bold text-[15px]">Cadastrar Nova Categoria</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-white/70 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <div className="p-6">
              <label className="block text-[13px] font-bold text-gray-700 mb-1">Nome da Categoria</label>
              <input type="text" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Ex: Enquadramento CBS" />
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg border-t border-gray-200">
              <button onClick={() => setShowCategoryModal(false)} className="px-5 py-2 text-[15px] font-bold text-gray-600 bg-white border border-gray-300 rounded shadow-sm">Cancelar</button>
              <button onClick={handleAddCategory} className="px-5 py-2 text-[15px] font-bold text-white bg-[#005696] hover:bg-[#004a82] rounded shadow-sm">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      <ProductDetailsModal
         isOpen={productModalState.isOpen}
         onClose={() => setProductModalState({ ...productModalState, isOpen: false })}
         title={productModalState.title}
         produtos={productModalState.produtos}
      />

    </div>
  );
}

