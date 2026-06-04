import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Home, 
  CalendarClock, 
  ArrowLeftRight, 
  HelpCircle,
  Calculator,
  Percent,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { cn, formatCurrency } from '../../../lib/utils';

// Helper de formatação de porcentagem
const formatPercent = (val: number) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, label }) => {
  const displayValue = useMemo(() => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanVal = e.target.value.replace(/\D/g, '');
    if (!cleanVal) {
      onChange(0);
      return;
    }
    const numVal = parseFloat(cleanVal) / 100;
    onChange(numVal);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-sm font-black text-muted-foreground/60 select-none">R$</span>
        <input 
          type="text" 
          value={displayValue} 
          onChange={handleChange} 
          className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
        />
      </div>
    </div>
  );
};

type SimulatorType = 'investments' | 'financing' | 'retirement' | 'rent-vs-buy' | 'financing-vs-consortium';

export const SimulatorsTab: React.FC = () => {
  const [activeSim, setActiveSim] = useState<SimulatorType>('investments');

  // ==========================================
  // ESTADOS DO SIMULADOR 1: INVESTIMENTOS VS POUPANÇA
  // ==========================================
  const [sim1Initial, setSim1Initial] = useState(10000);
  const [sim1Monthly, setSim1Monthly] = useState(500);
  const [sim1Months, setSim1Months] = useState(60);
  const [sim1Selic, setSim1Selic] = useState(10.5); // Selic estimada % a.a.
  const [sim1AltRate, setSim1AltRate] = useState(110); // % do CDI
  const [sim1IsTaxFree, setSim1IsTaxFree] = useState(false); // LCI/LCA isento

  // ==========================================
  // ESTADOS DO SIMULADOR 2: FINANCIAMENTO (SAC X PRICE)
  // ==========================================
  const [sim2Value, setSim2Value] = useState(300000);
  const [sim2Entry, setSim2Entry] = useState(60000);
  const [sim2Rate, setSim2Rate] = useState(9.5); // % a.a.
  const [sim2Months, setSim2Months] = useState(180);

  // ==========================================
  // ESTADOS DO SIMULADOR 3: APOSENTADORIA
  // ==========================================
  const [sim3Age, setSim3Age] = useState(30);
  const [sim3RetireAge, setSim3RetireAge] = useState(65);
  const [sim3LifeExpectancy, setSim3LifeExpectancy] = useState(85);
  const [sim3CurrentWealth, setSim3CurrentWealth] = useState(50000);
  const [sim3MonthlyContribution, setSim3MonthlyContribution] = useState(1000);
  const [sim3DesiredIncome, setSim3DesiredIncome] = useState(5000);
  const [sim3RealRate, setSim3RealRate] = useState(5.0); // % a.a. acima da inflação

  // ==========================================
  // ESTADOS DO SIMULADOR 4: ALUGUEL X CASA PRÓPRIA
  // ==========================================
  const [sim4PropertyVal, setSim4PropertyVal] = useState(400000);
  const [sim4Entry, setSim4Entry] = useState(80000);
  const [sim4Rate, setSim4Rate] = useState(10.0); // % a.a.
  const [sim4Months, setSim4Months] = useState(240);
  const [sim4RentInitial, setSim4RentInitial] = useState(1800);
  const [sim4RentInflation, setSim4RentInflation] = useState(4.5); // % a.a. reajuste aluguel
  const [sim4PropAppreciation, setSim4PropAppreciation] = useState(5.5); // % a.a. valorização imóvel
  const [sim4InvestmentReturn, setSim4InvestmentReturn] = useState(6.0); // % a.a. real líquido

  // ==========================================
  // ESTADOS DO SIMULADOR 5: FINANCIAMENTO X CONSÓRCIO
  // ==========================================
  const [sim5GoodVal, setSim5GoodVal] = useState(150000);
  const [sim5FinRate, setSim5FinRate] = useState(10.5); // % a.a.
  const [sim5Months, setSim5Months] = useState(72);
  const [sim5ConsFee, setSim5ConsFee] = useState(15.0); // % taxa adm total
  const [sim5ContemplationMonth, setSim5ContemplationMonth] = useState(24);
  const [sim5AlternativeRent, setSim5AlternativeRent] = useState(800); // custo por não ter o bem mensal

  // ==========================================
  // CALCULO 1: INVESTIMENTOS VS POUPANÇA
  // ==========================================
  const sim1Data = useMemo(() => {
    // Poupança mensal: 
    // se Selic > 8.5%, rende 0.5% + TR (estimando TR como 0.05% a.m. -> 0.55% a.m. total)
    // se Selic <= 8.5%, rende 70% de Selic / 12 + TR
    const trMonthly = 0.05 / 100;
    const monthlyPoupança = sim1Selic > 8.5 
      ? 0.5 / 100 + trMonthly 
      : ((0.7 * sim1Selic) / 12) / 100 + trMonthly;

    // Investimento alternativo (CDB / CDI)
    // CDI anual estimado = Selic - 0.10% (ex: 10.5% Selic -> 10.4% CDI)
    const cdiAnual = Math.max(0.1, sim1Selic - 0.1) / 100;
    const rateAnualAlt = cdiAnual * (sim1AltRate / 100);
    const monthlyAlt = Math.pow(1 + rateAnualAlt, 1/12) - 1;

    let saldoP = sim1Initial;
    let totalInvested = sim1Initial;

    // Estrutura para calcular IR regressivo de CDB de forma realista depósito por depósito
    const deposits = [{ amount: sim1Initial, month: 0 }];
    const chartPoints = [{
      mes: 0,
      Investido: totalInvested,
      Poupança: saldoP,
      InvestimentoBruto: totalInvested,
      InvestimentoLíquido: totalInvested,
    }];

    for (let m = 1; m <= sim1Months; m++) {
      saldoP = (saldoP + sim1Monthly) * (1 + monthlyPoupança);
      totalInvested += sim1Monthly;
      deposits.push({ amount: sim1Monthly, month: m });

      // Calcular o saldo do investimento alternativo
      // Cada depósito rende individualmente juros compostos baseados em sua idade
      let altBruto = 0;
      let altLiquido = 0;

      deposits.forEach((dep) => {
        const idadeMeses = m - dep.month;
        const depBruto = dep.amount * Math.pow(1 + monthlyAlt, idadeMeses);
        const depRendimento = depBruto - dep.amount;
        
        // Alíquota regressiva do IR brasileiro
        let aliquota = 0.15;
        const idadeDias = idadeMeses * 30;
        if (idadeDias <= 180) aliquota = 0.225;
        else if (idadeDias <= 360) aliquota = 0.20;
        else if (idadeDias <= 720) aliquota = 0.175;

        const depLiquido = sim1IsTaxFree 
          ? depBruto 
          : depBruto - (depRendimento * aliquota);

        altBruto += depBruto;
        altLiquido += depLiquido;
      });

      // Apenas adicionamos pontos no gráfico em intervalos para não saturar
      // (a cada 1 mês se prazo < 24 meses, a cada 3 meses se < 120, senão a cada 6)
      const shouldPush = sim1Months <= 24 
        ? true 
        : sim1Months <= 120 
          ? m % 3 === 0 || m === sim1Months
          : m % 6 === 0 || m === sim1Months;

      if (shouldPush) {
        chartPoints.push({
          mes: m,
          Investido: totalInvested,
          Poupança: Math.round(saldoP),
          InvestimentoBruto: Math.round(altBruto),
          InvestimentoLíquido: Math.round(altLiquido),
        });
      }
    }

    const finalPoupança = saldoP;
    const finalAltLid = chartPoints[chartPoints.length - 1].InvestimentoLíquido;
    const diff = finalAltLid - finalPoupança;

    return {
      points: chartPoints,
      totalInvested,
      finalPoupança,
      finalAltLid,
      diff,
      cdiAnualNominal: cdiAnual * 100,
    };
  }, [sim1Initial, sim1Monthly, sim1Months, sim1Selic, sim1AltRate, sim1IsTaxFree]);

  // ==========================================
  // CALCULO 2: FINANCIAMENTO (SAC X PRICE)
  // ==========================================
  const sim2Data = useMemo(() => {
    const principal = sim2Value - sim2Entry;
    if (principal <= 0) return { sacPoints: [], pricePoints: [], sacTotal: 0, priceTotal: 0, sacJuros: 0, priceJuros: 0 };

    const iMensal = Math.pow(1 + (sim2Rate / 100), 1/12) - 1;

    // 1. Cálculo SAC (Amortização Constante)
    const amortSAC = principal / sim2Months;
    let saldoSAC = principal;
    let totalJurosSAC = 0;
    const sacPoints = [];

    for (let m = 1; m <= sim2Months; m++) {
      const jurosM = saldoSAC * iMensal;
      const parcelaM = amortSAC + jurosM;
      totalJurosSAC += jurosM;
      saldoSAC -= amortSAC;

      if (m === 1 || m === sim2Months || m % Math.ceil(sim2Months / 10) === 0 || m === Math.ceil(sim2Months / 2)) {
        sacPoints.push({
          mes: m,
          parcela: Math.round(parcelaM),
          amortizacao: Math.round(amortSAC),
          juros: Math.round(jurosM),
          saldoDevedor: Math.round(saldoSAC),
        });
      }
    }

    // 2. Cálculo PRICE (Prestação Constante)
    // Parcela PRICE = PV * [i * (1+i)^n] / [(1+i)^n - 1]
    const parcelaPRICE = principal * (iMensal * Math.pow(1 + iMensal, sim2Months)) / (Math.pow(1 + iMensal, sim2Months) - 1);
    let saldoPRICE = principal;
    let totalJurosPRICE = 0;
    const pricePoints = [];

    for (let m = 1; m <= sim2Months; m++) {
      const jurosM = saldoPRICE * iMensal;
      const amortM = parcelaPRICE - jurosM;
      totalJurosPRICE += jurosM;
      saldoPRICE -= amortM;

      if (m === 1 || m === sim2Months || m % Math.ceil(sim2Months / 10) === 0 || m === Math.ceil(sim2Months / 2)) {
        pricePoints.push({
          mes: m,
          parcela: Math.round(parcelaPRICE),
          amortizacao: Math.round(amortM),
          juros: Math.round(jurosM),
          saldoDevedor: Math.round(Math.max(0, saldoPRICE)),
        });
      }
    }

    // Gerar dados unificados para o gráfico de evolução das parcelas
    const chartData = [];
    for (let m = 1; m <= sim2Months; m++) {
      // SAC
      const jurosSAC_m = (principal - amortSAC * (m - 1)) * iMensal;
      const parcSAC_m = amortSAC + jurosSAC_m;

      // PRICE
      // Para o gráfico vamos amostrar de acordo com o tamanho do prazo
      const shouldPush = sim2Months <= 60 
        ? m % 3 === 0 || m === 1 || m === sim2Months
        : m % 12 === 0 || m === 1 || m === sim2Months;

      if (shouldPush) {
        chartData.push({
          mes: m,
          SAC: Math.round(parcSAC_m),
          PRICE: Math.round(parcelaPRICE),
        });
      }
    }

    const sacPrimeira = amortSAC + (principal * iMensal);
    const sacUltima = amortSAC + (amortSAC * iMensal);

    return {
      chartData,
      sacPrimeira,
      sacUltima,
      priceParcela: parcelaPRICE,
      sacJuros: totalJurosSAC,
      priceJuros: totalJurosPRICE,
      sacTotal: principal + totalJurosSAC,
      priceTotal: principal + totalJurosPRICE,
      financiado: principal,
    };
  }, [sim2Value, sim2Entry, sim2Rate, sim2Months]);

  // ==========================================
  // CALCULO 3: APOSENTADORIA
  // ==========================================
  const sim3Data = useMemo(() => {
    const mesesAcumulacao = Math.max(0, (sim3RetireAge - sim3Age) * 12);
    const mesesUsufruto = Math.max(0, (sim3LifeExpectancy - sim3RetireAge) * 12);
    const rMensalReal = Math.pow(1 + (sim3RealRate / 100), 1/12) - 1;

    let saldo = sim3CurrentWealth;
    const chartPoints = [{
      idade: sim3Age,
      patrimonio: Math.round(saldo),
      fase: 'Acumulação'
    }];

    // Fase 1: Acumulação
    for (let m = 1; m <= mesesAcumulacao; m++) {
      saldo = (saldo + sim3MonthlyContribution) * (1 + rMensalReal);
      const idadeCorr = sim3Age + (m / 12);
      
      const shouldPush = mesesAcumulacao <= 120 
        ? m % 12 === 0 
        : m % 24 === 0 || m === mesesAcumulacao;
        
      if (shouldPush) {
        chartPoints.push({
          idade: Math.round(idadeCorr),
          patrimonio: Math.round(saldo),
          fase: 'Acumulação'
        });
      }
    }

    const patrimonioNaAposentadoria = saldo;

    // Fase 2: Usufruto
    let esgotouIdade: number | null = null;
    for (let m = 1; m <= mesesUsufruto; m++) {
      if (saldo > 0) {
        saldo = saldo - sim3DesiredIncome;
        if (saldo > 0) {
          saldo = saldo * (1 + rMensalReal);
        } else {
          saldo = 0;
          if (esgotouIdade === null) {
            esgotouIdade = Math.round(sim3RetireAge + (m / 12));
          }
        }
      }
      
      const idadeCorr = sim3RetireAge + (m / 12);
      const shouldPush = mesesUsufruto <= 120 
        ? m % 12 === 0 
        : m % 24 === 0 || m === mesesUsufruto;

      if (shouldPush) {
        chartPoints.push({
          idade: Math.round(idadeCorr),
          patrimonio: Math.round(saldo),
          fase: 'Usufruto'
        });
      }
    }

    // Rendimento Perpétuo: se retirar apenas a rentabilidade mensal real do patrimônio acumulado
    const rendaPerpetua = patrimonioNaAposentadoria * rMensalReal;

    return {
      points: chartPoints,
      patrimonioAposentadoria: patrimonioNaAposentadoria,
      patrimonioFinal: saldo,
      rendaPerpetua,
      esgotouIdade,
      isSustentavel: esgotouIdade === null && saldo > 0,
    };

    // Helper simples para contornar escopo local
    function getContributionValue() { return sim3MonthlyContribution; }
  }, [sim3Age, sim3RetireAge, sim3LifeExpectancy, sim3CurrentWealth, sim3MonthlyContribution, sim3DesiredIncome, sim3RealRate]);

  // ==========================================
  // CALCULO 4: ALUGUEL X CASA PRÓPRIA FINANCIADA
  // ==========================================
  const sim4Data = useMemo(() => {
    const financiado = sim4PropertyVal - sim4Entry;
    if (financiado <= 0) return { points: [], finalPropWealth: 0, finalRentWealth: 0 };

    const iMensalFin = Math.pow(1 + (sim4Rate / 100), 1/12) - 1;
    const rMensalInv = Math.pow(1 + (sim4InvestmentReturn / 100), 1/12) - 1;
    const inflacaoRentMensal = Math.pow(1 + (sim4RentInflation / 100), 1/12) - 1;
    const appreciationMensal = Math.pow(1 + (sim4PropAppreciation / 100), 1/12) - 1;

    // SAC Financiamento
    const amortSAC = financiado / sim4Months;
    
    // Aluguel Inicial
    let aluguelM = sim4RentInitial;
    
    // Investimento inicial na opção de aluguel
    let carteiraAluguel = sim4Entry;
    let valorImovel = sim4PropertyVal;

    const chartPoints = [{
      ano: 0,
      ComprarImóvel: Math.round(valorImovel),
      AlugarEInvestir: Math.round(carteiraAluguel),
    }];

    for (let m = 1; m <= sim4Months; m++) {
      // 1. Cenário Financiamento (Imóvel Valorizando)
      valorImovel = valorImovel * (1 + appreciationMensal);

      // Parcela do Financiamento no mês
      const jurosSAC_m = (financiado - amortSAC * (m - 1)) * iMensalFin;
      const parcelaFin_m = amortSAC + jurosSAC_m;
      // Custo extra do imóvel próprio: IPTU + Seguro + Manutenção (estimado 0.5% ao ano)
      const custoExtraImovel = (valorImovel * (0.5 / 100)) / 12;

      const totalMensalComprar = parcelaFin_m + custoExtraImovel;

      // 2. Cenário Aluguel (Aluguel Reajustado e Investimentos)
      // O aluguel reajusta anualmente
      if (m > 1 && m % 12 === 0) {
        aluguelM = aluguelM * (1 + (sim4RentInflation / 100));
      }

      // Diferença de custo entre os dois mundos
      // Se comprar for mais caro que alugar, a diferença vai para a carteira de investimento
      // Se alugar for mais caro que comprar, retiramos da carteira de investimentos
      const diferenca = totalMensalComprar - aluguelM;

      carteiraAluguel = (carteiraAluguel + diferenca) * (1 + rMensalInv);

      // Ponto no gráfico a cada 1 ano (12 meses)
      if (m % 12 === 0 || m === sim4Months) {
        chartPoints.push({
          ano: Math.round(m / 12),
          ComprarImóvel: Math.round(valorImovel),
          AlugarEInvestir: Math.round(Math.max(0, carteiraAluguel)),
        });
      }
    }

    return {
      points: chartPoints,
      finalPropWealth: valorImovel,
      finalRentWealth: Math.max(0, carteiraAluguel),
      vencedor: valorImovel > carteiraAluguel ? 'comprar' : 'alugar',
    };
  }, [sim4PropertyVal, sim4Entry, sim4Rate, sim4Months, sim4RentInitial, sim4RentInflation, sim4PropAppreciation, sim4InvestmentReturn]);

  // ==========================================
  // CALCULO 5: FINANCIAMENTO X CONSÓRCIO
  // ==========================================
  const sim5Data = useMemo(() => {
    const financiado = sim5GoodVal - sim5ContemplationMonth > 0 ? sim5GoodVal : sim5GoodVal; // ajuste de escopo
    const principalFin = sim5GoodVal; // considerando financiamento total do valor do bem
    const iMensalFin = Math.pow(1 + (sim5FinRate / 100), 1/12) - 1;

    // 1. Custos Financiamento (Tabela SAC como padrão de mercado)
    const amortSAC = principalFin / sim5Months;
    let totalFinanciamento = 0;
    const finChartData = [];

    for (let m = 1; m <= sim5Months; m++) {
      const jurosM = (principalFin - amortSAC * (m - 1)) * iMensalFin;
      const parcelaM = amortSAC + jurosM;
      totalFinanciamento += parcelaM;

      if (m % 6 === 0 || m === 1 || m === sim5Months) {
        finChartData.push({ mes: m, custoAcumulado: Math.round(totalFinanciamento), tipo: 'Financiamento' });
      }
    }

    // 2. Custos Consórcio
    // Parcela mensal do consórcio = (Valor do Bem / Prazo) + Taxa Adm Diluída
    // Taxa Adm diluída mensal = (Taxa Adm Total / Prazo)
    const taxaAdmMensal = (sim5ConsFee / 100) / sim5Months;
    const parcelaConsorcio = (sim5GoodVal / sim5Months) * (1 + taxaAdmMensal * sim5Months);

    let totalConsorcio = 0;
    const consChartData = [];

    for (let m = 1; m <= sim5Months; m++) {
      // Paga parcelas normalmente
      totalConsorcio += parcelaConsorcio;

      // Custo de Oportunidade / Aluguel alternativo:
      // Se não foi contemplado ainda (mês < contemplação), o usuário precisa pagar
      // um aluguel para usufruir de um bem similar.
      if (m < sim5ContemplationMonth) {
        totalConsorcio += sim5AlternativeRent;
      }

      if (m % 6 === 0 || m === 1 || m === sim5Months) {
        consChartData.push({ mes: m, custoAcumulado: Math.round(totalConsorcio), tipo: 'Consórcio' });
      }
    }

    // Gerar dados de gráfico unificados
    const chartData = [];
    let acumFin = 0;
    let acumCons = 0;

    for (let m = 1; m <= sim5Months; m++) {
      // Financiamento acumulado
      const jurosM = (principalFin - amortSAC * (m - 1)) * iMensalFin;
      acumFin += (amortSAC + jurosM);

      // Consórcio acumulado
      acumCons += parcelaConsorcio;
      if (m < sim5ContemplationMonth) {
        acumCons += sim5AlternativeRent;
      }

      if (sim5Months <= 36 ? m % 3 === 0 || m === sim5Months : m % 6 === 0 || m === sim5Months) {
        chartData.push({
          mes: m,
          Financiamento: Math.round(acumFin),
          Consórcio: Math.round(acumCons),
        });
      }
    }

    return {
      chartData,
      totalFin: acumFin,
      totalCons: acumCons,
      finParcelaInicial: amortSAC + (principalFin * iMensalFin),
      consParcela: parcelaConsorcio,
      diferenca: Math.abs(acumFin - acumCons),
      vencedor: acumFin < acumCons ? 'financiamento' : 'consorcio',
    };
  }, [sim5GoodVal, sim5FinRate, sim5Months, sim5ConsFee, sim5ContemplationMonth, sim5AlternativeRent]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <style>{`
        .premium-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          outline: none;
          margin-top: 12px;
          margin-bottom: 12px;
          transition: background 0.3s;
        }
        .dark .premium-slider {
          background: #1e293b;
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D97706;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4);
          cursor: pointer;
          transition: transform 0.15s, background-color 0.15s;
        }
        .dark .premium-slider::-webkit-slider-thumb {
          border-color: #1e293b;
        }
        .premium-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          background: #b45309;
        }
        .premium-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #D97706;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4);
          cursor: pointer;
          transition: transform 0.15s, background-color 0.15s;
          border: none;
        }
        .dark .premium-slider::-moz-range-thumb {
          border-color: #1e293b;
        }
        .premium-slider::-moz-range-thumb:hover {
          transform: scale(1.25);
          background: #b45309;
        }
      `}</style>
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Ferramentas de Análise</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Simuladores Financeiros
          </h1>
        </div>
      </div>

      {/* SELETOR DE SIMULADORES */}
      <div className="bg-card border border-border p-2 rounded-3xl shadow-sm flex flex-wrap gap-2">
        {[
          { id: 'investments', label: 'Investimentos', icon: TrendingUp },
          { id: 'financing', label: 'Financiamento (SAC x PRICE)', icon: ArrowLeftRight },
          { id: 'retirement', label: 'Aposentadoria', icon: CalendarClock },
          { id: 'rent-vs-buy', label: 'Aluguel x Compra', icon: Home },
          { id: 'financing-vs-consortium', label: 'Financiamento x Consórcio', icon: Calculator },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSim(item.id as SimulatorType)}
            className={cn(
              "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 border",
              activeSim === item.id 
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DINÂMICO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUNA DE ENTRADAS (2/3 no mobile, 1/3 no desktop) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6 border-b border-border pb-4 flex items-center gap-2">
              <Percent size={18} className="text-primary" /> Parâmetros da Simulação
            </h2>

            {/* PAINEL DE INPUTS PARA SIMULADOR 1 */}
            {activeSim === 'investments' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <CurrencyInput 
                    label="Aporte Inicial (R$)"
                    value={sim1Initial}
                    onChange={setSim1Initial}
                  />
                  <input type="range" min="0" max="200000" step="5000" value={sim1Initial} onChange={e => setSim1Initial(Number(e.target.value))} className="premium-slider" />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Aporte Mensal (R$)"
                    value={sim1Monthly}
                    onChange={setSim1Monthly}
                  />
                  <input type="range" min="0" max="10000" step="100" value={sim1Monthly} onChange={e => setSim1Monthly(Number(e.target.value))} className="premium-slider" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Prazo (Meses)</label>
                  <input 
                    type="number" 
                    value={sim1Months} 
                    onChange={e => setSim1Months(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                  <input type="range" min="1" max="360" step="6" value={sim1Months} onChange={e => setSim1Months(Number(e.target.value))} className="premium-slider" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Taxa Selic Estimada (% a.a.)</label>
                  <input 
                    type="number" 
                    value={sim1Selic} 
                    step="0.25"
                    onChange={e => setSim1Selic(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Rendimento Alternativo (% do CDI)</label>
                  <input 
                    type="number" 
                    value={sim1AltRate} 
                    onChange={e => setSim1AltRate(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>

                <div className="flex items-center gap-3 bg-muted/20 border border-border p-4 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="sim1IsTaxFree" 
                    checked={sim1IsTaxFree} 
                    onChange={e => setSim1IsTaxFree(e.target.checked)} 
                    className="w-5 h-5 rounded border-border accent-primary focus:ring-0"
                  />
                  <label htmlFor="sim1IsTaxFree" className="text-xs font-black uppercase tracking-wider text-muted-foreground select-none cursor-pointer">
                    Investimento Isento de IR (LCI / LCA)
                  </label>
                </div>
              </div>
            )}

            {/* PAINEL DE INPUTS PARA SIMULADOR 2 */}
            {activeSim === 'financing' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <CurrencyInput 
                    label="Valor do Bem/Imóvel (R$)"
                    value={sim2Value}
                    onChange={setSim2Value}
                  />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Valor da Entrada (R$)"
                    value={sim2Entry}
                    onChange={setSim2Entry}
                  />
                  <input type="range" min="0" max={sim2Value} step="10000" value={sim2Entry} onChange={e => setSim2Entry(Number(e.target.value))} className="premium-slider" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Taxa de Juros (% a.a.)</label>
                  <input 
                    type="number" 
                    value={sim2Rate} 
                    step="0.1"
                    onChange={e => setSim2Rate(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Prazo (Meses)</label>
                  <input 
                    type="number" 
                    value={sim2Months} 
                    onChange={e => setSim2Months(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                  <input type="range" min="12" max="420" step="12" value={sim2Months} onChange={e => setSim2Months(Number(e.target.value))} className="premium-slider" />
                </div>
              </div>
            )}

            {/* PAINEL DE INPUTS PARA SIMULADOR 3 */}
            {activeSim === 'retirement' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Idade Atual</label>
                    <input 
                      type="number" 
                      value={sim3Age} 
                      onChange={e => setSim3Age(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Aposentadoria</label>
                    <input 
                      type="number" 
                      value={sim3RetireAge} 
                      onChange={e => setSim3RetireAge(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Expectativa de Vida (Anos)</label>
                  <input 
                    type="number" 
                    value={sim3LifeExpectancy} 
                    onChange={e => setSim3LifeExpectancy(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Patrimônio Atual (R$)"
                    value={sim3CurrentWealth}
                    onChange={setSim3CurrentWealth}
                  />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Aporte Mensal (R$)"
                    value={sim3MonthlyContribution}
                    onChange={setSim3MonthlyContribution}
                  />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Renda na Aposentadoria (R$)"
                    value={sim3DesiredIncome}
                    onChange={setSim3DesiredIncome}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Rentabilidade Real (% a.a.)</label>
                  <input 
                    type="number" 
                    value={sim3RealRate} 
                    step="0.1"
                    onChange={e => setSim3RealRate(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acima da inflação estimada</p>
                </div>
              </div>
            )}

            {/* PAINEL DE INPUTS PARA SIMULADOR 4 */}
            {activeSim === 'rent-vs-buy' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <CurrencyInput 
                    label="Valor do Imóvel (R$)"
                    value={sim4PropertyVal}
                    onChange={setSim4PropertyVal}
                  />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Entrada Disponível (R$)"
                    value={sim4Entry}
                    onChange={setSim4Entry}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Juros Fin. (% a.a.)</label>
                    <input 
                      type="number" 
                      value={sim4Rate} 
                      step="0.1"
                      onChange={e => setSim4Rate(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Prazo (Meses)</label>
                    <input 
                      type="number" 
                      value={sim4Months} 
                      onChange={e => setSim4Months(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Aluguel Inicial (R$)"
                    value={sim4RentInitial}
                    onChange={setSim4RentInitial}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Rendimento Investimentos (% a.a.)</label>
                  <input 
                    type="number" 
                    value={sim4InvestmentReturn} 
                    onChange={e => setSim4InvestmentReturn(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Taxa real líquida acima da inflação</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Val. Imóvel (% a.a.)</label>
                    <input 
                      type="number" 
                      value={sim4PropAppreciation} 
                      onChange={e => setSim4PropAppreciation(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Inflação (% a.a.)</label>
                    <input 
                      type="number" 
                      value={sim4RentInflation} 
                      onChange={e => setSim4RentInflation(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PAINEL DE INPUTS PARA SIMULADOR 5 */}
            {activeSim === 'financing-vs-consortium' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <CurrencyInput 
                    label="Valor do Bem/Crédito (R$)"
                    value={sim5GoodVal}
                    onChange={setSim5GoodVal}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Juros Fin. (% a.a.)</label>
                    <input 
                      type="number" 
                      value={sim5FinRate} 
                      step="0.1"
                      onChange={e => setSim5FinRate(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Prazo (Meses)</label>
                    <input 
                      type="number" 
                      value={sim5Months} 
                      onChange={e => setSim5Months(Number(e.target.value))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Taxa Adm. Consórcio (%)</label>
                  <input 
                    type="number" 
                    value={sim5ConsFee} 
                    onChange={e => setSim5ConsFee(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Taxa de administração total do período</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Mês Estimado Contemplação</label>
                  <input 
                    type="number" 
                    value={sim5ContemplationMonth} 
                    onChange={e => setSim5ContemplationMonth(Number(e.target.value))} 
                    className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                  />
                  <input type="range" min="1" max={sim5Months} step="1" value={sim5ContemplationMonth} onChange={e => setSim5ContemplationMonth(Number(e.target.value))} className="premium-slider" />
                </div>

                <div className="space-y-2">
                  <CurrencyInput 
                    label="Aluguel/Custo Alternativo do Bem (R$)"
                    value={sim5AlternativeRent}
                    onChange={setSim5AlternativeRent}
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Custo mensal por não possuir o bem até a contemplação</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DE RESULTADOS E GRÁFICOS (2/3 de espaço) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* CARDS DE SUMÁRIO DO SIMULADOR ATIVO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeSim === 'investments' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Investido</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(sim1Data.totalInvested)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Saldo na Poupança</p>
                  <p className="text-xl font-black text-rose-500">{formatCurrency(sim1Data.finalPoupança)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Saldo Invest. Líquido</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(sim1Data.finalAltLid)}</p>
                </div>
              </>
            )}

            {activeSim === 'financing' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor Financiado</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(sim2Data.financiado)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Custo Total (SAC)</p>
                  <p className="text-xl font-black text-primary">{formatCurrency(sim2Data.sacTotal)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Juros: {formatCurrency(sim2Data.sacJuros)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Custo Total (PRICE)</p>
                  <p className="text-xl font-black text-amber-500">{formatCurrency(sim2Data.priceTotal)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Juros: {formatCurrency(sim2Data.priceJuros)}</p>
                </div>
              </>
            )}

            {activeSim === 'retirement' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Patrimônio Acumulado</p>
                  <p className="text-xl font-black text-primary">{formatCurrency(sim3Data.patrimonioAposentadoria)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Aos {sim3RetireAge} anos</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Renda Perpétua Real</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(sim3Data.rendaPerpetua)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Retirada sem consumir o principal</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Durabilidade do Saldo</p>
                  {sim3Data.isSustentavel ? (
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg w-fit">
                      SUSTENTÁVEL
                    </span>
                  ) : (
                    <span className="text-sm font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg w-fit">
                      ACABA AOS {sim3Data.esgotouIdade} ANOS
                    </span>
                  )}
                </div>
              </>
            )}

            {activeSim === 'rent-vs-buy' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor Final Imóvel</p>
                  <p className="text-xl font-black text-primary">{formatCurrency(sim4Data.finalPropWealth)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Cenário Comprar</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Patrimônio Final Investido</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(sim4Data.finalRentWealth)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Cenário Alugar & Investir</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Melhor Opção</p>
                  {sim4Data.vencedor === 'comprar' ? (
                    <span className="text-sm font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg w-fit">
                      COMPRAR IMÓVEL
                    </span>
                  ) : (
                    <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit">
                      ALUGAR E INVESTIR
                    </span>
                  )}
                </div>
              </>
            )}

            {activeSim === 'financing-vs-consortium' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Custo Total Financiamento</p>
                  <p className="text-xl font-black text-rose-500">{formatCurrency(sim5Data.totalFin)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Custo Total Consórcio</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(sim5Data.totalCons)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Opção Mais Econômica</p>
                  {sim5Data.vencedor === 'financiamento' ? (
                    <span className="text-sm font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg w-fit">
                      FINANCIAMENTO
                    </span>
                  ) : (
                    <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit">
                      CONSÓRCIO
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* GRÁFICO DO SIMULADOR E CARD DETALHADO */}
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6">
              Evolução Patrimonial / Comparação de Custos
            </h3>

            {/* GRÁFICOS DO RECHARTS */}
            <div className="h-[320px] w-full">
              {activeSim === 'investments' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim1Data.points} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPoupança" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" name="Investimento Alternativo (Líquido)" dataKey="InvestimentoLíquido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAlt)" />
                    <Area type="monotone" name="Caderneta de Poupança" dataKey="Poupança" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPoupança)" />
                    <Area type="monotone" name="Capital Investido" dataKey="Investido" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeSim === 'financing' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sim2Data.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" name="SAC (Decrescente)" dataKey="SAC" stroke="#f59e0b" strokeWidth={3} dot={false} />
                    <Line type="monotone" name="PRICE (Constante)" dataKey="PRICE" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeSim === 'retirement' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim3Data.points} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="idade" tickFormatter={(v) => `${v} anos`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" name="Patrimônio Real Acumulado" dataKey="patrimonio" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorPatrimonio)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeSim === 'rent-vs-buy' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim4Data.points} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompra" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAluguel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="ano" tickFormatter={(v) => `Ano ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" name="Patrimônio Imóvel Próprio" dataKey="ComprarImóvel" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorCompra)" />
                    <Area type="monotone" name="Carteira Aluguel & Investimentos" dataKey="AlugarEInvestir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAluguel)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeSim === 'financing-vs-consortium' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim5Data.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFinAcum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConsAcum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" name="Custo Acumulado Financiamento" dataKey="Financiamento" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFinAcum)" />
                    <Area type="monotone" name="Custo Acumulado Consórcio" dataKey="Consórcio" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorConsAcum)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* DETALHAMENTOS DE CONCLUSÃO FINANCEIRA DO PROJETO */}
            <div className="mt-8 border-t border-border pt-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Info size={16} className="text-primary" /> Relatório de Diagnóstico
              </h4>

              {activeSim === 'investments' && (
                <div className="bg-muted/30 border border-border p-5 rounded-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Aplicando a taxa Selic estimada de <strong className="text-slate-950 dark:text-white">{sim1Selic}% a.a.</strong>, o rendimento alternativo de <strong className="text-slate-950 dark:text-white">{sim1AltRate}% do CDI</strong> (nominal de {sim1Data.cdiAnualNominal.toFixed(2)}% a.a.) acumulou uma rentabilidade líquida total maior que a poupança em <strong className="text-emerald-500 font-bold">{formatCurrency(sim1Data.diff)}</strong> ao final de {sim1Months} meses.
                  </p>
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      Rendimento Poupança Líquido: {formatCurrency(sim1Data.finalPoupança - sim1Data.totalInvested)}
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      Rendimento Alternativo Líquido (após IR): {formatCurrency(sim1Data.finalAltLid - sim1Data.totalInvested)}
                    </span>
                  </div>
                </div>
              )}

              {activeSim === 'financing' && (
                <div className="bg-muted/30 border border-border p-5 rounded-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    No **Sistema SAC**, o saldo devedor é amortizado de forma constante. A primeira parcela inicia em <strong className="text-slate-950 dark:text-white">{formatCurrency(sim2Data.sacPrimeira)}</strong> e a última reduz para <strong className="text-slate-950 dark:text-white">{formatCurrency(sim2Data.sacUltima)}</strong>. 
                    No **Sistema PRICE**, as parcelas são sempre fixadas em <strong className="text-slate-950 dark:text-white">{formatCurrency(sim2Data.priceParcela)}</strong>.
                  </p>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Ao comparar os juros, a tabela **SAC gera uma economia total de {formatCurrency(sim2Data.priceJuros - sim2Data.sacJuros)} em juros** em relação à PRICE, pois a amortização do saldo devedor ocorre de forma mais rápida nas parcelas iniciais.
                  </p>
                </div>
              )}

              {activeSim === 'retirement' && (
                <div className="bg-muted/30 border border-border p-5 rounded-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Com base nos aportes mensais de **{formatCurrency(sim3MonthlyContribution)}** até os {sim3RetireAge} anos, você construirá um patrimônio de **{formatCurrency(sim3Data.patrimonioAposentadoria)}**.
                  </p>
                  {sim3Data.isSustentavel ? (
                    <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        <strong>Patrimônio Sustentável!</strong> Seus investimentos rendem juros reais suficientes para bancar sua renda de {formatCurrency(sim3DesiredIncome)} sem nunca esgotar o capital (retirada abaixo da renda perpétua de {formatCurrency(sim3Data.rendaPerpetua)}).
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                      <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                        <strong>Atenção!</strong> O capital se esgotará aos {sim3Data.esgotouIdade} anos. Para manter o patrimônio até a expectativa de vida desejada ({sim3LifeExpectancy} anos), considere aumentar os aportes na fase de acumulação, adiar a aposentadoria em alguns anos ou reduzir a retirada planejada.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSim === 'rent-vs-buy' && (
                <div className="bg-muted/30 border border-border p-5 rounded-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Ao final do prazo do financiamento de {sim4Months} meses, a compra do imóvel gerará um patrimônio físico valorizado de <strong className="text-slate-950 dark:text-white">{formatCurrency(sim4Data.finalPropWealth)}</strong>. 
                    Por outro lado, morar de aluguel e investir a entrada e a diferença mensal das parcelas geraria uma carteira financeira líquida final de <strong className="text-slate-950 dark:text-white">{formatCurrency(sim4Data.finalRentWealth)}</strong>.
                  </p>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    A simulação aponta que a melhor opção financeira teórica é **{sim4Data.vencedor === 'comprar' ? 'Comprar o Imóvel Próprio' : 'Alugar e investir a diferença'}**, gerando uma diferença patrimonial líquida de <strong className="text-emerald-500 font-bold">{formatCurrency(Math.abs(sim4Data.finalPropWealth - sim4Data.finalRentWealth))}</strong> ao final do prazo.
                  </p>
                </div>
              )}

              {activeSim === 'financing-vs-consortium' && (
                <div className="bg-muted/30 border border-border p-5 rounded-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    O financiamento do bem gera parcelas iniciais estimadas de <strong className="text-slate-950 dark:text-white">{formatCurrency(sim5Data.finParcelaInicial)}</strong> e custo final total de <strong className="text-slate-950 dark:text-white">{formatCurrency(sim5Data.totalFin)}</strong>, mas entrega o bem no mês 1.
                  </p>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    O consórcio possui parcelas fixadas de <strong className="text-slate-950 dark:text-white">{formatCurrency(sim5Data.consParcela)}</strong>. Contemplando no mês {sim5ContemplationMonth}, o custo total (somando parcelas, lance e os custos extras de aluguel alternativo nos meses anteriores à contemplação) é de <strong className="text-slate-950 dark:text-white">{formatCurrency(sim5Data.totalCons)}</strong>.
                  </p>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed text-emerald-500 font-bold">
                    O consórcio resulta em uma {sim5Data.vencedor === 'consorcio' ? 'economia' : 'desvantagem'} de {formatCurrency(sim5Data.diferenca)} no custo de aquisição final, considerando os parâmetros informados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
