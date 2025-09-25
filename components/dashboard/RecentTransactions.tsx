'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import {
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Heart,
  Gamepad2,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
  id: string
  date: string
  category: string
  subcategory: string
  amount: number
  type: 'income' | 'expense'
  description: string
  subscription_id?: string // optional, to link with subscriptions
}

interface RecentTransactionsProps {
  onTransactionAdded?: (newTransaction: Transaction) => void
  refreshTrigger?: number // optional trigger to reload transactions
}

const categoryIcons: Record<string, any> = {
  Food: Utensils,
  Shopping: ShoppingCart,
  Housing: Home,
  Transportation: Car,
  Healthcare: Heart,
  Entertainment: Gamepad2,
  Income: DollarSign,
}

export default function RecentTransactions({
  onTransactionAdded,
  refreshTrigger,
}: RecentTransactionsProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [viewAll, setViewAll] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!viewAll) query = query.limit(5)

      const { data, error } = await query
      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load recent transactions')
    } finally {
      setLoading(false)
    }
  }, [user, viewAll])

  // Fetch whenever component mounts or refreshTrigger changes
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions, refreshTrigger])

  // Optional: call this when a new transaction is added externally
  const handleNewTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => [newTransaction, ...prev])
    onTransactionAdded?.(newTransaction)
  }

  return (
    <Card className="shadow-md bg-white border border-gray-200 text-gray-900">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          onClick={() => setViewAll(!viewAll)}
        >
          {viewAll ? 'Show Less' : 'View All'}
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No transactions yet. Start tracking your expenses!
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map(transaction => {
              const Icon = categoryIcons[transaction.category] || DollarSign
              return (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 rounded-lg border shadow-sm transition-all ${
                    transaction.type === 'income'
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-red-50 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium flex items-center text-gray-900">
                        {transaction.subcategory}{' '}
                        <Badge
                          className={`ml-2 text-xs ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }`}
                        >
                          {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                        </Badge>
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs mt-1 border-gray-300 text-gray-600"
                    >
                      {transaction.category}
                    </Badge>
                    {transaction.subscription_id && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Sub ID: {transaction.subscription_id}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
