'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, Plus, CreditCard } from 'lucide-react'
import BudgetCommitmentTracker, {type Commitment, type VendorChoice, type WeddingEventChoice} from '@/components/budget/BudgetCommitmentTracker'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'
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
  const [commitments,setCommitments]=useState<Commitment[]>([])
  const [vendors,setVendors]=useState<VendorChoice[]>([])
  const [events,setEvents]=useState<WeddingEventChoice[]>([])
  const [error,setError]=useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
                .maybeSingle()

      if (!wedding) { setLoading(false); return }
      setWeddingId(wedding.id)

      const [budgetQuery,paymentsQuery,eventsQuery,shortlistQuery]=await Promise.all([
        supabase.from('budget_categories').select('*').eq('wedding_id',wedding.id).order('category'),
        supabase.from('budget_commitments').select('*').eq('wedding_id',wedding.id).order('created_at',{ascending:false}),
        supabase.from('wedding_events').select('id,event_type,custom_label').eq('wedding_id',wedding.id).order('sort_order'),
        supabase.from('wedding_vendor_shortlist').select('vendor_id,quote_amount,vendor:vendors!wedding_vendor_shortlist_vendor_id_fkey(name)').eq('wedding_id',wedding.id).neq('stage','declined'),
      ])
      if(budgetQuery.error || paymentsQuery.error || eventsQuery.error || shortlistQuery.error) {
        setError(budgetQuery.error?.message || paymentsQuery.error?.message || eventsQuery.error?.message || shortlistQuery.error?.message || 'Unable to load the complete budget')
      } else {
        setItems((budgetQuery.data??[]).map(d=>({...d,budgeted:Number(d.budgeted),spent:Number(d.spent)})))
        setCommitments((paymentsQuery.data??[]).map(d=>({...d,total_amount:Number(d.total_amount),paid_amount:Number(d.paid_amount)})))
        setEvents(eventsQuery.data??[])
        setVendors((shortlistQuery.data??[]).map(s=>({id:s.vendor_id,name:s.vendor?.name||'Vendor',quote_amount:s.quote_amount===null?null:Number(s.quote_amount)})))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!weddingId || saving) return
    setSaving(true)
    const supabase = createClient()
    setMessage('')
    const results = await Promise.all(
      items.map((item) =>
        supabase
          .from('budget_categories')
          .update({ budgeted: item.budgeted, spent: item.spent, is_enabled: item.is_enabled })
          .eq('id', item.id).eq('wedding_id',weddingId)
      )
    )
    const hasError = results.some(result => result.error)
    setSaving(false)
    setMessage(hasError ? 'Some changes could not be saved. Please retry.' : 'Budget saved successfully.')
    if (!hasError) posthog.capture('budget_saved', { category_count: items.length })
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
      posthog.capture('budget_category_added')
    }
    setAdding(false)
  }

  const totalBudget = items.filter(i => i.is_enabled).reduce((sum, i) => sum + i.budgeted, 0)
  const manualSpent = items.filter(i => i.is_enabled).reduce((sum, i) => sum + i.spent, 0)
  const trackedPaid = commitments.filter(c=>items.some(i=>i.id===c.category_id&&i.is_enabled)).reduce((sum,c)=>sum+c.paid_amount,0)
  const trackedCommitments = commitments.filter(c=>items.some(i=>i.id===c.category_id&&i.is_enabled))
  const outstanding = trackedCommitments.reduce((sum,c)=>sum+Math.max(c.total_amount-c.paid_amount,0),0)
  const totalSpent = manualSpent + trackedPaid
  const remaining = totalBudget - totalSpent

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto min-w-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-plum flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Budget Planner
            </h1>
            <Button onClick={handleSave} loading={saving} size="sm">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          {message && <p role="status" className="mb-4 rounded-xl bg-primary-soft/50 px-4 py-3 text-sm text-ink">{message}</p>}
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          {/* Summary */}
          <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted mb-1">Total Budget</p>
              <p className="text-lg font-bold text-ink">{formatCurrency(totalBudget)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted mb-1">Paid / spent</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalSpent)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted mb-1">Remaining</p>
              <p className={`text-lg font-bold ${remaining >= 0 ? 'text-plum' : 'text-red-500'}`}>
                {formatCurrency(remaining)}
              </p>
            </Card>
          </div>

          {!loading && <div className="mb-6 grid grid-cols-2 gap-3">
            <Card className="p-4"><p className="text-xs text-muted">Outstanding booked/planned balances</p><p className="mt-1 text-lg font-bold text-plum">{formatCurrency(outstanding)}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted">Tracked payments</p><p className="mt-1 text-lg font-bold text-primary">{formatCurrency(trackedPaid)}</p></Card>
          </div>}
          {loading ? (
            <div className="text-center py-12 text-muted">Loading...</div>
          ) : (
            <Card className="divide-y divide-peach-light/50">
              {items.map((item, idx) => (
                <div key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.is_enabled}
                      aria-label={'Include '+item.category.replace(/_/g,' ')+' in budget'}
                      onChange={(e) => {
                        setItems(prev => prev.map(x => x.id === item.id ? {...x,is_enabled:e.target.checked} : x))
                      }}
                      className="accent-rose-gold h-5 w-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-ink capitalize">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:ml-8">
                    <label className="block min-w-0 text-xs text-muted">Budget (CAD)
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                        <input type="number" min="0" step="0.01"
                          value={item.budgeted}
                          onChange={(e) => setItems(prev => prev.map(x => x.id === item.id ? {...x,budgeted:Number(e.target.value)}:x))}
                          disabled={!item.is_enabled}
                          className="w-full min-w-0 rounded-lg border border-border-soft bg-white py-2 pl-7 pr-2 text-right text-base text-ink focus:outline-primary disabled:opacity-50"
                        />
                      </div>
                    </label>
                    <label className="block min-w-0 text-xs text-muted">Other paid (CAD)
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                        <input type="number" min="0" step="0.01"
                          value={item.spent}
                          onChange={(e) => setItems(prev => prev.map(x => x.id === item.id ? {...x,spent:Number(e.target.value)}:x))}
                          disabled={!item.is_enabled}
                          className="w-full min-w-0 rounded-lg border border-border-soft bg-white py-2 pl-7 pr-2 text-right text-base text-ink focus:outline-primary disabled:opacity-50"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </Card>
          )}
          {!loading && weddingId && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary"/><h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Payments & commitments</h2></div>
              <p className="mb-4 text-sm text-muted">Track vendor prices, deposits, outstanding balances, due dates and event costs. Payments here are added to the category’s “Other paid” amount; don’t enter the same payment twice.</p>
              <BudgetCommitmentTracker weddingId={weddingId} categories={items.map(i=>({id:i.id,name:i.category,enabled:i.is_enabled}))} events={events} vendors={vendors} commitments={commitments} setCommitments={setCommitments}/>
            </div>
          )}

          {!loading && weddingId && (
            <Card className="mt-5 p-5 space-y-3">
              <h2 className="font-[family-name:var(--font-heading)] text-lg">Add custom budget category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px_auto] gap-3 items-end">
                <label className="text-sm font-medium">Name<input value={newCategory} maxLength={80} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Saree draping" className="mt-1 block w-full rounded-xl border border-border-soft px-3 py-2.5" /></label>
                <label className="text-sm font-medium">Budget ($)<input type="number" min="0" step="0.01" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="0" className="mt-1 block w-full rounded-xl border border-border-soft px-3 py-2.5" /></label>
                <Button type="button" onClick={addCategory} disabled={adding || !newCategory.trim()}><Plus className="h-4 w-4" /> Add</Button>
              </div>
              <p className="text-xs text-muted">Custom categories save immediately. “Other paid” is for spending not already entered in the payments tracker. Use Save above to keep changes to existing category amounts.</p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
