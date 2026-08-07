import { ParsedXmlSales, ParsedXmlExpense, ProdutoDetalhado, Deducoes } from '../../domain/types/xml.types';

// Helpers
function getXmlNodeCaseInsensitive(parentNode: Document | Element, tagName: string): Element | null {
    if (!parentNode || !parentNode.getElementsByTagName) return null;
    const all = parentNode.getElementsByTagName("*");
    const lowerTag = tagName.toLowerCase();
    for (let i = 0; i < all.length; i++) {
        const localName = all[i].localName || all[i].tagName.split(':').pop();
        if (localName && localName.toLowerCase() === lowerTag) {
            return all[i];
        }
    }
    return null;
}

function getXmlNodesCaseInsensitive(parentNode: Document | Element, tagName: string): Element[] {
    const matches: Element[] = [];
    if (!parentNode || !parentNode.getElementsByTagName) return matches;
    const all = parentNode.getElementsByTagName("*");
    const lowerTag = tagName.toLowerCase();
    for (let i = 0; i < all.length; i++) {
        const localName = all[i].localName || all[i].tagName.split(':').pop();
        if (localName && localName.toLowerCase() === lowerTag) {
            matches.push(all[i]);
        }
    }
    return matches;
}

function getXmlTextCaseInsensitive(parentNode: Document | Element, tagName: string): string {
    const node = getXmlNodeCaseInsensitive(parentNode, tagName);
    return node ? (node.textContent || "").trim() : "";
}

function cleanCnpj(val: string | undefined): string {
    if (!val) return "";
    return String(val).replace(/\D/g, "");
}

function isXmlCanceled(xmlDoc: Document): boolean {
    const statusNfse = getXmlTextCaseInsensitive(xmlDoc, "StatusNfse") || getXmlTextCaseInsensitive(xmlDoc, "Status") || getXmlTextCaseInsensitive(xmlDoc, "Situacao") || getXmlTextCaseInsensitive(xmlDoc, "SituacaoNfse");
    if (statusNfse === "2" || (statusNfse || "").toUpperCase() === "C" || (statusNfse || "").toUpperCase() === "CANCELADA") return true;
    if (getXmlNodeCaseInsensitive(xmlDoc, "Cancelamento") || getXmlNodeCaseInsensitive(xmlDoc, "NfseCancelamento") || getXmlNodeCaseInsensitive(xmlDoc, "PedidoCancelamento") || getXmlNodeCaseInsensitive(xmlDoc, "ConfirmacaoCancelamento")) return true;
    
    const cStatNodes = getXmlNodesCaseInsensitive(xmlDoc, "cStat");
    for (let i = 0; i < cStatNodes.length; i++) {
        const val = (cStatNodes[i].textContent || "").trim();
        if (val === "101" || val === "135" || val === "151" || val === "155") return true;
    }
    const xMotivoNodes = getXmlNodesCaseInsensitive(xmlDoc, "xMotivo");
    for (let i = 0; i < xMotivoNodes.length; i++) {
        const val = (xMotivoNodes[i].textContent || "").toUpperCase();
        if (val.includes("CANCELAD") || val.includes("DENEGAD") || val.includes("INUTILIZAD")) return true;
    }
    return false;
}

function formatDate(val: string): string {
    if (!val) return "";
    if (val.includes('T')) val = val.split('T')[0];
    const parts = val.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
}

function getMonthIndex(formattedDate: string): number {
    if (!formattedDate) return 0;
    const parts = formattedDate.split('/');
    if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
    }
    return 0;
}

