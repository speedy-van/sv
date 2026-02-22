'use client';

import React from 'react';
import {
  HStack,
  Button,
  Wrap,
  WrapItem,
  Badge,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import {
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserSlash,
  FaRoute,
  FaExchangeAlt,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
} from 'react-icons/fa';

export interface QuickFilterPreset {
  id: string;
  label: string;
  icon?: any;
  colorScheme: string;
  badge?: string | number;
  onClick: () => void;
  isActive?: boolean;
}

interface QuickFilterPresetsProps {
  presets: QuickFilterPreset[];
  onPresetClick: (presetId: string) => void;
  activePreset?: string;
}

export function QuickFilterPresets({ 
  presets, 
  onPresetClick, 
  activePreset 
}: QuickFilterPresetsProps) {
  return (
    <Wrap spacing={2} mb={4}>
      {presets.map((preset) => (
        <WrapItem key={preset.id}>
          <Tooltip 
            label={preset.label}
            placement="top"
            hasArrow
          >
            <Button
              size="sm"
              leftIcon={preset.icon && <Icon as={preset.icon} />}
              colorScheme={preset.colorScheme}
              variant={activePreset === preset.id ? 'solid' : 'outline'}
              onClick={() => onPresetClick(preset.id)}
              bg={
                activePreset === preset.id
                  ? `${preset.colorScheme}.500`
                  : '#121A2B'
              }
              color="#F5F8FF"
              borderColor={
                activePreset === preset.id
                  ? `${preset.colorScheme}.500`
                  : '#2A3A5E'
              }
              borderWidth="2px"
              borderRadius="lg"
              px={3}
              py={2}
              fontWeight="semibold"
              letterSpacing="0.3px"
              boxShadow={
                activePreset === preset.id
                  ? `0 4px 16px rgba(0, 0, 0, 0.3)`
                  : '0 2px 8px rgba(0, 0, 0, 0.2)'
              }
              _hover={{
                bg: activePreset === preset.id 
                  ? `${preset.colorScheme}.600` 
                  : '#18233A',
                borderColor: `${preset.colorScheme}.400`,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px rgba(0, 0, 0, 0.4)`,
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              {preset.label}
              {preset.badge !== undefined && (
                <Badge
                  ml={2}
                  colorScheme={preset.colorScheme}
                  bg={
                    activePreset === preset.id
                      ? `${preset.colorScheme}.700`
                      : `${preset.colorScheme}.500`
                  }
                  color="#F5F8FF"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {preset.badge}
                </Badge>
              )}
            </Button>
          </Tooltip>
        </WrapItem>
      ))}
    </Wrap>
  );
}

// Predefined quick filter presets
export const DEFAULT_QUICK_FILTERS: Omit<QuickFilterPreset, 'onClick' | 'isActive'>[] = [
  {
    id: 'today',
    label: "Today's Orders",
    icon: FaCalendarDay,
    colorScheme: 'blue',
  },
  {
    id: 'this-week',
    label: 'This Week',
    icon: FaCalendarWeek,
    colorScheme: 'cyan',
  },
  {
    id: 'this-month',
    label: 'This Month',
    icon: FaCalendarAlt,
    colorScheme: 'teal',
  },
  {
    id: 'urgent',
    label: 'Urgent',
    icon: FaExclamationTriangle,
    colorScheme: 'red',
  },
  {
    id: 'unpaid',
    label: 'Unpaid',
    icon: FaExclamationTriangle,
    colorScheme: 'orange',
  },
  {
    id: 'unassigned',
    label: 'Unassigned',
    icon: FaUserSlash,
    colorScheme: 'yellow',
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    icon: FaCheckCircle,
    colorScheme: 'green',
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    icon: FaClock,
    colorScheme: 'blue',
  },
  {
    id: 'with-return',
    label: 'With Return',
    icon: FaExchangeAlt,
    colorScheme: 'green',
  },
  {
    id: 'with-additional',
    label: 'With Additional Journey',
    icon: FaRoute,
    colorScheme: 'cyan',
  },
  {
    id: 'multi-drop',
    label: 'Multi-Drop Routes',
    icon: FaRoute,
    colorScheme: 'purple',
  },
  {
    id: 'single',
    label: 'Single Orders',
    icon: FaRoute,
    colorScheme: 'gray',
  },
];

