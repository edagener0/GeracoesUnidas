export type UserType = 'elderly' | 'student';
export type StudentType = 'national' | 'international' | 'erasmus';
export type ApplicationStatus = 'pending' | 'accepted' | 'awaiting_payment' | 'rejected';
export type RentalStatus = 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface RoomService {
  enabled: boolean;
  price: number;
}

export interface CustomService {
  name: string;
  price: number;
}

export interface RoomServices {
  room_cleaning: RoomService;
  lunch: RoomService;
  dinner: RoomService;
  custom_services: CustomService[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_type: UserType;
          full_name: string;
          age: number;
          bio: string;
          location: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type: UserType;
          full_name: string;
          age: number;
          bio?: string;
          location: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_type?: UserType;
          full_name?: string;
          age?: number;
          bio?: string;
          location?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      elderly_profiles: {
        Row: {
          id: string;
          gender: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          gender: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gender?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_profiles: {
        Row: {
          id: string;
          university: string;
          course: string;
          student_type: StudentType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          university: string;
          course: string;
          student_type?: StudentType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university?: string;
          course?: string;
          student_type?: StudentType;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          elderly_id: string;
          title: string;
          description: string;
          room_type: string;
          monthly_price: number;
          location: string;
          address: string;
          is_available: boolean;
          payment_methods: string[];
          services: RoomServices;
          total_monthly_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          elderly_id: string;
          title: string;
          description: string;
          room_type: string;
          monthly_price: number;
          location: string;
          address: string;
          is_available?: boolean;
          payment_methods?: string[];
          services?: RoomServices;
          total_monthly_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          elderly_id?: string;
          title?: string;
          description?: string;
          room_type?: string;
          monthly_price?: number;
          location?: string;
          address?: string;
          is_available?: boolean;
          payment_methods?: string[];
          services?: RoomServices;
          total_monthly_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_photos: {
        Row: {
          id: string;
          room_id: string;
          photo_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          photo_url: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          photo_url?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      room_applications: {
        Row: {
          id: string;
          room_id: string;
          student_id: string;
          status: ApplicationStatus;
          message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          student_id: string;
          status?: ApplicationStatus;
          message?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          student_id?: string;
          status?: ApplicationStatus;
          message?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          student_id: string;
          room_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          room_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          room_id?: string;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          room_id: string;
          elderly_id: string;
          student_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          elderly_id: string;
          student_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          elderly_id?: string;
          student_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          room_id: string;
          student_id: string;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          student_id: string;
          rating: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          student_id?: string;
          rating?: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rentals: {
        Row: {
          id: string;
          room_id: string;
          student_id: string;
          elderly_id: string;
          monthly_amount: number;
          start_date: string;
          end_date: string | null;
          status: RentalStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          student_id: string;
          elderly_id: string;
          monthly_amount: number;
          start_date: string;
          end_date?: string | null;
          status?: RentalStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          student_id?: string;
          elderly_id?: string;
          monthly_amount?: number;
          start_date?: string;
          end_date?: string | null;
          status?: RentalStatus;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          rental_id: string;
          amount: number;
          platform_fee: number;
          elderly_amount: number;
          payment_date: string | null;
          due_date: string;
          status: PaymentStatus;
          stripe_payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rental_id: string;
          amount: number;
          platform_fee: number;
          elderly_amount: number;
          payment_date?: string | null;
          due_date: string;
          status?: PaymentStatus;
          stripe_payment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rental_id?: string;
          amount?: number;
          platform_fee?: number;
          elderly_amount?: number;
          payment_date?: string | null;
          due_date?: string;
          status?: PaymentStatus;
          stripe_payment_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
