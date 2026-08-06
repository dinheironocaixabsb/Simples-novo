'use client';

import React, { useState, useMemo } from 'react';
import { useLucroPresumidoStore } from '../../../store/useLucroPresumidoStore';
import { useClientStore } from '../../../store/useClientStore';
import { Upload, FileText, Check, Search, Pencil, Trash2, ArrowRight, RefreshCw, X } from 'lucide-react';
import JSZip from 'jszip';
import { parseSalesXml } from '../../../services/xml/xml-parser';
import { ParsedXmlSales, ProdutoDetalhado } from '../../../domain/types/xml.types';
import { ProductsModal } from './ProductsModal';

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function Step3Receitas() {
  const receitasMensais = useLucroPresumidoStore((state) => state.receitasMensais);
  const updateReceitaMes = useLucroPresumidoStore((state) => state.updateReceitaMes);
  const setStep = useLucroPresumidoStore((state) => state.setStep);
  const saveClient = useLucroPresumidoStore((state) => state.saveClient);
  const newClient = useLucroPresumidoStore((state) => state.newClient);

  const activeXmlFaturamento = useClientStore((state) => state.activeXmlFaturamento);
  const updateXmlSalesStatus = useClientStore((state) => state.updateXmlSalesStatus);
  const setXmlFaturamento = useClientStore((state) => state.setXmlFaturamento);

  const [activeMainTab, setActiveMainTab] = useState<'digitacao' | 'xml'>('digitacao');
  const [activeXmlMonthIndex, setActiveXmlMonthIndex] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('Todos os Regimes');
  const [editingXmlId, setEditingXmlId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [modalState, setModalState] = useState<{ isOpen: boolean, title: string, produtos: ProdutoDetalhado[] }>({ isOpen: false, title: '', produtos: [] });
  
  const activeCompanyData = useClientStore((state) => state.activeCompanyData);

  const handleOpenProducts = (categoria: string, mesIndex: number) => {
    const xmlsForMonth = activeXmlFaturamento.filter(x => x.monthIndex === mesIndex && x.xmlType === 'NFe');
    let allProducts: ProdutoDetalhado[] = [];
    xmlsForMonth.forEach(xml => {
      if (xml.produtosDetalhados) {
        allProducts = [...allProducts, ...xml.produtosDetalhados];
      }
    });

    let filtered: ProdutoDetalhado[] = [];
    let title = '';

    switch (categoria) {
      case 'mercadoInterno':
        filtered = allProducts.filter(p => !p.isDevolucao && !(p.cstPis === '04' || p.cstCofins === '04') && !(p.cstPis === '06' || p.cstCofins === '06' || p.isAnexo1) && !p.isAnexo15 && !p.isAlimento60 && !p.isHigiene60);
        title = 'Detalhamento: Mercado Interno';
        break;
      case 'cst04':
        filtered = allProducts.filter(p => !p.isDevolucao && (p.cstPis === '04' || p.cstCofins === '04'));
        title = 'Detalhamento: CST 04 Monofásico';
        break;
      case 'cst06':
        filtered = allProducts.filter(p => !p.isDevolucao && (p.cstPis === '06' || p.cstCofins === '06' || p.isAnexo1));
        title = 'Detalhamento: CST 06 Alíq. Zero / Anexo I';
        break;
      case 'anexo5':
        filtered = allProducts.filter(p => !p.isDevolucao && p.isAnexo15);
        title = 'Detalhamento: Anexo V (Hortifruti)';
        break;
      case 'anexo7':
        filtered = allProducts.filter(p => !p.isDevolucao && p.isAlimento60);
        title = 'Detalhamento: Anexo VII (Alimentos 60%)';
        break;
      case 'anexo8':
        filtered = allProducts.filter(p => !p.isDevolucao && p.isHigiene60);
        title = 'Detalhamento: Anexo VIII (Higiene 60%)';
        break;
      case 'devolucoesVendas':
        filtered = allProducts.filter(p => p.isDevolucao);
        title = 'Detalhamento: Devoluções de Vendas';
        break;
      case 'icmsPisCofins':
        filtered = allProducts.filter(p => !p.isDevolucao && p.icms > 0);
        title = 'Detalhamento: ICMS Destacado (excl. PIS/COFINS)';
        break;
      case 'icmsIbsCbs':
        filtered = allProducts.filter(p => !p.isDevolucao && p.icms > 0);
        title = 'Detalhamento: ICMS Total a excluir (IBS/CBS)';
        break;
      case 'pisCofinsIbsCbs':
        filtered = allProducts.filter(p => !p.isDevolucao && p.pisCofins > 0);
        title = 'Detalhamento: PIS/COFINS a excluir (IBS/CBS)';
        break;
      default:
        break;
    }

    setModalState({ isOpen: true, title, produtos: filtered });
  };

  const processFiles = async (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const newXmls: ParsedXmlSales[] = [...activeXmlFaturamento];
    const errors: string[] = [];

    const files = Array.from(fileList);

    const parseAndAddXml = async (text: string, filename: string) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        errors.push(`${filename}: Erro ao interpretar XML`);
        return;
      }
      
      const parsed = parseSalesXml(xmlDoc, filename, activeCompanyData.cnpj);
      parsed.isConsultingCnpj = false;

      const generateUniqueKey = (xml: ParsedXmlSales) => {
        if (xml.xmlType === 'NFe' && xml.chave) return xml.chave;
        const cleanCnpj = xml.cnpj ? String(xml.cnpj).replace(/\D/g, '') : '';
        return `${xml.numero}-${cleanCnpj}-${xml.data}`;
      };
      
      const currentKey = generateUniqueKey(parsed);
      if (newXmls.some(xml => generateUniqueKey(xml) === currentKey)) {
        return; 
      }

      newXmls.push(parsed);

      // --- Atribuir valores para o Lucro Presumido ---
      const mesIndex = parsed.monthIndex;
      if (mesIndex >= 0 && mesIndex < 12) {
        const mesAtual = receitasMensais[mesIndex];
        const updates = { 
          receitas: { ...mesAtual.receitas },
          exclusoes: { ...mesAtual.exclusoes },
          atividades: { ...mesAtual.atividades }
        };

        if (parsed.xmlType === 'NFe' && parsed.produtosDetalhados) {
          updates.atividades.comercio = true;
          for (const prod of parsed.produtosDetalhados) {
            if (prod.isDevolucao) {
              updates.exclusoes.devolucoesVendas += prod.valorBruto;
            } else {
              if (prod.cstPis === '04' || prod.cstCofins === '04') {
                updates.receitas.cst04 += prod.valorBruto;
              } else if (prod.cstPis === '06' || prod.cstCofins === '06' || prod.isAnexo1) {
                updates.receitas.cst06AliquotaZero += prod.valorBruto;
              } else if (prod.isAnexo15) {
                updates.receitas.anexo5 += prod.valorBruto;
              } else if (prod.isAlimento60) {
                updates.receitas.anexo7 += prod.valorBruto;
              } else if (prod.isHigiene60) {
                updates.receitas.anexo8 += prod.valorBruto;
              } else {
                updates.receitas.mercadoInterno += prod.valorBruto;
              }

              updates.exclusoes.icmsPisCofins += prod.icms;
              updates.exclusoes.icmsIbsCbs += prod.icms;
              updates.exclusoes.pisCofinsIbsCbs += prod.pisCofins;
            }
          }
        } else if (parsed.xmlType === 'NFSe') {
          updates.atividades.servicos = true;
          updates.receitas.mercadoInterno += parsed.valor;
          if (parsed.deducoes?.iss) {
            updates.exclusoes.iss += parsed.deducoes.iss;
          }
        }

        updateReceitaMes(mesIndex, updates);
      }
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name.toLowerCase();

      try {
        if (name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          for (const relativePath in zip.files) {
            const zipEntry = zip.files[relativePath];
            if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.xml')) {
              try {
                const text = await zipEntry.async("string");
                await parseAndAddXml(text, zipEntry.name);
              } catch (err: any) {
                errors.push(`${zipEntry.name}: ${err.message}`);
              }
            }
          }
        } else if (name.endsWith('.xml')) {
          let text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
            reader.readAsText(file, 'ISO-8859-1'); 
          });

          const parser = new DOMParser();
          if (parser.parseFromString(text, "text/xml").getElementsByTagName("parsererror").length > 0) {
            text = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onload = (e) => resolve(e.target?.result as string);
              r.readAsText(file, 'UTF-8');
            });
          }

          await parseAndAddXml(text, file.name);
        } else {
          errors.push(`${file.name}: Formato não suportado.`);
        }
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    setXmlFaturamento(newXmls);
    if (errors.length > 0) {
      setErrorMsg(errors.join('\n'));
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseCurrencyInput = (val: string) => {
    const num = parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
    return num;
  };

  const handleClear = () => {
    if (confirm('Deseja realmente limpar todos os dados não salvos?')) {
      newClient();
    }
  };

  const handleClearAllXmls = () => {
    if (window.confirm('Tem certeza que deseja excluir todos os XMLs importados?')) {
      setXmlFaturamento([]);
    }
  };

  const handleDeleteXml = (id: string) => {
    if (confirm('Deseja realmente excluir esta nota fiscal?')) {
      setXmlFaturamento(activeXmlFaturamento.filter(x => x.id !== id));
    }
  };

  const startEditingXml = (xml: any) => {
    setEditingXmlId(xml.id);
    setEditForm({
      numero: xml.numero || '',
      dataEmissao: xml.data || '',
      cnpjCliente: xml.cnpj || '',
      nomeCliente: xml.tomador || '',
      regimeTributario: xml.regime || '',
      valorTotal: xml.valor || 0
    });
  };

  const saveEditedXml = () => {
    setXmlFaturamento(activeXmlFaturamento.map(x => {
      if (x.id === editingXmlId) {
        return {
          ...x,
          numero: editForm.numero,
          data: editForm.dataEmissao,
          cnpj: editForm.cnpjCliente,
          tomador: editForm.nomeCliente,
          regime: editForm.regimeTributario,
          valor: editForm.valorTotal
        };
      }
      return x;
    }));
    setEditingXmlId(null);
  };

  const filteredXmlsByMonth = useMemo(() => {
    return activeXmlFaturamento.filter(xml => xml.monthIndex === activeXmlMonthIndex);
  }, [activeXmlFaturamento, activeXmlMonthIndex]);

  const filteredXmls = useMemo(() => {
    return filteredXmlsByMonth.filter(xml => {
      const matchSearch = (xml.numero && String(xml.numero).toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (xml.tomador && String(xml.tomador).toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (xml.cnpj && String(xml.cnpj).includes(searchTerm));
      const matchRegime = regimeFilter === 'Todos os Regimes' || xml.regime === regimeFilter;
      return matchSearch && matchRegime;
    });
  }, [filteredXmlsByMonth, searchTerm, regimeFilter]);

  const totalXmls = filteredXmls.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const ActivityCheckbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-[#005696] rounded border-gray-300 focus:ring-[#005696]"
      />
      {label}
    </label>
  );

  const ValueInput = ({ label, value, onChange, tooltip, onVerProdutos }: { label: string, value: number, onChange: (v: number) => void, tooltip?: string, onVerProdutos?: () => void }) => (
    <div className="flex flex-col gap-1.5" title={tooltip}>
      <label className="text-[11px] font-bold text-gray-700 truncate block whitespace-nowrap overflow-hidden text-ellipsis">{label}</label>
      <input 
        type="text"
        value={value || ''}
        onChange={(e) => onChange(parseCurrencyInput(e.target.value))}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]"
        placeholder="R$ 0,00"
      />
      {onVerProdutos && (
        <button onClick={onVerProdutos} className="text-[#005696] hover:underline text-[11px] font-medium self-center mt-1">Ver Produtos</button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f2937] tracking-wide mb-1">2. Receitas e Base de Presunção</h1>
        <p className="text-[#6b7280] text-[14px]">Informe as receitas faturadas mês a mês e distribua as atividades (Presunção do IRPJ/CSLL)</p>
      </header>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveMainTab('digitacao')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeMainTab === 'digitacao' 
            ? 'border-[#005696] text-[#005696] bg-blue-50/50' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          1. Digitação de Receitas e Presunção
        </button>
        <button
          onClick={() => setActiveMainTab('xml')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeMainTab === 'xml' 
            ? 'border-[#005696] text-[#005696] bg-blue-50/50' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Notas Fiscais de Vendas e Serviços Prestados (XML)
        </button>
      </div>

      {activeMainTab === 'digitacao' && (
        <div className="flex flex-col gap-6 mb-8">
          {receitasMensais.map((mes, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#f8fafc] px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#005696] w-48">Mês: {months[index]}</h3>
                <div className="flex flex-col items-end">
                  <label className="text-[11px] font-bold text-gray-600 mb-1">Competência</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 rounded px-3 py-1 text-sm w-32"
                    placeholder="MM/AAAA"
                  />
                </div>
              </div>

              <div className="p-6">
                {/* Atividades do Mês */}
                <div className="mb-6">
                  <h4 className="text-[13px] font-bold text-gray-700 mb-2">Atividades / Bases de Presunção (IRPJ e CSLL)</h4>
                  <div className="flex flex-wrap gap-4 bg-gray-50 p-3 rounded border border-gray-100">
                    <ActivityCheckbox label="Indústria" checked={mes.atividades.industria} onChange={(v) => updateReceitaMes(index, { atividades: { ...mes.atividades, industria: v }})} />
                    <ActivityCheckbox label="Comércio" checked={mes.atividades.comercio} onChange={(v) => updateReceitaMes(index, { atividades: { ...mes.atividades, comercio: v }})} />
                    <ActivityCheckbox label="Serviços" checked={mes.atividades.servicos} onChange={(v) => updateReceitaMes(index, { atividades: { ...mes.atividades, servicos: v }})} />
                    <ActivityCheckbox label="Equip Hospitalar" checked={mes.atividades.equipHospitalar} onChange={(v) => updateReceitaMes(index, { atividades: { ...mes.atividades, equipHospitalar: v }})} />
                    <ActivityCheckbox label="Transp. Cargas" checked={mes.atividades.transporteCargas} onChange={(v) => updateReceitaMes(index, { atividades: { ...mes.atividades, transporteCargas: v }})} />
                    <ActivityCheckbox label="Transp. Passageiros" checked={mes.atividades.transportePassageiros} onChange={(v) => updateReceitaMes(index, { atividades: { ...mes.atividades, transportePassageiros: v }})} />
                  </div>
                </div>

                {/* Bloco de Receitas */}
                {(mes.atividades.comercio || mes.atividades.industria || mes.atividades.servicos) && (
                  <div className="mb-6">
                    <h4 className="text-[13px] font-bold text-[#005696] mb-3 pb-1 border-b border-gray-100 flex justify-between">
                      Comércio / Indústria / Serviços
                      <span className="text-[11px] font-normal text-gray-500">IRPJ: 8% / CSLL: 12%</span>
                    </h4>
                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                      <ValueInput label="Mercado Interno (SIQ)" value={mes.receitas.mercadoInterno} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, mercadoInterno: v }})} onVerProdutos={() => handleOpenProducts('mercadoInterno', index)} />
                      <ValueInput label="Mercado Externo (SIQ)" value={mes.receitas.mercadoExterno} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, mercadoExterno: v }})} />
                      <ValueInput label="Receita CST 04 (Monofásico)" value={mes.receitas.cst04} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, cst04: v }})} onVerProdutos={() => handleOpenProducts('cst04', index)} />
                      <ValueInput label="Receita CST 06 (Monofásico)" value={mes.receitas.cst06Monofasico} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, cst06Monofasico: v }})} />
                      <ValueInput label="Receita CST 06 (Alíquota Zero)" value={mes.receitas.cst06AliquotaZero} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, cst06AliquotaZero: v }})} onVerProdutos={() => handleOpenProducts('cst06', index)} />
                      <ValueInput label="Anexo I Alimentos (Alíq. Zero)" value={mes.receitas.anexo1} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, anexo1: v }})} />
                      <ValueInput label="Anexo V Hortifruti (100%)" value={mes.receitas.anexo5} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, anexo5: v }})} onVerProdutos={() => handleOpenProducts('anexo5', index)} />
                      <ValueInput label="Anexo VII Alimentos (60%)" value={mes.receitas.anexo7} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, anexo7: v }})} onVerProdutos={() => handleOpenProducts('anexo7', index)} />
                      <ValueInput label="Anexo VIII Higiene (60%)" value={mes.receitas.anexo8} onChange={(v) => updateReceitaMes(index, { receitas: { ...mes.receitas, anexo8: v }})} onVerProdutos={() => handleOpenProducts('anexo8', index)} />
                    </div>
                  </div>
                )}

                {/* Exclusões */}
                <div>
                  <h4 className="text-[13px] font-bold text-gray-700 mb-3">Exclusões da Base IBS/CBS (Detalhamento)</h4>
                  <div className="grid grid-cols-4 gap-x-6 gap-y-4 bg-[#f8fafc] p-4 rounded-md border border-gray-200">
                    <ValueInput label="Descontos Incondicionais" value={mes.exclusoes.descontosIncondicionais} onChange={(v) => updateReceitaMes(index, { exclusoes: { ...mes.exclusoes, descontosIncondicionais: v }})} />
                    <ValueInput label="Devoluções de Vendas" value={mes.exclusoes.devolucoesVendas} onChange={(v) => updateReceitaMes(index, { exclusoes: { ...mes.exclusoes, devolucoesVendas: v }})} onVerProdutos={() => handleOpenProducts('devolucoesVendas', index)} />
                    <ValueInput label="ISS Excluído da Base (LC 214)" value={mes.exclusoes.iss} onChange={(v) => updateReceitaMes(index, { exclusoes: { ...mes.exclusoes, iss: v }})} />
                    <ValueInput label="ICMS destacado a excluir (PIS/COFINS)" value={mes.exclusoes.icmsPisCofins} onChange={(v) => updateReceitaMes(index, { exclusoes: { ...mes.exclusoes, icmsPisCofins: v }})} onVerProdutos={() => handleOpenProducts('icmsPisCofins', index)} />
                    <ValueInput label="ICMS Total a excluir (IBS/CBS)" value={mes.exclusoes.icmsIbsCbs} onChange={(v) => updateReceitaMes(index, { exclusoes: { ...mes.exclusoes, icmsIbsCbs: v }})} onVerProdutos={() => handleOpenProducts('icmsIbsCbs', index)} />
                    <ValueInput label="PIS/COFINS a excluir (IBS/CBS)" value={mes.exclusoes.pisCofinsIbsCbs} onChange={(v) => updateReceitaMes(index, { exclusoes: { ...mes.exclusoes, pisCofinsIbsCbs: v }})} onVerProdutos={() => handleOpenProducts('pisCofinsIbsCbs', index)} />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {activeMainTab === 'xml' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-8">
          
          {/* Abas Horizontais dos Meses no Importador */}
          <div className="flex flex-wrap gap-1 mb-6 justify-center">
            {months.map((mes, idx) => (
              <button
                key={mes}
                onClick={() => setActiveXmlMonthIndex(idx)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  activeXmlMonthIndex === idx
                    ? 'bg-[#005696] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {mes}
              </button>
            ))}
          </div>

          <div className="border border-dashed border-[#005696] bg-blue-50/30 rounded-lg p-6">
            <h3 className="text-[14px] font-bold text-[#005696] mb-4">Importar Notas Fiscais de Saída (XML) - {months[activeXmlMonthIndex]}</h3>
            <div className="text-center mb-4">
              <Upload className="w-8 h-8 text-[#005696] mx-auto mb-2" />
              <p className="text-[13px] text-gray-700">
                Arraste os arquivos XML das Notas Fiscais de Vendas para este mês aqui.<br/>
                <span className="text-[11px] text-gray-500">Os dados lidos das notas serão extraídos automaticamente.</span>
              </p>
            </div>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 whitespace-pre-wrap">
                {errorMsg}
              </div>
            )}
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors mb-4
                ${isDragging ? 'border-[#005696] bg-blue-100/50' : 'border-gray-300 hover:bg-gray-50 bg-white'}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length > 0) {
                  processFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => document.getElementById('salesXmlInputLP')?.click()}
            >
              <button className="text-[#005696] text-[13px] font-bold hover:underline flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Arraste os XMLs aqui ou clique para buscar
              </button>
              <input 
                type="file" 
                id="salesXmlInputLP" 
                accept=".xml,.zip" 
                className="hidden" 
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) processFiles(e.target.files);
                  e.target.value = '';
                }} 
              />
            </div>

            {/* Tabela de Todos os XMLs Importados */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4">
              <div className="bg-gray-50 p-2 border-b border-gray-200 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar por número, cliente ou CNPJ..." 
                    className="w-full pl-8 pr-2 py-1 text-[12px] border border-gray-300 rounded focus:outline-none focus:border-[#005696]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="border border-gray-300 rounded px-2 py-1 text-[12px] bg-white"
                    value={regimeFilter}
                    onChange={(e) => setRegimeFilter(e.target.value)}
                  >
                    <option value="Todos os Regimes">Todos os Regimes</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                  <button className="bg-[#005696] text-white px-3 py-1 text-[12px] font-bold rounded hover:bg-[#004a82]">
                    Reconsultar CNPJs
                  </button>
                  <button onClick={handleClearAllXmls} className="bg-[#e11d48] text-white px-3 py-1 text-[12px] font-bold rounded hover:bg-[#be123c]">
                    Limpar Tudo
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-[11px] text-left">
                  <thead className="text-[11px] font-bold text-[#1f2937] bg-gray-100 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 w-16">Nº Nota</th>
                      <th className="px-3 py-2 w-20">Data</th>
                      <th className="px-3 py-2">Cliente / CNPJ</th>
                      <th className="px-3 py-2 w-32">Regime Tributário</th>
                      <th className="px-3 py-2 text-right w-24">Valor</th>
                      <th className="px-3 py-2 text-center w-16">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredXmls.map((xml) => (
                      <tr key={xml.id} className="hover:bg-gray-50">
                        {editingXmlId === xml.id ? (
                          <td colSpan={6} className="px-3 py-2 bg-blue-50">
                            <div className="grid grid-cols-5 gap-2">
                              <input type="text" value={editForm.numero} onChange={e => setEditForm({...editForm, numero: e.target.value})} className="border p-1 text-[11px] rounded" placeholder="Nº Nota" />
                              <input type="text" value={editForm.dataEmissao} onChange={e => setEditForm({...editForm, dataEmissao: e.target.value})} className="border p-1 text-[11px] rounded" placeholder="Data" />
                              <input type="text" value={editForm.cnpjCliente} onChange={e => setEditForm({...editForm, cnpjCliente: e.target.value})} className="border p-1 text-[11px] rounded" placeholder="CNPJ" />
                              <input type="text" value={editForm.nomeCliente} onChange={e => setEditForm({...editForm, nomeCliente: e.target.value})} className="border p-1 text-[11px] rounded" placeholder="Cliente" />
                              <div className="flex gap-1">
                                <input type="number" value={editForm.valorTotal} onChange={e => setEditForm({...editForm, valorTotal: parseFloat(e.target.value)})} className="border p-1 text-[11px] rounded w-full" placeholder="Valor" />
                                <button onClick={saveEditedXml} className="bg-green-600 text-white p-1 rounded hover:bg-green-700" title="Salvar">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => setEditingXmlId(null)} className="bg-gray-400 text-white p-1 rounded hover:bg-gray-500" title="Cancelar">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-medium">{xml.numero}</td>
                            <td className="px-3 py-2 text-gray-500">{xml.data}</td>
                            <td className="px-3 py-2">
                              <div className="font-bold text-[#1f2937] leading-tight">{xml.tomador}</div>
                              <div className="text-gray-500 leading-tight">{xml.cnpj}</div>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{xml.regime || 'Não Identificado'}</td>
                            <td className="px-3 py-2 text-right font-bold text-[#1f2937]">{formatCurrency(xml.valor)}</td>
                            <td className="px-3 py-2 flex items-center justify-center gap-2">
                              <button className="text-gray-400 hover:text-blue-600" onClick={() => startEditingXml(xml)} title="Editar">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button className="text-gray-400 hover:text-red-600" onClick={() => handleDeleteXml(xml.id)} title="Excluir">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {filteredXmls.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-gray-500">Nenhum XML de venda importado ainda para este mês.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 p-2 text-right border-t border-gray-200">
                <span className="text-[12px] font-bold text-[#1f2937]">Total Acumulado (Filtrado): <span className="text-[#005696]">{formatCurrency(totalXmls)}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-center gap-4 mt-4 pb-8">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-[13px] font-bold rounded shadow-sm hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-white border border-[#005696] text-[#005696] text-[13px] font-bold rounded shadow-sm hover:bg-blue-50 transition-colors"
        >
          Imprimir
        </button>
        <button
          onClick={saveClient}
          className="px-6 py-2 bg-[#005696] text-white text-[13px] font-bold rounded shadow-sm hover:bg-[#004a82] transition-colors"
        >
          Salvar Diagnóstico
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-white border border-[#e11d48] text-[#e11d48] text-[13px] font-bold rounded shadow-sm hover:bg-red-50 transition-colors"
        >
          Excluir Dados
        </button>
        <button
          onClick={() => setStep(3)}
          className="px-6 py-2 bg-[#005696] text-white text-[13px] font-bold rounded shadow-sm hover:bg-[#004a82] transition-colors flex items-center gap-2"
        >
          Avançar para Configurações
        </button>
      </div>

      <ProductsModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        produtos={modalState.produtos}
      />
    </div>
  );
}
