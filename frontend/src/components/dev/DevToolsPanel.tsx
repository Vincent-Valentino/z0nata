import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { DevToolsAuth } from './DevToolsAuth'
import { DevToolsAPI } from './DevToolsAPI'
import { DevToolsSystem } from './DevToolsSystem'
import { DevToolsSettings } from './DevToolsSettings'

import { 
  ChevronUp, 
  ChevronDown, 
  Shield, 
  Settings, 
  TestTube, 
  Activity,
  Monitor,
  Code,
  Bug
} from 'lucide-react'

interface DevPanelTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export const DevToolsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('auth')

  const tabs: DevPanelTab[] = [
    { id: 'auth', label: 'Auth', icon: Shield, description: 'Authentication & User Management' },
    { id: 'quiz', label: 'Quiz', icon: Activity, description: 'Quiz System Testing' },
    { id: 'api', label: 'API', icon: TestTube, description: 'API Endpoint Testing' },
    { id: 'system', label: 'System', icon: Monitor, description: 'System Information & Tools' },
    { id: 'debug', label: 'Debug', icon: Bug, description: 'Debug Tools & Utilities' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Development Settings' },
  ]

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-6xl">
      <Card className={cn(
        "transition-all duration-300 ease-in-out shadow-2xl border-2",
        isExpanded ? "w-[800px] h-[600px]" : "w-64 h-auto"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <CardTitle className="text-lg">Dev Tools</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronUp className="h-4 w-4" />
              }
            </Button>
          </div>
          {!isExpanded && (
            <CardDescription className="text-xs">
              Development utilities and debugging tools
            </CardDescription>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-0 h-[calc(600px-88px)] overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-4 pb-2">
                <TabsList className="grid w-full grid-cols-6 h-8">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id}
                        className="text-xs p-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <div className="flex items-center space-x-1">
                          <IconComponent className="h-3 w-3" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
              
              <Separator />
              
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="auth" className="mt-0 p-4 h-full">
                  <DevToolsAuth />
                </TabsContent>
                
                <TabsContent value="quiz" className="mt-0 p-4 h-full">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Quiz System Testing
                        </CardTitle>
                        <CardDescription>Test quiz functionality and debug quiz sessions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <div>Quiz debugging tools have been migrated to the main quiz pages.</div>
                          <div className="mt-2">Use TimeQuizPage and MockTestPage for testing quiz functionality.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="api" className="mt-0 p-4 h-full">
                  <DevToolsAPI />
                </TabsContent>
                
                <TabsContent value="system" className="mt-0 p-4 h-full">
                  <DevToolsSystem />
                </TabsContent>
                
                <TabsContent value="debug" className="mt-0 p-4 h-full">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          Debug Information
                        </CardTitle>
                        <CardDescription>Additional debugging tools and information</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <div>Debug tools and utilities will be added here as needed.</div>
                          <div className="mt-2">Current focus is on core functionality.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0 p-4 h-full">
                  <DevToolsSettings />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  )
} 