export type UserRole = 'Admin' | 'Property Manager' | 'Resident' | 'Worker' | 'Accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  image: string;
  units: number;
  occupancy: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'General' | 'Security';
  createdAt: string;
  updatedAt: string;
  residentId: string;
  propertyId: string;
  assignedWorkerId?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  type: 'Rent' | 'Utility' | 'Maintenance' | 'Other';
  tenantId: string;
}
