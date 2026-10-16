export type ItemStatus = 'Active' | 'Returned' | 'Archived'
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired'

export interface Category {
  id: number
  name: string
}

export interface Item {
  id: number
  name: string
  description: string
  location: string
  category: string
  status: ItemStatus
  foundOn: string
  createdAt: string
  statusChangedAt: string
  photos: { id: number }[]
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface Me {
  id: number
  name: string
  email: string
  isAdmin: boolean
}

export interface RecoveryRequest {
  id: number
  itemId: number
  itemName: string
  status: RequestStatus
  justification: string
  adminNotes: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  pickupCodeAvailable: boolean
}

export interface AdminRequest extends RecoveryRequest {
  userId: number
  userName: string
  userEmail: string
}

export interface QRCode {
  id: number
  guid: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  isAdmin: boolean
}

export interface Activity {
  id: number
  userId: number | null
  type: string
  description: string
  createdAt: string
}
