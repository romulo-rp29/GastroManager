import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { logger } from '../utils/logger';

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY',
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Create a client with the service role key for admin operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any) => {
  logger.error('Supabase error', { error });
  throw new Error(
    error.message || 'An error occurred while communicating with the database',
  );
};

// Type definitions for database operations
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  patients?: Patient;
  users?: User;
};
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'] & {
  users?: User;
  patients?: Patient;
};
type MedicalRecordInsert = Database['public']['Tables']['medical_records']['Insert'];
type MedicalRecordUpdate = Database['public']['Tables']['medical_records']['Update'];

// Database operations
const db = {
  // User operations
  users: {
    async getById(id: string): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        handleSupabaseError(error);
      }
      
      return data;
    },
    
    async update(id: string, updates: Partial<UserUpdate>): Promise<User> {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
  },
  
  // Patient operations
  patients: {
    async create(patient: PatientInsert): Promise<Patient> {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient as any) // Type assertion to handle Supabase's type requirements
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
    
    async getById(id: string): Promise<Patient | null> {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        handleSupabaseError(error);
      }
      
      return data;
    },
    
    async update(id: string, updates: Partial<PatientUpdate>): Promise<Patient> {
      const { data, error } = await supabase
        .from('patients')
        .update(updates as any) // Type assertion to handle Supabase's type requirements
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
    
    async list(page = 1, pageSize = 10) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .range(from, to);
      
      if (error) handleSupabaseError(error);
      
      return { 
        data: data || [], 
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
  },
  
  // Appointment operations
  appointments: {
    async create(appointment: AppointmentInsert): Promise<Appointment> {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment as any) // Type assertion to handle Supabase's type requirements
        .select('*, patients(*), users:doctors(*)')
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
    
    async getById(id: string): Promise<Appointment | null> {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(*), users:doctors(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        handleSupabaseError(error);
      }
      
      return data;
    },
    
    async update(id: string, updates: Partial<AppointmentUpdate>): Promise<Appointment> {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates as any) // Type assertion to handle Supabase's type requirements
        .eq('id', id)
        .select('*, patients(*), users:doctors(*)')
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
    
    async listByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(*), users:doctors(*)')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date')
        .order('start_time');
      
      if (error) handleSupabaseError(error);
      return data || [];
    },
    
    async listByDoctor(doctorId: string, startDate: string, endDate: string): Promise<Appointment[]> {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(*)')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date')
        .order('start_time');
      
      if (error) handleSupabaseError(error);
      return data || [];
    },
  },
  
  // Medical records operations
  medicalRecords: {
    async create(record: MedicalRecordInsert): Promise<MedicalRecord> {
      const { data, error } = await supabase
        .from('medical_records')
        .insert(record as any) // Type assertion to handle Supabase's type requirements
        .select('*, users:doctors(*), patients(*)')
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
    
    async getByPatientId(patientId: string): Promise<MedicalRecord[]> {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, users:doctors(*)')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      
      if (error) handleSupabaseError(error);
      return data || [];
    },
    
    async getById(id: string): Promise<MedicalRecord | null> {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, users:doctors(*), patients(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        handleSupabaseError(error);
      }
      
      return data;
    },
    
    async update(id: string, updates: Partial<MedicalRecordUpdate>): Promise<MedicalRecord> {
      const { data, error } = await supabase
        .from('medical_records')
        .update(updates as any) // Type assertion to handle Supabase's type requirements
        .eq('id', id)
        .select('*, users:doctors(*), patients(*)')
        .single();
      
      if (error) handleSupabaseError(error);
      return data!;
    },
  },
};

export default db;
