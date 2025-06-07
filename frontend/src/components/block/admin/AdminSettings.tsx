import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Clock, Wrench } from 'lucide-react'

export const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-16">
        <div className="max-w-md mx-auto space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <Settings className="h-12 w-12 text-muted-foreground animate-spin" style={{ 
                  animationDuration: '3s',
                  animationIterationCount: 'infinite'
                }} />
              </div>
            </div>
            <div className="w-24 h-24 mx-auto" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-lg">Coming Soon</span>
            </div>
            <p className="text-muted-foreground">
              System configuration and administrative settings will be available in a future update.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Basic system settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              User Permissions
            </CardTitle>
            <CardDescription>
              Manage user roles and access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Authentication and security configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 