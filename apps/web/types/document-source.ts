export interface DocumentSource {
  id: string;
  fileId: string;
  fileName: string;
  courseId: string;
  courseName: string;
  pageIndex: number;
  pageContent?: string;
}
