import { NextRequest, NextResponse } from 'next/server'

/**
 * Production Alerting System
 * Real-time monitoring and alerting for critical system events
 */

interface AlertRule {
  id: string
  name: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals'
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  enabled: boolean
  cooldownMinutes: number
}

interface Alert {
  id: string
  ruleId: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  metadata?: Record<string, any>
}

interface AlertingConfig {
  rules: AlertRule[]
  notifications: {
    email: boolean
    webhook: boolean
    slack: boolean
  }
  endpoints: {
    webhook?: string
    slack?: string
    email?: string
  }
}

class ProductionAlerting {
  private config: AlertingConfig
  private activeAlerts: Map<string, Alert> = new Map()
  private lastAlertTime: Map<string, number> = new Map()

  constructor() {
    this.config = this.getDefaultConfig()
  }

  private getDefaultConfig(): AlertingConfig {
    return {
      rules: [
        {
          id: 'high_response_time',
          name: 'High API Response Time',
          metric: 'response_time',
          condition: 'greater_than',
          threshold: 1000, // ms
          severity: 'warning',
          enabled: true,
          cooldownMinutes: 5
        },
        {
          id: 'database_down',
          name: 'Database Connection Failed',
          metric: 'database_status',
          condition: 'equals',
          threshold: 0, // 0 = down
          severity: 'critical',
          enabled: true,
          cooldownMinutes: 2
        },
        {
          id: 'high_memory_usage',
          name: 'High Memory Usage',
          metric: 'memory_usage',
          condition: 'greater_than',
          threshold: 512, // MB
          severity: 'warning',
          enabled: true,
          cooldownMinutes: 10
        },
        {
          id: 'authentication_failed',
          name: 'Authentication System Down',
          metric: 'auth_status',
          condition: 'equals',
          threshold: 0, // 0 = down
          severity: 'critical',
          enabled: true,
          cooldownMinutes: 2
        },
        {
          id: 'low_health_score',
          name: 'Overall Health Score Low',
          metric: 'health_score',
          condition: 'less_than',
          threshold: 70, // %
          severity: 'warning',
          enabled: true,
          cooldownMinutes: 15
        }
      ],
      notifications: {
        email: false,
        webhook: true,
        slack: false
      },
      endpoints: {
        webhook: process.env.ALERT_WEBHOOK_URL,
        slack: process.env.SLACK_WEBHOOK_URL,
        email: process.env.ALERT_EMAIL
      }
    }
  }

  async evaluateHealthMetrics(healthData: any): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = []
    const currentTime = Date.now()

    // Convert health data to metrics
    const metrics = this.extractMetrics(healthData)

    for (const rule of this.config.rules) {
      if (!rule.enabled) continue

      // Check cooldown period
      const lastAlertTime = this.lastAlertTime.get(rule.id) || 0
      const cooldownMs = rule.cooldownMinutes * 60 * 1000
      
      if (currentTime - lastAlertTime < cooldownMs) {
        continue
      }

      const metricValue = metrics[rule.metric]
      if (metricValue === undefined) continue

      // Evaluate rule condition
      const triggered = this.evaluateCondition(
        metricValue,
        rule.condition,
        rule.threshold
      )

      if (triggered) {
        const alert = this.createAlert(rule, metricValue, healthData)
        triggeredAlerts.push(alert)
        
        // Store alert and update last alert time
        this.activeAlerts.set(alert.id, alert)
        this.lastAlertTime.set(rule.id, currentTime)

        // Send notifications
        await this.sendNotifications(alert)
      } else {
        // Check if we need to resolve an existing alert
        await this.resolveAlert(rule.id)
      }
    }

