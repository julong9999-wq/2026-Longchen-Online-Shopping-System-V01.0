export interface ProductGroup {
  id: string; // e.g., "A01"
  name: string; // e.g., "排球少年"
}

export interface ProductItem {
  groupId: string;
  id: string; // e.g., "01"
  name: string; // e.g., "骨牌"
  jpyPrice: number;
  domesticShip: number; // 境內運費
  handlingFee: number; // 手續費
  intlShip: number; // 國際運費
  rateSale: number; // 售價匯率
  rateCost: number; // 成本匯率
  inputPrice: number; // 輸入價格
}

export interface OrderGroup {
  id: string; // e.g., "202511A"
  year: number;
  month: number;
  suffix: string; // 'A' - 'Z'
}

export interface OrderItem {
  id: string; // UUID
  orderGroupId: string;
  productGroupId: string;
  productItemId: string;
  quantity: number;
  description: string; // 商品描述 (Auto-filled but editable)
  buyer: string; // 訂購者
  remarks: string; // 備註欄
  note: string; // 說明
  date: string; // 訂單日期
  createdAt: number; // Timestamp for sorting
  isSelfAbsorbed?: boolean; // For "自己吸收" logic if needed, inferred from buyer name in OCR
}

export type ViewState = 'products' | 'orders' | 'details' | 'analysis' | 'deposits' | 'income';

export type BankAccount = '禹君' | '禹辰';
export type BankTransactionType = '收入' | '支出' | '股票' | '調度';

export interface BankTransaction {
  id: string;
  account: BankAccount;
  type: BankTransactionType;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  remarks: string;
  createdAt: number;
}

export interface BankVocabulary {
  id: string;
  type: BankTransactionType | '備註';
  word: string;
  parentId?: string; // 全新加入：指向父項目 (如股息收益) 的 ID
}
export interface TripSlogan {
  id: string;
  startDate: string;
  days: number;
  location: string;
  remarks: string;
  sloganString: string;
  createdAt: number;
}

export interface TripExpense {
  id: string;
  tripId: string;
  date: string;
  category: string;
  description: string;
  currency: string;
  amount: number;
  location: string;
  payer: string;
  createdAt: number;
}

export type ShiftPerson = '禹君' | '禹辰';

export interface ShiftLocation {
  id: string;
  person: ShiftPerson;
  name: string;
  isActive: boolean;
  hasBreak?: boolean;
  createdAt: number;
}

export interface ShiftWage {
  id: string;
  locationId: string;
  effectiveDate: string;
  hourlyWage: number;
  remarks: string;
  createdAt: number;
}

export interface ShiftRecord {
  id: string;
  person: ShiftPerson;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  remarks: string;
  createdAt: number;
}
