'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { IndianRupee, Plus, TrendingDown } from 'lucide-react'

interface WalletStats {
  balance: number
  spend: number
  remaining: number
}

interface WalletCardProps {
  refreshTrigger?: number
}

export function WalletCard({ refreshTrigger }: WalletCardProps) {
  const [stats, setStats] = useState<WalletStats>({ balance: 0, spend: 0, remaining: 0 })
  const [amount, setAmount] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchStats = useCallback(async () => {
    if (!user) return
    try {
      const { data: txns, error } = await supabase.from('transactions').select('id, amount, type').eq('user_id', user.id)
      if (error) throw error

      const balance = txns?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const spend = txns?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const remaining = balance - spend

      setStats({ balance, spend, remaining })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to fetch wallet stats')
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats, refreshTrigger])

  const handleAddMoney = async () => {
    if (!user || !amount) return
    setLoading(true)

    try {
      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) {
        toast.error('Enter a valid amount')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        category: 'Income',
        subcategory: 'Wallet Top-up',
        amount: amt,
        type: 'income',
        description: 'Wallet top-up',
      }])

      if (error) throw error

      setAmount('')
      setIsDialogOpen(false)
      toast.success(`₹${amt} added to wallet`)
      fetchStats()
    } catch (error) {
      console.error('Add money error:', error)
      toast.error('Failed to add money')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto p-2">
      <Card className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-xl rounded-2xl overflow-hidden transition-transform hover:scale-[1.01]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">Wallet Overview</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm transition"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Add Money</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl" />
                <Button onClick={handleAddMoney} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:opacity-90 transition">
                  {loading ? 'Processing...' : 'Add Money'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 text-center">
            {/* Balance */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <IndianRupee className="h-5 w-5 mr-2 opacity-80" />
                <span className="text-sm font-medium">Balance</span>
              </div>
              <p className="text-xl font-bold">₹{stats.balance.toLocaleString('en-IN')}</p>
            </div>

            {/* Spend */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-5 w-5 mr-2 opacity-80" />
                <span className="text-sm font-medium">Spend</span>
              </div>
              <p className="text-xl font-bold text-red-300">₹{stats.spend.toLocaleString('en-IN')}</p>
            </div>

            {/* Remaining */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-2">
                <IndianRupee className="h-5 w-5 mr-2 opacity-80" />
                <span className="text-sm font-medium">Remaining</span>
              </div>
              <p className="text-xl font-bold text-green-300">₹{stats.remaining.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
