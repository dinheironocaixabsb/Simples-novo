import React, { useCallback, useState } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { useClientStore } from '../../../store/useClientStore';
import { parseSalesXml } from '../../../services/xml/xml-parser';
import { consultarCnpj } from '../../../services/cnpj-service';
import { UploadCloud, FileType, Trash2, CheckCircle2, AlertCircle, RefreshCw, Loader2, Edit2 } from 'lucide-react';
import { ParsedXmlSales } from '../../../domain/types/xml.types';
import JSZip from 'jszip';
import CurrencyInput from 'react-currency-input-field';

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatCnpjProgressive = (val: string) => {
  const v = val.replace(/\D/g, '');
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  } else {
    return v.slice(0, 14)
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
  }
};

const formatDateProgressive = (val: string) => {
  const v = val.replace(/\D/g, '').slice(0, 8);
  return v.replace(/^(\d{2})(\d)/, '$1/$2')
          .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
};

const parseDateForSort = (dateStr: string) => {
  if (!dateStr) return 0;
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
  }
  return 0;
};

export function Step3SalesXml() {
  const { 
    currentXmlMonth, setCurrentXmlMonth, 
    cnpjCache, addCnpjToCache 
  } = useDiagnosisStore();
  const { 
    activeCompanyData: companyData, 
    activeXmlFaturamento: xmlFaturamento, 
    setXmlFaturamento, 
    updateXmlSalesStatus 
  } = useClientStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReconsultando, setIsReconsultando] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegime, setFilterRegime] = useState('Todos os Regimes');
  
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingXmlId, setEditingXmlId] = useState<string | null>(null);
  
  const [manualNumNota, setManualNumNota] = useState('');
  const [manualData, setManualData] = useState('');
  const [manualCnpj, setManualCnpj] = useState('');
  const [manualTomador, setManualTomador] = useState('');
  const [manualRegime, setManualRegime] = useState('Lucro Presumido');
  const [manualDesc, setManualDesc] = useState('');
  const [manualValor, setManualValor] = useState('');
  const [isConsultingManual, setIsConsultingManual] = useState(false);

  const resetManualForm = () => {
    setManualNumNota('');
    setManualData('');
    setManualCnpj('');
    setManualTomador('');
    setManualRegime('Lucro Presumido');
    setManualDesc('');
    setManualValor('');
    setEditingXmlId(null);
    setShowManualModal(false);
  };

  React.useEffect(() => {
    const cleanDoc = manualCnpj.replace(/\D/g, '');
    if (cleanDoc.length === 14) {
      setIsConsultingManual(true);
      consultarCnpj(cleanDoc).then(info => {
        if (info) {
          if (info.razaoSocial) setManualTomador(info.razaoSocial);
          if (info.regime && info.regime !== "Não Optante") {
            setManualRegime(info.regime);
          }
        }
      }).finally(() => {
        setIsConsultingManual(false);
      });
    }
  }, [manualCnpj]);

  const handleAddManual = () => {
    if (!manualDesc || !manualValor || !manualTomador) {
      alert("Preencha descrição, cliente e valor.");
      return;
    }
    const numericValue = parseFloat(manualValor.replace(/,/g, '.'));
    
    const manualSales: ParsedXmlSales = {
      id: editingXmlId || ('manual-' + Date.now()),
      chave: '',
      numero: manualNumNota || 'Manual',
      data: manualData || `15/${String(currentXmlMonth + 1).padStart(2, '0')}/2024`,
      monthIndex: currentXmlMonth,
      tomador: manualTomador,
      cnpj: manualCnpj,
      regime: manualRegime,
      descricao: manualDesc,
      valor: numericValue,
      fileName: 'Lançamento Manual',
      xmlType: 'NFSe',
      isConsultingCnpj: false,
      deducoes: { icms: 0, pisCofins: 0, desconto: 0, iss: 0 }
    };
    
    const newXmls = xmlFaturamento.filter(x => x.id !== editingXmlId);
    setXmlFaturamento([...newXmls, manualSales]);
    resetManualForm();
  };

  const handleEditXml = (xml: ParsedXmlSales) => {
    setEditingXmlId(xml.id);
    setManualNumNota(xml.numero === 'Manual' ? '' : xml.numero);
    setManualData(xml.data);
    setManualCnpj(xml.cnpj);
    setManualTomador(xml.tomador);
    setManualRegime(xml.regime);
    setManualDesc(xml.descricao || '');
    setManualValor(xml.valor.toString().replace('.', ','));
    setShowManualModal(true);
  };

  const formatCpfCnpj = (val: string) => {
    return formatCnpjProgressive(val);
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

  const checkCnpjs = async (xmlsToCheck: ParsedXmlSales[], force: boolean = false) => {
    const uniqueDocs = Array.from(new Set(xmlsToCheck.map(x => x.cnpj).filter(c => c && (c.replace(/\D/g, '').length === 14 || c.replace(/\D/g, '').length === 11))));
    
    for (const doc of uniqueDocs) {
      const isCpf = doc.replace(/\D/g, '').length === 11;

      if (isCpf) {
        useClientStore.getState().activeXmlFaturamento.forEach(x => {
          if (x.cnpj === doc) updateXmlSalesStatus(x.id, { isConsultingCnpj: true });
        });
        await new Promise(r => setTimeout(r, 600)); // fake delay for UI
        useClientStore.getState().activeXmlFaturamento.forEach(x => {
          if (x.cnpj === doc) updateXmlSalesStatus(x.id, { regime: "Pessoa Física", isConsultingCnpj: false });
        });
        continue;
      }
      
      const cnpj = doc;
      if (!force && useDiagnosisStore.getState().cnpjCache[cnpj]) {
        const regime = useDiagnosisStore.getState().cnpjCache[cnpj];
        useClientStore.getState().activeXmlFaturamento.forEach(x => {
          if (x.cnpj === cnpj && x.regime !== regime) {
            updateXmlSalesStatus(x.id, { regime, isConsultingCnpj: false });
          }
        });
        continue;
      }
      
      // Marcar como consultando
      useClientStore.getState().activeXmlFaturamento.forEach(x => {
        if (x.cnpj === cnpj) updateXmlSalesStatus(x.id, { isConsultingCnpj: true });
      });
      
      const info = await consultarCnpj(cnpj);
      if (info) {
          useClientStore.getState().activeXmlFaturamento.forEach(x => {
            if (x.cnpj === cnpj) {
              let finalRegime = x.regime;
              if (info.regime !== "Não Optante") {
                 finalRegime = info.regime;
              } else if (info.regime === "Não Optante" && x.regime === "Simples Nacional") {
                 finalRegime = "Lucro Presumido"; // Descobriu que NÃO é simples, fallback
              }
              
              updateXmlSalesStatus(x.id, { regime: finalRegime as any, isConsultingCnpj: false });
              addCnpjToCache(cnpj, finalRegime);
            }
          });
      } else {
        useClientStore.getState().activeXmlFaturamento.forEach(x => {
          if (x.cnpj === cnpj) updateXmlSalesStatus(x.id, { isConsultingCnpj: false });
        });
      }
      
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const processFiles = async (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const newXmls: ParsedXmlSales[] = [...xmlFaturamento];
    const justAdded: ParsedXmlSales[] = [];
    const errors: string[] = [];

    const files = Array.from(fileList);

    const parseAndAddXml = async (text: string, filename: string) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const parseError = xmlDoc.getElementsByTagName("parsererror");
      
      // We assume text is already properly decoded here, or we'd handle fallback before this.
      // But for simplicity, we pass raw text. If there's parsererror, we can't easily fallback to utf8 here unless we pass the original file/blob.
      // JSZip handles decoding, so we will pass strings directly.
      
      const parsed = parseSalesXml(xmlDoc, filename, companyData.cnpj);
      parsed.isConsultingCnpj = false;

      const generateUniqueKey = (xml: ParsedXmlSales) => {
        if (xml.xmlType === 'NFe' && xml.chave) return xml.chave;
        const cleanCnpj = xml.cnpj ? xml.cnpj.replace(/\D/g, '') : '';
        return `${xml.numero}-${cleanCnpj}-${xml.data}`;
      };
      
      const currentKey = generateUniqueKey(parsed);
      if (newXmls.some(xml => generateUniqueKey(xml) === currentKey)) {
        return; // Pula silenciosamente a duplicada
      }
      
      if (cnpjCache[parsed.cnpj]) {
        parsed.regime = cnpjCache[parsed.cnpj];
      }

      newXmls.push(parsed);
      justAdded.push(parsed);
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
                // JSZip can return text directly
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
            reader.readAsText(file, 'ISO-8859-1'); // Default fallback
          });

          // Check if ISO-8859-1 parsing fails, fallback to UTF-8
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
    
    if (justAdded.length > 0) {
      checkCnpjs(justAdded);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [xmlFaturamento, companyData.cnpj, cnpjCache]);

  const removeXml = (id: string) => {
    setXmlFaturamento(xmlFaturamento.filter(x => x.id !== id));
  };

  const handleClearMonth = () => {
    if (window.confirm(`Tem certeza que deseja excluir todos os XMLs do mês de ${months[currentXmlMonth]}?`)) {
      setXmlFaturamento(xmlFaturamento.filter(x => x.monthIndex !== currentXmlMonth));
    }
  };

  const handleReconsultCnpjs = async () => {
    setIsReconsultando(true);
    await checkCnpjs(filteredXmls, true); // force reconsult bypassing cache
    setIsReconsultando(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredXmls = xmlFaturamento.filter(xml => {
    if (xml.monthIndex !== currentXmlMonth) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        (xml.numero || '').toLowerCase().includes(term) || 
        (xml.tomador || '').toLowerCase().includes(term) || 
        (xml.cnpj || '').includes(term)
      );
      if (!matchesSearch) return false;
    }

    if (filterRegime !== 'Todos os Regimes' && xml.regime !== filterRegime) return false;
    
    return true;
  }).sort((a, b) => parseDateForSort(a.data) - parseDateForSort(b.data));
  const totalValue = filteredXmls.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-700 whitespace-pre-wrap">{errorMsg}</div>
        </div>
      )}

      {/* Navegação de Meses do XML */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-100 rounded-lg border border-gray-200">
          {months.map((m, idx) => (
            <button
              key={m}
              onClick={() => setCurrentXmlMonth(idx)}
              className={`flex-1 min-w-[70px] py-2 px-1 text-[14px] font-bold rounded-md transition-colors ${
                currentXmlMonth === idx 
                  ? 'bg-[#005696] text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Dropzone */}
      <div 
        className={`mb-6 border-2 border-dashed rounded-xl p-10 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <UploadCloud className="w-12 h-12 text-[#005696] mx-auto mb-4" />
        <p className="text-gray-700 font-medium text-lg">Arraste os arquivos XML (NFe/NFSe) ou arquivos .ZIP aqui</p>
        <p className="text-gray-500 text-sm mt-1">
          A leitura detectará automaticamente o mês pela <strong className="font-semibold text-gray-700">Data de Saída</strong> ou <strong className="font-semibold text-gray-700">Data de Emissão</strong>.
        </p>
        <label className="mt-4 inline-block px-6 py-2 bg-[#005696] text-white font-bold rounded hover:bg-[#004a82] cursor-pointer transition-colors shadow-sm">
          Procurar Arquivos
          <input 
            type="file" 
            multiple 
            accept=".xml,.zip" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }} 
          />
        </label>
      </div>

      {/* Tabela de XMLs Importados */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-3 bg-[#f9fafb] border-b border-gray-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, cliente ou CNPJ..." 
              className="w-full text-[15px] border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#005696]"
            />
          </div>
          <select value={filterRegime} onChange={e=>setFilterRegime(e.target.value)} className="text-[15px] border border-gray-300 rounded px-2 py-1.5 outline-none text-gray-700 bg-white">
            <option value="Todos os Regimes">Todos os Regimes</option>
            <option value="Lucro Presumido">Lucro Presumido</option>
            <option value="Simples Nacional">Simples Nacional</option>
            <option value="Lucro Real">Lucro Real</option>
            <option value="Isento de IRPJ">Isento de IRPJ</option>
            <option value="Pessoa Física">Pessoa Física</option>
          </select>
          <button 
            onClick={() => { resetManualForm(); setShowManualModal(true); }}
            className="text-[15px] font-bold bg-white border border-[#005696] text-[#005696] hover:bg-blue-50 px-4 py-1.5 rounded transition-colors"
          >
            Lançar Nota Manual
          </button>
          <button 
            onClick={handleReconsultCnpjs}
            disabled={filteredXmls.length === 0 || isReconsultando}
            className={`flex items-center gap-2 text-white font-bold text-[15px] py-1.5 px-4 rounded transition-colors shadow-sm ${
              isReconsultando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004a82] hover:bg-[#003d6b]'
            }`}
          >
            {isReconsultando ? 'Consultando...' : 'Reconsultar CNPJs'}
          </button>
          <button 
            onClick={handleClearMonth}
            disabled={filteredXmls.length === 0}
            className="bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white font-bold text-[15px] py-1.5 px-4 rounded transition-colors shadow-sm"
          >
            Limpar Tudo
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] text-left">
            <thead className="bg-[#003B5C] text-white tracking-wide">
              <tr>
                <th className="px-4 py-3 font-bold">Nº Nota</th>
                <th className="px-4 py-3 font-bold">Data</th>
                <th className="px-4 py-3 font-bold w-[25%]">Cliente / CNPJ</th>
                <th className="px-4 py-3 font-bold">Regime Tributário</th>
                <th className="px-4 py-3 font-bold w-[25%]">Descrição / Atividade</th>
                <th className="px-4 py-3 font-bold text-right">Valor</th>
                <th className="px-4 py-3 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredXmls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">
                    Nenhum XML de venda importado ainda para este mês.
                  </td>
                </tr>
              ) : (
                filteredXmls.map((xml) => (
                  <tr key={xml.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{xml.numero}</td>
                    <td className="px-4 py-3 text-gray-600">{xml.data}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#003b6e] text-[15px] truncate max-w-[250px]" title={xml.tomador}>
                        {xml.tomador || 'Não Identificado'}
                      </div>
                      <div className="text-[14px] text-gray-500 font-medium">CNPJ: {xml.cnpj ? formatCpfCnpj(xml.cnpj) : 'Sem CNPJ'}</div>
                      {xml.cnpj && <div className="text-[13px] font-medium text-[#10b981] italic mt-0.5">{getNaturezaJuridica(xml.tomador, xml.cnpj)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {xml.isConsultingCnpj ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Consultando...
                        </span>
                      ) : (
                        <select 
                          value={xml.regime} 
                          onChange={(e) => updateXmlSalesStatus(xml.id, { regime: e.target.value })}
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
                    <td className="px-4 py-3">
                      <div className="text-[14px] text-gray-700 line-clamp-2" title={xml.descricao}>
                        {xml.descricao}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#005696] text-right">
                      {formatCurrency(xml.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditXml(xml)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => removeXml(xml.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remover"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-200 text-right">
          <span className="text-[15px] text-[#005696] font-bold">
            Total Acumulado (Filtrado): {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Cards de Totalização por Regime */}
      {filteredXmls.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lucro Presumido</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Lucro Presumido').reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lucro Real</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Lucro Real').reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-1">Simples Nacional</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Simples Nacional').reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-1">Isento / Pessoa Física</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Isento / Não Informado' || x.regime.includes('Física') || x.regime.includes('Isento')).reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançamento Manual */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[550px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 flex justify-between items-center bg-[#003b6e] text-white">
              <h3 className="font-bold text-[15px]">{editingXmlId ? 'Editar Lançamento' : 'Lançamento Manual de Receita'}</h3>
              <button onClick={resetManualForm} className="text-white/70 hover:text-white font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Número da Nota</label>
                  <input type="text" value={manualNumNota} onChange={e=>setManualNumNota(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696]" placeholder="Ex: 17" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Data</label>
                  <input type="text" value={manualData} onChange={e=>setManualData(formatDateProgressive(e.target.value))} placeholder="DD/MM/AAAA" className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696]" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1">CNPJ do Cliente (Opcional)</label>
                <input type="text" value={manualCnpj} onChange={e=>setManualCnpj(formatCnpjProgressive(e.target.value))} onBlur={(e) => { const clean = e.target.value.replace(/\D/g, ''); if (clean.length === 11) setManualRegime('Pessoa Física'); }} placeholder="00.000.000/0000-00" className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696]" />
                {isConsultingManual && <span className="text-xs text-blue-500 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Consultando CNPJ...</span>}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1">Nome do Cliente <span className="text-red-500">*</span></label>
                <input type="text" value={manualTomador} onChange={e=>setManualTomador(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Regime Tributário</label>
                  <select value={manualRegime} onChange={e=>setManualRegime(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696] bg-white">
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="Isento de IRPJ">Isento de IRPJ</option>
                    <option value="Pessoa Física">Pessoa Física</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1">Valor (R$) <span className="text-red-500">*</span></label>
                  <CurrencyInput
                    value={manualValor}
                    onValueChange={(val) => setManualValor(val || '')}
                    decimalsLimit={2} decimalSeparator="," groupSeparator="."
                    className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696]"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1">Descrição / Serviço <span className="text-red-500">*</span></label>
                <input type="text" value={manualDesc} onChange={e=>setManualDesc(e.target.value)} className="w-full text-[15px] border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#005696]" />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={resetManualForm} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-bold transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddManual} className="px-4 py-2 bg-[#005696] hover:bg-[#004a82] text-white rounded font-bold transition-colors shadow-sm">
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
