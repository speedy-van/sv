/**
 * WebSocket Testing Suite for Multi-Drop Routes
 * 
 * Tests WebSocket connection resilience, real-time updates, and driver communication
 * Run: node test-websocket.js
 */

// Mock WebSocket implementation for testing
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    
    // Simulate connection after delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen({ type: 'open' });
    }, Math.random() * 100 + 50); // 50-150ms delay
  }
  
  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    console.log(`📤 Sending: ${data}`);
    
    // Simulate echo response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          type: 'message',
          data: JSON.stringify({
            type: 'ack',
            originalMessage: JSON.parse(data),
            timestamp: new Date().toISOString()
          })
        });
      }
    }, Math.random() * 50 + 10); // 10-60ms delay
  }
  
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ type: 'close' });
  }
  
  // Simulate connection loss
  simulateDisconnection() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ type: 'close', code: 1006 });
  }
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
}

// WebSocket connection manager with reconnection logic
class RouteWebSocketManager {
  constructor(url, driverId) {
    this.url = url;
    this.driverId = driverId;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.isConnected = false;
    this.messageQueue = [];
    this.heartbeatInterval = null;
    
    // Metrics
    this.metrics = {
      connectionsEstablished: 0,
      messagesReceived: 0,
      messagesSent: 0,
      reconnectionAttempts: 0,
      totalDowntime: 0,
      lastDisconnection: null
    };
    
    this.connect();
  }
  
