import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractTextFromPDF(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

function parseBrFloat(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function processWithRegex(text) {
  const extracted = { anexos: {} };

  function extractTotal(regexBusca, texto) {
    const match = texto.match(regexBusca);
    if (match && match[1]) {
      const numbers = match[1].match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b|\b\d+,\d{2}\b/g);
      if (numbers && numbers.length > 0) {
        return numbers.slice(0, 3).pop();
      }
    }
    return null;
  }

  const regexPA = /(?:Per[^\s]*odo(?: de Apura[^\s]*o)?(?:\s*\(PA\))?|Per[^\s]*odo:?)[\s\S]{0,80}?([\d]{2}\/[\d]{4})/i;
  const matchPA = text.match(regexPA);
  if (matchPA && matchPA[1]) extracted.competencia = matchPA[1];

  const regexRBT12 = /acumulada nos (?:12|doze) meses[\s\S]{0,50}?RBT12\)?([\s\S]{0,80})/i;
  const valRBT12 = extractTotal(regexRBT12, text) || extractTotal(/RBT12[\s\S]{0,50}?([\s\S]{0,80})/i, text);
  if (valRBT12) extracted.rbt12 = parseBrFloat(valRBT12);

  const regexRBACorrenteDominio = /ano-calend[^\s]*rio\s+([\d.,]+(?:,\d{2}|\.\d{2}))\s+corrente/i;
  let matchRBA = text.match(regexRBACorrenteDominio);
  if (matchRBA) {
    extracted.rba = parseBrFloat(matchRBA[1]);
  } else {
    const regexRBACorrenteRFB = /ano-calend[^\s]*rio(?!\s+anterior)[\s\S]{0,50}?RBA\)?([\s\S]{0,80})/i;
    const valRBA = extractTotal(regexRBACorrenteRFB, text) || extractTotal(/\bRBA\b[\s\S]{0,50}?([\s\S]{0,80})/i, text);
    if (valRBA) extracted.rba = parseBrFloat(valRBA);
  }

  const regexRBAAnteriorDominio = /ano-calend[^\s]*rio\s+([\d.,]+(?:,\d{2}|\.\d{2}))\s+anterior/i;
  let matchRBAA = text.match(regexRBAAnteriorDominio);
  if (matchRBAA) {
    extracted.rbaa = parseBrFloat(matchRBAA[1]);
  } else {
    const regexRBAAnteriorRFB = /ano-calend[^\s]*rio anterior[\s\S]{0,50}?RBAA\)?([\s\S]{0,80})/i;
    const valRBAA = extractTotal(regexRBAAnteriorRFB, text) || extractTotal(/\bRBAA\b[\s\S]{0,50}?([\s\S]{0,80})/i, text);
    if (valRBAA) extracted.rbaa = parseBrFloat(valRBAA);
  }

  let textoParaBusca = text;
  if (matchPA && typeof matchPA.index !== 'undefined') {
    textoParaBusca = text.substring(matchPA.index);
  }

  const temAnexoExplicito = /Anexo[\s\:\-]*([1-5]|I{1,3}|IV|V)\b/i.test(textoParaBusca);
  let regexAnexoSplit = temAnexoExplicito 
    ? /(?:Anexo)[\s\:\-]*([1-5]|I{1,3}|IV|V)\b/ig 
    : /(?:Anexo)[\s\:\-]*([1-5]|I{1,3}|IV|V)\b|(Com[ée]rcio|Revenda|Venda de mercadoria)|(Ind[úu]stria|Industrializada)|(Presta[çc][ãa]o de Servi[çc]o)/ig;

  let anexoMatches = [...textoParaBusca.matchAll(regexAnexoSplit)];
  let anexosEncontrados = {};

  if (anexoMatches.length > 0) {
    for (let i = 0; i < anexoMatches.length; i++) {
      const matchInfo = anexoMatches[i];
      let str = "";
      if (matchInfo[1]) str = matchInfo[1].toUpperCase();
      else if (matchInfo[2]) str = "1";
      else if (matchInfo[3]) str = "2";
      else if (matchInfo[4]) str = "3";
      
      let val = "";
      if (str === "I" || str === "1") val = "1";
      else if (str === "II" || str === "2") val = "2";
      else if (str === "III" || str === "3") val = "3";
      else if (str === "IV" || str === "4") val = "4";
      else if (str === "V" || str === "5") val = "5";
      
      if (val && matchInfo.index !== undefined) {
        const startIdx = matchInfo.index + matchInfo[0].length;
        let blocoTexto = textoParaBusca.substring(startIdx, startIdx + 800);
        
        let matchReceita = blocoTexto.match(/(?:Receita Tributada Total|Total|Receita Bruta)[\s\S]{0,60}?([\d\.]+,\d{2})/i);
        if (!matchReceita) matchReceita = blocoTexto.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/);
        
        if (matchReceita && matchReceita[0]) {
          const numMatch = matchReceita[0].match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/);
          if (numMatch) {
            let interno = numMatch[0];
            let externo = "0,00";
            let matchExt = blocoTexto.match(/(?:Mercado Externo|Exporta[çc][ãa]o)[\s\S]{0,40}?(\b\d{1,3}(?:\.\d{3})*,\d{2}\b)/i);
            if (matchExt) externo = matchExt[1];
            
            let comSt = "0,00";
            let hasSt = false;
            if (val === "1" || val === "2") {
              const stMatch = blocoTexto.match(/(?:com\s+substitui[çc][ãa]o tribut[áa]ria|com\s+ST|icms[\s\-]*st|retido por st)[\s\S]{0,80}?(\b\d{1,3}(?:\.\d{3})*,\d{2}\b)/i);
              if (stMatch) {
                hasSt = true;
                comSt = stMatch[1];
              }
            }
            if (!anexosEncontrados[val]) anexosEncontrados[val] = { interno: 0, externo: 0, comSt: 0, hasSt };
            anexosEncontrados[val].interno += parseBrFloat(interno);
            anexosEncontrados[val].externo += parseBrFloat(externo);
            if (hasSt) {
              anexosEncontrados[val].hasSt = true;
              anexosEncontrados[val].comSt += parseBrFloat(comSt);
            }
          }
        }
      }
    }
  }
  
  if (Object.keys(anexosEncontrados).length === 0) {
    const regexReceitaPA = /(?:Receita Bruta do per[^\s]*odo de Apura[^\s]*o|Receita Bruta do PA|Receita no mercado interno)[\s\S]{0,50}?([\s\S]{0,80})/i;
    const matchReceitaPA = textoParaBusca.match(regexReceitaPA);
    if (matchReceitaPA && matchReceitaPA[1]) {
      const numbers = matchReceitaPA[1].match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b|\b\d+,\d{2}\b/g);
      if (numbers && numbers.length > 0) {
        let interno = parseBrFloat(numbers[0]);
        anexosEncontrados["1"] = { interno: interno, externo: 0, comSt: 0, hasSt: false };
      }
    }
  }

  extracted.anexos = anexosEncontrados;
  return extracted;
}

async function main() {
  const text = await extractTextFromPDF('D:\\simples-novo\\EXTRATO DO SIMPLES NACIONAL Exemplo.pdf');
  const blocks = text.split(/(?=Per[^\s]*odo(?: de Apura[^\s]*o)?(?:\s*\(PA\))?|Per[^\s]*odo:?)/i);
  const results = [];
  
  for (const block of blocks) {
    if (block.trim().length > 50) {
      const extracted = processWithRegex(block);
      if (extracted.competencia) {
        if (!results.find(r => r.competencia === extracted.competencia)) {
          results.push(extracted);
        }
      }
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
