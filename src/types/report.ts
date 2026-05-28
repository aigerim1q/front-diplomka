export interface ReportListItemDto {
  id: string
  year: number
  month: number | null
  title: string | null
  fileUrl: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  beginDate: string
  isScheduled: boolean
  createdAt: string
}

export interface UploadReportForm {
  year: number
  month?: number
  title?: string
  beginDate?: string
  file: File
}
