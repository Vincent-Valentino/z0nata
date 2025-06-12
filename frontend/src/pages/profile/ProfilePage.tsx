import React, { useState } from 'react'
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                  {getUserInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.full_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                  {user.email_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={isEditing ? handleSave : handleEditToggle}
              className="flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={handleEditToggle}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.full_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
                    )}
                  </div>
                </div>

                {user.role === 'student' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="nim">Student ID (NIM)</Label>
                        {isEditing ? (
                          <Input
                            id="nim"
                            value={editForm.nim}
                            onChange={(e) => handleInputChange('nim', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.nim || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="faculty">Faculty</Label>
                        {isEditing ? (
                          <Input
                            id="faculty"
                            value={editForm.faculty}
                            onChange={(e) => handleInputChange('faculty', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.faculty || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="major">Major</Label>
                        {isEditing ? (
                          <Input
                            id="major"
                            value={editForm.major}
                            onChange={(e) => handleInputChange('major', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.major || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Learning Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {user.stats?.testsCompleted || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tests Completed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {user.stats?.averageScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.floor((user.stats?.totalTimeSpent || 0) / 3600)}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Study Time</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {user.stats?.streak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.last_login)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Email Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email_verified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Info */}
            {user.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin Privileges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {user.permissions?.map((permission, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Info */}
            {user.role === 'student' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Faculty</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.faculty || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Major</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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