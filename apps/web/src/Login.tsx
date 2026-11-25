import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { login, requestCaptcha } from './login-mock.ts'
import type { Captcha } from './login-mock.ts'
import './demo.css'
import './login.css'

const iconPaths = {
  chart: 'M3 3v18h18M7 14l4-4 4 4 6-6',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  eyeOff:
    'M15.54 18.27C14.48 18.72 13.3 19 12 19C12 19 5.5 19 2 12C2 12 3.06 9.88 5.09 7.98M8.46 5.73C9.52 5.28 10.7 5 12 5C18.5 5 22 12 22 12M18.91 16.02C20.94 14.12 22 12 22 12M3.5 3.5l17 17',
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

const missingAccount = '请输入账号。'
const missingPassword = '请输入密码。'
const missingCaptcha = '请输入验证码。'

export default function Login() {
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaImage, setCaptchaImage] = useState<Captcha | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState(true)
  const [accountError, setAccountError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [captchaError, setCaptchaError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const accountRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const captchaRef = useRef<HTMLInputElement>(null)
  const captchaRequest = useRef(0)

  const loadCaptcha = useCallback(async () => {
    const request = ++captchaRequest.current
    const next = await requestCaptcha()
    if (request !== captchaRequest.current) return
    setCaptchaImage(next)
    setCaptchaLoading(false)
  }, [])

  function refreshCaptcha() {
    setCaptchaLoading(true)
    loadCaptcha()
  }

  useEffect(() => {
    loadCaptcha()
  }, [loadCaptcha])

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || captchaLoading) return
    const nextAccountError = account.trim() ? '' : missingAccount
    const nextPasswordError = password ? '' : missingPassword
    const nextCaptchaError = captcha.trim() ? '' : missingCaptcha
    setAccountError(nextAccountError)
    setPasswordError(nextPasswordError)
    setCaptchaError(nextCaptchaError)
    setFormError('')

    if (nextAccountError) accountRef.current?.focus()
    else if (nextPasswordError) passwordRef.current?.focus()
    else if (nextCaptchaError) captchaRef.current?.focus()

    if (nextAccountError || nextPasswordError || nextCaptchaError) return

    setSubmitting(true)
    const result = await login({
      account,
      password,
      captchaId: captchaImage?.id ?? '',
      captchaCode: captcha,
    })
    setSubmitting(false)

    if (result.ok) {
      navigate('/', { replace: true })
    } else if (result.field === 'captcha') {
      setCaptchaError(result.message)
      setCaptcha('')
      captchaRef.current?.focus()
      refreshCaptcha()
    } else {
      setFormError(result.message)
    }
  }

  return (
    <div className="demo-shell login-shell">
      <main className="demo-panel login-card">
        <header className="login-head">
          <div className="demo-brand">
            <span className="demo-brand-mark">
              <Icon name="chart" />
            </span>
            <span className="demo-brand-name">记高一筹</span>
          </div>
          <h1 className="login-title">登录</h1>
          <p className="login-subtitle">登录后开始记账</p>
        </header>

        <form
          className="demo-form login-form"
          noValidate
          aria-busy={submitting}
          onSubmit={submitLogin}
        >
          <div className="demo-field">
            <label htmlFor="login-account">账号</label>
            <input
              id="login-account"
              name="account"
              ref={accountRef}
              autoComplete="username"
              autoFocus
              placeholder="请输入账号"
              value={account}
              required
              aria-invalid={accountError ? true : undefined}
              aria-describedby={
                accountError ? 'login-account-error' : undefined
              }
              onChange={(event) => {
                const value = event.target.value
                setAccount(value)
                setFormError('')
                if (value.trim()) setAccountError('')
              }}
            />
            {accountError && (
              <p className="demo-error" id="login-account-error" role="alert">
                {accountError}
              </p>
            )}
          </div>

          <div className="demo-field">
            <label htmlFor="login-password">密码</label>
            <div className="login-password">
              <input
                id="login-password"
                name="password"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                required
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={
                  passwordError ? 'login-password-error' : undefined
                }
                onChange={(event) => {
                  const value = event.target.value
                  setPassword(value)
                  setFormError('')
                  if (value) setPasswordError('')
                }}
              />
              <button
                className="demo-icon-button login-password-toggle"
                type="button"
                aria-label="显示密码"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
            {passwordError && (
              <p className="demo-error" id="login-password-error" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <div className="demo-field">
            <label htmlFor="login-captcha">验证码</label>
            <div className="login-captcha-row">
              <input
                id="login-captcha"
                name="captcha"
                ref={captchaRef}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={4}
                placeholder="请输入验证码"
                value={captcha}
                required
                aria-invalid={captchaError ? true : undefined}
                aria-describedby={
                  captchaError
                    ? 'login-captcha-hint login-captcha-error'
                    : 'login-captcha-hint'
                }
                onChange={(event) => {
                  const value = event.target.value
                  setCaptcha(value)
                  if (value.trim()) setCaptchaError('')
                }}
              />
              <button
                className="login-captcha-image"
                type="button"
                aria-label="换一张验证码"
                aria-disabled={captchaLoading}
                onClick={() => {
                  if (!captchaLoading) refreshCaptcha()
                }}
              >
                {captchaImage && !captchaLoading ? (
                  <img
                    src={captchaImage.image}
                    alt=""
                    width="112"
                    height="41"
                  />
                ) : (
                  <span>{captchaImage ? '更换中…' : '加载中…'}</span>
                )}
              </button>
            </div>
            <p className="login-hint" id="login-captcha-hint">
              看不清？点击图片换一张
            </p>
            {captchaError && (
              <p className="demo-error" id="login-captcha-error" role="alert">
                {captchaError}
              </p>
            )}
          </div>

          {formError && (
            <p className="demo-error" role="alert">
              {formError}
            </p>
          )}
          <button
            className="demo-button demo-primary login-submit"
            type="submit"
            disabled={submitting || captchaLoading}
          >
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>
      </main>

      <p className="login-note">
        演示环境：接口尚未接入，输入任意账号和密码即可登录
      </p>
    </div>
  )
}
