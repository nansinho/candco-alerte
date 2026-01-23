export type AlertType = 'fire' | 'accident' | 'medical' | 'other';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'cancelled';
export type UserRole = 'super_admin' | 'admin' | 'site_manager' | 'sst' | 'employee';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          updated_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          check_in_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          check_in_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          check_in_enabled?: boolean;
          updated_at?: string;
        };
      };
      buildings: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      floors: {
        Row: {
          id: string;
          building_id: string;
          name: string;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          building_id: string;
          name: string;
          level: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          building_id?: string;
          name?: string;
          level?: number;
          updated_at?: string;
        };
      };
      zones: {
        Row: {
          id: string;
          floor_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          floor_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          floor_id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          organization_id: string | null;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          organization_id?: string | null;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          organization_id?: string | null;
          push_token?: string | null;
          updated_at?: string;
        };
      };
      user_sites: {
        Row: {
          id: string;
          user_id: string;
          site_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          site_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          site_id?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: AlertType;
          status: AlertStatus;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          site_id: string | null;
          building_id: string | null;
          floor_id: string | null;
          zone_id: string | null;
          created_by: string;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: AlertType;
          status?: AlertStatus;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          site_id?: string | null;
          building_id?: string | null;
          floor_id?: string | null;
          zone_id?: string | null;
          created_by: string;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: AlertType;
          status?: AlertStatus;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          site_id?: string | null;
          building_id?: string | null;
          floor_id?: string | null;
          zone_id?: string | null;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
      alert_photos: {
        Row: {
          id: string;
          alert_id: string;
          photo_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          photo_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          photo_url?: string;
        };
      };
      alert_messages: {
        Row: {
          id: string;
          alert_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          user_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          user_id?: string;
          message?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          site_id: string;
          checked_in_at: string;
          checked_out_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          site_id: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          site_id?: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
        };
      };
    };
  };
}

// Helper types for easier usage
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];
export type Building = Database['public']['Tables']['buildings']['Row'];
export type Floor = Database['public']['Tables']['floors']['Row'];
export type Zone = Database['public']['Tables']['zones']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserSite = Database['public']['Tables']['user_sites']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type AlertPhoto = Database['public']['Tables']['alert_photos']['Row'];
export type AlertMessage = Database['public']['Tables']['alert_messages']['Row'];
export type CheckIn = Database['public']['Tables']['check_ins']['Row'];

// Extended types with relations
export type AlertWithDetails = Alert & {
  site?: Site;
  building?: Building;
  floor?: Floor;
  zone?: Zone;
  created_by_profile?: Profile;
  photos?: AlertPhoto[];
  messages?: AlertMessage[];
};
