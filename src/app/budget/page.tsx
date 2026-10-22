'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, Plus, Trash2 } from 'lucide-react'
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
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newBudget, setNewBudget] = useState('')
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('couple_id', user.id)
        .single()

      if (!wedding) { setLoading(false); return }
      setWeddingId(wedding.id)

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
    setMessage('')
    const results = await Promise.all(
      items.map((item) =>
        supabase
          .from('budget_categories')
          .update({ budgeted: item.budgeted, spent: item.spent, is_enabled: item.is_enabled })
          .eq('id', item.id)
      )
    )
    setSaving(false)
    setMessage(results.some(result => result.error) ? 'Some changes could not be saved. Please retry.' : 'Budget saved successfully.')
  }

  const addCategory = async () => {
    const name = newCategory.trim()
    const amount = Number(newBudget || 0)
    if (!weddingId || !name || !Number.isFinite(amount) || amount < 0 || items.some(item => item.category.toLowerCase() === name.toLowerCase())) {
      setMessage('Enter a unique name and a valid non-negative amount.')
      return
    }
    setAdding(true)
    setMessage('')
    const supabase = createClient()
    const { data, error } = await supabase.from('budget_categories').insert({ wedding_id: weddingId, category: name, budgeted: amount, spent: 0, is_enabled: true }).select('id, category, budgeted, spent, is_enabled').single()
    if (error || !data) setMessage(error?.message || 'Could not add category.')
    else {
      setItems(prev => [...prev, { ...data, budgeted: Number(data.budgeted), spent: Number(data.spent) }].sort((a,b) => a.category.localeCompare(b.category)))
      setNewCategory('')
      setNewBudget('')
      setMessage('Custom budget category added.')
    }
    setAdding(false)
  }

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this custom budget category?')) return
    const supabase = createClient()
    const { error } = await supabase.from('budget_categories').delete().eq('id', id)
    if (error) setMessage(error.message)
    else { setItems(prev => prev.filter(item => item.id !== id)); setMessage('Category deleted.') }
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

          {message && <p role="status" className="mb-4 rounded-xl bg-peach-light/40 px-4 py-3 text-sm text-charcoal">{message}</p>}

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
                  {!['venue','photography','videography','decor','dj','priest','makeup','florist','jewelry','travel','catering','attire','invitations','transportation','miscellaneous'].includes(item.category.toLowerCase()) && (
                    <button type="button" aria-label={`Delete ${item.category}`} title="Delete custom category" onClick={() => deleteCategory(item.id)} className="text-charcoal/60 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </Card>
          )}
          {!loading && weddingId && (
            <Card className="mt-5 p-5 space-y-3">
              <h2 className="font-[family-name:var(--font-heading)] text-lg">Add custom budget category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px_auto] gap-3 items-end">
                <label className="text-sm font-medium">Name<input value={newCategory} maxLength={80} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Saree draping" className="mt-1 block w-full rounded-xl border border-peach-light px-3 py-2.5" /></label>
                <label className="text-sm font-medium">Budget ($)<input type="number" min="0" step="0.01" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="0" className="mt-1 block w-full rounded-xl border border-peach-light px-3 py-2.5" /></label>
                <Button type="button" onClick={addCategory} disabled={adding || !newCategory.trim()}><Plus className="h-4 w-4" /> Add</Button>
              </div>
              <p className="text-xs text-charcoal/70">Custom categories save immediately. Use Save above to keep changes to existing amounts.</p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
