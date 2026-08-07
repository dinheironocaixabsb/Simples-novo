export interface CnpjInfo {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  regime: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function fetchReceitaWsJsonp(cnpj: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Cannot use JSONP outside browser'));
    }
    const callbackName = 'receitaws_callback_' + Math.round(100000 * Math.random());
    
    const timeoutId = setTimeout(() => {
      delete (window as any)[callbackName];
      reject(new Error("Timeout receitaws"));
    }, 10000);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeoutId);
      delete (window as any)[callbackName];
      resolve(data);
    };

    const script = document.createElement('script');
    script.src = `https://receitaws.com.br/v1/cnpj/${cnpj}?callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timeoutId);
      delete (window as any)[callbackName];
      reject(new Error("Script load error receitaws"));
    };
    document.head.appendChild(script);
    
    script.onload = () => {
      setTimeout(() => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      }, 1000);
    };
  });
}

function determineRegimeFromApiData(isSimples: boolean, razaoSocial: string, naturezaJuridica: string, cnae: string): string {
  if (isSimples) return "Simples Nacional";
  
  // Se não é simples, usamos as informações oficiais da API para classificar corretamente
  const upperRazao = (razaoSocial || "").toUpperCase();
  const upperNat = (naturezaJuridica || "").toUpperCase();
  const upperCnae = (cnae || "").toUpperCase();

  // Imunes/Isentos
  const isIsento = upperNat.includes("ASSOCIA") || upperNat.includes("FUNDA") || upperNat.includes("SINDICATO") || upperNat.includes("RELIGIOS") || upperNat.includes("TEMPLO") || upperNat.includes("IGREJA") || upperNat.includes("CONDOMINIO") || upperNat.includes("CONDOMÍNIO") || upperRazao.includes("ASSOCIA") || upperRazao.includes("SINDICATO") || upperRazao.includes("IGREJA");

  if (isIsento) {
    return "Isento de IRPJ";
  }

  // Lucro Real provável
  const isSA = upperRazao.includes(" S.A") || upperRazao.includes(" S/A") || upperRazao.includes(" S A") || upperNat.includes("SOCIEDADE AN");
  const isViacao = upperRazao.includes("VIACAO") || upperRazao.includes("VIAÇÃO") || upperRazao.includes("TRANSPORT") || upperCnae.includes("TRANSPORTE");
  const isBanco = upperRazao.includes("BANCO") || upperRazao.includes("CAIXA ECONOMICA") || upperCnae.includes("FINANCEIR") || upperNat.includes("FINANCEIR");
  const isSeguradora = upperRazao.includes("SEGURADORA") || upperCnae.includes("SEGURO");
  const isEnergiaOuAgua = upperCnae.includes("ENERGIA") || upperCnae.includes("AGUA") || upperCnae.includes("SANEAMENTO") || upperRazao.includes("ENERGIA") || upperRazao.includes("SANEAMENTO");

  if (isSA || isViacao || isBanco || isSeguradora || isEnergiaOuAgua) {
    return "Lucro Real";
  }

  return "Não Optante"; // Irá manter o que veio no XML ou fallback para Lucro Presumido
}

export async function consultarCnpj(cnpjOrig: string): Promise<CnpjInfo | null> {
  const cnpj = cnpjOrig.replace(/\D/g, '');
  if (cnpj.length !== 14) return null;

  try {
    // Tentativa 1: ReceitaWS via JSONP (Mais preciso para Simples Nacional)
    try {
      const res = await fetchWithTimeout(`https://minhareceita.org/${cnpj}`, 8000);
      if (res.ok) {
        const data = await res.json();
        const isSimples = data.opcao_pelo_simples === true;
        let regime = determineRegimeFromApiData(isSimples, data.razao_social, data.natureza_juridica, data.cnae_fiscal_descricao);
        
        // Se a heurística não sabe (Não Optante), vamos olhar o histórico de ECF da Receita
        if (regime === "Não Optante" && Array.isArray(data.regime_tributario) && data.regime_tributario.length > 0) {
          const latestRegime = data.regime_tributario.sort((a: any, b: any) => b.ano - a.ano)[0];
          if (latestRegime && latestRegime.forma_de_tributacao) {
            if (latestRegime.forma_de_tributacao === "LUCRO PRESUMIDO") regime = "Lucro Presumido";
            else if (latestRegime.forma_de_tributacao === "LUCRO REAL") regime = "Lucro Real";
          }
        }
        
        return {
          cnpj: cnpjOrig,
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia,
          regime
        };
      }
    } catch (e) {
      // Fallback
    }

    // Tentativa 2: ReceitaWS
    try {
      const res = await fetchWithTimeout(`https://receitaws.com.br/v1/cnpj/${cnpj}`, 8000);
      if (res.ok) {
        const data = await res.json();
        const isSimples = data.simples && data.simples.optante;
        const regime = determineRegimeFromApiData(!!isSimples, data.nome, data.natureza_juridica, data.atividade_principal?.[0]?.text);
        return {
          cnpj: cnpjOrig,
          razaoSocial: data.nome,
          nomeFantasia: data.fantasia,
          regime
        };
      }
    } catch (e) {
      // Fallback
    }

    // Tentativa 3: BrasilAPI
    try {
      const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, 8000);
      if (res.ok) {
        const data = await res.json();
        const isSimples = data.opcao_pelo_simples === true || data.opcao_pelo_simples === 'S' || data.opcao_pelo_simples === 'Sim' || data.opcao_pelo_simples === 'SIM';
        const regime = determineRegimeFromApiData(!!isSimples, data.razao_social, data.natureza_juridica, data.cnae_fiscal_descricao);
        
        return {
          cnpj: cnpjOrig,
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia,
          regime
        };
      }
    } catch (e) {
      // Fallback
    }

    // Tentativa 4: CNPJ.ws
    try {
      const res = await fetchWithTimeout(`https://publica.cnpj.ws/cnpj/${cnpj}`, 8000);
      if (res.ok) {
        const data = await res.json();
        const isSimples = data.simples && (data.simples.simples === 'S' || data.simples.simples === 'Sim' || data.simples.simples === true || data.simples.simples === 'SIM');
        const regime = determineRegimeFromApiData(!!isSimples, data.razao_social, data.natureza_juridica?.descricao, data.estabelecimento?.atividade_principal?.descricao);
        return {
          cnpj: cnpjOrig,
          razaoSocial: data.razao_social,
          nomeFantasia: data.estabelecimento?.nome_fantasia,
          regime
        };
      }
    } catch (e) {
      // Fail
    }
  } catch (e) {
    console.error(`Erro ao consultar CNPJ ${cnpj}`, e);
  }
  
  return null;
}
