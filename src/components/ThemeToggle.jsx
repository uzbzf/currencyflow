import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      aria-pressed={isDark}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className="group relative inline-flex h-11 shrink-0 touch-manipulation items-center gap-2 rounded-2xl border border-border bg-surface-elevated px-2.5 text-ink shadow-sm transition-all duration-300 hover:border-accent hover:text-accent hover:shadow-md active:scale-95 sm:px-3"
    >
      <span className="relative flex h-7 w-[3.25rem] items-center rounded-full bg-surface-muted p-0.5 transition-colors duration-300">
        <span
          className={`absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow transition-transform duration-300 ${
            isDark ? 'translate-x-[1.35rem]' : 'translate-x-0'
          }`}
        >
          <Sun
            className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <Moon
            className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </span>
      </span>
      <span className="hidden text-xs font-semibold sm:inline">
        {isDark ? 'Тёмная' : 'Светлая'}
      </span>
    </button>
  )
}
