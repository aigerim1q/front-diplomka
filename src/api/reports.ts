import { api } from '@/lib/axios'
import { ReportListItemDto, UploadReportForm } from '@/types'

export const reportsApi = {
  getAll: (params?: { year?: number; month?: number }) =>
    api.get<ReportListItemDto[]>('/api/ksk/reports', { params }),

  getYears: () =>
    api.get<number[]>('/api/ksk/reports/years'),

  upload: (data: UploadReportForm) => {
    const fd = new FormData()
    fd.append('Year', String(data.year))
    if (data.month) fd.append('Month', String(data.month))
    if (data.title) fd.append('Title', data.title)
    if (data.beginDate) fd.append('BeginDate', data.beginDate)
    fd.append('File', data.file)
    return api.post<{ id: string }>('/api/ksk/reports', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: string) =>
    api.delete(`/api/ksk/reports/${id}`),
}
