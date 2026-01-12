import { LoginForm } from '@/components/auth/login-form'
import { Activity } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 border-gray-900">PlayerPerf</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
