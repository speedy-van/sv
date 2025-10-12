'use client';

import React from 'react';
import {
  ButtonGroup,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiGrid, FiList, FiColumns } from 'react-icons/fi';

export type ViewType = 'table' | 'card' | 'kanban';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeBgColor = useColorModeValue('blue.500', 'blue.600');
  const activeColor = useColorModeValue('white', 'white');

  const views = [
    { type: 'table' as ViewType, icon: FiList, label: 'Table View' },
    { type: 'card' as ViewType, icon: FiGrid, label: 'Card View' },
    { type: 'kanban' as ViewType, icon: FiColumns, label: 'Kanban View' },
  ];

  return (
    <ButtonGroup
      isAttached
      variant="outline"
      size="sm"
      bg={bgColor}
      borderColor={borderColor}
      borderRadius="md"
    >
      {views.map(({ type, icon: Icon, label }) => (
        <Tooltip key={type} label={label} placement="top">
          <IconButton
            icon={<Icon />}
            aria-label={label}
            onClick={() => onViewChange(type)}
            bg={view === type ? activeBgColor : 'transparent'}
            color={view === type ? activeColor : 'inherit'}
            _hover={{
              bg: view === type ? activeBgColor : 'gray.100',
            }}
            _active={{
              bg: view === type ? activeBgColor : 'gray.200',
            }}
            border="none"
            borderRadius="md"
          />
        </Tooltip>
      ))}
    </ButtonGroup>
  );
};

export default ViewToggle;
