import { useState, useEffect } from 'react'

export const useMobileDetection = (breakpoint = 768, debounceMs = 150) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint
    }
    return false
  })

  useEffect(() => {
    let timeoutId

    const checkMobile = () => {
      const newIsMobile = window.innerWidth < breakpoint
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev)
    }

    const debouncedCheck = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, debounceMs)
    }

    checkMobile()
    window.addEventListener('resize', debouncedCheck, { passive: true })
    return () => {
      window.removeEventListener('resize', debouncedCheck)
      clearTimeout(timeoutId)
    }
  }, [breakpoint, debounceMs])

  return isMobile
}

export default useMobileDetection
