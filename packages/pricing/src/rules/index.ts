import {
  PricingRule,
  PricingCondition,
  PricingAction,
  PricingRequest,
  PricingResult,
} from '../models';

export class PricingRulesEngine {
  private rules: PricingRule[] = [];

  constructor(rules: PricingRule[] = []) {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Apply pricing rules to modify the base pricing result
   */
  applyRules(request: PricingRequest, baseResult: PricingResult): PricingResult {
    let result = { ...baseResult };

    for (const rule of this.rules) {
      if (!rule.isActive) continue;

      if (this.evaluateConditions(rule.conditions, request, result)) {
        result = this.executeActions(rule.actions, result);
      }
    }

    return result;
  }

  /**
   * Add a new pricing rule
   */
  addRule(rule: PricingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a pricing rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Update an existing pricing rule
   */
  updateRule(ruleId: string, updates: Partial<PricingRule>): void {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      this.rules.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Get all active rules
   */
  getActiveRules(): PricingRule[] {
    return this.rules.filter(rule => rule.isActive);
  }

  /**
   * Evaluate if all conditions in a rule are met
   */
  private evaluateConditions(
    conditions: PricingCondition[],
    request: PricingRequest,
    result: PricingResult
  ): boolean {
    return conditions.every(condition => 
      this.evaluateCondition(condition, request, result)
    );
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: PricingCondition,
    request: PricingRequest,
    result: PricingResult
  ): boolean {
    const value = this.getFieldValue(condition.field, request, result);
    
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'ne':
        return value !== condition.value;
      case 'gt':
        return value > condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lt':
        return value < condition.value;
      case 'lte':
        return value <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'nin':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Get field value from request or result
   */
  private getFieldValue(
    field: string,
    request: PricingRequest,
    result: PricingResult
  ): any {
    // Handle nested field access with dot notation
    const fieldParts = field.split('.');
    let value: any = { ...request, ...result };

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Execute pricing actions
   */
  private executeActions(actions: PricingAction[], result: PricingResult): PricingResult {
    let modifiedResult = { ...result };

    for (const action of actions) {
      modifiedResult = this.executeAction(action, modifiedResult);
    }

    // Recalculate total price if individual components were modified
    if (actions.some(action => action.target !== 'totalPrice')) {
      modifiedResult.totalPrice = 
        modifiedResult.basePrice +
        modifiedResult.distancePrice +
        modifiedResult.itemsPrice +
        modifiedResult.timePrice +
        modifiedResult.urgencyPrice;
    }

    return modifiedResult;
  }

  /**
   * Execute a single pricing action
   */
  private executeAction(action: PricingAction, result: PricingResult): PricingResult {
    const currentValue = result[action.target];
    let newValue: number;

    switch (action.type) {
      case 'add':
        newValue = currentValue + action.value;
        break;
      case 'subtract':
        newValue = Math.max(0, currentValue - action.value);
        break;
      case 'multiply':
        newValue = currentValue * action.value;
        break;
      case 'percentage':
        newValue = currentValue * (1 + action.value / 100);
        break;
      case 'set':
        newValue = action.value;
        break;
      default:
        newValue = currentValue;
    }

    return {
      ...result,
      [action.target]: Math.max(0, newValue), // Ensure non-negative values
    };
  }
}

/**
 * Default pricing rules
 */
export const DEFAULT_PRICING_RULES: PricingRule[] = [
  {
    id: 'weekend-surcharge',
    name: 'Weekend Surcharge',
    description: 'Add 20% surcharge for weekend deliveries',
    priority: 100,
    conditions: [
      {
        field: 'scheduledAt',
        operator: 'in',
        value: [0, 6], // Sunday and Saturday
      },
    ],
    actions: [
      {
        type: 'percentage',
        target: 'totalPrice',
        value: 20,
      },
    ],
    isActive: true,
  },
  {
    id: 'bulk-discount',
    name: 'Bulk Item Discount',
    description: 'Apply 10% discount for orders with more than 20 items',
    priority: 90,
    conditions: [
      {
        field: 'items.length',
        operator: 'gt',
        value: 20,
      },
    ],
    actions: [
      {
        type: 'percentage',
        target: 'itemsPrice',
        value: -10,
      },
    ],
    isActive: true,
  },
  {
    id: 'long-distance-surcharge',
    name: 'Long Distance Surcharge',
    description: 'Add $25 surcharge for deliveries over 30km',
    priority: 80,
    conditions: [
      {
        field: 'estimatedDuration',
        operator: 'gt',
        value: 45, // More than 45 minutes (roughly 30km)
      },
    ],
    actions: [
      {
        type: 'add',
        target: 'distancePrice',
        value: 25,
      },
    ],
    isActive: true,
  },
  {
    id: 'minimum-order',
    name: 'Minimum Order Value',
    description: 'Ensure minimum order value of $30',
    priority: 200, // High priority to ensure it runs last
    conditions: [
      {
        field: 'totalPrice',
        operator: 'lt',
        value: 30,
      },
    ],
    actions: [
      {
        type: 'set',
        target: 'totalPrice',
        value: 30,
      },
    ],
    isActive: true,
  },
  {
    id: 'fragile-items-surcharge',
    name: 'Fragile Items Handling Fee',
    description: 'Add $15 fee for orders containing fragile items',
    priority: 70,
    conditions: [
      {
        field: 'items',
        operator: 'in',
        value: ['FRAGILE'], // Check if any item has FRAGILE category
      },
    ],
    actions: [
      {
        type: 'add',
        target: 'itemsPrice',
        value: 15,
      },
    ],
    isActive: true,
  },
];

/**
 * Create a pricing rules engine with default rules
 */
export function createDefaultPricingRulesEngine(): PricingRulesEngine {
  return new PricingRulesEngine(DEFAULT_PRICING_RULES);
}

