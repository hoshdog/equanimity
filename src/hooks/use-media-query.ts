import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const matchMedia = window.matchMedia(query)
    
    // Set initial value
    setMatches(matchMedia.matches)
    
    // Create event listener function
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }
    
    // Add the event listener
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange)
    } else {
      matchMedia.addEventListener('change', handleChange)
    }
    
    // Clean up
    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange)
      } else {
        matchMedia.removeEventListener('change', handleChange)
      }
    }
  }, [query])

  return matches
}