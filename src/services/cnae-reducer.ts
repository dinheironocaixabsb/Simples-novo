export interface CnaeReductionResult {
    percentage: number;
    category: string | null;
}

/**
 * Retorna o percentual de redução (0, 30, 60, 100) da LC 214/2025 e a categoria,
 * com base no código CNAE informado.
 */
export function verificarReducaoCnae(cnaeCode: string): CnaeReductionResult {
    let percentage = 0;
    let category: string | null = null;
    
    if (cnaeCode) {
        // Pega apenas os 4 primeiros dígitos do CNAE
        const prefix = cnaeCode.replace(/\D/g, '').substring(0, 4);
        
        // Constantes extraídas do sistema original
        const CNAES_REDUCAO_60 = ['8610', '8621', '8622', '8630', '8640', '8650', '8660', '8690', '8711', '8712', '8720', '8730'];
        const CNAES_REDUCAO_30 = ['6911', '6920', '7111', '7112', '7500'];

        if (CNAES_REDUCAO_60.includes(prefix)) {
            percentage = 60;
            category = 'Serviços de Saúde';
        } else if (CNAES_REDUCAO_30.includes(prefix)) {
            percentage = 30;
            category = 'Profissões Regulamentadas';
        }
    }

    return { percentage, category };
}
