export const SIMPLES_TABLES: Record<string, Array<{ min: number; max: number; nom: number; pd: number; dasFractionPorFora: number }>> = {
  '1': [
      { min: 0, max: 180000, nom: 0.040, pd: 0, dasFractionPorFora: 0.505 },
      { min: 180000.01, max: 360000, nom: 0.073, pd: 5940, dasFractionPorFora: 0.505 },
      { min: 360000.01, max: 720000, nom: 0.095, pd: 13860, dasFractionPorFora: 0.505 },
      { min: 720000.01, max: 1800000, nom: 0.107, pd: 22500, dasFractionPorFora: 0.505 },
      { min: 1800000.01, max: 3600000, nom: 0.143, pd: 87300, dasFractionPorFora: 0.505 },
      { min: 3600000.01, max: 4800000, nom: 0.190, pd: 378000, dasFractionPorFora: 0.656 }
  ],
  '2': [
      { min: 0, max: 180000, nom: 0.045, pd: 0, dasFractionPorFora: 0.465 },
      { min: 180000.01, max: 360000, nom: 0.078, pd: 5940, dasFractionPorFora: 0.465 },
      { min: 360000.01, max: 720000, nom: 0.100, pd: 13860, dasFractionPorFora: 0.465 },
      { min: 720000.01, max: 1800000, nom: 0.112, pd: 22500, dasFractionPorFora: 0.465 },
      { min: 1800000.01, max: 3600000, nom: 0.147, pd: 85500, dasFractionPorFora: 0.465 },
      { min: 3600000.01, max: 4800000, nom: 0.300, pd: 720000, dasFractionPorFora: 0.505 }
  ],
  '3': [
      { min: 0, max: 180000, nom: 0.060, pd: 0, dasFractionPorFora: 0.509 },
      { min: 180000.01, max: 360000, nom: 0.112, pd: 9360, dasFractionPorFora: 0.509 },
      { min: 360000.01, max: 720000, nom: 0.135, pd: 17640, dasFractionPorFora: 0.509 },
      { min: 720000.01, max: 1800000, nom: 0.160, pd: 35640, dasFractionPorFora: 0.509 },
      { min: 1800000.01, max: 3600000, nom: 0.210, pd: 125640, dasFractionPorFora: 0.509 },
      { min: 3600000.01, max: 4800000, nom: 0.330, pd: 648000, dasFractionPorFora: 0.805 }
  ],
  '4': [
      { min: 0, max: 180000, nom: 0.045, pd: 0, dasFractionPorFora: 0.300 },
      { min: 180000.01, max: 360000, nom: 0.090, pd: 8100, dasFractionPorFora: 0.300 },
      { min: 360000.01, max: 720000, nom: 0.102, pd: 12420, dasFractionPorFora: 0.300 },
      { min: 720000.01, max: 1800000, nom: 0.140, pd: 39780, dasFractionPorFora: 0.300 },
      { min: 1800000.01, max: 3600000, nom: 0.220, pd: 183780, dasFractionPorFora: 0.300 },
      { min: 3600000.01, max: 4800000, nom: 0.330, pd: 828000, dasFractionPorFora: 0.785 }
  ],
  '5': [
      { min: 0, max: 180000, nom: 0.155, pd: 0, dasFractionPorFora: 0.6885 },
      { min: 180000.01, max: 360000, nom: 0.180, pd: 4500, dasFractionPorFora: 0.6885 },
      { min: 360000.01, max: 720000, nom: 0.195, pd: 9900, dasFractionPorFora: 0.6885 },
      { min: 720000.01, max: 1800000, nom: 0.205, pd: 17100, dasFractionPorFora: 0.6885 },
      { min: 1800000.01, max: 3600000, nom: 0.230, pd: 62100, dasFractionPorFora: 0.6885 },
      { min: 3600000.01, max: 4800000, nom: 0.305, pd: 540000, dasFractionPorFora: 0.6985 }
  ]
};

