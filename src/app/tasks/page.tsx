'use client'

import { useState, useEffect } from 'react'
import { ListChecks, Plus, Trash2, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Task {
  id: string
  title: string
  is_completed: boolean
  due_date: string | null
  sort_order: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

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
      setWeddingId(wedding.id)

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('wedding_id', wedding.id)
        .order('sort_order')

      if (data) setTasks(data)
      setLoading(false)
    }
    load()
  }, [])

  const addTask = async () => {
    if (!newTask.trim() || !weddingId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .insert({
        wedding_id: weddingId,
        title: newTask.trim(),
        sort_order: tasks.length,
      })
      .select()
      .single()

    if (data) {
      setTasks(prev => [...prev, data])
      setNewTask('')
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const supabase = createClient()
    await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', id)

    setTasks(prev => prev.map(t => (t.id === id ? { ...t, is_completed: !t.is_completed } : t)))
  }

  const deleteTask = async (id: string) => {
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const completed = tasks.filter(t => t.is_completed).length

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-peach-dark" />
              Planning Tasks
            </h1>
            <span className="text-sm text-charcoal/50">
              {completed}/{tasks.length} done
            </span>
          </div>

          {/* Add task */}
          <Card className="p-4 mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addTask()
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 text-sm bg-transparent border-b border-peach-light focus:outline-none focus:border-rose-gold text-charcoal placeholder:text-charcoal/40 py-1"
              />
              <Button type="submit" size="sm" disabled={!newTask.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </form>
          </Card>

          {loading ? (
            <div className="text-center py-12 text-charcoal/40">Loading...</div>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <ListChecks className="h-8 w-8 text-peach mx-auto mb-3" />
              <p className="text-sm text-charcoal/50">
                No tasks yet. Add some to stay organized!
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-peach-light/50">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-4 group">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.is_completed
                        ? 'border-sage bg-sage'
                        : 'border-peach-light hover:border-rose-gold'
                    }`}
                  >
                    {task.is_completed && (
                      <Heart className="h-3 w-3 text-white" fill="currentColor" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      task.is_completed ? 'text-charcoal/40 line-through' : 'text-charcoal'
                    }`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-charcoal/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