  connect() {
    try {
      console.log(`🔌 Connecting WebSocket for driver ${this.driverId}...`);
      
      this.ws = new MockWebSocket(`${this.url}?driverId=${this.driverId}`);
      
      this.ws.onopen = (event) => {
        console.log(`✅ WebSocket connected for driver ${this.driverId}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.metrics.connectionsEstablished++;
        
        // Send queued messages
        this.flushMessageQueue();
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Authenticate
        this.authenticate();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
      
      this.ws.onclose = (event) => {
        console.log(`❌ WebSocket disconnected for driver ${this.driverId} (code: ${event.code})`);
        this.isConnected = false;
        this.stopHeartbeat();
        
        // Track downtime
        if (this.metrics.lastDisconnection) {
          this.metrics.totalDowntime += Date.now() - this.metrics.lastDisconnection;
        }
        this.metrics.lastDisconnection = Date.now();
        
        // Attempt reconnection
        this.attemptReconnection();
      };
      
      this.ws.onerror = (error) => {
        console.error(`🚨 WebSocket error for driver ${this.driverId}:`, error);
      };
      
    } catch (error) {
      console.error(`❌ Failed to create WebSocket connection:`, error);
      this.attemptReconnection();
    }
  }
  
  authenticate() {
    this.send({
      type: 'auth',
      driverId: this.driverId,
      timestamp: new Date().toISOString()
    });
  }
  
  send(message) {
    if (this.isConnected && this.ws.readyState === MockWebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.metrics.messagesSent++;
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      console.log(`📝 Message queued for driver ${this.driverId} (${this.messageQueue.length} total)`);
    }
  }
  
  handleMessage(message) {
    this.metrics.messagesReceived++;
    
    switch (message.type) {
      case 'ack':
        console.log(`📨 Received acknowledgment for driver ${this.driverId}`);
        break;
        
      case 'route_assignment':
        console.log(`🗺️  Route assigned to driver ${this.driverId}: ${message.routeId}`);
        this.handleRouteAssignment(message);
        break;
        
      case 'drop_update':
        console.log(`📦 Drop update for driver ${this.driverId}: ${message.dropId}`);
        this.handleDropUpdate(message);
        break;
        
      case 'navigation_update':
        console.log(`🧭 Navigation update for driver ${this.driverId}`);
        this.handleNavigationUpdate(message);
        break;
        
      case 'emergency_alert':
        console.log(`🚨 Emergency alert for driver ${this.driverId}: ${message.alert}`);
        this.handleEmergencyAlert(message);
        break;
        
      default:
        console.log(`📄 Unknown message type for driver ${this.driverId}: ${message.type}`);
    }
  }
  
  handleRouteAssignment(message) {
    // Acknowledge route assignment
    this.send({
      type: 'route_acknowledgment',
      routeId: message.routeId,
      driverId: this.driverId,
      status: 'accepted',
      timestamp: new Date().toISOString()
    });
  }
  
  handleDropUpdate(message) {
    // Send location update in response
    this.sendLocationUpdate();
  }
  
  handleNavigationUpdate(message) {
    // Process navigation instructions
    console.log(`🗺️  Processing navigation: ${message.instruction}`);
  }
  
  handleEmergencyAlert(message) {
    // Handle emergency with high priority
    console.log(`🚨 EMERGENCY: ${message.alert}`);
    
    this.send({
      type: 'emergency_response',
      alertId: message.alertId,
      driverId: this.driverId,
      response: 'acknowledged',
      timestamp: new Date().toISOString()
    });
  }
  
  sendLocationUpdate() {
    // Simulate GPS coordinates around Riyadh
    const baseLatitude = 24.7136;
    const baseLongitude = 46.6753;
    const variance = 0.01; // ~1km variance
    
    this.send({
      type: 'location_update',
      driverId: this.driverId,
      location: {
        latitude: baseLatitude + (Math.random() - 0.5) * variance,
        longitude: baseLongitude + (Math.random() - 0.5) * variance,
        accuracy: Math.random() * 5 + 2, // 2-7 meters
        timestamp: new Date().toISOString()
      }
    });
  }
  
  sendDropStatusUpdate(dropId, status) {
    this.send({
      type: 'drop_status_update',
      dropId,
      driverId: this.driverId,
      status,
      timestamp: new Date().toISOString(),
      location: {
        latitude: 24.7136 + (Math.random() - 0.5) * 0.01,
        longitude: 46.6753 + (Math.random() - 0.5) * 0.01
      }
    });
  }
  
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }
  
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          driverId: this.driverId,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // 30 seconds
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`🛑 Max reconnection attempts reached for driver ${this.driverId}`);
      return;
    }
    
    this.reconnectAttempts++;
    this.metrics.reconnectionAttempts++;
    
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} for driver ${this.driverId} in ${this.reconnectDelay}ms...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    
    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(this.reconnectDelay * 2 + Math.random() * 1000, 30000);
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      queuedMessages: this.messageQueue.length,
      uptime: this.metrics.connectionsEstablished > 0 ? 
        Date.now() - (this.metrics.lastDisconnection || Date.now()) - this.metrics.totalDowntime : 0
    };
  }
  
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Test suite for WebSocket functionality
async function runWebSocketTests() {
  console.log('🧪 Starting WebSocket Test Suite...\n');
  
  // Test 1: Basic connection and communication
  await testBasicConnection();
  
  // Test 2: Multiple concurrent connections
  await testConcurrentConnections();
  
  // Test 3: Connection resilience (disconnection/reconnection)
  await testConnectionResilience();
  
  // Test 4: Message queuing during disconnection
  await testMessageQueuing();
  
  // Test 5: Load testing
  await testLoadHandling();
  
  console.log('\n🎉 WebSocket test suite completed!');
}

async function testBasicConnection() {
  console.log('📋 Test 1: Basic WebSocket connection and communication');
  
  const driver = new RouteWebSocketManager('ws://localhost:8080/driver-ws', 'driver_001');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Send test messages
      driver.sendLocationUpdate();
      driver.sendDropStatusUpdate('drop_001', 'picked_up');
      
      setTimeout(() => {
        const metrics = driver.getMetrics();
        console.log(`✅ Basic connection test results:`);
        console.log(`   Connected: ${metrics.isConnected}`);
        console.log(`   Messages sent: ${metrics.messagesSent}`);
        console.log(`   Messages received: ${metrics.messagesReceived}`);
        
        driver.disconnect();
        resolve();
      }, 2000);
    }, 1000);
  });
}

async function testConcurrentConnections() {
  console.log('\n📋 Test 2: Multiple concurrent WebSocket connections');
  
  const drivers = [];
  const driverCount = 10;
  
  // Create multiple connections
  for (let i = 0; i < driverCount; i++) {
    const driver = new RouteWebSocketManager('ws://localhost:8080/driver-ws', `driver_${String(i).padStart(3, '0')}`);
    drivers.push(driver);
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Send messages from all drivers
      drivers.forEach((driver, index) => {
        driver.sendLocationUpdate();
        if (index % 3 === 0) {
          driver.sendDropStatusUpdate(`drop_${index}`, 'delivered');
        }
      });
      
      setTimeout(() => {
        let totalSent = 0;
        let totalReceived = 0;
        let connectedCount = 0;
        
        drivers.forEach(driver => {
          const metrics = driver.getMetrics();
          totalSent += metrics.messagesSent;
          totalReceived += metrics.messagesReceived;
          if (metrics.isConnected) connectedCount++;
          driver.disconnect();
        });
        
        console.log(`✅ Concurrent connections test results:`);
        console.log(`   Drivers connected: ${connectedCount}/${driverCount}`);
        console.log(`   Total messages sent: ${totalSent}`);
        console.log(`   Total messages received: ${totalReceived}`);
        console.log(`   Success rate: ${((connectedCount / driverCount) * 100).toFixed(1)}%`);
        
        resolve();
      }, 3000);
    }, 1000);
  });
}

async function testConnectionResilience() {
  console.log('\n📋 Test 3: Connection resilience (disconnection/reconnection)');
  
  const driver = new RouteWebSocketManager('ws://localhost:8080/driver-ws', 'driver_resilience');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate disconnection
      console.log('🔌 Simulating connection loss...');
      driver.ws.simulateDisconnection();
      
      // Wait for reconnection
      setTimeout(() => {
        const metrics = driver.getMetrics();
        console.log(`✅ Resilience test results:`);
        console.log(`   Reconnection attempts: ${metrics.reconnectionAttempts}`);
        console.log(`   Connected after disruption: ${metrics.isConnected}`);
        console.log(`   Total downtime: ${metrics.totalDowntime}ms`);
        
        driver.disconnect();
        resolve();
      }, 5000);
    }, 1000);
  });
}

async function testMessageQueuing() {
  console.log('\n📋 Test 4: Message queuing during disconnection');
  
  const driver = new RouteWebSocketManager('ws://localhost:8080/driver-ws', 'driver_queuing');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Disconnect and send messages
      driver.ws.simulateDisconnection();
      
      // Send messages while disconnected
      for (let i = 0; i < 5; i++) {
        driver.sendLocationUpdate();
        driver.sendDropStatusUpdate(`drop_queue_${i}`, 'in_transit');
      }
      
      setTimeout(() => {
        const metrics = driver.getMetrics();
        console.log(`✅ Message queuing test results:`);
        console.log(`   Messages queued during disconnection: ${metrics.queuedMessages}`);
        console.log(`   Reconnected: ${metrics.isConnected}`);
        console.log(`   Messages sent after reconnection: ${metrics.messagesSent}`);
        
        driver.disconnect();
        resolve();
      }, 3000);
    }, 1000);
  });
}

async function testLoadHandling() {
  console.log('\n📋 Test 5: Load testing (high message volume)');
  
  const driver = new RouteWebSocketManager('ws://localhost:8080/driver-ws', 'driver_load_test');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const startTime = Date.now();
      const messageCount = 100;
      
      // Send many messages rapidly
      for (let i = 0; i < messageCount; i++) {
        setTimeout(() => {
          driver.sendLocationUpdate();
          if (i % 10 === 0) {
            driver.sendDropStatusUpdate(`drop_load_${i}`, 'picked_up');
          }
        }, i * 10); // 10ms intervals
      }
      
      setTimeout(() => {
        const endTime = Date.now();
        const metrics = driver.getMetrics();
        const duration = endTime - startTime;
        
        console.log(`✅ Load testing results:`);
        console.log(`   Test duration: ${duration}ms`);
        console.log(`   Messages sent: ${metrics.messagesSent}`);
        console.log(`   Messages received: ${metrics.messagesReceived}`);
        console.log(`   Messages per second: ${((metrics.messagesSent / duration) * 1000).toFixed(1)}`);
        console.log(`   Success rate: ${((metrics.messagesReceived / metrics.messagesSent) * 100).toFixed(1)}%`);
        
        driver.disconnect();
        resolve();
      }, 2000);
    }, 1000);
  });
}

// Performance benchmark for WebSocket connections
async function benchmarkWebSocketPerformance() {
  console.log('\n🏁 Running WebSocket Performance Benchmark...\n');
  
  const scenarios = [
    { drivers: 5, messagesPerMinute: 60, duration: 30000 }, // 30 seconds
    { drivers: 20, messagesPerMinute: 120, duration: 60000 }, // 1 minute
    { drivers: 50, messagesPerMinute: 180, duration: 120000 } // 2 minutes
  ];
  
  for (const scenario of scenarios) {
    console.log(`📊 Testing ${scenario.drivers} drivers, ${scenario.messagesPerMinute} msg/min for ${scenario.duration/1000}s`);
    
    const drivers = [];
    const startTime = Date.now();
    
    // Create drivers
    for (let i = 0; i < scenario.drivers; i++) {
      const driver = new RouteWebSocketManager('ws://localhost:8080/driver-ws', `bench_driver_${i}`);
      drivers.push(driver);
    }
    
    // Send messages at specified rate
    const messageInterval = (60 * 1000) / scenario.messagesPerMinute; // ms between messages
    const messageTimer = setInterval(() => {
      drivers.forEach(driver => {
        if (Math.random() < 0.7) { // 70% chance to send location update
          driver.sendLocationUpdate();
        } else { // 30% chance to send status update
          driver.sendDropStatusUpdate(`drop_${Date.now()}`, 'in_transit');
        }
      });
    }, messageInterval);
    
    // Wait for scenario duration
    await new Promise(resolve => setTimeout(resolve, scenario.duration));
    
    clearInterval(messageTimer);
    
    // Calculate results
    const endTime = Date.now();
    let totalSent = 0;
    let totalReceived = 0;
    let connectedDrivers = 0;
    let totalReconnections = 0;
    
    drivers.forEach(driver => {
      const metrics = driver.getMetrics();
      totalSent += metrics.messagesSent;
      totalReceived += metrics.messagesReceived;
      totalReconnections += metrics.reconnectionAttempts;
      if (metrics.isConnected) connectedDrivers++;
      driver.disconnect();
    });
    
    const duration = endTime - startTime;
    const messagesPerSecond = (totalSent / (duration / 1000)).toFixed(1);
    
    console.log(`   Results:`);
    console.log(`   - Connected drivers: ${connectedDrivers}/${scenario.drivers}`);
    console.log(`   - Total messages: ${totalSent} sent, ${totalReceived} received`);
    console.log(`   - Message rate: ${messagesPerSecond} msg/sec`);
    console.log(`   - Success rate: ${((totalReceived / totalSent) * 100).toFixed(1)}%`);
    console.log(`   - Reconnections: ${totalReconnections}`);
    console.log('');
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = {
    RouteWebSocketManager,
    runWebSocketTests,
    benchmarkWebSocketPerformance
  };
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runWebSocketTests()
    .then(() => benchmarkWebSocketPerformance())
    .catch(console.error);
}