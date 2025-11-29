import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Logo from "../common/Logo"
import apiService from "../../services/api"

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      if (isLogin) {
        const response = await apiService.login({
          username: formData.email,
          password: formData.password
        })
        
        if (response.success) {
          localStorage.setItem("isAuthenticated", "true")
          navigate("/app/dashboard")
          window.location.reload()
        } else {
          setError(response.message || "Login failed")
        }
      } else {
        // Handle signup - for now just show message
        setError("Signup not implemented yet. Use demo credentials.")
      }
    } catch (err) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <Logo size="lg" variant="dark" />
          <h1 className="text-3xl font-bold text-white">TaskHive</h1>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-white text-center">
              {isLogin ? "Welcome back" : "Create account"}
            </h3>
            <p className="text-sm text-gray-300 text-center">
              {isLogin ? "Enter your credentials to access your account" : "Enter your information to create an account"}
            </p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#ffc44d' }}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                  Username/Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="Enter username or email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffc44d' }}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffc44d' }}
                  required
                />
              </div>
              
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#ffc44d' }}
                    required
                  />
                </div>
              )}
              
              {error && (
                <div className="text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-black font-semibold py-2 px-4 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#ffc44d' }}
              >
                {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </button>
            </form>
            
            {isLogin && (
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-2">Demo Credentials:</div>
                <div className="text-xs text-gray-300">
                  Admin: root / root123<br/>
                  User: user / user123
                </div>
              </div>
            )}
            
            <div className="text-center">
              <span className="text-sm text-gray-300">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium hover:opacity-80 transition-colors"
                style={{ color: '#ffc44d' }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}