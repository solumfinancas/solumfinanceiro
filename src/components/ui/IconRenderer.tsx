import React from 'react';
import { 
  Tag, Plus, Edit, Trash2, ChevronDown, ChevronRight, ArrowUpCircle, 
  ArrowDownCircle, Search, Eye, EyeOff, LayoutDashboard, Clock, 
  CheckCircle2, X, History, Layers, Calendar, CreditCard, ThumbsUp, ThumbsDown,
  Wallet, Landmark, Receipt, PiggyBank, Briefcase, ShoppingBag, Car, Home,
  Utensils, Coffee, Zap, Shield, Heart, GraduationCap, Plane, Palmtree,
  Gamepad, Wifi, Smartphone, Monitor, Music, Camera, Gift, Trophy,
  Stethoscope, Dumbbell, Wrench, Scissors, Palette, Baby, Book, Globe,
  TrendingUp, TrendingDown, ArrowRightLeft, CalendarClock, AlertCircle, AlertTriangle,
  Wine, Shirt, ClipboardList, Smile, Building2, Dribbble, Umbrella, ChefHat, Banknote,
  Dice5, Users, Flag, Gamepad2, HeartHandshake, ShoppingCart, BarChart3, Image as LucideImage,
  DollarSign, Lock, Bike, MoreHorizontal, FileText, User, PawPrint, Ship, Star, Truck,
  SmilePlus, Snowflake, Sprout, Store, Syringe, Tablet, Percent, Train, Bus, PlaneTakeoff,
  Map, Compass, LifeBuoy, List
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface IconRendererProps {
  icon: string;
  name?: string;
  size?: number;
  className?: string;
  circular?: boolean;
  color?: string;
  scale?: number;
  simple?: boolean;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ 
  icon, 
  name = '', 
  size = 20, 
  className,
  circular = true,
  color,
  scale,
  simple = false
}) => {
  if (!icon) {
    const IconComp = Layers;
    const finalScale = scale !== undefined ? scale : 0.55;
    
    if (simple) {
      return <IconComp size={size * finalScale} className={className} />;
    }

    return (
      <div 
        className={cn(
          "flex items-center justify-center shrink-0",
          circular ? "rounded-full" : "rounded-lg",
          className
        )}
        style={{ width: size, height: size, backgroundColor: color || 'transparent' }}
      >
        <IconComp size={size * finalScale} className={!color ? "text-muted-foreground" : "text-white"} />
      </div>
    );
  }

  if (icon.startsWith('/') || icon.startsWith('http') || icon.startsWith('data:image')) {
    if (simple) {
      return <img src={icon} alt={name} className={cn("object-cover", className)} style={{ width: size, height: size }} />;
    }
    
    return (
      <div className={cn(
        "flex items-center justify-center overflow-hidden shrink-0 bg-white",
        circular ? "rounded-full" : "rounded-lg",
        className
      )}
      style={{ width: size, height: size }}
      >
        <img src={icon} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  
  const icons: Record<string, any> = {
    Tag, Plus, Edit, Trash2, ChevronDown, ChevronRight, ArrowUpCircle, 
    ArrowDownCircle, Search, Eye, EyeOff, LayoutDashboard, Clock, 
    CheckCircle2, X, History, Layers, Calendar, CreditCard, ThumbsUp, ThumbsDown,
    Wallet, Landmark, Receipt, PiggyBank, Briefcase, ShoppingBag, Car, Home,
    Utensils, Coffee, Zap, Shield, Heart, GraduationCap, Plane, Palmtree,
    Gamepad, Wifi, Smartphone, Monitor, Music, Camera, Gift, Trophy,
    Stethoscope, Dumbbell, Wrench, Scissors, Palette, Baby, Book, Globe,
    TrendingUp, TrendingDown, ArrowRightLeft, ArrowLeftRight: ArrowRightLeft, CalendarClock,
    AlertCircle, AlertTriangle,
    Wine, Shirt, ClipboardList, Smile, Building2, Dribbble, Umbrella, ChefHat, Banknote,
    Dice5, Users, Flag, Gamepad2, HeartHandshake, ShoppingCart, BarChart3, LucideImage,
    DollarSign, Lock, Bike, MoreHorizontal, FileText, User, PawPrint, Ship, Star, Truck,
    SmilePlus, Snowflake, Sprout, Store, Syringe, Tablet, Percent, Train, Bus, PlaneTakeoff,
    Map, Compass, LifeBuoy, List,
    wallet: Wallet,
    bank: Landmark,
    piggy: PiggyBank
  };

  const IconComp = icons[icon] || Layers;
  
  // Use custom scale if provided, otherwise default to 0.55
  const finalScale = scale !== undefined ? scale : 0.55;
  const iconSize = size * finalScale;
  
  if (simple) {
    return <IconComp size={iconSize} className={className} />;
  }

  return (
    <div className={cn(
      "flex items-center justify-center shrink-0",
      circular ? "rounded-full" : "rounded-lg",
      className
    )}
    style={{ 
      width: size, 
      height: size, 
      backgroundColor: color || 'transparent' 
    }}
    >
      <IconComp 
        size={iconSize} 
        className={color ? "text-white" : className} 
      />
    </div>
  );
};
