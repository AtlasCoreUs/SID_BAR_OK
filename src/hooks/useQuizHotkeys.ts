'use client'
import { useEffect } from 'react'

export function useQuizHotkeys(actions: {
  daily: () => void
  weekly: () => void
  monthly: () => void
  stats: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            actions.daily()
            break
          case '2':
            e.preventDefault()
            actions.weekly()
            break
          case '3':
            e.preventDefault()
            actions.monthly()
            break
          case '4':
            e.preventDefault()
            actions.stats()
            break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions])
}