'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type TaskStatus = 'todo' | 'in_progress' | 'completed'
type Priority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  board_id: string | null
}

interface Board {
  id: string
  title: string
  color: string
}

export default function TaskBoard() {
  const [boards, setBoards] = useState<Board[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium')

  useEffect(() => {
    loadBoards()
  }, [])

  useEffect(() => {
    if (selectedBoard) {
      loadTasks()
    }
  }, [selectedBoard])

  const loadBoards = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('task_boards')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setBoards(data)
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0].id)
      }
    }
  }

  const loadTasks = async () => {
    if (!selectedBoard) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', selectedBoard)
      .order('created_at', { ascending: false })

    if (data) setTasks(data)
  }

  const createBoard = async () => {
    if (!newBoardTitle.trim()) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    try {
      const res = await fetch('/api/productivity/task-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userData.user.id, title: newBoardTitle }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        setBoards([json.data, ...boards])
        setSelectedBoard(json.data.id)
        setNewBoardTitle('')
      } else {
        console.error('Failed to create board:', json.error)
        alert('Failed to create board: ' + (json.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating board:', error)
      alert('Error creating board. Please try again.')
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim() || !selectedBoard) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    try {
      const res = await fetch('/api/productivity/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.user.id,
          board_id: selectedBoard,
          title: newTaskTitle,
          description: newTaskDesc || null,
          priority: newTaskPriority,
        }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        setTasks([json.data, ...tasks])
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskPriority('medium')
      } else {
        console.error('Failed to create task:', json.error)
        alert('Failed to create task: ' + (json.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Error creating task. Please try again.')
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch('/api/productivity/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        setTasks(tasks.map((t) => (t.id === taskId ? json.data : t)))

        // Award XP for completing task
        if (newStatus === 'completed') {
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            await fetch('/api/productivity/xp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userData.user.id,
                amount: 25,
                source: 'task',
                source_id: taskId,
              }),
            })
          }
        }
      } else {
        console.error('Failed to update task:', json.error)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const toggleTaskCompletion = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed'
    await updateTaskStatus(task.id, newStatus)
  }

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/productivity/task', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      })

      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId))
      } else {
        const json = await res.json()
        console.error('Failed to delete task:', json.error)
        alert('Failed to delete task: ' + (json.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Error deleting task. Please try again.')
    }
  }

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Board Selector */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder="New board name..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={createBoard}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create Board
          </button>
        </div>
        {boards.length > 0 && (
          <select
            value={selectedBoard || ''}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedBoard ? (
        <>
          {/* New Task Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Add New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    createTask()
                  }
                }}
                placeholder="Task title..."
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full px-4 py-2 border rounded-lg"
                rows={2}
              />
              <div className="flex gap-4 items-center">
                <label className="text-sm font-medium">Priority:</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={createTask}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-3 gap-4">
            {/* To Do */}
            <div className="bg-blue-50 rounded-lg p-4 min-h-[400px]">
              <h3 className="font-bold text-lg mb-4 text-blue-800">📝 To Do</h3>
              <div className="space-y-3">
                {todoTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white p-3 rounded-lg border-l-4 ${getPriorityColor(
                      task.priority
                    )} shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleTaskCompletion(task)}
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-yellow-50 rounded-lg p-4 min-h-[400px]">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">⚡ In Progress</h3>
              <div className="space-y-3">
                {inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white p-3 rounded-lg border-l-4 ${getPriorityColor(
                      task.priority
                    )} shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleTaskCompletion(task)}
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'todo')}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            Back to Todo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 rounded-lg p-4 min-h-[400px]">
              <h3 className="font-bold text-lg mb-4 text-green-800">✅ Completed</h3>
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white p-3 rounded-lg border-l-4 ${getPriorityColor(
                      task.priority
                    )} shadow-sm opacity-75`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleTaskCompletion(task)}
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 line-through">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded mt-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Create a board to get started with task management!
        </div>
      )}
    </div>
  )
}