export function parseSalesXml(xmlDoc: Document, fileName: string, clientCnpjInput: string): ParsedXmlSales {
    const clientCnpj = cleanCnpj(clientCnpjInput);

    // NF-e
    const nfeNode = getXmlNodeCaseInsensitive(xmlDoc, "infNFe") || getXmlNodeCaseInsensitive(xmlDoc, "infNfe");
    if (nfeNode) {
        const chaveRaw = nfeNode.getAttribute("Id") || "";
        const chave = chaveRaw.replace(/[^0-9A-Za-z]/g, '');
        
        const ideNode = getXmlNodeCaseInsensitive(nfeNode, "ide");
        if (!ideNode) throw new Error("Tag <ide> não encontrada (NF-e inválida).");
        
        const emitNode = getXmlNodeCaseInsensitive(nfeNode, "emit");
        if (!emitNode) throw new Error("Tag <emit> não encontrada (NF-e inválida).");

        const destNode = getXmlNodeCaseInsensitive(nfeNode, "dest");
        const totalNode = getXmlNodeCaseInsensitive(nfeNode, "total");

        if (clientCnpj) {
            const emitCnpj = cleanCnpj(getXmlTextCaseInsensitive(emitNode, "CNPJ") || getXmlTextCaseInsensitive(emitNode, "CPF") || "");
            const destCnpj = cleanCnpj(destNode ? (getXmlTextCaseInsensitive(destNode, "CNPJ") || getXmlTextCaseInsensitive(destNode, "CPF") || "") : "");

            if (destCnpj === clientCnpj) {
                throw new Error("O cliente ativo é o destinatário desta nota fiscal, indicando uma operação de entrada (compra/despesa).");
            }
            if (emitCnpj && emitCnpj !== clientCnpj) {
                throw new Error(`Esta nota fiscal pertence a outro CNPJ (${emitCnpj}) e não corresponde ao CNPJ do cliente ativo (${clientCnpj}) para vendas.`);
            }
        } else {
            const tpNF = getXmlTextCaseInsensitive(ideNode, "tpNF");
            if (tpNF === "0") {
                throw new Error("Esta nota fiscal é de entrada (compra/devolução) e não pode ser importada na aba de vendas.");
            }
        }
        
        const numero = getXmlTextCaseInsensitive(ideNode, "nNF");
        const dataEmiRaw = getXmlTextCaseInsensitive(ideNode, "dhEmi") || getXmlTextCaseInsensitive(ideNode, "dEmi");
        const dataSaiRaw = getXmlTextCaseInsensitive(ideNode, "dhSaiEnt") || getXmlTextCaseInsensitive(ideNode, "dSaiEnt");
        const dataFinalRaw = dataSaiRaw || dataEmiRaw;
        const dataEmi = dataFinalRaw ? formatDate(dataFinalRaw.substring(0, 10)) : "";
        const monthIndex = getMonthIndex(dataEmi);
        const tomador = destNode ? getXmlTextCaseInsensitive(destNode, "xNome") : "";
        const cnpj = destNode ? (getXmlTextCaseInsensitive(destNode, "CNPJ") || getXmlTextCaseInsensitive(destNode, "CPF") || "") : "";
        
        let valor = 0;
        if (totalNode) {
            const vNF = getXmlTextCaseInsensitive(totalNode, "vNF");
            let cleanValStr = (vNF || "").replace(/\s/g, '');
            if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
                cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
            } else if (cleanValStr.includes(',')) {
                cleanValStr = cleanValStr.replace(',', '.');
            }
            valor = parseFloat(cleanValStr) || 0;
        }
        
        const detList = getXmlNodesCaseInsensitive(nfeNode, "det");
        const items = [];
        const produtosDetalhados: ProdutoDetalhado[] = [];
        
        for (let i = 0; i < detList.length; i++) {
            const prodNode = getXmlNodeCaseInsensitive(detList[i], "prod");
            if (!prodNode) continue;
            
            const prodName = getXmlTextCaseInsensitive(prodNode, "xProd");
            if (prodName) items.push(prodName);
            
            const cfop = getXmlTextCaseInsensitive(prodNode, "CFOP");
            const ncm = getXmlTextCaseInsensitive(prodNode, "NCM");
            
            const vProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vProd") || "0").replace(',', '.')) || 0;
            const vDescProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vDesc") || "0").replace(',', '.')) || 0;
            const vFreteProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vFrete") || "0").replace(',', '.')) || 0;
            const vOutroProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vOutro") || "0").replace(',', '.')) || 0;
            const vSegProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vSeg") || "0").replace(',', '.')) || 0;
            
            let vItemBruto = vProd + vFreteProd + vSegProd + vOutroProd;
            
            let vICMSProd = 0;
            let vPISProd = 0;
            let vCOFINSProd = 0;
            let vSTProd = 0;
            let vIPIProd = 0;
            let cstPis = "";
            let cstCofins = "";
            
            const impostoNode = getXmlNodeCaseInsensitive(detList[i], "imposto");
            if (impostoNode) {
                const icmsNode = getXmlNodeCaseInsensitive(impostoNode, "ICMS");
                if (icmsNode) {
                    vICMSProd = parseFloat((getXmlTextCaseInsensitive(icmsNode, "vICMS") || "0").replace(',', '.')) || 0;
                    vSTProd = parseFloat((getXmlTextCaseInsensitive(icmsNode, "vICMSST") || getXmlTextCaseInsensitive(icmsNode, "vST") || "0").replace(',', '.')) || 0;
                }
                
                const pisNode = getXmlNodeCaseInsensitive(impostoNode, "PIS");
                if (pisNode) {
                    vPISProd = parseFloat((getXmlTextCaseInsensitive(pisNode, "vPIS") || "0").replace(',', '.')) || 0;
                    cstPis = getXmlTextCaseInsensitive(pisNode, "CST");
                }
                
                const cofinsNode = getXmlNodeCaseInsensitive(impostoNode, "COFINS");
                if (cofinsNode) {
                    vCOFINSProd = parseFloat((getXmlTextCaseInsensitive(cofinsNode, "vCOFINS") || "0").replace(',', '.')) || 0;
                    cstCofins = getXmlTextCaseInsensitive(cofinsNode, "CST");
                }
                
                const ipiNode = getXmlNodeCaseInsensitive(impostoNode, "IPI");
                if (ipiNode) vIPIProd = parseFloat((getXmlTextCaseInsensitive(ipiNode, "vIPI") || "0").replace(',', '.')) || 0;
            }
            
            vItemBruto = vProd + vFreteProd + vSegProd + vOutroProd + vSTProd + vIPIProd;
            
            const isRevenda = (cfop === "1102" || cfop === "2102" || cfop === "1403" || cfop === "2403" || cfop === "1113" || cfop === "2113" || cfop === "5102" || cfop === "6102" || cfop === "5405" || cfop === "6405");
            const isFreteComp = (cfop === "1353" || cfop === "2353" || cfop === "1932" || cfop === "2932" || (prodName.toUpperCase().includes('FRETE') && !isRevenda));
            const isAlimento = /arroz|feij[aã]o|carne|frango|peixe|leite|queijo|manteiga|p[aã]o|macarr[aã]o|farinha|a[çc][úu]car|caf[ée]|[óo]leo|biscoito|bolacha|fruta|verdura|legume|hortali[çc]a|ovo/i.test(prodName) || /020|030|040|070|080|090|100|110|160|190|200/.test(ncm.substring(0,3));
            const isHigiene = /sabonete|shampoo|creme dental|pasta de dente|papel higi[êe]nico|fio dental|desodorante|absorvente|cotonete|escova de dente|condicionador/i.test(prodName) || /330|340|4818/.test(ncm.substring(0,4));
            
            const cstIcms = getXmlTextCaseInsensitive(prodNode, "CST") || getXmlTextCaseInsensitive(prodNode, "CSOSN");
            const isZeroOuMonofasico = (cstIcms === '04' || cstIcms === '06' || cstIcms === '40' || cstIcms === '41' || cstIcms === '60');
            const isHortifruti = /fruta|verdura|legume|hortali[çc]a|ovo|maca|banana|laranja|alho|cebola|tomate/i.test(prodName);
            
            const isAnexo15 = isHortifruti;
            const isAnexo1 = isZeroOuMonofasico && isAlimento && !isAnexo15;
            
            // Devolutions
            const isDevolucao = /^(1201|1202|2201|2202|3201|3202|5201|5202|6201|6202|7201|7202|1410|1411|2410|2411|5410|5411|6410|6411)$/.test(cfop);

            produtosDetalhados.push({
                nome: prodName,
                valorBruto: vItemBruto,
                desconto: vDescProd,
                icms: vICMSProd,
                pisCofins: vPISProd + vCOFINSProd,
                valorLiquido: vItemBruto - vICMSProd - (vPISProd + vCOFINSProd) - vDescProd,
                cfop: cfop,
                ncm: ncm,
                isAlimento60: isAlimento && !isAnexo1 && !isAnexo15,
                isHigiene60: isHigiene,
                isAnexo1: isAnexo1,
                isAnexo15: isAnexo15,
                isRevenda: isRevenda,
                isFrete: isFreteComp,
                isDevolucao,
                cstPis,
                cstCofins,
                numeroNota: numero,
                dataEmissao: dataEmi,
                cliente: tomador
            });
        }
        const desc = items.join(", ").substring(0, 147) + (items.join(", ").length > 150 ? "..." : "");
        
        if (isXmlCanceled(xmlDoc)) {
            throw new Error("Nota fiscal cancelada.");
        }
        
        const tomadorUpper = (tomador || '').toUpperCase();
        const isCondo = tomadorUpper.includes('CONDOMIN') && 
                         !tomadorUpper.includes('LTDA') && 
                         !tomadorUpper.includes('LIMITADA') && 
                         !tomadorUpper.includes('S/A') && 
                         !tomadorUpper.includes('S.A.') && 
                         !tomadorUpper.includes('ADMINIST') && 
                         !tomadorUpper.includes('GESTAO') && 
                         !tomadorUpper.includes('SERVICO') && 
                         !tomadorUpper.includes('SERVICE') && 
                         !tomadorUpper.includes('ASSESSOR');
        const isAssoc = (tomadorUpper.includes('ASSOCIA') && !tomadorUpper.includes('ASSOCIAD')) || tomadorUpper.includes('FUNDAC') || tomadorUpper.includes('INSTITUTO') || tomadorUpper.includes('SINDICATO') || tomadorUpper.includes('IGREJA') || tomadorUpper.includes('TEMPLO') || tomadorUpper.includes('MITRA') || tomadorUpper.includes('PAROQUIA') || isCondo;
        
        let finalRegime = isAssoc ? "Isento de IRPJ" : "Lucro Presumido";
        if (cnpj && cnpj.replace(/\D/g, '').length === 11) finalRegime = "Pessoa Física";

        const deducoes = { icms: 0, pisCofins: 0, desconto: 0, iss: 0 };
        if (totalNode) {
            const vICMS = parseFloat((getXmlTextCaseInsensitive(totalNode, "vICMS") || "0").replace(',', '.')) || 0;
            const vPIS = parseFloat((getXmlTextCaseInsensitive(totalNode, "vPIS") || "0").replace(',', '.')) || 0;
            const vCOFINS = parseFloat((getXmlTextCaseInsensitive(totalNode, "vCOFINS") || "0").replace(',', '.')) || 0;
            const vDesc = parseFloat((getXmlTextCaseInsensitive(totalNode, "vDesc") || "0").replace(',', '.')) || 0;
            deducoes.icms = vICMS;
            deducoes.pisCofins = vPIS + vCOFINS;
            deducoes.desconto = vDesc;
        }

        return {
            id: 'xml-s-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            chave,
            numero,
            data: dataEmi,
            monthIndex,
            tomador,
            cnpj,
            regime: finalRegime,
            descricao: desc || "Venda de mercadoria",
            valor,
            fileName,
            xmlType: 'NFe',
            produtosDetalhados,
            deducoes
        };
    }
    
    // NFS-e (Services)
    const chave = getXmlTextCaseInsensitive(xmlDoc, "CodigoVerificacao") || "";
    
    const numero = getXmlTextCaseInsensitive(xmlDoc, "Numero") || 
                   getXmlTextCaseInsensitive(xmlDoc, "NumeroNfe") || 
                   getXmlTextCaseInsensitive(xmlDoc, "nNFSe") ||
                   getXmlTextCaseInsensitive(xmlDoc, "nDPS") ||
                   getXmlTextCaseInsensitive(xmlDoc, "nNF") ||
                   "";
    const dataEmiRaw = getXmlTextCaseInsensitive(xmlDoc, "DataEmissao") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dtEmi") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dhProc") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dhEmi") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dCompet") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dEmi") ||
                      getXmlTextCaseInsensitive(xmlDoc, "Competencia") ||
                      getXmlTextCaseInsensitive(xmlDoc, "competencia") ||
                      "";
    const dataSaiRaw = getXmlTextCaseInsensitive(xmlDoc, "DataSaida") || 
                       getXmlTextCaseInsensitive(xmlDoc, "dtSai") || 
                       getXmlTextCaseInsensitive(xmlDoc, "dhSaiEnt") || 
                       "";
    const dataFinalRaw = dataSaiRaw || dataEmiRaw;
    const dataEmi = dataFinalRaw ? formatDate(dataFinalRaw.substring(0, 10)) : "";
    const monthIndex = getMonthIndex(dataEmi);
    
    const prestadorNode = getXmlNodeCaseInsensitive(xmlDoc, "PrestadorServico") || getXmlNodeCaseInsensitive(xmlDoc, "Prestador") || getXmlNodeCaseInsensitive(xmlDoc, "emit") || getXmlNodeCaseInsensitive(xmlDoc, "Emitente") || getXmlNodeCaseInsensitive(xmlDoc, "prest") || getXmlNodeCaseInsensitive(xmlDoc, "DadosPrestador") || getXmlNodeCaseInsensitive(xmlDoc, "PrestadorSvc");
    const tomadorNode = getXmlNodeCaseInsensitive(xmlDoc, "TomadorServico") || getXmlNodeCaseInsensitive(xmlDoc, "Tomador") || getXmlNodeCaseInsensitive(xmlDoc, "dest") || getXmlNodeCaseInsensitive(xmlDoc, "Destinatario") || getXmlNodeCaseInsensitive(xmlDoc, "toma") || getXmlNodeCaseInsensitive(xmlDoc, "DadosTomador") || getXmlNodeCaseInsensitive(xmlDoc, "TomadorSvc");

    let tomadorCnpjExtracted = getXmlTextCaseInsensitive(tomadorNode as Element, "CNPJ") || getXmlTextCaseInsensitive(tomadorNode as Element, "Cnpj") || getXmlTextCaseInsensitive(tomadorNode as Element, "cnpj") || getXmlTextCaseInsensitive(tomadorNode as Element, "CPF") || getXmlTextCaseInsensitive(tomadorNode as Element, "Cpf") || getXmlTextCaseInsensitive(tomadorNode as Element, "cpf") || getXmlTextCaseInsensitive(tomadorNode as Element, "CpfCnpj") || "";
    if (!tomadorCnpjExtracted) tomadorCnpjExtracted = getXmlTextCaseInsensitive(xmlDoc, "CpfCnpjTomador") || getXmlTextCaseInsensitive(xmlDoc, "CnpjTomador") || getXmlTextCaseInsensitive(xmlDoc, "CpfTomador") || "";

    // Aggressive fallback for tomador (Sales context)
    if (!tomadorCnpjExtracted && clientCnpj) {
        const allDocNodes = [...getXmlNodesCaseInsensitive(xmlDoc, "CNPJ"), ...getXmlNodesCaseInsensitive(xmlDoc, "CPF"), ...getXmlNodesCaseInsensitive(xmlDoc, "CpfCnpj"), ...getXmlNodesCaseInsensitive(xmlDoc, "Cnpj"), ...getXmlNodesCaseInsensitive(xmlDoc, "Cpf")];
        for (const node of allDocNodes) {
            const val = cleanCnpj(node.textContent);
            if (val && val.length >= 11 && val !== clientCnpj) {
                tomadorCnpjExtracted = val;
                break;
            }
        }
    }

    let prestadorCnpjExtracted = getXmlTextCaseInsensitive(prestadorNode as Element, "CNPJ") || getXmlTextCaseInsensitive(prestadorNode as Element, "Cnpj") || getXmlTextCaseInsensitive(prestadorNode as Element, "cnpj") || getXmlTextCaseInsensitive(prestadorNode as Element, "CPF") || getXmlTextCaseInsensitive(prestadorNode as Element, "Cpf") || getXmlTextCaseInsensitive(prestadorNode as Element, "cpf") || getXmlTextCaseInsensitive(prestadorNode as Element, "CpfCnpj") || "";
    if (!prestadorCnpjExtracted) prestadorCnpjExtracted = getXmlTextCaseInsensitive(xmlDoc, "CpfCnpjPrestador") || getXmlTextCaseInsensitive(xmlDoc, "CnpjPrestador") || getXmlTextCaseInsensitive(xmlDoc, "CpfPrestador") || "";

    if (clientCnpj) {
        const prestadorCnpj = cleanCnpj(prestadorCnpjExtracted);
        const tomadorCnpj = cleanCnpj(tomadorCnpjExtracted);

        if (tomadorCnpj === clientCnpj) {
            throw new Error("Esta NFS-e é de serviço tomado (despesa) e não pode ser importada na aba de vendas.");
        }
        if (prestadorCnpj && prestadorCnpj !== clientCnpj) {
            throw new Error(`Esta NFS-e pertence a outro CNPJ (${prestadorCnpj}) e não corresponde ao CNPJ do cliente ativo (${clientCnpj}) para vendas.`);
        }
    }

    let tomador = getXmlTextCaseInsensitive(tomadorNode as Element, "RazaoSocial") || getXmlTextCaseInsensitive(tomadorNode as Element, "xNome") || getXmlTextCaseInsensitive(tomadorNode as Element, "Nome") || getXmlTextCaseInsensitive(tomadorNode as Element, "NomeFantasia") || "";
    if (!tomador) tomador = getXmlTextCaseInsensitive(xmlDoc, "RazaoSocialTomador") || getXmlTextCaseInsensitive(xmlDoc, "NomeTomador") || getXmlTextCaseInsensitive(xmlDoc, "xNome") || "Cliente Não Identificado";

    const cnpj = tomadorCnpjExtracted;
    
    let valor = 0;
    const valServStr = 
        getXmlTextCaseInsensitive(xmlDoc, "vServ") ||
        getXmlTextCaseInsensitive(xmlDoc, "ValorServicos") || 
        getXmlTextCaseInsensitive(xmlDoc, "ValorServico") || 
        getXmlTextCaseInsensitive(xmlDoc, "vBC") ||
        getXmlTextCaseInsensitive(xmlDoc, "vLiq") ||
        "0";
    let cleanValStr = valServStr.replace(/\s/g, '');
    if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
        cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanValStr.includes(',')) {
        cleanValStr = cleanValStr.replace(',', '.');
    }
    valor = parseFloat(cleanValStr) || 0;
    
    const desc = getXmlTextCaseInsensitive(xmlDoc, "Discriminacao") || 
                 getXmlTextCaseInsensitive(xmlDoc, "xServ") || 
                 getXmlTextCaseInsensitive(xmlDoc, "ItemListaServico") ||
                 getXmlTextCaseInsensitive(xmlDoc, "Descricao") ||
                 "Prestação de Serviço";
    let descTrim = desc.replace(/\s+/g, ' ').trim();
    if (descTrim.length > 150) descTrim = descTrim.substring(0, 147) + "...";
    
    if (isXmlCanceled(xmlDoc)) {
        throw new Error("Nota fiscal cancelada.");
    }
    
    const tomadorUpper = (tomador || '').toUpperCase();
    const isCondo = tomadorUpper.includes('CONDOMIN') && 
                     !tomadorUpper.includes('LTDA') && 
                     !tomadorUpper.includes('LIMITADA') && 
                     !tomadorUpper.includes('S/A') && 
                     !tomadorUpper.includes('S.A.') && 
                     !tomadorUpper.includes('ADMINIST') && 
                     !tomadorUpper.includes('GESTAO') && 
                     !tomadorUpper.includes('SERVICO') && 
                     !tomadorUpper.includes('SERVICE') && 
                     !tomadorUpper.includes('ASSESSOR');
    const isAssoc = (tomadorUpper.includes('ASSOCIA') && !tomadorUpper.includes('ASSOCIAD')) || tomadorUpper.includes('FUNDAC') || tomadorUpper.includes('INSTITUTO') || tomadorUpper.includes('SINDICATO') || tomadorUpper.includes('IGREJA') || tomadorUpper.includes('TEMPLO') || tomadorUpper.includes('MITRA') || tomadorUpper.includes('PAROQUIA') || isCondo;

    let finalRegime = isAssoc ? "Isento de IRPJ" : "Lucro Presumido";
    if (cnpj && cnpj.replace(/\D/g, '').length === 11) finalRegime = "Pessoa Física";

    const vIss = parseFloat((getXmlTextCaseInsensitive(xmlDoc, "ValorIss") || getXmlTextCaseInsensitive(xmlDoc, "vISSRet") || getXmlTextCaseInsensitive(xmlDoc, "vISS") || "0").replace(',', '.')) || 0;
    const deducoes = { icms: 0, pisCofins: 0, desconto: 0, iss: vIss };

    return {
        id: 'xml-s-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        chave,
        numero,
        data: dataEmi,
        monthIndex,
        tomador,
        cnpj,
        regime: finalRegime,
        descricao: descTrim,
        valor,
        fileName,
        xmlType: 'NFSe',
        deducoes
    };
}

