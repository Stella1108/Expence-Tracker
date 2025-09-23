'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface Transaction {
  id: string
  date: string
  category: string
  subcategory: string
  amount: number
  type: 'income' | 'expense'
  description: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [view, setView] = useState<'month' | 'year' | 'day'>('month')
  const { user } = useAuth()
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Set welcome msg
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setWelcomeMessage(`Welcome, ${user.user_metadata.full_name}!`)
    } else if (user?.email) {
      setWelcomeMessage(`Welcome, ${user.email.split('@')[0]}!`)
    }
  }, [user])

  const getAvatarLetter = () => {
    if (user?.user_metadata?.full_name)
      return user.user_metadata.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return '?'
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const deleteTransaction = async (id: string) => {
    try {
      await supabase.from('transactions').delete().eq('id', id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Transaction deleted')
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  // 🔹 Group by Month
  const transactionsByMonth = Object.entries(
    transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
      const monthKey = format(new Date(t.date), 'MMMM yyyy')
      if (!acc[monthKey]) acc[monthKey] = []
      acc[monthKey].push(t)
      return acc
    }, {})
  ).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())

  // 🔹 Group by Year
  const transactionsByYear = Object.entries(
    transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
      const yearKey = format(new Date(t.date), 'yyyy')
      if (!acc[yearKey]) acc[yearKey] = []
      acc[yearKey].push(t)
      return acc
    }, {})
  ).sort(([a], [b]) => parseInt(b) - parseInt(a))

  // 🔹 Group by Day
  const transactionsByDay = Object.entries(
    transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
      const dayKey = format(new Date(t.date), 'dd MMM yyyy')
      if (!acc[dayKey]) acc[dayKey] = []
      acc[dayKey].push(t)
      return acc
    }, {})
  ).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())

  const groupedData =
    view === 'year'
      ? transactionsByYear
      : view === 'day'
      ? transactionsByDay
      : transactionsByMonth

  const currentTransactions = groupedData[currentIndex]

  const handlePrev = () => {
    if (currentIndex < groupedData.length - 1) setCurrentIndex(currentIndex + 1)
  }
  const handleNext = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
              Transactions
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              Browse your transactions by {view}
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 relative">
            <span className="text-lg font-medium text-gray-700">{welcomeMessage}</span>

            <div className="relative">
              <div
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg cursor-pointer"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {getAvatarLetter()}
              </div>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg flex flex-col items-center p-2 z-10 border border-gray-200">
                  <span className="text-sm text-gray-700 truncate">{user?.email}</span>
                  <Button
                    variant="outline"
                    className="mt-2 w-full text-red-500 border-gray-300 flex items-center justify-center gap-1 hover:bg-gray-100"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex gap-3">
          {['day', 'month', 'year'].map(mode => (
            <Button
              key={mode}
              onClick={() => {
                setView(mode as 'day' | 'month' | 'year')
                setCurrentIndex(0)
              }}
              className={`rounded-full px-5 py-2 font-medium transition-all ${
                view === mode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-indigo-300 text-indigo-600 bg-white hover:bg-indigo-50'
              }`}
            >
              {mode === 'day' ? 'Daily' : mode === 'month' ? 'Monthly' : 'Yearly'}
            </Button>
          ))}
        </div>

        {/* Transactions */}
        {loading ? (
          <p className="text-gray-600 py-8">Loading...</p>
        ) : groupedData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <Card className="rounded-2xl shadow-lg overflow-hidden bg-white border border-gray-200 text-gray-900">
            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 p-4">
              {/* Income */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center rounded-xl shadow-md p-4 bg-green-50 border-l-4 border-green-400 text-gray-900"
              >
                <ArrowUpCircle className="h-7 w-7 text-green-600 mb-1" />
                <p className="text-sm text-green-600 font-medium">Income</p>
                <motion.p
                  key={`income-${currentTransactions[0]}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-bold text-lg"
                >
                  {currentTransactions[1]
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                    .toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </motion.p>
              </motion.div>

              {/* Expenses */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center rounded-xl shadow-md p-4 bg-red-50 border-l-4 border-red-400 text-gray-900"
              >
                <ArrowDownCircle className="h-7 w-7 text-red-600 mb-1" />
                <p className="text-sm text-red-600 font-medium">Expenses</p>
                <motion.p
                  key={`expense-${currentTransactions[0]}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-bold text-lg"
                >
                  {currentTransactions[1]
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                    .toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </motion.p>
              </motion.div>

              {/* Net */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center rounded-xl shadow-md p-4 border-l-4 ${
                  currentTransactions[1].reduce(
                    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                    0
                  ) >= 0
                    ? 'bg-indigo-50 border-indigo-400'
                    : 'bg-yellow-50 border-yellow-400'
                } text-gray-900`}
              >
                <Wallet className="h-7 w-7 text-indigo-600 mb-1" />
                <p className="text-sm text-indigo-600 font-medium">Net</p>
                <motion.p
                  key={`net-${currentTransactions[0]}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-bold text-lg"
                >
                  {currentTransactions[1]
                    .reduce(
                      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                      0
                    )
                    .toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </motion.p>
              </motion.div>
            </div>

            {/* Header with navigation */}
            <CardHeader className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={handlePrev}
                disabled={currentIndex >= groupedData.length - 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <CardTitle className="text-gray-800 font-semibold">
                {currentTransactions[0]}
              </CardTitle>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={handleNext}
                disabled={currentIndex <= 0}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardHeader>

            {/* Transactions List */}
            <CardContent className="divide-y divide-gray-200 px-4 py-2">
              {currentTransactions[1].map(transaction => (
                <motion.div
                  key={transaction.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between py-3 px-2 rounded-lg transition duration-200 border-l-4 border-gray-200 bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{transaction.subcategory}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(transaction.date), 'dd MMM yyyy')}
                    </p>
                    {transaction.description && (
                      <p className="text-sm text-gray-700">{transaction.description}</p>
                    )}
                    <Badge variant="outline" className="mt-1 border-gray-300 text-gray-700">
                      {transaction.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => deleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
