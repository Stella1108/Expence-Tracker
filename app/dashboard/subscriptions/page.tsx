'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { format, isBefore, differenceInDays } from 'date-fns'
import { AiOutlineMail, AiOutlineCloud } from 'react-icons/ai'
import { SiHostinger } from 'react-icons/si'
import { FaServer } from 'react-icons/fa'
import RecentTransactions from '@/components/dashboard/RecentTransactions'

// Safe date parser
const safeDate = (dateStr: string) =>
  dateStr ? new Date(dateStr + 'T00:00:00') : new Date()

interface Subscription {
  id: string
  category: 'Outlook' | 'Instantly.ai' | 'Hostinger' | 'SiteGround' | string
  subscription_id: string
  amount: number
  billing_cycle: 'monthly' | 'yearly' | 'weekly'
  start_date: string
  end_date: string
  is_active: boolean
}

// Map categories to icons and colors
const categoryStyles: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  Outlook: { icon: AiOutlineMail, color: 'text-blue-600' },
  'Instantly.ai': { icon: AiOutlineCloud, color: 'text-purple-600' },
  Hostinger: { icon: SiHostinger, color: 'text-orange-600' },
  SiteGround: { icon: FaServer, color: 'text-green-600' },
}

const categories = Object.keys(categoryStyles)

export default function SubscriptionsPage() {
  const { user } = useAuth()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [category, setCategory] = useState<Subscription['category']>('Outlook')
  const [subId, setSubId] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'weekly'>('monthly')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)

  // For triggering RecentTransactions refresh
  const [refreshTransactions, setRefreshTransactions] = useState(0)

  // Fetch subscriptions and check expiration
  const fetchSubscriptions = useCallback(async () => {
    if (!user) return setLoading(true)
    setLoading(true)

    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        const today = new Date()
        for (const sub of data) {
          const endD = safeDate(sub.end_date)
          const daysLeft = differenceInDays(endD, today)

          if (isBefore(endD, today) && sub.is_active) {
            await supabase.from('subscriptions').update({ is_active: false }).eq('id', sub.id)
            toast.error(`⚠️ Subscription ${sub.subscription_id} (${sub.category}) expired!`)
          } else if (daysLeft >= 0 && daysLeft <= 3 && sub.is_active) {
            toast.warning(
              `⏳ Subscription ${sub.subscription_id} (${sub.category}) is expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
            )
          }
        }
      }

      setSubscriptions(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const toggleSubscriptionStatus = async (sub: Subscription) => {
    if (!user) return
    try {
      const newStatus = !sub.is_active
      await supabase.from('subscriptions').update({ is_active: newStatus }).eq('id', sub.id)
      toast.success(`Subscription ${newStatus ? 'Activated' : 'Deactivated'}`)
      fetchSubscriptions()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update subscription status')
    }
  }

  const handleSaveSubscription = async () => {
    if (!user) return
    if (!category || !subId || !amount || !startDate || !endDate) {
      toast.error('Please fill all fields')
      return
    }

    const payload: Omit<Subscription, 'id'> & { user_id: string } = {
      user_id: user.id,
      category,
      subscription_id: subId,
      amount,
      billing_cycle: billingCycle,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
    }

    try {
      if (editingSub) {
        await supabase.from('subscriptions').update(payload).eq('id', editingSub.id)
        toast.success('Subscription updated')
      } else {
        await supabase.from('subscriptions').insert(payload)
        toast.success('Subscription added')

        // Automatically create a linked transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          date: new Date().toISOString(),
          category,
          subcategory: subId,
          type: 'expense',
          amount,
          description: `${category} subscription`,
          subscription_id: subId,
        })
        setRefreshTransactions(prev => prev + 1) // trigger RecentTransactions refresh
      }

      // Reset form
      setIsFormOpen(false)
      setEditingSub(null)
      setCategory('Outlook')
      setSubId('')
      setAmount(0)
      setBillingCycle('monthly')
      setStartDate('')
      setEndDate('')
      setIsActive(true)
      fetchSubscriptions()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save subscription')
    }
  }

  // Populate form when editing
  useEffect(() => {
    if (editingSub) {
      setCategory(editingSub.category)
      setSubId(editingSub.subscription_id)
      setAmount(editingSub.amount)
      setBillingCycle(editingSub.billing_cycle)
      setStartDate(editingSub.start_date)
      setEndDate(editingSub.end_date)
      setIsActive(editingSub.is_active)
      setIsFormOpen(true)
    }
  }, [editingSub])

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-white min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
            Subscriptions
          </h1>

          {/* Add/Edit Subscription Dialog */}
          <Dialog
            open={isFormOpen}
            onOpenChange={(open: boolean) => {
              setIsFormOpen(open)
              if (!open) setEditingSub(null)
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {editingSub ? 'Edit Subscription' : 'Add Subscription'}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl bg-white border border-gray-300 text-gray-900 space-y-4 p-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingSub ? 'Edit Subscription' : 'Add New Subscription'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCategory(e.target.value as Subscription['category'])
                  }
                  className="w-full rounded-lg border-gray-300 p-2"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <Label>Subscription ID</Label>
                <Input
                  value={subId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubId(e.target.value)}
                  placeholder="Enter subscription ID"
                />

                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAmount(Number(e.target.value))
                  }
                  placeholder="Enter amount"
                />

                <Label>Billing Cycle</Label>
                <select
                  value={billingCycle}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setBillingCycle(e.target.value as 'monthly' | 'yearly' | 'weekly')
                  }
                  className="w-full rounded-lg border-gray-300 p-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                </select>

                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                />

                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                />

                {/* Toggle Active/Inactive */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    ></span>
                  </Button>
                  <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <Button
                  onClick={handleSaveSubscription}
                  className="w-full bg-green-500 text-white rounded-lg"
                >
                  {editingSub ? 'Update Subscription' : 'Add Subscription'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscriptions List */}
        <Card className="rounded-2xl shadow-lg bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800 text-xl">Active Subscriptions</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : subscriptions.length === 0 ? (
              <p className="text-gray-500">No subscriptions added yet</p>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => {
                  const { icon: Icon, color } = categoryStyles[sub.category] || {}

                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 border-gray-200 hover:bg-gray-100 transition duration-200"
                    >
                      {/* LEFT: Toggle */}
                      <div className="flex flex-col items-center gap-2 mr-4">
                        <Button
                          type="button"
                          onClick={() => toggleSubscriptionStatus(sub)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            sub.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                              sub.is_active ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          ></span>
                        </Button>
                        <span
                          className={`text-sm font-medium ${
                            sub.is_active ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* MIDDLE: Details */}
                      <div className="flex items-center gap-3 flex-1">
                        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
                        <div className="flex flex-col gap-1">
                          <p className="text-lg font-semibold text-gray-900">{sub.category}</p>
                          <p className="text-sm text-gray-600">ID: {sub.subscription_id}</p>
                          <p className="text-sm text-gray-600">
                            Start: {format(safeDate(sub.start_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            End: {format(safeDate(sub.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT: Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSub(sub)}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await supabase.from('subscriptions').delete().eq('id', sub.id)
                            toast.success('Subscription deleted')
                            fetchSubscriptions()
                            setRefreshTransactions(prev => prev + 1) // refresh transactions
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <RecentTransactions refreshTrigger={refreshTransactions} />
      </div>
    </DashboardLayout>
  )
}
