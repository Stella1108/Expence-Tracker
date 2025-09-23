'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, TrendingUp, DollarSign, BarChart2, PieChart, Wallet } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-indigo-500"></div>
      </div>
    )
  }

  const features = [
    {
      title: 'Track Expenses',
      description: 'Easily record and categorize all your transactions with our intuitive interface.',
      icon: <TrendingUp className="h-12 w-12 text-indigo-500 mx-auto" />,
    },
    {
      title: 'Manage Subscriptions',
      description: 'Keep track of all your recurring subscriptions and never miss a billing date.',
      icon: <Wallet className="h-12 w-12 text-pink-500 mx-auto" />,
    },
    {
      title: 'Analytics & Insights',
      description: 'Visualize your spending patterns with beautiful charts and detailed analytics.',
      icon: <BarChart2 className="h-12 w-12 text-purple-500 mx-auto" />,
    },
    {
      title: 'Budget Management',
      description: 'Set budgets, track your wallet balance, and achieve your financial goals.',
      icon: <PieChart className="h-12 w-12 text-green-500 mx-auto" />,
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-indigo-500 to-pink-500 p-4 rounded-2xl shadow-lg shadow-indigo-200"
            >
              <CreditCard className="h-8 w-8 text-white drop-shadow-lg" />
            </motion.div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Expense Tracker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Take control of your finances with our comprehensive expense tracking solution. 
            Monitor spending, manage subscriptions, and gain insights into your financial habits.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className="text-center bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-xl rounded-2xl transform hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer / Call to Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mt-20"
        >
          <p className="text-gray-700 text-lg">
            Join thousands of users already managing their finances smarter.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
