import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Zap, Code, Info, RefreshCw, CheckCircle2 } from 'lucide-react'

interface DevSettings {
  debugMode: boolean
  verboseLogging: boolean
  autoRefresh: boolean
  refreshInterval: number
  mockMode: boolean
  apiDelay: number
  showDevPanel: boolean
  theme: 'light' | 'dark' | 'system'
}

export const DevToolsSettings: React.FC = () => {
  const [settings, setSettings] = useState<DevSettings>({
    debugMode: false,
    verboseLogging: false,
    autoRefresh: true,
    refreshInterval: 5000,
    mockMode: false,
    apiDelay: 0,
    showDevPanel: true,
    theme: 'system'
  })
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dev-tools-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to parse dev settings:', error)
      }
    }
  }, [])

  const updateSetting = <K extends keyof DevSettings>(key: K, value: DevSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Save to localStorage
    localStorage.setItem('dev-tools-settings', JSON.stringify(newSettings))
    
    // Show saved feedback
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)

    // Apply settings immediately
    applySettings(newSettings)
  }

  const applySettings = (settings: DevSettings) => {
    // Apply debug mode
    if (settings.debugMode) {
      window.localStorage.setItem('debug', 'true')
      console.log('🔧 Debug mode enabled')
    } else {
      window.localStorage.removeItem('debug')
    }

    // Apply verbose logging
    if (settings.verboseLogging) {
      window.localStorage.setItem('verbose-logging', 'true')
    } else {
      window.localStorage.removeItem('verbose-logging')
    }

    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme)
  }

  const resetSettings = () => {
    const confirmReset = window.confirm('Are you sure you want to reset all development settings?')
    if (confirmReset) {
      const defaultSettings: DevSettings = {
        debugMode: false,
        verboseLogging: false,
        autoRefresh: true,
        refreshInterval: 5000,
        mockMode: false,
        apiDelay: 0,
        showDevPanel: true,
        theme: 'system'
      }
      setSettings(defaultSettings)
      localStorage.setItem('dev-tools-settings', JSON.stringify(defaultSettings))
      applySettings(defaultSettings)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dev-settings-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Settings Status */}
      {settingsSaved && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General Settings
          </CardTitle>
          <CardDescription>Basic development environment configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Debug Mode</div>
              <div className="text-sm text-muted-foreground">Enable detailed debugging information</div>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) => updateSetting('debugMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Verbose Logging</div>
              <div className="text-sm text-muted-foreground">Show detailed console logs</div>
            </div>
            <Switch
              checked={settings.verboseLogging}
              onCheckedChange={(checked) => updateSetting('verboseLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Dev Panel</div>
              <div className="text-sm text-muted-foreground">Display development tools panel</div>
            </div>
            <Switch
              checked={settings.showDevPanel}
              onCheckedChange={(checked) => updateSetting('showDevPanel', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Settings
          </CardTitle>
          <CardDescription>Settings that affect application performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Refresh</div>
              <div className="text-sm text-muted-foreground">Automatically refresh data periodically</div>
            </div>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
            />
          </div>

          {settings.autoRefresh && (
            <div>
              <div className="font-medium mb-2">Refresh Interval (ms)</div>
              <Input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value) || 5000)}
                min="1000"
                max="60000"
                step="1000"
              />
            </div>
          )}

          <div>
            <div className="font-medium mb-2">API Delay (ms)</div>
            <div className="text-sm text-muted-foreground mb-2">Add artificial delay to API calls for testing</div>
            <Input
              type="number"
              value={settings.apiDelay}
              onChange={(e) => updateSetting('apiDelay', parseInt(e.target.value) || 0)}
              min="0"
              max="5000"
              step="100"
            />
          </div>
        </CardContent>
      </Card>

      {/* UI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            UI Settings
          </CardTitle>
          <CardDescription>User interface and theming options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium mb-2">Theme</div>
            <Select
              value={settings.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Mock Mode</div>
              <div className="text-sm text-muted-foreground">Use mock data instead of real API calls</div>
            </div>
            <Switch
              checked={settings.mockMode}
              onCheckedChange={(checked) => updateSetting('mockMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Active Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant={settings.debugMode ? 'default' : 'secondary'}>
              Debug: {settings.debugMode ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={settings.verboseLogging ? 'default' : 'secondary'}>
              Verbose: {settings.verboseLogging ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={settings.autoRefresh ? 'default' : 'secondary'}>
              Auto Refresh: {settings.autoRefresh ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={settings.mockMode ? 'default' : 'secondary'}>
              Mock Mode: {settings.mockMode ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={exportSettings} variant="outline" size="sm">
              Export Settings
            </Button>
            <Button onClick={resetSettings} variant="destructive" size="sm">
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 