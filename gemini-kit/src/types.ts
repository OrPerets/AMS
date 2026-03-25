export type Role = 'Admin' | 'Property Manager' | 'Resident' | 'Worker' | 'Accountant';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  unit?: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  date: string;
  category: string;
}

export interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  description: string;
}
