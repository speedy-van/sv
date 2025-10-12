'use client';

import React from 'react';
import {
  Button,
  ButtonProps,
  Spinner,
  Progress,
  Text,
  Box,
  HStack,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  CircularProgress,
  CircularProgressLabel,
  Skeleton,
  SkeletonText,
  Fade,
  useToast,
} from '@chakra-ui/react';
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { LoadingState } from '@/hooks/useLoadingStates';

interface LoadingButtonProps extends Omit<ButtonProps, 'isLoading'> {
  isLoading?: boolean;
  loadingText?: string;
  canSubmit?: boolean;
  submitCount?: number;
  maxSubmissions?: number;
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  canSubmit = true,
  submitCount = 0,
  maxSubmissions = 3,
  onClick,
  ...props
}: LoadingButtonProps) {
  const isDisabled = props.isDisabled || isLoading || !canSubmit || submitCount >= maxSubmissions;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!canSubmit || isLoading || submitCount >= maxSubmissions) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  let buttonText = children;
  if (isLoading) {
    buttonText = loadingText;
  } else if (submitCount >= maxSubmissions) {
    buttonText = 'Maximum attempts reached';
  } else if (!canSubmit && submitCount > 0) {
    buttonText = 'Please wait...';
  }

  return (
    <Button
      {...props}
      isDisabled={isDisabled}
      isLoading={isLoading}
      loadingText={loadingText}
      onClick={handleClick}
      leftIcon={isLoading ? <Spinner size="sm" /> : props.leftIcon}
    >
      {buttonText}
    </Button>
  );
}

interface ProgressLoadingProps {
  loadingState: LoadingState;
  title?: string;
  showProgress?: boolean;
  showMessage?: boolean;
  variant?: 'linear' | 'circular';
}

export function ProgressLoading({
  loadingState,
  title = 'Loading...',
  showProgress = true,
  showMessage = true,
  variant = 'linear'
}: ProgressLoadingProps) {
  if (!loadingState.isLoading) {
    return null;
  }

  const hasProgress = typeof loadingState.progress === 'number';
  const progress = loadingState.progress || 0;

  if (variant === 'circular') {
    return (
      <VStack spacing={4} align="center" py={4}>
        <CircularProgress 
          value={hasProgress ? progress : undefined} 
          isIndeterminate={!hasProgress}
          color="blue.400"
          size="60px"
        >
          {hasProgress && (
            <CircularProgressLabel>{Math.round(progress)}%</CircularProgressLabel>
          )}
        </CircularProgress>
        
        <VStack spacing={1} align="center">
          <Text fontWeight="medium">{title}</Text>
          {showMessage && loadingState.message && (
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {loadingState.message}
            </Text>
          )}
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      <HStack justify="space-between">
        <Text fontWeight="medium">{title}</Text>
        {hasProgress && showProgress && (
          <Text fontSize="sm" color="gray.600">
            {Math.round(progress)}%
          </Text>
        )}
      </HStack>
      
      <Progress
        value={hasProgress ? progress : undefined}
        isIndeterminate={!hasProgress}
        colorScheme="blue"
        size="sm"
        borderRadius="md"
      />
      
      {showMessage && loadingState.message && (
        <Text fontSize="sm" color="gray.600">
          {loadingState.message}
        </Text>
      )}
    </VStack>
  );
}

interface InlineLoadingProps {
  isLoading: boolean;
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
}

export function InlineLoading({
  isLoading,
  message = 'Loading...',
  size = 'sm',
  color = 'blue.500'
}: InlineLoadingProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <Fade in={isLoading}>
      <HStack spacing={2} color={color}>
        <Spinner size={size} />
        <Text fontSize={size}>{message}</Text>
      </HStack>
    </Fade>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  progress,
  children
}: LoadingOverlayProps) {
  return (
    <Box position="relative">
      {children}
      
      {isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255, 255, 255, 0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={10}
          borderRadius="md"
        >
          <VStack spacing={3}>
            <Spinner size="lg" color="blue.500" />
            <Text fontWeight="medium">{message}</Text>
            {typeof progress === 'number' && (
              <Progress
                value={progress}
                width="200px"
                colorScheme="blue"
                size="sm"
                borderRadius="md"
              />
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

interface FormSectionSkeletonProps {
  lines?: number;
  height?: string;
}

export function FormSectionSkeleton({ lines = 3, height = "20px" }: FormSectionSkeletonProps) {
  return (
    <VStack spacing={4} align="stretch">
      {Array.from({ length: lines }, (_, i) => (
        <Box key={i}>
          <Skeleton height="16px" width="120px" mb={2} />
          <Skeleton height={height} />
        </Box>
      ))}
    </VStack>
  );
}

interface SubmissionFeedbackProps {
  isSubmitting: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  successMessage?: string;
  errorMessage?: string;
  submitCount?: number;
  maxSubmissions?: number;
}

export function SubmissionFeedback({
  isSubmitting,
  isSuccess = false,
  isError = false,
  successMessage = 'Successfully submitted!',
  errorMessage = 'Submission failed. Please try again.',
  submitCount = 0,
  maxSubmissions = 3
}: SubmissionFeedbackProps) {
  const toast = useToast();

  // Show success toast
  React.useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Success',
        description: successMessage,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isSuccess, successMessage, toast]);

  if (isSubmitting) {
    return (
      <Alert status="info" borderRadius="md">
        <Spinner size="sm" mr={3} />
        <AlertDescription>
          Submitting your request... Please do not refresh or navigate away.
        </AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertDescription>{errorMessage}</AlertDescription>
          {submitCount >= maxSubmissions && (
            <Text fontSize="sm" mt={1} color="red.600">
              Maximum submission attempts reached. Please contact support if the issue persists.
            </Text>
          )}
        </Box>
      </Alert>
    );
  }

  if (isSuccess) {
    return (
      <Alert status="success" borderRadius="md">
        <AlertIcon />
        <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface SmartLoadingButtonProps extends LoadingButtonProps {
  asyncAction: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function SmartLoadingButton({
  asyncAction,
  successMessage = 'Action completed successfully!',
  errorMessage = 'Action failed. Please try again.',
  onSuccess,
  onError,
  children,
  ...props
}: SmartLoadingButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [submitCount, setSubmitCount] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number | null>(null);
  const toast = useToast();

  const canSubmit = React.useMemo(() => {
    if (isLoading || submitCount >= 3) return false;
    if (lastSubmitTime && Date.now() - lastSubmitTime < 2000) return false;
    return true;
  }, [isLoading, submitCount, lastSubmitTime]);

  const handleClick = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setSubmitCount(prev => prev + 1);
    setLastSubmitTime(Date.now());

    try {
      await asyncAction();
      
      toast({
        title: 'Success',
        description: successMessage,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Action failed:', error);
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingButton
      {...props}
      isLoading={isLoading}
      canSubmit={canSubmit}
      submitCount={submitCount}
      onClick={handleClick}
    >
      {children}
    </LoadingButton>
  );
}
