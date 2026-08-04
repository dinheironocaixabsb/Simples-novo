import React, { useCallback, useState } from 'react';
import { useDiagnosisStore } from '../../../store/useDiagnosisStore';
import { parseSalesXml } from '../../../services/xml/xml-parser';
import { consultarCnpj } from '../../../services/cnpj-service';
import { UploadCloud, FileType, Trash2, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { ParsedXmlSales } from '../../../domain/types/xml.types';

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function Step3SalesXml() {
  const { 
    companyData, xmlFaturamento, setXmlFaturamento, 
    currentXmlMonth, setCurrentXmlMonth, 
    cnpjCache, addCnpjToCache, updateXmlSalesStatus 
  } = useDiagnosisStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReconsultando, setIsReconsultando] = useState(false);

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

  const checkCnpjs = async (xmlsToCheck: ParsedXmlSales[]) => {
    const uniqueDocs = Array.from(new Set(xmlsToCheck.map(x => x.cnpj).filter(c => c && (c.replace(/\D/g, '').length === 14 || c.replace(/\D/g, '').length === 11))));
    
    for (const doc of uniqueDocs) {
      const isCpf = doc.replace(/\D/g, '').length === 11;

      if (isCpf) {
        useDiagnosisStore.getState().xmlFaturamento.forEach(x => {
          if (x.cnpj === doc) updateXmlSalesStatus(x.id, { isConsultingCnpj: true });
        });
        await new Promise(r => setTimeout(r, 600)); // fake delay for UI
        useDiagnosisStore.getState().xmlFaturamento.forEach(x => {
          if (x.cnpj === doc) updateXmlSalesStatus(x.id, { regime: "Pessoa Física", isConsultingCnpj: false });
        });
        continue;
      }
      
      const cnpj = doc;
      if (useDiagnosisStore.getState().cnpjCache[cnpj]) {
        const regime = useDiagnosisStore.getState().cnpjCache[cnpj];
        useDiagnosisStore.getState().xmlFaturamento.forEach(x => {
          if (x.cnpj === cnpj && x.regime !== regime) {
            updateXmlSalesStatus(x.id, { regime, isConsultingCnpj: false });
          }
        });
        continue;
      }
      
      // Marcar como consultando
      useDiagnosisStore.getState().xmlFaturamento.forEach(x => {
        if (x.cnpj === cnpj) updateXmlSalesStatus(x.id, { isConsultingCnpj: true });
      });
      
      const info = await consultarCnpj(cnpj);
      if (info) {
        addCnpjToCache(cnpj, info.regime);
        useDiagnosisStore.getState().xmlFaturamento.forEach(x => {
          if (x.cnpj === cnpj) updateXmlSalesStatus(x.id, { regime: info.regime, isConsultingCnpj: false });
        });
      } else {
        useDiagnosisStore.getState().xmlFaturamento.forEach(x => {
          if (x.cnpj === cnpj) updateXmlSalesStatus(x.id, { isConsultingCnpj: false });
        });
      }
      
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const processFiles = async (fileList: FileList | File[]) => {
    setErrorMsg(null);
    let newXmls: ParsedXmlSales[] = [...xmlFaturamento];
    let justAdded: ParsedXmlSales[] = [];
    let errors: string[] = [];

    const files = Array.from(fileList);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.xml')) {
        errors.push(`${file.name}: Não é um arquivo XML.`);
        continue;
      }

      try {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
          reader.readAsText(file, 'ISO-8859-1');
        });

        const parser = new DOMParser();
        let xmlDoc = parser.parseFromString(text, "text/xml");
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        
        if (parseError.length > 0) {
          const textUtf8 = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target?.result as string);
            r.readAsText(file, 'UTF-8');
          });
          xmlDoc = parser.parseFromString(textUtf8, "text/xml");
        }

        const parsed = parseSalesXml(xmlDoc, file.name, companyData.cnpj);
        parsed.isConsultingCnpj = false;

        const generateUniqueKey = (xml: ParsedXmlSales) => {
          if (xml.xmlType === 'NFe' && xml.chave) return xml.chave;
          const cleanCnpj = xml.cnpj ? xml.cnpj.replace(/\D/g, '') : '';
          return `${xml.numero}-${cleanCnpj}-${xml.data}`;
        };
        
        const currentKey = generateUniqueKey(parsed);
        if (newXmls.some(xml => generateUniqueKey(xml) === currentKey)) {
          continue; // Pula silenciosamente a duplicada
        }
        
        if (cnpjCache[parsed.cnpj]) {
          parsed.regime = cnpjCache[parsed.cnpj];
        }

        newXmls.push(parsed);
        justAdded.push(parsed);
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
    await checkCnpjs(filteredXmls);
    setIsReconsultando(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredXmls = xmlFaturamento.filter(xml => xml.monthIndex === currentXmlMonth);
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
              className={`flex-1 min-w-[70px] py-2 px-1 text-[12px] font-bold rounded-md transition-colors ${
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
        <p className="text-gray-700 font-medium text-lg">Arraste os arquivos XML (NFe/NFSe) aqui</p>
        <p className="text-gray-500 text-sm mt-1">
          A leitura detectará automaticamente o mês pela <strong className="font-semibold text-gray-700">Data de Saída</strong> ou <strong className="font-semibold text-gray-700">Data de Emissão</strong>.
        </p>
        <label className="mt-4 inline-block px-6 py-2 bg-[#005696] text-white font-bold rounded hover:bg-[#004a82] cursor-pointer transition-colors shadow-sm">
          Procurar Arquivos
          <input 
            type="file" 
            multiple 
            accept=".xml" 
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
        <div className="p-4 bg-[#f9fafb] border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Buscar por número, cliente ou CNPJ..." 
              className="w-full max-w-md border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#005696]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReconsultCnpjs}
              disabled={filteredXmls.length === 0 || isReconsultando}
              className={`flex items-center gap-2 text-white font-bold text-[13px] py-2 px-4 rounded transition-colors shadow-sm ${
                isReconsultando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#005696] hover:bg-[#004a82]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isReconsultando ? 'animate-spin' : ''}`} />
              {isReconsultando ? 'Consultando...' : 'Reconsultar CNPJs'}
            </button>
            <button 
              onClick={handleClearMonth}
              disabled={filteredXmls.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-[13px] py-2 px-4 rounded transition-colors shadow-sm"
            >
              Limpar Tudo
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
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
                      <div className="font-bold text-[#003b6e] text-[13px] truncate max-w-[250px]" title={xml.tomador}>
                        {xml.tomador || 'Não Identificado'}
                      </div>
                      <div className="text-[12px] text-gray-500 font-medium">CNPJ: {xml.cnpj ? formatCpfCnpj(xml.cnpj) : 'Sem CNPJ'}</div>
                      {xml.cnpj && <div className="text-[11px] font-medium text-[#10b981] italic mt-0.5">{getNaturezaJuridica(xml.tomador, xml.cnpj)}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {xml.isConsultingCnpj ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Consultando...
                        </span>
                      ) : (
                        <select 
                          value={xml.regime} 
                          onChange={(e) => updateXmlSalesStatus(xml.id, { regime: e.target.value })}
                          className="text-[12px] font-medium border border-gray-300 rounded px-1.5 py-1 outline-none text-[#003b6e] bg-white w-full max-w-[140px] shadow-sm"
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
                      <div className="text-[12px] text-gray-700 line-clamp-2" title={xml.descricao}>
                        {xml.descricao}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#005696] text-right">
                      {formatCurrency(xml.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => removeXml(xml.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lucro Presumido</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Lucro Presumido').reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lucro Real</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Lucro Real').reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Simples Nacional</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Simples Nacional').reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Isento / Pessoa Física</div>
            <div className="text-lg font-bold text-[#005696]">
              {formatCurrency(filteredXmls.filter(x => x.regime === 'Isento / Não Informado' || x.regime.includes('Física') || x.regime.includes('Isento')).reduce((acc, curr) => acc + curr.valor, 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
