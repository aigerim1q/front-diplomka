export type NewsStatus = 1 | 2 | 3
// 1 = Draft, 2 = Published, 3 = Archived

export type NewsCategory = 1 | 2 | 3 | 4
// 1 = General, 2 = Maintenance, 3 = Announcement, 4 = Emergency

export type NewsCreatorType = 1 | 2
// 1 = Ksk, 2 = ConstructionCompany

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  1: 'Черновик',
  2: 'Опубликовано',
  3: 'В архиве',
}

export const NEWS_STATUS_COLORS: Record<NewsStatus, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-emerald-100 text-emerald-700',
  3: 'bg-blue-100 text-blue-700',
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  1: 'Общее',
  2: 'Обслуживание',
  3: 'Объявление',
  4: 'Срочное',
}

export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-red-100 text-red-700',
}

export const NEWS_CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = [
  { value: 1, label: 'Общее' },
  { value: 2, label: 'Обслуживание' },
  { value: 3, label: 'Объявление' },
  { value: 4, label: 'Срочное' },
]

export interface NewsListItem {
  id: string
  title: string
  status: NewsStatus
  category: NewsCategory
  creatorType: NewsCreatorType
  isPinned: boolean
  publishDate: string
  expirationDate: string | null
  attachmentsCount: number
}

export interface NewsAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
}

export interface NewsDetail {
  id: string
  title: string
  content: string
  status: NewsStatus
  category: NewsCategory
  creatorType: NewsCreatorType
  isPinned: boolean
  publishDate: string
  expirationDate: string | null
  createdAt: string
  attachments: NewsAttachment[]
  imageUrl?: string | null
}

export interface CreateNewsRequest {
  title: string
  content: string
  category: NewsCategory
  publishDate: string
  expirationDate?: string
  isPinned: boolean
}

export interface UpdateNewsRequest {
  title: string
  content: string
  category: NewsCategory
  publishDate: string
  expirationDate?: string
  isPinned: boolean
}

export interface ChangeNewsStatusRequest {
  newStatus: NewsStatus
}

export interface NewsManageQuery {
  status?: NewsStatus
}
