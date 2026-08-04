'use client';

import React, { useState } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import CurrencyInput from 'react-currency-input-field';
import { UploadCloud, Trash2, Edit2, FileText, Search, FilePlus } from 'lucide-react';
import { parseExpenseXml } from '../../../services/xml/xml-parser';
import { consultarCnpj } from '../../../services/cnpj-service';
import { ParsedXmlExpense } from '../../../domain/types/xml.types';
import JSZip from 'jszip';
import InputMask from 'react-input-mask';

const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function Step4Expenses() {
  const { 
    monthlyExpenses, updateMonthlyExpenses, 
    currentMonth, setCurrentMonth,
    setStep, setXmlDespesas, 
    xmlDespesas, addXmlDespesa, removeXmlDespesa, updateXmlExpenseStatus,
    companyData, cnpjCache, addCnpjToCache 
  } = useDiagnosisStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isReconsultando, setIsReconsultando] = useState(false);
  
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
  
  const handleAddManual = () => {
    if (!manualDesc || !manualValor || !manualProvider) {
      alert("Preencha descrição, fornecedor e valor.");
      return;
    }
    const numericValue = parseFloat(manualValor.replace(/,/g, '.'));
    
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
      deducoes: { icms: 0, pisCofins: 0, desconto: 0, iss: 0 }
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
  };

  const handleExportExcel = (tipoCst: string, label: string) => {
    let csvContent = "\uFEFF"; // BOM for UTF-8
    csvContent += "Nota Fiscal;Data Emissao;Tomador;Produto;NCM;CFOP;CST;Valor Bruto (R$);ICMS (R$);PIS/COFINS (R$);Desconto (R$);Valor Liquido (R$);Classificacao\n";
    
    let foundAny = false;
    const currentXmls = xmlDespesas.filter(x => x.monthIndex === currentMonth);
    
    currentXmls.forEach(n => {
      // Basic matching logic based on the old system
      let include = false;
      const isCredit = n.tipoDespesa === "Gera Crédito de IBS/CBS" || n.tipoDespesa === "Gera crédito" || n.tipoDespesa === "Gera crédito de IBS/CBS" || n.tipoDespesa === 'true';
      
      if (tipoCst === 'despesaGeral' && isCredit) include = true;
      if (tipoCst === 'icms_compras' && n.deducoes?.icms) include = true;
      if (tipoCst === 'pis_cofins_compras' && n.deducoes?.pisCofins) include = true;
      if (tipoCst === 'desconto_incondicional' && n.deducoes?.desconto) include = true;
      
      if (include) {
        foundAny = true;
        const nome = (n.descricao || n.category || "Item Único").replace(/;/g, ",");
        const tomador = (n.fornecedor || "").replace(/;/g, ",");
        const bruto = n.valor || 0;
        
        const icms = tipoCst === 'icms_compras' ? (n.deducoes?.icms || 0) : 0;
        const pisCofins = tipoCst === 'pis_cofins_compras' ? (n.deducoes?.pisCofins || 0) : 0;
        const desconto = tipoCst === 'desconto_incondicional' ? (n.deducoes?.desconto || 0) : 0;
        const liquido = bruto - icms - pisCofins - desconto;
        
        csvContent += `${n.numero || ""};${n.data || ""};${tomador};${nome};;;;"${bruto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}";"${icms.toLocaleString('pt-BR', {minimumFractionDigits: 2})}";"${pisCofins.toLocaleString('pt-BR', {minimumFractionDigits: 2})}";"${desconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}";"${liquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}";${label}\n`;
      }
    });

    // If no XMLs matched, but there is a manual value in the store, export the global value
    const manualValue = (monthlyExpenses[currentMonth] as any)?.[tipoCst] as number || 0;
    if (!foundAny && manualValue > 0) {
      foundAny = true;
      const valFmt = manualValue.toLocaleString('pt-BR', {minimumFractionDigits: 2});
      const zero = "0,00";
      csvContent += `-;-;-;-;-;-;-;"${valFmt}";"${zero}";"${zero}";"${zero}";"${valFmt}";${label} (Lançamento Global)\n`;
    }

    if (!foundAny) {
      alert("Nenhum produto ou valor encontrado com esta classificação neste mês.");
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Detalhamento_${SHORT_MONTHS[currentMonth].toLowerCase()}_${tipoCst}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentMonthXmls = xmlDespesas.filter(x => x.monthIndex === currentMonth);
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
        useDiagnosisStore.getState().xmlDespesas.forEach(x => {
          if (x.cnpj === doc) updateXmlExpenseStatus(x.id, { isConsultingCnpj: true });
        });
        await new Promise(r => setTimeout(r, 600)); // fake delay for UI
        useDiagnosisStore.getState().xmlDespesas.forEach(x => {
          if (x.cnpj === doc) updateXmlExpenseStatus(x.id, { regime: "Pessoa Física", isConsultingCnpj: false });
        });
        continue;
      }
      
      const cnpj = doc;
      if (useDiagnosisStore.getState().cnpjCache[cnpj]) {
        const regime = useDiagnosisStore.getState().cnpjCache[cnpj];
        useDiagnosisStore.getState().xmlDespesas.forEach(x => {
          if (x.cnpj === cnpj && x.regime !== regime) {
            updateXmlExpenseStatus(x.id, { regime, isConsultingCnpj: false });
          }
        });
        continue;
      }
      
      // Marcar como consultando
      useDiagnosisStore.getState().xmlDespesas.forEach(x => {
        if (x.cnpj === cnpj) updateXmlExpenseStatus(x.id, { isConsultingCnpj: true });
      });
      
      const info = await consultarCnpj(cnpj);
      if (info) {
        addCnpjToCache(cnpj, info.regime);
        useDiagnosisStore.getState().xmlDespesas.forEach(x => {
          if (x.cnpj === cnpj) updateXmlExpenseStatus(x.id, { regime: info.regime as any, isConsultingCnpj: false });
        });
      } else {
        useDiagnosisStore.getState().xmlDespesas.forEach(x => {
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
      <button onClick={() => handleExportExcel(exportKey, title)} className="mt-1 bg-[#eef3f7] hover:bg-[#e2eaf1] text-[12px] font-bold text-[#005696] py-1 rounded w-full text-left px-2 transition-colors">
        Ver Produtos
      </button>
    </div>
  );

  return (
    <div className="w-full text-gray-800">
      
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#001736] mb-1">Despesas e Levantamento de Créditos</h1>
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
            <input type="text" placeholder="Buscar por número, fornecedor ou CNPJ..." className="w-full text-[15px] border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500" />
          </div>
          <select className="text-[15px] border border-gray-300 rounded px-2 py-1.5 outline-none text-gray-700 bg-white">
            <option>Todos os Regimes</option>
          </select>
          <select className="text-[15px] border border-gray-300 rounded px-2 py-1.5 outline-none text-gray-700 bg-white">
            <option>Crédito: Todos</option>
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
            onClick={() => setXmlDespesas(xmlDespesas.filter(x => x.monthIndex !== currentMonth))}
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
                  <InputMask mask="99/99/9999" value={manualData} onChange={(e: any)=>setManualData(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="DD/MM/AAAA" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">CNPJ do Fornecedor</label>
                  <InputMask mask="99.999.999/9999-99" value={manualCnpj} onChange={(e: any)=>setManualCnpj(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="00.000.000/0000-00" />
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
                    <option value="Simples Nacional">Simples Nacional</option>
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
                    <option value="Aquisição de Insumos / Materiais Aplicados">Aquisição de Insumos / Materiais Aplicados</option>
                    <option value="Serviços de Limpeza, Conservação e Manutenção">Serviços de Limpeza, Conservação e Manutenção</option>
                    <option value="Vale-Transporte e Refeição">Vale-Transporte e Refeição</option>
                    <option value="Serviços Profissionais / Contabilidade">Serviços Profissionais / Contabilidade</option>
                    <option value="Outros Serviços / Outras Despesas">Outros Serviços / Outras Despesas</option>
                  </select>
                  <button className="bg-[#005696] hover:bg-[#004a82] text-white p-2 rounded flex items-center justify-center transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1">Descrição / Serviço</label>
                <input type="text" value={manualDesc} onChange={e=>setManualDesc(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500" placeholder="Ex: Serviços de Consultoria de T.I." />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1">Valor da Nota (R$)</label>
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
            
            <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg border-t border-gray-200">
              <button onClick={() => setShowManualModal(false)} className="px-5 py-2 text-[15px] font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded shadow-sm">Cancelar</button>
              <button onClick={handleAddManual} className="px-5 py-2 text-[15px] font-bold text-white bg-[#005696] hover:bg-[#004a82] rounded shadow-sm">Salvar Despesa</button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end pt-4 mt-8 border-t border-gray-200">
        <button onClick={() => setStep(3)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-[15px] py-2 px-5 rounded shadow-sm">Voltar</button>
        <button className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Imprimir</button>
        <button className="bg-[#005696] hover:bg-[#004a82] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Salvar Diagnóstico</button>
        <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Excluir Dados</button>
        <button onClick={() => setStep(5)} className="bg-[#004a82] hover:bg-[#003d6b] text-white font-bold text-[15px] py-2 px-5 rounded shadow-sm">Ver Resultados / Dashboard</button>
      </div>

    </div>
  );
}

