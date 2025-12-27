'use client';

import React, { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import {
  FaFileExport,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
} from 'react-icons/fa';

interface ExportReportingMenuProps {
  orders: any[];
  selectedOrders?: string[];
  onExport: (format: 'csv' | 'excel' | 'pdf', options: ExportOptions) => Promise<void>;
  disabled?: boolean;
}

export interface ExportOptions {
  includeHeaders?: boolean;
  includeCustomerInfo?: boolean;
  includeAddresses?: boolean;
  includeItems?: boolean;
  includeDriverInfo?: boolean;
  includePaymentInfo?: boolean;
  includeNotes?: boolean;
  includeSegments?: boolean;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  fields?: string[];
}

export function ExportReportingMenu({
  orders,
  selectedOrders = [],
  onExport,
  disabled = false,
}: ExportReportingMenuProps) {
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeHeaders: true,
    includeCustomerInfo: true,
    includeAddresses: true,
    includeItems: false,
    includeDriverInfo: true,
    includePaymentInfo: true,
    includeNotes: false,
    includeSegments: false,
  });
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const toast = useToast();

  const ordersToExport = selectedOrders.length > 0
    ? orders.filter(order => selectedOrders.includes(order.id))
    : orders;

  const handleExport = async () => {
    if (ordersToExport.length === 0) {
      toast({
        title: 'No Orders to Export',
        description: 'Please select orders or apply filters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onExport(exportFormat, exportOptions);

      clearInterval(progressInterval);
      setExportProgress(100);

      toast({
        title: 'Export Successful',
        description: `Exported ${ordersToExport.length} order(s) to ${exportFormat.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        onModalClose();
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export orders',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          leftIcon={<FaFileExport />}
          variant="outline"
          isDisabled={disabled || ordersToExport.length === 0}
          bg="#111111"
          color="#FFFFFF"
          borderColor="#333333"
          borderWidth="2px"
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="semibold"
          letterSpacing="0.5px"
          _hover={{ bg: '#1a1a1a', borderColor: '#2563eb' }}
        >
          Export
        </MenuButton>
        <MenuList bg="#111111" borderColor="#333333" borderWidth={2}>
          <MenuItem
            icon={<FaFileCsv />}
            bg="#111111"
            color="#FFFFFF"
            _hover={{ bg: '#1a1a1a' }}
            onClick={() => {
              setExportFormat('csv');
              onModalOpen();
            }}
          >
            Export to CSV
          </MenuItem>
          <MenuItem
            icon={<FaFileExcel />}
            bg="#111111"
            color="#FFFFFF"
            _hover={{ bg: '#1a1a1a' }}
            onClick={() => {
              setExportFormat('excel');
              onModalOpen();
            }}
          >
            Export to Excel
          </MenuItem>
          <MenuItem
            icon={<FaFilePdf />}
            bg="#111111"
            color="#FFFFFF"
            _hover={{ bg: '#1a1a1a' }}
            onClick={() => {
              setExportFormat('pdf');
              onModalOpen();
            }}
          >
            Export to PDF
          </MenuItem>
          <MenuDivider borderColor="#333333" />
          <MenuItem
            icon={<FaDownload />}
            bg="#111111"
            color="#FFFFFF"
            _hover={{ bg: '#1a1a1a' }}
            onClick={() => {
              setExportFormat('csv');
              onExport('csv', exportOptions);
            }}
          >
            Quick Export (CSV)
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Export Configuration Modal */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#000000" borderColor="#333333" borderWidth={2}>
          <ModalHeader color="#FFFFFF" borderBottomWidth={1} borderColor="#333333">
            <HStack spacing={2}>
              {exportFormat === 'csv' && <FaFileCsv />}
              {exportFormat === 'excel' && <FaFileExcel />}
              {exportFormat === 'pdf' && <FaFilePdf />}
              <Text>Export to {exportFormat.toUpperCase()}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="#FFFFFF" />
          
          <ModalBody color="#FFFFFF" py={6}>
            <VStack align="stretch" spacing={6}>
              <Alert status="info" bg="#1a1a1a" borderColor="#333333">
                <AlertIcon />
                <Text fontSize="sm" color="#FFFFFF">
                  Exporting {ordersToExport.length} order(s)
                </Text>
              </Alert>

              {exporting && (
                <VStack spacing={2}>
                  <Text fontSize="sm" color="#9ca3af">Exporting...</Text>
                  <Progress value={exportProgress} w="full" colorScheme="blue" />
                  <Text fontSize="xs" color="#9ca3af">{exportProgress}%</Text>
                </VStack>
              )}

              {!exporting && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md" color="#FFFFFF">
                      Export Options
                    </Text>
                    <CheckboxGroup
                      value={Object.entries(exportOptions)
                        .filter(([key, value]) => value === true && key.startsWith('include'))
                        .map(([key]) => key)}
                      onChange={(values) => {
                        const newOptions = { ...exportOptions };
                        Object.keys(newOptions).forEach(key => {
                          if (key.startsWith('include')) {
                            (newOptions as any)[key] = values.includes(key);
                          }
                        });
                        setExportOptions(newOptions);
                      }}
                    >
                      <VStack align="start" spacing={2}>
                        <Checkbox value="includeHeaders" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Headers</Text>
                        </Checkbox>
                        <Checkbox value="includeCustomerInfo" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Customer Information</Text>
                        </Checkbox>
                        <Checkbox value="includeAddresses" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Addresses</Text>
                        </Checkbox>
                        <Checkbox value="includeItems" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Items</Text>
                        </Checkbox>
                        <Checkbox value="includeDriverInfo" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Driver Information</Text>
                        </Checkbox>
                        <Checkbox value="includePaymentInfo" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Payment Information</Text>
                        </Checkbox>
                        <Checkbox value="includeNotes" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Notes</Text>
                        </Checkbox>
                        <Checkbox value="includeSegments" colorScheme="blue">
                          <Text color="#FFFFFF" fontSize="sm">Include Journey Segments</Text>
                        </Checkbox>
                      </VStack>
                    </CheckboxGroup>
                  </VStack>
                </>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth={1} borderColor="#333333">
            <HStack spacing={3} w="full" justify="space-between">
              <Text fontSize="sm" color="#9ca3af">
                {ordersToExport.length} order(s) will be exported
              </Text>
              <HStack>
                <Button
                  variant="outline"
                  onClick={onModalClose}
                  borderColor="#333333"
                  color="#FFFFFF"
                  _hover={{ bg: '#1a1a1a' }}
                  isDisabled={exporting}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleExport}
                  isLoading={exporting}
                  bg="#2563eb"
                  color="#FFFFFF"
                  _hover={{ bg: '#1d4ed8' }}
                  leftIcon={exportFormat === 'csv' ? <FaFileCsv /> : exportFormat === 'excel' ? <FaFileExcel /> : <FaFilePdf />}
                >
                  Export {exportFormat.toUpperCase()}
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