export function parseExpenseXml(xmlDoc: Document, fileName: string, clientCnpjInput: string): ParsedXmlExpense {
    const clientCnpj = cleanCnpj(clientCnpjInput);

    // Determine layout: NF-e, NFS-e, or CT-e
    const cteNode = getXmlNodeCaseInsensitive(xmlDoc, "infCte") || getXmlNodeCaseInsensitive(xmlDoc, "infCTe");
    if (cteNode) {
        const chaveRaw = cteNode.getAttribute("Id") || "";
        const chave = chaveRaw.replace(/[^0-9A-Za-z]/g, '');
        
        const ideNode = getXmlNodeCaseInsensitive(cteNode, "ide");
        const emitNode = getXmlNodeCaseInsensitive(cteNode, "emit");
        const vPrestNode = getXmlNodeCaseInsensitive(cteNode, "vPrest");
        
        if (clientCnpj) {
            const emitCnpj = cleanCnpj(getXmlTextCaseInsensitive(emitNode as Element, "CNPJ") || getXmlTextCaseInsensitive(emitNode as Element, "Cnpj") || cleanCnpj(getXmlTextCaseInsensitive(emitNode as Element, "cnpj") || ""));
            if (emitCnpj === clientCnpj) {
                throw new Error("Este CT-e foi emitido pelo cliente ativo (venda de serviço) e não pode ser importado na aba de despesas.");
            }

            const destNode = getXmlNodeCaseInsensitive(cteNode, "dest");
            const remNode = getXmlNodeCaseInsensitive(cteNode, "rem");
            const recebNode = getXmlNodeCaseInsensitive(cteNode, "receb");
            const expedNode = getXmlNodeCaseInsensitive(cteNode, "exped");
            const tomaNode = getXmlNodeCaseInsensitive(cteNode, "toma") || getXmlNodeCaseInsensitive(ideNode as Element, "toma3") || getXmlNodeCaseInsensitive(ideNode as Element, "toma4");

            const destCnpj = cleanCnpj(getXmlTextCaseInsensitive(destNode as Element, "CNPJ") || getXmlTextCaseInsensitive(destNode as Element, "CPF") || "");
            const remCnpj = cleanCnpj(getXmlTextCaseInsensitive(remNode as Element, "CNPJ") || getXmlTextCaseInsensitive(remNode as Element, "CPF") || "");
            const recebCnpj = cleanCnpj(getXmlTextCaseInsensitive(recebNode as Element, "CNPJ") || getXmlTextCaseInsensitive(recebNode as Element, "CPF") || "");
            const expedCnpj = cleanCnpj(getXmlTextCaseInsensitive(expedNode as Element, "CNPJ") || getXmlTextCaseInsensitive(expedNode as Element, "CPF") || "");
            const tomaCnpj = cleanCnpj(getXmlTextCaseInsensitive(tomaNode as Element, "CNPJ") || getXmlTextCaseInsensitive(tomaNode as Element, "CPF") || "");

            const clientParticipated = (destCnpj === clientCnpj) || (remCnpj === clientCnpj) || (recebCnpj === clientCnpj) || (expedCnpj === clientCnpj) || (tomaCnpj === clientCnpj);
            if (!clientParticipated) {
                throw new Error(`Este CT-e pertence a outra empresa e não corresponde ao CNPJ do cliente ativo (${clientCnpj}).`);
            }
        }

        const numero = getXmlTextCaseInsensitive(ideNode as Element, "nCT");
        const dataEmiRaw = getXmlTextCaseInsensitive(ideNode as Element, "dhEmi");
        const dataSaiRaw = getXmlTextCaseInsensitive(ideNode as Element, "dhSaiEnt") || getXmlTextCaseInsensitive(ideNode as Element, "dSaiEnt");
        const dataFinalRaw = dataSaiRaw || dataEmiRaw;
        const dataEmi = dataFinalRaw ? formatDate(dataFinalRaw.substring(0, 10)) : "";
        const monthIndex = getMonthIndex(dataEmi);
        
        const fornecedor = getXmlTextCaseInsensitive(emitNode as Element, "xNome");
        const cnpj = getXmlTextCaseInsensitive(emitNode as Element, "CNPJ") || getXmlTextCaseInsensitive(emitNode as Element, "Cnpj") || getXmlTextCaseInsensitive(emitNode as Element, "cnpj") || "";
        
        let valor = 0;
        if (vPrestNode) {
            const vTPrest = getXmlTextCaseInsensitive(vPrestNode, "vTPrest");
            let cleanValStr = (vTPrest || "").replace(/\s/g, '');
            if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
                cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
            } else if (cleanValStr.includes(',')) {
                cleanValStr = cleanValStr.replace(',', '.');
            }
            valor = parseFloat(cleanValStr) || 0;
        }
        
        const desc = "Transporte/Frete de Carga";
        const deducoes = { icms: 0, pisCofins: 0, desconto: 0, iss: 0 };
        
        if (vPrestNode) {
            const vICMS = parseFloat((getXmlTextCaseInsensitive(xmlDoc, "vICMS") || "0").replace(',', '.')) || 0;
            deducoes.icms = vICMS;
        }

        if (isXmlCanceled(xmlDoc)) {
            throw new Error("Conhecimento de transporte cancelado.");
        }
        
        let regime = "Lucro Presumido";
        const crt = getXmlTextCaseInsensitive(emitNode as Element, "CRT");
        if (crt === "1") regime = "Simples Nacional";
        else if (crt === "3") {
            const fornecedorUpper = (fornecedor || '').toUpperCase();
            const isCondo = fornecedorUpper.includes('CONDOMIN') && 
                             !fornecedorUpper.includes('LTDA') && 
                             !fornecedorUpper.includes('LIMITADA') && 
                             !fornecedorUpper.includes('S/A') && 
                             !fornecedorUpper.includes('S.A.') && 
                             !fornecedorUpper.includes('ADMINIST') && 
                             !fornecedorUpper.includes('GESTAO') && 
                             !fornecedorUpper.includes('SERVICO') && 
                             !fornecedorUpper.includes('SERVICE') && 
                             !fornecedorUpper.includes('ASSESSOR');
            const isAssoc = (fornecedorUpper.includes('ASSOCIA') && !fornecedorUpper.includes('ASSOCIAD')) || fornecedorUpper.includes('FUNDAC') || fornecedorUpper.includes('INSTITUTO') || fornecedorUpper.includes('SINDICATO') || fornecedorUpper.includes('IGREJA') || fornecedorUpper.includes('TEMPLO') || fornecedorUpper.includes('MITRA') || fornecedorUpper.includes('PAROQUIA') || isCondo;
            regime = isAssoc ? "Isento de IRPJ" : "Lucro Real";
        }
        
        if (cnpj && cnpj.replace(/\D/g, '').length === 11) regime = "Pessoa Física";

        return {
            id: 'xml-e-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            chave,
            numero,
            data: dataEmi,
            monthIndex,
            fornecedor,
            cnpj,
            regime,
            tipoDespesa: "Gera crédito de IBS/CBS",
            descricao: desc,
            valor,
            category: "frete",
            fileName,
            xmlType: 'CTe',
            deducoes,
        };
    }
    
    // NFe Despesa
    const nfeNode = getXmlNodeCaseInsensitive(xmlDoc, "infNFe") || getXmlNodeCaseInsensitive(xmlDoc, "infNfe");
    if (nfeNode) {
        const chaveRaw = nfeNode.getAttribute("Id") || "";
        const chave = chaveRaw.replace(/[^0-9A-Za-z]/g, '');
        
        const ideNode = getXmlNodeCaseInsensitive(nfeNode, "ide");
        if (!ideNode) throw new Error("Tag <ide> não encontrada (NF-e inválida).");
        
        const emitNode = getXmlNodeCaseInsensitive(nfeNode, "emit");
        if (!emitNode) throw new Error("Tag <emit> não encontrada (NF-e inválida).");

        const destNode = getXmlNodeCaseInsensitive(nfeNode, "dest");
        const totalNode = getXmlNodeCaseInsensitive(nfeNode, "total");

        if (clientCnpj) {
            const emitCnpj = cleanCnpj(getXmlTextCaseInsensitive(emitNode, "CNPJ") || getXmlTextCaseInsensitive(emitNode, "CPF") || "");
            const destCnpj = cleanCnpj(destNode ? (getXmlTextCaseInsensitive(destNode, "CNPJ") || getXmlTextCaseInsensitive(destNode, "CPF") || "") : "");

            if (emitCnpj === clientCnpj) {
                throw new Error("O cliente ativo é o emitente desta nota fiscal, indicando uma operação de saída (venda). Não pode ser importada nas despesas.");
            }
            if (destCnpj && destCnpj !== clientCnpj) {
                throw new Error(`Esta nota fiscal foi destinada a outro CNPJ (${destCnpj}) e não ao cliente ativo (${clientCnpj}).`);
            }
        }
        
        const numero = getXmlTextCaseInsensitive(ideNode, "nNF");
        const dataEmiRaw = getXmlTextCaseInsensitive(ideNode, "dhEmi") || getXmlTextCaseInsensitive(ideNode, "dEmi");
        const dataSaiRaw = getXmlTextCaseInsensitive(ideNode, "dhSaiEnt") || getXmlTextCaseInsensitive(ideNode, "dSaiEnt");
        const dataFinalRaw = dataSaiRaw || dataEmiRaw;
        const dataEmi = dataFinalRaw ? formatDate(dataFinalRaw.substring(0, 10)) : "";
        const monthIndex = getMonthIndex(dataEmi);
        const fornecedor = getXmlTextCaseInsensitive(emitNode, "xNome");
        const cnpj = getXmlTextCaseInsensitive(emitNode, "CNPJ") || getXmlTextCaseInsensitive(emitNode, "Cnpj") || getXmlTextCaseInsensitive(emitNode, "cnpj") || getXmlTextCaseInsensitive(emitNode, "CPF") || "";
        
        let valor = 0;
        if (totalNode) {
            const vNF = getXmlTextCaseInsensitive(totalNode, "vNF");
            let cleanValStr = (vNF || "").replace(/\s/g, '');
            if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
                cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
            } else if (cleanValStr.includes(',')) {
                cleanValStr = cleanValStr.replace(',', '.');
            }
            valor = parseFloat(cleanValStr) || 0;
        }
        
        let regime = "Lucro Presumido";
        const crt = getXmlTextCaseInsensitive(emitNode, "CRT");
        if (crt === "1") regime = "Simples Nacional";
        else if (crt === "3") {
            const fornecedorUpper = (fornecedor || '').toUpperCase();
            const isCondo = fornecedorUpper.includes('CONDOMIN') && 
                             !fornecedorUpper.includes('LTDA') && 
                             !fornecedorUpper.includes('LIMITADA') && 
                             !fornecedorUpper.includes('S/A') && 
                             !fornecedorUpper.includes('S.A.') && 
                             !fornecedorUpper.includes('ADMINIST') && 
                             !fornecedorUpper.includes('GESTAO') && 
                             !fornecedorUpper.includes('SERVICO') && 
                             !fornecedorUpper.includes('SERVICE') && 
                             !fornecedorUpper.includes('ASSESSOR');
            const isAssoc = (fornecedorUpper.includes('ASSOCIA') && !fornecedorUpper.includes('ASSOCIAD')) || fornecedorUpper.includes('FUNDAC') || fornecedorUpper.includes('INSTITUTO') || fornecedorUpper.includes('SINDICATO') || fornecedorUpper.includes('IGREJA') || fornecedorUpper.includes('TEMPLO') || fornecedorUpper.includes('MITRA') || fornecedorUpper.includes('PAROQUIA') || isCondo;
            regime = isAssoc ? "Isento de IRPJ" : "Lucro Real";
        }
        
        if (cnpj && cnpj.replace(/\D/g, '').length === 11) regime = "Pessoa Física";
        
        const detList = getXmlNodesCaseInsensitive(nfeNode, "det");
        const items = [];
        const produtosDetalhados: ProdutoDetalhado[] = [];
        
        for (let i = 0; i < detList.length; i++) {
            const prodNode = getXmlNodeCaseInsensitive(detList[i], "prod");
            if (!prodNode) continue;
            
            const prodName = getXmlTextCaseInsensitive(prodNode, "xProd");
            if (prodName) items.push(prodName);
            
            const cfop = getXmlTextCaseInsensitive(prodNode, "CFOP");
            const ncm = getXmlTextCaseInsensitive(prodNode, "NCM");
            
            const vProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vProd") || "0").replace(',', '.')) || 0;
            const vDescProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vDesc") || "0").replace(',', '.')) || 0;
            const vFreteProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vFrete") || "0").replace(',', '.')) || 0;
            const vOutroProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vOutro") || "0").replace(',', '.')) || 0;
            const vSegProd = parseFloat((getXmlTextCaseInsensitive(prodNode, "vSeg") || "0").replace(',', '.')) || 0;
            
            let vItemBruto = vProd + vFreteProd + vSegProd + vOutroProd;
            
            let vICMSProd = 0;
            let vPISProd = 0;
            let vCOFINSProd = 0;
            let vSTProd = 0;
            let vIPIProd = 0;
            let cstPis = '';
            let cstCofins = '';
            
            const impostoNode = getXmlNodeCaseInsensitive(detList[i], "imposto");
            if (impostoNode) {
                const icmsNode = getXmlNodeCaseInsensitive(impostoNode, "ICMS");
                if (icmsNode) {
                    vICMSProd = parseFloat((getXmlTextCaseInsensitive(icmsNode, "vICMS") || "0").replace(',', '.')) || 0;
                    vSTProd = parseFloat((getXmlTextCaseInsensitive(icmsNode, "vICMSST") || getXmlTextCaseInsensitive(icmsNode, "vST") || "0").replace(',', '.')) || 0;
                }
                
                const pisNode = getXmlNodeCaseInsensitive(impostoNode, "PIS");
                if (pisNode) {
                    vPISProd = parseFloat((getXmlTextCaseInsensitive(pisNode, "vPIS") || "0").replace(',', '.')) || 0;
                    cstPis = getXmlTextCaseInsensitive(pisNode, "CST") || '';
                }
                
                const cofinsNode = getXmlNodeCaseInsensitive(impostoNode, "COFINS");
                if (cofinsNode) {
                    vCOFINSProd = parseFloat((getXmlTextCaseInsensitive(cofinsNode, "vCOFINS") || "0").replace(',', '.')) || 0;
                    cstCofins = getXmlTextCaseInsensitive(cofinsNode, "CST") || '';
                }
                
                const ipiNode = getXmlNodeCaseInsensitive(impostoNode, "IPI");
                if (ipiNode) vIPIProd = parseFloat((getXmlTextCaseInsensitive(ipiNode, "vIPI") || "0").replace(',', '.')) || 0;
            }
            
            vItemBruto = vProd + vFreteProd + vSegProd + vOutroProd + vSTProd + vIPIProd;
            
            const isRevenda = (cfop === "1102" || cfop === "2102" || cfop === "1403" || cfop === "2403" || cfop === "1113" || cfop === "2113");
            const isFreteComp = (cfop === "1353" || cfop === "2353" || cfop === "1932" || cfop === "2932" || (prodName.toUpperCase().includes('FRETE') && !isRevenda));
            const isAlimento = /arroz|feij[aã]o|carne|frango|peixe|leite|queijo|manteiga|p[aã]o|macarr[aã]o|farinha|a[çc][úu]car|caf[ée]|[óo]leo|biscoito|bolacha|fruta|verdura|legume|hortali[çc]a|ovo/i.test(prodName) || /020|030|040|070|080|090|100|110|160|190|200/.test(ncm.substring(0,3));
            const isHigiene = /sabonete|shampoo|creme dental|pasta de dente|papel higi[êe]nico|fio dental|desodorante|absorvente|cotonete|escova de dente|condicionador/i.test(prodName) || /330|340|4818/.test(ncm.substring(0,4));
            
            // Regras CST para Anexo 1 (Alíquota Zero CST 06/04/etc) e Hortifruti (Anexo 15)
            const cstIcms = getXmlTextCaseInsensitive(prodNode, "CST") || getXmlTextCaseInsensitive(prodNode, "CSOSN");
            const isZeroOuMonofasico = (cstIcms === '04' || cstIcms === '06' || cstIcms === '40' || cstIcms === '41' || cstIcms === '60');
            const isHortifruti = /fruta|verdura|legume|hortali[çc]a|ovo|maca|banana|laranja|alho|cebola|tomate/i.test(prodName);
            
            const isAnexo15 = isHortifruti;
            const isAnexo1 = isZeroOuMonofasico && isAlimento && !isAnexo15;

            produtosDetalhados.push({
                nome: prodName,
                valorBruto: vItemBruto,
                desconto: vDescProd,
                icms: vICMSProd,
                pisCofins: vPISProd + vCOFINSProd,
                valorLiquido: vItemBruto - vICMSProd - (vPISProd + vCOFINSProd) - vDescProd,
                cfop: cfop,
                ncm: ncm,
                isAlimento60: isAlimento && !isAnexo1 && !isAnexo15, // Se for zero/mono, não vai pra base de 60%
                isHigiene60: isHigiene,
                isAnexo1: isAnexo1,
                isAnexo15: isAnexo15,
                isRevenda: isRevenda,
                isFrete: isFreteComp,
                isDevolucao: false,
                cstPis: cstPis || '',
                cstCofins: cstCofins || '',
                numeroNota: numero,
                dataEmissao: dataEmi,
                cliente: fornecedor
            });
        }
        let desc = items.join(", ");
        if (desc.length > 150) desc = desc.substring(0, 147) + "...";
        
        const deducoes = { icms: 0, pisCofins: 0, desconto: 0, iss: 0 };
        if (totalNode) {
            const vICMS = parseFloat((getXmlTextCaseInsensitive(totalNode, "vICMS") || "0").replace(',', '.')) || 0;
            const vPIS = parseFloat((getXmlTextCaseInsensitive(totalNode, "vPIS") || "0").replace(',', '.')) || 0;
            const vCOFINS = parseFloat((getXmlTextCaseInsensitive(totalNode, "vCOFINS") || "0").replace(',', '.')) || 0;
            const vDesc = parseFloat((getXmlTextCaseInsensitive(totalNode, "vDesc") || "0").replace(',', '.')) || 0;
            deducoes.icms = vICMS;
            deducoes.pisCofins = vPIS + vCOFINS;
            deducoes.desconto = vDesc;
        }
        
        if (isXmlCanceled(xmlDoc)) {
            throw new Error("Nota fiscal cancelada.");
        }
        
        return {
            id: 'xml-e-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            chave,
            numero,
            data: dataEmi,
            monthIndex,
            fornecedor,
            cnpj,
            regime,
            tipoDespesa: "Gera crédito de IBS/CBS",
            descricao: desc || "Compra de Mercadoria/Insumo",
            valor,
            category: "insumos",
            fileName,
            xmlType: 'NFe',
            deducoes,
            produtosDetalhados
        };
    }
    
    // NFS-e Despesa
    const chave = getXmlTextCaseInsensitive(xmlDoc, "CodigoVerificacao") || "";

    const numero = getXmlTextCaseInsensitive(xmlDoc, "Numero") || 
                   getXmlTextCaseInsensitive(xmlDoc, "NumeroNfe") || 
                   getXmlTextCaseInsensitive(xmlDoc, "nNFSe") ||
                   getXmlTextCaseInsensitive(xmlDoc, "nDPS") ||
                   getXmlTextCaseInsensitive(xmlDoc, "nNF") ||
                   "";
    const dataEmiRaw = getXmlTextCaseInsensitive(xmlDoc, "DataEmissao") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dtEmi") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dhProc") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dhEmi") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dCompet") || 
                      getXmlTextCaseInsensitive(xmlDoc, "dEmi") ||
                      getXmlTextCaseInsensitive(xmlDoc, "Competencia") ||
                      getXmlTextCaseInsensitive(xmlDoc, "competencia") ||
                      "";
    const dataSaiRaw = getXmlTextCaseInsensitive(xmlDoc, "DataSaida") || 
                       getXmlTextCaseInsensitive(xmlDoc, "dtSai") || 
                       getXmlTextCaseInsensitive(xmlDoc, "dhSaiEnt") || 
                       "";
    const dataFinalRaw = dataSaiRaw || dataEmiRaw;
    const dataEmi = dataFinalRaw ? formatDate(dataFinalRaw.substring(0, 10)) : "";
    const monthIndex = getMonthIndex(dataEmi);
    
    const prestadorNode = getXmlNodeCaseInsensitive(xmlDoc, "PrestadorServico") || getXmlNodeCaseInsensitive(xmlDoc, "Prestador") || getXmlNodeCaseInsensitive(xmlDoc, "emit") || getXmlNodeCaseInsensitive(xmlDoc, "Emitente") || getXmlNodeCaseInsensitive(xmlDoc, "prest") || getXmlNodeCaseInsensitive(xmlDoc, "DadosPrestador") || getXmlNodeCaseInsensitive(xmlDoc, "PrestadorSvc");
    const tomadorNode = getXmlNodeCaseInsensitive(xmlDoc, "TomadorServico") || getXmlNodeCaseInsensitive(xmlDoc, "Tomador") || getXmlNodeCaseInsensitive(xmlDoc, "dest") || getXmlNodeCaseInsensitive(xmlDoc, "Destinatario") || getXmlNodeCaseInsensitive(xmlDoc, "toma") || getXmlNodeCaseInsensitive(xmlDoc, "DadosTomador") || getXmlNodeCaseInsensitive(xmlDoc, "TomadorSvc");

    let tomadorCnpjExtracted = getXmlTextCaseInsensitive(tomadorNode as Element, "CNPJ") || getXmlTextCaseInsensitive(tomadorNode as Element, "Cnpj") || getXmlTextCaseInsensitive(tomadorNode as Element, "cnpj") || getXmlTextCaseInsensitive(tomadorNode as Element, "CPF") || getXmlTextCaseInsensitive(tomadorNode as Element, "Cpf") || getXmlTextCaseInsensitive(tomadorNode as Element, "cpf") || getXmlTextCaseInsensitive(tomadorNode as Element, "CpfCnpj") || "";
    if (!tomadorCnpjExtracted) tomadorCnpjExtracted = getXmlTextCaseInsensitive(xmlDoc, "CpfCnpjTomador") || getXmlTextCaseInsensitive(xmlDoc, "CnpjTomador") || getXmlTextCaseInsensitive(xmlDoc, "CpfTomador") || "";

    let prestadorCnpjExtracted = getXmlTextCaseInsensitive(prestadorNode as Element, "CNPJ") || getXmlTextCaseInsensitive(prestadorNode as Element, "Cnpj") || getXmlTextCaseInsensitive(prestadorNode as Element, "cnpj") || getXmlTextCaseInsensitive(prestadorNode as Element, "CPF") || getXmlTextCaseInsensitive(prestadorNode as Element, "Cpf") || getXmlTextCaseInsensitive(prestadorNode as Element, "cpf") || getXmlTextCaseInsensitive(prestadorNode as Element, "CpfCnpj") || "";
    if (!prestadorCnpjExtracted) prestadorCnpjExtracted = getXmlTextCaseInsensitive(xmlDoc, "CpfCnpjPrestador") || getXmlTextCaseInsensitive(xmlDoc, "CnpjPrestador") || getXmlTextCaseInsensitive(xmlDoc, "CpfPrestador") || "";

    // Aggressive fallback for prestador (Expense context)
    if (!prestadorCnpjExtracted && clientCnpj) {
        const allDocNodes = [...getXmlNodesCaseInsensitive(xmlDoc, "CNPJ"), ...getXmlNodesCaseInsensitive(xmlDoc, "CPF"), ...getXmlNodesCaseInsensitive(xmlDoc, "CpfCnpj"), ...getXmlNodesCaseInsensitive(xmlDoc, "Cnpj"), ...getXmlNodesCaseInsensitive(xmlDoc, "Cpf")];
        for (const node of allDocNodes) {
            const val = cleanCnpj(node.textContent);
            if (val && val.length >= 11 && val !== clientCnpj) {
                prestadorCnpjExtracted = val;
                break;
            }
        }
    }

    if (clientCnpj) {
        const prestadorCnpj = cleanCnpj(prestadorCnpjExtracted);
        const tomadorCnpj = cleanCnpj(tomadorCnpjExtracted);

        if (prestadorCnpj === clientCnpj) {
            throw new Error("Esta NFS-e é de serviço prestado (venda) e não pode ser importada na aba de despesas.");
        }
        if (tomadorCnpj && tomadorCnpj !== clientCnpj) {
            throw new Error(`Esta NFS-e tem como tomador outro CNPJ (${tomadorCnpj}) e não corresponde ao CNPJ do cliente ativo (${clientCnpj}) para despesas.`);
        }
    }

    let fornecedor = getXmlTextCaseInsensitive(prestadorNode as Element, "RazaoSocial") || getXmlTextCaseInsensitive(prestadorNode as Element, "xNome") || getXmlTextCaseInsensitive(prestadorNode as Element, "Nome") || getXmlTextCaseInsensitive(prestadorNode as Element, "NomeFantasia") || "";
    if (!fornecedor) fornecedor = getXmlTextCaseInsensitive(xmlDoc, "RazaoSocialPrestador") || getXmlTextCaseInsensitive(xmlDoc, "NomePrestador") || getXmlTextCaseInsensitive(xmlDoc, "xNome") || "Fornecedor Não Identificado";

    const cnpj = prestadorCnpjExtracted;
    
    let valor = 0;
    const valServStr = 
        getXmlTextCaseInsensitive(xmlDoc, "vServ") ||
        getXmlTextCaseInsensitive(xmlDoc, "ValorServicos") || 
        getXmlTextCaseInsensitive(xmlDoc, "ValorServico") || 
        getXmlTextCaseInsensitive(xmlDoc, "vBC") ||
        getXmlTextCaseInsensitive(xmlDoc, "vLiq") ||
        "0";
    let cleanValStr = valServStr.replace(/\s/g, '');
    if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
        cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanValStr.includes(',')) {
        cleanValStr = cleanValStr.replace(',', '.');
    }
    valor = parseFloat(cleanValStr) || 0;
    
    const desc = getXmlTextCaseInsensitive(xmlDoc, "Discriminacao") || 
                 getXmlTextCaseInsensitive(xmlDoc, "xServ") || 
                 getXmlTextCaseInsensitive(xmlDoc, "ItemListaServico") ||
                 getXmlTextCaseInsensitive(xmlDoc, "Descricao") ||
                 "Prestação de Serviço Tomado";
    let descTrim = desc.replace(/\s+/g, ' ').trim();
    if (descTrim.length > 150) descTrim = descTrim.substring(0, 147) + "...";
    
    const deducoes = { icms: 0, pisCofins: 0, desconto: 0, iss: 0 };
    const vISS = parseFloat((getXmlTextCaseInsensitive(xmlDoc, "ValorIss") || getXmlTextCaseInsensitive(xmlDoc, "vISS") || "0").replace(',', '.')) || 0;
    deducoes.iss = vISS;
    
    let regime = "Lucro Presumido"; // NFS-e geralmente não tem CRT, mantemos heurística base ou assume Presumido
    const prestadorUpper = (fornecedor || '').toUpperCase();
    const isCondo = prestadorUpper.includes('CONDOMIN') && 
                     !prestadorUpper.includes('LTDA') && 
                     !prestadorUpper.includes('LIMITADA') && 
                     !prestadorUpper.includes('S/A') && 
                     !prestadorUpper.includes('S.A.') && 
                     !prestadorUpper.includes('ADMINIST') && 
                     !prestadorUpper.includes('GESTAO') && 
                     !prestadorUpper.includes('SERVICO') && 
                     !prestadorUpper.includes('SERVICE') && 
                     !prestadorUpper.includes('ASSESSOR');
    const isAssoc = (prestadorUpper.includes('ASSOCIA') && !prestadorUpper.includes('ASSOCIAD')) || prestadorUpper.includes('FUNDAC') || prestadorUpper.includes('INSTITUTO') || prestadorUpper.includes('SINDICATO') || prestadorUpper.includes('IGREJA') || prestadorUpper.includes('TEMPLO') || prestadorUpper.includes('MITRA') || prestadorUpper.includes('PAROQUIA') || isCondo;
    if (isAssoc) regime = "Isento de IRPJ";
    
    if (cnpj && cnpj.replace(/\D/g, '').length === 11) regime = "Pessoa Física";
    
    if (isXmlCanceled(xmlDoc)) {
        throw new Error("Nota fiscal cancelada.");
    }

    return {
        id: 'xml-e-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        chave,
        numero,
        data: dataEmi,
        monthIndex,
        fornecedor,
        cnpj,
        regime,
        tipoDespesa: "Gera crédito de IBS/CBS",
        descricao: descTrim,
        valor,
        category: "servicos",
        fileName,
        xmlType: 'NFSe',
        deducoes
    };
}
