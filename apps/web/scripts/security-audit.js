#!/usr/bin/env node

/**
 * Security Configuration Audit
 * 
 * This script checks security settings and secrets strength
 */

const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔒 Security Configuration Audit');
console.log('===============================\n');

// Check secret strengths
function checkSecretStrength(secret, minLength = 32) {
  if (!secret) return { valid: false, strength: 'Missing' };
  if (secret.length < minLength) return { valid: false, strength: 'Too short' };
  if (secret === 'your_secret_here' || secret.includes('change_this')) return { valid: false, strength: 'Default value' };
  
  // Check complexity
  const hasLowercase = /[a-z]/.test(secret);
  const hasUppercase = /[A-Z]/.test(secret);
  const hasNumbers = /\d/.test(secret);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(secret);
  
  const complexityScore = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  if (complexityScore >= 3 && secret.length >= 64) return { valid: true, strength: 'Strong' };
  if (complexityScore >= 2 && secret.length >= 32) return { valid: true, strength: 'Medium' };
  return { valid: true, strength: 'Weak' };
}

// Check URL security
function checkUrlSecurity(url) {
  const issues = [];
  
  if (!url) return { valid: false, issues: ['URL not set'] };
  
  if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
    issues.push('Using localhost in production');
  }
  
  if (!url.startsWith('https://') && process.env.NODE_ENV === 'production') {
    issues.push('Not using HTTPS in production');
  }
  
  return { valid: issues.length === 0, issues };
}

console.log('🔑 Secret Keys Audit:');
console.log('===================');

// Check NEXTAUTH_SECRET
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthCheck = checkSecretStrength(nextAuthSecret || '', 32);
console.log(`NEXTAUTH_SECRET: ${nextAuthCheck.valid ? '✅' : '❌'} ${nextAuthCheck.strength}`);
if (!nextAuthCheck.valid) {
  console.log('   Issue: NextAuth secret should be at least 32 characters long and complex');
}

// Check JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;
const jwtCheck = checkSecretStrength(jwtSecret || '', 32);
console.log(`JWT_SECRET: ${jwtCheck.valid ? '✅' : '❌'} ${jwtCheck.strength}`);
if (!jwtCheck.valid) {
  console.log('   Issue: JWT secret should be at least 32 characters long and complex');
}

// Check CUSTOM_KEY
const customKey = process.env.CUSTOM_KEY;
const customKeyCheck = checkSecretStrength(customKey || '', 32);
console.log(`CUSTOM_KEY: ${customKeyCheck.valid ? '✅' : '❌'} ${customKeyCheck.strength}`);

console.log('\n🌐 URL Configuration:');
console.log('====================');

// Check NEXTAUTH_URL
const nextAuthUrl = process.env.NEXTAUTH_URL;
const urlCheck = checkUrlSecurity(nextAuthUrl || '');
console.log(`NEXTAUTH_URL: ${urlCheck.valid ? '✅' : '❌'} ${nextAuthUrl}`);
urlCheck.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));

// Check BASE_URL
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const baseUrlCheck = checkUrlSecurity(baseUrl || '');
console.log(`NEXT_PUBLIC_BASE_URL: ${baseUrlCheck.valid ? '✅' : '❌'} ${baseUrl}`);
baseUrlCheck.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));

console.log('\n🔐 API Keys Security:');
console.log('====================');

// Check Stripe keys format
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (stripeSecret?.startsWith('sk_test_')) {
  console.log('⚠️  Stripe: Using TEST keys (good for development)');
} else if (stripeSecret?.startsWith('sk_live_')) {
  console.log('✅ Stripe: Using LIVE keys (production ready)');
} else {
  console.log('❌ Stripe: Invalid or missing secret key');
}

// Check for exposed secrets in logs/code
console.log('\n🚨 Security Recommendations:');
console.log('============================');

const recommendations = [];

if (process.env.NODE_ENV !== 'production') {
  recommendations.push('Set NODE_ENV=production for production deployment');
}

if (nextAuthSecret && nextAuthSecret.length < 64) {
  recommendations.push('Generate a stronger NEXTAUTH_SECRET (64+ characters)');
}

if (jwtSecret && jwtSecret.length < 64) {
  recommendations.push('Generate a stronger JWT_SECRET (64+ characters)');
}

if (baseUrl && !baseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
  recommendations.push('Use HTTPS URLs for production');
}

if (recommendations.length === 0) {
  console.log('✅ All security checks passed!');
} else {
  recommendations.forEach(rec => console.log(`🔧 ${rec}`));
}

console.log('\n💡 Security Best Practices:');
console.log('===========================');
console.log('1. Rotate secrets regularly');
console.log('2. Use different secrets for different environments');
console.log('3. Never commit secrets to version control');
console.log('4. Use environment-specific configuration');
console.log('5. Monitor for security vulnerabilities');
console.log('6. Enable CORS restrictions in production');
console.log('7. Set up proper logging and monitoring');

// Generate new secrets if needed
console.log('\n🔄 Generate New Secrets (for production):');
console.log('========================================');
console.log('NEXTAUTH_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('CUSTOM_KEY=' + crypto.randomBytes(64).toString('hex'));