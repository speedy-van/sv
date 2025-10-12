import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Icon,
  Image,
  Progress,
  Alert,
  AlertIcon,
  SimpleGrid,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Flex,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import {
  FaCamera,
  FaUpload,
  FaImage,
  FaFile,
  FaTrash,
  FaEye,
  FaCheck,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  uploaded: boolean;
  uploading: boolean;
  progress: number;
  error?: string;
  url?: string;
}

interface MediaUploaderProps {
  jobId: string;
  step: string;
  onUploadComplete?: (urls: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  required?: boolean;
}

export default function MediaUploader({
  jobId,
  step,
  onUploadComplete,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  required = false,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const dropBgColor = useColorModeValue('gray.50', 'gray.700');

  const createMediaFile = (file: File): MediaFile => ({
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    uploaded: false,
    uploading: false,
    progress: 0,
  });

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size too large. Maximum size: ${maxFileSize}MB`;
    }

    return null;
  };

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles: MediaFile[] = [];
      const errors: string[] = [];

      Array.from(selectedFiles).forEach((file) => {
        // Check if we're at max files
        if (files.length + newFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          return;
        }

        // Validate file
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
          return;
        }

        // Check for duplicates
        const isDuplicate = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size
        );
        if (isDuplicate) {
          errors.push(`${file.name}: File already selected`);
          return;
        }

        newFiles.push(createMediaFile(file));
      });

      if (errors.length > 0) {
        toast({
          title: 'File Selection Errors',
          description: errors.join('\n'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files, maxFiles, toast, acceptedTypes, maxFileSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const uploadFile = async (mediaFile: MediaFile): Promise<string> => {
    const formData = new FormData();
    formData.append('file', mediaFile.file);
    formData.append('step', step);
    formData.append('jobId', jobId);

    const response = await fetch(`/api/driver/jobs/${jobId}/media`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.url;
  };

  const uploadAllFiles = async () => {
    const filesToUpload = files.filter((f) => !f.uploaded && !f.uploading);
    
    if (filesToUpload.length === 0) {
      toast({
        title: 'No files to upload',
        status: 'info',
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (mediaFile) => {
        // Update file state to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id
              ? { ...f, uploading: true, progress: 0 }
              : f
          )
        );

        try {
          const url = await uploadFile(mediaFile);
          
          // Update file state to uploaded
          setFiles((prev) =>
            prev.map((f) =>
              f.id === mediaFile.id
                ? { ...f, uploaded: true, uploading: false, progress: 100, url }
                : f
            )
          );

          return url;
        } catch (error) {
          // Update file state with error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === mediaFile.id
                ? {
                    ...f,
                    uploading: false,
                    progress: 0,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      toast({
        title: 'Upload Complete',
        description: `${uploadedUrls.length} file(s) uploaded successfully`,
        status: 'success',
        duration: 3000,
      });

      onUploadComplete?.(uploadedUrls);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Some files failed to upload. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'camera');
      fileInputRef.current.click();
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const previewImage = (file: MediaFile) => {
    setPreviewFile(file);
    onOpen();
  };

  const allUploaded = files.length > 0 && files.every((f) => f.uploaded);
  const hasErrors = files.some((f) => f.error);
  const uploadProgress = files.length > 0 
    ? files.reduce((sum, f) => sum + f.progress, 0) / files.length 
    : 0;

  return (
    <Card bg={bgColor} shadow="md" borderRadius="lg">
      <CardBody p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Upload Media
            </Text>
            <Text fontSize="sm" color="gray.600">
              Add photos or documents for this step
              {required && <Text as="span" color="red.500"> (Required)</Text>}
            </Text>
          </Box>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* Upload Area */}
          <Box
            border="2px dashed"
            borderColor={borderColor}
            borderRadius="lg"
            p={8}
            textAlign="center"
            bg={dropBgColor}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'blue.400',
              bg: useColorModeValue('blue.50', 'blue.900'),
            }}
          >
            <VStack spacing={4}>
              <Icon as={FaUpload} boxSize={12} color="gray.400" />
              <VStack spacing={2}>
                <Text fontWeight="semibold">
                  Drop files here or click to select
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Support: {acceptedTypes.join(', ')} (Max {maxFileSize}MB each)
                </Text>
              </VStack>
              
              <HStack spacing={4}>
                <Button
                  leftIcon={<FaCamera />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={openCamera}
                >
                  Take Photo
                </Button>
                <Button
                  leftIcon={<FaFile />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={openFileSelector}
                >
                  Choose Files
                </Button>
              </HStack>
            </VStack>
          </Box>

          {/* Files Grid */}
          {files.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={4}>
                Selected Files ({files.length}/{maxFiles})
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                {files.map((file) => (
                  <Card key={file.id} shadow="sm" borderRadius="lg">
                    <CardBody p={4}>
                      <HStack spacing={4}>
                        {/* File Preview */}
                        <Box flexShrink={0}>
                          {file.preview ? (
                            <Image
                              src={file.preview}
                              alt={file.file.name}
                              boxSize="60px"
                              objectFit="cover"
                              borderRadius="md"
                              cursor="pointer"
                              onClick={() => previewImage(file)}
                            />
                          ) : (
                            <Flex
                              boxSize="60px"
                              bg="gray.100"
                              borderRadius="md"
                              align="center"
                              justify="center"
                            >
                              <Icon as={FaFile} color="gray.400" />
                            </Flex>
                          )}
                        </Box>

                        {/* File Info */}
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {file.file.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                          </Text>
                          
                          {/* Status */}
                          {file.uploaded && (
                            <Badge colorScheme="green" size="sm">
                              <Icon as={FaCheck} mr={1} />
                              Uploaded
                            </Badge>
                          )}
                          
                          {file.uploading && (
                            <HStack spacing={2}>
                              <Spinner size="sm" color="blue.500" />
                              <Progress
                                value={file.progress}
                                size="sm"
                                colorScheme="blue"
                                flex={1}
                              />
                            </HStack>
                          )}
                          
                          {file.error && (
                            <Badge colorScheme="red" size="sm">
                              <Icon as={FaTimes} mr={1} />
                              Error
                            </Badge>
                          )}
                        </VStack>

                        {/* Actions */}
                        <VStack spacing={2}>
                          {file.preview && (
                            <IconButton
                              aria-label="Preview"
                              icon={<FaEye />}
                              size="sm"
                              variant="ghost"
                              onClick={() => previewImage(file)}
                            />
                          )}
                          <IconButton
                            aria-label="Remove"
                            icon={<FaTrash />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeFile(file.id)}
                            isDisabled={file.uploading}
                          />
                        </VStack>
                      </HStack>
                      
                      {file.error && (
                        <Alert status="error" size="sm" mt={2} borderRadius="md">
                          <AlertIcon />
                          <Text fontSize="xs">{file.error}</Text>
                        </Alert>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              {/* Upload Progress */}
              {isUploading && (
                <Box mb={4}>
                  <Text fontSize="sm" mb={2} fontWeight="medium">
                    Uploading... {Math.round(uploadProgress)}%
                  </Text>
                  <Progress 
                    value={uploadProgress} 
                    colorScheme="blue" 
                    borderRadius="full" 
                  />
                </Box>
              )}

              {/* Upload Button */}
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  {files.filter(f => f.uploaded).length} of {files.length} uploaded
                </Text>
                
                <Button
                  colorScheme="blue"
                  onClick={uploadAllFiles}
                  isLoading={isUploading}
                  isDisabled={allUploaded || files.length === 0}
                  leftIcon={<FaUpload />}
                >
                  Upload All Files
                </Button>
              </HStack>
              
              {/* Success Message */}
              {allUploaded && !hasErrors && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  All files uploaded successfully!
                </Alert>
              )}
            </Box>
          )}
        </VStack>
      </CardBody>

      {/* Image Preview Modal */}
      {previewFile && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{previewFile.file.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {previewFile.preview && (
                <Image
                  src={previewFile.preview}
                  alt={previewFile.file.name}
                  w="100%"
                  h="auto"
                  maxH="70vh"
                  objectFit="contain"
                  borderRadius="md"
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Card>
  );
}