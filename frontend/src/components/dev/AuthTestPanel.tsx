import { useAuthStore, useLoginAsAdmin, useLoginAsStudent, getAdminUser, getStudentUser } from '@/store/authStore'

export const AuthTestPanel = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const loginAsAdmin = useLoginAsAdmin()
  const loginAsStudent = useLoginAsStudent()

  const adminUser = getAdminUser()
  const studentUser = getStudentUser()

  const mockUsers = [
    {
      ...adminUser,
      password: 'admin123',
      description: 'Admin Account - Full access to admin panel'
    },
    {
      ...studentUser,
      password: 'student123',
      description: 'Student Account - Regular user access'
    }
  ]

  const handleQuickLogin = (userType: 'admin' | 'student') => {
    if (userType === 'admin') {
      loginAsAdmin()
    } else {
      loginAsStudent()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-sm">
      <h3 className="text-sm font-semibold mb-3 text-blue-400">🚀 Dev Auth Panel</h3>
      
      {isAuthenticated && user ? (
        <div className="space-y-3">
          <div className="text-xs">
            <div className="text-green-400">✅ Logged in as:</div>
            <div className="font-medium">{user.full_name}</div>
            <div className="text-gray-400">{user.email}</div>
            <div className="text-xs bg-blue-600 px-2 py-1 rounded mt-1 inline-block">
              {user.role === 'admin' ? '👑 Admin' : '👤 Student'}
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="w-full text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
              disabled={user.role === 'admin'}
            >
              {user.role === 'admin' ? '👑 Current Admin' : '🔄 Switch to Admin'}
            </button>
            
            <button
              onClick={() => handleQuickLogin('student')}
              className="w-full text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-colors"
              disabled={user.role === 'student'}
            >
              {user.role === 'student' ? '👤 Current Student' : '🔄 Switch to Student'}
            </button>
            
            <button
              onClick={logout}
              className="w-full text-xs bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-gray-400">Not logged in</div>
          
          <div className="space-y-2">
            {mockUsers.map((mockUser) => (
              <div key={mockUser.id} className="space-y-1">
                <button
                  onClick={() => handleQuickLogin(mockUser.role === 'admin' ? 'admin' : 'student')}
                  className={`w-full text-xs px-3 py-2 rounded transition-colors ${
                    mockUser.role === 'admin' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <div className="font-medium">
                    {mockUser.role === 'admin' ? '👑' : '👤'} {mockUser.full_name}
                  </div>
                  <div className="text-gray-300">{mockUser.email}</div>
                </button>
                <div className="text-xs text-gray-400 px-1">
                  {mockUser.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
        <div>🔧 Development Mode</div>
        <div>Admin: admin@quizapp.com</div>
        <div>Student: vincent.valentino@example.com</div>
      </div>
    </div>
  )
} 