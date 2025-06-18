import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Filter, 
  Users, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Mail,
  Calendar,
  Shield,
  Eye,
  Loader2
} from 'lucide-react'
import { adminService, type User, type UserStats, type AccessRequest } from '@/services/adminService'

export const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'mahasiswa' | 'external' | 'pending'>('all')
  const [users, setUsers] = useState<User[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadStats = async () => {
    try {
      const statsData = await adminService.getUserStats()
      setStats(statsData)
    } catch (err: any) {
      console.error('Error loading stats:', err)
    }
  }

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage,
        limit: 20,
      }
      
      if (searchTerm) params.search = searchTerm
      if (userFilter !== 'all' && userFilter !== 'pending') params.user_type = userFilter
      if (userFilter === 'pending') params.status = 'pending'
      
      const response = await adminService.getUsers(params)
      setUsers(response.users)
    } catch (err: any) {
      console.error('Error loading users:', err)
      const errorMessage = err.message || 'Failed to load users'
      setError(errorMessage)
    } finally {
      setUsersLoading(false)
    }
  }

  const loadAccessRequests = async () => {
    try {
      setRequestsLoading(true)
      const response = await adminService.getAccessRequests({ 
        page: 1, 
        limit: 50,
        status: 'pending'
      })
      setAccessRequests(response.requests)
    } catch (err: any) {
      console.error('Error loading access requests:', err)
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      await Promise.all([loadStats(), loadUsers(), loadAccessRequests()])
      setLoading(false)
    }

    initializeData()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1)
      loadUsers()
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, userFilter])

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  const filteredUsers = users

  const getUserTypeBadge = (type: string) => {
    return type === 'mahasiswa' ? 
      <Badge variant="default" className="bg-green-100 text-green-700">Mahasiswa</Badge> :
      type === 'admin' ?
      <Badge variant="default" className="bg-blue-100 text-blue-700">Admin</Badge> :
      <Badge variant="secondary" className="bg-orange-100 text-orange-700">External</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case 'suspended':
        return <Badge variant="destructive" className="bg-red-100 text-red-700">Suspended</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-gray-100 text-gray-700">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleUpdateUserStatus = async (userId: string, status: User['status']) => {
    try {
      await adminService.updateUserStatus(userId, status)
      console.log('User status updated to', status)
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      console.error('Error updating user status:', err)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      await adminService.approveAccessRequest(requestId)
      console.log('Access request approved successfully')
      await loadAccessRequests()
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      console.error('Error approving access request:', err)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await adminService.rejectAccessRequest(requestId, 'Access denied by administrator')
      console.log('Access request rejected')
      await loadAccessRequests()
      await loadUsers()
      await loadStats()
    } catch (err: any) {
      console.error('Error rejecting access request:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mahasiswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.by_type && 'mahasiswa' in stats.by_type) ? stats.by_type.mahasiswa || 0 : 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.by_type && 'external' in stats.by_type) ? stats.by_type.external || 0 : 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Access Requests
            {accessRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {accessRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={userFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setUserFilter('all')}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                All
              </Button>
              <Button
                variant={userFilter === 'mahasiswa' ? 'default' : 'outline'}
                onClick={() => setUserFilter('mahasiswa')}
                className="gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                Mahasiswa
              </Button>
              <Button
                variant={userFilter === 'external' ? 'default' : 'outline'}
                onClick={() => setUserFilter('external')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                External
              </Button>
            </div>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={loadUsers}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={`https://ui-avatars.io/api/?name=${encodeURIComponent(user.full_name)}&background=random`} />
                          <AvatarFallback>
                            {user.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.full_name}</h3>
                            {getUserTypeBadge(user.user_type)}
                            {getStatusBadge(user.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {user.nim && (
                            <p className="text-xs text-muted-foreground">
                              NIM: {user.nim} | {user.faculty} - {user.major}
                            </p>
                          )}
                          {user.last_login && (
                            <p className="text-xs text-muted-foreground">
                              Last active: {new Date(user.last_login).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleUpdateUserStatus(user.id, 'active')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleUpdateUserStatus(user.id, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {user.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateUserStatus(user.id, 'suspended')}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {user.status === 'suspended' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateUserStatus(user.id, 'active')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Access Requests
              </CardTitle>
              <CardDescription>
                Review and approve access requests from external users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading access requests...</span>
                </div>
              ) : accessRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending access requests</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {accessRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.full_name}</h3>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              Pending Review
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Requested on {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {request.purpose && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Reason for Access:</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            {request.purpose}
                          </p>
                        </div>
                      )}
                      
                      {request.supporting_docs && request.supporting_docs.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Attached Documents:</h4>
                          <div className="flex gap-2">
                            {request.supporting_docs.map((doc, index) => (
                              <Badge key={index} variant="outline" className="cursor-pointer hover:bg-muted">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={() => handleApproveRequest(request.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleRejectRequest(request.id)}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button variant="ghost" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 