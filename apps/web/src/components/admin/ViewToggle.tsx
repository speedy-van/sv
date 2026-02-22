'use client';

import React from 'react';
import {
  ButtonGroup,
  IconButton,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import { FiGrid, FiList, FiColumns } from 'react-icons/fi';

export type ViewType = 'table' | 'card' | 'kanban';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  const views = [
    { type: 'table' as ViewType, icon: FiList, label: 'Table View' },
    { type: 'card' as ViewType, icon: FiGrid, label: 'Card View' },
    { type: 'kanban' as ViewType, icon: FiColumns, label: 'Kanban View' },
  ];

  return (
    <ButtonGroup
      isAttached
      variant="outline"
      size="md"
      bg="bg.card"
      borderColor="border.primary"
      borderWidth="2px"
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
        pointerEvents: 'none',
        opacity: 0.5,
      }}
    >
      {views.map(({ type, icon: Icon, label }) => {
        const isActive = view === type;
        return (
          <Tooltip key={type} label={label} placement="top" hasArrow>
            <Box position="relative" zIndex={1}>
              <IconButton
                icon={<Icon />}
                aria-label={label}
                onClick={() => onViewChange(type)}
                bg={isActive ? 'linear-gradient(135deg, var(--chakra-colors-interactive-primary) 0%, var(--chakra-colors-interactive-active) 100%)' : 'transparent'}
                color={isActive ? 'text.primary' : 'text.secondary'}
                border="none"
                borderRadius="0"
                size="md"
                px={3}
                py={2}
                fontWeight="semibold"
                boxShadow={isActive ? '0 4px 16px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none'}
                _hover={{
                  bg: isActive
                    ? 'linear-gradient(135deg, var(--chakra-colors-interactive-active) 0%, var(--chakra-colors-blue-700) 100%)'
                    : 'bg.surface.elevated',
                  color: 'text.primary',
                  transform: 'translateY(-1px)',
                  boxShadow: isActive 
                    ? '0 6px 20px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : 'sm',
                }}
                _active={{
                  transform: 'translateY(0)',
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                position="relative"
                _after={isActive ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: '2px',
                  bg: 'green.400',
                  borderRadius: 'full',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.45)',
                } : {}}
              />
            </Box>
          </Tooltip>
        );
      })}
    </ButtonGroup>
  );
};

export default ViewToggle;
