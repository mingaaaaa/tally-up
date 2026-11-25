import { useEffect, useRef, useState } from 'react'
import type { FormEvent, PointerEvent } from 'react'
import {
  categories,
  categoriesByKind,
  demoMonth,
  demoToday,
  expenseRanking,
  formatAmount,
  formatWeekday,
  parseAmount,
  paymentMethods,
  sampleEntries,
  spendingByDay,
} from './demo-data.ts'
import type {
  Category,
  Payment,
  Transaction,
  TransactionKind,
  TrendRange,
} from './demo-data.ts'

const iconPaths = {
  chart: 'M3 3v18h18M7 14l4-4 4 4 6-6',
  layout: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  receipt:
    'M4 3l2 1.5L8 3l2 1.5L12 3l2 1.5L16 3l2 1.5L20 3v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L4 21zM8 9h8M8 13h8',
  pie: 'M21.21 15.89A10 10 0 1 1 8.11 2.79M22 12A10 10 0 0 0 12 2v10z',
  calendar:
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  plus: 'M5 12h14m-7-7v14',
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  close: 'm18 6-12 12M6 6l12 12',
  incoming: 'M7 7l10 10M17 7v10H7',
  outgoing: 'M7 17 17 7M7 7h10v10',
  info: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  utensils:
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 2v20m0-18c-3 0-5 3-5 7v2h5',
  train:
    'M6 19l-2 3m14-3 2 3M4 11h16M12 3v8m-4 4h.01M16 15h.01M8 3h8c2.2 0 4 1.8 4 4v9c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-2.2 1.8-4 4-4Z',
  basket: 'M3 9h18m-2 0-2 10H7L5 9m3 0 4-6 4 6m-6 4v2m4-2v2',
  house: 'm3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 21v-7h6v7',
  bag: 'M6 7h12l2 14H4L6 7Zm3 2V5a3 3 0 0 1 6 0v4',
  ticket:
    'M4 5h16a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 1 2-2Zm9 1v2m0 3v2m0 3v2',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  wallet:
    'M20 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6m19 6h-4a2 2 0 0 0 0 4h4',
  briefcase:
    'M9 7V4h6v3M3 13h18m-11 0v2h4v-2M5 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z',
} as const

function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      className="demo-icon"
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}

const sections = [
  { id: 'demo-overview', name: '总览', icon: 'layout' },
  { id: 'demo-transactions', name: '流水', icon: 'receipt' },
  { id: 'demo-categories', name: '支出分类', icon: 'pie' },
] as const

function currentSection() {
  return (
    sections.find((section) => '#' + section.id === window.location.hash)?.id ??
    sections[0].id
  )
}

function followBalanceSpotlight(event: PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== 'mouse' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }

  const bounds = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty(
    '--demo-spotlight-x',
    event.clientX - bounds.left + 'px',
  )
  event.currentTarget.style.setProperty(
    '--demo-spotlight-y',
    event.clientY - bounds.top + 'px',
  )
}

const ranges = { week: '近 7 天', month: '本月' } as const
const scopes = { all: '全部', expense: '支出', income: '收入' } as const
type Scope = keyof typeof scopes

