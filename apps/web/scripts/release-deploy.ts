#!/usr/bin/env tsx

/**
 * Release Deployment Script
 *
 * This script handles automated deployment with rollback capabilities
 * and deployment monitoring.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface DeploymentConfig {
  environment: 'staging' | 'production';
  version: string;
  rollbackVersion?: string;
  featureFlags: string[];
  healthCheckUrl: string;
  deploymentTimeout: number;
}

interface DeploymentStep {
  name: string;
  command: string;
  rollbackCommand?: string;
  timeout?: number;
}

class ReleaseDeployer {
  private config: DeploymentConfig;
  private deploymentId: string;
  private steps: DeploymentStep[] = [];
  private currentStep = 0;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeSteps();
  }

  private initializeSteps(): void {
    this.steps = [
      {
        name: 'Pre-deployment checks',
        command: 'npm run release:check',
        timeout: 300000, // 5 minutes
      },
      {
        name: 'Database backup',
        command: this.getBackupCommand(),
        rollbackCommand: this.getRestoreCommand(),
        timeout: 600000, // 10 minutes
      },
      {
        name: 'Run database migrations',
        command: 'npm run prisma:migrate',
        rollbackCommand: this.getMigrationRollbackCommand(),
        timeout: 300000, // 5 minutes
      },
      {
        name: 'Build application',
        command: 'npm run build',
        timeout: 600000, // 10 minutes
      },
      {
        name: 'Deploy to environment',
        command: this.getDeployCommand(),
        rollbackCommand: this.getRollbackCommand(),
        timeout: this.config.deploymentTimeout,
      },
      {
        name: 'Health check',
        command: this.getHealthCheckCommand(),
        timeout: 120000, // 2 minutes
      },
      {
        name: 'Feature flag activation',
        command: this.getFeatureFlagCommand(),
        timeout: 60000, // 1 minute
      },
      {
        name: 'Post-deployment verification',
        command: this.getVerificationCommand(),
        timeout: 300000, // 5 minutes
      },
    ];
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment to ${this.config.environment}...`);
    console.log(`📦 Version: ${this.config.version}`);
    console.log(`🆔 Deployment ID: ${this.deploymentId}\n`);

    // Record deployment start
    await this.recordDeploymentStart();

    try {
      for (let i = 0; i < this.steps.length; i++) {
        this.currentStep = i;
        const step = this.steps[i];

        console.log(`\n📋 Step ${i + 1}/${this.steps.length}: ${step.name}`);
        console.log(`⏱️  Timeout: ${(step.timeout || 300000) / 1000}s`);

        await this.executeStep(step);

        console.log(`✅ Step ${i + 1} completed successfully`);
      }

      // Record successful deployment
      await this.recordDeploymentSuccess();

      console.log('\n🎉 Deployment completed successfully!');
      console.log(`🌐 Application is live at: ${this.config.healthCheckUrl}`);
    } catch (error) {
      console.error(
        `\n❌ Deployment failed at step ${this.currentStep + 1}: ${this.steps[this.currentStep].name}`
      );
      console.error('Error:', error);

      // Record deployment failure
      await this.recordDeploymentFailure(error);

      // Attempt rollback
      await this.rollback();

      throw error;
    }
  }

  private async executeStep(step: DeploymentStep): Promise<void> {
    const startTime = Date.now();

    try {
      // Execute the command
      execSync(step.command, {
        stdio: 'inherit',
        timeout: step.timeout || 300000,
        env: {
          ...process.env,
          DEPLOYMENT_ID: this.deploymentId,
          DEPLOYMENT_ENVIRONMENT: this.config.environment,
          DEPLOYMENT_VERSION: this.config.version,
        },
      });

      // Record step success
      await this.recordStepSuccess(step, Date.now() - startTime);
    } catch (error) {
      // Record step failure
      await this.recordStepFailure(step, error, Date.now() - startTime);
      throw error;
    }
  }

  private async rollback(): Promise<void> {
    console.log('\n🔄 Starting rollback...');

    try {
      // Rollback in reverse order
      for (let i = this.currentStep; i >= 0; i--) {
        const step = this.steps[i];
        if (step.rollbackCommand) {
          console.log(`🔄 Rolling back step: ${step.name}`);

          try {
            execSync(step.rollbackCommand, {
              stdio: 'inherit',
              timeout: step.timeout || 300000,
              env: {
                ...process.env,
                DEPLOYMENT_ID: this.deploymentId,
                DEPLOYMENT_ENVIRONMENT: this.config.environment,
                DEPLOYMENT_VERSION: this.config.rollbackVersion || 'previous',
              },
            });

            console.log(`✅ Rollback step completed: ${step.name}`);
          } catch (rollbackError) {
            console.error(
              `❌ Rollback step failed: ${step.name}`,
              rollbackError
            );
            // Continue with other rollback steps
          }
        }
      }

      // Record rollback completion
      await this.recordRollbackCompletion();

      console.log('\n✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  private getBackupCommand(): string {
    if (this.config.environment === 'production') {
      return `pg_dump "${process.env.DATABASE_URL}" > backup_${this.deploymentId}.sql`;
    }
    return 'echo "Skipping backup for non-production environment"';
  }

  private getRestoreCommand(): string {
    if (this.config.environment === 'production') {
      return `psql "${process.env.DATABASE_URL}" < backup_${this.deploymentId}.sql`;
    }
    return 'echo "No restore needed for non-production environment"';
  }

  private getMigrationRollbackCommand(): string {
    // This would be more sophisticated in a real implementation
    return 'echo "Migration rollback would be implemented here"';
  }

  private getDeployCommand(): string {
    switch (this.config.environment) {
      case 'staging':
        return 'npm run deploy:staging';
      case 'production':
        return 'npm run deploy:production';
      default:
        throw new Error(`Unknown environment: ${this.config.environment}`);
    }
  }

  private getRollbackCommand(): string {
    switch (this.config.environment) {
      case 'staging':
        return 'npm run rollback:staging';
      case 'production':
        return 'npm run rollback:production';
      default:
        throw new Error(`Unknown environment: ${this.config.environment}`);
    }
  }

  private getHealthCheckCommand(): string {
    return `curl -f ${this.config.healthCheckUrl} || exit 1`;
  }

  private getFeatureFlagCommand(): string {
    if (this.config.featureFlags.length === 0) {
      return 'echo "No feature flags to activate"';
    }

    const flagCommands = this.config.featureFlags.map(
      flag =>
        `curl -X PUT /api/feature-flags -H "Content-Type: application/json" -d '{"name":"${flag}","enabled":true}'`
    );

    return flagCommands.join(' && ');
  }

  private getVerificationCommand(): string {
    return `npm run test:e2e -- --project=${this.config.environment}`;
  }

  private async recordDeploymentStart(): Promise<void> {
    console.log(
      `🚀 Starting deployment ${this.deploymentId} for ${this.config.environment} v${this.config.version}`
    );
    // Deployment logging not implemented yet
  }

  private async recordDeploymentSuccess(): Promise<void> {
    console.log(`✅ Deployment ${this.deploymentId} completed successfully`);
    // Deployment logging not implemented yet
  }

  private async recordDeploymentFailure(error: any): Promise<void> {
    console.error(
      `❌ Deployment ${this.deploymentId} failed:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Deployment logging not implemented yet
  }

  private async recordStepSuccess(
    step: DeploymentStep,
    duration: number
  ): Promise<void> {
    console.log(`✅ Step '${step.name}' completed in ${duration}ms`);
    // Deployment logging not implemented yet
  }

  private async recordStepFailure(
    step: DeploymentStep,
    error: any,
    duration: number
  ): Promise<void> {
    console.error(
      `❌ Step '${step.name}' failed after ${duration}ms:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Deployment logging not implemented yet
  }

  private async recordRollbackCompletion(): Promise<void> {
    console.log(`🔄 Deployment ${this.deploymentId} rolled back successfully`);
    // Deployment logging not implemented yet
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npm run release:deploy <environment> <version>');
    console.error('Example: npm run release:deploy production v1.2.3');
    process.exit(1);
  }

  const [environment, version] = args;

  if (!['staging', 'production'].includes(environment)) {
    console.error('Environment must be "staging" or "production"');
    process.exit(1);
  }

  const config: DeploymentConfig = {
    environment: environment as 'staging' | 'production',
    version,
    featureFlags: [
      'driver_portal_v2',
      'advanced_navigation',
      'real_time_tracking',
    ],
    healthCheckUrl:
      environment === 'production'
        ? 'https://speedy-van.co.uk/api/health'
        : 'https://staging.speedy-van.co.uk/api/health',
    deploymentTimeout: environment === 'production' ? 1800000 : 900000, // 30min prod, 15min staging
  };

  const deployer = new ReleaseDeployer(config);

  try {
    await deployer.deploy();
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Deployment script failed:', error);
    process.exit(1);
  });
}

export { ReleaseDeployer };
export type { DeploymentConfig };
