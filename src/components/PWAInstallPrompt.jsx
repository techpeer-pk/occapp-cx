import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return

    const show = (e) => { setPrompt(e); setVisible(true) }

    // already fired before React mounted
    if (window.__pwaPrompt) {
      show(window.__pwaPrompt)
      return
    }

    // catch it if it fires after mount
    const handler = (e) => { e.preventDefault(); window.__pwaPrompt = e; show(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
  }

  const dismiss = () => {
    localStorage.setItem('pwa-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,15,30,0.75)', backdropFilter: 'blur(6px)' }}>

      {/* Orbs — same as login */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="pwa-orb pwa-orb-1" />
        <div className="pwa-orb pwa-orb-2" />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-pwa-slide"
        style={{ background: 'linear-gradient(135deg, #0f1628 0%, #1a0d1f 100%)', border: '1px solid rgba(107,15,26,0.4)', boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>

        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6b0f1a, #4f46e5, #302b63)' }} />

        {/* Dismiss */}
        <button onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <X size={15} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6b0f1a, #9b1426)', boxShadow: '0 8px 24px rgba(107,15,26,0.5)' }}>
              <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>A</span>
            </div>
            <div>
              <p className="font-semibold text-white text-base">ARY Cash Portal</p>
              <p className="text-xs mt-0.5" style={{ color: '#8b9ab5' }}>Install karo for quick access</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2.5 mb-6">
            {[
              { icon: '⚡', text: 'Instant launch — no browser needed' },
              { icon: '📶', text: 'Works offline too' },
              { icon: '🔔', text: 'Home screen pe shortcut' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-sm" style={{ color: '#8b9ab5' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={install}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6b0f1a, #9b1426)', boxShadow: '0 4px 16px rgba(107,15,26,0.5)' }}>
              <Download size={15} />
              Install App
            </button>
            <button onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8b9ab5', border: '1px solid rgba(255,255,255,0.08)' }}>
              Baad mein
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
