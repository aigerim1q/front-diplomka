export type WorkerSpecialization = 1 | 2 | 3 | 4 | 5 | 99

export const SPECIALIZATION_LABELS: Record<WorkerSpecialization, string> = {
  1: 'Сантехника',
  2: 'Электрика',
  3: 'Уборка',
  4: 'Плотницкие работы',
  5: 'Слесарные работы',
  99: 'Прочее',
}

export const SPECIALIZATION_OPTIONS: { value: WorkerSpecialization; label: string }[] = [
  { value: 1, label: 'Сантехника' },
  { value: 2, label: 'Электрика' },
  { value: 3, label: 'Уборка' },
  { value: 4, label: 'Плотницкие работы' },
  { value: 5, label: 'Слесарные работы' },
  { value: 99, label: 'Прочее' },
]

// 1 = Available (свободен), 2 = Busy (занят)
export type WorkerAvailabilityStatus = 1 | 2

export interface Worker {
  id: string
  userId: string
  fullName: string
  phoneNumber: string
  specialization: WorkerSpecialization
  specializationName: string
  isActive: boolean
  createdAt: string
  status: WorkerAvailabilityStatus
  availableInMinutes: number | null
  availabilityComment: string | null
  availabilityLabel: string
}

export interface CreateWorkerRequest {
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  specialization: WorkerSpecialization
}

export interface CreateWorkerResponse {
  workerId: string
}

export interface UpdateWorkerRequest {
  firstName: string
  lastName: string
  phoneNumber: string
  specialization: WorkerSpecialization
}

export interface WorkersQuery {
  specialization?: WorkerSpecialization
}