const expenseNumber = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percentage = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function TrendChart({
  entries,
  range,
  onRangeChange,
}: {
  entries: Transaction[]
  range: TrendRange
  onRangeChange: (range: TrendRange) => void
}) {
  const [selectedDay, setSelectedDay] = useState(demoToday)
  const days = spendingByDay(entries, range)
  const first = days[0]
  const latest = days[days.length - 1]
  const selected = days[selectedDay - first.day] ?? latest
  const peak = days.reduce((highest, day) =>
    day.cents > highest.cents ? day : highest,
  )
  const minimumStep = Math.max(1000, peak.cents / 3)
  const stepUnit = 10 ** Math.floor(Math.log10(minimumStep))
  const step =
    [1, 2, 5, 10].find((factor) => factor * stepUnit >= minimumStep)! * stepUnit
  const left = 56
  const right = 508
  const top = 18
  const bottom = 145
  const pointX = (day: number) =>
    left + ((day - first.day) / (latest.day - first.day)) * (right - left)
  const pointY = (cents: number) =>
    bottom - (cents / (step * 3)) * (bottom - top)
  const points = days
    .map((day) => pointX(day.day) + ',' + pointY(day.cents))
    .join(' ')
  const areaPoints =
    left + ',' + bottom + ' ' + points + ' ' + right + ',' + bottom
  const ticks = range === 'week' ? [19, 21, 23, 25] : [1, 7, 13, 19, 25]

  return (
    <section
      className="demo-panel demo-trend"
      aria-labelledby="demo-trend-heading"
    >
      <div className="demo-panel-head">
        <div>
          <h2 className="demo-panel-title" id="demo-trend-heading">
            支出走势
          </h2>
          <p className="demo-panel-meta">
            11 月 {first.day} 日至 {latest.day} 日
          </p>
        </div>
        <div
          className="demo-segment"
          role="group"
          aria-label="支出走势日期范围"
        >
          {(Object.keys(ranges) as TrendRange[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => {
                if (option === range) return
                setSelectedDay(demoToday)
                onRangeChange(option)
              }}
            >
              {ranges[option]}
            </button>
          ))}
        </div>
      </div>
      <div className="demo-chart-wrap">
        <svg
          className="demo-chart"
          role="img"
          aria-labelledby="demo-chart-title demo-chart-desc"
          viewBox="0 0 520 175"
        >
          <title id="demo-chart-title">每日支出走势</title>
          <desc id="demo-chart-desc">
            {first.day} 日至 {latest.day} 日，最高支出是 {peak.day} 日的{' '}
            {formatAmount(peak.cents)}，{latest.day} 日支出{' '}
            {formatAmount(latest.cents)}。
          </desc>
          <g aria-hidden="true">
            {[3, 2, 1, 0].map((level) => {
              const y = pointY(level * step)
              return (
                <g key={level}>
                  <line
                    className="demo-chart-grid"
                    x1={left}
                    y1={y}
                    x2={right}
                    y2={y}
                  />
                  <text
                    className="demo-chart-axis"
                    x={left - 12}
                    y={y + 4}
                    textAnchor="end"
                  >
                    {level === 0
                      ? '¥0'
                      : '¥' + expenseNumber.format((level * step) / 100)}
                  </text>
                </g>
              )
            })}
            <polygon className="demo-chart-area" points={areaPoints} />
            <polyline
              className="demo-chart-line"
              key={range}
              pathLength={1}
              points={points}
            />
            <line
              className="demo-chart-cursor"
              x1={pointX(selected.day)}
              x2={pointX(selected.day)}
              y1={top}
              y2={bottom}
            />
            <circle
              className="demo-chart-point"
              key={range + '-' + selected.day}
              cx={pointX(selected.day)}
              cy={pointY(selected.cents)}
              r="4"
            />
            {ticks.map((day, index) => (
              <text
                className="demo-chart-axis"
                key={day}
                x={pointX(day)}
                y="166"
                textAnchor={
                  index === 0
                    ? 'start'
                    : index === ticks.length - 1
                      ? 'end'
                      : 'middle'
                }
              >
                11/{day}
              </text>
            ))}
          </g>
        </svg>
        <div className="demo-chart-interaction">
          <input
            type="range"
            min={first.day}
            max={latest.day}
            value={selected.day}
            aria-label="查看每日支出"
            aria-valuetext={
              '11 月 ' +
              selected.day +
              ' 日，支出 ' +
              formatAmount(selected.cents)
            }
            onChange={(event) => setSelectedDay(event.target.valueAsNumber)}
            onPointerMove={(event) => {
              if (event.pointerType !== 'mouse') return
              const bounds = event.currentTarget.getBoundingClientRect()
              const position = (event.clientX - bounds.left) / bounds.width
              const day =
                first.day + Math.round(position * (latest.day - first.day))
              setSelectedDay(Math.min(latest.day, Math.max(first.day, day)))
            }}
          />
        </div>
      </div>
      <div className="demo-chart-key">
        <span>
          <i aria-hidden="true" />
          日支出
        </span>
        <span>
          11 月 {selected.day} 日{' '}
          <strong>{formatAmount(selected.cents)}</strong>
        </span>
      </div>
    </section>
  )
}

