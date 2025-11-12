// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill Web APIs for Next.js API routes
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill Request and Response for Next.js API route tests
global.Request = class Request {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers || {})
    this._body = init?.body
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    return this._body
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Headers(init?.headers || {})
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }
}

global.Headers = class Headers {
  constructor(init) {
    this._headers = {}
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this._headers[key.toLowerCase()] = value
      })
    }
  }

  get(name) {
    return this._headers[name.toLowerCase()]
  }

  set(name, value) {
    this._headers[name.toLowerCase()] = value
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  redirect: jest.fn(),
}))

// Mock Auth.js
jest.mock('./auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Set test environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only'