export const SIMPLES_TABLES_DEFINITIVA: Record<string, Array<{ min: number; max: number; nom: number; pd: number; dasFractionPorFora: number }>> = {
  '1': [
      { min: 0, max: 180000, nom: 0.045, pd: 0, dasFractionPorFora: 0.505 },
      { min: 180000.01, max: 360000, nom: 0.078, pd: 5940, dasFractionPorFora: 0.505 },
      { min: 360000.01, max: 720000, nom: 0.100, pd: 13860, dasFractionPorFora: 0.505 },
      { min: 720000.01, max: 1800000, nom: 0.112, pd: 22500, dasFractionPorFora: 0.505 },
      { min: 1800000.01, max: 3600000, nom: 0.147, pd: 85500, dasFractionPorFora: 0.505 },
      { min: 3600000.01, max: 4800000, nom: 0.299, pd: 720000, dasFractionPorFora: 0.656 }
  ],
  '2': [
      { min: 0, max: 180000, nom: 0.045, pd: 0, dasFractionPorFora: 0.465 },
      { min: 180000.01, max: 360000, nom: 0.078, pd: 5940, dasFractionPorFora: 0.465 },
      { min: 360000.01, max: 720000, nom: 0.100, pd: 13860, dasFractionPorFora: 0.465 },
      { min: 720000.01, max: 1800000, nom: 0.112, pd: 22500, dasFractionPorFora: 0.465 },
      { min: 1800000.01, max: 3600000, nom: 0.147, pd: 85500, dasFractionPorFora: 0.465 },
      { min: 3600000.01, max: 4800000, nom: 0.300, pd: 720000, dasFractionPorFora: 0.505 }
  ],
  '3': [
      { min: 0, max: 180000, nom: 0.060, pd: 0, dasFractionPorFora: 0.509 },
      { min: 180000.01, max: 360000, nom: 0.112, pd: 9360, dasFractionPorFora: 0.509 },
      { min: 360000.01, max: 720000, nom: 0.135, pd: 17640, dasFractionPorFora: 0.509 },
      { min: 720000.01, max: 1800000, nom: 0.160, pd: 35640, dasFractionPorFora: 0.509 },
      { min: 1800000.01, max: 3600000, nom: 0.210, pd: 125640, dasFractionPorFora: 0.509 },
      { min: 3600000.01, max: 4800000, nom: 0.330, pd: 648000, dasFractionPorFora: 0.805 }
  ],
  '4': [
      { min: 0, max: 180000, nom: 0.045, pd: 0, dasFractionPorFora: 0.300 },
      { min: 180000.01, max: 360000, nom: 0.090, pd: 8100, dasFractionPorFora: 0.300 },
      { min: 360000.01, max: 720000, nom: 0.102, pd: 12420, dasFractionPorFora: 0.300 },
      { min: 720000.01, max: 1800000, nom: 0.140, pd: 39780, dasFractionPorFora: 0.300 },
      { min: 1800000.01, max: 3600000, nom: 0.220, pd: 183780, dasFractionPorFora: 0.300 },
      { min: 3600000.01, max: 4800000, nom: 0.330, pd: 828000, dasFractionPorFora: 0.785 }
  ],
  '5': [
      { min: 0, max: 180000, nom: 0.155, pd: 0, dasFractionPorFora: 0.6885 },
      { min: 180000.01, max: 360000, nom: 0.180, pd: 4500, dasFractionPorFora: 0.6885 },
      { min: 360000.01, max: 720000, nom: 0.195, pd: 9900, dasFractionPorFora: 0.6885 },
      { min: 720000.01, max: 1800000, nom: 0.205, pd: 17100, dasFractionPorFora: 0.6885 },
      { min: 1800000.01, max: 3600000, nom: 0.230, pd: 62100, dasFractionPorFora: 0.6885 },
      { min: 3600000.01, max: 4800000, nom: 0.305, pd: 540000, dasFractionPorFora: 0.6985 }
  ]
};

