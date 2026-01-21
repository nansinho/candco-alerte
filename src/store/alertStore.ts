import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Alert, AlertType, AlertWithDetails, Building, Floor, Site, Zone } from '../types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AlertState {
  activeAlerts: AlertWithDetails[];
  currentAlert: AlertWithDetails | null;
  isCreatingAlert: boolean;
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;

  // Location selection state
  selectedSite: Site | null;
  selectedBuilding: Building | null;
  selectedFloor: Floor | null;
  selectedZone: Zone | null;

  // Available options for location
  availableBuildings: Building[];
  availableFloors: Floor[];
  availableZones: Zone[];

  // Actions
  createAlert: (params: {
    type: AlertType;
    description?: string;
    latitude?: number;
    longitude?: number;
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    zoneId?: string;
    photos?: string[];
  }) => Promise<{ data: Alert | null; error: Error | null }>;

  fetchActiveAlerts: (siteIds: string[]) => Promise<void>;
  subscribeToAlerts: (siteIds: string[]) => void;
  unsubscribeFromAlerts: () => void;
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
  resolveAlert: (alertId: string, userId: string) => Promise<void>;
  setCurrentAlert: (alert: AlertWithDetails | null) => void;

  // Location selection actions
  setSelectedSite: (site: Site | null) => void;
  fetchBuildings: (siteId: string) => Promise<void>;
  setSelectedBuilding: (building: Building | null) => void;
  fetchFloors: (buildingId: string) => Promise<void>;
  setSelectedFloor: (floor: Floor | null) => void;
  fetchZones: (floorId: string) => Promise<void>;
  setSelectedZone: (zone: Zone | null) => void;
  resetLocationSelection: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  activeAlerts: [],
  currentAlert: null,
  isCreatingAlert: false,
  isLoading: false,
  realtimeChannel: null,

  selectedSite: null,
  selectedBuilding: null,
  selectedFloor: null,
  selectedZone: null,

  availableBuildings: [],
  availableFloors: [],
  availableZones: [],

  createAlert: async (params) => {
    set({ isCreatingAlert: true });

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert({
          type: params.type,
          description: params.description,
          latitude: params.latitude,
          longitude: params.longitude,
          site_id: params.siteId,
          building_id: params.buildingId,
          floor_id: params.floorId,
          zone_id: params.zoneId,
          created_by: userData.user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Upload photos if any
      if (params.photos && params.photos.length > 0 && data) {
        for (const photoUri of params.photos) {
          const fileName = `${data.id}/${Date.now()}.jpg`;
          const response = await fetch(photoUri);
          const blob = await response.blob();

          const { error: uploadError } = await supabase.storage
            .from('alert-photos')
            .upload(fileName, blob);

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage
              .from('alert-photos')
              .getPublicUrl(fileName);

            await supabase.from('alert_photos').insert({
              alert_id: data.id,
              photo_url: publicUrl.publicUrl,
            });
          }
        }
      }

      set({ isCreatingAlert: false });
      return { data, error: null };
    } catch (error) {
      set({ isCreatingAlert: false });
      return { data: null, error: error as Error };
    }
  },

  fetchActiveAlerts: async (siteIds: string[]) => {
    if (siteIds.length === 0) {
      set({ activeAlerts: [] });
      return;
    }

    set({ isLoading: true });

    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        site:sites(*),
        building:buildings(*),
        floor:floors(*),
        zone:zones(*),
        created_by_profile:profiles!alerts_created_by_fkey(*),
        photos:alert_photos(*)
      `)
      .in('site_id', siteIds)
      .in('status', ['active', 'acknowledged'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      set({ isLoading: false });
      return;
    }

    set({ activeAlerts: data as AlertWithDetails[], isLoading: false });
  },

  subscribeToAlerts: (siteIds: string[]) => {
    if (siteIds.length === 0) return;

    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const alert = payload.new as Alert;

          // Check if alert is for one of user's sites
          if (alert.site_id && siteIds.includes(alert.site_id)) {
            // Refresh alerts list
            get().fetchActiveAlerts(siteIds);
          }
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromAlerts: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },

  acknowledgeAlert: async (alertId: string, userId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
    }
  },

  resolveAlert: async (alertId: string, userId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
    }
  },

  setCurrentAlert: (alert) => {
    set({ currentAlert: alert });
  },

  setSelectedSite: (site) => {
    set({
      selectedSite: site,
      selectedBuilding: null,
      selectedFloor: null,
      selectedZone: null,
      availableBuildings: [],
      availableFloors: [],
      availableZones: [],
    });
    if (site) {
      get().fetchBuildings(site.id);
    }
  },

  fetchBuildings: async (siteId: string) => {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('site_id', siteId)
      .order('name');

    if (error) {
      console.error('Error fetching buildings:', error);
      return;
    }

    set({ availableBuildings: data });
  },

  setSelectedBuilding: (building) => {
    set({
      selectedBuilding: building,
      selectedFloor: null,
      selectedZone: null,
      availableFloors: [],
      availableZones: [],
    });
    if (building) {
      get().fetchFloors(building.id);
    }
  },

  fetchFloors: async (buildingId: string) => {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('building_id', buildingId)
      .order('level');

    if (error) {
      console.error('Error fetching floors:', error);
      return;
    }

    set({ availableFloors: data });
  },

  setSelectedFloor: (floor) => {
    set({
      selectedFloor: floor,
      selectedZone: null,
      availableZones: [],
    });
    if (floor) {
      get().fetchZones(floor.id);
    }
  },

  fetchZones: async (floorId: string) => {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('floor_id', floorId)
      .order('name');

    if (error) {
      console.error('Error fetching zones:', error);
      return;
    }

    set({ availableZones: data });
  },

  setSelectedZone: (zone) => {
    set({ selectedZone: zone });
  },

  resetLocationSelection: () => {
    set({
      selectedSite: null,
      selectedBuilding: null,
      selectedFloor: null,
      selectedZone: null,
      availableBuildings: [],
      availableFloors: [],
      availableZones: [],
    });
  },
}));
