'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface BudgetItem {
  id: string
  category: string
  budgeted: number
  spent: number
  is_enabled: boolean
}

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('couple_id', user.id)
        .single()

      if (!wedding) return

      const { data } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('wedding_id', wedding.id)
        .order('category')

      if (data) setItems(data.map(d => ({ ...d, budgeted: Number(d.budgeted), spent: Number(d.spent) })))
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    for (const item of items) {
      await supabase
        .from('budget_categories')
        .update({ budgeted: item.budgeted, spent: item.spent, is_enabled: item.is_enabled })
        .eq('id', item.id)
    }
    setSaving(false)
  }

  const totalBudget = items.filter(i => i.is_enabled).reduce((sum, i) => sum + i.budgeted, 0)
  const totalSpent = items.filter(i => i.is_enabled).reduce((sum, i) => sum + i.spent, 0)
  const remaining = totalBudget - totalSpent

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-sage" />
              Budget Planner
            </h1>
            <Button onClick={handleSave} loading={saving} size="sm">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-xs text-charcoal/50 mb-1">Total Budget</p>
              <p className="text-lg font-bold text-charcoal">{formatCurrency(totalBudget)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-charcoal/50 mb-1">Spent</p>
              <p className="text-lg font-bold text-rose-gold">{formatCurrency(totalSpent)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-charcoal/50 mb-1">Remaining</p>
              <p className={`text-lg font-bold ${remaining >= 0 ? 'text-sage-dark' : 'text-red-500'}`}>
                {formatCurrency(remaining)}
              </p>
            </Card>
          </div>

          {loading ? (
            <div className="text-center py-12 text-charcoal/40">Loading...</div>
          ) : (
            <Card className="divide-y divide-peach-light/50">
              {items.map((item, idx) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={item.is_enabled}
                    onChange={(e) => {
                      const next = [...items]
                      next[idx] = { ...next[idx], is_enabled: e.target.checked }
                      setItems(next)
                    }}
                    className="accent-rose-gold w-4 h-4"
                  />
                  <span className="text-sm text-charcoal flex-1 capitalize">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <label className="text-[10px] text-charcoal/40">Budget</label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-charcoal/40">$</span>
                        <input
                          type="number"
                          value={item.budgeted}
                          onChange={(e) => {
                            const next = [...items]
                            next[idx] = { ...next[idx], budgeted: Number(e.target.value) }
                            setItems(next)
                          }}
                          disabled={!item.is_enabled}
                          className="w-20 text-right text-sm bg-transparent border-b border-peach-light focus:outline-none focus:border-rose-gold disabled:text-charcoal/30"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <label className="text-[10px] text-charcoal/40">Spent</label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-charcoal/40">$</span>
                        <input
                          type="number"
                          value={item.spent}
                          onChange={(e) => {
                            const next = [...items]
                            next[idx] = { ...next[idx], spent: Number(e.target.value) }
                            setItems(next)
                          }}
                          disabled={!item.is_enabled}
                          className="w-20 text-right text-sm bg-transparent border-b border-peach-light focus:outline-none focus:border-rose-gold disabled:text-charcoal/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
