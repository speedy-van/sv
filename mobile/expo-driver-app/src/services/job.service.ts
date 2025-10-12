import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';

class JobService {
  async getJobs(): Promise<any> {
    return await apiService.get(API_ENDPOINTS.JOBS);
  }

  async getJobDetail(id: string): Promise<any> {
    return await apiService.get(API_ENDPOINTS.JOB_DETAIL(id));
  }

  async acceptJob(id: string, reason?: string): Promise<any> {
    return await apiService.post(API_ENDPOINTS.ACCEPT_JOB(id), { reason });
  }

  async declineJob(id: string, reason: string): Promise<any> {
    return await apiService.post(API_ENDPOINTS.DECLINE_JOB(id), { reason });
  }

  async updateProgress(id: string, step: string, notes?: string, location?: { latitude: number; longitude: number }): Promise<any> {
    return await apiService.put(API_ENDPOINTS.UPDATE_PROGRESS(id), {
      step,
      notes,
      ...location,
    });
  }
}

export default new JobService();