export const SIMPLES_PARTILHA: Record<string, Record<string, Record<number, Record<string, number>>>> = {
  "2032": {
      "1": {
          1: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.415, ICMS: 0.204, IBS: 0.136 },
          2: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.415, ICMS: 0.204, IBS: 0.136 },
          3: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.42, ICMS: 0.201, IBS: 0.134 },
          4: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.42, ICMS: 0.201, IBS: 0.134 },
          5: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.42, ICMS: 0.201, IBS: 0.134 },
          6: { IRPJ: 0.135, CSLL: 0.1, CBS: 0.344, CPP: 0.421, ICMS: 0.0, IBS: 0.0 },
      },
      "2": {
          1: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, ICMS: 0.192, IBS: 0.128 },
          2: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, ICMS: 0.192, IBS: 0.128 },
          3: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, ICMS: 0.192, IBS: 0.128 },
          4: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, ICMS: 0.192, IBS: 0.128 },
          5: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, ICMS: 0.192, IBS: 0.128 },
          6: { IRPJ: 0.085, CSLL: 0.075, CBS: 0.255, CPP: 0.235, IPI: 0.35, ICMS: 0.0, IBS: 0.0 },
      },
      "3": {
          1: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.156, CPP: 0.434, ISS: 0.2345, IBS: 0.1005 },
          2: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.171, CPP: 0.434, ISS: 0.224, IBS: 0.096 },
          3: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.166, CPP: 0.434, ISS: 0.2275, IBS: 0.0975 },
          4: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.166, CPP: 0.434, ISS: 0.2275, IBS: 0.0975 },
          5: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.156, CPP: 0.434, ISS: 0.201, IBS: 0.134 },
          6: { IRPJ: 0.35, CSLL: 0.15, CBS: 0.195, CPP: 0.305, ISS: 0.0, IBS: 0.0 },
      },
      "4": {
          1: { IRPJ: 0.188, CSLL: 0.152, CBS: 0.215, ISS: 0.267, IBS: 0.178 },
          2: { IRPJ: 0.198, CSLL: 0.152, CBS: 0.25, ISS: 0.24, IBS: 0.16 },
          3: { IRPJ: 0.208, CSLL: 0.152, CBS: 0.24, ISS: 0.24, IBS: 0.16 },
          4: { IRPJ: 0.178, CSLL: 0.192, CBS: 0.23, ISS: 0.24, IBS: 0.16 },
          5: { IRPJ: 0.188, CSLL: 0.192, CBS: 0.22, ISS: 0.24, IBS: 0.16 },
          6: { IRPJ: 0.535, CSLL: 0.215, CBS: 0.25, ISS: 0.0, IBS: 0.0 },
      },
      "5": {
          1: { IRPJ: 0.25, CSLL: 0.15, CBS: 0.1715, CPP: 0.2885, ISS: 0.084, IBS: 0.056 },
          2: { IRPJ: 0.23, CSLL: 0.15, CBS: 0.1715, CPP: 0.2785, ISS: 0.102, IBS: 0.068 },
          3: { IRPJ: 0.24, CSLL: 0.15, CBS: 0.1815, CPP: 0.2385, ISS: 0.114, IBS: 0.076 },
          4: { IRPJ: 0.21, CSLL: 0.15, CBS: 0.1915, CPP: 0.2385, ISS: 0.126, IBS: 0.084 },
          5: { IRPJ: 0.23, CSLL: 0.125, CBS: 0.1715, CPP: 0.2385, ISS: 0.141, IBS: 0.094 },
          6: { IRPJ: 0.35, CSLL: 0.155, CBS: 0.2, CPP: 0.295, ISS: 0.0, IBS: 0.0 },
      },
  },
  "definitivo": {
      "1": {
          1: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.415, IBS: 0.34 },
          2: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.415, IBS: 0.34 },
          3: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.42, IBS: 0.335 },
          4: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.42, IBS: 0.335 },
          5: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.155, CPP: 0.42, IBS: 0.335 },
          6: { IRPJ: 0.135, CSLL: 0.1, CBS: 0.344, CPP: 0.421, IBS: 0.0 },
      },
      "2": {
          1: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, IBS: 0.32 },
          2: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, IBS: 0.32 },
          3: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, IBS: 0.32 },
          4: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, IBS: 0.32 },
          5: { IRPJ: 0.055, CSLL: 0.035, CBS: 0.14, CPP: 0.375, IPI: 0.075, IBS: 0.32 },
          6: { IRPJ: 0.085, CSLL: 0.075, CBS: 0.255, CPP: 0.235, IPI: 0.35, IBS: 0.0 },
      },
      "3": {
          1: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.156, CPP: 0.434, ISS: 0.201, IBS: 0.134 },
          2: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.171, CPP: 0.434, ISS: 0.192, IBS: 0.128 },
          3: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.166, CPP: 0.434, ISS: 0.195, IBS: 0.13 },
          4: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.166, CPP: 0.434, ISS: 0.195, IBS: 0.13 },
          5: { IRPJ: 0.04, CSLL: 0.035, CBS: 0.156, CPP: 0.434, IBS: 0.335 },
          6: { IRPJ: 0.35, CSLL: 0.15, CBS: 0.195, CPP: 0.305, ISS: 0.0, IBS: 0.0 },
      },
      "4": {
          1: { IRPJ: 0.188, CSLL: 0.152, CBS: 0.215, IBS: 0.445 },
          2: { IRPJ: 0.198, CSLL: 0.152, CBS: 0.25, IBS: 0.4 },
          3: { IRPJ: 0.208, CSLL: 0.152, CBS: 0.24, IBS: 0.4 },
          4: { IRPJ: 0.178, CSLL: 0.192, CBS: 0.23, IBS: 0.4 },
          5: { IRPJ: 0.188, CSLL: 0.192, CBS: 0.22, IBS: 0.4 },
          6: { IRPJ: 0.535, CSLL: 0.215, CBS: 0.25, IBS: 0.0 },
      },
      "5": {
          1: { IRPJ: 0.25, CSLL: 0.15, CBS: 0.1715, CPP: 0.2885, IBS: 0.14 },
          2: { IRPJ: 0.23, CSLL: 0.15, CBS: 0.1715, CPP: 0.2785, IBS: 0.17 },
          3: { IRPJ: 0.24, CSLL: 0.15, CBS: 0.1815, CPP: 0.2385, IBS: 0.19 },
          4: { IRPJ: 0.21, CSLL: 0.15, CBS: 0.1915, CPP: 0.2385, IBS: 0.21 },
          5: { IRPJ: 0.23, CSLL: 0.125, CBS: 0.1715, CPP: 0.2385, IBS: 0.235 },
          6: { IRPJ: 0.35, CSLL: 0.155, CBS: 0.2, CPP: 0.295, IBS: 0.0 },
      },
  }
};
