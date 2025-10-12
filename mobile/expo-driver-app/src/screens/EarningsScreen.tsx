import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDriverStore } from '../store/driver.store';
import apiService from '../services/api.service';
import pusherService from '../services/pusher.service';
import { formatEarnings } from '../utils/earnings.utils';

interface RouteEarning {
  id: string;
  routeNumber: string;
  date: string;
  completedDrops: number;
  totalDrops: number;
  baseEarnings: number;
  tips: number;
  bonuses: number;
  deductions: number;
  totalEarnings: number;
  payoutStatus: 'pending' | 'processing' | 'paid';
  payoutDate?: string;
}

interface EarningsSummary {
  today: {
    routes: number;
    earnings: number;
    tips: number;
  };
  thisWeek: {
    routes: number;
    earnings: number;
    tips: number;
    pending: number;
  };
  thisMonth: {
    routes: number;
    earnings: number;
    tips: number;
    paid: number;
    pending: number;
  };
  allTime: {
    totalRoutes: number;
    totalEarnings: number;
    averagePerRoute: number;
  };
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'pending' | 'processing' | 'paid';

export default function EarningsScreen() {
  const navigation = useNavigation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // ✅ No mock data - all from API
  const [summary, setSummary] = useState<EarningsSummary>({
    today: { routes: 0, earnings: 0, tips: 0 },
    thisWeek: { routes: 0, earnings: 0, tips: 0, pending: 0 },
    thisMonth: { routes: 0, earnings: 0, tips: 0, paid: 0, pending: 0 },
    allTime: { totalRoutes: 0, totalEarnings: 0, averagePerRoute: 0 },
  });

  const [earnings, setEarnings] = useState<RouteEarning[]>([]);

  useEffect(() => {
    loadEarningsData();
  }, [timeFilter, statusFilter]);

  // ✅ Listen to Pusher events for real-time earnings updates
  useEffect(() => {
    console.log('👂 Setting up Pusher listeners for earnings...');
    
    // Event 1: Earnings updated (recalculated)
    pusherService.addEventListener('earnings-updated', (data: any) => {
      console.log('💰 Earnings updated event:', data);
      
      if (data.amountPence) {
        const amount = data.amountPence / 100;
        Alert.alert(
          'Earnings Updated',
          `£${amount.toFixed(2)} has been ${data.partial ? 'adjusted for partial completion' : 'added to your account'}`
        );
      }
      
      // Refresh earnings
      loadEarningsData();
    });
    
    // Event 2: Route removed (may affect earnings)
    pusherService.addEventListener('route-removed', (data: any) => {
      console.log('🚫 Route removed - checking earnings impact:', data);
      
      if (data.earningsData) {
        // Refresh to show updated partial earnings
        loadEarningsData();
      }
    });
    
    // Event 3: Schedule updated
    pusherService.addEventListener('schedule-updated', (data: any) => {
      console.log('📅 Schedule updated - may affect earnings:', data);
      // Refresh earnings to stay in sync
      loadEarningsData();
    });
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Pusher listeners for earnings');
      pusherService.removeEventListener('earnings-updated');
      pusherService.removeEventListener('route-removed');
      pusherService.removeEventListener('schedule-updated');
    };
  }, []);

  // ✅ Load earnings from real API
  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Fetching earnings from API...');
      
      const response = await apiService.get('/api/driver/earnings') as any;
      
