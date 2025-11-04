'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input,
  Textarea,
  Select,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Image,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  FormControl,
  FormLabel,
  Switch,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUpload, FiPlay, FiEyeOff, FiHeart, FiShare2 } from 'react-icons/fi';
// API utility functions
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return response.json();
};

interface Story {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  isActive: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    viewCount: number;
    likeCount: number;
    shareCount: number;
  };
}

export default function StoryManagement() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'image' | 'video',
    mediaUrl: '',
    isActive: true,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/admin/stories');
      if (response.success) {
        setStories(response.stories || []);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stories',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedStory(null);
    setIsEditing(false);
    setFormData({
      title: '',
      content: '',
      type: 'text',
      mediaUrl: '',
      isActive: true,
    });
    onOpen();
  };

  const handleEdit = (story: Story) => {
    setSelectedStory(story);
    setIsEditing(true);
    setFormData({
      title: story.title,
      content: story.content,
      type: story.type,
      mediaUrl: story.mediaUrl || '',
      isActive: story.isActive,
    });
    onOpen();
  };

  const handleDelete = (story: Story) => {
    setSelectedStory(story);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!selectedStory) return;

    try {
      await apiCall(`/api/admin/stories/${selectedStory.id}`, {
        method: 'DELETE',
      });
      setStories(stories.filter(s => s.id !== selectedStory.id));
      toast({
        title: 'Success',
        description: 'Story deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        status: 'error',
        duration: 5000,
      });
    }
    onDeleteClose();
  };

  const handleSubmit = async () => {
    try {
      const storyData = {
        ...formData,
        publishedAt: formData.isActive ? new Date().toISOString() : null,
      };

      let response;
      if (isEditing && selectedStory) {
        response = await apiCall(`/api/admin/stories/${selectedStory.id}`, {
          method: 'PUT',
          body: JSON.stringify(storyData),
        });
      } else {
        response = await apiCall('/api/admin/stories', {
          method: 'POST',
          body: JSON.stringify(storyData),
        });
      }

      if (response.success) {
        await loadStories();
        onClose();
        toast({
          title: 'Success',
          description: `Story ${isEditing ? 'updated' : 'created'} successfully`,
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} story`,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleToggleActive = async (story: Story) => {
    try {
      await apiCall(`/api/admin/stories/${story.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !story.isActive,
          publishedAt: !story.isActive ? new Date().toISOString() : null,
        }),
      });

      setStories(stories.map(s =>
        s.id === story.id
          ? { ...s, isActive: !s.isActive, publishedAt: !s.isActive ? new Date().toISOString() : s.publishedAt }
          : s
      ));
      toast({
        title: 'Success',
        description: `Story ${!story.isActive ? 'published' : 'unpublished'}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update story status',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, mediaUrl: result.url }));
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading stories...</Text>
      </Box>
    );
  }

  return (
    <Box p={8} bg="gray.800" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="white" mb={2}>
              Story Management
            </Heading>
            <Text color="gray.300">
              Create and manage daily stories for drivers
            </Text>
          </Box>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleCreate}
            size="lg"
          >
            Create Story
          </Button>
        </HStack>

        {/* Stories Table */}
        <Card bg="gray.700" borderColor="gray.600">
          <CardHeader>
            <Heading size="md" color="white">All Stories</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="gray.300">Title</Th>
                  <Th color="gray.300">Type</Th>
                  <Th color="gray.300">Status</Th>
                  <Th color="gray.300" textAlign="center"><FiEye size={16} /></Th>
                  <Th color="gray.300" textAlign="center"><FiHeart size={16} /></Th>
                  <Th color="gray.300" textAlign="center"><FiShare2 size={16} /></Th>
                  <Th color="gray.300">Created</Th>
                  <Th color="gray.300">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stories.map((story) => (
                  <Tr key={story.id}>
                    <Td color="white">{story.title}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          story.type === 'text' ? 'blue' :
                          story.type === 'image' ? 'green' : 'purple'
                        }
                      >
                        {story.type.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={story.isActive ? 'green' : 'gray'}>
                        {story.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td textAlign="center">
                      <Text color="gray.300" fontSize="sm">
                        {story.stats?.viewCount || 0}
                      </Text>
                    </Td>
                    <Td textAlign="center">
                      <Text color="gray.300" fontSize="sm">
                        {story.stats?.likeCount || 0}
                      </Text>
                    </Td>
                    <Td textAlign="center">
                      <Text color="gray.300" fontSize="sm">
                        {story.stats?.shareCount || 0}
                      </Text>
                    </Td>
                    <Td color="gray.300">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Toggle status"
                          icon={story.isActive ? <FiEye /> : <FiEyeOff />}
                          size="sm"
                          colorScheme={story.isActive ? 'green' : 'gray'}
                          onClick={() => handleToggleActive(story)}
                        />
                        <IconButton
                          aria-label="Edit"
                          icon={<FiEdit />}
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleEdit(story)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(story)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {stories.length === 0 && (
              <Text textAlign="center" color="gray.400" py={8}>
                No stories created yet. Click "Create Story" to get started.
              </Text>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">
            {isEditing ? 'Edit Story' : 'Create New Story'}
          </ModalHeader>
          <ModalCloseButton color="white" />

          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="gray.300">Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter story title"
                  bg="gray.700"
                  color="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  bg="gray.700"
                  color="white"
                >
                  <option value="text">Text Only</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Content</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter story content"
                  bg="gray.700"
                  color="white"
                  rows={4}
                />
              </FormControl>

              {(formData.type === 'image' || formData.type === 'video') && (
                <FormControl>
                  <FormLabel color="gray.300">Media URL</FormLabel>
                  <HStack>
                    <Input
                      value={formData.mediaUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                      placeholder="Enter media URL or upload file"
                      bg="gray.700"
                      color="white"
                      flex={1}
                    />
                    <Button
                      leftIcon={<FiUpload />}
                      colorScheme="blue"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Upload
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </HStack>
                  {formData.mediaUrl && (
                    <Box mt={2}>
                      {formData.type === 'image' ? (
                        <Image
                          src={formData.mediaUrl}
                          alt="Preview"
                          maxH="200px"
                          borderRadius="md"
                        />
                      ) : (
                        <Box
                          bg="gray.600"
                          p={4}
                          borderRadius="md"
                          textAlign="center"
                        >
                          <FiPlay size={48} color="#4299E1" />
                          <Text color="gray.300" mt={2}>Video Preview</Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </FormControl>
              )}

              <FormControl display="flex" alignItems="center">
                <FormLabel color="gray.300" mb={0}>
                  Publish immediately
                </FormLabel>
                <Switch
                  isChecked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  colorScheme="blue"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={!formData.title.trim() || !formData.content.trim()}
            >
              {isEditing ? 'Update Story' : 'Create Story'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800">
            <AlertDialogHeader color="white">
              Delete Story
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              Are you sure you want to delete "{selectedStory?.title}"?
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
