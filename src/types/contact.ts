export interface ContactPositionDto {
  id: string
  name: string
  isDefault: boolean
}

export interface ContactDto {
  id: string
  name: string
  description: string
  position: ContactPositionDto
}

export interface ContactGroupDto {
  position: ContactPositionDto
  contacts: ContactDto[]
}

export interface CreateContactPositionRequest {
  name: string
}

export interface CreateContactRequest {
  name: string
  description: string
  contactPositionId: string
}

export interface UpdateContactRequest {
  name: string
  description: string
  contactPositionId: string
}
