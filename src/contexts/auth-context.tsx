'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored auth state on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth-user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem('auth-user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Demo credentials - in production, this would be a real API call
    const validCredentials = [
      { email: 'admin@dach-events.com', password: 'admin123', role: 'ADMIN' as const },
      { email: 'user@dach-events.com', password: 'user123', role: 'USER' as const },
      { email: 'demo@demo.com', password: 'demo', role: 'ADMIN' as const }
    ]

    const validUser = validCredentials.find(
      cred => cred.email === email && cred.password === password
    )

    if (validUser) {
      const userData: User = {
        id: 'user-' + Date.now(),
        email: validUser.email,
        name: validUser.email.split('@')[0],
        role: validUser.role
      }

      setUser(userData)
      localStorage.setItem('auth-user', JSON.stringify(userData))
      setIsLoading(false)
      return true
    } else {
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth-user')
  }

  const value = {
    user,
    login,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}