      if (response?.data?.success) {
        const fetchedEarnings = response.data.earnings || [];
        const fetchedSummary = response.data.summary || summary;
        
        console.log(`✅ Fetched ${fetchedEarnings.length} earnings records`);
        
        // Convert pence to GBP for display (API returns pence)
        const earningsInGBP = fetchedEarnings.map((e: any) => ({
          ...e,
          baseEarnings: e.baseEarningsPence / 100,
          tips: e.tipsPence / 100,
          bonuses: e.bonusesPence / 100,
          deductions: e.deductionsPence / 100,
          totalEarnings: e.totalEarningsPence / 100,
        }));
        
        setEarnings(earningsInGBP);
        setSummary(fetchedSummary);
      } else {
        console.warn('⚠️ No earnings data in response');
        setEarnings([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading earnings:', error);
      Alert.alert(
        'Connection Error',
        'Could not load earnings. Please check your internet connection.',
        [{ text: 'Retry', onPress: loadEarningsData }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const filteredEarnings = earnings.filter(earning => {
    if (statusFilter !== 'all' && earning.payoutStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'processing': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'processing': return 'time';
      case 'pending': return 'hourglass';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  const getCurrentSummary = () => {
    switch (timeFilter) {
      case 'today': return summary.today;
      case 'week': return summary.thisWeek;
      case 'month': return summary.thisMonth;
      case 'all': return summary.allTime;
      default: return summary.thisWeek;
    }
  };

  const renderSummaryCard = () => {
    const currentSummary = getCurrentSummary();
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          {timeFilter === 'today' && 'Today\'s Earnings'}
          {timeFilter === 'week' && 'This Week'}
          {timeFilter === 'month' && 'This Month'}
          {timeFilter === 'all' && 'All Time'}
        </Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Routes</Text>
            <Text style={styles.statValue}>
              {timeFilter === 'all' ? (currentSummary as any).totalRoutes : (currentSummary as any).routes}
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Earnings</Text>
            <Text style={styles.statValue}>
              £{timeFilter === 'all' ? ((currentSummary as any).totalEarnings?.toFixed(2) || '0.00') : ((currentSummary as any).earnings?.toFixed(2) || '0.00')}
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tips</Text>
            <Text style={styles.statValue}>
              £{(currentSummary as any).tips?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {(timeFilter === 'week' || timeFilter === 'month') && (
          <View style={styles.pendingInfo}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.pendingText}>
              £{(currentSummary as any).pending?.toFixed(2) || '0.00'} pending payout
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, timeFilter === 'today' && styles.filterChipActive]}
          onPress={() => setTimeFilter('today')}
        >
          <Text style={[styles.filterChipText, timeFilter === 'today' && styles.filterChipTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, timeFilter === 'week' && styles.filterChipActive]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={[styles.filterChipText, timeFilter === 'week' && styles.filterChipTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, timeFilter === 'month' && styles.filterChipActive]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={[styles.filterChipText, timeFilter === 'month' && styles.filterChipTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, timeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[styles.filterChipText, timeFilter === 'all' && styles.filterChipTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
        <Ionicons name="options" size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  );

  const renderEarningCard = (earning: RouteEarning) => (
    <TouchableOpacity key={earning.id} style={styles.earningCard}>
      <View style={styles.earningHeader}>
        <View style={styles.earningInfo}>
          <Text style={styles.routeNumber}>{earning.routeNumber}</Text>
          <Text style={styles.earningDate}>{formatDate(earning.date)}</Text>
        </View>
        
        <View style={styles.earningAmount}>
          <Text style={styles.totalEarnings}>£{earning.totalEarnings.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(earning.payoutStatus) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(earning.payoutStatus) as any} 
              size={12} 
              color={getStatusColor(earning.payoutStatus)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(earning.payoutStatus) }]}>
              {earning.payoutStatus}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.earningDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {earning.completedDrops}/{earning.totalDrops} drops completed
          </Text>
        </View>
      </View>

      <View style={styles.earningBreakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Base</Text>
          <Text style={styles.breakdownValue}>£{earning.baseEarnings.toFixed(2)}</Text>
        </View>
        
        {earning.tips > 0 && (
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Tips</Text>
            <Text style={[styles.breakdownValue, styles.positiveValue]}>+£{earning.tips.toFixed(2)}</Text>
          </View>
        )}
        
        {earning.bonuses > 0 && (
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Bonuses</Text>
            <Text style={[styles.breakdownValue, styles.positiveValue]}>+£{earning.bonuses.toFixed(2)}</Text>
          </View>
        )}
        
        {earning.deductions > 0 && (
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Deductions</Text>
            <Text style={[styles.breakdownValue, styles.negativeValue]}>-£{earning.deductions.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {earning.payoutDate && (
        <View style={styles.payoutInfo}>
          <Ionicons name="calendar" size={12} color="#10B981" />
          <Text style={styles.payoutText}>Paid on {formatDate(earning.payoutDate)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Earnings</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Payout Status</Text>
            
            {(['all', 'pending', 'processing', 'paid'] as StatusFilter[]).map(status => (
              <TouchableOpacity
                key={status}
                style={styles.filterOption}
                onPress={() => {
                  setStatusFilter(status);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.filterOptionText}>
                  {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                {statusFilter === status && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setStatusFilter('all');
                setTimeFilter('week');
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        {renderSummaryCard()}

        {/* Filter Bar */}
        {renderFilterBar()}

        {/* Earnings List */}
        <View style={styles.earningsList}>
          <Text style={styles.sectionTitle}>
            {filteredEarnings.length} Route{filteredEarnings.length !== 1 ? 's' : ''}
          </Text>
          
          {filteredEarnings.length > 0 ? (
            filteredEarnings.map(earning => renderEarningCard(earning))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No earnings found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters or complete some routes
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pendingText: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 6,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  earningsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  earningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  earningInfo: {
    flex: 1,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  earningDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  earningAmount: {
    alignItems: 'flex-end',
  },
  totalEarnings: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  earningDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  earningBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  payoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  payoutText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterSection: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  modalActions: {
    paddingHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
