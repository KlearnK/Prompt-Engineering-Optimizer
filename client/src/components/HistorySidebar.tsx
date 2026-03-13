import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Clock, Shield, RefreshCw } from 'lucide-react'

interface Session {
  id: string
  timestamp: number
  mode: 'evaluate' | 'iterate'
  input: string
}

export function HistorySidebar() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [collapsed, setCollapsed] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
    const interval = setInterval(loadHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadHistory = async () => {
    try {
      const response = await axios.get('/api/history')
      if (response.data.success) {
        setSessions(response.data.sessions)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed left-4 top-4 z-50 p-2 bg-white shadow rounded-lg hover:bg-gray-50"
      >
        <Clock className="w-5 h-5 text-gray-600" />
      </button>
    )
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">历史记录</h3>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-600"
        >
          ←
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/${session.mode}`)}
          >
            <div className="flex items-center gap-2 mb-2">
              {session.mode === 'evaluate' ? (
                <Shield className="w-4 h-4 text-blue-500" />
              ) : (
                <RefreshCw className="w-4 h-4 text-green-500" />
              )}
              <span className="text-xs text-gray-500">
                {formatTime(session.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-800 line-clamp-2">
              {session.input}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
