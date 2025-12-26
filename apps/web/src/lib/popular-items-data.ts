/**
 * Popular Categories and Items for "Most Common Items to Move"
 * 
 * This file defines the logical ordering and structure for the popular items section.
 * Items are organized by category with human-expected ordering (not alphabetical).
 */

export interface PopularCategory {
  id: string;
  name: string;
  icon: string;
  imagePath?: string; // Path to category image (optional, falls back to icon)
  order: number;
  items: string[]; // Array of item IDs from ALL_REMOVAL_ITEMS in logical order
}

/**
 * Popular Categories
 * Displayed as tappable cards at the top of Step 2
 */
export const POPULAR_CATEGORIES: PopularCategory[] = [
  {
    id: 'sofas',
    name: 'Sofas',
    icon: '🛋️',
    imagePath: '/images/items/sofa.png',
    order: 1,
    items: [
      // Ordered by size: 2-seater → 3-seater → 4-seater → L-shaped/sectional → Reclining → Sofa beds
      'chesterfield_sofa_2_seat_antique_tan_55kg',
      'loveseat_2_seat_48inch_jarenie_32kg',
      'loveseat_2_seat_fabric_63inch_38kg',
      'sofa_3_seat_fabric_modern_lestar_48kg',
      'sofa_3_seat_couch_storage_layer_45kg',
      'chesterfield_sofa_4_seat_traditional_75kg',
      'sectional_4_seat_l_shaped_convertible_68kg',
      'sectional_5_seat_129inch_modular_105kg',
      'recliner_sofa_leather_power_edward_85kg',
      'sleeper_sofa_3in1_convertible_howcool_52kg',
    ]
  },
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    icon: '👔',
    imagePath: '/images/items/wardrobe.png',
    order: 2,
    items: [
      // Ordered by size: Single → Double → Triple → Mirrored → Sliding door
      'wardrobe_single_door_space_saving_bedroom_storage_unit_35kg',
      'wardrobe_single_door_modern_luxury_wooden_42kg',
      'wardrobe_double_door_harmony_wood_better_home_68kg',
      'wardrobe_double_door_hodedah_two_drawers_hanging_rod_65kg',
      'wardrobe_triple_door_quarte_modern_3_door_2_drawers_95kg',
      'mirrored_wardrobe_better_home_products_wood_double_sliding_115kg',
      'mirrored_wardrobe_contractors_72_x81_aurora_brushed_nickel_125kg',
      'sliding_door_wardrobe_jubest_48_double_24_5_x80_88kg',
    ]
  },
  {
    id: 'boxes',
    name: 'Boxes',
    icon: '📦',
    imagePath: '/images/items/boxes.png',
    order: 3,
    items: [
      // Ordered by type: Moving boxes → Storage boxes
      'moving_boxes_uboxes_with_handles_10_premium_15kg',
      'moving_boxes_8_best_top_moving_house_boxes_18kg',
      'moving_boxes_uboxes_1_room_economy_kit_15_boxes_22kg',
    ]
  },
  {
    id: 'beds',
    name: 'Beds',
    icon: '🛏️',
    imagePath: '/images/items/bed.png',
    order: 4,
    items: [
      // Ordered by size: Single → Small Double → Double → King → Super King → Bunk
      'single_bed_frame_white_hampshire_18kg',
      'single_bed_frame_sussex_white_22kg',
      'small_double_bed_frame_casa_thistle_pine_25kg',
      'small_double_bed_frame_2_storage_drawers_28kg',
      'double_bed_frame_florence_luxury_35kg',
      'double_bed_frame_cavill_fabric_grey_38kg',
      'king_bed_frame_cavill_fabric_grey_55kg',
      'king_bed_frame_classic_luxe_storage_65kg',
      'super_king_bed_frame_upholstered_6ft_68kg',
      'super_king_bed_frame_sparkford_oak_6ft_85kg',
      'bunk_bed_frame_paddington_kids_white_75kg',
    ]
  },
  {
    id: 'tables',
    name: 'Tables',
    icon: '🪑',
    imagePath: '/images/items/table.png',
    order: 5,
    items: [
      // Ordered by type: Coffee tables → Side/End tables → Console → Dining tables → Desks
      'coffee_table_carved_walnut_45kg',
      'coffee_table_reclaimed_wood_35kg',
      'coffee_table_modern_povison_living_room_25kg',
      'end_table_vintage_round_25kg',
      'side_table_round_2_tier_fantersi_8kg',
      'console_table_50inch_sideboard_buffet_48kg',
      'dining_table_extendable_55inch_65kg',
      'dining_table_expandable_transformer_75kg',
      'round_dining_table_48inch_58kg',
      'office_desk_63_modern_executive_computer_5ft_home_55kg',
    ]
  },
  {
    id: 'televisions',
    name: 'Televisions',
    icon: '📺',
    imagePath: '/images/items/tv.png',
    order: 6,
    items: [
      // Ordered by size: 32" → 40" → 43" → 50" → 55" → 65" → 75" + TV stands
      'television_32inch_smart_led_hd_12kg',
      'television_40inch_vizio_1080p_19kg',
      'television_43inch_fire_tv_4k_21kg',
      'television_50inch_smart_4k_google_25kg',
      'television_55inch_lg_oled_c4_35kg',
      'television_65inch_best_2025_45kg',
      'television_75inch_best_2025_55kg',
      'tv_stand_65inch_enhomee_large_45kg',
      'tv_stand_farmhouse_75inch_plus_65kg',
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    icon: '👕',
    imagePath: '/images/items/clothing.png',
    order: 7,
    items: [
      // Ordered by type: Suitcases → Travel bags → Garment bags → Storage
      'suitcase_luggage_extra_large_33_lightweight_4_wheel_abs_hard_shell_8kg',
      'suitcase_luggage_zimtown_3_piece_nested_spinner_tsa_lock_pink_12kg',
      'travel_luggage_bags_brake_spinner_wheels_14kg',
      'travel_bag_litvyak_duffle_50l_canvas_3kg',
      'garment_bag_60_deluxe_travel_wallybags_2kg',
      'backpack_rucksack_ll_bean_continental_4kg',
      'storage_trunk_signature_design_ashley_kettleby_25kg',
    ]
  },
  {
    id: 'chairs',
    name: 'Chairs',
    icon: '🪑',
    imagePath: '/images/items/chair.png',
    order: 8,
    items: [
      // Ordered by type: Dining chairs → Office chairs → Armchairs → Specialty
      'dining_chairs_vintage_set4_32kg',
      'dining_chairs_faux_leather_set_32kg',
      'dining_chairs_mid_century_set6_48kg',
      'office_chair_felixking_ergonomic_headrest_desk_18kg',
      'office_chair_neo_ergonomic_lumbar_support_adjustable_black_22kg',
      'office_chair_contemporary_leather_executive_husky_28kg',
      'armchair_1_seat_accent_chair_25kg',
      'armchair_rolled_accent_set_2_42kg',
      'rocking_chair_modern_fabric_braea_22kg',
      'pub_chair_vintage_wood_8kg',
    ]
  },
  {
    id: 'power-chairs',
    name: 'Power Chairs',
    icon: '♿',
    imagePath: '/images/items/power-chair.png',
    order: 9,
    items: [
      // Ordered by type: Power recliners → Power sofas → Mobility chairs
      'recliner_sofa_leather_power_edward_85kg',
      'recliner_sofa_set_2_piece_power_125kg',
      'recliner_sofa_3_seat_leather_tufted_95kg',
      'rocking_chair_recliner_comfortable_28kg',
      'wheelchair_jazzy_1450_power_chair_pride_mobility_65kg',
    ]
  },
  {
    id: 'appliances',
    name: 'Kitchen Appliances',
    icon: '🍳',
    imagePath: '/images/items/appliances.png',
    order: 10,
    items: [
      // Ordered by size/importance: Fridge → Washing Machine → Dishwasher → Microwave → Others
      'american_fridge_freezer_bosch_145kg',
      'american_fridge_freezer_size_guide_165kg',
      'mini_fridge_3_2_cuft_freezer_35kg',
      'washing_machine_large_capacity_best_105kg',
      'washing_machine_standard_dimensions_75kg',
      'washing_machine_portable_top_load_1_6cuft_22kg',
      'dishwasher_portable_vs_builtin_65kg',
      'dishwasher_countertop_portable_28kg',
      'microwave_convection_oven_combo_32kg',
      'microwave_oven_kitchen_design_18kg',
    ]
  },
  {
    id: 'decorations',
    name: 'Decorations',
    icon: '🖼️',
    imagePath: '/images/items/decorations.png',
    order: 11,
    items: [
      // Ordered by type: Mirrors → Picture frames → Lamps → Vases/Plants
      'mirror_antique_wall_lights_18kg',
      'mirror_victorian_brass_15kg',
      'picture_frames_gold_set4_8kg',
      'picture_frame_antique_gold_3kg',
      'floor_lamp_brass_twist_15kg',
      'floor_lamp_chinoiserie_12kg',
      'table_lamp_traditional_8kg',
      'vase_ceramic_asian_style_5kg',
      'plant_stand_wooden_multi_tier_18kg',
      'plant_stand_bamboo_37inch_12kg',
    ]
  },
  {
    id: 'books',
    name: 'Books & Shelves',
    icon: '📚',
    imagePath: '/images/items/books.png',
    order: 12,
    items: [
      // Ordered by type: Bookcases → Books
      'bookcase_5_shelf_wooden_standing_42kg',
      'kids_bookshelf_toy_organizer_20kg',
      'toy_organizer_bookshelf_combo_24kg',
      'books_vintage_leather_set_18kg',
      'books_leather_bound_modern_15kg',
    ]
  },
  {
    id: 'custom',
    name: 'Custom Item',
    icon: '✏️',
    imagePath: '/images/items/custom.png',
    order: 13,
    items: [] // Special handling - opens custom item dialog
  }
];

/**
 * Get items for a specific category in logical order
 */
export function getCategoryItems(categoryId: string): string[] {
  const category = POPULAR_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.items || [];
}

/**
 * Get all popular item IDs in order (for use in search/filter ranking)
 */
export function getAllPopularItemIds(): string[] {
  return POPULAR_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .flatMap(cat => cat.items);
}

/**
 * Check if an item is in the popular list
 */
export function isPopularItem(itemId: string): boolean {
  return getAllPopularItemIds().includes(itemId);
}

/**
 * Get the category for a popular item
 */
export function getPopularItemCategory(itemId: string): PopularCategory | undefined {
  return POPULAR_CATEGORIES.find(cat => cat.items.includes(itemId));
}
