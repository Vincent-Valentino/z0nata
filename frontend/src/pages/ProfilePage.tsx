import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Building2, 
  Edit3, 
  Save, 
  X,
  Shield,
  BookOpen
} from 'lucide-react'

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    nim: user?.nim || '',
    faculty: user?.faculty || '',
    major: user?.major || ''
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when cancelling
      setEditForm({
        full_name: user.full_name,
        email: user.email,
        nim: user.nim || '',
        faculty: user.faculty || '',
        major: user.major || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSave = () => {
    updateUser(editForm)
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 self-center sm:self-auto">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg sm:text-2xl font-bold">
                  {getUserInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {user.full_name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {user.email}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                  {user.email_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={isEditing ? handleSave : handleEditToggle}
              className="flex items-center gap-2 w-full sm:w-auto touch-manipulation"
              size="sm"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Personal Information
                </CardTitle>
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={handleEditToggle} className="touch-manipulation self-end sm:self-auto">
                    <X className="w-4 h-4" />
                    <span className="sr-only">Cancel editing</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="h-10 text-base touch-manipulation"
                        inputMode="text"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 py-2">
                        {user.full_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="h-10 text-base touch-manipulation"
                        inputMode="email"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 py-2 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Only show academic fields for mahasiswa users */}
                {user.role === 'student' && user.user_type === 'mahasiswa' && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nim" className="text-sm font-medium">Student ID (NIM)</Label>
                        {isEditing ? (
                          <Input
                            id="nim"
                            value={editForm.nim}
                            onChange={(e) => handleInputChange('nim', e.target.value)}
                            className="h-10 text-base touch-manipulation"
                            inputMode="text"
                          />
                        ) : (
                          <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 py-2">
                            {user.nim || 'Not provided'}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="faculty" className="text-sm font-medium">Faculty</Label>
                        {isEditing ? (
                          <Input
                            id="faculty"
                            value={editForm.faculty}
                            onChange={(e) => handleInputChange('faculty', e.target.value)}
                            className="h-10 text-base touch-manipulation"
                            inputMode="text"
                          />
                        ) : (
                          <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 py-2">
                            {user.faculty || 'Not provided'}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="major" className="text-sm font-medium">Major</Label>
                        {isEditing ? (
                          <Input
                            id="major"
                            value={editForm.major}
                            onChange={(e) => handleInputChange('major', e.target.value)}
                            className="h-10 text-base touch-manipulation"
                            inputMode="text"
                          />
                        ) : (
                          <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 py-2">
                            {user.major || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  Learning Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {user.stats?.testsCompleted || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                      Tests Completed
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {user.stats?.averageScore || 0}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                      Average Score
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.floor((user.stats?.totalTimeSpent || 0) / 3600)}h
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                      Study Time
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {user.stats?.streak || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                      Day Streak
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {formatDate(user.last_login)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Email Status</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {user.email_verified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Info */}
            {user.role === 'admin' && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    Admin Privileges
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {user.permissions?.map((permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Info - Only for mahasiswa users */}
            {user.role === 'student' && user.user_type === 'mahasiswa' && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Faculty</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {user.faculty || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Major</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {user.major || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 