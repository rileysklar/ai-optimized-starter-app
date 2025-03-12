"use client"

import { createContext, useContext, useCallback } from "react"
import confetti from "canvas-confetti"

// Define the context type
type ConfettiContextType = {
  triggerConfetti: (options?: confetti.Options) => void
  triggerSuccess: () => void
  triggerAchievement: () => void
}

// Create the context
const ConfettiContext = createContext<ConfettiContextType | null>(null)

// Default options for different types of celebrations
const successOptions: confetti.Options = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
}

const achievementOptions: confetti.Options = {
  particleCount: 200,
  spread: 160,
  origin: { y: 0.7 },
  colors: ["#FFD700", "#FFC107", "#FF9800"]
}

// Provider component
export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  // General purpose confetti trigger with custom options
  const triggerConfetti = useCallback((options?: confetti.Options) => {
    confetti({
      ...options
    })
  }, [])

  // Pre-configured success celebration
  const triggerSuccess = useCallback(() => {
    confetti(successOptions)
  }, [])

  // Pre-configured achievement celebration
  const triggerAchievement = useCallback(() => {
    confetti(achievementOptions)
  }, [])

  return (
    <ConfettiContext.Provider
      value={{
        triggerConfetti,
        triggerSuccess,
        triggerAchievement
      }}
    >
      {children}
    </ConfettiContext.Provider>
  )
}

// Hook to use the confetti functionality
export function useConfetti() {
  const context = useContext(ConfettiContext)

  if (!context) {
    throw new Error("useConfetti must be used within a ConfettiProvider")
  }

  return context
}
