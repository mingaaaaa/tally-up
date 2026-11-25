export const demoMonth = '2026 年 11 月'
export const demoToday = 25

export const categories = {
  food: { label: '餐饮', icon: 'utensils' },
  transport: { label: '交通', icon: 'train' },
  groceries: { label: '日用', icon: 'basket' },
  home: { label: '居住', icon: 'house' },
  shopping: { label: '购物', icon: 'bag' },
  recreation: { label: '休闲', icon: 'ticket' },
  other: { label: '其他', icon: 'dots' },
  salary: { label: '工资', icon: 'wallet' },
  freelance: { label: '兼职', icon: 'briefcase' },
  reimbursement: { label: '报销', icon: 'receipt' },
} as const

export type Category = keyof typeof categories
export type TransactionKind = 'expense' | 'income'
export type TrendRange = 'week' | 'month'

export const categoriesByKind = {
  expense: [
    'food',
    'transport',
    'groceries',
    'home',
    'shopping',
    'recreation',
    'other',
  ],
  income: ['salary', 'freelance', 'reimbursement'],
} satisfies Record<TransactionKind, Category[]>

export const paymentMethods = ['微信支付', '支付宝', '银行卡', '现金'] as const
export type Payment = (typeof paymentMethods)[number]

export type Transaction = {
  id: number
  day: number
  category: Category
  title: string
  payment: Payment
  cents: number
}

export const sampleEntries: Transaction[] = [
  {
    id: 1,
    day: 25,
    title: '工作日午餐',
    category: 'food',
    payment: '微信支付',
    cents: -4860,
  },
  {
    id: 2,
    day: 25,
    title: '地铁通勤',
    category: 'transport',
    payment: '支付宝',
    cents: -600,
  },
  {
    id: 3,
    day: 25,
    title: '水果和牛奶',
    category: 'groceries',
    payment: '微信支付',
    cents: -3260,
  },
  {
    id: 4,
    day: 24,
    title: '水电费',
    category: 'home',
    payment: '支付宝',
    cents: -23840,
  },
  {
    id: 5,
    day: 24,
    title: '音乐会员',
    category: 'recreation',
    payment: '银行卡',
    cents: -2800,
  },
  {
    id: 6,
    day: 23,
    title: '超市采购',
    category: 'groceries',
    payment: '微信支付',
    cents: -13760,
  },
  {
    id: 7,
    day: 23,
    title: '咖啡',
    category: 'food',
    payment: '支付宝',
    cents: -2800,
  },
  {
    id: 8,
    day: 22,
    title: '菜市场买菜',
    category: 'groceries',
    payment: '现金',
    cents: -7860,
  },
  {
    id: 9,
    day: 22,
    title: '周末打车',
    category: 'transport',
    payment: '支付宝',
    cents: -3250,
  },
  {
    id: 10,
    day: 21,
    title: '运动鞋',
    category: 'shopping',
    payment: '银行卡',
    cents: -47900,
  },
  {
    id: 11,
    day: 21,
    title: '周末聚餐',
    category: 'food',
    payment: '微信支付',
    cents: -10400,
  },
  {
    id: 12,
    day: 20,
    title: '晚餐',
    category: 'food',
    payment: '微信支付',
    cents: -14800,
  },
  {
    id: 13,
    day: 20,
    title: '公交出行',
    category: 'transport',
    payment: '支付宝',
    cents: -400,
  },
  {
    id: 14,
    day: 19,
    title: '《设计中的设计》',
    category: 'recreation',
    payment: '支付宝',
    cents: -6800,
  },
  {
    id: 15,
    day: 19,
    title: '早餐',
    category: 'food',
    payment: '微信支付',
    cents: -1580,
  },
  {
    id: 16,
    day: 17,
    title: '手机话费',
    category: 'other',
    payment: '支付宝',
    cents: -5000,
  },
  {
    id: 17,
    day: 15,
    title: '通勤报销',
    category: 'reimbursement',
    payment: '银行卡',
    cents: 32000,
  },
  {
    id: 18,
    day: 12,
    title: '11 月房租',
    category: 'home',
    payment: '银行卡',
    cents: -320000,
  },
  {
    id: 19,
    day: 10,
    title: '插画稿费',
    category: 'freelance',
    payment: '银行卡',
    cents: 80000,
  },
  {
    id: 20,
    day: 9,
    title: '清洁用品',
    category: 'groceries',
    payment: '支付宝',
    cents: -20380,
  },
  {
    id: 21,
    day: 5,
    title: '展览门票',
    category: 'recreation',
    payment: '微信支付',
    cents: -12800,
  },
  {
    id: 22,
    day: 2,
    title: '11 月工资',
    category: 'salary',
    payment: '银行卡',
    cents: 980000,
  },
]

const money = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const weekday = new Intl.DateTimeFormat('zh-CN', {
  weekday: 'short',
  timeZone: 'UTC',
})

export function formatAmount(cents: number, showPlus = false) {
  const sign = cents < 0 ? '−' : showPlus && cents > 0 ? '+' : ''
  return sign + '¥' + money.format(Math.abs(cents) / 100)
}

export function formatWeekday(day: number) {
  return weekday.format(new Date(Date.UTC(2026, 10, day)))
}

export function parseAmount(value: string) {
  const parts = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!parts) return 0
  return Number(parts[1]) * 100 + Number((parts[2] ?? '').padEnd(2, '0'))
}

export function spendingByDay(entries: Transaction[], range: TrendRange) {
  const firstDay = range === 'week' ? demoToday - 6 : 1
  const totals = new Map<number, number>()

  for (const entry of entries) {
    if (entry.cents >= 0 || entry.day < firstDay) continue
    totals.set(entry.day, (totals.get(entry.day) ?? 0) - entry.cents)
  }

  return Array.from({ length: demoToday - firstDay + 1 }, (_, index) => {
    const day = firstDay + index
    return { day, cents: totals.get(day) ?? 0 }
  })
}

export function expenseRanking(entries: Transaction[]) {
  const totals = new Map<Category, number>()

  for (const entry of entries) {
    if (entry.cents >= 0) continue
    totals.set(entry.category, (totals.get(entry.category) ?? 0) - entry.cents)
  }

  return [...totals.entries()].sort((first, second) => second[1] - first[1])
}
