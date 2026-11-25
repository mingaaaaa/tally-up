// 接口就绪前的模拟实现。正式环境的验证码必须由后端生成和校验。

export type Captcha = { id: string; image: string }

export type LoginInput = {
  account: string
  password: string
  captchaId: string
  captchaCode: string
}

export type LoginResult =
  | { ok: true; session: { token: string; account: string } }
  | { ok: false; field: 'captcha' | 'account'; message: string }

// 去掉容易混淆的 0、O、1、I、L
const charset = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const inkColors = ['#272421', '#655d56', '#873627', '#405e75']
const lineColors = ['#e1dad2', '#d6c6a9', '#c9d3d9']

let currentCaptcha: { id: string; answer: string } | null = null
let nextCaptchaId = 1

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pick(colors: readonly string[]) {
  return colors[Math.floor(Math.random() * colors.length)]
}

function drawCaptcha(answer: string) {
  const glyphs = [...answer].map((char, index) => {
    const x = (14 + index * 28).toFixed(1)
    const y = randomBetween(25, 31).toFixed(1)
    return `<text x="${x}" y="${y}" transform="rotate(${randomBetween(-22, 22).toFixed(1)} ${x} ${y})" fill="${pick(inkColors)}" font-family="Georgia, 'Times New Roman', serif" font-size="25" font-weight="700" text-anchor="middle">${char}</text>`
  })
  const lines = Array.from({ length: 2 }, () => {
    const from = randomBetween(2, 18)
    const rise = randomBetween(6, 22).toFixed(1)
    return `<path d="M-2 ${from.toFixed(1)}c34 ${randomBetween(-10, 10).toFixed(1)} 82 ${randomBetween(-12, 12).toFixed(1)} 116 ${rise}" fill="none" stroke="${pick(lineColors)}" stroke-width="1.3"/>`
  })
  const dots = Array.from(
    { length: 12 },
    () =>
      `<circle cx="${randomBetween(3, 109).toFixed(1)}" cy="${randomBetween(3, 38).toFixed(1)}" r="${randomBetween(0.7, 1.5).toFixed(1)}" fill="${pick(lineColors)}"/>`,
  )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 41"><rect width="112" height="41" fill="#fcfbf8"/>${lines.join('')}${dots.join('')}${glyphs.join('')}</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export async function requestCaptcha(): Promise<Captcha> {
  await wait(300)
  const answer = Array.from(
    { length: 4 },
    () => charset[Math.floor(Math.random() * charset.length)],
  ).join('')
  const captcha = { id: 'captcha-' + nextCaptchaId++, answer }
  currentCaptcha = captcha
  return {
    id: captcha.id,
    image: drawCaptcha(answer),
  }
}

export async function login(input: LoginInput): Promise<LoginResult> {
  await wait(600)
  const account = input.account.trim()
  const matched =
    currentCaptcha?.id === input.captchaId &&
    currentCaptcha.answer === input.captchaCode.trim().toUpperCase()
  currentCaptcha = null

  if (!matched) {
    return { ok: false, field: 'captcha', message: '验证码错误，请重新输入。' }
  }
  if (!account || !input.password) {
    return { ok: false, field: 'account', message: '账号或密码错误。' }
  }
  return { ok: true, session: { token: crypto.randomUUID(), account } }
}
