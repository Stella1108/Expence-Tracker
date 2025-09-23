'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrendingDown, Wallet, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function BudgetPage() {
  const { user, signOut } = useAuth()
  const [budget, setBudget] = useState<number>(0)
  const [spend, setSpend] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)
  const [inputBudget, setInputBudget] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const fetchBudgetData = async () => {
    if (!user) return
    try {
      const now = new Date()
      const currentMonth = now.toISOString().slice(0, 7)

      const { data: txns } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)

      const monthExpenses =
        txns
          ?.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setSpend(monthExpenses)

      const { data: budgets } = await supabase
        .from('budgets')
        .select('month, amount')
        .eq('user_id', user.id)
        .eq('month', currentMonth)

      const thisMonthBudget = budgets && budgets.length > 0 ? budgets[0].amount : 0
      setBudget(Number(thisMonthBudget))
      setRemaining(thisMonthBudget > 0 ? thisMonthBudget - monthExpenses : 0)

      if (thisMonthBudget > 0 && monthExpenses > thisMonthBudget) {
        toast.error('⚠️ You have crossed your budget limit!')

        if (user?.email) {
          fetch('/api/sendBudgetAlert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              spend: monthExpenses,
              budget: thisMonthBudget,
            }),
          })
            .then((res) => res.json())
            .then((data) => console.log('Email sent:', data))
            .catch((err) => console.error('Email error:', err))
        }
      }
    } catch (error) {
      console.error('Error fetching budget data:', error)
    }
  }

  useEffect(() => {
    fetchBudgetData()
  }, [user])

  const handleSetBudget = async () => {
    const newBudget = parseFloat(inputBudget)
    if (isNaN(newBudget) || newBudget <= 0) {
      toast.error('Please enter a valid budget amount')
      return
    }

    const currentMonth = new Date().toISOString().slice(0, 7)

    const { error } = await supabase.from('budgets').upsert({
      user_id: user?.id,
      month: currentMonth,
      amount: newBudget,
    })

    if (error) {
      console.error('Error saving budget:', error)
      toast.error('Failed to save budget')
      return
    }

    setBudget(newBudget)
    setInputBudget('')
    setIsDialogOpen(false)
    toast.success(`✅ Monthly budget set: ₹${newBudget}`)
    fetchBudgetData()
  }

  const chartData = [
    { name: 'Spent', value: spend },
    { name: 'Remaining', value: remaining > 0 ? remaining : 0 },
  ]
  const COLORS = ['#ef4444', '#22c55e']

  const fullName = user?.user_metadata?.full_name || 'User'
  const welcomeMessage = `Welcome, ${fullName}`
  const getAvatarLetter = () =>
    user?.user_metadata?.full_name?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || '?'
  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-white p-6 min-h-screen">
        {/* Header with Welcome + Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm
              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
              bg-clip-text text-transparent">
              Budget
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              Track your monthly spending limit
            </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
          {/* Current Budget Card */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="bg-white text-gray-900 shadow-lg rounded-3xl overflow-hidden border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-2xl font-bold flex items-center space-x-2">
                  <Wallet className="h-6 w-6" />
                  <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    This Month
                  </span>
                </CardTitle>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 text-white rounded-xl hover:opacity-90">
                      Set Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        Set Monthly Budget
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="number"
                        placeholder="Enter monthly budget"
                        value={inputBudget}
                        onChange={(e) => setInputBudget(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                      <Button
                        onClick={handleSetBudget}
                        className="w-full rounded-xl bg-green-500 text-white hover:opacity-90"
                      >
                        Save Budget
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="p-5 rounded-2xl bg-gray-50 text-center">
                  <p className="text-lg font-medium text-gray-700">Monthly Budget</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    ₹{budget.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                    <span className="text-lg font-medium text-red-500">This Month Spend</span>
                  </div>
                  <p className="text-3xl font-extrabold text-red-600">
                    ₹{spend.toLocaleString('en-IN')}
                  </p>
                </div>

                {budget > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Used {((spend / budget) * 100).toFixed(1)}% of your budget
                    </p>
                    <Progress
                      value={(spend / budget) * 100}
                      className="h-3 bg-gray-200"
                    />
                    <p className="text-sm font-semibold text-green-600">
                      Remaining: ₹{remaining.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Donut Chart */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="bg-white text-gray-900 shadow-lg rounded-3xl overflow-hidden border border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Budget Usage
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
