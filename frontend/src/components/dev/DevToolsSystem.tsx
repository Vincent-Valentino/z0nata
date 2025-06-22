import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Monitor, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Database, 
  Clock, 
  Info 
} from 'lucide-react'

interface SystemInfo {
  environment: string
  apiBase: string
  isOnline: boolean
  authStatus: string
  localStorageItems: number
  sessionStorageItems: number
  userAgent: string
  viewport: string
  timestamp: string
}

export const DevToolsSystem: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')

  // Update system info periodically
  useEffect(() => {
    const updateSystemInfo = () => {
      setSystemInfo({
        environment: process.env.NODE_ENV || 'development',
        apiBase: 'localhost:8080',
        isOnline: navigator.onLine,
        authStatus: isAuthenticated ? 'Authenticated' : 'Not Authenticated',
        localStorageItems: localStorage.length,
        sessionStorageItems: sessionStorage.length,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      })
    }

    updateSystemInfo()
    const interval = setInterval(updateSystemInfo, 5000)
    
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isAuthenticated])

  const exportSystemData = () => {
    const data = {
      systemInfo,
      localStorage: Object.fromEntries(
        Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])
      ),
      sessionStorage: Object.fromEntries(
        Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])
      ),
      timestamp: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-data-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearLocalStorage = () => {
    const confirmClear = window.confirm('Are you sure you want to clear all localStorage? This will log you out.')
    if (confirmClear) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const clearSessionStorage = () => {
    const confirmClear = window.confirm('Are you sure you want to clear all sessionStorage?')
    if (confirmClear) {
      sessionStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System Information
          </CardTitle>
          <CardDescription>Current system state and environment details</CardDescription>
        </CardHeader>
        <CardContent>
          {systemInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-2">Environment</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <Badge variant={systemInfo.environment === 'production' ? 'destructive' : 'secondary'}>
                      {systemInfo.environment}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>API Base:</span>
                    <code className="text-xs">{systemInfo.apiBase}</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <div className="flex items-center gap-1">
                      {networkStatus === 'online' ? (
                        <Wifi className="h-3 w-3 text-green-500" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-red-500" />
                      )}
                      <span className={networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                        {networkStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2">Application State</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Auth Status:</span>
                    <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                      {systemInfo.authStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>LocalStorage:</span>
                    <Badge variant="outline">{systemInfo.localStorageItems} items</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>SessionStorage:</span>
                    <Badge variant="outline">{systemInfo.sessionStorageItems} items</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browser Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Browser Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemInfo && (
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-medium">Viewport:</div>
                <div className="text-muted-foreground">{systemInfo.viewport}</div>
              </div>
              <div>
                <div className="font-medium">User Agent:</div>
                <div className="text-muted-foreground text-xs break-all">
                  {systemInfo.userAgent}
                </div>
              </div>
              <div>
                <div className="font-medium">Last Updated:</div>
                <div className="text-muted-foreground text-xs">
                  {new Date(systemInfo.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </CardTitle>
          <CardDescription>Export, import, and manage application data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-medium mb-2">Export</div>
              <Button
                onClick={exportSystemData}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export System Data
              </Button>
            </div>
            
            <div>
              <div className="font-medium mb-2">Import</div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data (Soon)
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="font-medium mb-2">Storage Management</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={clearLocalStorage}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear LocalStorage
              </Button>
              <Button
                onClick={clearSessionStorage}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear SessionStorage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <div>Memory usage and performance metrics will be displayed here in future versions.</div>
            <div className="mt-2">Current implementation focuses on core functionality.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 