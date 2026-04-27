import { useEffect } from 'react'

export function useLockHorizontalScroll(dependency) {
  useEffect(() => {
    const reset = () => {
      if (window.scrollX !== 0) window.scrollTo(0, window.scrollY)
      document.documentElement.scrollLeft = 0
      document.body.scrollLeft = 0
    }

    reset()
    window.addEventListener('resize', reset)
    window.addEventListener('orientationchange', reset)

    return () => {
      window.removeEventListener('resize', reset)
      window.removeEventListener('orientationchange', reset)
    }
  }, [dependency])
}
