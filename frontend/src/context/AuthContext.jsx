import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('foodbridge_user')
    const token = localStorage.getItem('foodbridge_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('foodbridge_token', access_token)
    localStorage.setItem('foodbridge_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    return res.data
  }

  const verifyOtp = async (email, otp) => {
    const res = await authApi.verifyOtp({ email, otp })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('foodbridge_token')
    localStorage.removeItem('foodbridge_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
