export interface SpringApiResponse<T> {
  responseData: T;
  message: string;
  timestamp: string;
}