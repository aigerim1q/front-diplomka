import { api } from '@/lib/axios'
import {
  NewsListItem,
  NewsDetail,
  CreateNewsRequest,
  UpdateNewsRequest,
  ChangeNewsStatusRequest,
  NewsManageQuery,
} from '@/types'

const toNewsFormData = (data: CreateNewsRequest, image?: File | null): FormData => {
  const fd = new FormData()
  fd.append('Title', data.title)
  fd.append('Content', data.content)
  fd.append('Category', String(data.category))
  fd.append('PublishDate', data.publishDate)
  fd.append('IsPinned', String(data.isPinned))
  if (data.expirationDate) fd.append('ExpirationDate', data.expirationDate)
  if (image) fd.append('Image', image)
  return fd
}

export const newsApi = {
  getManage: (params?: NewsManageQuery) =>
    api.get<NewsListItem[]>('/api/news/manage', { params }),

  getById: (id: string) =>
    api.get<NewsDetail>(`/api/news/${id}`),

  create: (data: CreateNewsRequest, image?: File | null) =>
    api.post<string>('/api/news', toNewsFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: UpdateNewsRequest) =>
    api.put(`/api/news/${id}`, data),

  changeStatus: (id: string, data: ChangeNewsStatusRequest) =>
    api.patch(`/api/news/${id}/status`, data),
}