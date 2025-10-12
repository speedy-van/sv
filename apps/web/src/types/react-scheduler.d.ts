declare module 'scheduler/tracing' {
  export interface Interaction {
    __count: number;
    id: number;
    name: string;
    timestamp: number;
  }

  export interface Subscriber {
    onInteractionScheduledWorkCompleted: (interaction: Interaction) => void;
    onInteractionTraced: (interaction: Interaction) => void;
    onWorkCanceled: (interactions: Set<Interaction>) => void;
    onWorkScheduled: (interactions: Set<Interaction>) => void;
    onWorkStarted: (interactions: Set<Interaction>) => void;
    onWorkStopped: (interactions: Set<Interaction>) => void;
  }

  export interface SchedulerInteraction {
    __count: number;
    id: number;
    name: string;
    timestamp: number;
  }

  export function unstable_clearYields(): Array<Interaction> | null;
  export function unstable_getCurrentPriorityLevel(): number;
  export function unstable_getFirstCallbackNode(): any;
  export function unstable_immediatePriority(): number;
  export function unstable_next(): any;
  export function unstable_now(): number;
  export function unstable_pauseExecution(): void;
  export function unstable_runWithPriority<T>(
    priorityLevel: number,
    eventHandler: () => T
  ): T;
  export function unstable_scheduleCallback(
    priorityLevel: number,
    callback: any,
    options?: any
  ): any;
  export function unstable_shouldYield(): boolean;
  export function unstable_wrapCallback(callback: any): any;
  export function unstable_yieldValue(value: any): void;

  export const unstable_Profiler: any;
  export const unstable_Tracing: any;
  export const unstable_UserBlockingPriority: number;
  export const unstable_LowPriority: number;
  export const unstable_NormalPriority: number;
  export const unstable_HighPriority: number;
  export const unstable_CriticalPriority: number;
}
