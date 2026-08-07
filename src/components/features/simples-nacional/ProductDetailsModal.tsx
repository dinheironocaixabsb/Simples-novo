import React from 'react';
import { X, Search, Download } from 'lucide-react';
import { ProdutoDetalhado } from '../../../domain/types/xml.types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  produtos: ProdutoDetalhado[];
}

export function ProductDetailsModal({ isOpen, onClose, title, produtos }: ProductDetailsModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredProdutos = produtos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.nome || '').toLowerCase().includes(term) ||
      (p.ncm || '').includes(term) ||
      (p.cfop || '').includes(term) ||
      (p.numeroNota || '').includes(term) ||
      (p.cliente || '').toLowerCase().includes(term)
    );
  });

  const totalBruto = filteredProdutos.reduce((acc, p) => acc + (p.valorBruto || 0), 0);
  const totalPisCofins = filteredProdutos.reduce((acc, p) => acc + (p.pisCofins || 0), 0);
  const totalIcms = filteredProdutos.reduce((acc, p) => acc + (p.icms || 0), 0);
  const totalLiquido = filteredProdutos.reduce((acc, p) => acc + (p.valorLiquido || 0), 0);

  const handleExportCSV = () => {
    const headers = [
      'Nº Nota', 'Data', 'Cliente / Fornecedor', 'Produto', 'NCM', 'CFOP', 'CST PIS/COF', 
      'Valor Bruto', 'PIS/COFINS (Destacado)', 'ICMS Destacado', 'Valor Líquido (Base Crédito)'
    ];

    const rows = filteredProdutos.map(p => [
      p.numeroNota || '',
      p.dataEmissao || '',
      `"${p.cliente || 'Não Identificado'}"`,
      `"${(p.nome || '').replace(/"/g, '""')}"`,
      p.ncm || '',
      p.cfop || '',
      `${p.cstPis || ''}/${p.cstCofins || ''}`,
      (p.valorBruto || 0).toString().replace('.', ','),
      (p.pisCofins || 0).toString().replace('.', ','),
      (p.icms || 0).toString().replace('.', ','),
      (p.valorLiquido || 0).toString().replace('.', ',')
    ]);

    // Footer row with totals
    rows.push([
      '', '', '', '', '', '', 'TOTAIS:',
      totalBruto.toString().replace('.', ','),
      totalPisCofins.toString().replace('.', ','),
      totalIcms.toString().replace('.', ','),
      totalLiquido.toString().replace('.', ',')
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    
    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `detalhamento_creditos_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-[#005696]">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Detalhamento de produtos e cálculo de créditos IBS/CBS</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-white border border-gray-200 p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar produto, NCM, Nota ou Cliente..." 
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#005696] focus:ring-1 focus:ring-[#005696]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-600 font-medium bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            {filteredProdutos.length} {filteredProdutos.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 p-4 flex flex-col">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left whitespace-nowrap relative">
              <thead className="text-[11px] text-white uppercase bg-[#005696] sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3">Nº Nota</th>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3 min-w-[150px]">Cliente / Fornecedor</th>
                  <th className="px-3 py-3 min-w-[200px] max-w-[300px]">Produto</th>
                  <th className="px-3 py-3 text-center">NCM</th>
                  <th className="px-3 py-3 text-center">CFOP</th>
                  <th className="px-3 py-3 text-center">CST PIS/COF</th>
                  <th className="px-3 py-3 text-right">Valor Bruto</th>
                  <th className="px-3 py-3 text-right">PIS/COFINS (Destacado)</th>
                  <th className="px-3 py-3 text-right">ICMS Destacado</th>
                  <th className="px-3 py-3 text-right">Valor Líquido (Base Crédito)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProdutos.map((p, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-2 font-medium text-gray-700">{p.numeroNota}</td>
                    <td className="px-3 py-2 text-gray-600">{p.dataEmissao}</td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[150px]" title={p.cliente}>{p.cliente || 'Não Identificado'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[250px] font-medium text-gray-900" title={p.nome}>{p.nome}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{p.ncm}</td>
                    <td className="px-3 py-2 text-center font-medium text-gray-700">{p.cfop}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{p.cstPis === p.cstCofins ? p.cstPis : `${p.cstPis}/${p.cstCofins}`}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(p.valorBruto)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(p.pisCofins)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(p.icms)}</td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-600">{formatCurrency(p.valorLiquido)}</td>
                  </tr>
                ))}
                {filteredProdutos.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white p-4 flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold">Total Bruto</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(totalBruto)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold">Total PIS/COFINS Deduzido</span>
              <span className="text-lg font-bold text-gray-600">{formatCurrency(totalPisCofins)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold">Total ICMS Deduzido</span>
              <span className="text-lg font-bold text-gray-600">{formatCurrency(totalIcms)}</span>
            </div>
            <div className="flex flex-col border-l pl-4 border-gray-200">
              <span className="text-xs text-emerald-600 uppercase font-bold">Base Líquida de IBS/CBS</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalLiquido)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel (CSV)
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-[#005696] text-white font-bold rounded-lg shadow-sm hover:bg-[#004a82] transition-colors"
            >
              Fechar Janela
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
