'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface AuthFormProps {
  mode: 'signup' | 'login'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        toast.success('Account created! Please check your email to confirm.')
        router.push('/login')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error || !data.user) throw new Error('Invalid email or password')
        toast.success('Successfully logged in!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 space-y-6">
      {/* Animated Gradient Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg"
      >
        Expense Tracker
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white shadow-xl border border-gray-200 rounded-2xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-extrabold text-indigo-600">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {mode === 'signup'
                ? 'Sign up to start tracking your expenses'
                : 'Sign in to your expense tracker'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-gray-100 text-black border-gray-300 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-100 text-black border-gray-300 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-100 text-black border-gray-300 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md transition-all"
                disabled={loading}
              >
                {loading
                  ? mode === 'signup'
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
              </Button>
            </form>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link
                  href={mode === 'signup' ? '/login' : '/signup'}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
