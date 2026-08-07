import * as xlsx from 'xlsx';
import { ProdutoNota } from './parser';

export function exportarLaudoAuditoria(produtos: ProdutoNota[], nomeArquivo = 'Auditoria_XML.xlsx') {
  const dadosFormatados = produtos.map(p => ({
    'Item': p.nItem,
    'Descrição': p.descricao,
    'NCM': p.ncm,
    'CFOP': p.cfop,
    'CST PIS/COFINS': p.cstPisCofins,
    'Valor (R$)': p.valor,
    'Crédito PIS/COFINS (Inteligência)': p.geraCreditoPisCofins ? 'SIM' : 'BLOQUEADO',
    'Crédito IBS/CBS (Inteligência)': p.geraCreditoIbsCbs ? 'SIM' : 'BLOQUEADO',
    'Ajuste Manual PIS/COFINS': p.overridePisCofins !== undefined ? (p.overridePisCofins ? 'SIM' : 'NÃO') : '-',
    'Ajuste Manual IBS/CBS': p.overrideIbsCbs !== undefined ? (p.overrideIbsCbs ? 'SIM' : 'NÃO') : '-'
  }));

  const worksheet = xlsx.utils.json_to_sheet(dadosFormatados);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Auditoria XML');

  // Funciona no Node (para testes) e gera download automático no Browser
  xlsx.writeFile(workbook, nomeArquivo);
}
