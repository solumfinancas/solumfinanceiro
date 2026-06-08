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

interface PercentInputProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  suffix?: string;
}

const PercentInput: React.FC<PercentInputProps> = ({ value, onChange, label, suffix = "%" }) => {
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
        <input 
          type="text" 
          value={displayValue} 
          onChange={handleChange} 
          className="w-full bg-muted/30 border border-border rounded-xl h-12 pl-4 pr-16 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
        />
        <span className="absolute right-4 text-xs font-black text-muted-foreground/60 select-none">{suffix}</span>
      </div>
    </div>
  );
};

type SimulatorType = 'investments' | 'financing' | 'retirement' | 'rent-vs-buy' | 'financing-vs-consortium' | 'amortization';

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
  const [sim1CustomRate, setSim1CustomRate] = useState(12.0); // % a.a. customizada
  const [sim1UseCustomRate, setSim1UseCustomRate] = useState(false); // Simular taxa alternativa customizada
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
  const [sim4SelectedPeriod, setSim4SelectedPeriod] = useState(0);
  const [sim4IsTaxFree, setSim4IsTaxFree] = useState(false);
  const [sim4TimelineMonths, setSim4TimelineMonths] = useState(240);
  const [sim4AmortSystem, setSim4AmortSystem] = useState<'SAC' | 'PRICE'>('SAC');


  // Garantir que o tempo de projeção seja no mínimo igual ao prazo de financiamento
  React.useEffect(() => {
    if (sim4TimelineMonths < sim4Months) {
      setSim4TimelineMonths(sim4Months);
    }
  }, [sim4Months]);

  // Resetar período da tabela se o prazo for encurtado e o período atual extrapolar
  React.useEffect(() => {
    const totalPeriods = Math.ceil(sim4TimelineMonths / 60);
    if (sim4SelectedPeriod >= totalPeriods) {
      setSim4SelectedPeriod(0);
    }
  }, [sim4TimelineMonths, sim4SelectedPeriod]);

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
  // ESTADOS DO SIMULADOR 6: AMORTIZAÇÃO DE EMPRÉSTIMO/FINANCIAMENTO
  // ==========================================
  const [sim6Value, setSim6Value] = useState(200000);
  const [sim6Rate, setSim6Rate] = useState(9.5); // % a.a.
  const [sim6Months, setSim6Months] = useState(240);
  const [sim6StartDate, setSim6StartDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [sim6AmortSystem, setSim6AmortSystem] = useState<'SAC' | 'PRICE'>('SAC');
  
  const [sim6ExtraType, setSim6ExtraType] = useState<'none' | 'single' | 'recurring'>('none');
  const [sim6ExtraValue, setSim6ExtraValue] = useState(1000);
  const [sim6ExtraMonth, setSim6ExtraMonth] = useState(12);
  const [sim6ExtraFreq, setSim6ExtraFreq] = useState<'monthly' | 'yearly'>('monthly');
  const [sim6Goal, setSim6Goal] = useState<'reduce-time' | 'reduce-value'>('reduce-time');
  const [sim6SelectedPeriod, setSim6SelectedPeriod] = useState(0);

  // Histórico de parcelas dadas baixas/pagas pelo usuário diretamente na tabela
  const [sim6PaymentsState, setSim6PaymentsState] = useState<Record<number, { isPaid: boolean; customAmountPaid?: number; customExtraPaid?: number }>>({});

  const [sim6CustomInstallment, setSim6CustomInstallment] = useState(0);


  const togglePaymentPaid = (mes: number) => {
    setSim6PaymentsState(prev => {
      const current = prev[mes] || { isPaid: false };
      const nextPaidStatus = !current.isPaid;
      
      // Se estamos desmarcando como pago, podemos limpar os valores customizados para resetar para a projeção teórica
      if (!nextPaidStatus) {
        const updated = { ...prev };
        delete updated[mes];
        return updated;
      }

      return {
        ...prev,
        [mes]: {
          ...current,
          isPaid: nextPaidStatus
        }
      };
    });
  };

  const updateCustomAmountPaid = (mes: number, val: number) => {
    setSim6PaymentsState(prev => {
      const current = prev[mes] || { isPaid: true };
      return {
        ...prev,
        [mes]: {
          ...current,
          isPaid: true,
          customAmountPaid: val
        }
      };
    });
  };

  const updateCustomExtraPaid = (mes: number, val: number) => {
    setSim6PaymentsState(prev => {
      const current = prev[mes] || { isPaid: true };
      return {
        ...prev,
        [mes]: {
          ...current,
          isPaid: true,
          customExtraPaid: val
        }
      };
    });
  };


  // ==========================================
  // CALCULO 1: INVESTIMENTOS VS POUPANÇA
  // ==========================================
  const sim1Data = useMemo(() => {
    // Poupança mensal: 
    // se Selic estiver acima de 8,5% ao ano: A rentabilidade é de 0,5% ao mês (cerca de 6,17% ao ano) mais a Taxa Referencial (TR).
    // se Selic estiver igual ou menor a 8,5% ao ano: A rentabilidade cai para 70% da meta da taxa Selic ao ano mais a Taxa Referencial (TR).
    const trMonthly = 0.05 / 100;
    const monthlyPoupança = sim1Selic > 8.5 
      ? 0.5 / 100 + trMonthly 
      : ((0.7 * sim1Selic) / 12) / 100 + trMonthly;

    // Investimento alternativo (CDB / CDI)
    // CDI anual estimado = Selic - 0.10% (ex: 10.5% Selic -> 10.4% CDI)
    const cdiAnual = Math.max(0.1, sim1Selic - 0.1) / 100;
    const rateAnualAlt = cdiAnual * (sim1AltRate / 100);
    const monthlyAlt = Math.pow(1 + rateAnualAlt, 1/12) - 1;

    // Investimento Customizado
    const monthlyCustom = Math.pow(1 + (sim1CustomRate / 100), 1/12) - 1;

    let saldoP = sim1Initial;
    let totalInvested = sim1Initial;
    let finalAltLiquidoTaxable = sim1Initial;
    let finalCustomLiquidoTaxable = sim1Initial;

    // Estrutura para calcular IR regressivo de CDB de forma realista depósito por depósito
    const deposits = [{ amount: sim1Initial, month: 0 }];
    const chartPoints = [{
      mes: 0,
      Investido: totalInvested,
      Poupança: saldoP,
      InvestimentoBruto: totalInvested,
      InvestimentoLíquido: totalInvested,
      CustomBruto: totalInvested,
      CustomLíquido: totalInvested,
      IRAvalAlt: 0,
      IRAvalAltTaxable: 0,
      IRAvalCustom: 0,
      IRAvalCustomTaxable: 0
    }];

    for (let m = 1; m <= sim1Months; m++) {
      saldoP = (saldoP + sim1Monthly) * (1 + monthlyPoupança);
      totalInvested += sim1Monthly;
      deposits.push({ amount: sim1Monthly, month: m });

      // Calcular o saldo do investimento alternativo e customizado
      let altBruto = 0;
      let altLiquido = 0;
      let altLiquidoTaxable = 0;
      let customBruto = 0;
      let customLiquido = 0;
      let customLiquidoTaxable = 0;

      deposits.forEach((dep) => {
        const idadeMeses = m - dep.month;
        
        // Alíquota regressiva do IR brasileiro
        let aliquota = 0.15;
        const idadeDias = idadeMeses * 30;
        if (idadeDias <= 180) aliquota = 0.225;
        else if (idadeDias <= 360) aliquota = 0.20;
        else if (idadeDias <= 720) aliquota = 0.175;

        // CDI
        const depBrutoAlt = dep.amount * Math.pow(1 + monthlyAlt, idadeMeses);
        const depRendimentoAlt = depBrutoAlt - dep.amount;
        const depLiquidoAlt = sim1IsTaxFree 
          ? depBrutoAlt 
          : depBrutoAlt - (depRendimentoAlt * aliquota);
        const depLiquidoAltTaxable = depBrutoAlt - (depRendimentoAlt * aliquota);
        altBruto += depBrutoAlt;
        altLiquido += depLiquidoAlt;
        altLiquidoTaxable += depLiquidoAltTaxable;

        // Customizado
        const depBrutoCustom = dep.amount * Math.pow(1 + monthlyCustom, idadeMeses);
        const depRendimentoCustom = depBrutoCustom - dep.amount;
        const depLiquidoCustom = sim1IsTaxFree 
          ? depBrutoCustom 
          : depBrutoCustom - (depRendimentoCustom * aliquota);
        const depLiquidoCustomTaxable = depBrutoCustom - (depRendimentoCustom * aliquota);
        customBruto += depBrutoCustom;
        customLiquido += depLiquidoCustom;
        customLiquidoTaxable += depLiquidoCustomTaxable;
      });

      finalAltLiquidoTaxable = altLiquidoTaxable;
      finalCustomLiquidoTaxable = customLiquidoTaxable;

      // Apenas adicionamos pontos no gráfico em intervalos para não saturar
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
          CustomBruto: Math.round(customBruto),
          CustomLíquido: Math.round(customLiquido),
          IRAvalAlt: Math.round(altBruto - altLiquido),
          IRAvalAltTaxable: Math.round(altBruto - altLiquidoTaxable),
          IRAvalCustom: Math.round(customBruto - customLiquido),
          IRAvalCustomTaxable: Math.round(customBruto - customLiquidoTaxable)
        });
      }
    }

    const finalPoupança = saldoP;
    
    // CDI
    const finalAltLid = chartPoints[chartPoints.length - 1].InvestimentoLíquido;
    const finalAltBruto = chartPoints[chartPoints.length - 1].InvestimentoBruto;
    const irAlt = finalAltBruto - finalAltLid;
    const irAltTaxable = finalAltBruto - finalAltLiquidoTaxable;
    const diff = finalAltLid - finalPoupança;

    // Custom
    const finalCustomLid = chartPoints[chartPoints.length - 1].CustomLíquido;
    const finalCustomBruto = chartPoints[chartPoints.length - 1].CustomBruto;
    const irCustom = finalCustomBruto - finalCustomLid;
    const irCustomTaxable = finalCustomBruto - finalCustomLiquidoTaxable;
    const diffCustom = finalCustomLid - finalPoupança;

    return {
      points: chartPoints,
      totalInvested,
      finalPoupança,
      finalAltLid,
      finalAltBruto,
      irAlt,
      irAltTaxable,
      diff,
      finalCustomLid,
      finalCustomBruto,
      irCustom,
      irCustomTaxable,
      diffCustom,
      cdiAnualNominal: cdiAnual * 100,
    };
  }, [sim1Initial, sim1Monthly, sim1Months, sim1Selic, sim1AltRate, sim1CustomRate, sim1IsTaxFree]);

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
    let tempSaldoSAC = principal;
    let tempSaldoPRICE = principal;

    for (let m = 1; m <= sim2Months; m++) {
      // SAC
      const jurosSAC_m = tempSaldoSAC * iMensal;
      const amortSAC_m = amortSAC;
      const parcSAC_m = amortSAC_m + jurosSAC_m;
      tempSaldoSAC = Math.max(0, tempSaldoSAC - amortSAC_m);

      // PRICE
      const jurosPRICE_m = tempSaldoPRICE * iMensal;
      const amortPRICE_m = parcelaPRICE - jurosPRICE_m;
      tempSaldoPRICE = Math.max(0, tempSaldoPRICE - amortPRICE_m);

      // Para o gráfico vamos amostrar de acordo com o tamanho do prazo
      const shouldPush = sim2Months <= 60 
        ? m % 3 === 0 || m === 1 || m === sim2Months
        : m % 12 === 0 || m === 1 || m === sim2Months;

      if (shouldPush) {
        chartData.push({
          mes: m,
          SAC: Math.round(parcSAC_m),
          PRICE: Math.round(parcelaPRICE),
          saldoSAC: Math.round(tempSaldoSAC),
          saldoPRICE: Math.round(tempSaldoPRICE),
          amortizacaoSAC: Math.round(amortSAC_m),
          jurosSAC: Math.round(jurosSAC_m),
          amortizacaoPRICE: Math.round(amortPRICE_m),
          jurosPRICE: Math.round(jurosPRICE_m),
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

    // --- Fase 1: Acumulação ---
    let saldoAcum = sim3CurrentWealth;
    let totalAportado = sim3CurrentWealth;
    const acumulacaoPoints = [{
      mes: 0,
      idade: sim3Age,
      patrimonio: Math.round(saldoAcum),
      totalAportado: Math.round(totalAportado),
      jurosAcumulados: 0
    }];

    for (let m = 1; m <= mesesAcumulacao; m++) {
      saldoAcum = (saldoAcum + sim3MonthlyContribution) * (1 + rMensalReal);
      totalAportado += sim3MonthlyContribution;

      const shouldPush = mesesAcumulacao <= 120 
        ? m % 12 === 0 || m === mesesAcumulacao
        : m % 24 === 0 || m === mesesAcumulacao;

      if (shouldPush) {
        acumulacaoPoints.push({
          mes: m,
          idade: Math.round(sim3Age + (m / 12)),
          patrimonio: Math.round(saldoAcum),
          totalAportado: Math.round(totalAportado),
          jurosAcumulados: Math.round(Math.max(0, saldoAcum - totalAportado))
        });
      }
    }

    const patrimonioNaAposentadoria = saldoAcum;

    // --- Fase 2: Saque ---
    let saldoSaque = patrimonioNaAposentadoria;
    const saquePoints = [];
    let esgotouIdade: number | null = null;

    // Ponto inicial da fase de saque
    const rendimentoInicial = saldoSaque * rMensalReal;
    saquePoints.push({
      mes: 0,
      idade: sim3RetireAge,
      saldo: Math.round(saldoSaque),
      rendimento: Math.round(rendimentoInicial),
      saque: sim3DesiredIncome,
      consumoPrincipal: Math.round(Math.max(0, sim3DesiredIncome - rendimentoInicial))
    });

    for (let m = 1; m <= mesesUsufruto; m++) {
      if (saldoSaque > 0) {
        const rendimentoMes = saldoSaque * rMensalReal;
        const novoSaldo = (saldoSaque + rendimentoMes) - sim3DesiredIncome;

        if (novoSaldo > 0) {
          saldoSaque = novoSaldo;
        } else {
          saldoSaque = 0;
          if (esgotouIdade === null) {
            esgotouIdade = Math.round(sim3RetireAge + (m / 12));
          }
        }

        const shouldPush = mesesUsufruto <= 120 
          ? m % 12 === 0 || m === mesesUsufruto
          : m % 24 === 0 || m === mesesUsufruto;

        if (shouldPush) {
          saquePoints.push({
            mes: m,
            idade: Math.round(sim3RetireAge + (m / 12)),
            saldo: Math.round(saldoSaque),
            rendimento: Math.round(rendimentoMes),
            saque: sim3DesiredIncome,
            consumoPrincipal: Math.round(Math.max(0, sim3DesiredIncome - rendimentoMes))
          });
        }
      } else {
        const shouldPush = mesesUsufruto <= 120 
          ? m % 12 === 0 || m === mesesUsufruto
          : m % 24 === 0 || m === mesesUsufruto;

        if (shouldPush) {
          saquePoints.push({
            mes: m,
            idade: Math.round(sim3RetireAge + (m / 12)),
            saldo: 0,
            rendimento: 0,
            saque: sim3DesiredIncome,
            consumoPrincipal: sim3DesiredIncome
          });
        }
      }
    }

    const rendaPerpetua = patrimonioNaAposentadoria * rMensalReal;

    return {
      acumulacaoPoints,
      saquePoints,
      patrimonioAposentadoria: patrimonioNaAposentadoria,
      patrimonioFinal: saldoSaque,
      rendaPerpetua,
      esgotouIdade,
      isSustentavel: esgotouIdade === null && saldoSaque > 0,
    };
  }, [sim3Age, sim3RetireAge, sim3LifeExpectancy, sim3CurrentWealth, sim3MonthlyContribution, sim3DesiredIncome, sim3RealRate]);

  // ==========================================
  // CALCULO 4: ALUGUEL X CASA PRÓPRIA FINANCIADA
  // ==========================================
  const sim4Data = useMemo(() => {
    const financiado = sim4PropertyVal - sim4Entry;
    if (financiado <= 0) return { points: [], finalPropWealth: 0, finalRentWealth: 0, tableData: [] };

    const iMensalFin = Math.pow(1 + (sim4Rate / 100), 1/12) - 1;
    const rMensalInvBruto = Math.pow(1 + (sim4InvestmentReturn / 100), 1/12) - 1;
    const inflacaoRentMensal = Math.pow(1 + (sim4RentInflation / 100), 1/12) - 1;
    const appreciationMensal = Math.pow(1 + (sim4PropAppreciation / 100), 1/12) - 1;

    // SAC Amortização
    const amortSAC = financiado / sim4Months;

    // PRICE Amortização
    const parcelaPRICE = financiado * (iMensalFin * Math.pow(1 + iMensalFin, sim4Months)) / (Math.pow(1 + iMensalFin, sim4Months) - 1);
    
    // Aluguel Inicial (utiliza o valor arredondado para inteiros nos cálculos)
    let aluguelM = Math.round(sim4RentInitial);
    
    // Investimento inicial na opção de aluguel (arredondado para inteiros)
    let carteiraAluguel = Math.round(sim4Entry);
    let valorImovel = Math.round(sim4PropertyVal);
    let rendimentoPendente = 0; // Rendimento gerado no mês anterior que entra agora no início do próximo

    // Alíquota inicial do IR nos primeiros 6 meses
    const aliquotaInicial = sim4IsTaxFree ? 0 : 0.225;
    const rMensalInvLiquidoInicial = rMensalInvBruto * (1 - aliquotaInicial);

    // Diferença inicial no mês 1 para o ano 0 (valores arredondados para inteiros)
    const jurosSAC_1 = financiado * iMensalFin;
    const parcelaFin_1 = sim4AmortSystem === 'SAC' ? Math.round(amortSAC + jurosSAC_1) : Math.round(parcelaPRICE);
    const custoExtraImovel_1 = (sim4PropertyVal * (0.5 / 100)) / 12;
    const diferencaInicial = parcelaFin_1 + custoExtraImovel_1 - aluguelM;

    const chartPoints = [{
      mes: 0,
      ComprarImóvel: Math.round(valorImovel),
      AlugarEInvestir: Math.round(carteiraAluguel),
      DiferencaMensal: Math.round(Math.max(0, diferencaInicial)),
    }];

    const tableData: Array<{
      mes: number;
      aluguel: number;
      parcelaFin: number;
      diferenca: number;
      rentabilidade: number;
      totalPagoImovel: number;
      totalPagoAluguel: number;
      carteiraAluguel: number;
      patrimonioImovel: number;
    }> = [];

    let acumuladoImovel = Math.round(sim4Entry);
    let acumuladoAluguel = 0;

    for (let m = 1; m <= sim4TimelineMonths; m++) {
      // 1. Cenário Financiamento (Imóvel Valorizando)
      valorImovel = valorImovel * (1 + appreciationMensal);

      // Parcela do Financiamento no mês - zera após terminar o prazo do financiamento e arredonda para inteiros
      let parcelaFin_m = 0;
      if (m <= sim4Months) {
        if (sim4AmortSystem === 'SAC') {
          const jurosSAC_m = (financiado - amortSAC * (m - 1)) * iMensalFin;
          parcelaFin_m = Math.round(amortSAC + jurosSAC_m);
        } else {
          parcelaFin_m = Math.round(parcelaPRICE);
        }
      }
      
      // Custo extra do imóvel próprio: IPTU + Seguro + Manutenção (estimado 0.5% ao ano)
      const custoExtraImovel = (valorImovel * (0.5 / 100)) / 12;

      const totalMensalComprar = parcelaFin_m + custoExtraImovel;

      // 2. Cenário Aluguel (Aluguel Reajustado e Investimentos)
      // O aluguel reajusta anualmente no início de cada novo ano de contrato (meses 13, 25, 37...) e arredonda para inteiros
      if (m > 1 && (m - 1) % 12 === 0) {
        aluguelM = Math.round(aluguelM * (1 + (sim4RentInflation / 100)));
      }

      // Diferença de custo entre os dois mundos (aporte mensal não pode ser negativo)
      const diferenca = totalMensalComprar - aluguelM;
      const aporteEfetivo = Math.round(Math.max(0, diferenca));

      // Taxa líquida de IR regressivo para o mês m
      const aliquota = sim4IsTaxFree ? 0 : m <= 6 ? 0.225 : m <= 12 ? 0.20 : m <= 24 ? 0.175 : 0.15;
      const rMensalInvLiquido = rMensalInvBruto * (1 - aliquota);

      // Somamos o rendimento pendente gerado no mês anterior ao saldo
      carteiraAluguel = carteiraAluguel + rendimentoPendente;

      // Base de cálculo: carteira acumulada (com rendimento anterior) + aporte do mês m
      const baseParaRendimento = carteiraAluguel + aporteEfetivo;
      
      // Rentabilidade gerada neste mês m sobre a base com o aporte, que será somada só no mês m+1
      const rentabilidadeM = baseParaRendimento * rMensalInvLiquido;
      rendimentoPendente = rentabilidadeM;

      // Saldo exibido na tabela/gráfico do mês m é apenas a base com o aporte (sem o rendimento gerado no próprio mês)
      const saldoExibido = baseParaRendimento;

      // Preparar a carteira para o próximo loop
      carteiraAluguel = baseParaRendimento;

      // Ponto no gráfico (todos os meses)
      chartPoints.push({
        mes: m,
        ComprarImóvel: Math.round(valorImovel),
        AlugarEInvestir: Math.round(Math.max(0, saldoExibido)),
        DiferencaMensal: Math.round(aporteEfetivo),
      });

      // Acumulados para a tabela (acumula entrada + parcelas de financiamento pagas inteiras)
      acumuladoImovel += parcelaFin_m;
      acumuladoAluguel += aluguelM;

      tableData.push({
        mes: m,
        aluguel: aluguelM,
        parcelaFin: parcelaFin_m,
        diferenca: aporteEfetivo,
        rentabilidade: Math.round(rentabilidadeM),
        totalPagoImovel: Math.round(acumuladoImovel),
        totalPagoAluguel: Math.round(acumuladoAluguel),
        carteiraAluguel: Math.round(Math.max(0, saldoExibido)),
        patrimonioImovel: Math.round(valorImovel),
      });
    }

    return {
      points: chartPoints,
      finalPropWealth: valorImovel,
      finalRentWealth: Math.max(0, carteiraAluguel),
      vencedor: valorImovel > carteiraAluguel ? 'comprar' : 'alugar',
      tableData
    };
  }, [sim4PropertyVal, sim4Entry, sim4Rate, sim4Months, sim4RentInitial, sim4RentInflation, sim4PropAppreciation, sim4InvestmentReturn, sim4IsTaxFree, sim4TimelineMonths, sim4AmortSystem]);

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

  // ==========================================
  // CALCULO 6: SIMULADOR DE AMORTIZAÇÃO DE EMPRÉSTIMO/FINANCIAMENTO
  // ==========================================
  const sim6Data = useMemo(() => {
    if (sim6Value <= 0) {
      return {
        points: [],
        tableData: [],
        totalPagoSem: 0,
        totalJurosSem: 0,
        totalPagoCom: 0,
        totalJurosCom: 0,
        totalAportesExtras: 0,
        economiaJuros: 0,
        mesesEconomizados: 0,
        dataQuitacaoSem: '',
        dataQuitacaoCom: '',
        totalPagoEfetivo: 0,
        totalRestanteProjetado: 0,
        valorQuitacaoAtual: 0
      };
    }

    // Extrair startMonth e startYear do sim6StartDate
    let startMonth = 6;
    let startYear = 2026;
    if (sim6StartDate) {
      const parts = sim6StartDate.split('-');
      if (parts.length === 3) {
        startYear = parseInt(parts[0], 10);
        startMonth = parseInt(parts[1], 10);
      }
    }

    const iMensal = Math.pow(1 + (sim6Rate / 100), 1/12) - 1;
    const principal = sim6Value;

    // Helper para formatar a data real no formato mmm de aaaa (ex: jun. de 2026)
    const monthsList = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    const formatMonthYear = (month: number, year: number) => {
      return `${monthsList[month - 1]} de ${year}`;
    };

    // 1. Cenário Padrão (Sem Aportes Extras)
    let saldoSem = principal;
    let jurosAcumSem = 0;
    let totalPagoSem = 0;
    const saldoSemPoints: number[] = [principal];

    const parcelaPRICE_Padrao = (sim6AmortSystem === 'PRICE' && sim6CustomInstallment > 0)
      ? sim6CustomInstallment
      : principal * (iMensal * Math.pow(1 + iMensal, sim6Months)) / (Math.pow(1 + iMensal, sim6Months) - 1);


    for (let m = 1; m <= sim6Months; m++) {
      const jurosM = Math.round(saldoSem * iMensal);
      let amortM = 0;
      let parcelaM = 0;

      if (sim6AmortSystem === 'SAC') {
        const amortRegular = Math.round(principal / sim6Months);
        amortM = Math.min(saldoSem, amortRegular);
        parcelaM = amortM + jurosM;
      } else {
        parcelaM = Math.round(parcelaPRICE_Padrao);
        if (saldoSem + jurosM <= parcelaM) {
          parcelaM = saldoSem + jurosM;
          amortM = saldoSem;
        } else {
          amortM = parcelaM - jurosM;
        }
      }

      saldoSem = Math.max(0, saldoSem - amortM);
      jurosAcumSem += jurosM;
      totalPagoSem += parcelaM;
      saldoSemPoints.push(saldoSem);
    }

    // 2. Cenário Simulado (Com Aportes Extras)
    let saldoCom = principal;
    let jurosAcumCom = 0;
    let totalPagoComRegular = 0;
    let totalAportesExtras = 0;

    const tableData: Array<{
      mes: number;
      dataStr: string;
      parcelaRegular: number;
      juros: number;
      amortRegular: number;
      aporteExtra: number;
      saldoDevedor: number;
      isPaid: boolean;
    }> = [];

    const saldoComPoints: number[] = [principal];
    let m = 1;

    while (saldoCom > 0 && m <= sim6Months * 2) {
      const mActual = (startMonth + m - 2) % 12 + 1;
      const yActual = startYear + Math.floor((startMonth + m - 2) / 12);
      const dataStr = formatMonthYear(mActual, yActual);

      // Determinar aporte extraordinário configurado
      let extraAporteTeorico = 0;
      if (sim6ExtraType === 'single') {
        if (m === sim6ExtraMonth) {
          extraAporteTeorico = sim6ExtraValue;
        }
      } else if (sim6ExtraType === 'recurring') {
        if (sim6ExtraFreq === 'monthly') {
          extraAporteTeorico = sim6ExtraValue;
        } else if (sim6ExtraFreq === 'yearly') {
          if (m % 12 === 0) {
            extraAporteTeorico = sim6ExtraValue;
          }
        }
      }

      // Calcular juros e amortizações teóricos para este mês m
      const jurosM = Math.round(saldoCom * iMensal);
      let amortRegularTeorico = 0;
      let parcelaRegularTeorica = 0;

      if (sim6AmortSystem === 'SAC') {
        if (sim6Goal === 'reduce-time') {
          const amortRegularOriginal = Math.round(principal / sim6Months);
          amortRegularTeorico = Math.min(saldoCom, amortRegularOriginal);
          parcelaRegularTeorica = amortRegularTeorico + jurosM;
        } else {
          // reduce-value
          const mesesRestantes = Math.max(1, sim6Months - m + 1);
          const amortRecalculada = Math.round(saldoCom / mesesRestantes);
          amortRegularTeorico = Math.min(saldoCom, amortRecalculada);
          parcelaRegularTeorica = amortRegularTeorico + jurosM;
        }
      } else {
        // PRICE
        if (sim6Goal === 'reduce-time') {
          parcelaRegularTeorica = Math.round(parcelaPRICE_Padrao);
          if (saldoCom + jurosM <= parcelaRegularTeorica) {
            parcelaRegularTeorica = saldoCom + jurosM;
            amortRegularTeorico = saldoCom;
          } else {
            amortRegularTeorico = parcelaRegularTeorica - jurosM;
          }
        } else {
          // reduce-value
          const mesesRestantes = Math.max(1, sim6Months - m + 1);
          let parcelaRecalculada = 0;
          if (mesesRestantes > 1) {
            parcelaRecalculada = Math.round(saldoCom * (iMensal * Math.pow(1 + iMensal, mesesRestantes)) / (Math.pow(1 + iMensal, mesesRestantes) - 1));
          } else {
            parcelaRecalculada = saldoCom + jurosM;
          }

          parcelaRegularTeorica = parcelaRecalculada;
          if (saldoCom + jurosM <= parcelaRegularTeorica) {
            parcelaRegularTeorica = saldoCom + jurosM;
            amortRegularTeorico = saldoCom;
          } else {
            amortRegularTeorico = parcelaRegularTeorica - jurosM;
          }
        }
      }

      // Rastrear histórico real de baixas de parcelas
      const paymentState = sim6PaymentsState[m];
      const isPaid = !!paymentState?.isPaid;

      let parcelaRegularFinal = 0;
      let jurosFinal = 0;
      let amortRegularFinal = 0;
      let aporteExtraFinal = 0;

      if (isPaid) {
        // Usar valores reais inseridos pelo usuário ou herdados
        const valorRegularReal = paymentState.customAmountPaid !== undefined ? paymentState.customAmountPaid : parcelaRegularTeorica;
        const aporteExtraReal = paymentState.customExtraPaid !== undefined ? paymentState.customExtraPaid : Math.round(extraAporteTeorico);

        // Abater juros do pagamento regular primeiro
        const jurosPagosReal = Math.min(jurosM, valorRegularReal);
        const amortRegularReal = Math.max(0, valorRegularReal - jurosPagosReal);

        parcelaRegularFinal = valorRegularReal;
        jurosFinal = jurosPagosReal;
        amortRegularFinal = Math.min(saldoCom, amortRegularReal);

        saldoCom = Math.max(0, saldoCom - amortRegularFinal);

        // Aporte extra abate o saldo restante
        aporteExtraFinal = Math.min(saldoCom, Math.round(aporteExtraReal));
        saldoCom = Math.max(0, saldoCom - aporteExtraFinal);
      } else {
        // Usar projeção teórica simulada
        parcelaRegularFinal = parcelaRegularTeorica;
        jurosFinal = jurosM;
        amortRegularFinal = amortRegularTeorico;

        saldoCom = Math.max(0, saldoCom - amortRegularFinal);

        aporteExtraFinal = Math.min(saldoCom, Math.round(extraAporteTeorico));
        saldoCom = Math.max(0, saldoCom - aporteExtraFinal);
      }

      jurosAcumCom += jurosFinal;
      totalPagoComRegular += parcelaRegularFinal;
      totalAportesExtras += aporteExtraFinal;

      tableData.push({
        mes: m,
        dataStr,
        parcelaRegular: parcelaRegularFinal,
        juros: jurosFinal,
        amortRegular: amortRegularFinal,
        aporteExtra: aporteExtraFinal,
        saldoDevedor: saldoCom,
        isPaid
      });

      saldoComPoints.push(saldoCom);

      if (saldoCom <= 0) {
        break;
      }

      m++;
    }

    // Gerar pontos de gráfico
    const chartPoints = [];
    const maxMeses = Math.max(sim6Months, tableData.length);

    for (let i = 0; i <= maxMeses; i++) {
      const shouldPush = maxMeses <= 60 
        ? true 
        : maxMeses <= 120 
          ? i % 3 === 0 || i === 0 || i === maxMeses
          : i % 12 === 0 || i === 0 || i === maxMeses;

      if (shouldPush) {
        const sSem = i < saldoSemPoints.length ? saldoSemPoints[i] : 0;
        const sCom = i < saldoComPoints.length ? saldoComPoints[i] : 0;
        chartPoints.push({
          mes: i,
          'Sem Aportes': sSem,
          'Com Aportes': sCom,
        });
      }
    }

    // Datas de quitação
    const semEndM = (startMonth + sim6Months - 2) % 12 + 1;
    const semEndY = startYear + Math.floor((startMonth + sim6Months - 2) / 12);
    const dataQuitacaoSem = formatMonthYear(semEndM, semEndY);

    const comEndM = (startMonth + tableData.length - 2) % 12 + 1;
    const comEndY = startYear + Math.floor((startMonth + tableData.length - 2) / 12);
    const dataQuitacaoCom = formatMonthYear(comEndM, comEndY);

    // Calcular valores de quitação e totais efetivos vs projetados
    let totalPagoEfetivo = 0;
    let totalRestanteProjetado = 0;
    let lastPaidMonthIndex = -1;

    for (let i = 0; i < tableData.length; i++) {
      const d = tableData[i];
      if (d.isPaid) {
        totalPagoEfetivo += d.parcelaRegular + d.aporteExtra;
        lastPaidMonthIndex = i;
      } else {
        totalRestanteProjetado += d.parcelaRegular + d.aporteExtra;
      }
    }

    const valorQuitacaoAtual = lastPaidMonthIndex !== -1 
      ? tableData[lastPaidMonthIndex].saldoDevedor 
      : principal;

    const economiaJuros = jurosAcumSem - jurosAcumCom;
    const mesesEconomizados = Math.max(0, sim6Months - tableData.length);

    return {
      points: chartPoints,
      tableData,
      totalPagoSem,
      totalJurosSem: jurosAcumSem,
      totalPagoCom: totalPagoEfetivo + totalRestanteProjetado,
      totalJurosCom: jurosAcumCom,
      totalAportesExtras,
      economiaJuros,
      mesesEconomizados,
      dataQuitacaoSem,
      dataQuitacaoCom,
      totalPagoEfetivo,
      totalRestanteProjetado,
      valorQuitacaoAtual
    };
  }, [sim6Value, sim6Rate, sim6Months, sim6StartDate, sim6AmortSystem, sim6ExtraType, sim6ExtraValue, sim6ExtraMonth, sim6ExtraFreq, sim6Goal, sim6PaymentsState, sim6CustomInstallment]);


  // Resetar período da tabela se o prazo for encurtado e o período atual extrapolar (Simulador 6)
  React.useEffect(() => {
    const totalMonths = sim6Data.tableData.length;
    const totalPeriods = Math.ceil(totalMonths / 60);
    if (sim6SelectedPeriod >= totalPeriods) {
      setSim6SelectedPeriod(0);
    }
  }, [sim6Data.tableData.length, sim6SelectedPeriod]);


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
          { id: 'amortization', label: 'Amortização Extra', icon: ArrowLeftRight },
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
                  <PercentInput 
                    label="Taxa Selic Estimada (% a.a.)"
                    value={sim1Selic}
                    onChange={setSim1Selic}
                    suffix="% a.a."
                  />
                  {/* Banner informativo dinâmico da poupança */}
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-primary">
                      <Info size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Regra da Poupança</span>
                    </div>
                    {sim1Selic > 8.5 ? (
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Selic em <strong className="text-slate-900 dark:text-white">{sim1Selic.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.</strong> (acima de 8,5% a.a.). A rentabilidade da poupança é de <strong className="text-slate-900 dark:text-white">0,5% ao mês</strong> (~6,17% ao ano) + Taxa Referencial (TR).
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Selic em <strong className="text-slate-900 dark:text-white">{sim1Selic.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.</strong> (igual/menor que 8,5% a.a.). A rentabilidade cai para <strong className="text-slate-900 dark:text-white">70% da Selic</strong> (~{(sim1Selic * 0.7).toFixed(2).replace('.', ',')}% ao ano) + Taxa Referencial (TR).
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <PercentInput 
                    label="Rendimento Alternativo (% do CDI)"
                    value={sim1AltRate}
                    onChange={setSim1AltRate}
                    suffix="% do CDI"
                  />
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                    sim1UseCustomRate ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border/50 hover:bg-muted/20"
                  )}
                  onClick={() => setSim1UseCustomRate(!sim1UseCustomRate)}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Simular Taxa Alternativa?</span>
                    <span className={cn("text-xs font-bold", sim1UseCustomRate ? "text-primary" : "text-muted-foreground/60")}>
                      {sim1UseCustomRate ? 'Ativado' : 'Desativado'}
                    </span>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    sim1UseCustomRate ? "bg-primary" : "bg-muted-foreground/30"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                      sim1UseCustomRate ? "left-7" : "left-1"
                    )} />
                  </div>
                </div>

                {sim1UseCustomRate && (
                  <div className="space-y-2 border border-border bg-muted/10 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <PercentInput 
                      label="Taxa Alternativa Customizada (% a.a.)"
                      value={sim1CustomRate}
                      onChange={setSim1CustomRate}
                      suffix="% a.a."
                    />
                    <input type="range" min="0" max="30" step="0.5" value={sim1CustomRate} onChange={e => setSim1CustomRate(Number(e.target.value))} className="premium-slider" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                    sim1IsTaxFree ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border/50 hover:bg-muted/20"
                  )}
                  onClick={() => setSim1IsTaxFree(!sim1IsTaxFree)}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Investimento Isento de IR?</span>
                    <span className={cn("text-xs font-bold", sim1IsTaxFree ? "text-primary" : "text-muted-foreground/60")}>
                      {sim1IsTaxFree ? 'Isento (LCI / LCA)' : 'Tributável (CDB)'}
                    </span>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    sim1IsTaxFree ? "bg-primary" : "bg-muted-foreground/30"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                      sim1IsTaxFree ? "left-7" : "left-1"
                    )} />
                  </div>
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
                  <PercentInput 
                    label="Taxa de Juros (% a.a.)"
                    value={sim2Rate}
                    onChange={setSim2Rate}
                    suffix="% a.a."
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
                  <PercentInput 
                    label="Rentabilidade Real (% a.a.)"
                    value={sim3RealRate}
                    onChange={setSim3RealRate}
                    suffix="% a.a."
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acima da inflação estimada</p>
                </div>
              </div>
            )}

            {/* PAINEL DE INPUTS PARA SIMULADOR 4 */}
            {activeSim === 'rent-vs-buy' && (
              <div className="space-y-6">
                {/* SEÇÃO 1: FINANCIAMENTO DO IMÓVEL */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block border-b border-border/10 pb-1">
                    1. Compra & Financiamento
                  </span>
                  
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
                      <PercentInput 
                        label="Juros Fin. (% a.a.)"
                        value={sim4Rate}
                        onChange={setSim4Rate}
                        suffix="% a.a."
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
                    <PercentInput 
                      label="Valorização Anual Imóvel (% a.a.)"
                      value={sim4PropAppreciation}
                      onChange={setSim4PropAppreciation}
                      suffix="% a.a."
                    />
                  </div>

                  {/* Sistema de Amortização */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                      Tabela de Financiamento
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1 rounded-xl border border-border/50">
                      <button
                        type="button"
                        onClick={() => setSim4AmortSystem('SAC')}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          sim4AmortSystem === 'SAC'
                            ? "bg-primary text-white shadow-md shadow-primary/15"
                            : "text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        SAC
                      </button>
                      <button
                        type="button"
                        onClick={() => setSim4AmortSystem('PRICE')}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          sim4AmortSystem === 'PRICE'
                            ? "bg-primary text-white shadow-md shadow-primary/15"
                            : "text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        PRICE
                      </button>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: ALUGUEL */}
                <div className="space-y-4 pt-2 border-t border-border/20">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block border-b border-border/10 pb-1">
                    2. Aluguel
                  </span>

                  <div className="space-y-2">
                    <CurrencyInput 
                      label="Aluguel Inicial (R$)"
                      value={sim4RentInitial}
                      onChange={setSim4RentInitial}
                    />
                  </div>

                  <div className="space-y-2">
                    <PercentInput 
                      label="Reajuste Anual Aluguel (% a.a.)"
                      value={sim4RentInflation}
                      onChange={setSim4RentInflation}
                      suffix="% a.a."
                    />
                  </div>
                </div>

                {/* SEÇÃO 3: INVESTIMENTO */}
                <div className="space-y-4 pt-2 border-t border-border/20">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block border-b border-border/10 pb-1">
                    3. Investimento
                  </span>

                  <div className="space-y-2">
                    <PercentInput 
                      label="Rendimento Investimentos (% a.a.)"
                      value={sim4InvestmentReturn}
                      onChange={setSim4InvestmentReturn}
                      suffix="% a.a."
                    />
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Taxa nominal anual bruta</p>
                  </div>

                  {/* Toggle Isento de IR */}
                  <div className="pt-2">
                    <div 
                      onClick={() => setSim4IsTaxFree(!sim4IsTaxFree)}
                      className={cn(
                        "p-3 rounded-xl border border-border/60 transition-all flex flex-col gap-1.5 cursor-pointer select-none",
                        sim4IsTaxFree
                          ? "bg-primary/5 border-primary/40 text-primary"
                          : "bg-muted/10 border-border/50 text-muted-foreground hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                          Isento de Imposto de Renda
                        </span>
                        {/* Pílula Deslizante */}
                        <div className="w-12 h-6 bg-muted rounded-full relative p-1 transition-colors border border-border/20">
                          <div 
                            className={cn(
                              "w-4 h-4 rounded-full transition-all duration-300 absolute top-1",
                              sim4IsTaxFree 
                                ? "bg-primary left-7" 
                                : "bg-muted-foreground/30 left-1"
                            )}
                          />
                        </div>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">
                        {sim4IsTaxFree ? "Isento (LCI / LCA)" : "Tributável (CDB com IR regressivo)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 4: TEMPO DE PROJEÇÃO */}
                <div className="space-y-4 pt-2 border-t border-border/20">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block border-b border-border/10 pb-1">
                    4. Tempo de Projeção
                  </span>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Visualizar Simulação por (Meses)</label>
                    <input 
                      type="number" 
                      min={sim4Months}
                      value={sim4TimelineMonths} 
                      onChange={e => setSim4TimelineMonths(Math.max(sim4Months, Number(e.target.value)))} 
                      className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                    />
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Mínimo permitido: {sim4Months} meses (prazo do financiamento)
                    </p>
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
                    <PercentInput 
                      label="Juros Fin. (% a.a.)"
                      value={sim5FinRate}
                      onChange={setSim5FinRate}
                      suffix="% a.a."
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
                  <PercentInput 
                    label="Taxa Adm. Consórcio (%)"
                    value={sim5ConsFee}
                    onChange={setSim5ConsFee}
                    suffix="%"
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

            {/* PAINEL DE INPUTS PARA SIMULADOR 6 */}
            {activeSim === 'amortization' && (
              <div className="space-y-6">
                {(() => {
                  const mesesDoAno = [
                    { value: 1, label: 'Janeiro' },
                    { value: 2, label: 'Fevereiro' },
                    { value: 3, label: 'Março' },
                    { value: 4, label: 'Abril' },
                    { value: 5, label: 'Maio' },
                    { value: 6, label: 'Junho' },
                    { value: 7, label: 'Julho' },
                    { value: 8, label: 'Agosto' },
                    { value: 9, label: 'Setembro' },
                    { value: 10, label: 'Outubro' },
                    { value: 11, label: 'Novembro' },
                    { value: 12, label: 'Dezembro' }
                  ];
                  const anosLista = Array.from({ length: 27 }, (_, i) => 2024 + i);

                  return (
                    <div className="space-y-6">
                       <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block border-b border-border/10 pb-1">
                          1. Financiamento Base
                        </span>

                        {/* Tabela de Financiamento */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                            Tabela de Financiamento
                          </label>
                          <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1 rounded-xl border border-border/50">
                            <button
                              type="button"
                              onClick={() => setSim6AmortSystem('SAC')}
                              className={cn(
                                "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                sim6AmortSystem === 'SAC'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/30"
                              )}
                            >
                              SAC
                            </button>
                            <button
                              type="button"
                              onClick={() => setSim6AmortSystem('PRICE')}
                              className={cn(
                                "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                sim6AmortSystem === 'PRICE'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/30"
                              )}
                            >
                              PRICE
                            </button>
                          </div>
                        </div>

                        {/* Valor Financiado */}
                        <div className="space-y-2">
                          <CurrencyInput 
                            label="Valor Financiado (R$)"
                            value={sim6Value}
                            onChange={setSim6Value}
                          />
                        </div>

                        {/* Parcela PRICE manual opcional */}
                        {sim6AmortSystem === 'PRICE' && (
                          <div className="space-y-2">
                            <CurrencyInput 
                              label="Valor da Parcela Fixa (Banco - Opcional)"
                              value={sim6CustomInstallment}
                              onChange={setSim6CustomInstallment}
                            />
                            <p className="text-[10px] text-muted-foreground ml-2">
                              Deixe em R$ 0,00 para calcular automaticamente. Preencha para corresponder exatamente ao extrato do banco.
                            </p>
                          </div>
                        )}

                        {/* Taxa de Juros e Prazo */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <PercentInput 
                              label="Taxa de Juros (% a.a.)"
                              value={sim6Rate}
                              onChange={setSim6Rate}
                              suffix="% a.a."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Prazo (Meses)</label>
                            <input 
                              type="number" 
                              value={sim6Months} 
                              onChange={e => setSim6Months(Number(e.target.value))} 
                              className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                            />
                          </div>
                        </div>
                        <input type="range" min="12" max="420" step="12" value={sim6Months} onChange={e => setSim6Months(Number(e.target.value))} className="premium-slider" />

                        {/* Data de início por Calendário */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                            Data de Início
                          </label>
                          <input 
                            type="date"
                            value={sim6StartDate}
                            onChange={e => setSim6StartDate(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border/20">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block border-b border-border/10 pb-1">
                          2. Amortização Extra
                        </span>

                        {/* Objetivo da Amortização */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                            Objetivo do Aporte Extra
                          </label>
                          <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1 rounded-xl border border-border/50">
                            <button
                              type="button"
                              onClick={() => setSim6Goal('reduce-time')}
                              className={cn(
                                "py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all leading-tight",
                                sim6Goal === 'reduce-time'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/30"
                              )}
                            >
                              Reduzir Tempo
                            </button>
                            <button
                              type="button"
                              onClick={() => setSim6Goal('reduce-value')}
                              className={cn(
                                "py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all leading-tight",
                                sim6Goal === 'reduce-value'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/30"
                              )}
                            >
                              Reduzir Parcela
                            </button>
                          </div>
                        </div>

                        {/* Tipo de Aporte Extra */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                            Tipo de Amortização Extra
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 bg-muted/20 p-1 rounded-xl border border-border/50">
                            <button
                              type="button"
                              onClick={() => setSim6ExtraType('none')}
                              className={cn(
                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                sim6ExtraType === 'none'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/20"
                              )}
                            >
                              Nenhum
                            </button>
                            <button
                              type="button"
                              onClick={() => setSim6ExtraType('single')}
                              className={cn(
                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                sim6ExtraType === 'single'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/20"
                              )}
                            >
                              Único
                            </button>
                            <button
                              type="button"
                              onClick={() => setSim6ExtraType('recurring')}
                              className={cn(
                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                sim6ExtraType === 'recurring'
                                  ? "bg-primary text-white shadow-md shadow-primary/15"
                                  : "text-muted-foreground hover:bg-muted/20"
                              )}
                            >
                              Recorrente
                            </button>
                          </div>
                        </div>

                        {/* Inputs específicos do tipo de aporte */}
                        {sim6ExtraType !== 'none' && (
                          <div className="space-y-4 bg-muted/10 p-4 rounded-2xl border border-border/60 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                              <CurrencyInput 
                                label="Valor do Aporte Extra (R$)"
                                value={sim6ExtraValue}
                                onChange={setSim6ExtraValue}
                              />
                            </div>

                            {sim6ExtraType === 'single' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                                  Aplicar no Mês (nº)
                                </label>
                                <input 
                                  type="number" 
                                  min="1"
                                  max={sim6Months}
                                  value={sim6ExtraMonth} 
                                  onChange={e => setSim6ExtraMonth(Math.min(sim6Months, Math.max(1, Number(e.target.value))))} 
                                  className="w-full bg-muted/30 border border-border rounded-xl h-12 px-4 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-bold"
                                />
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  Mês de 1 a {sim6Months}
                                </p>
                              </div>
                            )}

                            {sim6ExtraType === 'recurring' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 block">
                                  Frequência da Recorrência
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1 rounded-xl border border-border/50">
                                  <button
                                    type="button"
                                    onClick={() => setSim6ExtraFreq('monthly')}
                                    className={cn(
                                      "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                      sim6ExtraFreq === 'monthly'
                                        ? "bg-primary text-white shadow-md shadow-primary/15"
                                        : "text-muted-foreground hover:bg-muted/30"
                                    )}
                                  >
                                    Mensal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSim6ExtraFreq('yearly')}
                                    className={cn(
                                      "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                      sim6ExtraFreq === 'yearly'
                                        ? "bg-primary text-white shadow-md shadow-primary/15"
                                        : "text-muted-foreground hover:bg-muted/30"
                                    )}
                                  >
                                    Anual
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DE RESULTADOS E GRÁFICOS (2/3 de espaço) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* CARDS DE SUMÁRIO DO SIMULADOR ATIVO */}
          <div className={cn("grid grid-cols-1 gap-4", activeSim === 'investments' ? (sim1UseCustomRate ? "sm:grid-cols-4" : "sm:grid-cols-3") : (activeSim === 'amortization' ? "sm:grid-cols-4" : "sm:grid-cols-3"))}>
            {activeSim === 'investments' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Investido</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(sim1Data.totalInvested)}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Saldo na Poupança</p>
                  <div>
                    <p className="text-xl font-black text-rose-500">{formatCurrency(sim1Data.finalPoupança)}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 leading-normal">
                      {sim1Selic > 8.5 
                        ? "Rendimento: 0,5% a.m. (~6,17% a.a.) + TR" 
                        : `Rendimento: 70% da Selic (~${(sim1Selic * 0.7).toFixed(2)}% a.a.) + TR`}
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Saldo Invest. CDI</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(sim1Data.finalAltLid)}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Taxa: {sim1AltRate}% do CDI</p>
                </div>
                {sim1UseCustomRate && (
                  <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Saldo Invest. Custom</p>
                    <p className="text-xl font-black text-amber-500">{formatCurrency(sim1Data.finalCustomLid)}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Taxa: {sim1CustomRate}% a.a.</p>
                  </div>
                )}
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

            {activeSim === 'amortization' && (
              <>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Economia de Juros</p>
                  <div>
                    <p className="text-xl font-black text-emerald-500">{formatCurrency(sim6Data.economiaJuros)}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 leading-normal">
                      Evitou pagar em juros no cenário com aportes
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tempo Economizado</p>
                  <div>
                    <p className="text-xl font-black text-primary">
                      {sim6Data.mesesEconomizados} {sim6Data.mesesEconomizados === 1 ? 'mês' : 'meses'}
                    </p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 leading-normal">
                      Redução de {Math.floor(sim6Data.mesesEconomizados / 12)} anos e {sim6Data.mesesEconomizados % 12} meses no contrato
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Nova Quitação</p>
                  <div>
                    <p className="text-xl font-black text-sky-500">{sim6Data.dataQuitacaoCom}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 leading-normal">
                      Original: {sim6Data.dataQuitacaoSem} ({sim6Months} meses)
                    </p>
                  </div>
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
            {/* GRÁFICOS DO RECHARTS */}
            {activeSim === 'retirement' && (
              <div className="space-y-10">
                {/* 1. Fase de Acumulação */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Fase de Acumulação</h4>
                    <p className="text-xs text-muted-foreground">Crescimento do patrimônio sob juros compostos da idade atual até a idade de aposentadoria.</p>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sim3Data.acumulacaoPoints} margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPatrimonioAcum" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="idade" tickFormatter={(v) => `${v} anos`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis width={60} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-card/90 border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2.5">
                                  <p className="font-black uppercase tracking-widest text-muted-foreground">Idade: {data.idade} anos</p>
                                  <div className="space-y-1.5 font-medium">
                                    <div className="flex justify-between gap-6 font-bold text-slate-900 dark:text-white border-b border-border pb-1 mb-1">
                                      <span>Patrimônio Total:</span>
                                      <span>{formatCurrency(data.patrimonio)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                      <span className="text-slate-500">Total Aportado:</span>
                                      <span className="font-semibold text-slate-700 dark:text-slate-350">{formatCurrency(data.totalAportado)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                      <span className="text-amber-500 font-bold">Juros Acumulados:</span>
                                      <span className="font-semibold text-amber-500">{formatCurrency(data.jurosAcumulados)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Area type="linear" name="Patrimônio Total" dataKey="patrimonio" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorPatrimonioAcum)" />
                        <Area type="linear" name="Total Aportado" dataKey="totalAportado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Fase de Saque */}
                <div className="space-y-4 pt-6 border-t border-border/60">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Fase de Saque (Usufruto)</h4>
                    <p className="text-xs text-muted-foreground">Consumo do patrimônio acumulado sob o efeito de saques mensais e rendimentos contínuos.</p>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sim3Data.saquePoints} margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPatrimonioSaque" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="idade" tickFormatter={(v) => `${v} anos`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis width={60} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const rendSuficiente = data.rendimento >= data.saque;
                              return (
                                <div className="bg-card/90 border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2.5">
                                  <p className="font-black uppercase tracking-widest text-muted-foreground">Idade: {data.idade} anos</p>
                                  <div className="space-y-1.5 font-medium">
                                    <div className="flex justify-between gap-6 font-bold text-slate-900 dark:text-white border-b border-border pb-1 mb-1">
                                      <span>Saldo do Patrimônio:</span>
                                      <span>{formatCurrency(data.saldo)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                      <span className="text-emerald-500 font-bold">Rendimento Mensal:</span>
                                      <span className="font-semibold text-emerald-500">{formatCurrency(data.rendimento)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                      <span className="text-slate-500">Saque Mensal:</span>
                                      <span className="font-semibold text-slate-750 dark:text-slate-350">{formatCurrency(data.saque)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6 border-t border-dashed border-border pt-1">
                                      <span className={rendSuficiente ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                                        {rendSuficiente ? "Sustentado pelos Juros" : "Consumo do Principal:"}
                                      </span>
                                      <span className={rendSuficiente ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                                        {rendSuficiente ? "R$ 0,00" : formatCurrency(data.consumoPrincipal)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Area type="linear" name="Saldo Restante" dataKey="saldo" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPatrimonioSaque)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeSim !== 'financing' && activeSim !== 'retirement' && (
              <div className="h-[320px] w-full">
                {activeSim === 'investments' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sim1Data.points} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPoupança" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card/90 border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2.5">
                                <p className="font-black uppercase tracking-widest text-muted-foreground">Mês {data.mes}</p>
                                <div className="space-y-1.5 font-medium">
                                  <div className="flex justify-between gap-6">
                                    <span className="text-muted-foreground">Capital Investido:</span>
                                    <span className="font-bold text-foreground">{formatCurrency(data.Investido)}</span>
                                  </div>
                                  <div className="flex justify-between gap-6">
                                    <span className="text-rose-500 font-bold">Poupança:</span>
                                    <span className="font-bold text-rose-500">{formatCurrency(data.Poupança)}</span>
                                  </div>
                                  <div className="border-t border-border pt-1.5">
                                    <div className="flex justify-between gap-6">
                                      <span className="text-emerald-500 font-bold">Invest. CDI (Líquido):</span>
                                      <span className="font-bold text-emerald-500">{formatCurrency(data.InvestimentoLíquido)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6 text-[10px] text-muted-foreground">
                                      <span>IR Retido Acumulado:</span>
                                      <span>
                                        {sim1IsTaxFree 
                                          ? `Isento (Economia: ${formatCurrency(data.IRAvalAltTaxable)})` 
                                          : formatCurrency(data.IRAvalAlt)}
                                      </span>
                                    </div>
                                  </div>
                                  {sim1UseCustomRate && (
                                    <div className="border-t border-border pt-1.5 font-medium text-xs">
                                      <div className="flex justify-between gap-6">
                                        <span className="text-amber-500 font-bold">Invest. Custom (Líquido):</span>
                                        <span className="font-bold text-amber-500">{formatCurrency(data.CustomLíquido)}</span>
                                      </div>
                                      <div className="flex justify-between gap-6 text-[10px] text-muted-foreground">
                                        <span>IR Retido Acumulado:</span>
                                        <span>
                                          {sim1IsTaxFree 
                                            ? `Isento (Economia: ${formatCurrency(data.IRAvalCustomTaxable)})` 
                                            : formatCurrency(data.IRAvalCustom)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Area type="monotone" name="Investimento CDI (Líquido)" dataKey="InvestimentoLíquido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAlt)" />
                      {sim1UseCustomRate && (
                        <Area type="monotone" name="Investimento Customizado (Líquido)" dataKey="CustomLíquido" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorCustom)" />
                      )}
                      <Area type="monotone" name="Caderneta de Poupança" dataKey="Poupança" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPoupança)" />
                      <Area type="monotone" name="Capital Investido" dataKey="Investido" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeSim === 'rent-vs-buy' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sim4Data.points} margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
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
                      <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      
                      {/* Eixo Esquerdo: Valores de Patrimônio */}
                      <YAxis yAxisId="left" tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      
                      {/* Eixo Direito: Diferença Mensal de Aporte (Financiamento - Aluguel) */}
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      
                      <Tooltip formatter={(value: any, name: any) => {
                        return [formatCurrency(value), name];
                      }} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" name="Patrimônio Imóvel Próprio" dataKey="ComprarImóvel" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorCompra)" />
                      <Area yAxisId="left" type="monotone" name="Carteira Aluguel & Investimentos" dataKey="AlugarEInvestir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAluguel)" />
                      <Line yAxisId="right" type="monotone" name="Diferença Mensal (Aporte)" dataKey="DiferencaMensal" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
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

                {activeSim === 'amortization' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sim6Data.points} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmortSem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAmortCom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Area type="linear" name="Saldo Devedor Padrão" dataKey="Sem Aportes" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorAmortSem)" />
                      <Area type="linear" name="Saldo Devedor com Aportes" dataKey="Com Aportes" stroke="#10b981" strokeWidth={3} fill="url(#colorAmortCom)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {activeSim === 'financing' && (
              <div className="space-y-10">
                {/* 1. Evolução das Parcelas */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Evolução das Parcelas</h4>
                    <p className="text-xs text-muted-foreground">Prestação mensal ao longo do tempo nos sistemas SAC e PRICE.</p>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sim2Data.chartData} margin={{ top: 10, right: 10, left: 65, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis width={65} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                        <Line type="linear" name="SAC (Decrescente)" dataKey="SAC" stroke="#f59e0b" strokeWidth={3} dot={false} />
                        <Line type="linear" name="PRICE (Constante)" dataKey="PRICE" stroke="#10b981" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Tabela Comparativa */}
                <div className="bg-muted/10 border border-border p-6 rounded-[2rem] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Tabela Comparativa SAC vs PRICE</h4>
                      <p className="text-xs text-muted-foreground">Análise direta das parcelas, juros e custo total do financiamento.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        {sim2Data.sacJuros <= sim2Data.priceJuros 
                          ? `SAC é mais vantajosa (Economia de ${formatCurrency(sim2Data.priceJuros - sim2Data.sacJuros)})` 
                          : `PRICE é mais vantajosa (Economia de ${formatCurrency(sim2Data.sacJuros - sim2Data.priceJuros)})`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          <th className="py-3 px-4">Métrica</th>
                          <th className="py-3 px-4 text-right">SAC (Amortização Constante)</th>
                          <th className="py-3 px-4 text-right">PRICE (Tabela Price)</th>
                          <th className="py-3 px-4 text-right">Diferença</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        <tr>
                          <td className="py-3 px-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">1ª Parcela (Inicial)</td>
                          <td className="py-3 px-4 text-right text-foreground font-semibold">{formatCurrency(sim2Data.sacPrimeira)}</td>
                          <td className="py-3 px-4 text-right text-foreground font-semibold">{formatCurrency(sim2Data.priceParcela)}</td>
                          <td className="py-3 px-4 text-right font-black text-rose-500">
                            {sim2Data.sacPrimeira > sim2Data.priceParcela 
                              ? `+${formatCurrency(sim2Data.sacPrimeira - sim2Data.priceParcela)} (SAC)`
                              : `+${formatCurrency(sim2Data.priceParcela - sim2Data.sacPrimeira)} (PRICE)`
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Última Parcela (Final)</td>
                          <td className="py-3 px-4 text-right text-foreground font-semibold">{formatCurrency(sim2Data.sacUltima)}</td>
                          <td className="py-3 px-4 text-right text-foreground font-semibold">{formatCurrency(sim2Data.priceParcela)}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-500">
                            {sim2Data.sacUltima < sim2Data.priceParcela 
                              ? `-${formatCurrency(sim2Data.priceParcela - sim2Data.sacUltima)} (SAC)`
                              : `-${formatCurrency(sim2Data.sacUltima - sim2Data.priceParcela)} (PRICE)`
                            }
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Total de Juros</td>
                          <td className="py-3 px-4 text-right text-amber-500 font-bold">{formatCurrency(sim2Data.sacJuros)}</td>
                          <td className="py-3 px-4 text-right text-rose-500 font-bold">{formatCurrency(sim2Data.priceJuros)}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-500">
                            {sim2Data.sacJuros < sim2Data.priceJuros 
                              ? `-${formatCurrency(sim2Data.priceJuros - sim2Data.sacJuros)} (SAC)`
                              : `-${formatCurrency(sim2Data.sacJuros - sim2Data.priceJuros)} (PRICE)`
                            }
                          </td>
                        </tr>
                        <tr className="bg-muted/30">
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Custo Total Pago</td>
                          <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-black">{formatCurrency(sim2Data.sacTotal)}</td>
                          <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-black">{formatCurrency(sim2Data.priceTotal)}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-500">
                            {sim2Data.sacTotal < sim2Data.priceTotal 
                              ? `-${formatCurrency(sim2Data.priceTotal - sim2Data.sacTotal)} (SAC)`
                              : `-${formatCurrency(sim2Data.sacTotal - sim2Data.priceTotal)} (PRICE)`
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Evolução do Saldo Devedor */}
                <div className="space-y-4 pt-6 border-t border-border/60">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Evolução do Saldo Devedor</h4>
                    <p className="text-xs text-muted-foreground">Velocidade de amortização do saldo devedor ao longo do prazo do financiamento.</p>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sim2Data.chartData} margin={{ top: 10, right: 10, left: 65, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="mes" tickFormatter={(v) => `Mês ${v}`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis width={65} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                        <Area type="linear" name="Saldo Devedor SAC" dataKey="saldoSAC" stroke="#f59e0b" strokeWidth={3} fill="#f59e0b" fillOpacity={0.15} />
                        <Area type="linear" name="Saldo Devedor PRICE" dataKey="saldoPRICE" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Composição da Parcela */}
                <div className="space-y-4 pt-6 border-t border-border/60">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Composição da Parcela (Amortização vs Juros)</h4>
                    <p className="text-xs text-muted-foreground">Como o valor de cada parcela é dividido entre o abatimento da dívida (amortização) e os encargos (juros).</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gráfico SAC */}
                    <div className="space-y-2 bg-muted/5 border border-border/55 p-4 rounded-2xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1 block">Tabela SAC: Parcelas Decrescentes</span>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sim2Data.chartData} margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="mes" tickFormatter={(v) => `M ${v}`} tick={{ fontSize: 9 }} />
                            <YAxis width={60} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} tick={{ fontSize: 9 }} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-card/90 border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2.5">
                                      <p className="font-black uppercase tracking-widest text-muted-foreground">Mês {data.mes}</p>
                                      <div className="space-y-1.5 font-medium">
                                        <div className="flex justify-between gap-6 font-bold text-slate-900 dark:text-white border-b border-border pb-1 mb-1">
                                          <span>Valor da Parcela:</span>
                                          <span>{formatCurrency(data.SAC)}</span>
                                        </div>
                                        <div className="flex justify-between gap-6">
                                          <span className="text-emerald-500 font-bold">Amortização:</span>
                                          <span className="font-semibold text-emerald-500">{formatCurrency(data.amortizacaoSAC)}</span>
                                        </div>
                                        <div className="flex justify-between gap-6">
                                          <span className="text-rose-500 font-bold">Juros:</span>
                                          <span className="font-semibold text-rose-500">{formatCurrency(data.jurosSAC)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Area type="linear" name="Amortização" dataKey="amortizacaoSAC" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                            <Area type="linear" name="Juros" dataKey="jurosSAC" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gráfico PRICE */}
                    <div className="space-y-2 bg-muted/5 border border-border/55 p-4 rounded-2xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1 block">Tabela PRICE: Parcelas Fixas</span>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sim2Data.chartData} margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="mes" tickFormatter={(v) => `M ${v}`} tick={{ fontSize: 9 }} />
                            <YAxis width={60} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} tick={{ fontSize: 9 }} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-card/90 border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2.5">
                                      <p className="font-black uppercase tracking-widest text-muted-foreground">Mês {data.mes}</p>
                                      <div className="space-y-1.5 font-medium">
                                        <div className="flex justify-between gap-6 font-bold text-slate-900 dark:text-white border-b border-border pb-1 mb-1">
                                          <span>Valor da Parcela:</span>
                                          <span>{formatCurrency(data.PRICE)}</span>
                                        </div>
                                        <div className="flex justify-between gap-6">
                                          <span className="text-emerald-500 font-bold">Amortização:</span>
                                          <span className="font-semibold text-emerald-500">{formatCurrency(data.amortizacaoPRICE)}</span>
                                        </div>
                                        <div className="flex justify-between gap-6">
                                          <span className="text-rose-500 font-bold">Juros:</span>
                                          <span className="font-semibold text-rose-500">{formatCurrency(data.jurosPRICE)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Area type="linear" name="Amortização" dataKey="amortizacaoPRICE" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                            <Area type="linear" name="Juros" dataKey="jurosPRICE" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETALHAMENTOS DE CONCLUSÃO FINANCEIRA DO PROJETO */}
            <div className="mt-8 border-t border-border pt-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Info size={16} className="text-primary" /> Relatório de Diagnóstico
              </h4>

              {activeSim === 'investments' && (
                <div className="bg-muted/30 border border-border p-5 rounded-2xl space-y-5">
                  <div className="space-y-2 leading-relaxed">
                    {sim1UseCustomRate ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">
                          Aplicando a taxa Selic estimada de <strong className="text-slate-950 dark:text-white">{sim1Selic.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.</strong>, analisamos dois cenários de investimento em comparação à Caderneta de Poupança:
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                          <li>
                            <strong>Investimento CDI:</strong> Rendendo {sim1AltRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% do CDI (rentabilidade nominal de {sim1Data.cdiAnualNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.).
                          </li>
                          <li>
                            <strong>Investimento Taxa Customizada:</strong> Rendendo a taxa de {sim1CustomRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.
                          </li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">
                          Aplicando a taxa Selic estimada de <strong className="text-slate-950 dark:text-white">{sim1Selic.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.</strong>, analisamos o cenário de investimento em comparação à Caderneta de Poupança:
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                          <li>
                            <strong>Investimento CDI:</strong> Rendendo {sim1AltRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% do CDI (rentabilidade nominal de {sim1Data.cdiAnualNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}% a.a.).
                          </li>
                        </ul>
                      </>
                    )}
                  </div>

                  <div className={cn("grid grid-cols-1 gap-4 border-t border-border pt-4", sim1UseCustomRate ? "md:grid-cols-3" : "md:grid-cols-1")}>
                    {/* Cenário 1: CDI */}
                    <div className="bg-card p-4 rounded-xl border border-border space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-2">Cenário 1: Investimento CDI</span>
                        <div className="text-xs text-muted-foreground space-y-1.5">
                          <div className="flex justify-between">
                            <span>Rendimento Bruto:</span>
                            <span className="font-semibold text-foreground">{formatCurrency(sim1Data.finalAltBruto - sim1Data.totalInvested)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-[10px]">
                            <span>(-) Imposto de Renda (IR):</span>
                            <span className="text-rose-500">
                              {sim1IsTaxFree 
                                ? "Isento (R$ 0,00)" 
                                : `-${formatCurrency(sim1Data.irAlt)}`}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-border pt-1 font-bold text-foreground">
                            <span>(=) Subtotal (Rend. Líquido):</span>
                            <span>{formatCurrency(sim1Data.finalAltLid - sim1Data.totalInvested)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span>(-) Rendimento Poupança:</span>
                            <span className="text-rose-500">-{formatCurrency(sim1Data.finalPoupança - sim1Data.totalInvested)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-border pt-1.5 mt-2">
                        <span className="text-emerald-500 font-bold text-[10px] uppercase">Diferença vs Poupança:</span>
                        <span className="font-black text-emerald-500">+{formatCurrency(sim1Data.diff)}</span>
                      </div>
                    </div>

                    {/* Cenário 2: Taxa Customizada */}
                    {sim1UseCustomRate && (
                      <div className="bg-card p-4 rounded-xl border border-border space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-2">Cenário 2: Investimento Customizado</span>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <div className="flex justify-between">
                              <span>Rendimento Bruto:</span>
                              <span className="font-semibold text-foreground">{formatCurrency(sim1Data.finalCustomBruto - sim1Data.totalInvested)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-[10px]">
                              <span>(-) Imposto de Renda (IR):</span>
                              <span className="text-rose-500">
                                {sim1IsTaxFree 
                                  ? "Isento (R$ 0,00)" 
                                  : `-${formatCurrency(sim1Data.irCustom)}`}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-border pt-1 font-bold text-foreground">
                              <span>(=) Subtotal (Rend. Líquido):</span>
                              <span>{formatCurrency(sim1Data.finalCustomLid - sim1Data.totalInvested)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span>(-) Rendimento Poupança:</span>
                              <span className="text-rose-500">-{formatCurrency(sim1Data.finalPoupança - sim1Data.totalInvested)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-border pt-1.5 mt-2">
                          <span className="text-amber-500 font-bold text-[10px] uppercase">Diferença vs Poupança:</span>
                          <span className="font-black text-amber-500">+{formatCurrency(sim1Data.diffCustom)}</span>
                        </div>
                      </div>
                    )}

                    {/* Cenário 3: Comparativo Customizado vs CDI */}
                    {sim1UseCustomRate && (
                      <div className="bg-card p-4 rounded-xl border border-border space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2">Cenário 3: Customizado vs CDI</span>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <div className="flex justify-between">
                              <span>Rend. Líquido CDI:</span>
                              <span className="font-semibold text-emerald-500">{formatCurrency(sim1Data.finalAltLid - sim1Data.totalInvested)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rend. Líquido Customizado:</span>
                              <span className="font-semibold text-amber-500">{formatCurrency(sim1Data.finalCustomLid - sim1Data.totalInvested)}</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-border pt-1.5 font-bold text-foreground">
                              <span>Mais Vantajoso:</span>
                              {sim1Data.finalCustomLid >= sim1Data.finalAltLid ? (
                                <span className="text-amber-500 font-black">Invest. Customizado</span>
                              ) : (
                                <span className="text-emerald-500 font-black">Invest. CDI</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-border pt-1.5 mt-2">
                          <span className="text-primary font-bold text-[10px] uppercase">Diferença Líquida:</span>
                          <span className="font-black text-primary">
                            {formatCurrency(Math.abs(sim1Data.finalCustomLid - sim1Data.finalAltLid))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 text-xs text-muted-foreground border-t border-border pt-4">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-2">Resumo dos Rendimentos (Líquidos):</p>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">
                        Total Aportado no Período: <span className="text-slate-950 dark:text-white font-black">{formatCurrency(sim1Data.totalInvested)}</span>
                      </div>

                      <span className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-rose-500 shrink-0" />
                        Poupança: <strong>{formatCurrency(sim1Data.finalPoupança - sim1Data.totalInvested)}</strong>
                        <span className="text-[10px] font-medium text-muted-foreground ml-1">
                          (Total na Poupança: {formatCurrency(sim1Data.finalPoupança)})
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                        Investimento CDI {sim1IsTaxFree ? '(Isento)' : '(após IR)'}: <strong>{formatCurrency(sim1Data.finalAltLid - sim1Data.totalInvested)}</strong>
                        <span className="text-[10px] font-medium text-muted-foreground ml-1">
                          (Total no CDI: {formatCurrency(sim1Data.finalAltLid)})
                        </span>
                      </span>
                      {sim1UseCustomRate && (
                        <span className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-amber-500 shrink-0" />
                          Investimento Customizado {sim1IsTaxFree ? '(Isento)' : '(após IR)'}: <strong>{formatCurrency(sim1Data.finalCustomLid - sim1Data.totalInvested)}</strong>
                          <span className="text-[10px] font-medium text-muted-foreground ml-1">
                            (Total na Taxa Alternativa: {formatCurrency(sim1Data.finalCustomLid)})
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 border-t border-border/60 pt-3">
                      <p className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-2">Comparativo de Saldo Final Acumulado (Patrimônio Total):</p>
                      <span className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-rose-500 shrink-0" />
                        Saldo Final Poupança: <strong>{formatCurrency(sim1Data.finalPoupança)}</strong>
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                        Saldo Final Investimento CDI: <strong>{formatCurrency(sim1Data.finalAltLid)}</strong>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 ml-1">
                          (Saldo a mais que a Poupança: +{formatCurrency(sim1Data.diff)})
                        </span>
                      </span>
                      {sim1UseCustomRate && (
                        <span className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-amber-500 shrink-0" />
                          Saldo Final Investimento Customizado: <strong>{formatCurrency(sim1Data.finalCustomLid)}</strong>
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 ml-1">
                            (Saldo a mais que a Poupança: +{formatCurrency(sim1Data.diffCustom)})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSim === 'financing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Card SAC */}
                  <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[2rem] space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
                      Sistema SAC (Amortização Constante)
                    </span>
                    <h5 className="text-sm font-black text-slate-900 dark:text-white">Amortização Rápida e Custo Menor</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No sistema <strong className="text-amber-600 dark:text-amber-400">SAC</strong>, a amortização da dívida é igual em todas as parcelas. O valor da prestação cai mês a mês porque os juros são calculados sobre um saldo devedor que diminui rapidamente.
                    </p>
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 space-y-2.5 bg-amber-500/10 p-4 rounded-xl border border-amber-500/10 font-medium">
                      <div>
                        <p className="font-black uppercase text-[8px] tracking-wider mb-1">Características principais:</p>
                        <p>• Parcelas iniciais mais altas, decrescentes mês a mês</p>
                        <p>• Menor acúmulo de juros total ao longo do prazo contratual</p>
                      </div>
                      <div>
                        <p className="font-bold text-amber-800 dark:text-amber-200 uppercase text-[8px] tracking-wider mb-1">Quando é utilizado:</p>
                        <p>• Financiamentos habitacionais/imobiliários de longo prazo</p>
                        <p>• Quando o cliente pode pagar parcelas maiores no início do contrato</p>
                        <p>• Estruturas focadas em economizar significativamente no custo de juros final</p>
                      </div>
                      <div>
                        <p className="font-bold text-amber-900 dark:text-amber-100 uppercase text-[8px] tracking-wider mb-1">Pontos de Atenção:</p>
                        <p>• Prestações iniciais pesadas exigem maior fluxo de caixa de início</p>
                        <p>• Pode requerer comprovação de renda maior para aprovação do crédito inicial</p>
                      </div>
                    </div>
                  </div>

                  {/* Card PRICE */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem] space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">
                      Sistema PRICE (Tabela Francesa)
                    </span>
                    <h5 className="text-sm font-black text-slate-900 dark:text-white">Parcelas Previsíveis e Custo Maior</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No sistema <strong className="text-emerald-600 dark:text-emerald-400">PRICE</strong>, as prestações são fixas até o final do financiamento. Nas primeiras parcelas, a maior parte do pagamento vai para os juros, amortizando muito pouco do saldo devedor inicial.
                    </p>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 space-y-2.5 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/10 font-medium">
                      <div>
                        <p className="font-black uppercase text-[8px] tracking-wider mb-1">Características principais:</p>
                        <p>• Parcelas fixas e previsíveis da primeira à última prestação</p>
                        <p>• Amortização muito lenta da dívida nos anos/meses iniciais</p>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-200 uppercase text-[8px] tracking-wider mb-1">Quando é utilizado:</p>
                        <p>• Financiamento de veículos, empréstimos pessoais e crediários gerais</p>
                        <p>• Quando o cliente necessita de parcelas iniciais menores que caibam no orçamento</p>
                        <p>• Quando a previsibilidade orçamentária mensal absoluta é fundamental</p>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-100 uppercase text-[8px] tracking-wider mb-1">Pontos de Atenção:</p>
                        <p>• Custo total de juros pagos acumulados substancialmente superior à tabela SAC</p>
                        <p>• Quitações antecipadas precoces são menos vantajosas por amortizarem pouco saldo devedor</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSim === 'retirement' && (
                <div className="bg-muted/30 border border-border p-6 rounded-[2rem] space-y-5">
                  <div className="space-y-3 leading-relaxed">
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Resumo da Projeção de Aposentadoria:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="bg-card p-4 rounded-xl border border-border space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">Parâmetros da Fase de Acumulação</span>
                        <p>• Idade atual de início: <strong className="text-slate-900 dark:text-white">{sim3Age} anos</strong></p>
                        <p>• Tempo de acumulação: <strong className="text-slate-900 dark:text-white">{sim3RetireAge - sim3Age} anos ({ (sim3RetireAge - sim3Age) * 12 } meses)</strong></p>
                        <p>• Aportes mensais programados: <strong className="text-slate-900 dark:text-white">{formatCurrency(sim3MonthlyContribution)}</strong></p>
                        <p>• Patrimônio estimado ao se aposentar: <strong className="text-slate-900 dark:text-white font-black text-amber-500">{formatCurrency(sim3Data.patrimonioAposentadoria)}</strong></p>
                      </div>
                      
                      <div className="bg-card p-4 rounded-xl border border-border space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Parâmetros da Fase de Saque (Usufruto)</span>
                        <p>• Idade de início dos saques: <strong className="text-slate-900 dark:text-white">{sim3RetireAge} anos</strong></p>
                        <p>• Expectativa de planejamento de vida: <strong className="text-slate-900 dark:text-white">{sim3LifeExpectancy} anos</strong></p>
                        <p>• Rendimento médio mensal estimado: <strong className="text-emerald-500 font-bold">{formatCurrency(sim3Data.patrimonioAposentadoria * (Math.pow(1 + (sim3RealRate / 100), 1/12) - 1))}</strong></p>
                        <p>• Renda mensal desejada (saque programado): <strong className="text-slate-900 dark:text-white">{formatCurrency(sim3DesiredIncome)}</strong></p>
                      </div>
                    </div>
                  </div>

                  {sim3Data.isSustentavel ? (
                    <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium space-y-1">
                        <p className="font-bold text-sm">Patrimônio Sustentável e Perpétuo!</p>
                        <p>
                          O rendimento mensal estimado do seu patrimônio acumulado (<strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(sim3Data.patrimonioAposentadoria * (Math.pow(1 + (sim3RealRate / 100), 1/12) - 1))}</strong>) é superior ao seu saque programado (<strong className="text-slate-900 dark:text-white">{formatCurrency(sim3DesiredIncome)}</strong>).
                        </p>
                        <p>
                          Como você está retirando menos do que os juros gerados, o seu montante principal de <strong className="text-slate-900 dark:text-white">{formatCurrency(sim3Data.patrimonioAposentadoria)}</strong> não sofrerá redução ao longo do tempo, mantendo-se inteiramente preservado para herdeiros ou perpetuidade.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                      <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-rose-800 dark:text-rose-300 font-medium space-y-1">
                        <p className="font-bold text-sm">Atenção: Consumo do Principal!</p>
                        <p>
                          O seu saque mensal desejado (<strong className="text-rose-600 dark:text-rose-400">{formatCurrency(sim3DesiredIncome)}</strong>) é maior do que o rendimento mensal gerado pelo capital acumulado (<strong className="text-slate-900 dark:text-white">{formatCurrency(sim3Data.patrimonioAposentadoria * (Math.pow(1 + (sim3RealRate / 100), 1/12) - 1))}</strong>).
                        </p>
                        <p>
                          Isso fará com que o saldo principal seja consumido mensalmente para cobrir a diferença de <strong className="text-rose-700 dark:text-rose-400 font-bold">{formatCurrency(sim3DesiredIncome - (sim3Data.patrimonioAposentadoria * (Math.pow(1 + (sim3RealRate / 100), 1/12) - 1)))}</strong>.
                        </p>
                        <p>
                          O capital acumulado irá se esgotar totalmente aos <strong className="text-rose-600 dark:text-rose-400 font-black">{sim3Data.esgotouIdade} anos</strong>. Recomenda-se aumentar os aportes na fase de acumulação, adiar a aposentadoria ou reduzir o saque mensal para garantir a durabilidade desejada até os {sim3LifeExpectancy} anos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSim === 'rent-vs-buy' && (
                <div className="space-y-6">
                  {/* Relatório Conceitual Melhorado */}
                  {(() => {
                    // 1. Até quando vai conseguir investir a diferença
                    let ultimoMesAporte = 0;
                    for (let i = 0; i < sim4Data.tableData.length; i++) {
                      if (sim4Data.tableData[i].diferenca > 0) {
                        ultimoMesAporte = sim4Data.tableData[i].mes;
                      }
                    }

                    // 2. Momento da virada
                    let mesVirada: number | null = null;
                    for (let i = 0; i < sim4Data.tableData.length; i++) {
                      const d = sim4Data.tableData[i];
                      if (d.carteiraAluguel > d.patrimonioImovel) {
                        mesVirada = d.mes;
                        break;
                      }
                    }

                    // 3. Marcos de rentabilidade
                    const marcosRentabilidade: Array<{ valor: number; mes: number }> = [];
                    const maxRentabilidade = sim4Data.tableData.reduce((max, d) => Math.max(max, d.rentabilidade), 0);
                    let proximoAlvo = 1000;
                    for (let i = 0; i < sim4Data.tableData.length; i++) {
                      const rent = sim4Data.tableData[i].rentabilidade;
                      if (rent >= proximoAlvo) {
                        marcosRentabilidade.push({ valor: proximoAlvo, mes: sim4Data.tableData[i].mes });
                        proximoAlvo += 1000;
                        if (proximoAlvo > maxRentabilidade) break;
                      }
                    }

                    return (
                      <div className="bg-card border border-border p-6 rounded-[2rem] space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                          <TrendingUp className="text-primary" size={20} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              Diagnóstico Comparativo de Longo Prazo
                            </h4>
                            <p className="text-[10px] text-muted-foreground">
                              Análise consultiva com projeções patrimoniais e marcos de rentabilidade
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Bloco 1: Conclusão Geral */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                              Patrimônio Final Estimado
                            </span>
                            <div className="text-xs text-muted-foreground space-y-2.5 font-medium">
                              <p>
                                • Opção Compra (Imóvel Físico): Ao final de {sim4TimelineMonths} meses, você possuirá um patrimônio imobiliário valorizado em <strong className="text-foreground">{formatCurrency(sim4Data.finalPropWealth)}</strong>.
                              </p>
                              <p>
                                • Opção Aluguel (Carteira Investida): O acúmulo da entrada e dos apósitos de diferença mensal gerará uma carteira líquida de <strong className="text-foreground">{formatCurrency(sim4Data.finalRentWealth)}</strong>.
                              </p>
                              <div className={cn(
                                "p-4 rounded-xl border font-medium mt-3",
                                sim4Data.vencedor === 'comprar'
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                                  : "bg-primary/10 border-primary/20 text-slate-800 dark:text-slate-200"
                              )}>
                                A opção mais vantajosa financeiramente no período é <strong className="font-black underline">{sim4Data.vencedor === 'comprar' ? 'Comprar o Imóvel Próprio' : 'Alugar e Investir a Diferença'}</strong>, resultando em uma vantagem patrimonial de <strong className="font-black">{formatCurrency(Math.abs(sim4Data.finalPropWealth - sim4Data.finalRentWealth))}</strong>.
                              </div>
                            </div>
                          </div>

                          {/* Bloco 2: Linha do Tempo de Aportes e Comparação */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                              Dinâmica de Fluxo de Caixa e Virada
                            </span>
                            <div className="text-xs text-muted-foreground space-y-2.5 font-medium">
                              <p>
                                • Prazo do Financiamento: As parcelas do imóvel próprio se encerram no mês {sim4Months} (Ano {Math.ceil(sim4Months / 12)}). A partir do mês {sim4Months + 1}, o custo de moradia do comprador é reduzido apenas à taxa de manutenção e IPTU.
                              </p>
                              
                              {ultimoMesAporte > 0 ? (
                                <p>
                                  • Período de Aportes: Você conseguirá investir a diferença mensal (financiamento maior que o aluguel) até o <strong className="text-foreground">Mês {ultimoMesAporte} (Ano {Math.ceil(ultimoMesAporte / 12)})</strong>. A partir desse mês, o aluguel inflacionado supera a parcela do financiamento próprio, zerando a capacidade de novos aportes adicionais.
                                </p>
                              ) : (
                                <p>
                                  • Período de Aportes: O valor do aluguel inicial já é superior ou igual ao custo mensal da compra própria (parcela + manutenção), de modo que o simulador assume aporte de R$ 0,00 adicionais desde o início, crescendo a carteira apenas por juros compostos.
                                </p>
                              )}

                              {mesVirada !== null ? (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl">
                                  • Momento da Virada Patrimonial: A carteira de investimentos da opção aluguel supera o valor valorizado do imóvel físico a partir do <strong className="font-black text-amber-700 dark:text-amber-400">Mês {mesVirada} (Ano {Math.ceil(mesVirada / 12)})</strong>.
                                </div>
                              ) : (
                                <p>
                                  • Momento da Virada Patrimonial: A carteira de investimentos na opção aluguel <strong className="text-foreground">nunca supera</strong> o valor do imóvel próprio dentro do horizonte de visualização de {sim4TimelineMonths} meses.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bloco 3: Marcos de Rentabilidade Mensal */}
                        {marcosRentabilidade.length > 0 && (
                          <div className="border-t border-border pt-4 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                              Marcos de Renda Passiva Gerada (Cenário Aluguel + Investimentos)
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <p className="mb-2">
                                Confira quando a sua carteira acumulada de investimentos atingirá determinados níveis de rentabilidade líquida mensal (renda passiva):
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {marcosRentabilidade.map((marco) => (
                                  <div key={marco.valor} className="bg-muted/40 p-3 rounded-xl border border-border/60 text-center flex flex-col justify-center">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Renda Mensal de</span>
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(marco.valor)}</span>
                                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1">
                                      No Mês {marco.mes} (Ano {Math.ceil(marco.mes / 12)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Tabela Detalhada com Filtro */}
                  {(() => {
                    const totalMonths = sim4TimelineMonths;
                    const monthsPerPeriod = 60; // 5 anos
                    const numPeriods = Math.ceil(totalMonths / monthsPerPeriod);
                    
                    const periodOptions = Array.from({ length: numPeriods }, (_, i) => {
                      const startYear = i * 5 + 1;
                      const endYear = Math.min((i + 1) * 5, Math.ceil(totalMonths / 12));
                      const label = startYear === endYear ? `Ano ${startYear}` : `Anos ${startYear} a ${endYear}`;
                      return {
                        index: i,
                        label,
                        startMonth: i * monthsPerPeriod + 1,
                        endMonth: Math.min((i + 1) * monthsPerPeriod, totalMonths)
                      };
                    });

                    const activePeriodOption = periodOptions[sim4SelectedPeriod] || periodOptions[0];
                    const filteredTableData = activePeriodOption 
                      ? sim4Data.tableData.filter(d => d.mes >= activePeriodOption.startMonth && d.mes <= activePeriodOption.endMonth)
                      : [];

                    return (
                      <div className="space-y-4 pt-4 border-t border-border/20">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">
                            Detalhamento Mês a Mês
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Acompanhe os custos detalhados e os acumulados filtrando de 5 em 5 anos.
                          </p>
                        </div>

                        {/* Botões do Filtro */}
                        <div className="flex flex-wrap gap-2">
                          {periodOptions.map((opt) => (
                            <button
                              key={opt.index}
                              onClick={() => setSim4SelectedPeriod(opt.index)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                sim4SelectedPeriod === opt.index
                                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Tabela Detalhada */}
                        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40 max-h-[400px] custom-scrollbar">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-muted/50 border-b border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground sticky top-0 backdrop-blur-md">
                                <th className="py-3 px-4 text-center w-16">Mês</th>
                                <th className="py-3 px-4">Aluguel (mês)</th>
                                <th className="py-3 px-4">Financiamento (mês)</th>
                                <th className="py-3 px-4">Investido (mês)</th>
                                <th className="py-3 px-4">Carteira Acum.</th>
                                <th className="py-3 px-4">Rent. Gerada (mês)</th>
                                <th className="py-3 px-4">Patrimônio Próprio</th>
                                <th className="py-3 px-4">Acum. Imóvel</th>
                                <th className="py-3 px-4">Acum. Aluguel</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 font-medium">
                              {filteredTableData.map((d) => (
                                <tr key={d.mes} className="hover:bg-muted/30 transition-colors">
                                  <td className="py-2.5 px-4 text-center font-bold text-muted-foreground bg-muted/10">{d.mes}</td>
                                  <td className="py-2.5 px-4 text-rose-500/80">{formatCurrency(d.aluguel)}</td>
                                  <td className="py-2.5 px-4 text-amber-500/80">{formatCurrency(d.parcelaFin)}</td>
                                  <td className={cn(
                                    "py-2.5 px-4 font-bold",
                                    d.diferenca >= 0 ? "text-emerald-500" : "text-rose-500"
                                  )}>
                                    {d.diferenca >= 0 ? '+' : ''}{formatCurrency(d.diferenca)}
                                  </td>
                                  <td className="py-2.5 px-4 text-primary font-bold">{formatCurrency(d.carteiraAluguel)}</td>
                                  <td className="py-2.5 px-4 text-sky-500 font-bold">{formatCurrency(d.rentabilidade)}</td>
                                  <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(d.patrimonioImovel)}</td>
                                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{formatCurrency(d.totalPagoImovel)}</td>
                                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{formatCurrency(d.totalPagoAluguel)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
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

              {activeSim === 'amortization' && (
                <div className="space-y-6">
                  {/* Relatório Conceitual da Amortização */}
                  <div className="bg-card border border-border p-6 rounded-[2rem] space-y-5 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                      <TrendingUp className="text-primary" size={20} />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Diagnóstico da Amortização Extraordinária
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          Projeção consultiva dos efeitos financeiros dos seus aportes extras
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-muted-foreground font-medium leading-relaxed">
                      {/* Lado esquerdo: Resultados chave */}
                      <div className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                          Resumo Comparativo dos Cenários
                        </span>
                        <div className="space-y-2">
                          <p>
                            • Cenário Regular (Sem Aportes): O financiamento é quitado em <strong className="text-slate-900 dark:text-white">{sim6Months} parcelas</strong> ({Math.floor(sim6Months / 12)} anos e {sim6Months % 12} meses), com a quitação em <strong className="text-slate-900 dark:text-white">{sim6Data.dataQuitacaoSem}</strong>. O custo de juros totaliza <strong className="text-rose-500 font-bold">{formatCurrency(sim6Data.totalJurosSem)}</strong>, para um custo total pago de <strong className="text-foreground">{formatCurrency(sim6Data.totalPagoSem)}</strong>.
                          </p>
                          <p>
                            • Cenário Acelerado (Com Aportes): Com as amortizações extras simuladas, o prazo de quitação cai para <strong className="text-emerald-500 font-black">{sim6Data.tableData.length} parcelas</strong>, antecipando o encerramento do contrato para <strong className="text-emerald-500 font-black">{sim6Data.dataQuitacaoCom}</strong>. O custo de juros cai para <strong className="text-emerald-500 font-bold">{formatCurrency(sim6Data.totalJurosCom)}</strong>, totalizando um custo final pago (regular + extra) de <strong className="text-foreground">{formatCurrency(sim6Data.totalPagoCom)}</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Lado direito: Análise consultiva */}
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2">
                            Análise de Impacto Financeiro
                          </span>
                          <p className="mb-2">
                            Ao antecipar pagamentos abatendo o saldo devedor diretamente, você deixa de pagar juros futuros sobre esse saldo amortizado.
                          </p>
                          <p className="mb-2">
                            • Economia Financeira Líquida: Você deixa de pagar <strong className="text-emerald-500 font-bold">{formatCurrency(sim6Data.economiaJuros)}</strong> em juros ao banco.
                          </p>
                          <p>
                            • Redução de Prazo: O contrato é encerrado <strong className="text-emerald-500 font-bold">{sim6Data.mesesEconomizados} meses mais cedo</strong>. Isso representa uma liberação de fluxo de caixa mensal no valor de <strong className="text-slate-900 dark:text-white">{sim6AmortSystem === 'SAC' ? 'até ' + formatCurrency(sim6Value / sim6Months + sim6Value * (Math.pow(1 + (sim6Rate / 100), 1/12) - 1)) : formatCurrency(sim6Data.totalPagoSem / sim6Months)}</strong> mensais que não precisarão mais ser gastos.
                          </p>
                        </div>
                        {sim6Goal === 'reduce-value' && (
                          <div className="p-3 bg-primary/5 border border-primary/25 rounded-xl text-[11px]">
                            • Redução de Parcela: Seu objetivo está configurado para reduzir o valor das próximas parcelas. Conforme você faz aportes extras, as parcelas subsequentes são recalculadas e ficam sucessivamente menores, aliviando o orçamento mensal embora mantendo o prazo final do contrato.
                          </div>
                        )}
                        {sim6Goal === 'reduce-time' && (
                          <div className="p-3 bg-primary/5 border border-primary/25 rounded-xl text-[11px]">
                            • Redução de Tempo (Recomendado): Seu objetivo está configurado para manter a parcela regular no padrão do contrato e reduzir o prazo final. Esta opção maximiza a economia de juros compostos a longo prazo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabela Detalhada com Filtro */}
                  {(() => {
                    const totalMonths = sim6Data.tableData.length;
                    const monthsPerPeriod = 60; // 5 anos
                    const numPeriods = Math.ceil(totalMonths / monthsPerPeriod);
                    
                    const periodOptions = Array.from({ length: numPeriods }, (_, i) => {
                      const startYear = i * 5 + 1;
                      const endYear = Math.min((i + 1) * 5, Math.ceil(totalMonths / 12));
                      const label = startYear === endYear ? `Ano ${startYear}` : `Anos ${startYear} a ${endYear}`;
                      return {
                        index: i,
                        label,
                        startMonth: i * monthsPerPeriod + 1,
                        endMonth: Math.min((i + 1) * monthsPerPeriod, totalMonths)
                      };
                    });

                    const activePeriodOption = periodOptions[sim6SelectedPeriod] || periodOptions[0];
                    const filteredTableData = activePeriodOption 
                      ? sim6Data.tableData.filter(d => d.mes >= activePeriodOption.startMonth && d.mes <= activePeriodOption.endMonth)
                      : [];

                    return (
                      <div className="space-y-4 pt-4 border-t border-border/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">
                              Evolução Detalhada do Financiamento Acelerado
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Consulte o saldo devedor e os pagamentos realizados mês a mês filtrando de 5 em 5 anos.
                            </p>
                          </div>
                          {sim6Data.totalAportesExtras > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                              Aportes Extras Acumulados: {formatCurrency(sim6Data.totalAportesExtras)}
                            </span>
                          )}
                        </div>

                        {/* Botões do Filtro */}
                        <div className="flex flex-wrap gap-2">
                          {periodOptions.map((opt) => (
                            <button
                              key={opt.index}
                              onClick={() => setSim6SelectedPeriod(opt.index)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                sim6SelectedPeriod === opt.index
                                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Tabela Detalhada */}
                        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40 max-h-[400px] custom-scrollbar">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-muted/50 border-b border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground sticky top-0 backdrop-blur-md">
                                <th className="py-3 px-4 text-center w-16">Status</th>
                                <th className="py-3 px-4 text-center w-16">Mês</th>
                                <th className="py-3 px-4">Vencimento</th>
                                <th className="py-3 px-4">Parcela Regular</th>
                                <th className="py-3 px-4">Juros (mês)</th>
                                <th className="py-3 px-4">Amort. Regular</th>
                                <th className="py-3 px-4">Aporte Extra</th>
                                <th className="py-3 px-4">Saldo Devedor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 font-medium">
                              {filteredTableData.map((d) => (
                                <tr key={d.mes} className={cn("hover:bg-muted/30 transition-colors", d.isPaid && "bg-emerald-500/5 dark:bg-emerald-500/10")}>
                                  <td className="py-2.5 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => togglePaymentPaid(d.mes)}
                                      className="focus:outline-none transition-transform active:scale-95 flex items-center justify-center mx-auto"
                                      title={d.isPaid ? "Marcar como pendente" : "Marcar como pago/amortizado"}
                                    >
                                      {d.isPaid ? (
                                        <CheckCircle className="text-emerald-500 hover:text-emerald-600 transition-colors" size={18} />
                                      ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-colors" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-bold text-muted-foreground bg-muted/10">{d.mes}</td>
                                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-350">{d.dataStr}</td>
                                  <td className="py-2.5 px-4">
                                    {d.isPaid ? (
                                      <div className="relative flex items-center w-28">
                                        <span className="absolute left-2 text-[10px] text-muted-foreground/60 select-none">R$</span>
                                        <input
                                          type="text"
                                          value={(sim6PaymentsState[d.mes]?.customAmountPaid !== undefined 
                                            ? sim6PaymentsState[d.mes].customAmountPaid 
                                            : d.parcelaRegular
                                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          onChange={(e) => {
                                            const cleanVal = e.target.value.replace(/\D/g, '');
                                            const numVal = cleanVal ? parseFloat(cleanVal) / 100 : 0;
                                            updateCustomAmountPaid(d.mes, numVal);
                                          }}
                                          className="w-full bg-muted/30 border border-border/80 rounded-lg h-8 pl-7 pr-2 text-xs text-foreground outline-none focus:border-primary font-bold transition-all"
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-foreground font-semibold">{formatCurrency(d.parcelaRegular)}</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-rose-500/80">{formatCurrency(d.juros)}</td>
                                  <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">{formatCurrency(d.amortRegular)}</td>
                                  <td className="py-2.5 px-4">
                                    {d.isPaid ? (
                                      <div className="relative flex items-center w-28">
                                        <span className="absolute left-2 text-[10px] text-muted-foreground/60 select-none">R$</span>
                                        <input
                                          type="text"
                                          value={(sim6PaymentsState[d.mes]?.customExtraPaid !== undefined 
                                            ? sim6PaymentsState[d.mes].customExtraPaid 
                                            : d.aporteExtra
                                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          onChange={(e) => {
                                            const cleanVal = e.target.value.replace(/\D/g, '');
                                            const numVal = cleanVal ? parseFloat(cleanVal) / 100 : 0;
                                            updateCustomExtraPaid(d.mes, numVal);
                                          }}
                                          className="w-full bg-muted/30 border border-border/80 rounded-lg h-8 pl-7 pr-2 text-xs text-foreground outline-none focus:border-primary font-bold transition-all"
                                        />
                                      </div>
                                    ) : (
                                      <span className={cn(
                                        "font-bold",
                                        d.aporteExtra > 0 ? "text-amber-500" : "text-muted-foreground/40"
                                      )}>
                                        {d.aporteExtra > 0 ? `+${formatCurrency(d.aporteExtra)}` : 'R$ 0,00'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-primary font-bold">{formatCurrency(d.saldoDevedor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
