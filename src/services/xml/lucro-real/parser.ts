import { XMLParser } from 'fast-xml-parser';
import { BLOQUEIOS_PIS_COFINS, BLOQUEIOS_IBS_CBS } from './dictionary';

export interface ProdutoNota {
  nItem: number;
  ncm: string;
  cfop: string;
  cstPisCofins: string;
  descricao: string;
  valor: number;
  geraCreditoPisCofins: boolean;
  geraCreditoIbsCbs: boolean;
  // SZ-4 Override Manual
  overridePisCofins?: boolean;
  overrideIbsCbs?: boolean;
}

export function parseXmlNFe(xmlString: string): ProdutoNota[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
  });

  const jsonObj = parser.parse(xmlString);
  const nfe = jsonObj.nfeProc?.NFe?.infNFe || jsonObj.NFe?.infNFe;

  if (!nfe || !nfe.det) {
    return []; // XML inválido ou sem itens
  }

  // fast-xml-parser retorna objeto se for apenas 1 item, ou array se > 1
  const itens = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
  const produtos: ProdutoNota[] = [];

  itens.forEach((item: any) => {
    const prod = item.prod;
    const pis = item.imposto?.PIS;
    
    // Extrair CST (tentar achar PISAliq, PISNT, etc)
    let cst = '99'; // Default
    if (pis) {
      const keys = Object.keys(pis);
      if (keys.length > 0 && pis[keys[0]].CST) {
        cst = String(pis[keys[0]].CST).padStart(2, '0');
      }
    }

    const ncm = String(prod.NCM || '');
    const cfop = String(prod.CFOP || '');
    const valor = Number(prod.vProd || 0);

    // SZ-2: Bloqueio PIS/COFINS
    const bloqueadoPisCofins = 
      BLOQUEIOS_PIS_COFINS.cstsBloqueados.includes(cst) ||
      BLOQUEIOS_PIS_COFINS.ncmsMonofasicos.includes(ncm);

    // SZ-3: Bloqueio IBS/CBS (Uso e Consumo)
    const bloqueadoIbsCbs = BLOQUEIOS_IBS_CBS.cfopsUsoPessoal.includes(cfop);

    produtos.push({
      nItem: Number(item['@_nItem'] || 0),
      ncm,
      cfop,
      cstPisCofins: cst,
      descricao: String(prod.xProd || ''),
      valor,
      geraCreditoPisCofins: !bloqueadoPisCofins,
      geraCreditoIbsCbs: !bloqueadoIbsCbs
    });
  });

  return produtos;
}
