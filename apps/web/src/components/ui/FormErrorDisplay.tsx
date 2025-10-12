'use client';

import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  VStack,
  Text,
  Collapse,
  Button,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { 
  ValidationError, 
  groupErrorsBySection, 
  humanizeErrorMessage 
} from '@/lib/utils/form-errors';

interface FormErrorDisplayProps {
  errors: ValidationError[];
  title?: string;
  maxVisible?: number;
  showGrouped?: boolean;
  variant?: 'inline' | 'summary' | 'toast';
}

export function FormErrorDisplay({
  errors,
  title = 'Please fix the following errors:',
  maxVisible = 3,
  showGrouped = false,
  variant = 'summary'
}: FormErrorDisplayProps) {
  const { isOpen, onToggle } = useDisclosure();
  
  if (!errors || errors.length === 0) {
    return null;
  }

  const hasMoreErrors = errors.length > maxVisible;
  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenErrors = errors.slice(maxVisible);

  if (variant === 'inline') {
    return (
      <Box>
        {errors.map((error, index) => (
          <Text key={index} color="red.500" fontSize="sm" mt={1}>
            {humanizeErrorMessage(error.message)}
          </Text>
        ))}
      </Box>
    );
  }

  if (variant === 'toast') {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Validation Error!</AlertTitle>
          <AlertDescription>
            {errors.length === 1 
              ? humanizeErrorMessage(errors[0].message)
              : `${errors.length} errors need to be fixed`
            }
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  if (showGrouped) {
    // Convert array of errors to object format expected by groupErrorsBySection
    const errorsObject = errors.reduce((acc, error) => {
      acc[error.field] = error;
      return acc;
    }, {} as Record<string, ValidationError>);
    const groupedErrors = groupErrorsBySection(errorsObject);
    
    return (
      <Alert status="error" borderRadius="md" mb={4}>
        <AlertIcon />
        <Box w="100%">
          <AlertTitle mb={2}>{title}</AlertTitle>
          <VStack align="stretch" spacing={3}>
            {Object.entries(groupedErrors).map(([section, sectionErrors]) => (
              <Box key={section}>
                <Text fontWeight="semibold" textTransform="capitalize" mb={1}>
                  {section === 'address' && 'Address Information'}
                  {section === 'customer' && 'Customer Details'}
                  {section === 'items' && 'Items & Pricing'}
                  {section === 'payment' && 'Payment Details'}
                  {section === 'terms' && 'Terms & Conditions'}
                  {section === 'other' && 'Other Issues'}
                </Text>
                <List spacing={1} ml={4}>
                  {(sectionErrors as any[]).map((error: any, index: number) => (
                    <ListItem key={index} fontSize="sm">
                      <ListIcon as={FaExclamationTriangle} color="red.500" />
                      {humanizeErrorMessage(error.message)}
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </VStack>
        </Box>
      </Alert>
    );
  }

  // Default summary variant
  return (
    <Alert status="error" borderRadius="md" mb={4}>
      <AlertIcon />
      <Box w="100%">
        <AlertTitle mb={2}>{title}</AlertTitle>
        <AlertDescription>
          <List spacing={1}>
            {visibleErrors.map((error, index) => (
              <ListItem key={index} fontSize="sm">
                <ListIcon as={FaExclamationTriangle} color="red.500" />
                {humanizeErrorMessage(error.message)}
              </ListItem>
            ))}
          </List>
          
          {hasMoreErrors && (
            <Box mt={3}>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                leftIcon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
                onClick={onToggle}
              >
                {isOpen ? 'Show Less' : `Show ${hiddenErrors.length} More Error${hiddenErrors.length > 1 ? 's' : ''}`}
              </Button>
              
              <Collapse in={isOpen} animateOpacity>
                <List spacing={1} mt={2}>
                  {hiddenErrors.map((error, index) => (
                    <ListItem key={index} fontSize="sm">
                      <ListIcon as={FaExclamationTriangle} color="red.500" />
                      {humanizeErrorMessage(error.message)}
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          )}
        </AlertDescription>
      </Box>
    </Alert>
  );
}

interface FieldErrorProps {
  error?: string | null;
  touched?: boolean;
  hasAttemptedSubmit?: boolean;
}

export function FieldError({ error, touched, hasAttemptedSubmit }: FieldErrorProps) {
  if (!error || (!touched && !hasAttemptedSubmit)) {
    return null;
  }

  return (
    <Text color="red.500" fontSize="sm" mt={1}>
      {humanizeErrorMessage(error)}
    </Text>
  );
}

interface FormFieldWrapperProps {
  children: React.ReactNode;
  error?: string | null;
  touched?: boolean;
  hasAttemptedSubmit?: boolean;
  label?: string;
  isRequired?: boolean;
}

export function FormFieldWrapper({
  children,
  error,
  touched,
  hasAttemptedSubmit,
  label,
  isRequired
}: FormFieldWrapperProps) {
  const hasError = error && (touched || hasAttemptedSubmit);

  return (
    <Box>
      {label && (
        <Text mb={1} fontWeight="medium">
          {label}
          {isRequired && <Text as="span" color="red.500" ml={1}>*</Text>}
        </Text>
      )}
      {children}
      <FieldError 
        error={error} 
        touched={touched} 
        hasAttemptedSubmit={hasAttemptedSubmit} 
      />
    </Box>
  );
}
