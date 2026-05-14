import { api } from '@/lib/axios'
import {
  ContactPositionDto,
  ContactDto,
  ContactGroupDto,
  CreateContactPositionRequest,
  CreateContactRequest,
  UpdateContactRequest,
} from '@/types'

export const kskContactsApi = {
  // Positions
  getPositions: () =>
    api.get<ContactPositionDto[]>('/api/ksk/contact-positions'),

  createPosition: (data: CreateContactPositionRequest) =>
    api.post<ContactPositionDto>('/api/ksk/contact-positions', data),

  deletePosition: (id: string) =>
    api.delete(`/api/ksk/contact-positions/${id}`),

  // Contacts
  getContacts: () =>
    api.get<ContactGroupDto[]>('/api/ksk/contacts'),

  createContact: (data: CreateContactRequest) =>
    api.post<ContactDto>('/api/ksk/contacts', data),

  updateContact: (id: string, data: UpdateContactRequest) =>
    api.put(`/api/ksk/contacts/${id}`, data),

  deleteContact: (id: string) =>
    api.delete(`/api/ksk/contacts/${id}`),
}
