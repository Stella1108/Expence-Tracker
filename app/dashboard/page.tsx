'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { WalletCard } from '@/components/dashboard/WalletCard'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import { TransactionForm } from '@/components/dashboard/TransactionForm'
import { Button } from '@/components/ui/button'
import { LogOut, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user } = useAuth()
  const [welcomeMessage, setWelcomeMessage] = useState('')

  // Set welcome message
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setWelcomeMessage(`Welcome, ${user.user_metadata.full_name}!`)
    } else if (user?.email) {
      setWelcomeMessage(`Welcome, ${user.email.split('@')[0]}!`)
    }
  }, [user])

  const getAvatarLetter = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return '?'
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Triggered when a transaction is added via RecentTransactions callback
  const handleTransactionAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <DashboardLayout className="bg-white text-gray-900 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-4xl font-extrabold tracking-tight drop-shadow-sm
                         bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                         bg-clip-text text-transparent"
            >
              Overview
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              Track your expenses and manage your budget
            </p>
          </div>

          {/* Right side */}
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

        {/* Add Transaction Button */}
        <div className="flex justify-end">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={() => setIsTransactionFormOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>

        {/* Transaction Form Modal */}
        <TransactionForm
          isOpen={isTransactionFormOpen}
          onClose={() => setIsTransactionFormOpen(false)}
          onSuccess={() => {
            setIsTransactionFormOpen(false)
            setRefreshKey(prev => prev + 1) // refresh RecentTransactions and WalletCard
          }}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet */}
          <div className="lg:col-span-1">
            <WalletCard refreshTrigger={refreshKey} />
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <RecentTransactions
              key={refreshKey} // forces re-render on transaction add
              onTransactionAdded={handleTransactionAdded} // handle subscription additions
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