function CategoryRanking({
  entries,
  expense,
}: {
  entries: Transaction[]
  expense: number
}) {
  const ranked = expenseRanking(entries)
  const topCategory = ranked[0]
  const ratio = topCategory ? topCategory[1] / expense : 0

  return (
    <section
      className="demo-panel demo-categories"
      id="demo-categories"
      aria-labelledby="demo-categories-heading"
    >
      <div className="demo-panel-head">
        <div>
          <h2 className="demo-panel-title" id="demo-categories-heading">
            支出分类
          </h2>
          <p className="demo-panel-meta">{demoMonth}</p>
        </div>
        <Icon name="pie" />
      </div>
      <div className="demo-category-summary">
        {topCategory && (
          <div
            className="demo-category-ring-frame"
            role="img"
            aria-label={
              categories[topCategory[0]].label +
              '占本月支出的 ' +
              percentage.format(ratio)
            }
            data-category={topCategory[0]}
          >
            <svg
              className="demo-category-ring"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <circle className="demo-ring-track" cx="32" cy="32" r="25" />
              <circle
                className="demo-ring-arc"
                cx="32"
                cy="32"
                r="25"
                pathLength="100"
                strokeDasharray={ratio * 100 + ' 100'}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span className="demo-ring-value">{percentage.format(ratio)}</span>
          </div>
        )}
        <div className="demo-category-summary-text">
          <span>支出合计</span>
          <strong>{formatAmount(expense)}</strong>
          {topCategory && (
            <span>支出最多 · {categories[topCategory[0]].label}</span>
          )}
        </div>
      </div>
      <ul className="demo-category-list">
        {ranked.map(([category, cents]) => {
          const ratio = cents / expense
          return (
            <li
              className="demo-category-item"
              key={category}
              data-category={category}
            >
              <span className="demo-category-label">
                <Icon name={categories[category].icon} />
                {categories[category].label}
              </span>
              <span className="demo-category-value">
                <strong>{formatAmount(cents)}</strong>
                <span>{percentage.format(ratio)}</span>
              </span>
              <div className="demo-category-track" aria-hidden="true">
                <span
                  className="demo-category-fill"
                  style={{ width: ratio * 100 + '%' }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const invalidAmount = '请输入大于 0 的金额，最多两位小数。'
const missingCategory = '请选择分类。'

export function LedgerDemo() {
  const [entries, setEntries] = useState(sampleEntries)
  const [activeSection, setActiveSection] = useState(currentSection)
  const [range, setRange] = useState<TrendRange>('week')
  const [scope, setScope] = useState<Scope>('all')
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<TransactionKind>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [payment, setPayment] = useState<Payment>('微信支付')
  const [memo, setMemo] = useState('')
  const [amountError, setAmountError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [feedback, setFeedback] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const entryTriggerRef = useRef<HTMLButtonElement>(null)
  const nextId = useRef(Math.max(...sampleEntries.map((entry) => entry.id)) + 1)

  useEffect(() => {
    const syncSection = () => setActiveSection(currentSection())
    window.addEventListener('hashchange', syncSection)
    return () => window.removeEventListener('hashchange', syncSection)
  }, [])

  const income = entries.reduce(
    (sum, entry) => sum + Math.max(0, entry.cents),
    0,
  )
  const expense = entries.reduce(
    (sum, entry) => sum + Math.max(0, -entry.cents),
    0,
  )
  const term = search.trim().toLocaleLowerCase()
  const results = entries.filter((entry) => {
    const matchesKind =
      scope === 'all' ||
      (scope === 'income' ? entry.cents > 0 : entry.cents < 0)
    const searchable = [
      entry.title,
      categories[entry.category].label,
      entry.payment,
    ]
      .join(' ')
      .toLocaleLowerCase()
    return matchesKind && searchable.includes(term)
  })
  const groups = new Map<number, Transaction[]>()

  for (const entry of results) {
    const group = groups.get(entry.day)
    if (group) group.push(entry)
    else groups.set(entry.day, [entry])
  }

  function openEntry(nextKind: TransactionKind, trigger: HTMLButtonElement) {
    entryTriggerRef.current = trigger
    setKind(nextKind)
    setAmount('')
    setCategory('')
    setPayment('微信支付')
    setMemo('')
    setAmountError('')
    setCategoryError('')
    dialogRef.current?.showModal()
    amountRef.current?.focus()
  }

  function closeEntry() {
    dialogRef.current?.close()
  }

  function changeKind(value: TransactionKind) {
    if (value === kind) return
    setKind(value)
    setCategory('')
    setCategoryError('')
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cents = parseAmount(amount)
    setAmountError(cents ? '' : invalidAmount)
    setCategoryError(category ? '' : missingCategory)

    if (!cents || !category) {
      const invalidField = cents ? categoryRef.current : amountRef.current
      invalidField?.focus()
      return
    }

    const entry = {
      id: nextId.current++,
      day: demoToday,
      category,
      title: memo.trim() || categories[category].label,
      payment,
      cents: kind === 'expense' ? -cents : cents,
    }
    setEntries((previous) => [entry, ...previous])
    setFeedback('已记录 ' + formatAmount(cents) + ' ' + scopes[kind])
    closeEntry()
  }

  return (
    <div className="demo-shell">
      <header className="demo-sidebar">
        <div className="demo-brand">
          <span className="demo-brand-mark">
            <Icon name="chart" />
          </span>
          <span className="demo-brand-name">记高一筹</span>
        </div>
        <nav className="demo-nav" aria-label="账本导航">
          {sections.map((section) => (
            <a
              className="demo-nav-link"
              key={section.id}
              href={'#' + section.id}
              data-active={activeSection === section.id ? 'true' : undefined}
              aria-current={
                activeSection === section.id ? 'location' : undefined
              }
            >
              <Icon name={section.icon} />
              <span>{section.name}</span>
            </a>
          ))}
        </nav>
        <div className="demo-sidebar-footer">
          <span className="demo-sample-icon">
            <Icon name="info" />
          </span>
          <span>示例账本</span>
        </div>
      </header>

      <main className="demo-main" id="demo-overview">
        <header className="demo-topline">
          <div className="demo-page-heading">
            <h1>本月总览</h1>
          </div>
          <div className="demo-page-actions">
            <span className="demo-period-label">
              <Icon name="calendar" />
              <time dateTime="2026-11">{demoMonth}</time>
            </span>
            <button
              className="demo-button demo-primary"
              type="button"
              onClick={(event) => openEntry('expense', event.currentTarget)}
            >
              <Icon name="plus" />
              记一笔
            </button>
          </div>
        </header>

        <div className="demo-overview">
          <section
            className="demo-balance"
            aria-labelledby="demo-balance-heading"
            onPointerEnter={followBalanceSpotlight}
            onPointerMove={followBalanceSpotlight}
          >
            <span className="demo-balance-spotlight" aria-hidden="true" />
            <h2 className="demo-balance-label" id="demo-balance-heading">
              本月结余
            </h2>
            <p className="demo-balance-amount">
              {formatAmount(income - expense)}
            </p>
            <p className="demo-balance-footnote">11 月 1 日至 {demoToday} 日</p>
            <dl className="demo-balance-metrics">
              <div data-kind="income">
                <dt>
                  <Icon name="incoming" />
                  收入
                </dt>
                <dd>{formatAmount(income)}</dd>
              </div>
              <div data-kind="expense">
                <dt>
                  <Icon name="outgoing" />
                  支出
                </dt>
                <dd>{formatAmount(expense)}</dd>
              </div>
            </dl>
            <div className="demo-balance-actions">
              <button
                className="demo-balance-action"
                data-kind="expense"
                type="button"
                onClick={(event) => openEntry('expense', event.currentTarget)}
              >
                <Icon name="outgoing" />
                记支出
              </button>
              <button
                className="demo-balance-action"
                data-kind="income"
                type="button"
                onClick={(event) => openEntry('income', event.currentTarget)}
              >
                <Icon name="incoming" />
                记收入
              </button>
            </div>
          </section>
          <TrendChart
            entries={entries}
            range={range}
            onRangeChange={setRange}
          />
        </div>

        <div className="demo-content-grid">
          <section
            className="demo-panel demo-ledger"
            id="demo-transactions"
            aria-labelledby="demo-ledger-heading"
          >
            <div className="demo-panel-head">
              <div>
                <h2 className="demo-panel-title" id="demo-ledger-heading">
                  交易流水
                </h2>
                <p className="demo-panel-meta">
                  <span aria-live="polite">{results.length}</span> 笔记录
                </p>
              </div>
            </div>
            <div className="demo-toolbar">
              <label className="demo-search">
                <Icon name="search" />
                <input
                  type="search"
                  aria-label="按备注、分类或支付方式搜索"
                  placeholder="搜索备注、分类或支付方式"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="demo-segment" role="group" aria-label="流水类型">
                {(Object.keys(scopes) as Scope[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={scope === option}
                    onClick={() => setScope(option)}
                  >
                    {scopes[option]}
                  </button>
                ))}
              </div>
            </div>

            <p className="demo-feedback" role="status">
              {feedback}
            </p>
            {groups.size === 0 && (
              <p className="demo-empty">没有符合条件的记录</p>
            )}
            {[...groups.entries()].map(([day, group]) => {
              const groupExpense = group.reduce(
                (sum, entry) => sum + Math.max(0, -entry.cents),
                0,
              )
              const groupIncome = group.reduce(
                (sum, entry) => sum + Math.max(0, entry.cents),
                0,
              )
              const date = '2026-11-' + String(day).padStart(2, '0')
              return (
                <section key={day} aria-labelledby={'demo-day-' + day}>
                  <div className="demo-date-row">
                    <h3 id={'demo-day-' + day}>
                      <time dateTime={date}>11 月 {day} 日</time>
                      <span>
                        {day === demoToday ? '今天' : formatWeekday(day)}
                      </span>
                    </h3>
                    <span>
                      {groupExpense
                        ? '支出 ' + formatAmount(groupExpense)
                        : '收入 ' + formatAmount(groupIncome)}
                    </span>
                  </div>
                  <ul className="demo-transactions">
                    {group.map((entry) => (
                      <li className="demo-transaction" key={entry.id}>
                        <span
                          className="demo-entry-icon"
                          data-category={entry.category}
                        >
                          <Icon name={categories[entry.category].icon} />
                        </span>
                        <div>
                          <span className="demo-entry-name">{entry.title}</span>
                          <span className="demo-entry-meta">
                            {entry.payment}
                          </span>
                        </div>
                        <span className="demo-entry-category">
                          {categories[entry.category].label}
                        </span>
                        <span
                          className="demo-entry-amount"
                          data-kind={entry.cents > 0 ? 'income' : 'expense'}
                        >
                          {formatAmount(entry.cents, true)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </section>
          <CategoryRanking entries={entries} expense={expense} />
        </div>
      </main>

      <dialog
        className="demo-dialog"
        aria-labelledby="demo-entry-title"
        ref={dialogRef}
        onClose={() => entryTriggerRef.current?.focus()}
      >
        <form className="demo-form" noValidate onSubmit={saveEntry}>
          <div className="demo-dialog-heading">
            <h2 id="demo-entry-title">记一笔{scopes[kind]}</h2>
            <button
              className="demo-icon-button"
              type="button"
              aria-label="关闭"
              onClick={closeEntry}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="demo-segment" role="group" aria-label="记账类型">
            <button
              type="button"
              aria-pressed={kind === 'expense'}
              onClick={() => changeKind('expense')}
            >
              支出
            </button>
            <button
              type="button"
              aria-pressed={kind === 'income'}
              onClick={() => changeKind('income')}
            >
              收入
            </button>
          </div>
          <div className="demo-field">
            <label htmlFor="demo-amount">金额</label>
            <div className="demo-amount-field">
              <span aria-hidden="true">¥</span>
              <input
                id="demo-amount"
                name="amount"
                ref={amountRef}
                inputMode="decimal"
                maxLength={10}
                placeholder="0.00"
                value={amount}
                required
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? 'demo-amount-error' : undefined}
                onChange={(event) => {
                  const value = event.target.value
                  setAmount(value)
                  if (parseAmount(value)) setAmountError('')
                }}
              />
            </div>
            {amountError && (
              <p className="demo-error" id="demo-amount-error" role="alert">
                {amountError}
              </p>
            )}
          </div>
          <div className="demo-field">
            <label htmlFor="demo-category">分类</label>
            <select
              id="demo-category"
              name="category"
              ref={categoryRef}
              value={category}
              required
              aria-invalid={categoryError ? true : undefined}
              aria-describedby={
                categoryError ? 'demo-category-error' : undefined
              }
              onChange={(event) => {
                const value = event.target.value as Category | ''
                setCategory(value)
                if (value) setCategoryError('')
              }}
            >
              <option value="">选择分类</option>
              {categoriesByKind[kind].map((option) => (
                <option key={option} value={option}>
                  {categories[option].label}
                </option>
              ))}
            </select>
            {categoryError && (
              <p className="demo-error" id="demo-category-error" role="alert">
                {categoryError}
              </p>
            )}
          </div>
          <div className="demo-field">
            <label htmlFor="demo-payment">支付方式</label>
            <select
              id="demo-payment"
              name="payment"
              value={payment}
              onChange={(event) => setPayment(event.target.value as Payment)}
            >
              {paymentMethods.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="demo-field">
            <label htmlFor="demo-memo">
              备注 <span>选填</span>
            </label>
            <input
              id="demo-memo"
              name="memo"
              maxLength={48}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </div>
          <div className="demo-dialog-actions">
            <button
              className="demo-button demo-secondary"
              type="button"
              onClick={closeEntry}
            >
              取消
            </button>
            <button className="demo-button demo-primary" type="submit">
              保存{scopes[kind]}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
