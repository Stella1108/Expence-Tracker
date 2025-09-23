'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  BarChart3,
  CreditCard,
  Home,
  LogOut,
  Receipt,
  Repeat,
  Wallet,
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/dashboard/transactions', icon: Receipt },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: Repeat },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'budget', href: '/dashboard/budget', icon: Wallet },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Avatar first letter
  const getAvatarLetter = () => {
    if (user?.user_metadata?.full_name)
      return user.user_metadata.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return '?'
  }

  return (
    <div className="w-1/4 min-w-[250px] max-w-[350px] bg-white text-gray-900 flex flex-col h-screen border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center space-x-3"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-3 rounded-xl bg-indigo-600 shadow-md"
          >
            <CreditCard className="h-6 w-6 text-white drop-shadow" />
          </motion.div>

          <h1
            className="whitespace-nowrap text-3xl sm:text-4xl md:text-3xl font-extrabold tracking-tight
                       bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                       bg-clip-text text-transparent"
          >
            Expense Tracker
          </h1>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start px-3 h-12 text-lg font-semibold transition-all rounded-lg',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              )}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="mr-3 h-6 w-6" />
              {item.name}
            </Button>
          )
        })}
      </nav>

      {/* Sign Out button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start px-3 h-12 text-lg font-semibold text-gray-700 hover:text-red-600 hover:bg-gray-100"
        >
          <LogOut className="mr-3 h-6 w-6" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
