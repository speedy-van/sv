export interface ItemImage {
  id: string;
  path: string;
  category: string;
  name: string;
  description?: string;
  tags: string[];
  dimensions: { width: number; height: number };
  fileSize?: number;
}

export interface ImageSelection {
  itemId: string;
  quantity: number;
  customNotes?: string;
  selectedAt: Date;
}

export interface CategoryInfo {
  name: string;
  displayName: string;
  icon: string;
  count: number;
  color: string;
  description?: string;
}

export interface ImageGalleryState {
  selectedImages: Map<string, ImageSelection>;
  currentCategory: string;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

export interface ImageFilterOptions {
  category?: string;
  searchQuery?: string;
  tags?: string[];
  minSize?: number;
  maxSize?: number;
}

export interface ImageUploadData {
  file: File;
  category: string;
  name: string;
  description?: string;
  tags: string[];
}

export interface ImageGalleryProps {
  onSelectionChange: (selections: Map<string, ImageSelection>) => void;
  initialSelections?: Map<string, ImageSelection>;
  maxSelections?: number;
  allowMultiple?: boolean;
  showQuantity?: boolean;
  showCustomNotes?: boolean;
  className?: string;
}

export interface ImageCardProps {
  image: ItemImage;
  isSelected: boolean;
  onSelect: (imageId: string, quantity?: number) => void;
  onDeselect: (imageId: string) => void;
  showQuantity?: boolean;
  showCustomNotes?: boolean;
  maxQuantity?: number;
  onImageClick?: (image: ItemImage) => void;
}

export interface CategoryFilterProps {
  categories: CategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showCount?: boolean;
}

export interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

export interface SelectionPanelProps {
  selections: Map<string, ImageSelection>;
  images: Map<string, ItemImage>;
  onQuantityChange: (imageId: string, quantity: number) => void;
  onRemove: (imageId: string) => void;
  onCustomNotesChange: (imageId: string, notes: string) => void;
  showCustomNotes?: boolean;
}

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ItemImage | null;
  onSelect?: (imageId: string) => void;
  isSelected?: boolean;
}

export interface UploadZoneProps {
  onUpload: (data: ImageUploadData) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  maxFiles?: number;
  category?: string;
}

// Utility types
export type ImageCategory =
  | 'furniture'
  | 'appliances'
  | 'electronics'
  | 'boxes'
  | 'misc';

export type SortField = 'name' | 'date' | 'size' | 'category';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list' | 'compact';

// API response types
export interface ImageSearchResponse {
  images: ItemImage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ImageUploadResponse {
  success: boolean;
  image?: ItemImage;
  error?: string;
}

// Event types
export interface ImageSelectionEvent {
  type: 'select' | 'deselect' | 'quantity-change' | 'notes-change';
  imageId: string;
  data?: any;
  timestamp: Date;
}
