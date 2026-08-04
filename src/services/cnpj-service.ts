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

export async function consultarCnpj(cnpjOrig: string): Promise<CnpjInfo | null> {
  const cnpj = cnpjOrig.replace(/\D/g, '');
  if (cnpj.length !== 14) return null;

  try {
    // Tentativa 1: ReceitaWS via JSONP (Mais preciso para Simples Nacional)
    try {
      const data = await fetchReceitaWsJsonp(cnpj);
      if (data && data.status !== 'ERROR') {
        let regime = "Lucro Presumido";
        if (data.simples && data.simples.optante) {
          regime = "Simples Nacional";
        }
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

    // Tentativa 2: BrasilAPI
    try {
      const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, 8000);
      if (res.ok) {
        const data = await res.json();
        let regime = "Lucro Presumido";
        if (data.opcao_pelo_simples === true || data.opcao_pelo_simples === 'S' || data.opcao_pelo_simples === 'Sim' || data.opcao_pelo_simples === 'SIM') regime = "Simples Nacional";
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

    // Tentativa 3: CNPJ.ws
    try {
      const res = await fetchWithTimeout(`https://publica.cnpj.ws/cnpj/${cnpj}`, 8000);
      if (res.ok) {
        const data = await res.json();
        let regime = "Lucro Presumido";
        if (data.simples && (data.simples.simples === 'S' || data.simples.simples === 'Sim' || data.simples.simples === true || data.simples.simples === 'SIM')) regime = "Simples Nacional";
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
