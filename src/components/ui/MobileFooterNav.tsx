import React from 'react';
import { Wallet, Plus, Tags } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileFooterNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTransactionModal: () => void;
  className?: string;
}

export const MobileFooterNav: React.FC<MobileFooterNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenTransactionModal,
  className
}) => {
  return (
    <div className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]",
      className
    )}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {/* Cartões e Carteiras */}
        <button
          onClick={() => setActiveTab('wallets')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-all",
            activeTab === 'wallets' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "p-1 rounded-xl transition-all",
            activeTab === 'wallets' && "bg-primary/10"
          )}>
            <Wallet size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Carteiras</span>
        </button>

        {/* Realizar Lançamentos (Botão Central) */}
        <div className="relative -top-4">
          <button
            onClick={onOpenTransactionModal}
            className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all border-4 border-card"
            title="Realizar Lançamento"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-max">
             <span className="text-[9px] font-black uppercase tracking-tighter text-primary">Lançar</span>
          </div>
        </div>

        {/* Categorias */}
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 transition-all",
            activeTab === 'categories' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "p-1 rounded-xl transition-all",
            activeTab === 'categories' && "bg-primary/10"
          )}>
            <Tags size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Categorias</span>
        </button>
      </div>
    </div>
  );
};
