/**
 * Base interface for storage clients
 */
export interface IStorageClient {
  /**
   * Generate a signed URL for uploading a file
   */
  getSignedUrlForUpload(params: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength: number;
  }): Promise<string>;

  /**
   * Generate a signed URL for downloading a file
   */
  getSignedUrlForDownload(params: {
    bucket: string;
    key: string;
  }): Promise<string>;

  /**
   * Download a file from storage and return its content
   */
  downloadFile(params: { bucket: string; key: string }): Promise<Buffer>;

  /**
   * Delete a file from storage
   */
  deleteFile(params: { bucket: string; key: string }): Promise<void>;
}
