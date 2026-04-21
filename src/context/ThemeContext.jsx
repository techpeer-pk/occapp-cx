import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'warm')
    if (theme !== 'light') root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const cycleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'warm' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
