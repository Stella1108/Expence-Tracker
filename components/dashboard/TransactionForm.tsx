'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const categories = {
  expense: [
    { value: 'Food', subcategories: ['Groceries', 'Restaurants', 'Delivery', 'Coffee'], icon: '🍔' },
    { value: 'Shopping', subcategories: ['Clothing', 'Electronics', 'Books', 'Gifts'], icon: '🛍️' },
    { value: 'Housing', subcategories: ['Rent', 'Utilities', 'Internet', 'Maintenance'], icon: '🏠' },
    { value: 'Transportation', subcategories: ['Gas', 'Public Transport', 'Taxi/Uber', 'Parking'], icon: '🚗' },
    { value: 'Healthcare', subcategories: ['Doctor', 'Pharmacy', 'Dental', 'Insurance'], icon: '💊' },
    { value: 'Entertainment', subcategories: ['Movies', 'Games', 'Music', 'Sports'], icon: '🎮' },
  ],
  income: [
    { value: 'Income', subcategories: ['Salary', 'Freelance', 'Business', 'Investment'], icon: '💰' },
  ],
}

export function TransactionForm({ isOpen, onClose, onSuccess }: TransactionFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    subcategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const currentCategories = categories[formData.type]
  const currentSubcategories =
    currentCategories.find((cat) => cat.value === formData.category)?.subcategories || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const amount = parseFloat(formData.amount)

      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          date: formData.date,
          category: formData.category,
          subcategory: formData.subcategory,
          amount,
          type: formData.type,
          description: formData.description,
        },
      ])

      toast.success('✅ Transaction added successfully')
      onSuccess?.()
      onClose()
      setFormData({
        type: 'expense',
        category: '',
        subcategory: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
    } catch (error) {
      toast.error('❌ Failed to add transaction')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-xl shadow-lg z-50 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: string) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as 'income' | 'expense',
                  category: '',
                  subcategory: '',
                }))
              }
            >
              <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-md z-50 text-gray-900">
                <SelectItem value="expense">💸 Expense</SelectItem>
                <SelectItem value="income">💰 Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: string) =>
                setFormData((prev) => ({ ...prev, category: value, subcategory: '' }))
              }
            >
              <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-md z-50 text-gray-900">
                {currentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center">
                      <span className="mr-2">{category.icon}</span>
                      <span>{category.value}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Subcategory</Label>
            <Select
              value={formData.subcategory}
              onValueChange={(value: string) =>
                setFormData((prev) => ({ ...prev, subcategory: value }))
              }
              disabled={!formData.category}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900">
                <SelectValue
                  placeholder={formData.category ? 'Select subcategory' : 'Select category first'}
                />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-md z-50 max-h-60 overflow-y-auto text-gray-900">
                {currentSubcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    <div className="flex items-center">
                      <span className="mr-2">🔹</span>
                      <span>{sub}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              required
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Date */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              required
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Description (optional)</Label>
            <Textarea
              placeholder="Add a note about this transaction"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
