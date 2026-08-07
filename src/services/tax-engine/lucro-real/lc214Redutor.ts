import { RedutorType } from './ibsCbs';

export interface RedutorInfo {
  temBeneficio: boolean;
  redutor: RedutorType;
  percentual: number;
  descricao: string;
}

/**
 * Analisa o CNAE principal e os secundários para detectar se a empresa se enquadra
 * em alguma das hipóteses de redução de IBS/CBS segundo a LC 214.
 */
export function detectarRedutorPorCnae(
  cnaePrincipal: string,
  cnaesSecundarios: string[] = []
): RedutorInfo {
  const todosCnaes = [cnaePrincipal, ...cnaesSecundarios].filter(Boolean);
  
  if (todosCnaes.length === 0) {
    return { temBeneficio: false, redutor: 'NONE', percentual: 0, descricao: '' };
  }

  for (const cnae of todosCnaes) {
    const texto = cnae.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. Redução de 60% (Saúde, Educação, Agropecuária, Dispositivos Médicos)
    const palavrasChave60 = [
      'saude', 'medico', 'medica', 'odontol', 'hospital', 'clinica', 'laboratorio',
      'fisioterap', 'enfermagem', 'psicolog', 'diagnostico', 'terapia', 'medicamento',
      'farmaceut', 'educacao', 'ensino', 'escola', 'faculdade', 'universidade',
      'agricultura', 'pecuaria', 'cultivo', 'criacao', 'agropecuaria', 'hortifruti'
    ];
    const codigosCnae60 = [/^86/, /^87/, /^85/, /^01/, /^02/, /^03/, /^21/, /^3250/];

    if (codigosCnae60.some(r => r.test(texto.trim())) || palavrasChave60.some(kw => texto.includes(kw))) {
      return {
        temBeneficio: true,
        redutor: '60%',
        percentual: 60,
        descricao: 'Identificamos que a atividade desta empresa permite aplicar um redutor de 60% na alíquota de IBS e CBS. O benefício já foi pré-selecionado para você no Passo 3.'
      };
    }

    // 2. Redução de 40% (Serviços de Alimentação: Restaurantes, Bares, Lanchonetes)
    const palavrasChave40 = [
      'restaurante', 'bar', 'lanchonete', 'refeicao', 'alimentacao', 'comida', 'buffet', 'cantina'
    ];
    const codigosCnae40 = [/^56/];

    if (codigosCnae40.some(r => r.test(texto.trim())) || palavrasChave40.some(kw => texto.includes(kw))) {
      return {
        temBeneficio: true,
        redutor: '40%',
        percentual: 40,
        descricao: 'Identificamos que a atividade desta empresa (Serviços de Alimentação) permite aplicar um redutor de 40% na alíquota de IBS e CBS. O benefício já foi pré-selecionado para você no Passo 3.'
      };
    }

    // 3. Redução de 30% (Profissões Regulamentadas / Profissionais Liberais)
    const palavrasChave30 = [
      'advocacia', 'juridico', 'engenharia', 'arquitetura', 'contabilidade', 'auditoria', 'veterinaria'
    ];
    const codigosCnae30 = [/^6911/, /^7111/, /^7112/, /^6920/, /^7500/];

    if (codigosCnae30.some(r => r.test(texto.trim())) || palavrasChave30.some(kw => texto.includes(kw))) {
      return {
        temBeneficio: true,
        redutor: '30%',
        percentual: 30,
        descricao: 'Identificamos que a atividade desta empresa (Profissão Regulamentada) permite aplicar um redutor de 30% na alíquota de IBS e CBS. O benefício já foi pré-selecionado para você no Passo 3.'
      };
    }
  }

  return { temBeneficio: false, redutor: 'NONE', percentual: 0, descricao: '' };
}
