'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, LogOut } from 'lucide-react'
import { format, isBefore } from 'date-fns'
import { categoryStyles } from '@/lib/categoryStyles'

// Safe date parser
const safeDate = (dateStr: string) => {
  if (!dateStr) return new Date()
  return new Date(dateStr + 'T00:00:00')
}

interface Subscription {
  id: string
  category: string
  subscription_id: string
  amount: number
  billing_cycle: 'monthly' | 'yearly' | 'weekly'
  start_date: string
  end_date: string
  is_active: boolean
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  const { user, signOut } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const fullName = user?.user_metadata?.full_name || 'User'
  const welcomeMessage = `Welcome, ${fullName}`

  const getAvatarLetter = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return '?'
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  // Toggle subscription active/inactive
  const toggleSubscriptionStatus = async (sub: Subscription) => {
    if (!user) return
    try {
      const newStatus = !sub.is_active
      await supabase.from('subscriptions').update({ is_active: newStatus }).eq('id', sub.id)
      toast.success(`Subscription ${newStatus ? 'activated' : 'deactivated'}`)
      fetchSubscriptions()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update subscription status')
    }
  }

  // Fetch subscriptions & send alerts
  const fetchSubscriptions = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        const todayDate = new Date()
        for (const sub of data) {
          const endDate = safeDate(sub.end_date)
          if (isBefore(endDate, todayDate) && sub.is_active) {
            await supabase.from('subscriptions').update({ is_active: false }).eq('id', sub.id)
            toast.error(`⚠️ Your subscription ${sub.subscription_id} (${sub.category}) has expired!`)
          }
        }
      }
      setSubscriptions(data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [user])

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-white min-h-screen p-6">
        {/* Header with Avatar & Add Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
            Subscriptions
          </h1>

          <div className="flex items-center gap-4">
            {/* Add Subscription Button */}
            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingSub(null) }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" /> {editingSub ? 'Edit Subscription' : 'Add Subscription'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl bg-white border border-gray-300 text-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {editingSub ? 'Edit Subscription' : 'Add New Subscription'}
                  </DialogTitle>
                </DialogHeader>
                {/* You can add your form content here */}
              </DialogContent>
            </Dialog>

            {/* User Avatar */}
            <div className="flex items-center gap-3 relative">
              <span className="text-lg font-medium text-gray-800">{welcomeMessage}</span>

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
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{sub.category}</p>
                          <p className="text-sm text-gray-600">ID: {sub.subscription_id}</p>
                          <p className="text-sm text-gray-600">
                            Start: {format(safeDate(sub.start_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            End: {format(safeDate(sub.end_date), 'MMM dd, yyyy')}
                          </p>
                          <p
                            className={`mt-1 text-xs font-bold ${sub.is_active ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {sub.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <Switch
                          checked={sub.is_active}
                          onCheckedChange={() => toggleSubscriptionStatus(sub)}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg text-gray-900">
                          ₹{sub.amount.toLocaleString('en-IN')}
                        </p>
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
                          onClick={() => {}}
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
      </div>
    </DashboardLayout>
  )
}
