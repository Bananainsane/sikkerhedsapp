'use client'
import { useEffect } from 'react'

const DEDUP_TTL_MS = 60_000
const BATCH_INTERVAL_MS = 2_000
const ENDPOINT = '/api/heal/report'
const REPO = 'Twincurrent/sikkerhedsapp'
const PLATFORM = 'nextjs'

interface ErrorReport { platform: string; repo: string; error_message: string; stack_trace: string; metadata: Record<string, unknown> }
let batch: ErrorReport[] = []
let batchTimer: ReturnType<typeof setTimeout> | null = null
const recentFingerprints = new Map<string, number>()

function fingerprint(message: string, stack: string): string { return `${message}::${stack.split('\n')[0] ?? ''}` }
function isDuplicate(fp: string): boolean { const lastSeen = recentFingerprints.get(fp); if (lastSeen && Date.now() - lastSeen < DEDUP_TTL_MS) return true; recentFingerprints.set(fp, Date.now()); return false }
function normalizeStack(stack: string | undefined): string { if (!stack) return ''; return stack.split('\n').map((line) => line.replace(/(?:\/[^/\s]+)+\/(src\/)/g, '$1').replace(/(?:[A-Z]:\\[^\s:]+\\)(src\\)/gi, '$1')).join('\n') }
function flush(): void { if (batch.length === 0) { batchTimer = null; return }; const payload = batch.splice(0); batchTimer = null; try { fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {}) } catch {} }
function enqueue(report: ErrorReport): void { batch.push(report); if (!batchTimer) batchTimer = setTimeout(flush, BATCH_INTERVAL_MS) }
function handleError(error: unknown): void { try { const err = error instanceof Error ? error : new Error(String(error)); const stack = normalizeStack(err.stack); const fp = fingerprint(err.message, stack); if (isDuplicate(fp)) return; enqueue({ platform: PLATFORM, repo: REPO, error_message: err.message, stack_trace: stack, metadata: { url: typeof window !== 'undefined' ? window.location.href : undefined, userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined } }) } catch {} }
function onWindowError(event: ErrorEvent): void { handleError(event.error ?? event.message) }
function onUnhandledRejection(event: PromiseRejectionEvent): void { handleError(event.reason) }

export function HealInit() {
  useEffect(() => {
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => { window.removeEventListener('error', onWindowError); window.removeEventListener('unhandledrejection', onUnhandledRejection); if (batchTimer) clearTimeout(batchTimer); flush() }
  }, [])
  return null
}
