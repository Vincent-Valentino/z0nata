import { useState } from 'react'
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
  Eye
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  type: 'mahasiswa_mikroskiul' | 'not_mahasiswa'
  status: 'active' | 'pending' | 'suspended'
  joinDate: string
  lastActive: string
  avatar?: string
}

interface AccessRequest {
  id: string
  name: string
  email: string
  reason: string
  requestDate: string
  documents?: string[]
}

export const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'mahasiswa_mikroskiul' | 'not_mahasiswa' | 'pending'>('all')

  // Mock data - replace with real API calls
  const users: User[] = [
    {
      id: '1',
      name: 'Ahmad Wijaya',
      email: 'ahmad.wijaya@student.ac.id',
      type: 'mahasiswa_mikroskiul',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Sarah Thompson',
      email: 'sarah.thompson@gmail.com',
      type: 'not_mahasiswa',
      status: 'active',
      joinDate: '2024-02-20',
      lastActive: '1 day ago'
    },
    {
      id: '3',
      name: 'Budi Santoso',
      email: 'budi.santoso@student.ac.id',
      type: 'mahasiswa_mikroskiul',
      status: 'active',
      joinDate: '2024-01-10',
      lastActive: '30 minutes ago'
    }
  ]

  const accessRequests: AccessRequest[] = [
    {
      id: '1',
      name: 'John Mitchell',
      email: 'john.mitchell@company.com',
      reason: 'I am a researcher working on educational technology and would like access to study the platform for academic purposes.',
      requestDate: '2024-03-15',
      documents: ['research_proposal.pdf', 'university_letter.pdf']
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria.garcia@freelance.com',
      reason: 'I am an educational content creator and would like to contribute questions and documentation to the platform.',
      requestDate: '2024-03-14'
    }
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (userFilter === 'all') return matchesSearch
    if (userFilter === 'pending') return user.status === 'pending' && matchesSearch
    return user.type === userFilter && matchesSearch
  })

  const getUserTypeIcon = (type: string) => {
    return type === 'mahasiswa_mikroskiul' ? 
      <GraduationCap className="h-4 w-4" /> : 
      <Users className="h-4 w-4" />
  }

  const getUserTypeBadge = (type: string) => {
    return type === 'mahasiswa_mikroskiul' ? 
      <Badge variant="default" className="bg-green-100 text-green-700">Mahasiswa</Badge> :
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
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleApproveRequest = (requestId: string) => {
    console.log('Approving request:', requestId)
    // Implement approval logic
  }

  const handleRejectRequest = (requestId: string) => {
    console.log('Rejecting request:', requestId)
    // Implement rejection logic
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
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mahasiswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.type === 'mahasiswa_mikroskiul').length}
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
              {users.filter(u => u.type === 'not_mahasiswa').length}
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
                variant={userFilter === 'mahasiswa_mikroskiul' ? 'default' : 'outline'}
                onClick={() => setUserFilter('mahasiswa_mikroskiul')}
                className="gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                Mahasiswa
              </Button>
              <Button
                variant={userFilter === 'not_mahasiswa' ? 'default' : 'outline'}
                onClick={() => setUserFilter('not_mahasiswa')}
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
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.name}</h3>
                          {getUserTypeBadge(user.type)}
                          {getStatusBadge(user.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {user.joinDate}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last active: {user.lastActive}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Shield className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                Review and approve access requests from non-mahasiswa users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {accessRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{request.name}</h3>
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
                          Requested on {request.requestDate}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Reason for Access:</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {request.reason}
                      </p>
                    </div>
                    
                    {request.documents && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Attached Documents:</h4>
                        <div className="flex gap-2">
                          {request.documents.map((doc, index) => (
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
                
                {accessRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending access requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 