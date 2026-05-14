export type ClassifiedCategory =
  | 'Electronics'
  | 'Furniture'
  | 'Children'
  | 'Services'
  | 'RealEstate'
  | 'Other'

export const CLASSIFIED_CATEGORY_LABELS: Record<ClassifiedCategory, string> = {
  Electronics: 'Электроника',
  Furniture: 'Мебель',
  Children: 'Детское',
  Services: 'Услуги',
  RealEstate: 'Недвижимость',
  Other: 'Прочее',
}

export const CLASSIFIED_CATEGORY_COLORS: Record<ClassifiedCategory, string> = {
  Electronics: 'bg-sky-50 text-sky-700 border-sky-200',
  Furniture: 'bg-amber-50 text-amber-700 border-amber-200',
  Children: 'bg-pink-50 text-pink-700 border-pink-200',
  Services: 'bg-violet-50 text-violet-700 border-violet-200',
  RealEstate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
}

export const CLASSIFIED_CATEGORY_OPTIONS: { value: ClassifiedCategory; label: string }[] = [
  { value: 'Electronics', label: 'Электроника' },
  { value: 'Furniture', label: 'Мебель' },
  { value: 'Children', label: 'Детское' },
  { value: 'Services', label: 'Услуги' },
  { value: 'RealEstate', label: 'Недвижимость' },
  { value: 'Other', label: 'Прочее' },
]

export interface PhotoItem {
  id: string
  url: string
  orderIndex: number
}

export interface ClassifiedAdListItem {
  id: string
  authorId: string
  title: string
  priceText: string
  category: ClassifiedCategory | string
  coverUrl: string | null
  authorName: string
  isActive: boolean
  viewsCount: number
  createdAt: string
}

export interface ClassifiedAdDetail extends ClassifiedAdListItem {
  description: string
  authorApartment: string | null
  authorAvatarUrl: string | null
  photos: PhotoItem[]
  updatedAt: string
}

export interface ClassifiedsQuery {
  page?: number
  pageSize?: number
  search?: string
  category?: ClassifiedCategory | string
}
