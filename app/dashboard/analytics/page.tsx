'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { DollarSign, CreditCard, BarChart2, TrendingUp, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ChartData { month: string; income: number; expenses: number }
interface CategoryData { name: string; value: number }

export default function AnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  // -------------------- Fetch Analytics --------------------
  const fetchAnalytics = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 5)
      const startOfRange = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`

      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfRange)
        .order('date', { ascending: true })

      const safeTxns = allTransactions || []

      const months: ChartData[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const monthName = date.toLocaleString('default', { month: 'short' })

        const monthTxns = safeTxns.filter(t => {
          const txnDate = new Date(t.date)
          return txnDate.getFullYear() === year && txnDate.getMonth() + 1 === month
        })

        const income = monthTxns
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const expenses = monthTxns
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        months.push({ month: monthName, income, expenses })
      }
      setMonthlyData(months)

      const now = new Date()
      const thisMonth = safeTxns.filter(t => {
        const txnDate = new Date(t.date)
        return txnDate.getFullYear() === now.getFullYear() &&
               txnDate.getMonth() === now.getMonth() &&
               t.type === 'expense'
      })

      const categoryMap = new Map<string, number>()
      thisMonth.forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + Number(t.amount))
      })

      const categoryResults = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
      setCategoryData(categoryResults)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // -------------------- Computed Metrics --------------------
  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0)
  const totalExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0)
  const avgMonthlySpending = totalExpenses / (monthlyData.length || 1)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  const fullName = user?.user_metadata?.full_name || 'User'
  const welcomeMessage = `Welcome, ${fullName}`
  const getAvatarLetter = () => user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'
  const handleSignOut = async () => { await signOut(); toast.success('Signed out successfully') }

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-6 bg-white p-6 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-64 bg-gray-200 rounded"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-white p-6 min-h-screen">

        {/* Header with welcome + avatar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="w-fit text-4xl font-extrabold tracking-tight drop-shadow-sm 
                           bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                           bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-gray-700">Visualize your spending patterns and financial trends</p>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 relative">
            <span className="text-lg font-medium text-gray-700">{welcomeMessage}</span>
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg cursor-pointer"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {getAvatarLetter()}
              </div>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg flex flex-col items-center p-2 z-10 border border-gray-300">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100 rounded-xl shadow p-6 text-center text-gray-900 transition">
            <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">₹{totalIncome.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Income (6 months)</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100 rounded-xl shadow p-6 text-center text-gray-900 transition">
            <CreditCard className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Expenses (6 months)</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100 rounded-xl shadow p-6 text-center text-gray-900 transition">
            <BarChart2 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">₹{avgMonthlySpending.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Avg Monthly Spending</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100 rounded-xl shadow p-6 text-center text-gray-900 transition">
            <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Savings Rate</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses */}
          <Card className="bg-white border border-gray-200 shadow">
            <CardHeader>
              <CardTitle className="text-gray-900">Income vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card className="bg-white border border-gray-200 shadow">
            <CardHeader>
              <CardTitle className="text-gray-900">Expense Categories (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Spending Comparison */}
          <Card className="bg-white border border-gray-200 shadow">
            <CardHeader>
              <CardTitle className="text-gray-900">Monthly Spending Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card className="bg-white border border-gray-200 shadow">
            <CardHeader>
              <CardTitle className="text-gray-900">Net Income (Income - Expenses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData.map(d => ({ ...d, net: d.income - d.expenses }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                  <Bar dataKey="net" fill="#10B981" name="Net Income" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}
