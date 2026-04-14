export interface Investment {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'variable' | 'crypto' | 'other';
  date: string;
}

export interface BusinessVenture {
  id: string;
  name: string;
  initialCapital: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  status: 'planning' | 'active' | 'closed';
}

export interface FinancialProjection {
  month: string;
  balance: number;
  investmentGrowth: number;
  businessProfit: number;
}