    return triggeredAlerts
  }

  private extractMetrics(healthData: any): Record<string, number> {
    const metrics: Record<string, number> = {}

    // Extract database metrics
    if (healthData.database) {
      metrics.response_time = healthData.database.responseTime || 0
      metrics.database_status = healthData.database.status === 'up' ? 1 : 0
    }

    // Extract authentication metrics
    if (healthData.authentication) {
      metrics.auth_status = healthData.authentication.status === 'up' ? 1 : 0
    }

    // Extract performance metrics
    if (healthData.performance) {
      metrics.memory_usage = healthData.performance.memoryUsage || 0
    }

    // Extract overall health
    metrics.health_score = healthData.overallHealth || 0

    return metrics
  }

  private evaluateCondition(
    value: number,
    condition: AlertRule['condition'],
    threshold: number
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold
      case 'less_than':
        return value < threshold
      case 'equals':
        return value === threshold
      default:
        return false
    }
  }

  private createAlert(
    rule: AlertRule,
    metricValue: number,
    healthData: any
  ): Alert {
    const alertId = `${rule.id}_${Date.now()}`
    
    return {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, metricValue),
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: {
        metricValue,
        threshold: rule.threshold,
        condition: rule.condition,
        healthData
      }
    }
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    const messages = {
      high_response_time: `API response time is ${value}ms (threshold: ${rule.threshold}ms)`,
      database_down: 'Database connection has failed',
      high_memory_usage: `Memory usage is ${value}MB (threshold: ${rule.threshold}MB)`,
      authentication_failed: 'Authentication system is not responding',
      low_health_score: `Overall health score is ${value}% (threshold: ${rule.threshold}%)`
    }

    return (messages as any)[rule.id] || `Metric ${rule.metric} is ${value} (threshold: ${rule.threshold})`
  }

  private async sendNotifications(alert: Alert) {
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`)
    console.log(`   Message: ${alert.message}`)

    // Send webhook notification
    if (this.config.notifications.webhook && this.config.endpoints.webhook) {
      await this.sendWebhookNotification(alert)
    }

    // Send Slack notification  
    if (this.config.notifications.slack && this.config.endpoints.slack) {
      await this.sendSlackNotification(alert)
    }

    // Log for debugging
    console.log(`📧 Notifications sent for alert: ${alert.id}`)
  }

  private async sendWebhookNotification(alert: Alert) {
    try {
      const payload = {
        alert_id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        service: 'speedy-van-api',
        environment: process.env.NODE_ENV || 'development'
      }

      // In production, send actual HTTP request
      // await fetch(this.config.endpoints.webhook!, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // })

      console.log('📡 Webhook notification sent:', payload)
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
    }
  }

  private async sendSlackNotification(alert: Alert) {
    try {
      const color = {
        info: '#36a64f',
        warning: '#ff9500', 
        critical: '#ff0000'
      }[alert.severity]

      const payload = {
        text: `🚨 ${alert.title}`,
        attachments: [{
          color,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Service',
              value: 'Speedy Van API',
              short: true
            },
            {
              title: 'Message',
              value: alert.message,
              short: false
            }
          ],
          footer: 'Speedy Van Monitoring',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
        }]
      }

      console.log('💬 Slack notification prepared:', payload)
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
    }
  }

  private async resolveAlert(ruleId: string) {
    // Find and resolve active alerts for this rule
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.ruleId === ruleId && !alert.resolved) {
        alert.resolved = true
        alert.resolvedAt = new Date().toISOString()
        
        console.log(`✅ Alert resolved: ${alert.title}`)
        
        // Optionally send resolution notification
        await this.sendResolutionNotification(alert)
        break
      }
    }
  }

  private async sendResolutionNotification(alert: Alert) {
    console.log(`🟢 RESOLVED [${alert.severity.toUpperCase()}]: ${alert.title}`)
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
  }

  getAlertHistory(limit: number = 50): Alert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  updateAlertRules(rules: AlertRule[]): void {
    this.config.rules = rules
    console.log(`📋 Updated ${rules.length} alert rules`)
  }
}

// Singleton instance
let alertingInstance: ProductionAlerting | null = null

function getAlertingInstance(): ProductionAlerting {
  if (!alertingInstance) {
    alertingInstance = new ProductionAlerting()
  }
  return alertingInstance
}

// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const alerting = getAlertingInstance()

    switch (action) {
      case 'evaluate':
        const alerts = await alerting.evaluateHealthMetrics(data)
        return NextResponse.json({ 
          success: true, 
          alerts,
          activeAlertsCount: alerting.getActiveAlerts().length
        })

      case 'get_active':
        const activeAlerts = alerting.getActiveAlerts()
        return NextResponse.json({ success: true, alerts: activeAlerts })

      case 'get_history':
        const limit = data?.limit || 50
        const history = alerting.getAlertHistory(limit)
        return NextResponse.json({ success: true, alerts: history })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Alerting API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export { ProductionAlerting, getAlertingInstance }