export interface Member {
  id: string;
  name: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  note?: string;
}

export interface Expense {
  id: string;
  amount: number;
  desc: string;
  category: string | null;
  paidBy: string | null;
  ts?: number;
}

export interface TripState {
  members: Member[];
  contributions: Contribution[];
  expenses: Expense[];
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploader?: string;
  created_at?: string;
}
