import React from 'react';
import { Users, CheckSquare, Calculator, Share2, Settings as SettingsIcon } from 'lucide-react';

const EmptyState: React.FC<{ icon: React.ElementType, title: string }> = ({ icon: Icon, title }) => (
  <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
    <div className="w-24 h-24 rounded-[2rem] bg-muted/50 flex items-center justify-center mb-6 border border-border shadow-inner group transition-all hover:scale-110">
      <Icon size={48} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-4">{title}</h2>
    <p className="text-muted-foreground max-w-md mx-auto font-medium">
      Esta funcionalidade está sendo preparada e estará disponível em breve para otimizar sua gestão financeira.
    </p>
  </div>
);

// export const ClientsTab = () => <EmptyState icon={Users} title="Gestão de Clientes" />;
// export const TasksTab = () => <EmptyState icon={CheckSquare} title="Tarefas e Compromissos" />;
export const SimulatorsTab = () => <EmptyState icon={Calculator} title="Simuladores Financeiros" />;
export const ReferralsTab = () => <EmptyState icon={Share2} title="Indicações e Parcerias" />;
export const SettingsTab = () => <EmptyState icon={SettingsIcon} title="Configurações da Gestão" />;
