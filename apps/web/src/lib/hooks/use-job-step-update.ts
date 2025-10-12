// import { useMutation } from '@tanstack/react-query'; // Commented out - not installed

export function useJobStepUpdate(jobId: string) {
  // Commented out - @tanstack/react-query not installed
  return {
    mutate: async (step: string) => {
      const response = await fetch(`/api/driver/jobs/${jobId}/update-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update job step');
      }

      return response.json();
    },
    isLoading: false,
    error: null,
  };
}