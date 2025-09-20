<!-- path: store/gpsStore.ts -->
```typescript
'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Location } from '@/types';

export interface GpsState {
  location: Location | null;
  gpsError: string | null;
  gpsLoading: boolean;
  accuracy: number | null;
  speed: number | null;
  permissionState: PermissionState | null;
  source: 'network' | 'gps' | null;
  isGeolocationEnabled: boolean;
}

export interface GpsActions {
  setGpsStatus: (
    status: Partial<Omit<GpsState, 'isGeolocationEnabled'>>
  ) => void;
  requestLocation: () => void;
  enableGeolocation: (enable: boolean) => void;
  resetGps: () => void;
}

const initialState: GpsState = {
  location: null,
  gpsError: null,
  gpsLoading: true,
  accuracy: null,
  speed: null,
  permissionState: null,
  source: null,
  isGeolocationEnabled: false,
};

export const useGpsStore = create<GpsState & GpsActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setGpsStatus: (status) => set(status),
      enableGeolocation: (enable) => set({ isGeolocationEnabled: enable }),
      requestLocation: () =>
        console.warn('requestLocation has not been initialized.'),
      resetGps: () => set(initialState),
    }),
    { name: 'GpsStore' }
  )
);

// FIXED: Individual atomic selectors instead of object-returning functions
export const useGpsLocation = () => useGpsStore((state) => state.location);
export const useGpsError = () => useGpsStore((state) => state.gpsError);
export const useGpsLoading = () => useGpsStore((state) => state.gpsLoading);
export const useGpsAccuracy = () => useGpsStore((state) => state.accuracy);
export const useGpsSpeed = () => useGpsStore((state) => state.speed);
export const useGpsPermissionState = () => useGpsStore((state) => state.permissionState);
export const useGpsSource = () => useGpsStore((state) => state.source);
export const useIsGeolocationEnabled = () => useGpsStore((state) => state.isGeolocationEnabled);

// Individual action selectors
export const useSetGpsStatus = () => useGpsStore((state) => state.setGpsStatus);
export const useRequestLocation = () => useGpsStore((state) => state.requestLocation);
export const useEnableGeolocation = () => useGpsStore((state) => state.enableGeolocation);
export const useResetGps = () => useGpsStore((state) => state.resetGps);

```

<!-- path: store/uiStore.ts -->
```typescript
// store/uiStore.ts
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MainTab } from '@/types/tabs';
import { Route } from '@/types';

interface UIState {
  activeMainTab: MainTab;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedRouteForView: Route | null;
  searchTerm: string;
  filterStatus: Route['status'] | null;
  allowLocationUpdate: boolean;
  isDragMode: boolean;
  isWakeLockEnabled: boolean;
}

interface UIActions {
  setActiveMainTab: (tab: MainTab) => void;
  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  setSelectedRouteForView: (route: Route | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: Route['status'] | null) => void;
  clearFilters: () => void;
  setAllowLocationUpdate: (allow: boolean) => void;
  toggleDragMode: () => void;
  resetUI: () => void;
  toggleWakeLock: () => void;
}

const initialState: UIState = {
  activeMainTab: 'map',
  sidebarCollapsed: true,
  mobileSidebarOpen: false,
  selectedRouteForView: null,
  searchTerm: '',
  filterStatus: null,
  allowLocationUpdate: true,
  isDragMode: true,
  isWakeLockEnabled: false,
};

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set) => ({
      ...initialState,

      // Actions
      setActiveMainTab: (tab) => set({ activeMainTab: tab }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (isOpen) => set({ mobileSidebarOpen: isOpen }),
      setSelectedRouteForView: (route) => set({ selectedRouteForView: route }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      clearFilters: () => set({ searchTerm: '', filterStatus: null }),
      setAllowLocationUpdate: (allow) => set({ allowLocationUpdate: allow }),
      toggleDragMode: () => set((state) => ({ isDragMode: !state.isDragMode })),
      toggleWakeLock: () =>
        set((state) => ({ isWakeLockEnabled: !state.isWakeLockEnabled })),

      resetUI: () => set(initialState),
    }),
    { name: 'UIStore' }
  )
);

// Individual atomic selectors
export const useActiveMainTab = () =>
  useUIStore((state) => state.activeMainTab);
export const useSidebarCollapsed = () =>
  useUIStore((state) => state.sidebarCollapsed);
export const useMobileSidebarOpen = () =>
  useUIStore((state) => state.mobileSidebarOpen);
export const useSelectedRouteForView = () =>
  useUIStore((state) => state.selectedRouteForView);
export const useSearchTerm = () => useUIStore((state) => state.searchTerm);
export const useFilterStatus = () => useUIStore((state) => state.filterStatus);
export const useAllowLocationUpdate = () =>
  useUIStore((state) => state.allowLocationUpdate);
export const useIsDragMode = () => useUIStore((state) => state.isDragMode);
export const useSetActiveMainTab = () =>
  useUIStore((state) => state.setActiveMainTab);
export const useToggleSidebarCollapsed = () =>
  useUIStore((state) => state.toggleSidebarCollapsed);
export const useSetMobileSidebarOpen = () =>
  useUIStore((state) => state.setMobileSidebarOpen);
export const useSetSelectedRouteForView = () =>
  useUIStore((state) => state.setSelectedRouteForView);
export const useSetSearchTerm = () =>
  useUIStore((state) => state.setSearchTerm);
export const useSetFilterStatus = () =>
  useUIStore((state) => state.setFilterStatus);
export const useClearFilters = () => useUIStore((state) => state.clearFilters);
export const useSetAllowLocationUpdate = () =>
  useUIStore((state) => state.setAllowLocationUpdate);
export const useToggleDragMode = () =>
  useUIStore((state) => state.toggleDragMode);
export const useResetUI = () => useUIStore((state) => state.resetUI);
export const useIsWakeLockEnabled = () =>
  useUIStore((state) => state.isWakeLockEnabled);
export const useToggleWakeLock = () =>
  useUIStore((state) => state.toggleWakeLock);

```

<!-- path: store/authStore.ts -->
```typescript
'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AuthState {
  // Local auth state
  isInitialized: boolean;
  lastLoginTime: Date | null;

  // User preferences (persisted)
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSave: boolean;
    mapDefaultZoom: number;
    defaultMapType: 'street' | 'satellite' | 'terrain';
  };

  // Temporary session data (not persisted)
  sessionData: {
    loginAttempts: number;
    lastActivity: Date | null;
    deviceInfo?: {
      userAgent: string;
      screenResolution: string;
    };
  };
}

interface AuthActions {
  // Initialization
  initializeAuth: () => void;
  setLastLoginTime: (time: Date) => void;

  // Preferences
  updatePreferences: (preferences: Partial<AuthState['preferences']>) => void;
  resetPreferences: () => void;

  // Session management
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  updateLastActivity: () => void;
  setDeviceInfo: (info: AuthState['sessionData']['deviceInfo']) => void;

  // Cleanup
  clearAuthData: () => void;
}

const defaultPreferences: AuthState['preferences'] = {
  theme: 'system',
  notifications: true,
  autoSave: true,
  mapDefaultZoom: 13,
  defaultMapType: 'street',
};

const initialSessionData: AuthState['sessionData'] = {
  loginAttempts: 0,
  lastActivity: null,
  deviceInfo: undefined,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isInitialized: false,
        lastLoginTime: null,
        preferences: defaultPreferences,
        sessionData: initialSessionData,

        // Actions
        initializeAuth: () => {
          set({
            isInitialized: true,
            sessionData: {
              ...get().sessionData,
              lastActivity: new Date(),
            }
          });
        },

        setLastLoginTime: (time: Date) => {
          set({ lastLoginTime: time });
        },

        updatePreferences: (newPreferences) => {
          set({
            preferences: {
              ...get().preferences,
              ...newPreferences,
            },
          });
        },

        resetPreferences: () => {
          set({ preferences: defaultPreferences });
        },

        incrementLoginAttempts: () => {
          set({
            sessionData: {
              ...get().sessionData,
              loginAttempts: get().sessionData.loginAttempts + 1,
            },
          });
        },

        resetLoginAttempts: () => {
          set({
            sessionData: {
              ...get().sessionData,
              loginAttempts: 0,
            },
          });
        },

        updateLastActivity: () => {
          set({
            sessionData: {
              ...get().sessionData,
              lastActivity: new Date(),
            },
          });
        },

        setDeviceInfo: (info) => {
          set({
            sessionData: {
              ...get().sessionData,
              deviceInfo: info,
            },
          });
        },

        clearAuthData: () => {
          set({
            isInitialized: false,
            lastLoginTime: null,
            preferences: defaultPreferences,
            sessionData: initialSessionData,
          });
        },
      }),
      {
        name: 'route-survey-auth',
        partialize: (state) => ({
          // Only persist these fields
          lastLoginTime: state.lastLoginTime,
          preferences: state.preferences,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Simple selectors for better performance - no useStore with useCallback
export const useAuthPreferences = () => useAuthStore((state) => state.preferences);
export const useUpdatePreferences = () => useAuthStore((state) => state.updatePreferences);
export const useAuthSession = () => useAuthStore((state) => state.sessionData);

// Fixed: Direct selectors instead of useStore with useCallback
export const useAuthActions = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setLastLoginTime = useAuthStore((state) => state.setLastLoginTime);
  const incrementLoginAttempts = useAuthStore((state) => state.incrementLoginAttempts);
  const resetLoginAttempts = useAuthStore((state) => state.resetLoginAttempts);
  const updateLastActivity = useAuthStore((state) => state.updateLastActivity);
  const setDeviceInfo = useAuthStore((state) => state.setDeviceInfo);
  const clearAuthData = useAuthStore((state) => state.clearAuthData);

  return {
    initializeAuth,
    setLastLoginTime,
    incrementLoginAttempts,
    resetLoginAttempts,
    updateLastActivity,
    setDeviceInfo,
    clearAuthData,
  };
};
```

<!-- path: store/uiStore.test.ts -->
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';
import { Route } from '@/types';

// Get the initial state from the store definition for resetting
const initialState = useUIStore.getState();

describe('useUIStore', () => {

  // Reset the store to its default state before each test
  beforeEach(() => {
    useUIStore.setState(initialState);
  });

  it('should have the correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.activeMainTab).toBe('map');
    expect(state.sidebarCollapsed).toBe(true);
    expect(state.mobileSidebarOpen).toBe(false);
    expect(state.searchTerm).toBe('');
    expect(state.filterStatus).toBeNull();
  });

  it('should set the active main tab', () => {
    const { setActiveMainTab } = useUIStore.getState();
    setActiveMainTab('routes');

    const state = useUIStore.getState();
    expect(state.activeMainTab).toBe('routes');
  });

  it('should toggle the desktop sidebar from collapsed to open', () => {
    const { toggleSidebarCollapsed } = useUIStore.getState();

    // Initial state is collapsed (true)
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    toggleSidebarCollapsed();

    const state = useUIStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
  });

  it('should set the mobile sidebar visibility', () => {
    const { setMobileSidebarOpen } = useUIStore.getState();

    setMobileSidebarOpen(true);

    const state = useUIStore.getState();
    expect(state.mobileSidebarOpen).toBe(true);
  });

  it('should update the search term', () => {
    const { setSearchTerm } = useUIStore.getState();

    setSearchTerm('Fiber');

    const state = useUIStore.getState();
    expect(state.searchTerm).toBe('Fiber');
  });

  it('should set the filter status', () => {
    const { setFilterStatus } = useUIStore.getState();

    setFilterStatus('completed');

    const state = useUIStore.getState();
    expect(state.filterStatus).toBe('completed');
  });

  it('should clear all filters and search term', () => {
    const { setSearchTerm, setFilterStatus, clearFilters } = useUIStore.getState();

    // First, set some filters
    setSearchTerm('Test');
    setFilterStatus('active');

    let state = useUIStore.getState();
    expect(state.searchTerm).toBe('Test');
    expect(state.filterStatus).toBe('active');

    // Now, clear them
    clearFilters();

    state = useUIStore.getState();
    expect(state.searchTerm).toBe('');
    expect(state.filterStatus).toBeNull();
  });
});
```

<!-- path: store/surveyStore.ts -->
```typescript
// store/surveyStore.ts
"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Route, SurveyPoint, Location } from "@/types";

// The state is now much simpler
interface SurveyState {
  currentRoute: Route | null;
  isTracking: boolean;
}

interface SurveyActions {
  stopSurvey: () => void;
  addSurveyPoint: (point: Omit<SurveyPoint, 'routeId' | 'timestamp'>) => void;
  updateSurveyPoint: (pointId: string, updatedData: Partial<Omit<SurveyPoint, '_id' | 'routeId'>>) => void;
  deleteSurveyPoint: (pointId: string) => void;
  updateCurrentPath: (location: Location) => void;
  clearCurrentSurvey: () => void;
  setCurrentRoute: (route: Route) => void;
  setSurveyFromServer: (route: Route) => void;
  startSurvey: (name: string, description: string) => void;
  pauseSurvey: () => void;
  resumeSurvey: () => void;
}

const initialState: SurveyState = {
  currentRoute: null,
  isTracking: false,
};

export const useSurveyStore = create<SurveyState & SurveyActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setSurveyFromServer: (route) => {
          set({ currentRoute: route, isTracking: route.status === 'active' });
        },

        startSurvey: (name, description) => {
          // Creates a TEMPORARY route object for immediate UI feedback.
          // This will be REPLACED by the server's response.
          const tempRoute: Route = {
            _id: uuidv4(), // Temporary client-side ID
            name,
            description,
            startTime: new Date(),
            status: 'active',
            points: [],
            path: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set({ currentRoute: tempRoute, isTracking: true });
        },

        pauseSurvey: () => {
          const { currentRoute } = get();
          if (currentRoute) {
            set({
              isTracking: false,
              currentRoute: { ...currentRoute, status: "paused", updatedAt: new Date() },
            });
          }
        },

        resumeSurvey: () => {
          const { currentRoute } = get();
          if (currentRoute) {
            set({
              isTracking: true,
              currentRoute: { ...currentRoute, status: "active", updatedAt: new Date() },
            });
          }
        },

        stopSurvey: () => {
          const { currentRoute } = get();
          if (currentRoute && currentRoute.status !== "completed") {
            const endTime = new Date();
            const duration = endTime.getTime() - new Date(currentRoute.startTime).getTime();
            const completedRoute: Route = {
              ...currentRoute,
              status: "completed",
              endTime,
              totalDuration: duration,
            };
            set({ isTracking: false, currentRoute: completedRoute });
          }
        },

        addSurveyPoint: (point) => {
          const { currentRoute } = get();
          if (currentRoute) {
            const newPoint: SurveyPoint = { ...point, _id: uuidv4(), routeId: currentRoute._id!, timestamp: new Date() };
            set({ currentRoute: { ...currentRoute, points: [...currentRoute.points, newPoint], updatedAt: new Date() } });
          }
        },

        updateCurrentPath: (location: Location) => {
          const { currentRoute, isTracking } = get();
          if (currentRoute && isTracking) {
            set({ currentRoute: { ...currentRoute, path: [...currentRoute.path, location], updatedAt: new Date() } });
          }
        },

        clearCurrentSurvey: () => set(initialState),

        setCurrentRoute: (route) => set({ currentRoute: route, isTracking: route.status === "active" }),

        updateSurveyPoint: (pointId, updatedData) => {
          const { currentRoute } = get();
          if (currentRoute) {
            const updatedPoints = currentRoute.points.map((point) => (point._id === pointId ? { ...point, ...updatedData, timestamp: new Date() } : point));
            set({
              currentRoute: { ...currentRoute, points: updatedPoints, updatedAt: new Date() },
            });
          }
        },

        deleteSurveyPoint: (pointId) => {
          const { currentRoute } = get();
          if (currentRoute) {
            const filteredPoints = currentRoute.points.filter((point) => point._id !== pointId);
            set({
              currentRoute: { ...currentRoute, points: filteredPoints, updatedAt: new Date() },
            });
          }
        },
      }),
      {
        name: "route-survey-session",
        partialize: (state) => ({ currentRoute: state.currentRoute, isTracking: state.isTracking }),
      }
    ),
    { name: "SurveyStore" }
  )
);

// Atomic selectors for state
export const useCurrentRoute = () => useSurveyStore((state) => state.currentRoute);
export const useIsTracking = () => useSurveyStore((state) => state.isTracking);

// Atomic selectors for actions
export const useSetSurveyFromServer = () => useSurveyStore((state) => state.setSurveyFromServer);
export const useStartSurvey = () => useSurveyStore((state) => state.startSurvey);
export const usePauseSurvey = () => useSurveyStore((state) => state.pauseSurvey);
export const useResumeSurvey = () => useSurveyStore((state) => state.resumeSurvey);
export const useStopSurvey = () => useSurveyStore((state) => state.stopSurvey);
export const useAddSurveyPoint = () => useSurveyStore((state) => state.addSurveyPoint);
export const useUpdateSurveyPoint = () => useSurveyStore((state) => state.updateSurveyPoint);
export const useDeleteSurveyPoint = () => useSurveyStore((state) => state.deleteSurveyPoint);
export const useUpdateCurrentPath = () => useSurveyStore((state) => state.updateCurrentPath);
export const useClearCurrentSurvey = () => useSurveyStore((state) => state.clearCurrentSurvey);
export const useSetCurrentRoute = () => useSurveyStore((state) => state.setCurrentRoute);
```

<!-- path: store/surveyStore.test.ts -->
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSurveyStore } from './surveyStore';
import { Route, SurveyPoint, Location } from '@/types';

// Initial state from the store, useful for resetting
const initialState = useSurveyStore.getState();

describe('useSurveyStore', () => {

  // Before each test, reset the store to its initial, clean state
  beforeEach(() => {
    useSurveyStore.setState(initialState);
  });

  it('should start a new survey correctly', () => {
    const { startSurvey } = useSurveyStore.getState();

    startSurvey('Test Route', 'A test description.');

    const state = useSurveyStore.getState();

    expect(state.isTracking).toBe(true);
    expect(state.currentRoute).not.toBeNull();
    expect(state.currentRoute?.name).toBe('Test Route');
    expect(state.currentRoute?.description).toBe('A test description.');
    expect(state.currentRoute?.status).toBe('active');
    expect(state.currentRoute?.points).toEqual([]);
    expect(state.currentRoute?.path).toEqual([]);
  });

  it('should pause an active survey', () => {
    const { startSurvey, pauseSurvey } = useSurveyStore.getState();

    startSurvey('Test Route', '');
    pauseSurvey();

    const state = useSurveyStore.getState();
    expect(state.isTracking).toBe(false);
    expect(state.currentRoute?.status).toBe('paused');
  });

  it('should resume a paused survey', () => {
    const { startSurvey, pauseSurvey, resumeSurvey } = useSurveyStore.getState();

    startSurvey('Test Route', '');
    pauseSurvey();
    resumeSurvey();

    const state = useSurveyStore.getState();
    expect(state.isTracking).toBe(true);
    expect(state.currentRoute?.status).toBe('active');
  });

  it('should stop and finalize a survey', () => {
    const { startSurvey, stopSurvey } = useSurveyStore.getState();

    startSurvey('Test Route', '');

    // Wait a moment to ensure duration is > 0
    setTimeout(() => {
        stopSurvey();
        const state = useSurveyStore.getState();
        expect(state.isTracking).toBe(false);
        expect(state.currentRoute?.status).toBe('completed');
        expect(state.currentRoute?.endTime).toBeInstanceOf(Date);
        expect(state.currentRoute?.totalDuration).toBeGreaterThan(0);
    }, 10);
  });

  it('should add a survey point to the current route', () => {
    const { startSurvey, addSurveyPoint } = useSurveyStore.getState();

    startSurvey('Test Route', '');

    const newPoint: Omit<SurveyPoint, 'routeId' | 'timestamp'> = {
      location: { lat: 10, lng: 20 },
      notes: 'First point',
      pointType: 'UG_JC',
    };

    addSurveyPoint(newPoint);

    const state = useSurveyStore.getState();
    expect(state.currentRoute?.points.length).toBe(1);
    const addedPoint = state.currentRoute?.points[0];
    expect(addedPoint?.notes).toBe('First point');
    expect(addedPoint?.location.lat).toBe(10);
  });

  it('should update the current path when tracking', () => {
    const { startSurvey, updateCurrentPath } = useSurveyStore.getState();

    startSurvey('Test Route', '');

    const newLocation: Location = { lat: 5, lng: 5 };
    updateCurrentPath(newLocation);

    const state = useSurveyStore.getState();
    expect(state.currentRoute?.path.length).toBe(1);
    expect(state.currentRoute?.path[0]).toEqual(newLocation);
  });

  it('should NOT update the path when not tracking', () => {
    const { startSurvey, pauseSurvey, updateCurrentPath } = useSurveyStore.getState();

    startSurvey('Test Route', '');
    pauseSurvey(); // Tracking is now false

    const newLocation: Location = { lat: 5, lng: 5 };
    updateCurrentPath(newLocation);

    const state = useSurveyStore.getState();
    expect(state.currentRoute?.path.length).toBe(0);
  });
});
```

<!-- path: store/orsStore.ts -->
```typescript
// store/orsStore.ts
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Location, RouteStats } from '@/types';
import {
  ORSProfileType,
  ORSStandardizedResponse,
} from '@/lib/services/orsService';
import { calculateRouteStats as calculateTotalDistance } from '@/utils/routeCalculations';
import ORSService from '@/lib/services/orsService';

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

interface OrsState {
  orsApiKey: string | null;
  orsEnabled: boolean;
  orsProfile: ORSProfileType;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  processedRoute: Location[] | null;
  originalRouteForProcessing: Location[] | null;
  routeStats: RouteStats | null;
}

interface OrsActions {
  setORSConfig: (apiKey: string, enabled?: boolean) => void;
  setORSProfile: (profile: ORSProfileType) => void;
  setProcessingStatus: (
    status: ProcessingStatus,
    error?: string | null
  ) => void;
  setProcessedRouteData: (
    orsResponse: ORSStandardizedResponse,
    originalPath: Location[]
  ) => void;
  clearProcessedRoute: () => void;
  resetOrs: () => void;
}

const initialState: OrsState = {
  orsApiKey: null,
  orsEnabled: false,
  orsProfile: 'cycling-regular',
  processingStatus: 'idle',
  processingError: null,
  processedRoute: null,
  originalRouteForProcessing: null,
  routeStats: null,
};

export const useOrsStore = create<OrsState & OrsActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setORSConfig: (apiKey, enabled = true) => {
        const key = apiKey.trim();
        set({ orsApiKey: key || null, orsEnabled: enabled && !!key });
      },
      setORSProfile: (profile) => set({ orsProfile: profile }),
      setProcessingStatus: (status, error = null) =>
        set({ processingStatus: status, processingError: error }),

      setProcessedRouteData: (orsResponse, originalPath) => {
        if (!orsResponse.features?.length) return;

        const feature = orsResponse.features[0];
        const optimizedPath = ORSService.ORSToLocation(
          feature.geometry.coordinates
        );
        const summary = feature.properties.summary;
        const originalDistance = calculateTotalDistance(originalPath).distance;

        const newRouteStats: RouteStats = {
          originalDistance,
          optimizedDistance: summary.distance,
          timeSaved: summary.duration,
          efficiency:
            originalDistance > 0
              ? (summary.distance / originalDistance) * 100
              : 100,
        };

        set({
          processedRoute: optimizedPath,
          originalRouteForProcessing: originalPath,
          routeStats: newRouteStats,
        });
      },

      clearProcessedRoute: () =>
        set({
          processedRoute: null,
          originalRouteForProcessing: null,
          routeStats: null,
          processingStatus: 'idle',
          processingError: null,
        }),

      resetOrs: () => set(initialState),
    }),
    { name: 'OrsStore' }
  )
);

// FIXED: Individual atomic selectors instead of object-returning functions
export const useOrsApiKey = () => useOrsStore((state) => state.orsApiKey);
export const useOrsEnabled = () => useOrsStore((state) => state.orsEnabled);
export const useOrsProfile = () => useOrsStore((state) => state.orsProfile);
export const useProcessingStatus = () => useOrsStore((state) => state.processingStatus);
export const useProcessingError = () => useOrsStore((state) => state.processingError);
export const useProcessedRoute = () => useOrsStore((state) => state.processedRoute);
export const useRouteStats = () => useOrsStore((state) => state.routeStats);
export const useOriginalRouteForProcessing = () => useOrsStore((state) => state.originalRouteForProcessing);

// Individual action selectors
export const useSetORSConfig = () => useOrsStore((state) => state.setORSConfig);
export const useSetORSProfile = () => useOrsStore((state) => state.setORSProfile);
export const useSetProcessingStatus = () => useOrsStore((state) => state.setProcessingStatus);
export const useSetProcessedRouteData = () => useOrsStore((state) => state.setProcessedRouteData);
export const useClearProcessedRoute = () => useOrsStore((state) => state.clearProcessedRoute);
export const useResetOrs = () => useOrsStore((state) => state.resetOrs);

```

<!-- path: app/globals.css -->
```css
/* app/globals.css */

@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* ===========================================
   LEAFLET CORE STYLES (Full CSS)
   =========================================== */

/* required styles */
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
	position: absolute;
	left: 0;
	top: 0;
}

.leaflet-container {
	overflow: hidden;
	height: 100%;
	width: 100%;
	font-family: inherit;
	background: transparent;
}

.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
	-webkit-user-select: none;
	-moz-user-select: none;
	user-select: none;
	-webkit-user-drag: none;
}

/* Prevents IE11 from highlighting tiles in blue */
.leaflet-tile::selection {
	background: transparent;
}

/* Safari renders non-retina tile on retina better with this, but Chrome is worse */
.leaflet-safari .leaflet-tile {
	image-rendering: -webkit-optimize-contrast;
}

/* hack that prevents hw layers "stretching" when loading new tiles */
.leaflet-safari .leaflet-tile-container {
	width: 1600px;
	height: 1600px;
	-webkit-transform-origin: 0 0;
}

.leaflet-marker-icon,
.leaflet-marker-shadow {
	display: block;
}

/* .leaflet-container svg: reset svg max-width decleration shipped in Joomla! (joomla.org) 3.x */
/* .leaflet-container img: map is broken in FF if you have max-width: 100% on tiles */
.leaflet-container .leaflet-overlay-pane svg {
	max-width: none !important;
	max-height: none !important;
}

.leaflet-container .leaflet-marker-pane img,
.leaflet-container .leaflet-shadow-pane img,
.leaflet-container .leaflet-tile-pane img,
.leaflet-container img.leaflet-image-layer,
.leaflet-container .leaflet-tile {
	max-width: none !important;
	max-height: none !important;
	width: auto;
	padding: 0;
}

.leaflet-container img.leaflet-tile {
	/* See: https://bugs.chromium.org/p/chromium/issues/detail?id=600120 */
	mix-blend-mode: plus-lighter;
}

.leaflet-container.leaflet-touch-zoom {
	-ms-touch-action: pan-x pan-y;
	touch-action: pan-x pan-y;
}

.leaflet-container.leaflet-touch-drag {
	-ms-touch-action: pinch-zoom;
	/* Fallback for FF which doesn't support pinch-zoom */
	touch-action: none;
	touch-action: pinch-zoom;
}

.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom {
	-ms-touch-action: none;
	touch-action: none;
}

.leaflet-container {
	-webkit-tap-highlight-color: transparent;
}

.leaflet-container a {
	-webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
	color: #0078A8;
}

.leaflet-tile {
	filter: inherit;
	visibility: hidden;
}

.leaflet-tile-loaded {
	visibility: inherit;
}

.leaflet-zoom-box {
	width: 0;
	height: 0;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
	border: 2px dotted #38f;
	background: rgba(255,255,255,0.5);
}

/* workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=888319 */
.leaflet-overlay-pane svg {
	-moz-user-select: none;
}

/*
 * Z-INDEX STRATEGY (0-50 Scale)
 * 1-9:   Leaflet Panes (Internal Map Layers)
 * 10:    Map Controls, Legends, Leaflet's own controls
 * 20:    Sidebar Overlays
 * 30:    Sidebars
 * 40:    Dropdowns
 * 50:    Modals, Dialogs, Banners
*/

.leaflet-pane { z-index: 4; }
.leaflet-tile-pane { z-index: 2; }
.leaflet-overlay-pane { z-index: 4; }
.leaflet-shadow-pane { z-index: 5; }
.leaflet-marker-pane { z-index: 6; }
.leaflet-tooltip-pane { z-index: 6; }
.leaflet-popup-pane { z-index: 7; }
.leaflet-map-pane canvas { z-index: 1; }
.leaflet-map-pane svg { z-index: 2; }
.leaflet-zoom-box { z-index: 8; }

.leaflet-vml-shape {
	width: 1px;
	height: 1px;
}

.lvml {
	behavior: url(#default#VML);
	display: inline-block;
	position: absolute;
}

/* control positioning */
.leaflet-control {
	position: relative;
	z-index: 10;
	pointer-events: visiblePainted; /* IE 9-10 doesn't have auto */
	pointer-events: auto;
}

.leaflet-top,
.leaflet-bottom {
	position: absolute;
	z-index: 10;
	pointer-events: none;
}

.leaflet-top {
	top: 0;
}

.leaflet-right {
	right: 0;
}

.leaflet-bottom {
	bottom: 0;
}

.leaflet-left {
	left: 0;
}

.leaflet-control {
	float: left;
	clear: both;
}

.leaflet-right .leaflet-control {
	float: right;
}

.leaflet-top .leaflet-control {
	margin-top: 10px;
}

.leaflet-bottom .leaflet-control {
	margin-bottom: 10px;
}

.leaflet-left .leaflet-control {
	margin-left: 10px;
}

.leaflet-right .leaflet-control {
	margin-right: 10px;
}

/* zoom and fade animations */
.leaflet-fade-anim .leaflet-popup {
	opacity: 0;
	-webkit-transition: opacity 0.2s linear;
	-moz-transition: opacity 0.2s linear;
	transition: opacity 0.2s linear;
}

.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {
	opacity: 1;
}

.leaflet-zoom-animated {
	-webkit-transform-origin: 0 0;
	-ms-transform-origin: 0 0;
	transform-origin: 0 0;
}

svg.leaflet-zoom-animated {
	will-change: transform;
}

.leaflet-zoom-anim .leaflet-zoom-animated {
	-webkit-transition: -webkit-transform 0.25s cubic-bezier(0,0,0.25,1);
	-moz-transition: -moz-transform 0.25s cubic-bezier(0,0,0.25,1);
	transition: transform 0.25s cubic-bezier(0,0,0.25,1);
}

.leaflet-zoom-anim .leaflet-tile,
.leaflet-pan-anim .leaflet-tile {
	-webkit-transition: none;
	-moz-transition: none;
	transition: none;
}

.leaflet-zoom-anim .leaflet-zoom-hide {
	visibility: hidden;
}

/* cursors */
.leaflet-interactive {
	cursor: pointer;
}

.leaflet-grab {
	cursor: -webkit-grab;
	cursor: -moz-grab;
	cursor: grab;
}

.leaflet-crosshair,
.leaflet-crosshair .leaflet-interactive {
	cursor: crosshair;
}

.leaflet-popup-pane,
.leaflet-control {
	cursor: auto;
}

.leaflet-dragging .leaflet-grab,
.leaflet-dragging .leaflet-grab .leaflet-interactive,
.leaflet-dragging .leaflet-marker-draggable {
	cursor: move;
	cursor: -webkit-grabbing;
	cursor: -moz-grabbing;
	cursor: grabbing;
}

/* marker & overlays interactivity */
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-image-layer,
.leaflet-pane > svg path,
.leaflet-tile-container {
	pointer-events: none;
}

.leaflet-marker-icon.leaflet-interactive,
.leaflet-image-layer.leaflet-interactive,
.leaflet-pane > svg path.leaflet-interactive,
svg.leaflet-image-layer.leaflet-interactive path {
	pointer-events: visiblePainted; /* IE 9-10 doesn't have auto */
	pointer-events: auto;
}

/* visual tweaks */
.leaflet-container {
	outline-offset: 1px;
}

/* general typography */
.leaflet-container {
	font-family: "Helvetica Neue", Arial, Helvetica, sans-serif;
	font-size: 12px;
	font-size: 0.75rem;
	line-height: 1.5;
}

/* general toolbar styles */
.leaflet-bar {
	box-shadow: 0 1px 5px rgba(0,0,0,0.65);
	border-radius: 4px;
}

.leaflet-bar a {
	background-color: #fff;
	border-bottom: 1px solid #ccc;
	width: 26px;
	height: 26px;
	line-height: 26px;
	display: block;
	text-align: center;
	text-decoration: none;
	color: black;
}

.leaflet-bar a,
.leaflet-control-layers-toggle {
	background-position: 50% 50%;
	background-repeat: no-repeat;
	display: block;
}

.leaflet-bar a:hover,
.leaflet-bar a:focus {
	background-color: #f4f4f4;
}

.leaflet-bar a:first-child {
	border-top-left-radius: 4px;
	border-top-right-radius: 4px;
}

.leaflet-bar a:last-child {
	border-bottom-left-radius: 4px;
	border-bottom-right-radius: 4px;
	border-bottom: none;
}

.leaflet-bar a.leaflet-disabled {
	cursor: default;
	background-color: #f4f4f4;
	color: #bbb;
}

.leaflet-touch .leaflet-bar a {
	width: 30px;
	height: 30px;
	line-height: 30px;
}

.leaflet-touch .leaflet-bar a:first-child {
	border-top-left-radius: 2px;
	border-top-right-radius: 2px;
}

.leaflet-touch .leaflet-bar a:last-child {
	border-bottom-left-radius: 2px;
	border-bottom-right-radius: 2px;
}

/* zoom control */
.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
	font: bold 18px 'Lucida Console', Monaco, monospace;
	text-indent: 1px;
}

.leaflet-touch .leaflet-control-zoom-in,
.leaflet-touch .leaflet-control-zoom-out {
	font-size: 22px;
}

/* layers control */
.leaflet-control-layers {
	box-shadow: 0 1px 5px rgba(0,0,0,0.4);
	background: #fff;
	border-radius: 5px;
}

.leaflet-touch .leaflet-control-layers-toggle {
	width: 44px;
	height: 44px;
}

.leaflet-control-layers .leaflet-control-layers-list,
.leaflet-control-layers-expanded .leaflet-control-layers-toggle {
	display: none;
}

.leaflet-control-layers-expanded .leaflet-control-layers-list {
	display: block;
	position: relative;
}

.leaflet-control-layers-expanded {
	padding: 6px 10px 6px 6px;
	color: #333;
	background: #fff;
}

.leaflet-control-layers-scrollbar {
	overflow-y: scroll;
	overflow-x: hidden;
	padding-right: 5px;
}

.leaflet-control-layers-selector {
	margin-top: 2px;
	position: relative;
	top: 1px;
}

.leaflet-control-layers label {
	display: block;
	font-size: 13px;
	font-size: 1.08333em;
}

.leaflet-control-layers-separator {
	height: 0;
	border-top: 1px solid #ddd;
	margin: 5px -10px 5px -6px;
}


/* attribution and scale controls */
.leaflet-container .leaflet-control-attribution {
	background: #fff;
	background: rgba(255, 255, 255, 0.8);
	margin: 0;
}

.leaflet-control-attribution,
.leaflet-control-scale-line {
	padding: 0 5px;
	color: #333;
	line-height: 1.4;
}

.leaflet-control-attribution a {
	text-decoration: none;
}

.leaflet-control-attribution a:hover,
.leaflet-control-attribution a:focus {
	text-decoration: underline;
}

.leaflet-attribution-flag {
	display: inline !important;
	vertical-align: baseline !important;
	width: 1em;
	height: 0.6669em;
}

.leaflet-left .leaflet-control-scale {
	margin-left: 5px;
}

.leaflet-bottom .leaflet-control-scale {
	margin-bottom: 5px;
}

.leaflet-control-scale-line {
	border: 2px solid #777;
	border-top: none;
	line-height: 1.1;
	padding: 2px 5px 1px;
	white-space: nowrap;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.8);
	text-shadow: 1px 1px #fff;
}

.leaflet-control-scale-line:not(:first-child) {
	border-top: 2px solid #777;
	border-bottom: none;
	margin-top: -2px;
}

.leaflet-control-scale-line:not(:first-child):not(:last-child) {
	border-bottom: 2px solid #777;
}

.leaflet-touch .leaflet-control-attribution,
.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
	box-shadow: none;
}

.leaflet-touch .leaflet-control-layers,
.leaflet-touch .leaflet-bar {
	border: 2px solid rgba(0,0,0,0.2);
	background-clip: padding-box;
}

/* popup */
.leaflet-popup {
	position: absolute;
	text-align: center;
	margin-bottom: 20px;
}

.leaflet-popup-content-wrapper {
	padding: 1px;
	text-align: left;
	border-radius: 12px;
}

.leaflet-popup-content {
	margin: 13px 24px 13px 20px;
	line-height: 1.3;
	font-size: 13px;
	font-size: 1.08333em;
	min-height: 1px;
}

.leaflet-popup-content p {
	margin: 17px 0;
	margin: 1.3em 0;
}

.leaflet-popup-tip-container {
	width: 40px;
	height: 20px;
	position: absolute;
	left: 50%;
	margin-top: -1px;
	margin-left: -20px;
	overflow: hidden;
	pointer-events: none;
}

.leaflet-popup-tip {
	width: 17px;
	height: 17px;
	padding: 1px;
	margin: -10px auto 0;
	pointer-events: auto;
	-webkit-transform: rotate(45deg);
	-moz-transform: rotate(45deg);
	-ms-transform: rotate(45deg);
	transform: rotate(45deg);
}

.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
	background: white;
	color: #333;
	box-shadow: 0 3px 14px rgba(0,0,0,0.4);
}

.leaflet-container a.leaflet-popup-close-button {
	position: absolute;
	top: 0;
	right: 0;
	border: none;
	text-align: center;
	width: 24px;
	height: 24px;
	font: 16px/24px Tahoma, Verdana, sans-serif;
	color: #757575;
	text-decoration: none;
	background: transparent;
}

.leaflet-container a.leaflet-popup-close-button:hover,
.leaflet-container a.leaflet-popup-close-button:focus {
	color: #585858;
}

.leaflet-popup-scrolled {
	overflow: auto;
}

.leaflet-oldie .leaflet-popup-content-wrapper {
	-ms-zoom: 1;
}

.leaflet-oldie .leaflet-popup-tip {
	width: 24px;
	margin: 0 auto;
	-ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";
	filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);
}

.leaflet-oldie .leaflet-control-zoom,
.leaflet-oldie .leaflet-control-layers,
.leaflet-oldie .leaflet-popup-content-wrapper,
.leaflet-oldie .leaflet-popup-tip {
	border: 1px solid #999;
}

/* div icon */
.leaflet-div-icon {
	background: #fff;
	border: 1px solid #666;
}

/* Tooltip */
.leaflet-tooltip {
	position: absolute;
	padding: 6px;
	background-color: #fff;
	border: 1px solid #fff;
	border-radius: 3px;
	color: #222;
	white-space: nowrap;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	pointer-events: none;
	box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.leaflet-tooltip.leaflet-interactive {
	cursor: pointer;
	pointer-events: auto;
}

.leaflet-tooltip-top:before,
.leaflet-tooltip-bottom:before,
.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {
	position: absolute;
	pointer-events: none;
	border: 6px solid transparent;
	background: transparent;
	content: "";
}

/* Directions */
.leaflet-tooltip-bottom {
	margin-top: 6px;
}

.leaflet-tooltip-top {
	margin-top: -6px;
}

.leaflet-tooltip-bottom:before,
.leaflet-tooltip-top:before {
	left: 50%;
	margin-left: -6px;
}

.leaflet-tooltip-top:before {
	bottom: 0;
	margin-bottom: -12px;
	border-top-color: #fff;
}

.leaflet-tooltip-bottom:before {
	top: 0;
	margin-top: -12px;
	margin-left: -6px;
	border-bottom-color: #fff;
}

.leaflet-tooltip-left {
	margin-left: -6px;
}

.leaflet-tooltip-right {
	margin-left: 6px;
}

.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {
	top: 50%;
	margin-top: -6px;
}

.leaflet-tooltip-left:before {
	right: 0;
	margin-right: -12px;
	border-left-color: #fff;
}

.leaflet-tooltip-right:before {
	left: 0;
	margin-left: -12px;
	border-right-color: #fff;
}

/* Printing */
@media print {
	.leaflet-control {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
}

/* ===========================================
   MARKER CLUSTERING STYLES
   =========================================== */

.leaflet-cluster-anim .leaflet-marker-icon,
.leaflet-cluster-anim .leaflet-marker-shadow {
	-webkit-transition: -webkit-transform 0.3s ease-out, opacity 0.3s ease-in;
	-moz-transition: -moz-transform 0.3s ease-out, opacity 0.3s ease-in;
	-o-transition: -o-transform 0.3s ease-out, opacity 0.3s ease-in;
	transition: transform 0.3s ease-out, opacity 0.3s ease-in;
}

.leaflet-cluster-spider-leg {
	/* stroke-dashoffset (duration and function) should match with leaflet-marker-icon transform in order to track it exactly */
	-webkit-transition: -webkit-stroke-dashoffset 0.3s ease-out, -webkit-stroke-opacity 0.3s ease-in;
	-moz-transition: -moz-stroke-dashoffset 0.3s ease-out, -moz-stroke-opacity 0.3s ease-in;
	-o-transition: -o-stroke-dashoffset 0.3s ease-out, -o-stroke-opacity 0.3s ease-in;
	transition: stroke-dashoffset 0.3s ease-out, stroke-opacity 0.3s ease-in;
	stroke: #222;
	stroke-width: 1.5;
	fill: none;
	pointer-events: none;
}

.dark .leaflet-cluster-spider-leg {
	stroke: #60a5fa;
	stroke-opacity: 0.8;
}

.marker-cluster {
	background-clip: padding-box;
	border-radius: 20px;
}

.marker-cluster div {
	width: 30px;
	height: 30px;
	margin-left: 5px;
	margin-top: 5px;
	text-align: center;
	border-radius: 15px;
	font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
}

.marker-cluster span {
	line-height: 30px;
}

.marker-cluster-small {
	background-color: rgba(181, 226, 140, 0.6);
}

.marker-cluster-small div {
	background-color: rgba(110, 204, 57, 0.6);
}

.marker-cluster-medium {
	background-color: rgba(241, 211, 87, 0.6);
}

.marker-cluster-medium div {
	background-color: rgba(240, 194, 12, 0.6);
}

.marker-cluster-large {
	background-color: rgba(253, 156, 115, 0.6);
}

.marker-cluster-large div {
	background-color: rgba(241, 128, 23, 0.6);
}

/* IE 6-8 fallback colors */
.leaflet-oldie .marker-cluster-small {
	background-color: rgb(181, 226, 140);
}

.leaflet-oldie .marker-cluster-small div {
	background-color: rgb(110, 204, 57);
}

.leaflet-oldie .marker-cluster-medium {
	background-color: rgb(241, 211, 87);
}

.leaflet-oldie .marker-cluster-medium div {
	background-color: rgb(240, 194, 12);
}

.leaflet-oldie .marker-cluster-large {
	background-color: rgb(253, 156, 115);
}

.leaflet-oldie .marker-cluster-large div {
	background-color: rgb(241, 128, 23);
}

/* ===========================================
   CUSTOM ENHANCEMENTS
   =========================================== */

/* Enhanced zoom controls */
.leaflet-control-zoom a {
	background-color: white;
	color: #374151;
	border: 1px solid #d1d5db;
	transition: all 0.2s ease;
}

.leaflet-control-zoom a:hover {
	background-color: #f9fafb;
	color: #111827;
}

/* Dark mode enhancements */
.dark .leaflet-control-zoom a {
	background-color: #374151;
	color: #f9fafb;
	border-color: #4b5563;
}

.dark .leaflet-control-zoom a:hover {
	background-color: #4b5563;
	color: #ffffff;
}

.dark .leaflet-control-attribution {
	background: rgba(0, 0, 0, 0.8);
	color: rgba(255, 255, 255, 0.8);
}

.dark .leaflet-popup-content-wrapper,
.dark .leaflet-popup-tip {
	background: #1f2937;
	color: #f9fafb;
	border-color: #374151;
}

.dark .leaflet-tooltip {
	background-color: #1f2937;
	color: #f9fafb;
	border-color: #374151;
}

.dark .leaflet-tooltip-top:before {
	border-top-color: #1f2937;
}

.dark .leaflet-tooltip-bottom:before {
	border-bottom-color: #1f2937;
}

.dark .leaflet-tooltip-left:before {
	border-left-color: #1f2937;
}

.dark .leaflet-tooltip-right:before {
	border-right-color: #1f2937;
}

/* Custom markers */
.start-marker,
.end-marker {
	border-radius: 50%;
	border: 3px solid white;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	transition: all 0.2s ease;
}

.start-marker:hover,
.end-marker:hover {
	transform: scale(1.1);
	box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.start-marker {
	background-color: #10b981;
}

.end-marker {
	background-color: #ef4444;
}

.dark .start-marker,
.dark .end-marker {
	border-color: rgba(255, 255, 255, 0.8);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.3);
}

/* Custom Leaflet icon styling */
.custom-leaflet-icon div {
	border: 3px solid white;
	border-radius: 50%;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	transition: all 0.2s ease;
}

.dark .custom-leaflet-icon div {
	border-color: rgba(255, 255, 255, 0.8) !important;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
}

/* Route polylines */
.route-polyline {
	stroke-width: 4;
	stroke-opacity: 0.8;
	stroke-linecap: round;
	stroke-linejoin: round;
	fill: none;
}

.route-polyline:hover {
	stroke-width: 6;
	stroke-opacity: 1;
}

/* ===========================================
   CUSTOM SCROLLBARS
   =========================================== */

.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
	height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: #f1f5f9;
	border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 3px;
	transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
	background: #1e293b;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
	background: #475569;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #64748b;
}

/* Route list scrollbar */
.overflow-y-auto::-webkit-scrollbar {
	width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
	background: #f1f5f9;
	border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
	background: #1e293b;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
	background: #475569;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
	background: #64748b;
}

/* ===========================================
   ANIMATIONS
   =========================================== */

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes shimmer {
	0% {
		background-position: -468px 0;
	}
	100% {
		background-position: 468px 0;
	}
}

.shimmer {
	animation: shimmer 1.2s ease-in-out infinite;
	background: linear-gradient(to right, #f1f5f9 4%, #e2e8f0 25%, #f1f5f9 36%);
	background-size: 1000px 100%;
}

.dark .shimmer {
	background: linear-gradient(to right, #1e293b 4%, #334155 25%, #1e293b 36%);
	background-size: 1000px 100%;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.animate-fade-in-up {
	animation: fadeInUp 0.3s ease-out;
}

/* ===========================================
   RESPONSIVE DESIGN
   =========================================== */

@media (max-width: 768px) {
	.leaflet-control-container .leaflet-top.leaflet-right {
		top: 10px;
		right: 10px;
	}

	.leaflet-control-container .leaflet-top.leaflet-left {
		top: 10px;
		left: 10px;
	}

	.leaflet-control-container .leaflet-bottom.leaflet-right {
		bottom: 10px;
		right: 10px;
	}

	.leaflet-control-container .leaflet-bottom.leaflet-left {
		bottom: 10px;
		left: 10px;
	}

	/* Adjust popup for mobile */
	.leaflet-popup-content-wrapper {
		max-width: 280px;
	}

	.leaflet-popup-content {
		margin: 8px 12px;
		font-size: 13px;
	}
}

@media (max-width: 480px) {
	.leaflet-control-zoom a {
		width: 28px;
		height: 28px;
		line-height: 26px;
		font-size: 16px;
	}
}

/* ===========================================
   FOCUS STATES & ACCESSIBILITY
   =========================================== */

button:focus,
.leaflet-control-zoom a:focus {
	outline: 2px solid #3b82f6;
	outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
	.marker-cluster {
		border-width: 4px;
	}

	.start-marker,
	.end-marker {
		border-width: 4px;
	}

	.leaflet-popup-content-wrapper {
		border-width: 2px;
	}
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
	.start-marker,
	.end-marker,
	.marker-cluster {
		transition: none;
	}

	.animate-spin,
	.shimmer,
	.animate-fade-in-up {
		animation: none;
	}

	.leaflet-cluster-anim .leaflet-marker-icon,
	.leaflet-cluster-anim .leaflet-marker-shadow,
	.leaflet-cluster-spider-leg {
		transition: none;
	}
}

/* ===========================================
   THEME VARIABLES
   =========================================== */

:root {
	--radius: 0.625rem;
	--background: oklch(1 0 0);
	--foreground: oklch(0.129 0.042 264.695);
	--card: oklch(1 0 0);
	--card-foreground: oklch(0.129 0.042 264.695);
	--popover: oklch(1 0 0);
	--popover-foreground: oklch(0.129 0.042 264.695);
	--primary: oklch(0.208 0.042 265.755);
	--primary-foreground: oklch(0.984 0.003 247.858);
	--secondary: oklch(0.968 0.007 247.896);
	--secondary-foreground: oklch(0.208 0.042 265.755);
	--muted: oklch(0.968 0.007 247.896);
	--muted-foreground: oklch(0.554 0.046 257.417);
	--accent: oklch(0.968 0.007 247.896);
	--accent-foreground: oklch(0.208 0.042 265.755);
	--destructive: oklch(0.577 0.245 27.325);
	--border: oklch(0.929 0.013 255.508);
	--input: oklch(0.929 0.013 255.508);
	--ring: oklch(0.704 0.04 256.788);
	--chart-1: oklch(0.646 0.222 41.116);
	--chart-2: oklch(0.6 0.118 184.704);
	--chart-3: oklch(0.398 0.07 227.392);
	--chart-4: oklch(0.828 0.189 84.429);
	--chart-5: oklch(0.769 0.188 70.08);
	--sidebar: oklch(0.984 0.003 247.858);
	--sidebar-foreground: oklch(0.129 0.042 264.695);
	--sidebar-primary: oklch(0.208 0.042 265.755);
	--sidebar-primary-foreground: oklch(0.984 0.003 247.858);
	--sidebar-accent: oklch(0.968 0.007 247.896);
	--sidebar-accent-foreground: oklch(0.208 0.042 265.755);
	--sidebar-border: oklch(0.929 0.013 255.508);
	--sidebar-ring: oklch(0.704 0.04 256.788);
}

.dark {
	--background: oklch(0.129 0.042 264.695);
	--foreground: oklch(0.984 0.003 247.858);
	--card: oklch(0.208 0.042 265.755);
	--card-foreground: oklch(0.984 0.003 247.858);
	--popover: oklch(0.208 0.042 265.755);
	--popover-foreground: oklch(0.984 0.003 247.858);
	--primary: oklch(0.929 0.013 255.508);
	--primary-foreground: oklch(0.208 0.042 265.755);
	--secondary: oklch(0.279 0.041 260.031);
	--secondary-foreground: oklch(0.984 0.003 247.858);
	--muted: oklch(0.279 0.041 260.031);
	--muted-foreground: oklch(0.704 0.04 256.788);
	--accent: oklch(0.279 0.041 260.031);
	--accent-foreground: oklch(0.984 0.003 247.858);
	--destructive: oklch(0.704 0.191 22.216);
	--border: oklch(1 0 0 / 10%);
	--input: oklch(1 0 0 / 15%);
	--ring: oklch(0.551 0.027 264.364);
	--chart-1: oklch(0.488 0.243 264.376);
	--chart-2: oklch(0.696 0.17 162.48);
	--chart-3: oklch(0.769 0.188 70.08);
	--chart-4: oklch(0.627 0.265 303.9);
	--chart-5: oklch(0.645 0.246 16.439);
	--sidebar: oklch(0.208 0.042 265.755);
	--sidebar-foreground: oklch(0.984 0.003 247.858);
	--sidebar-primary: oklch(0.488 0.243 264.376);
	--sidebar-primary-foreground: oklch(0.984 0.003 247.858);
	--sidebar-accent: oklch(0.279 0.041 260.031);
	--sidebar-accent-foreground: oklch(0.984 0.003 247.858);
	--sidebar-border: oklch(1 0 0 / 10%);
	--sidebar-ring: oklch(0.551 0.027 264.364);
}

@layer base {
	* {
		@apply border-border outline-ring/50;
	}
	body {
		@apply bg-background text-foreground;
	}
}
```

<!-- path: app/api/config/route.js -->
```javascript
import { NextResponse } from 'next/server';

export async function GET() {
  const orsApiKey = process.env.ORS_API_KEY;

  // --- SERVER-SIDE LOGGING ---
  // This log will appear in your VS Code terminal where you ran `npm run dev`,
  // NOT in the browser console.
  if (!orsApiKey) {
    console.error("!!! SERVER-SIDE ERROR: ORS_API_KEY environment variable is not set or not accessible in /api/config route.");
    // Return an explicit error to the client so the fetch `.catch` block can handle it.
    return NextResponse.json({ error: 'ORS API Key not configured on the server.' }, { status: 500 });
  }

  console.log("✅ SERVER-SIDE LOG: Successfully retrieved ORS_API_KEY in /api/config route.");

  return NextResponse.json({
    orsApiKey: orsApiKey
  });
}
```

<!-- path: app/api/ping/route.ts -->
```typescript
// app/api/ping/route.ts
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ ok: true });
}
```

<!-- path: app/api/profile/route.ts -->
```typescript
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/apiResponse';
import { handleApiError } from '@/utils/errorHandler';

// ✅ Import the default export for Mongoose operations
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import z from 'zod';


const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.url("Please enter a valid URL.").or(z.literal("")).optional().transform(val => val === "" ? undefined : val),
  orsApiKey: z.string().trim().optional(),
});

// GET /api/profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse('Not authenticated');
    }

    await connectDB();

    // Use the Mongoose User model to find the user. No .lean() needed for type safety.
    const userFromDb = await User.findById(session.user.id);

    if (!userFromDb) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ user: userFromDb });

  } catch (error) {
    console.error('Profile GET Error:', error);
    return handleApiError(error);
  }
}

// PATCH /api/profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorizedResponse('Not authenticated');
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: validatedData },
      { new: true } // `new: true` returns the updated document
    );

    if (!updatedUser) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      user: updatedUser
    }, 'Profile updated successfully');
  } catch (error) {
    console.error('Profile PATCH Error:', error);
    return handleApiError(error);
  }
}

```

<!-- path: app/api/users/[id]/route.ts -->
```typescript
import { NextRequest } from 'next/server';
import { getUserFromDb, getSession } from '@/lib/auth-utils';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/apiResponse';
import { handleApiError } from '@/utils/errorHandler';



// GET /api/users/[id] - Get user by ID (public profile info only)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    if (!session?.user?.id) {
      return unauthorizedResponse('Authentication required');
    }

    const user = await getUserFromDb(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Return only public profile information
    return successResponse({
      user: {
        id: user._id.toString(),
        name: user.name,
        image: user.image,
        // Don't expose email or other sensitive info for other users
        ...(user._id.toString() === session.user.id && {
          email: user.email,
          emailVerified: user.emailVerified,
        }),
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

<!-- path: app/api/routes/[id]/route.ts -->
```typescript
// app/api/routes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { RouteModel, SurveyPointModel } from '@/lib/models/Route';
import { Route } from '@/types';
import z from 'zod';

function validateObjectId(id: string) {
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'Invalid route ID format' },
      { status: 400 }
    );
  }
  return null;
}

// --- THIS IS THE FIX ---
// The signature for `context.params` is correctly typed as a Promise,
// and we use `await` to access its value. This is applied to all route handlers in this file.

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // Correctly await the promise
    const validationError = validateObjectId(id);
    if (validationError) return validationError;

    await connectDB();
    const route = await RouteModel.findById(id).populate('points').lean();

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error: unknown) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Correctly await the promise
  const validationError = validateObjectId(id);
  if (validationError) return validationError;

  let body: Route;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  await connectDB();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { points, ...routeData } = body;
      await RouteModel.findByIdAndUpdate(
        id,
        { ...routeData, updatedAt: new Date() },
        { session }
      );

      if (points && Array.isArray(points)) {
        await SurveyPointModel.deleteMany({ routeId: id }, { session });

        const newPointDocs = points.map((point) => {
          const { _id, ...pointData } = point;
          return { ...pointData, routeId: id };
        });

        if (newPointDocs.length > 0) {
          const savedPoints = await SurveyPointModel.insertMany(newPointDocs, {
            session,
          });
          const pointIds = savedPoints.map((p) => p._id);
          await RouteModel.findByIdAndUpdate(
            id,
            { $set: { points: pointIds } },
            { session }
          );
        }
      }
    });

    const finalRoute = await RouteModel.findById(id).populate('points').lean();
    if (!finalRoute) {
      return NextResponse.json(
        { error: 'Route not found after update' },
        { status: 404 }
      );
    }
    return NextResponse.json(finalRoute);
  } catch (error) {
    console.error('Error updating route:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // Correctly await the promise
    const validationError = validateObjectId(id);
    if (validationError) return validationError;

    await connectDB();
    const session = await RouteModel.startSession();

    try {
      await session.withTransaction(async () => {
        await SurveyPointModel.deleteMany({ routeId: id }).session(session);
        const route = await RouteModel.findByIdAndDelete(id).session(session);
        if (!route) {
          throw new Error('Route not found');
        }
      });
      return NextResponse.json({ message: 'Route deleted successfully' });
    } catch (transactionError) {
      if (
        transactionError instanceof Error &&
        transactionError.message === 'Route not found'
      ) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
      throw transactionError;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}

const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const PointSchema = z.object({
  _id: z.string().optional(),
  routeId: z.string(),
  location: LocationSchema,
  timestamp: z.string().datetime().or(z.date()),
  notes: z.string(),
  photos: z.array(z.string()).optional(),
  pointType: z.string(),
  accuracy: z.number().optional(),
});

const updateRouteSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.').max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  path: z.array(LocationSchema).optional(),
  points: z.array(PointSchema).optional(),
  endTime: z.string().datetime().or(z.date()).optional(),
  totalDuration: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const validationError = validateObjectId(id);
  if (validationError) return validationError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const validatedData = updateRouteSchema.safeParse(body);
  if (!validatedData.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validatedData.error.flatten() },
      { status: 400 }
    );
  }

  // --- START OF FIX ---
  const { points, ...routeDataToSet } = validatedData.data;

  if (
    Object.keys(routeDataToSet).length === 0 &&
    (!points || points.length === 0)
  ) {
    // If there's nothing to update, return early.
    const route = await RouteModel.findById(id).populate('points').lean();
    return NextResponse.json(route);
  }

  await connectDB();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Step 1: Update the main route document with non-point fields
      if (Object.keys(routeDataToSet).length > 0) {
        await RouteModel.findByIdAndUpdate(
          id,
          { $set: { ...routeDataToSet, updatedAt: new Date() } },
          { session, runValidators: true }
        );
      }

      // Step 2: If points were included in the payload, handle them transactionally
      if (points && Array.isArray(points)) {
        await SurveyPointModel.deleteMany({ routeId: id }, { session });

        const newPointDocs = points.map((point) => {
          const { _id, ...pointData } = point;
          return { ...pointData, routeId: id };
        });

        let pointIds: mongoose.Types.ObjectId[] = [];
        if (newPointDocs.length > 0) {
          const savedPoints = await SurveyPointModel.insertMany(newPointDocs, {
            session,
          });
          pointIds = savedPoints.map((p) => p._id);
        }

        await RouteModel.findByIdAndUpdate(
          id,
          { $set: { points: pointIds, updatedAt: new Date() } },
          { session }
        );
      }
    });

    const finalUpdatedRoute = await RouteModel.findById(id)
      .populate('points')
      .lean();

    if (!finalUpdatedRoute) {
      throw new Error('Route not found after update');
    }

    return NextResponse.json(finalUpdatedRoute);
  } catch (error) {
    console.error('Error updating route details (PATCH):', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update route details' },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
  // --- END OF FIX ---
}

```

<!-- path: app/api/routes/[id]/ors/route.ts -->
```typescript
// app/api/routes/[id]/ors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { RouteModel } from '@/lib/models/Route';
import { Location } from '@/types';

interface ORSProcessRequest {
  originalPath: Location[];
  processedPath: Location[];
  routeStats: {
    originalDistance: number;
    optimizedDistance: number;
    timeSaved: number;
    efficiency: number;
  };
  orsProfile: string;
  processingMetadata?: {
    processingTime: number;
    batchCount: number;
    apiCalls: number;
  };
}

// PATCH /api/routes/[id]/ors - Update route with ORS processed data
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    let body: ORSProcessRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.processedPath || !Array.isArray(body.processedPath) || body.processedPath.length < 2) {
      return NextResponse.json(
        { error: 'Processed path is required and must contain at least 2 points' },
        { status: 400 }
      );
    }

    if (!body.originalPath || !Array.isArray(body.originalPath) || body.originalPath.length < 2) {
      return NextResponse.json(
        { error: 'Original path is required and must contain at least 2 points' },
        { status: 400 }
      );
    }

    if (!body.routeStats || typeof body.routeStats !== 'object') {
      return NextResponse.json(
        { error: 'Route statistics are required' },
        { status: 400 }
      );
    }

    // Find the route
    const route = await RouteModel.findById(id);
    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Update route with ORS data
    const updatedRoute = await RouteModel.findByIdAndUpdate(
      id,
      {
        $set: {
          // Store ORS processed data
          'orsData.processedPath': body.processedPath,
          'orsData.originalPath': body.originalPath,
          'orsData.routeStats': body.routeStats,
          'orsData.profile': body.orsProfile,
          'orsData.processedAt': new Date(),
          'orsData.processingMetadata': body.processingMetadata || {},

          // Update route metadata
          updatedAt: new Date(),

          // Add ORS flag
          'metadata.hasORSData': true,
          'metadata.orsProcessingVersion': '1.0'
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('points').lean();

    return NextResponse.json(updatedRoute);

  } catch (error: unknown) {
    console.error('Error updating route with ORS data:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ObjectId)
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid route ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update route with ORS data' },
      { status: 500 }
    );
  }
}

// GET /api/routes/[id]/ors - Get ORS processed data for a route
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Find route and return only ORS data
    const route = await RouteModel.findById(id, {
      'orsData': 1,
      'metadata.hasORSData': 1,
      name: 1,
      description: 1,
      status: 1
    }).lean();

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    if (!route.orsData || !route.metadata?.hasORSData) {
      return NextResponse.json(
        { error: 'No ORS data available for this route' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      routeId: route._id,
      routeName: route.name,
      routeDescription: route.description,
      routeStatus: route.status,
      orsData: route.orsData
    });

  } catch (error: unknown) {
    console.error('Error fetching ORS data:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid route ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch ORS data' },
      { status: 500 }
    );
  }
}

// DELETE /api/routes/[id]/ors - Remove ORS processed data from route
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Find the route first
    const route = await RouteModel.findById(id);
    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Remove ORS data
    const updatedRoute = await RouteModel.findByIdAndUpdate(
      id,
      {
        $unset: {
          'orsData': 1,
          'metadata.hasORSData': 1,
          'metadata.orsProcessingVersion': 1
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('points').lean();

    return NextResponse.json({
      message: 'ORS data removed successfully',
      route: updatedRoute
    });

  } catch (error: unknown) {
    console.error('Error removing ORS data:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid route ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to remove ORS data' },
      { status: 500 }
    );
  }
}
```

<!-- path: app/api/routes/route.ts -->
```typescript
// app/api/routes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { RouteModel, SurveyPointModel, IRoute } from '@/lib/models/Route';
import { SurveyPoint } from '@/types';

interface CreateRouteBody {
  _id?: string; // The client will send this, but we will ignore it.
  name: string;
  description?: string;
  points?: SurveyPoint[];
  [key: string]: unknown;
}

// GET function remains the same
export async function GET() {
  try {
    await connectDB();
    const routesFromDb = await RouteModel.find()
      .populate('points')
      .sort({ createdAt: -1 })
      .lean();

    // Ensure points is always an array, even if population fails or is empty
    const routes = routesFromDb.map((route) => ({
      ...route,
      points: route.points || [],
    }));

    return NextResponse.json(routes);
  } catch (error: unknown) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body: CreateRouteBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Route name is required' },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    try {
      const newRoute = await session.withTransaction(
        async (): Promise<IRoute> => {
          // --- THIS IS THE FIX ---
          // Destructure the client-side _id and points away from the main route data.
          // We let Mongoose generate its own _id.
          const { _id, points, ...routeDetails } = body;

          const routeData = { ...routeDetails, path: body.path || [], points: [] };

          // Create the route document without the client-provided _id.
          const route = new RouteModel(routeData);
          await route.save({ session });
          // --- END OF FIX ---

          if (points && points.length > 0) {
            const pointDocs = points.map((point: SurveyPoint) => {
              const { _id: pointId, ...pointData } = point; // Also remove client-side point _id
              return { ...pointData, routeId: route._id }; // Use the new, real route ObjectId
            });

            const savedPoints = await SurveyPointModel.insertMany(pointDocs, {
              session,
            });
            const pointIds = savedPoints.map((p) => p._id);

            route.points = pointIds;
            await route.save({ session });
          }

          return route;
        }
      );

      const populatedRoute = await RouteModel.findById(newRoute._id)
        .populate('points')
        .lean();
      return NextResponse.json(populatedRoute, { status: 201 });
    } finally {
      await session.endSession();
    }
  } catch (error: unknown) {
    console.error('Error creating route:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 11000
    ) {
      return NextResponse.json(
        { error: 'Route with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    );
  }
}
```

<!-- path: app/api/auth/[...nextauth]/route.ts -->
```typescript
import { handlers } from "@/auth" // Referring to the auth.ts we just created
export const { GET, POST } = handlers
```

<!-- path: app/api/auth/delete-account/route.ts -->
```typescript
import { getSession, requireAuth } from '@/lib/auth-utils';
import { successResponse } from '@/utils/apiResponse';
import { handleApiError } from '@/utils/errorHandler';
import mongoose from 'mongoose'; // Import mongoose for transactions

// Use the unified Mongoose connection and all necessary models
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Account from '@/lib/models/Account';
import Session from '@/lib/models/Session';
import { RouteModel } from '@/lib/models/Route';

export async function DELETE() {
  await connectDB();
  const session = await mongoose.startSession();

  try {
    const authSession = await getSession();
    requireAuth(authSession);
    const userId = authSession.user.id;

    await session.withTransaction(async () => {
      // All operations within this block are part of the transaction
      await RouteModel.deleteMany({ userId: userId }, { session });
      await Session.deleteMany({ userId: userId }, { session });
      await Account.deleteMany({ userId: userId }, { session });
      const deletedUser = await User.findByIdAndDelete(userId, { session });

      if (!deletedUser) {
        // If the user was not found, we should abort the transaction
        throw new Error('User not found during transaction.');
      }
    });

    return successResponse({ deleted: true }, 'Account deleted successfully');
  } catch (error) {
    // If withTransaction fails, it will throw an error caught here
    return handleApiError(error);
  } finally {
    // Always end the session
    await session.endSession();
  }
}

```

<!-- path: app/api/auth/verify-email/route.ts -->
```typescript
import { getSession, requireAuth } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import VerificationToken from '@/lib/models/VerificationToken';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { handleApiError } from '@/utils/errorHandler';
import { randomBytes } from 'crypto';

// POST /api/auth/verify-email - Request email verification
export async function POST() {
  try {
    const session = await getSession();
    requireAuth(session);

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.emailVerified) {
      return errorResponse('Email is already verified', 400);
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing verification tokens for this user
    await VerificationToken.deleteMany({ identifier: user.email });

    // Create new verification token
    await VerificationToken.create({
      identifier: user.email,
      token,
      expires,
    });

    // In a real app, you would send an email here
    // For demo purposes, we'll just return success
    // console.log(`Verification token for ${user.email}: ${token}`);

    return successResponse(
      { sent: true },
      'Verification email sent successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/auth/verify-email - Verify email with token
export async function PATCH(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return errorResponse('Token and email are required', 400);
    }

    await connectDB();

    // Find and validate verification token
    const verificationToken = await VerificationToken.findOne({
      identifier: email,
      token,
      expires: { $gt: new Date() },
    });

    if (!verificationToken) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    // Update user email verification status
    const user = await User.findOneAndUpdate(
      { email },
      {
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Delete the verification token
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    return successResponse(
      { verified: true },
      'Email verified successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

<!-- path: app/api/points/route.ts -->
```typescript
// app/api/points/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { SurveyPointModel } from '@/lib/models/Route';
import { SurveyPoint } from '@/types';


// GET /api/points?routeId=xxx - Get points for a route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json(
        { error: 'routeId is required' },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!isValidObjectId(routeId)) {
      return NextResponse.json(
        { error: 'Invalid routeId format' },
        { status: 400 }
      );
    }

    await connectDB();
    const points = await SurveyPointModel.find({ routeId })
      .sort({ timestamp: 1 })
      .lean();

    return NextResponse.json(points);
  } catch (error: unknown) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}

// POST /api/points - Create a new survey point
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    let body: SurveyPoint;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Basic validation
    if (!body.routeId || typeof body.routeId !== 'string') {
      return NextResponse.json(
        { error: 'routeId is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!isValidObjectId(body.routeId)) {
      return NextResponse.json(
        { error: 'Invalid routeId format' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (typeof body.location.lat !== 'number' || typeof body.location.lng !== 'number') {
      return NextResponse.json(
        { error: 'lat and lng are required and must be numbers' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (body.location.lat < -90 || body.location.lat > 90) {
      return NextResponse.json(
        { error: 'lat must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (body.location.lng < -180 || body.location.lng > 180) {
      return NextResponse.json(
        { error: 'lng must be between -180 and 180' },
        { status: 400 }
      );
    }

    // Validate timestamp if provided
    if (body.timestamp) {
      const timestamp = new Date(body.timestamp);
      if (isNaN(timestamp.getTime())) {
        return NextResponse.json(
          { error: 'Invalid timestamp format' },
          { status: 400 }
        );
      }
      body.timestamp = timestamp;
    } else {
      body.timestamp = new Date();
    }

    const point = new SurveyPointModel(body);
    await point.save();

    return NextResponse.json(point.toJSON(), { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating point:', error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ObjectId references)
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate point data' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create point' },
      { status: 500 }
    );
  }
}
```

<!-- path: app/manifest.json -->
```json
{
  "name": "Route Survey App",
  "short_name": "RouteSurvey",
  "description": "A comprehensive route and site survey application with GPS tracking",
  "icons": [
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

<!-- path: app/actions/upload.ts -->
```typescript
'use server';

import { put } from '@vercel/blob';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10
);

export async function uploadPhoto(formData: FormData) {
  const file = formData.get('photo') as File;

  if (!file || file.size === 0) {
    return { error: 'No photo provided.' };
  }

  if (file.size > 4.5 * 1024 * 1024) {
    return { error: 'File size must be less than 4.5MB.' };
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Only JPG, PNG, and WebP formats are supported.' };
  }

  const filename = `${nanoid()}-${file.name}`;

  try {
    const blob = await put(filename, file, {
      access: 'public',
    });

    return { url: blob.url };

  } catch (error) {
    console.error('File upload failed:', error);
    return { error: 'Failed to upload photo.' };
  }
}
```

<!-- path: app/actions/ors.ts -->
```typescript
'use server';

import { auth } from '@/auth';
import ORSService, { ORSProfileType, ORSDirectionsResponse } from '@/lib/services/orsService';
import { Location } from '@/types';
import { simplifyPath } from '@/utils/routeCalculations'; // We need this utility now

export async function processRouteWithORS(path: Location[], profile: ORSProfileType): Promise<ORSDirectionsResponse> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const orsApiKey = process.env.ORS_API_KEY;
  if (!orsApiKey) {
    throw new Error('Server configuration error');
  }

  if (path.length < 2) {
    throw new Error("Route must have at least 2 points to process.");
  }

  const orsService = new ORSService(orsApiKey);
  const initialCoordinates = ORSService.locationToORS(path);

  // --- STEP 1: SNAP THE POINTS ---
  const snapResult = await orsService.snapPointsToRoad({
    coordinates: initialCoordinates,
    profile,
    radius: 100,
  });

  if (!snapResult.locations || snapResult.locations.length < 2) {
    throw new Error("Could not snap enough points to the road network.");
  }

  const snappedPoints = snapResult.locations.map(waypoint => ({
    lat: waypoint.location[1],
    lng: waypoint.location[0]
  }));

  // ✅ FIX: Simplify the snapped path to 50 points if it's too long
  const waypointsForDirections = snappedPoints.length > 50
    ? simplifyPath(snappedPoints, 50)
    : snappedPoints;

  const waypointsCoordinates = ORSService.locationToORS(waypointsForDirections);

  // --- STEP 2: GET DIRECTIONS BETWEEN THE (SIMPLIFIED) SNAPPED POINTS ---
  const directionsResult = await orsService.getDirections({
    coordinates: waypointsCoordinates,
    profile,
  });

  return directionsResult;
}

```

<!-- path: app/page.tsx -->
```typescript
// app/page.tsx
'use client';

import { useRef, useCallback } from 'react';
import { MapViewRef } from '@/components/MapView';
import { RouteList } from '@/components/RouteList';
import { SurveyHeader } from '@/components/SurveyHeader';
import { SurveySidebar } from '@/components/SurveySidebar';
import { PageHeader } from '@/components/common/PageHeader';
import { AddPointModal } from '@/components/modal/AddPointModal';
import { DeleteConfirmationModal } from '@/components/modal/DeleteConfirmationModal';
import { ProcessingStatusModal } from '@/components/modal/ProcessingStatusModal';
import { OfflineOutbox } from '@/components/route-list/OfflineOutbox';
import OfflineStatus from '@/components/pwa/offline-status';
import PWAInstallPrompt from '@/components/pwa/InstallPrompt';

import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuthSync } from '@/hooks/useAuthSync';
import { useSurveyManager } from '@/hooks/useSurveyManager';
import { usePointInteractionManager } from '@/hooks/usePointInteractionManager';
import { useDisplayRoute } from '@/hooks/useDisplayRoute';
import { useWakeLock } from '@/hooks/useWakeLock';
import {
  useDeleteRoute,
  useRoutes,
  useSaveRoute,
  useUpdateRouteData,
} from '@/lib/react-query';
import MapView from '@/components/MapView';

import {
  useSelectedRouteForView,
  useSetSelectedRouteForView,
  useAllowLocationUpdate,
  useSetAllowLocationUpdate,
  useActiveMainTab,
  useSetActiveMainTab,
  useSidebarCollapsed,
  useMobileSidebarOpen,
  useSetMobileSidebarOpen,
  useIsWakeLockEnabled,
} from '@/store/uiStore';
import {
  useGpsLocation,
  useRequestLocation,
  useGpsAccuracy,
} from '@/store/gpsStore';
import {
  useSurveyStore,
  useCurrentRoute,
  useStartSurvey,
  usePauseSurvey,
  useResumeSurvey,
  useStopSurvey,
  useClearCurrentSurvey,
  useSetCurrentRoute,
  useIsTracking,
  useSetSurveyFromServer,
} from '@/store/surveyStore';
import {
  useProcessingStatus,
  useProcessingError,
  useSetProcessingStatus,
} from '@/store/orsStore';
import { PointTypeValue, Route } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { deleteRouteFromOutbox } from '@/lib/outbox-db';

const SurveyApp: React.FC = () => {
  const { user } = useAuth();
  useAuthSync();
  useSurveyManager();
  const mapRef = useRef<MapViewRef | null>(null);

  const {
    data: routes = [],
    isLoading: areRoutesLoading,
    refetch: refetchRoutes,
  } = useRoutes();
  const saveRouteMutation = useSaveRoute();
  const updateRouteMutation = useUpdateRouteData();
  const deleteRouteMutation = useDeleteRoute();

  const selectedRouteForView = useSelectedRouteForView();
  const setSelectedRouteForView = useSetSelectedRouteForView();
  const allowLocationUpdate = useAllowLocationUpdate();
  const setAllowLocationUpdate = useSetAllowLocationUpdate();
  const activeMainTab = useActiveMainTab();
  const setActiveMainTab = useSetActiveMainTab();
  const sidebarCollapsed = useSidebarCollapsed();
  const mobileSidebarOpen = useMobileSidebarOpen();
  const setMobileSidebarOpen = useSetMobileSidebarOpen();
  const isWakeLockEnabled = useIsWakeLockEnabled();

  const location = useGpsLocation();
  const requestLocation = useRequestLocation();
  const accuracy = useGpsAccuracy();

  // --- THIS IS PART OF THE FIX ---
  // Read currentRoute reactively here
  const currentRoute = useCurrentRoute();
  // --- END FIX ---

  const isTracking = useIsTracking();
  const startSurvey = useStartSurvey();
  const setSurveyFromServer = useSetSurveyFromServer();
  const pauseSurvey = usePauseSurvey();
  const resumeSurvey = useResumeSurvey();
  const stopSurvey = useStopSurvey();
  const clearCurrentSurvey = useClearCurrentSurvey();
  const setCurrentRoute = useSetCurrentRoute();

  const processingStatus = useProcessingStatus();
  const processingError = useProcessingError();
  const setProcessingStatus = useSetProcessingStatus();

  const { displayRoute } = useDisplayRoute();
  const {
    isPointModalOpen,
    pointToEditOrAdd,
    pointToDelete,
    handleMapClick,
    handleEditPoint,
    handleDeleteRequest,
    handleConfirmDelete,
    handleCancelDelete,
    handleSavePoint,
    handleCloseModal,
  } = usePointInteractionManager();

  useWakeLock(isTracking || isWakeLockEnabled);

  const handleQuickAdd = useCallback(
    (pointType: PointTypeValue) => {
      if (location) {
        handleMapClick([location.lat, location.lng], pointType);
      } else {
        toast.error('Current location not available.');
      }
    },
    [location, handleMapClick]
  );

  const handleStartSurvey = useCallback(
    async ({
      name,
      description = '',
    }: {
      name: string;
      description?: string;
    }) => {
      if (!user?._id) {
        toast.error('You must be logged in to start a survey.');
        return;
      }
      startSurvey(name, description);
      const newRouteStub = {
        userId: user._id,
        name,
        description,
        startTime: new Date(),
        status: 'active' as const,
        points: [],
        path: [],
      };
      const promise = saveRouteMutation
        .mutateAsync(newRouteStub)
        .then((savedRouteFromServer) => {
          setSurveyFromServer(savedRouteFromServer);
          requestLocation?.();
          return savedRouteFromServer;
        });
      toast.promise(promise, {
        loading: 'Creating new survey...',
        success: (data) => `Survey "${data.name}" started successfully!`,
        error: (err) => {
          clearCurrentSurvey();
          return `Failed to start survey: ${(err as Error).message}`;
        },
      });
    },
    [
      user,
      startSurvey,
      saveRouteMutation,
      setSurveyFromServer,
      requestLocation,
      clearCurrentSurvey,
    ]
  );

  const handlePauseSurvey = useCallback(() => {
    if (!currentRoute?._id) return;
    pauseSurvey();
    updateRouteMutation.mutate({
      id: currentRoute._id,
      data: { status: 'paused' },
    });
  }, [currentRoute, pauseSurvey, updateRouteMutation]);

  const handleResumeSurvey = useCallback(() => {
    if (!currentRoute?._id) return;
    resumeSurvey();
    updateRouteMutation.mutate({
      id: currentRoute._id,
      data: { status: 'active' },
    });
  }, [currentRoute, resumeSurvey, updateRouteMutation]);

  const handleStopSurvey = useCallback(() => {
    if (!currentRoute?._id) return;

    stopSurvey();
    const finalRouteData = useSurveyStore.getState().currentRoute;

    if (finalRouteData?._id) {
      const promise = updateRouteMutation
        .mutateAsync({ id: finalRouteData._id, data: finalRouteData })
        .then(() => {
          clearCurrentSurvey();
        });

      toast.promise(promise, {
        loading: 'Finalizing and saving route...',
        success: 'Route saved successfully!',
        error: 'Failed to save the final route data.',
      });
    }
  }, [currentRoute, stopSurvey, updateRouteMutation, clearCurrentSurvey]);

  // --- THIS IS THE MAIN FIX ---
  // The function now uses the reactive `currentRoute` variable and includes it in the dependency array.
  const handleSelectRoute = useCallback(
    (route: Route | null) => {
      if (route && (route.status === 'active' || route.status === 'paused')) {
        if (currentRoute && currentRoute._id !== route._id) {
          if (
            !confirm(
              'You have an active survey. Switching will pause it. Continue?'
            )
          )
            return;
          if (currentRoute._id) {
            updateRouteMutation.mutate({
              id: currentRoute._id,
              data: { status: 'paused' },
            });
          }
        }
        setCurrentRoute(route);
      }
      setSelectedRouteForView(route);
      setActiveMainTab('map');
      if (mobileSidebarOpen) setMobileSidebarOpen(false);
    },
    [
      currentRoute,
      setCurrentRoute,
      setSelectedRouteForView,
      setActiveMainTab,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      updateRouteMutation,
    ]
  );
  // --- END FIX ---

  const handleDeleteRoute = useCallback(() => {
    if (selectedRouteForView) setSelectedRouteForView(null);
    refetchRoutes();
  }, [refetchRoutes, selectedRouteForView, setSelectedRouteForView]);

  const handleClearCurrentSurvey = useCallback(async () => {
    if (!currentRoute?._id) return;

    if (
      !confirm(
        'Are you sure you want to permanently delete this survey? This action cannot be undone.'
      )
    ) {
      return;
    }

    const promise = async () => {
      await deleteRouteMutation.mutateAsync(currentRoute._id!);
      try {
        await deleteRouteFromOutbox(currentRoute._id!);
      } catch (e) {
        console.log(e);

        /* Ignore */
      }

      clearCurrentSurvey();

      if (selectedRouteForView?._id === currentRoute._id) {
        setSelectedRouteForView(null);
      }
    };

    toast.promise(promise(), {
      loading: 'Deleting survey...',
      success: 'Survey has been deleted.',
      error: (err) => `Failed to delete survey: ${(err as Error).message}`,
    });
  }, [
    currentRoute,
    deleteRouteMutation,
    clearCurrentSurvey,
    selectedRouteForView,
    setSelectedRouteForView,
  ]);

  const handleCloseProcessingModal = useCallback(
    () => setProcessingStatus('idle'),
    [setProcessingStatus]
  );
  const isMobile = useIsMobile();

  return (
    <>
      <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden">
        <SurveyHeader routesCount={routes.length} />
        <div className="flex-1 flex overflow-hidden">
          {activeMainTab === 'map' ? (
            <>
              <div className="relative flex-1 flex flex-col h-full">
                <MapView
                  ref={mapRef}
                  currentLocation={location}
                  route={displayRoute}
                  onMapClick={handleMapClick}
                  isMobile={isMobile}
                  allowLocationUpdate={allowLocationUpdate}
                  handleToggleLocationUpdate={setAllowLocationUpdate}
                  accuracy={accuracy}
                  onEditPoint={handleEditPoint}
                  onDeletePoint={handleDeleteRequest}
                  onLocationRefresh={requestLocation}
                  sidebarCollapsed={sidebarCollapsed}
                />
              </div>
              {!isMobile && !sidebarCollapsed && (
                <div className="w-1 bg-gray-300 hover:bg-blue-400 dark:bg-gray-600 dark:hover:bg-blue-500 cursor-col-resize" />
              )}
              <SurveySidebar
                onStartSurvey={handleStartSurvey}
                onPauseSurvey={handlePauseSurvey}
                onResumeSurvey={handleResumeSurvey}
                onStopSurvey={handleStopSurvey}
                onClearSurvey={handleClearCurrentSurvey}
                onQuickAdd={handleQuickAdd}
              />
            </>
          ) : (
            <div className="flex-1 p-2 md:p-4 dark:bg-gray-900 overflow-y-auto">
              <div className="sm:p-6 lg:p-8">
                <PageHeader
                  title="Route History"
                  description={`You have recorded ${routes.length} routes.`}
                />
                <OfflineOutbox />
                <div className="mt-6">
                  <RouteList
                    routes={routes}
                    onSelectRoute={handleSelectRoute}
                    onDeleteRoute={handleDeleteRoute}
                    isLoading={areRoutesLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <AddPointModal
        isOpen={isPointModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePoint}
        pointData={pointToEditOrAdd}
      />
      <DeleteConfirmationModal
        routeId={pointToDelete?._id || null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <ProcessingStatusModal
        isOpen={processingStatus !== 'idle'}
        status={processingStatus}
        error={processingError}
        onClose={handleCloseProcessingModal}
      />
      <PWAInstallPrompt />
      <OfflineStatus />
    </>
  );
};

export default SurveyApp;

```

<!-- path: app/server/page.tsx -->
```typescript
import { auth } from "@/auth"

export default async function Page() {
  const session = await auth()
  if (!session) return <div>Not authenticated</div>

  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}
```

<!-- path: app/login/page.tsx -->
```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading(provider);
      setError(null);

      const result = await signIn(provider, {
        callbackUrl: '/',
        redirect: false,
      });

      if (result?.url) {
        window.location.href = result.url;
      } else if (result?.error) {
        setError('Sign in failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during sign in');
      setIsLoading(null);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Route Survey
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Sign in to start mapping your routes
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-center space-x-3">
              <HiOutlineExclamationCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Sign In Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-6">
              Choose your sign-in method
            </h3>

            {/* Google Sign In */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'google' ? (
                <LoadingSpinner size="sm" className="mr-3" />
              ) : (
                <FcGoogle className="h-5 w-5 mr-3" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Continue with Google
              </span>
            </button>

            {/* GitHub Sign In */}
            <button
              onClick={() => handleSignIn('github')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'github' ? (
                <LoadingSpinner size="sm" className="mr-3" />
              ) : (
                <FaGithub className="h-5 w-5 mr-3 text-gray-900 dark:text-gray-200" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Continue with GitHub
              </span>
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New to Route Survey?{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Just sign in to get started!
              </span>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
```

<!-- path: app/actions.ts -->
```typescript
'use server'

import webpush, { PushSubscription } from 'web-push'

const vapidContact = process.env.VAPID_EMAIL || 'sdetmharinavi@gmail.com';

webpush.setVapidDetails(
  `mailto:${vapidContact}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: PushSubscription | null = null

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub
  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null
  return { success: true }
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Test Notification',
        body: message,
        icon: '/icon.png',
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}
```

<!-- path: app/layout.tsx -->
```typescript
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProviders } from '@/providers/QueryProviders';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata export - no viewport properties
export const metadata: Metadata = {
  title: 'Route Survey App',
  description:
    'A comprehensive route and site survey application with GPS tracking',
  manifest: '/manifest.json',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Route Survey App',
    description:
      'A comprehensive route and site survey application with GPS tracking',
    url: '/',
    siteName: 'Route Survey App',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/icon1.png',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

// Viewport export - all viewport-related properties
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProviders>{children}</QueryProviders>
        <Toaster richColors />
      </body>
    </html>
  );
}

```

<!-- path: app/unauthorized/page.tsx -->
```typescript
'use client';

import { signOut } from 'next-auth/react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto h-16 w-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <HiOutlineExclamationCircle className="h-8 w-8 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Access Denied
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Your account is currently not active. It might be pending approval or has been suspended.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          If you believe this is an error, please contact support.
        </p>
        <div className="pt-6">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
```

<!-- path: types/tabs.ts -->
```typescript
// Main navigation tabs (used in header/desktop navigation)
export type MainTab = 'map' | 'routes';

// Mobile control tabs (used in mobile bottom navigation)
export type MobileTab = 'controls' | 'points' | 'stats';

// Combined type for all possible tabs
export type AllTabs = MainTab | MobileTab;

```

<!-- path: types/index.ts -->
```typescript
// types/index.ts

import {
  Home,
  Cable,
  Zap,
  Navigation,
  Cpu,
  ArrowLeftRight,
  Radio,
} from 'lucide-react';

export interface Location {
  lat: number;
  lng: number;
}

export interface SurveyPoint {
  _id?: string;
  routeId: string;
  location: Location;
  timestamp: Date;
  notes: string;
  photos?: string[];
  elevation?: number;
  accuracy?: number;
  address?: string;
  pointType: PointTypeValue;
  metadata?: {
    signal_strength?: number;
    weather?: string;
    temperature?: number;
    [key: string]: any;
  };
}

export interface RouteStats {
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  efficiency: number;
}

export interface RouteORSData {
  processedPath: Location[];
  originalPath: Location[];
  routeStats: RouteStats;
  profile: string;
  processedAt: Date;
  processingMetadata?: {
    processingTime?: number;
    batchCount?: number;
    apiCalls?: number;
  };
}

export interface RouteMetadata {
  hasORSData?: boolean;
  orsProcessingVersion?: string;
}

export interface Route {
  _id?: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
  totalDistance?: number;
  totalDuration?: number;
  points: SurveyPoint[];
  path: Location[];
  createdAt: Date;
  updatedAt: Date;
  orsData?: RouteORSData;
  metadata?: RouteMetadata;
}

// NEW: State (the data) is now separate from actions.
export interface SurveyDataState {
  currentRoute: Route | null;
  isTracking: boolean;
  currentLocation: Location | null;
}

// NEW: Actions (the functions) are defined separately.
export interface SurveyActions {
  startSurvey: (name: string, description: string) => void;
  pauseSurvey: () => void;
  resumeSurvey: () => void;
  stopSurvey: () => void;
  addSurveyPoint: (point: Omit<SurveyPoint, 'routeId' | 'timestamp'>) => void;
  updateCurrentLocation: (location: Location) => void;
  requestLocation: () => void;
}

export const pointTypes = [
  {
    value: 'UG_JC',
    label: 'Underground JC',
    icon: Cable,
    color: 'bg-blue-500',
    shortLabel: 'UG',
  },
  {
    value: 'OH_JC',
    label: 'Overhead JC',
    icon: Zap,
    color: 'bg-green-500',
    shortLabel: 'OH',
  },
  {
    value: 'Post',
    label: 'Post',
    icon: Navigation,
    color: 'bg-red-500',
    shortLabel: 'POST',
  },
  {
    value: 'Transformer',
    label: 'Transformer',
    icon: Cpu,
    color: 'bg-purple-500',
    shortLabel: 'TRANS',
  },
  {
    value: 'Exchange',
    label: 'Exchange',
    icon: ArrowLeftRight,
    color: 'bg-yellow-500',
    shortLabel: 'EXCH',
  },
  {
    value: 'BTS',
    label: 'BTS',
    icon: Radio,
    color: 'bg-pink-500',
    shortLabel: 'BTS',
  },
  {
    value: 'Customer_Premises',
    label: 'Customer Premises',
    icon: Home,
    color: 'bg-gray-500',
    shortLabel: 'CUST',
  },
] as const;

export type PointTypeValue = (typeof pointTypes)[number]['value'];

export const ORSProfiles = [
  { value: 'foot-walking', label: 'Walking', icon: '🚶' },
  { value: 'foot-hiking', label: 'Hiking', icon: '🥾' },
  { value: 'cycling-regular', label: 'Cycling', icon: '🚲' },
  { value: 'cycling-road', label: 'Road Cycling', icon: '🚴' },
  { value: 'cycling-mountain', label: 'Mountain Bike', icon: '🚵' },
  { value: 'driving-car', label: 'Car', icon: '🚗' },
  { value: 'wheelchair', label: 'Wheelchair', icon: '♿' },
];

```

<!-- path: types/global.d.ts -->
```typescript
import mongoose from 'mongoose';

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;

  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }

  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
}

export {};

```

<!-- path: types/auth.ts -->
```typescript
import { UserStatus } from "@/lib/models/User";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      status?: UserStatus;
    } & DefaultSession["user"];
  }

  // For database strategy, the User interface should match your database user object
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
    status?: UserStatus;
  }
}
```

<!-- path: constants/index.ts -->
```typescript
import { LatLngTuple } from "leaflet";

// Constants
export const DEFAULT_CENTER: LatLngTuple = [22.415991, 88.415893];
export const MAP_ZOOM_LEVEL = 15;
```

<!-- path: package-lock.json -->
```json
{
  "name": "route-survey-app",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "route-survey-app",
      "version": "0.1.0",
      "dependencies": {
        "@auth/mongodb-adapter": "^3.10.0",
        "@hookform/resolvers": "^5.2.1",
        "@radix-ui/react-dialog": "^1.1.15",
        "@radix-ui/react-dropdown-menu": "^2.1.16",
        "@radix-ui/react-label": "^2.1.7",
        "@radix-ui/react-slot": "^1.2.3",
        "@radix-ui/react-switch": "^1.2.6",
        "@tanstack/react-query": "^5.85.9",
        "@tanstack/react-query-devtools": "^5.87.1",
        "@vercel/blob": "^1.1.1",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "date-fns": "^4.1.0",
        "idb": "^8.0.3",
        "immer": "^10.1.3",
        "leaflet": "^1.9.4",
        "lucide-react": "^0.542.0",
        "mongodb": "^6.19.0",
        "mongoose": "^8.18.1",
        "next": "15.5.2",
        "next-auth": "^5.0.0-beta.29",
        "react": "19.1.0",
        "react-dom": "19.1.0",
        "react-hook-form": "^7.62.0",
        "react-icons": "^5.5.0",
        "react-leaflet": "^5.0.0",
        "react-leaflet-markercluster": "^5.0.0-rc.0",
        "sonner": "^2.0.7",
        "tailwind-merge": "^3.3.1",
        "uuid": "^11.1.0",
        "web-push": "^3.6.7",
        "zod": "^4.1.5",
        "zustand": "^5.0.8"
      },
      "devDependencies": {
        "@eslint/eslintrc": "^3",
        "@tailwindcss/postcss": "^4",
        "@tanstack/eslint-plugin-query": "^5.83.1",
        "@testing-library/react": "^16.3.0",
        "@types/leaflet": "^1.9.20",
        "@types/node": "^20.19.12",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "@types/react-leaflet-markercluster": "^3.0.4",
        "@types/uuid": "^10.0.0",
        "@types/web-push": "^3.6.4",
        "@vitejs/plugin-react": "^5.0.2",
        "@vitest/ui": "^3.2.4",
        "eslint": "^9",
        "eslint-config-next": "15.5.2",
        "jsdom": "^27.0.0",
        "tailwindcss": "^4",
        "tw-animate-css": "^1.3.8",
        "typescript": "^5",
        "vitest": "^3.2.4"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@asamuzakjp/css-color": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/@asamuzakjp/css-color/-/css-color-4.0.4.tgz",
      "integrity": "sha512-cKjSKvWGmAziQWbCouOsFwb14mp1betm8Y7Fn+yglDMUUu3r9DCbJ9iJbeFDenLMqFbIMC0pQP8K+B8LAxX3OQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@csstools/css-calc": "^2.1.4",
        "@csstools/css-color-parser": "^3.0.10",
        "@csstools/css-parser-algorithms": "^3.0.5",
        "@csstools/css-tokenizer": "^3.0.4",
        "lru-cache": "^11.1.0"
      }
    },
    "node_modules/@asamuzakjp/css-color/node_modules/lru-cache": {
      "version": "11.2.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.2.1.tgz",
      "integrity": "sha512-r8LA6i4LP4EeWOhqBaZZjDWwehd1xUJPCJd9Sv300H0ZmcUER4+JPh7bqqZeqs1o5pgtgvXm+d9UGrB5zZGDiQ==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@asamuzakjp/dom-selector": {
      "version": "6.5.4",
      "resolved": "https://registry.npmjs.org/@asamuzakjp/dom-selector/-/dom-selector-6.5.4.tgz",
      "integrity": "sha512-RNSNk1dnB8lAn+xdjlRoM4CzdVrHlmXZtSXAWs2jyl4PiBRWqTZr9ML5M710qgd9RPTBsVG6P0SLy7dwy0Foig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@asamuzakjp/nwsapi": "^2.3.9",
        "bidi-js": "^1.0.3",
        "css-tree": "^3.1.0",
        "is-potential-custom-element-name": "^1.0.1"
      }
    },
    "node_modules/@asamuzakjp/nwsapi": {
      "version": "2.3.9",
      "resolved": "https://registry.npmjs.org/@asamuzakjp/nwsapi/-/nwsapi-2.3.9.tgz",
      "integrity": "sha512-n8GuYSrI9bF7FFZ/SjhwevlHc8xaVlb/7HmHelnc/PZXBD2ZR49NnN9sMMuDdEGPeeRQ5d0hqlSlEpgCX3Wl0Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@auth/core": {
      "version": "0.40.0",
      "resolved": "https://registry.npmjs.org/@auth/core/-/core-0.40.0.tgz",
      "integrity": "sha512-n53uJE0RH5SqZ7N1xZoMKekbHfQgjd0sAEyUbE+IYJnmuQkbvuZnXItCU7d+i7Fj8VGOgqvNO7Mw4YfBTlZeQw==",
      "license": "ISC",
      "dependencies": {
        "@panva/hkdf": "^1.2.1",
        "jose": "^6.0.6",
        "oauth4webapi": "^3.3.0",
        "preact": "10.24.3",
        "preact-render-to-string": "6.5.11"
      },
      "peerDependencies": {
        "@simplewebauthn/browser": "^9.0.1",
        "@simplewebauthn/server": "^9.0.2",
        "nodemailer": "^6.8.0"
      },
      "peerDependenciesMeta": {
        "@simplewebauthn/browser": {
          "optional": true
        },
        "@simplewebauthn/server": {
          "optional": true
        },
        "nodemailer": {
          "optional": true
        }
      }
    },
    "node_modules/@auth/mongodb-adapter": {
      "version": "3.10.0",
      "resolved": "https://registry.npmjs.org/@auth/mongodb-adapter/-/mongodb-adapter-3.10.0.tgz",
      "integrity": "sha512-xDBeDDaCwY8yABrF0Nsb31I3MkuZJ57DCby2ikcOu9ydvCG7gKs2aNZf90J8rUj1sXXiIxIAY1WP0+KM8jJB7Q==",
      "license": "ISC",
      "dependencies": {
        "@auth/core": "0.40.0"
      },
      "peerDependencies": {
        "mongodb": "^6"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.27.1.tgz",
      "integrity": "sha512-cjQ7ZlQ0Mv3b47hABuTevyTuYN4i+loJKGeV9flcCgIK37cCXRh+L1bd3iBHlynerhQ7BhCkn2BPbQUL+rGqFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.27.1",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.28.4.tgz",
      "integrity": "sha512-YsmSKC29MJwf0gF8Rjjrg5LQCmyh+j/nD8/eP7f+BeoQTKYqs9RoWbjGOdy0+1Ekr68RJZMUOPVQaQisnIo4Rw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.28.4.tgz",
      "integrity": "sha512-2BCOP7TN8M+gVDj7/ht3hsaO/B/n5oDbiAyyvnRlNOs+u1o+JWNYTQrmpuNp1/Wq2gcFrI01JAW+paEKDMx/CA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/generator": "^7.28.3",
        "@babel/helper-compilation-targets": "^7.27.2",
        "@babel/helper-module-transforms": "^7.28.3",
        "@babel/helpers": "^7.28.4",
        "@babel/parser": "^7.28.4",
        "@babel/template": "^7.27.2",
        "@babel/traverse": "^7.28.4",
        "@babel/types": "^7.28.4",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/core/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.28.3",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.28.3.tgz",
      "integrity": "sha512-3lSpxGgvnmZznmBkCRnVREPUFJv2wrv9iAoFDvADJc0ypmdOxdUtcLeBgBJ6zE0PMeTKnxeQzyk0xTBq4Ep7zw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.28.3",
        "@babel/types": "^7.28.2",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.27.2",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.27.2.tgz",
      "integrity": "sha512-2+1thGUUWWjLTYTHZWK1n8Yga0ijBz1XAhUXcKy81rd5g6yh7hGqMp45v7cadSbEHc9G3OTv45SyneRN3ps4DQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.27.2",
        "@babel/helper-validator-option": "^7.27.1",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.28.0.tgz",
      "integrity": "sha512-+W6cISkXFa1jXsDEdYA8HeevQT/FULhxzR99pxphltZcVaugps53THCeiWA8SguxxpSp3gKPiuYfSWopkLQ4hw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.27.1.tgz",
      "integrity": "sha512-0gSFWUPNXNopqtIPQvlD5WgXYI5GY2kP2cCvoT8kczjbfcfuIljTbcWrulD1CIPIX2gt1wghbDy08yE1p+/r3w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.27.1",
        "@babel/types": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.28.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.28.3.tgz",
      "integrity": "sha512-gytXUbs8k2sXS9PnQptz5o0QnpLL51SwASIORY6XaBKF88nsOT0Zw9szLqlSGQDP/4TljBAD5y98p2U1fqkdsw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.27.1",
        "@babel/helper-validator-identifier": "^7.27.1",
        "@babel/traverse": "^7.28.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.27.1.tgz",
      "integrity": "sha512-1gn1Up5YXka3YYAHGKpbideQ5Yjf1tDa9qYcgysz+cNCXukyLl6DjPXhD3VRwSb8c0J9tA4b2+rHEZtc6R0tlw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz",
      "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.27.1.tgz",
      "integrity": "sha512-D2hP9eA+Sqx1kBZgzxZh0y1trbuU+JoDkiEwqhQ36nodYqJwyEIhPSdMNd7lOm/4io72luTPWH20Yda0xOuUow==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.27.1.tgz",
      "integrity": "sha512-YvjJow9FxbhFFKDSuFnVCe2WxXk1zWc22fFePVNEaWJEu8IrZVlda6N0uHwzZrUM1il7NC9Mlp4MaJYbYd9JSg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.28.4.tgz",
      "integrity": "sha512-HFN59MmQXGHVyYadKLVumYsA9dBFun/ldYxipEjzA4196jpLZd8UjEEBLkbEkvfYreDqJhZxYAWFPtrfhNpj4w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.27.2",
        "@babel/types": "^7.28.4"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.28.4.tgz",
      "integrity": "sha512-yZbBqeM6TkpP9du/I2pUZnJsRMGGvOuIrhjzC1AwHwW+6he4mni6Bp/m8ijn0iOuZuPI2BfkCoSRunpyjnrQKg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.28.4"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-self": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-self/-/plugin-transform-react-jsx-self-7.27.1.tgz",
      "integrity": "sha512-6UzkCs+ejGdZ5mFFC/OCUrv028ab2fp1znZmCZjAOBKiBK2jXD1O+BPSfX8X2qjJ75fZBMSnQn3Rq2mrBJK2mw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-source": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-source/-/plugin-transform-react-jsx-source-7.27.1.tgz",
      "integrity": "sha512-zbwoTsBruTeKB9hSq73ha66iFeJHuaFkUbwvqElnygoNbj/jHRsSeokowZFN3CZ64IvEqcmmkVe89OPXc7ldAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.28.4.tgz",
      "integrity": "sha512-Q/N6JNWvIvPnLDvjlE1OUBLPQHH6l3CltCEsHIujp45zQUSSh8K+gHnaEX45yAT1nyngnINhvWtzN+Nb9D8RAQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.27.2",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.27.2.tgz",
      "integrity": "sha512-LPDZ85aEJyYSd18/DkjNh4/y1ntkE5KwUHWTiqgRxruuZL2F1yuHligVHLvcHY2vMHXttKFpJn6LwfI7cw7ODw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/parser": "^7.27.2",
        "@babel/types": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.28.4.tgz",
      "integrity": "sha512-YEzuboP2qvQavAcjgQNVgsvHIDv6ZpwXvcvjmyySP2DIMuByS/6ioU5G9pYrWHM6T2YDfc7xga9iNzYOs12CFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/generator": "^7.28.3",
        "@babel/helper-globals": "^7.28.0",
        "@babel/parser": "^7.28.4",
        "@babel/template": "^7.27.2",
        "@babel/types": "^7.28.4",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.28.4.tgz",
      "integrity": "sha512-bkFqkLhh3pMBUQQkpVgWDWq/lqzc2678eUyDlTBhRqhCHFguYYGM0Efga7tYk4TogG/3x0EEl66/OQ+WGbWB/Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.27.1",
        "@babel/helper-validator-identifier": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@csstools/color-helpers": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/@csstools/color-helpers/-/color-helpers-5.1.0.tgz",
      "integrity": "sha512-S11EXWJyy0Mz5SYvRmY8nJYTFFd1LCNV+7cXyAgQtOOuzb4EsgfqDufL+9esx72/eLhsRdGZwaldu/h+E4t4BA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/csstools"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/csstools"
        }
      ],
      "license": "MIT-0",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@csstools/css-calc": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/@csstools/css-calc/-/css-calc-2.1.4.tgz",
      "integrity": "sha512-3N8oaj+0juUw/1H3YwmDDJXCgTB1gKU6Hc/bB502u9zR0q2vd786XJH9QfrKIEgFlZmhZiq6epXl4rHqhzsIgQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/csstools"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/csstools"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "@csstools/css-parser-algorithms": "^3.0.5",
        "@csstools/css-tokenizer": "^3.0.4"
      }
    },
    "node_modules/@csstools/css-color-parser": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@csstools/css-color-parser/-/css-color-parser-3.1.0.tgz",
      "integrity": "sha512-nbtKwh3a6xNVIp/VRuXV64yTKnb1IjTAEEh3irzS+HkKjAOYLTGNb9pmVNntZ8iVBHcWDA2Dof0QtPgFI1BaTA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/csstools"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/csstools"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "@csstools/color-helpers": "^5.1.0",
        "@csstools/css-calc": "^2.1.4"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "@csstools/css-parser-algorithms": "^3.0.5",
        "@csstools/css-tokenizer": "^3.0.4"
      }
    },
    "node_modules/@csstools/css-parser-algorithms": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/@csstools/css-parser-algorithms/-/css-parser-algorithms-3.0.5.tgz",
      "integrity": "sha512-DaDeUkXZKjdGhgYaHNJTV9pV7Y9B3b644jCLs9Upc3VeNGg6LWARAT6O+Q+/COo+2gg/bM5rhpMAtf70WqfBdQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/csstools"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/csstools"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "@csstools/css-tokenizer": "^3.0.4"
      }
    },
    "node_modules/@csstools/css-syntax-patches-for-csstree": {
      "version": "1.0.14",
      "resolved": "https://registry.npmjs.org/@csstools/css-syntax-patches-for-csstree/-/css-syntax-patches-for-csstree-1.0.14.tgz",
      "integrity": "sha512-zSlIxa20WvMojjpCSy8WrNpcZ61RqfTfX3XTaOeVlGJrt/8HF3YbzgFZa01yTbT4GWQLwfTcC3EB8i3XnB647Q==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/csstools"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/csstools"
        }
      ],
      "license": "MIT-0",
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/@csstools/css-tokenizer": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@csstools/css-tokenizer/-/css-tokenizer-3.0.4.tgz",
      "integrity": "sha512-Vd/9EVDiu6PPJt9yAh6roZP6El1xHrdvIVGjyBsHR0RYwNHgL7FJPyIIW4fANJNG6FtyZfvlRPpFI4ZM/lubvw==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/csstools"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/csstools"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@emnapi/core": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.5.0.tgz",
      "integrity": "sha512-sbP8GzB1WDzacS8fgNPpHlp6C9VZe+SJP3F90W9rLemaQj2PzIuTEl1qDOYQf58YIpyjViI24y9aPWCjEzY2cg==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/wasi-threads": "1.1.0",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.5.0.tgz",
      "integrity": "sha512-97/BJ3iXHww3djw6hYIfErCZFee7qCtrneuLa20UXFCOTCfBM2cvQHjWJ2EG0s0MtdNwInarqCTz35i4wWXHsQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/wasi-threads": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.1.0.tgz",
      "integrity": "sha512-WI0DdZ8xFSbgMjR1sFsKABJ/C5OnRrjT06JXbZKexJGrDuPTzZdDYfFlsgcCXCyf+suG5QU2e/y1Wo2V/OapLQ==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.25.9.tgz",
      "integrity": "sha512-OaGtL73Jck6pBKjNIe24BnFE6agGl+6KxDtTfHhy1HmhthfKouEcOhqpSL64K4/0WCtbKFLOdzD/44cJ4k9opA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.25.9.tgz",
      "integrity": "sha512-5WNI1DaMtxQ7t7B6xa572XMXpHAaI/9Hnhk8lcxF4zVN4xstUgTlvuGDorBguKEnZO70qwEcLpfifMLoxiPqHQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.25.9.tgz",
      "integrity": "sha512-IDrddSmpSv51ftWslJMvl3Q2ZT98fUSL2/rlUXuVqRXHCs5EUF1/f+jbjF5+NG9UffUDMCiTyh8iec7u8RlTLg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.25.9.tgz",
      "integrity": "sha512-I853iMZ1hWZdNllhVZKm34f4wErd4lMyeV7BLzEExGEIZYsOzqDWDf+y082izYUE8gtJnYHdeDpN/6tUdwvfiw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.9.tgz",
      "integrity": "sha512-XIpIDMAjOELi/9PB30vEbVMs3GV1v2zkkPnuyRRURbhqjyzIINwj+nbQATh4H9GxUgH1kFsEyQMxwiLFKUS6Rg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.25.9.tgz",
      "integrity": "sha512-jhHfBzjYTA1IQu8VyrjCX4ApJDnH+ez+IYVEoJHeqJm9VhG9Dh2BYaJritkYK3vMaXrf7Ogr/0MQ8/MeIefsPQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.25.9.tgz",
      "integrity": "sha512-z93DmbnY6fX9+KdD4Ue/H6sYs+bhFQJNCPZsi4XWJoYblUqT06MQUdBCpcSfuiN72AbqeBFu5LVQTjfXDE2A6Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.25.9.tgz",
      "integrity": "sha512-mrKX6H/vOyo5v71YfXWJxLVxgy1kyt1MQaD8wZJgJfG4gq4DpQGpgTB74e5yBeQdyMTbgxp0YtNj7NuHN0PoZg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.25.9.tgz",
      "integrity": "sha512-HBU2Xv78SMgaydBmdor38lg8YDnFKSARg1Q6AT0/y2ezUAKiZvc211RDFHlEZRFNRVhcMamiToo7bDx3VEOYQw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.25.9.tgz",
      "integrity": "sha512-BlB7bIcLT3G26urh5Dmse7fiLmLXnRlopw4s8DalgZ8ef79Jj4aUcYbk90g8iCa2467HX8SAIidbL7gsqXHdRw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.25.9.tgz",
      "integrity": "sha512-e7S3MOJPZGp2QW6AK6+Ly81rC7oOSerQ+P8L0ta4FhVi+/j/v2yZzx5CqqDaWjtPFfYz21Vi1S0auHrap3Ma3A==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.25.9.tgz",
      "integrity": "sha512-Sbe10Bnn0oUAB2AalYztvGcK+o6YFFA/9829PhOCUS9vkJElXGdphz0A3DbMdP8gmKkqPmPcMJmJOrI3VYB1JQ==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.25.9.tgz",
      "integrity": "sha512-YcM5br0mVyZw2jcQeLIkhWtKPeVfAerES5PvOzaDxVtIyZ2NUBZKNLjC5z3/fUlDgT6w89VsxP2qzNipOaaDyA==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.25.9.tgz",
      "integrity": "sha512-++0HQvasdo20JytyDpFvQtNrEsAgNG2CY1CLMwGXfFTKGBGQT3bOeLSYE2l1fYdvML5KUuwn9Z8L1EWe2tzs1w==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.25.9.tgz",
      "integrity": "sha512-uNIBa279Y3fkjV+2cUjx36xkx7eSjb8IvnL01eXUKXez/CBHNRw5ekCGMPM0BcmqBxBcdgUWuUXmVWwm4CH9kg==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.25.9.tgz",
      "integrity": "sha512-Mfiphvp3MjC/lctb+7D287Xw1DGzqJPb/J2aHHcHxflUo+8tmN/6d4k6I2yFR7BVo5/g7x2Monq4+Yew0EHRIA==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.25.9.tgz",
      "integrity": "sha512-iSwByxzRe48YVkmpbgoxVzn76BXjlYFXC7NvLYq+b+kDjyyk30J0JY47DIn8z1MO3K0oSl9fZoRmZPQI4Hklzg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.25.9.tgz",
      "integrity": "sha512-9jNJl6FqaUG+COdQMjSCGW4QiMHH88xWbvZ+kRVblZsWrkXlABuGdFJ1E9L7HK+T0Yqd4akKNa/lO0+jDxQD4Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.25.9.tgz",
      "integrity": "sha512-RLLdkflmqRG8KanPGOU7Rpg829ZHu8nFy5Pqdi9U01VYtG9Y0zOG6Vr2z4/S+/3zIyOxiK6cCeYNWOFR9QP87g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.25.9.tgz",
      "integrity": "sha512-YaFBlPGeDasft5IIM+CQAhJAqS3St3nJzDEgsgFixcfZeyGPCd6eJBWzke5piZuZ7CtL656eOSYKk4Ls2C0FRQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.25.9.tgz",
      "integrity": "sha512-1MkgTCuvMGWuqVtAvkpkXFmtL8XhWy+j4jaSO2wxfJtilVCi0ZE37b8uOdMItIHz4I6z1bWWtEX4CJwcKYLcuA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.25.9.tgz",
      "integrity": "sha512-4Xd0xNiMVXKh6Fa7HEJQbrpP3m3DDn43jKxMjxLLRjWnRsfxjORYJlXPO4JNcXtOyfajXorRKY9NkOpTHptErg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.25.9.tgz",
      "integrity": "sha512-WjH4s6hzo00nNezhp3wFIAfmGZ8U7KtrJNlFMRKxiI9mxEK1scOMAaa9i4crUtu+tBr+0IN6JCuAcSBJZfnphw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.25.9.tgz",
      "integrity": "sha512-mGFrVJHmZiRqmP8xFOc6b84/7xa5y5YvR1x8djzXpJBSv/UsNK6aqec+6JDjConTgvvQefdGhFDAs2DLAds6gQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.25.9.tgz",
      "integrity": "sha512-b33gLVU2k11nVx1OhX3C8QQP6UHQK4ZtN56oFWvVXvz2VkDoe6fbG8TOgHFxEvqeqohmRnIHe5A1+HADk4OQww==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.25.9.tgz",
      "integrity": "sha512-PPOl1mi6lpLNQxnGoyAfschAodRFYXJ+9fs6WHXz7CSWKbOqiMZsubC+BQsVKuul+3vKLuwTHsS2c2y9EoKwxQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@eslint-community/eslint-utils": {
      "version": "4.9.0",
      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.9.0.tgz",
      "integrity": "sha512-ayVFHdtZ+hsq1t2Dy24wCmGXGe4q9Gu3smhLYALJrr473ZH27MsnSL+LKUlimp4BWJqMDMLmPpx/Q9R3OAlL4g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eslint-visitor-keys": "^3.4.3"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      },
      "peerDependencies": {
        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
      }
    },
    "node_modules/@eslint-community/regexpp": {
      "version": "4.12.1",
      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.12.1.tgz",
      "integrity": "sha512-CCZCDJuduB9OUkFkY2IgppNZMi2lBQgD2qzwXkEia16cge2pijY/aXi96CJMquDMn3nJdlPV1A5KrJEXwfLNzQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
      }
    },
    "node_modules/@eslint/config-array": {
      "version": "0.21.0",
      "resolved": "https://registry.npmjs.org/@eslint/config-array/-/config-array-0.21.0.tgz",
      "integrity": "sha512-ENIdc4iLu0d93HeYirvKmrzshzofPw6VkZRKQGe9Nv46ZnWUzcF1xV01dcvEg/1wXUR61OmmlSfyeyO7EvjLxQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/object-schema": "^2.1.6",
        "debug": "^4.3.1",
        "minimatch": "^3.1.2"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/config-helpers": {
      "version": "0.3.1",
      "resolved": "https://registry.npmjs.org/@eslint/config-helpers/-/config-helpers-0.3.1.tgz",
      "integrity": "sha512-xR93k9WhrDYpXHORXpxVL5oHj3Era7wo6k/Wd8/IsQNnZUTzkGS29lyn3nAT05v6ltUuTFVCCYDEGfy2Or/sPA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/core": {
      "version": "0.15.2",
      "resolved": "https://registry.npmjs.org/@eslint/core/-/core-0.15.2.tgz",
      "integrity": "sha512-78Md3/Rrxh83gCxoUc0EiciuOHsIITzLy53m3d9UyiW8y9Dj2D29FeETqyKA+BRK76tnTp6RXWb3pCay8Oyomg==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@types/json-schema": "^7.0.15"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/eslintrc": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-3.3.1.tgz",
      "integrity": "sha512-gtF186CXhIl1p4pJNGZw8Yc6RlshoePRvE0X91oPGb3vZ8pM3qOS9W9NGPat9LziaBV7XrJWGylNQXkGcnM3IQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^6.12.4",
        "debug": "^4.3.2",
        "espree": "^10.0.1",
        "globals": "^14.0.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.1.0",
        "minimatch": "^3.1.2",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint/js": {
      "version": "9.35.0",
      "resolved": "https://registry.npmjs.org/@eslint/js/-/js-9.35.0.tgz",
      "integrity": "sha512-30iXE9whjlILfWobBkNerJo+TXYsgVM5ERQwMcMKCHckHflCmf7wXDAHlARoWnh0s1U72WqlbeyE7iAcCzuCPw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      }
    },
    "node_modules/@eslint/object-schema": {
      "version": "2.1.6",
      "resolved": "https://registry.npmjs.org/@eslint/object-schema/-/object-schema-2.1.6.tgz",
      "integrity": "sha512-RBMg5FRL0I0gs51M/guSAj5/e14VQ4tpZnQNWwuDT66P14I43ItmPfIZRhO9fUVIPOAQXU47atlywZ/czoqFPA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/plugin-kit": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.3.5.tgz",
      "integrity": "sha512-Z5kJ+wU3oA7MMIqVR9tyZRtjYPr4OC004Q4Rw7pgOKUOKkJfZ3O24nz3WYfGRpMDNmcOi3TwQOmgm7B7Tpii0w==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/core": "^0.15.2",
        "levn": "^0.4.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@fastify/busboy": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/@fastify/busboy/-/busboy-2.1.1.tgz",
      "integrity": "sha512-vBZP4NlzfOlerQTnba4aqZoMhE/a9HY7HRqoOPaETQcSQuWEIyZMHGfVu6w9wGtGK5fED5qRs2DteVCjOH60sA==",
      "license": "MIT",
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@floating-ui/core": {
      "version": "1.7.3",
      "resolved": "https://registry.npmjs.org/@floating-ui/core/-/core-1.7.3.tgz",
      "integrity": "sha512-sGnvb5dmrJaKEZ+LDIpguvdX3bDlEllmv4/ClQ9awcmCZrlx5jQyyMWFM5kBI+EyNOCDDiKk8il0zeuX3Zlg/w==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/utils": "^0.2.10"
      }
    },
    "node_modules/@floating-ui/dom": {
      "version": "1.7.4",
      "resolved": "https://registry.npmjs.org/@floating-ui/dom/-/dom-1.7.4.tgz",
      "integrity": "sha512-OOchDgh4F2CchOX94cRVqhvy7b3AFb+/rQXyswmzmGakRfkMgoWVjfnLWkRirfLEfuD4ysVW16eXzwt3jHIzKA==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/core": "^1.7.3",
        "@floating-ui/utils": "^0.2.10"
      }
    },
    "node_modules/@floating-ui/react-dom": {
      "version": "2.1.6",
      "resolved": "https://registry.npmjs.org/@floating-ui/react-dom/-/react-dom-2.1.6.tgz",
      "integrity": "sha512-4JX6rEatQEvlmgU80wZyq9RT96HZJa88q8hp0pBd+LrczeDI4o6uA2M+uvxngVHo4Ihr8uibXxH6+70zhAFrVw==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/dom": "^1.7.4"
      },
      "peerDependencies": {
        "react": ">=16.8.0",
        "react-dom": ">=16.8.0"
      }
    },
    "node_modules/@floating-ui/utils": {
      "version": "0.2.10",
      "resolved": "https://registry.npmjs.org/@floating-ui/utils/-/utils-0.2.10.tgz",
      "integrity": "sha512-aGTxbpbg8/b5JfU1HXSrbH3wXZuLPJcNEcZQFMxLs3oSzgtVu6nFPkbbGGUvBcUjKV2YyB9Wxxabo+HEH9tcRQ==",
      "license": "MIT"
    },
    "node_modules/@hookform/resolvers": {
      "version": "5.2.2",
      "resolved": "https://registry.npmjs.org/@hookform/resolvers/-/resolvers-5.2.2.tgz",
      "integrity": "sha512-A/IxlMLShx3KjV/HeTcTfaMxdwy690+L/ZADoeaTltLx+CVuzkeVIPuybK3jrRfw7YZnmdKsVVHAlEPIAEUNlA==",
      "license": "MIT",
      "dependencies": {
        "@standard-schema/utils": "^0.3.0"
      },
      "peerDependencies": {
        "react-hook-form": "^7.55.0"
      }
    },
    "node_modules/@humanfs/core": {
      "version": "0.19.1",
      "resolved": "https://registry.npmjs.org/@humanfs/core/-/core-0.19.1.tgz",
      "integrity": "sha512-5DyQ4+1JEUzejeK1JGICcideyfUbGixgS9jNgex5nqkW+cY7WZhxBigmieN5Qnw9ZosSNVC9KQKyb+GUaGyKUA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/node": {
      "version": "0.16.7",
      "resolved": "https://registry.npmjs.org/@humanfs/node/-/node-0.16.7.tgz",
      "integrity": "sha512-/zUx+yOsIrG4Y43Eh2peDeKCxlRt/gET6aHfaKpuq267qXdYDFViVHfMaLyygZOnl0kGWxFIgsBy8QFuTLUXEQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@humanfs/core": "^0.19.1",
        "@humanwhocodes/retry": "^0.4.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/retry": {
      "version": "0.4.3",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.4.3.tgz",
      "integrity": "sha512-bV0Tgo9K4hfPCek+aMAn81RppFKv2ySDQeMoSZuvTASywNTnVJCArCZE2FWqpvIatKu7VMRLWlR1EazvVhDyhQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@img/sharp-darwin-arm64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-arm64/-/sharp-darwin-arm64-0.34.3.tgz",
      "integrity": "sha512-ryFMfvxxpQRsgZJqBd4wsttYQbCxsJksrv9Lw/v798JcQ8+w84mBWuXwl+TT0WJ/WrYOLaYpwQXi3sA9nTIaIg==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-arm64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-darwin-x64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-x64/-/sharp-darwin-x64-0.34.3.tgz",
      "integrity": "sha512-yHpJYynROAj12TA6qil58hmPmAwxKKC7reUqtGLzsOHfP7/rniNGTL8tjWX6L3CTV4+5P4ypcS7Pp+7OB+8ihA==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-x64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-arm64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-arm64/-/sharp-libvips-darwin-arm64-1.2.0.tgz",
      "integrity": "sha512-sBZmpwmxqwlqG9ueWFXtockhsxefaV6O84BMOrhtg/YqbTaRdqDE7hxraVE3y6gVM4eExmfzW4a8el9ArLeEiQ==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-x64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-x64/-/sharp-libvips-darwin-x64-1.2.0.tgz",
      "integrity": "sha512-M64XVuL94OgiNHa5/m2YvEQI5q2cl9d/wk0qFTDVXcYzi43lxuiFTftMR1tOnFQovVXNZJ5TURSDK2pNe9Yzqg==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm/-/sharp-libvips-linux-arm-1.2.0.tgz",
      "integrity": "sha512-mWd2uWvDtL/nvIzThLq3fr2nnGfyr/XMXlq8ZJ9WMR6PXijHlC3ksp0IpuhK6bougvQrchUAfzRLnbsen0Cqvw==",
      "cpu": [
        "arm"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm64/-/sharp-libvips-linux-arm64-1.2.0.tgz",
      "integrity": "sha512-RXwd0CgG+uPRX5YYrkzKyalt2OJYRiJQ8ED/fi1tq9WQW2jsQIn0tqrlR5l5dr/rjqq6AHAxURhj2DVjyQWSOA==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-ppc64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-ppc64/-/sharp-libvips-linux-ppc64-1.2.0.tgz",
      "integrity": "sha512-Xod/7KaDDHkYu2phxxfeEPXfVXFKx70EAFZ0qyUdOjCcxbjqyJOEUpDe6RIyaunGxT34Anf9ue/wuWOqBW2WcQ==",
      "cpu": [
        "ppc64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-s390x": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-s390x/-/sharp-libvips-linux-s390x-1.2.0.tgz",
      "integrity": "sha512-eMKfzDxLGT8mnmPJTNMcjfO33fLiTDsrMlUVcp6b96ETbnJmd4uvZxVJSKPQfS+odwfVaGifhsB07J1LynFehw==",
      "cpu": [
        "s390x"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-x64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-x64/-/sharp-libvips-linux-x64-1.2.0.tgz",
      "integrity": "sha512-ZW3FPWIc7K1sH9E3nxIGB3y3dZkpJlMnkk7z5tu1nSkBoCgw2nSRTFHI5pB/3CQaJM0pdzMF3paf9ckKMSE9Tg==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-arm64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-arm64/-/sharp-libvips-linuxmusl-arm64-1.2.0.tgz",
      "integrity": "sha512-UG+LqQJbf5VJ8NWJ5Z3tdIe/HXjuIdo4JeVNADXBFuG7z9zjoegpzzGIyV5zQKi4zaJjnAd2+g2nna8TZvuW9Q==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-x64": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-x64/-/sharp-libvips-linuxmusl-x64-1.2.0.tgz",
      "integrity": "sha512-SRYOLR7CXPgNze8akZwjoGBoN1ThNZoqpOgfnOxmWsklTGVfJiGJoC/Lod7aNMGA1jSsKWM1+HRX43OP6p9+6Q==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-linux-arm": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm/-/sharp-linux-arm-0.34.3.tgz",
      "integrity": "sha512-oBK9l+h6KBN0i3dC8rYntLiVfW8D8wH+NPNT3O/WBHeW0OQWCjfWksLUaPidsrDKpJgXp3G3/hkmhptAW0I3+A==",
      "cpu": [
        "arm"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm": "1.2.0"
      }
    },
    "node_modules/@img/sharp-linux-arm64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm64/-/sharp-linux-arm64-0.34.3.tgz",
      "integrity": "sha512-QdrKe3EvQrqwkDrtuTIjI0bu6YEJHTgEeqdzI3uWJOH6G1O8Nl1iEeVYRGdj1h5I21CqxSvQp1Yv7xeU3ZewbA==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-linux-ppc64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-ppc64/-/sharp-linux-ppc64-0.34.3.tgz",
      "integrity": "sha512-GLtbLQMCNC5nxuImPR2+RgrviwKwVql28FWZIW1zWruy6zLgA5/x2ZXk3mxj58X/tszVF69KK0Is83V8YgWhLA==",
      "cpu": [
        "ppc64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-ppc64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-linux-s390x": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-s390x/-/sharp-linux-s390x-0.34.3.tgz",
      "integrity": "sha512-3gahT+A6c4cdc2edhsLHmIOXMb17ltffJlxR0aC2VPZfwKoTGZec6u5GrFgdR7ciJSsHT27BD3TIuGcuRT0KmQ==",
      "cpu": [
        "s390x"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-s390x": "1.2.0"
      }
    },
    "node_modules/@img/sharp-linux-x64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-x64/-/sharp-linux-x64-0.34.3.tgz",
      "integrity": "sha512-8kYso8d806ypnSq3/Ly0QEw90V5ZoHh10yH0HnrzOCr6DKAPI6QVHvwleqMkVQ0m+fc7EH8ah0BB0QPuWY6zJQ==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-x64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-linuxmusl-arm64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-arm64/-/sharp-linuxmusl-arm64-0.34.3.tgz",
      "integrity": "sha512-vAjbHDlr4izEiXM1OTggpCcPg9tn4YriK5vAjowJsHwdBIdx0fYRsURkxLG2RLm9gyBq66gwtWI8Gx0/ov+JKQ==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-linuxmusl-x64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-x64/-/sharp-linuxmusl-x64-0.34.3.tgz",
      "integrity": "sha512-gCWUn9547K5bwvOn9l5XGAEjVTTRji4aPTqLzGXHvIr6bIDZKNTA34seMPgM0WmSf+RYBH411VavCejp3PkOeQ==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-x64": "1.2.0"
      }
    },
    "node_modules/@img/sharp-wasm32": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-wasm32/-/sharp-wasm32-0.34.3.tgz",
      "integrity": "sha512-+CyRcpagHMGteySaWos8IbnXcHgfDn7pO2fiC2slJxvNq9gDipYBN42/RagzctVRKgxATmfqOSulgZv5e1RdMg==",
      "cpu": [
        "wasm32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/runtime": "^1.4.4"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-arm64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-arm64/-/sharp-win32-arm64-0.34.3.tgz",
      "integrity": "sha512-MjnHPnbqMXNC2UgeLJtX4XqoVHHlZNd+nPt1kRPmj63wURegwBhZlApELdtxM2OIZDRv/DFtLcNhVbd1z8GYXQ==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-ia32": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-ia32/-/sharp-win32-ia32-0.34.3.tgz",
      "integrity": "sha512-xuCdhH44WxuXgOM714hn4amodJMZl3OEvf0GVTm0BEyMeA2to+8HEdRPShH0SLYptJY1uBw+SCFP9WVQi1Q/cw==",
      "cpu": [
        "ia32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-x64": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-x64/-/sharp-win32-x64-0.34.3.tgz",
      "integrity": "sha512-OWwz05d++TxzLEv4VnsTz5CmZ6mI6S05sfQGEMrNrQcOEERbX46332IvE7pO/EUiw7jUrrS40z/M7kPyjfl04g==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@isaacs/fs-minipass": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/@isaacs/fs-minipass/-/fs-minipass-4.0.1.tgz",
      "integrity": "sha512-wgm9Ehl2jpeqP3zw/7mo3kRHFp5MEDhqAdwy1fTGkHAwnkGOVsgpvQhL8B5n1qlb01jV3n/bI0ZfZp5lWA1k4w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^7.0.4"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@mongodb-js/saslprep": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@mongodb-js/saslprep/-/saslprep-1.3.0.tgz",
      "integrity": "sha512-zlayKCsIjYb7/IdfqxorK5+xUMyi4vOKcFy10wKJYc63NSdKI8mNME+uJqfatkPmOSMMUiojrL58IePKBm3gvQ==",
      "license": "MIT",
      "dependencies": {
        "sparse-bitfield": "^3.0.3"
      }
    },
    "node_modules/@napi-rs/wasm-runtime": {
      "version": "0.2.12",
      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-0.2.12.tgz",
      "integrity": "sha512-ZVWUcfwY4E/yPitQJl481FjFo3K22D6qF0DuFH6Y/nbnE11GY5uguDxZMGXPQ8WQ0128MXQD7TnfHyK4oWoIJQ==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.4.3",
        "@emnapi/runtime": "^1.4.3",
        "@tybys/wasm-util": "^0.10.0"
      }
    },
    "node_modules/@next/env": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/env/-/env-15.5.2.tgz",
      "integrity": "sha512-Qe06ew4zt12LeO6N7j8/nULSOe3fMXE4dM6xgpBQNvdzyK1sv5y4oAP3bq4LamrvGCZtmRYnW8URFCeX5nFgGg==",
      "license": "MIT"
    },
    "node_modules/@next/eslint-plugin-next": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/eslint-plugin-next/-/eslint-plugin-next-15.5.2.tgz",
      "integrity": "sha512-lkLrRVxcftuOsJNhWatf1P2hNVfh98k/omQHrCEPPriUypR6RcS13IvLdIrEvkm9AH2Nu2YpR5vLqBuy6twH3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-glob": "3.3.1"
      }
    },
    "node_modules/@next/eslint-plugin-next/node_modules/fast-glob": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.1.tgz",
      "integrity": "sha512-kNFPyjhh5cKjrUltxs+wFx+ZkbRaxxmZ+X0ZU31SOsxCEtP9VPgtq2teZw1DebupL5GmDaNQ6yKMMVcM41iqDg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/@next/eslint-plugin-next/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/@next/swc-darwin-arm64": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-arm64/-/swc-darwin-arm64-15.5.2.tgz",
      "integrity": "sha512-8bGt577BXGSd4iqFygmzIfTYizHb0LGWqH+qgIF/2EDxS5JsSdERJKA8WgwDyNBZgTIIA4D8qUtoQHmxIIquoQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-darwin-x64": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-x64/-/swc-darwin-x64-15.5.2.tgz",
      "integrity": "sha512-2DjnmR6JHK4X+dgTXt5/sOCu/7yPtqpYt8s8hLkHFK3MGkka2snTv3yRMdHvuRtJVkPwCGsvBSwmoQCHatauFQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-gnu": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-gnu/-/swc-linux-arm64-gnu-15.5.2.tgz",
      "integrity": "sha512-3j7SWDBS2Wov/L9q0mFJtEvQ5miIqfO4l7d2m9Mo06ddsgUK8gWfHGgbjdFlCp2Ek7MmMQZSxpGFqcC8zGh2AA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-musl": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-musl/-/swc-linux-arm64-musl-15.5.2.tgz",
      "integrity": "sha512-s6N8k8dF9YGc5T01UPQ08yxsK6fUow5gG1/axWc1HVVBYQBgOjca4oUZF7s4p+kwhkB1bDSGR8QznWrFZ/Rt5g==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-gnu": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-15.5.2.tgz",
      "integrity": "sha512-o1RV/KOODQh6dM6ZRJGZbc+MOAHww33Vbs5JC9Mp1gDk8cpEO+cYC/l7rweiEalkSm5/1WGa4zY7xrNwObN4+Q==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-musl": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-15.5.2.tgz",
      "integrity": "sha512-/VUnh7w8RElYZ0IV83nUcP/J4KJ6LLYliiBIri3p3aW2giF+PAVgZb6mk8jbQSB3WlTai8gEmCAr7kptFa1H6g==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-arm64-msvc": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-arm64-msvc/-/swc-win32-arm64-msvc-15.5.2.tgz",
      "integrity": "sha512-sMPyTvRcNKXseNQ/7qRfVRLa0VhR0esmQ29DD6pqvG71+JdVnESJaHPA8t7bc67KD5spP3+DOCNLhqlEI2ZgQg==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-x64-msvc": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-15.5.2.tgz",
      "integrity": "sha512-W5VvyZHnxG/2ukhZF/9Ikdra5fdNftxI6ybeVKYvBPDtyx7x4jPPSNduUkfH5fo3zG0JQ0bPxgy41af2JX5D4Q==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nolyfill/is-core-module": {
      "version": "1.0.39",
      "resolved": "https://registry.npmjs.org/@nolyfill/is-core-module/-/is-core-module-1.0.39.tgz",
      "integrity": "sha512-nn5ozdjYQpUCZlWGuxcJY/KpxkWQs4DcbMCmKojjyrYDEAGy4Ce19NN4v5MduafTwJlbKc99UA8YhSVqq9yPZA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.4.0"
      }
    },
    "node_modules/@panva/hkdf": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@panva/hkdf/-/hkdf-1.2.1.tgz",
      "integrity": "sha512-6oclG6Y3PiDFcoyk8srjLfVKyMfVCKJ27JwNPViuXziFpmdz+MZnZN/aKY0JGXgYuO/VghU0jcOAZgWXZ1Dmrw==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/@polka/url": {
      "version": "1.0.0-next.29",
      "resolved": "https://registry.npmjs.org/@polka/url/-/url-1.0.0-next.29.tgz",
      "integrity": "sha512-wwQAWhWSuHaag8c4q/KN/vCoeOJYshAIvMQwD4GpSb3OiZklFfvAgmj0VCBBImRpuF/aFgIRzllXlVX93Jevww==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@radix-ui/primitive": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@radix-ui/primitive/-/primitive-1.1.3.tgz",
      "integrity": "sha512-JTF99U/6XIjCBo0wqkU5sK10glYe27MRRsfwoiq5zzOEZLHU3A3KCMa5X/azekYRCJ0HlwI0crAXS/5dEHTzDg==",
      "license": "MIT"
    },
    "node_modules/@radix-ui/react-arrow": {
      "version": "1.1.7",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-arrow/-/react-arrow-1.1.7.tgz",
      "integrity": "sha512-F+M1tLhO+mlQaOWspE8Wstg+z6PwxwRd8oQ8IXceWz92kfAmalTRf0EjrouQeo7QssEPfCn05B4Ihs1K9WQ/7w==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.1.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-collection": {
      "version": "1.1.7",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-collection/-/react-collection-1.1.7.tgz",
      "integrity": "sha512-Fh9rGN0MoI4ZFUNyfFVNU4y9LUz93u9/0K+yLgA2bwRojxM8JU1DyvvMBabnZPBgMWREAJvU2jjVzq+LrFUglw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-slot": "1.2.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-compose-refs": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-compose-refs/-/react-compose-refs-1.1.2.tgz",
      "integrity": "sha512-z4eqJvfiNnFMHIIvXP3CY57y2WJs5g2v3X0zm9mEJkrkNv4rDxu+sg9Jh8EkXyeqBkB7SOcboo9dMVqhyrACIg==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-context": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.2.tgz",
      "integrity": "sha512-jCi/QKUM2r1Ju5a3J64TH2A5SpKAgh0LpknyqdQ4m6DCV0xJ2HG1xARRwNGPQfi1SLdLWZ1OJz6F4OMBBNiGJA==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-dialog": {
      "version": "1.1.15",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.15.tgz",
      "integrity": "sha512-TCglVRtzlffRNxRMEyR36DGBLJpeusFcgMVD9PZEzAKnUs1lKCgX5u9BmC2Yg+LL9MgZDugFFs1Vl+Jp4t/PGw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.3",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-dismissable-layer": "1.1.11",
        "@radix-ui/react-focus-guards": "1.1.3",
        "@radix-ui/react-focus-scope": "1.1.7",
        "@radix-ui/react-id": "1.1.1",
        "@radix-ui/react-portal": "1.1.9",
        "@radix-ui/react-presence": "1.1.5",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-slot": "1.2.3",
        "@radix-ui/react-use-controllable-state": "1.2.2",
        "aria-hidden": "^1.2.4",
        "react-remove-scroll": "^2.6.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-direction": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-direction/-/react-direction-1.1.1.tgz",
      "integrity": "sha512-1UEWRX6jnOA2y4H5WczZ44gOOjTEmlqv1uNW4GAJEO5+bauCBhv8snY65Iw5/VOS/ghKN9gr2KjnLKxrsvoMVw==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-dismissable-layer": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dismissable-layer/-/react-dismissable-layer-1.1.11.tgz",
      "integrity": "sha512-Nqcp+t5cTB8BinFkZgXiMJniQH0PsUt2k51FUhbdfeKvc4ACcG2uQniY/8+h1Yv6Kza4Q7lD7PQV0z0oicE0Mg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.3",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-callback-ref": "1.1.1",
        "@radix-ui/react-use-escape-keydown": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-dropdown-menu": {
      "version": "2.1.16",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dropdown-menu/-/react-dropdown-menu-2.1.16.tgz",
      "integrity": "sha512-1PLGQEynI/3OX/ftV54COn+3Sud/Mn8vALg2rWnBLnRaGtJDduNW/22XjlGgPdpcIbiQxjKtb7BkcjP00nqfJw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.3",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-id": "1.1.1",
        "@radix-ui/react-menu": "2.1.16",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-controllable-state": "1.2.2"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-focus-guards": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-focus-guards/-/react-focus-guards-1.1.3.tgz",
      "integrity": "sha512-0rFg/Rj2Q62NCm62jZw0QX7a3sz6QCQU0LpZdNrJX8byRGaGVTqbrW9jAoIAHyMQqsNpeZ81YgSizOt5WXq0Pw==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-focus-scope": {
      "version": "1.1.7",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-focus-scope/-/react-focus-scope-1.1.7.tgz",
      "integrity": "sha512-t2ODlkXBQyn7jkl6TNaw/MtVEVvIGelJDCG41Okq/KwUsJBwQ4XVZsHAVUkK4mBv3ewiAS3PGuUWuY2BoK4ZUw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-callback-ref": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-id": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-id/-/react-id-1.1.1.tgz",
      "integrity": "sha512-kGkGegYIdQsOb4XjsfM97rXsiHaBwco+hFI66oO4s9LU+PLAC5oJ7khdOVFxkhsmlbpUqDAvXw11CluXP+jkHg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-layout-effect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-label": {
      "version": "2.1.7",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-label/-/react-label-2.1.7.tgz",
      "integrity": "sha512-YT1GqPSL8kJn20djelMX7/cTRp/Y9w5IZHvfxQTVHrOqa2yMl7i/UfMqKRU5V7mEyKTrUVgJXhNQPVCG8PBLoQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.1.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-menu": {
      "version": "2.1.16",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-menu/-/react-menu-2.1.16.tgz",
      "integrity": "sha512-72F2T+PLlphrqLcAotYPp0uJMr5SjP5SL01wfEspJbru5Zs5vQaSHb4VB3ZMJPimgHHCHG7gMOeOB9H3Hdmtxg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.3",
        "@radix-ui/react-collection": "1.1.7",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-direction": "1.1.1",
        "@radix-ui/react-dismissable-layer": "1.1.11",
        "@radix-ui/react-focus-guards": "1.1.3",
        "@radix-ui/react-focus-scope": "1.1.7",
        "@radix-ui/react-id": "1.1.1",
        "@radix-ui/react-popper": "1.2.8",
        "@radix-ui/react-portal": "1.1.9",
        "@radix-ui/react-presence": "1.1.5",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-roving-focus": "1.1.11",
        "@radix-ui/react-slot": "1.2.3",
        "@radix-ui/react-use-callback-ref": "1.1.1",
        "aria-hidden": "^1.2.4",
        "react-remove-scroll": "^2.6.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-popper": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-popper/-/react-popper-1.2.8.tgz",
      "integrity": "sha512-0NJQ4LFFUuWkE7Oxf0htBKS6zLkkjBH+hM1uk7Ng705ReR8m/uelduy1DBo0PyBXPKVnBA6YBlU94MBGXrSBCw==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/react-dom": "^2.0.0",
        "@radix-ui/react-arrow": "1.1.7",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-callback-ref": "1.1.1",
        "@radix-ui/react-use-layout-effect": "1.1.1",
        "@radix-ui/react-use-rect": "1.1.1",
        "@radix-ui/react-use-size": "1.1.1",
        "@radix-ui/rect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-portal": {
      "version": "1.1.9",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-portal/-/react-portal-1.1.9.tgz",
      "integrity": "sha512-bpIxvq03if6UNwXZ+HTK71JLh4APvnXntDc6XOX8UVq4XQOVl7lwok0AvIl+b8zgCw3fSaVTZMpAPPagXbKmHQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-layout-effect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-presence": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-presence/-/react-presence-1.1.5.tgz",
      "integrity": "sha512-/jfEwNDdQVBCNvjkGit4h6pMOzq8bHkopq458dPt2lMjx+eBQUohZNG9A7DtO/O5ukSbxuaNGXMjHicgwy6rQQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-use-layout-effect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-primitive": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-primitive/-/react-primitive-2.1.3.tgz",
      "integrity": "sha512-m9gTwRkhy2lvCPe6QJp4d3G1TYEUHn/FzJUtq9MjH46an1wJU+GdoGC5VLof8RX8Ft/DlpshApkhswDLZzHIcQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-slot": "1.2.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-roving-focus": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-roving-focus/-/react-roving-focus-1.1.11.tgz",
      "integrity": "sha512-7A6S9jSgm/S+7MdtNDSb+IU859vQqJ/QAtcYQcfFC6W8RS4IxIZDldLR0xqCFZ6DCyrQLjLPsxtTNch5jVA4lA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.3",
        "@radix-ui/react-collection": "1.1.7",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-direction": "1.1.1",
        "@radix-ui/react-id": "1.1.1",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-callback-ref": "1.1.1",
        "@radix-ui/react-use-controllable-state": "1.2.2"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-slot": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-slot/-/react-slot-1.2.3.tgz",
      "integrity": "sha512-aeNmHnBxbi2St0au6VBVC7JXFlhLlOnvIIlePNniyUNAClzmtAUEY8/pBiK3iHjufOlwA+c20/8jngo7xcrg8A==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.2"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-switch": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-switch/-/react-switch-1.2.6.tgz",
      "integrity": "sha512-bByzr1+ep1zk4VubeEVViV592vu2lHE2BZY5OnzehZqOOgogN80+mNtCqPkhn2gklJqOpxWgPoYTSnhBCqpOXQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.3",
        "@radix-ui/react-compose-refs": "1.1.2",
        "@radix-ui/react-context": "1.1.2",
        "@radix-ui/react-primitive": "2.1.3",
        "@radix-ui/react-use-controllable-state": "1.2.2",
        "@radix-ui/react-use-previous": "1.1.1",
        "@radix-ui/react-use-size": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-callback-ref": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-callback-ref/-/react-use-callback-ref-1.1.1.tgz",
      "integrity": "sha512-FkBMwD+qbGQeMu1cOHnuGB6x4yzPjho8ap5WtbEJ26umhgqVXbhekKUQO+hZEL1vU92a3wHwdp0HAcqAUF5iDg==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-controllable-state": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-controllable-state/-/react-use-controllable-state-1.2.2.tgz",
      "integrity": "sha512-BjasUjixPFdS+NKkypcyyN5Pmg83Olst0+c6vGov0diwTEo6mgdqVR6hxcEgFuh4QrAs7Rc+9KuGJ9TVCj0Zzg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-effect-event": "0.0.2",
        "@radix-ui/react-use-layout-effect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-effect-event": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-effect-event/-/react-use-effect-event-0.0.2.tgz",
      "integrity": "sha512-Qp8WbZOBe+blgpuUT+lw2xheLP8q0oatc9UpmiemEICxGvFLYmHm9QowVZGHtJlGbS6A6yJ3iViad/2cVjnOiA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-layout-effect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-escape-keydown": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-escape-keydown/-/react-use-escape-keydown-1.1.1.tgz",
      "integrity": "sha512-Il0+boE7w/XebUHyBjroE+DbByORGR9KKmITzbR7MyQ4akpORYP/ZmbhAr0DG7RmmBqoOnZdy2QlvajJ2QA59g==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-callback-ref": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-layout-effect": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-layout-effect/-/react-use-layout-effect-1.1.1.tgz",
      "integrity": "sha512-RbJRS4UWQFkzHTTwVymMTUv8EqYhOp8dOOviLj2ugtTiXRaRQS7GLGxZTLL1jWhMeoSCf5zmcZkqTl9IiYfXcQ==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-previous": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-previous/-/react-use-previous-1.1.1.tgz",
      "integrity": "sha512-2dHfToCj/pzca2Ck724OZ5L0EVrr3eHRNsG/b3xQJLA2hZpVCS99bLAX+hm1IHXDEnzU6by5z/5MIY794/a8NQ==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-rect": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-rect/-/react-use-rect-1.1.1.tgz",
      "integrity": "sha512-QTYuDesS0VtuHNNvMh+CjlKJ4LJickCMUAqjlE3+j8w+RlRpwyX3apEQKGFzbZGdo7XNG1tXa+bQqIE7HIXT2w==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/rect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-size": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-size/-/react-use-size-1.1.1.tgz",
      "integrity": "sha512-ewrXRDTAqAXlkl6t/fkXWNAhFX9I+CkKlw6zjEwk86RSPKwZr3xpBRso655aqYafwtnbpHLj6toFzmd6xdVptQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-layout-effect": "1.1.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/rect": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/rect/-/rect-1.1.1.tgz",
      "integrity": "sha512-HPwpGIzkl28mWyZqG52jiqDJ12waP11Pa1lGoiyUkIEuMLBP0oeK/C89esbXrxsky5we7dfd8U58nm0SgAWpVw==",
      "license": "MIT"
    },
    "node_modules/@react-leaflet/core": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/@react-leaflet/core/-/core-3.0.0.tgz",
      "integrity": "sha512-3EWmekh4Nz+pGcr+xjf0KNyYfC3U2JjnkWsh0zcqaexYqmmB5ZhH37kz41JXGmKzpaMZCnPofBBm64i+YrEvGQ==",
      "license": "Hippocratic-2.1",
      "peerDependencies": {
        "leaflet": "^1.9.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0"
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.0-beta.34",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.34.tgz",
      "integrity": "sha512-LyAREkZHP5pMom7c24meKmJCdhf2hEyvam2q0unr3or9ydwDL+DJ8chTF6Av/RFPb3rH8UFBdMzO5MxTZW97oA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@rollup/rollup-android-arm-eabi": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.50.2.tgz",
      "integrity": "sha512-uLN8NAiFVIRKX9ZQha8wy6UUs06UNSZ32xj6giK/rmMXAgKahwExvK6SsmgU5/brh4w/nSgj8e0k3c1HBQpa0A==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-android-arm64": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.50.2.tgz",
      "integrity": "sha512-oEouqQk2/zxxj22PNcGSskya+3kV0ZKH+nQxuCCOGJ4oTXBdNTbv+f/E3c74cNLeMO1S5wVWacSws10TTSB77g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-darwin-arm64": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.50.2.tgz",
      "integrity": "sha512-OZuTVTpj3CDSIxmPgGH8en/XtirV5nfljHZ3wrNwvgkT5DQLhIKAeuFSiwtbMto6oVexV0k1F1zqURPKf5rI1Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-darwin-x64": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.50.2.tgz",
      "integrity": "sha512-Wa/Wn8RFkIkr1vy1k1PB//VYhLnlnn5eaJkfTQKivirOvzu5uVd2It01ukeQstMursuz7S1bU+8WW+1UPXpa8A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-arm64": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.50.2.tgz",
      "integrity": "sha512-QkzxvH3kYN9J1w7D1A+yIMdI1pPekD+pWx7G5rXgnIlQ1TVYVC6hLl7SOV9pi5q9uIDF9AuIGkuzcbF7+fAhow==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-x64": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.50.2.tgz",
      "integrity": "sha512-dkYXB0c2XAS3a3jmyDkX4Jk0m7gWLFzq1C3qUnJJ38AyxIF5G/dyS4N9B30nvFseCfgtCEdbYFhk0ChoCGxPog==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.50.2.tgz",
      "integrity": "sha512-9VlPY/BN3AgbukfVHAB8zNFWB/lKEuvzRo1NKev0Po8sYFKx0i+AQlCYftgEjcL43F2h9Ui1ZSdVBc4En/sP2w==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.50.2.tgz",
      "integrity": "sha512-+GdKWOvsifaYNlIVf07QYan1J5F141+vGm5/Y8b9uCZnG/nxoGqgCmR24mv0koIWWuqvFYnbURRqw1lv7IBINw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-gnu": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.50.2.tgz",
      "integrity": "sha512-df0Eou14ojtUdLQdPFnymEQteENwSJAdLf5KCDrmZNsy1c3YaCNaJvYsEUHnrg+/DLBH612/R0xd3dD03uz2dg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-musl": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.50.2.tgz",
      "integrity": "sha512-iPeouV0UIDtz8j1YFR4OJ/zf7evjauqv7jQ/EFs0ClIyL+by++hiaDAfFipjOgyz6y6xbDvJuiU4HwpVMpRFDQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-gnu": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.50.2.tgz",
      "integrity": "sha512-OL6KaNvBopLlj5fTa5D5bau4W82f+1TyTZRr2BdnfsrnQnmdxh4okMxR2DcDkJuh4KeoQZVuvHvzuD/lyLn2Kw==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.50.2.tgz",
      "integrity": "sha512-I21VJl1w6z/K5OTRl6aS9DDsqezEZ/yKpbqlvfHbW0CEF5IL8ATBMuUx6/mp683rKTK8thjs/0BaNrZLXetLag==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.50.2.tgz",
      "integrity": "sha512-Hq6aQJT/qFFHrYMjS20nV+9SKrXL2lvFBENZoKfoTH2kKDOJqff5OSJr4x72ZaG/uUn+XmBnGhfr4lwMRrmqCQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-musl": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.50.2.tgz",
      "integrity": "sha512-82rBSEXRv5qtKyr0xZ/YMF531oj2AIpLZkeNYxmKNN6I2sVE9PGegN99tYDLK2fYHJITL1P2Lgb4ZXnv0PjQvw==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-s390x-gnu": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.50.2.tgz",
      "integrity": "sha512-4Q3S3Hy7pC6uaRo9gtXUTJ+EKo9AKs3BXKc2jYypEcMQ49gDPFU2P1ariX9SEtBzE5egIX6fSUmbmGazwBVF9w==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-gnu": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.50.2.tgz",
      "integrity": "sha512-9Jie/At6qk70dNIcopcL4p+1UirusEtznpNtcq/u/C5cC4HBX7qSGsYIcG6bdxj15EYWhHiu02YvmdPzylIZlA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-musl": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.50.2.tgz",
      "integrity": "sha512-HPNJwxPL3EmhzeAnsWQCM3DcoqOz3/IC6de9rWfGR8ZCuEHETi9km66bH/wG3YH0V3nyzyFEGUZeL5PKyy4xvw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-openharmony-arm64": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.50.2.tgz",
      "integrity": "sha512-nMKvq6FRHSzYfKLHZ+cChowlEkR2lj/V0jYj9JnGUVPL2/mIeFGmVM2mLaFeNa5Jev7W7TovXqXIG2d39y1KYA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@rollup/rollup-win32-arm64-msvc": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.50.2.tgz",
      "integrity": "sha512-eFUvvnTYEKeTyHEijQKz81bLrUQOXKZqECeiWH6tb8eXXbZk+CXSG2aFrig2BQ/pjiVRj36zysjgILkqarS2YA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-ia32-msvc": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.50.2.tgz",
      "integrity": "sha512-cBaWmXqyfRhH8zmUxK3d3sAhEWLrtMjWBRwdMMHJIXSjvjLKvv49adxiEz+FJ8AP90apSDDBx2Tyd/WylV6ikA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-msvc": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.50.2.tgz",
      "integrity": "sha512-APwKy6YUhvZaEoHyM+9xqmTpviEI+9eL7LoCH+aLcvWYHJ663qG5zx7WzWZY+a9qkg5JtzcMyJ9z0WtQBMDmgA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rtsao/scc": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@rtsao/scc/-/scc-1.1.0.tgz",
      "integrity": "sha512-zt6OdqaDoOnJ1ZYsCYGt9YmWzDXl4vQdKTyJev62gFhRGKdx7mcT54V9KIjg+d2wi9EXsPvAPKe7i7WjfVWB8g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@rushstack/eslint-patch": {
      "version": "1.12.0",
      "resolved": "https://registry.npmjs.org/@rushstack/eslint-patch/-/eslint-patch-1.12.0.tgz",
      "integrity": "sha512-5EwMtOqvJMMa3HbmxLlF74e+3/HhwBTMcvt3nqVJgGCozO6hzIPOBlwm8mGVNR9SN2IJpxSnlxczyDjcn7qIyw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@standard-schema/utils": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
      "license": "MIT"
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.15",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.15.tgz",
      "integrity": "sha512-JQ5TuMi45Owi4/BIMAJBoSQoOJu12oOk/gADqlcUL9JEdHB8vyjUSsxqeNXnmXHjYKMi2WcYtezGEEhqUI/E2g==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.8.0"
      }
    },
    "node_modules/@tailwindcss/node": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/node/-/node-4.1.13.tgz",
      "integrity": "sha512-eq3ouolC1oEFOAvOMOBAmfCIqZBJuvWvvYWh5h5iOYfe1HFC6+GZ6EIL0JdM3/niGRJmnrOc+8gl9/HGUaaptw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/remapping": "^2.3.4",
        "enhanced-resolve": "^5.18.3",
        "jiti": "^2.5.1",
        "lightningcss": "1.30.1",
        "magic-string": "^0.30.18",
        "source-map-js": "^1.2.1",
        "tailwindcss": "4.1.13"
      }
    },
    "node_modules/@tailwindcss/oxide": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide/-/oxide-4.1.13.tgz",
      "integrity": "sha512-CPgsM1IpGRa880sMbYmG1s4xhAy3xEt1QULgTJGQmZUeNgXFR7s1YxYygmJyBGtou4SyEosGAGEeYqY7R53bIA==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "detect-libc": "^2.0.4",
        "tar": "^7.4.3"
      },
      "engines": {
        "node": ">= 10"
      },
      "optionalDependencies": {
        "@tailwindcss/oxide-android-arm64": "4.1.13",
        "@tailwindcss/oxide-darwin-arm64": "4.1.13",
        "@tailwindcss/oxide-darwin-x64": "4.1.13",
        "@tailwindcss/oxide-freebsd-x64": "4.1.13",
        "@tailwindcss/oxide-linux-arm-gnueabihf": "4.1.13",
        "@tailwindcss/oxide-linux-arm64-gnu": "4.1.13",
        "@tailwindcss/oxide-linux-arm64-musl": "4.1.13",
        "@tailwindcss/oxide-linux-x64-gnu": "4.1.13",
        "@tailwindcss/oxide-linux-x64-musl": "4.1.13",
        "@tailwindcss/oxide-wasm32-wasi": "4.1.13",
        "@tailwindcss/oxide-win32-arm64-msvc": "4.1.13",
        "@tailwindcss/oxide-win32-x64-msvc": "4.1.13"
      }
    },
    "node_modules/@tailwindcss/oxide-android-arm64": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-android-arm64/-/oxide-android-arm64-4.1.13.tgz",
      "integrity": "sha512-BrpTrVYyejbgGo57yc8ieE+D6VT9GOgnNdmh5Sac6+t0m+v+sKQevpFVpwX3pBrM2qKrQwJ0c5eDbtjouY/+ew==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-arm64": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-arm64/-/oxide-darwin-arm64-4.1.13.tgz",
      "integrity": "sha512-YP+Jksc4U0KHcu76UhRDHq9bx4qtBftp9ShK/7UGfq0wpaP96YVnnjFnj3ZFrUAjc5iECzODl/Ts0AN7ZPOANQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-x64": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-x64/-/oxide-darwin-x64-4.1.13.tgz",
      "integrity": "sha512-aAJ3bbwrn/PQHDxCto9sxwQfT30PzyYJFG0u/BWZGeVXi5Hx6uuUOQEI2Fa43qvmUjTRQNZnGqe9t0Zntexeuw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-freebsd-x64": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-freebsd-x64/-/oxide-freebsd-x64-4.1.13.tgz",
      "integrity": "sha512-Wt8KvASHwSXhKE/dJLCCWcTSVmBj3xhVhp/aF3RpAhGeZ3sVo7+NTfgiN8Vey/Fi8prRClDs6/f0KXPDTZE6nQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm-gnueabihf": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm-gnueabihf/-/oxide-linux-arm-gnueabihf-4.1.13.tgz",
      "integrity": "sha512-mbVbcAsW3Gkm2MGwA93eLtWrwajz91aXZCNSkGTx/R5eb6KpKD5q8Ueckkh9YNboU8RH7jiv+ol/I7ZyQ9H7Bw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-gnu": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-gnu/-/oxide-linux-arm64-gnu-4.1.13.tgz",
      "integrity": "sha512-wdtfkmpXiwej/yoAkrCP2DNzRXCALq9NVLgLELgLim1QpSfhQM5+ZxQQF8fkOiEpuNoKLp4nKZ6RC4kmeFH0HQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-musl": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-musl/-/oxide-linux-arm64-musl-4.1.13.tgz",
      "integrity": "sha512-hZQrmtLdhyqzXHB7mkXfq0IYbxegaqTmfa1p9MBj72WPoDD3oNOh1Lnxf6xZLY9C3OV6qiCYkO1i/LrzEdW2mg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-gnu": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-4.1.13.tgz",
      "integrity": "sha512-uaZTYWxSXyMWDJZNY1Ul7XkJTCBRFZ5Fo6wtjrgBKzZLoJNrG+WderJwAjPzuNZOnmdrVg260DKwXCFtJ/hWRQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-musl": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-musl/-/oxide-linux-x64-musl-4.1.13.tgz",
      "integrity": "sha512-oXiPj5mi4Hdn50v5RdnuuIms0PVPI/EG4fxAfFiIKQh5TgQgX7oSuDWntHW7WNIi/yVLAiS+CRGW4RkoGSSgVQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-wasm32-wasi": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.1.13.tgz",
      "integrity": "sha512-+LC2nNtPovtrDwBc/nqnIKYh/W2+R69FA0hgoeOn64BdCX522u19ryLh3Vf3F8W49XBcMIxSe665kwy21FkhvA==",
      "bundleDependencies": [
        "@napi-rs/wasm-runtime",
        "@emnapi/core",
        "@emnapi/runtime",
        "@tybys/wasm-util",
        "@emnapi/wasi-threads",
        "tslib"
      ],
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.4.5",
        "@emnapi/runtime": "^1.4.5",
        "@emnapi/wasi-threads": "^1.0.4",
        "@napi-rs/wasm-runtime": "^0.2.12",
        "@tybys/wasm-util": "^0.10.0",
        "tslib": "^2.8.0"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.1.13.tgz",
      "integrity": "sha512-dziTNeQXtoQ2KBXmrjCxsuPk3F3CQ/yb7ZNZNA+UkNTeiTGgfeh+gH5Pi7mRncVgcPD2xgHvkFCh/MhZWSgyQg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-x64-msvc": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-x64-msvc/-/oxide-win32-x64-msvc-4.1.13.tgz",
      "integrity": "sha512-3+LKesjXydTkHk5zXX01b5KMzLV1xl2mcktBJkje7rhFUpUlYJy7IMOLqjIRQncLTa1WZZiFY/foAeB5nmaiTw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/postcss": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/@tailwindcss/postcss/-/postcss-4.1.13.tgz",
      "integrity": "sha512-HLgx6YSFKJT7rJqh9oJs/TkBFhxuMOfUKSBEPYwV+t78POOBsdQ7crhZLzwcH3T0UyUuOzU/GK5pk5eKr3wCiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@alloc/quick-lru": "^5.2.0",
        "@tailwindcss/node": "4.1.13",
        "@tailwindcss/oxide": "4.1.13",
        "postcss": "^8.4.41",
        "tailwindcss": "4.1.13"
      }
    },
    "node_modules/@tanstack/eslint-plugin-query": {
      "version": "5.86.0",
      "resolved": "https://registry.npmjs.org/@tanstack/eslint-plugin-query/-/eslint-plugin-query-5.86.0.tgz",
      "integrity": "sha512-tmXdnx/fF3yY5G5jpzrJQbASY3PNzsKF0gq9IsZVqz3LJ4sExgdUFGQ305nao0wTMBOclyrSC13v/VQ3yOXu/Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/utils": "^8.37.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0"
      }
    },
    "node_modules/@tanstack/query-core": {
      "version": "5.87.4",
      "resolved": "https://registry.npmjs.org/@tanstack/query-core/-/query-core-5.87.4.tgz",
      "integrity": "sha512-uNsg6zMxraEPDVO2Bn+F3/ctHi+Zsk+MMpcN8h6P7ozqD088F6mFY5TfGM7zuyIrL7HKpDyu6QHfLWiDxh3cuw==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      }
    },
    "node_modules/@tanstack/query-devtools": {
      "version": "5.87.3",
      "resolved": "https://registry.npmjs.org/@tanstack/query-devtools/-/query-devtools-5.87.3.tgz",
      "integrity": "sha512-LkzxzSr2HS1ALHTgDmJH5eGAVsSQiuwz//VhFW5OqNk0OQ+Fsqba0Tsf+NzWRtXYvpgUqwQr4b2zdFZwxHcGvg==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      }
    },
    "node_modules/@tanstack/react-query": {
      "version": "5.87.4",
      "resolved": "https://registry.npmjs.org/@tanstack/react-query/-/react-query-5.87.4.tgz",
      "integrity": "sha512-T5GT/1ZaNsUXf5I3RhcYuT17I4CPlbZgyLxc/ZGv7ciS6esytlbjb3DgUFO6c8JWYMDpdjSWInyGZUErgzqhcA==",
      "license": "MIT",
      "dependencies": {
        "@tanstack/query-core": "5.87.4"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      },
      "peerDependencies": {
        "react": "^18 || ^19"
      }
    },
    "node_modules/@tanstack/react-query-devtools": {
      "version": "5.87.4",
      "resolved": "https://registry.npmjs.org/@tanstack/react-query-devtools/-/react-query-devtools-5.87.4.tgz",
      "integrity": "sha512-JYcnVJBBW1DCPyNGM0S2CyrLpe6KFiL2gpYd/k9tAp62Du7+Y27zkzd+dKFyxpFadYaTxsx4kUA7YvnkMLVUoQ==",
      "license": "MIT",
      "dependencies": {
        "@tanstack/query-devtools": "5.87.3"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      },
      "peerDependencies": {
        "@tanstack/react-query": "^5.87.4",
        "react": "^18 || ^19"
      }
    },
    "node_modules/@testing-library/dom": {
      "version": "10.4.1",
      "resolved": "https://registry.npmjs.org/@testing-library/dom/-/dom-10.4.1.tgz",
      "integrity": "sha512-o4PXJQidqJl82ckFaXUeoAW+XysPLauYI43Abki5hABd853iMhitooc6znOnczgbTYmEP6U6/y1ZyKAIsvMKGg==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "@babel/code-frame": "^7.10.4",
        "@babel/runtime": "^7.12.5",
        "@types/aria-query": "^5.0.1",
        "aria-query": "5.3.0",
        "dom-accessibility-api": "^0.5.9",
        "lz-string": "^1.5.0",
        "picocolors": "1.1.1",
        "pretty-format": "^27.0.2"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@testing-library/react": {
      "version": "16.3.0",
      "resolved": "https://registry.npmjs.org/@testing-library/react/-/react-16.3.0.tgz",
      "integrity": "sha512-kFSyxiEDwv1WLl2fgsq6pPBbw5aWKrsY2/noi1Id0TK0UParSF62oFQFGHXIyaG4pp2tEub/Zlel+fjjZILDsw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.12.5"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "@testing-library/dom": "^10.0.0",
        "@types/react": "^18.0.0 || ^19.0.0",
        "@types/react-dom": "^18.0.0 || ^19.0.0",
        "react": "^18.0.0 || ^19.0.0",
        "react-dom": "^18.0.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@tybys/wasm-util": {
      "version": "0.10.1",
      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.1.tgz",
      "integrity": "sha512-9tTaPJLSiejZKx+Bmog4uSubteqTvFrVrURwkmHixBo0G4seD0zUxp98E1DzUBJxLQ3NPwXrGKDiVjwx/DpPsg==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@types/aria-query": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/@types/aria-query/-/aria-query-5.0.4.tgz",
      "integrity": "sha512-rfT93uj5s0PRL7EzccGMs3brplhcrghnDoV26NqKhCAS1hVo+WdNsPvE/yb6ilfr5hi2MEk6d5EWJTKdxg8jVw==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/@types/babel__core": {
      "version": "7.20.5",
      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.20.7",
        "@babel/types": "^7.20.7",
        "@types/babel__generator": "*",
        "@types/babel__template": "*",
        "@types/babel__traverse": "*"
      }
    },
    "node_modules/@types/babel__generator": {
      "version": "7.27.0",
      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__template": {
      "version": "7.4.4",
      "resolved": "https://registry.npmjs.org/@types/babel__template/-/babel__template-7.4.4.tgz",
      "integrity": "sha512-h/NUaSyG5EyxBIp8YRxo4RMe2/qQgvyowRwVMzhYhBCONbW8PUsg4lkFMrhgZhUe5z3L3MiLDuvyJ/CaPa2A8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.1.0",
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__traverse": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@types/babel__traverse/-/babel__traverse-7.28.0.tgz",
      "integrity": "sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.28.2"
      }
    },
    "node_modules/@types/chai": {
      "version": "5.2.2",
      "resolved": "https://registry.npmjs.org/@types/chai/-/chai-5.2.2.tgz",
      "integrity": "sha512-8kB30R7Hwqf40JPiKhVzodJs2Qc1ZJ5zuT3uzw5Hq/dhNCl3G3l83jfpdI1e20BP348+fV7VIL/+FxaXkqBmWg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/deep-eql": "*"
      }
    },
    "node_modules/@types/deep-eql": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@types/deep-eql/-/deep-eql-4.0.2.tgz",
      "integrity": "sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/estree": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.8.tgz",
      "integrity": "sha512-dWHzHa2WqEXI/O1E9OjrocMTKJl2mSrEolh1Iomrv6U+JuNwaHXsXx9bLu5gG7BUWFIN0skIQJQ/L1rIex4X6w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/geojson": {
      "version": "7946.0.16",
      "resolved": "https://registry.npmjs.org/@types/geojson/-/geojson-7946.0.16.tgz",
      "integrity": "sha512-6C8nqWur3j98U6+lXDfTUWIfgvZU+EumvpHKcYjujKH7woYyLj2sUmff0tRhrqM7BohUw7Pz3ZB1jj2gW9Fvmg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json5": {
      "version": "0.0.29",
      "resolved": "https://registry.npmjs.org/@types/json5/-/json5-0.0.29.tgz",
      "integrity": "sha512-dRLjCWHYg4oaA77cxO64oO+7JwCwnIzkZPdrrC71jQmQtlhM556pwKo5bUzqvZndkVbeFLIIi+9TC40JNF5hNQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/leaflet": {
      "version": "1.9.20",
      "resolved": "https://registry.npmjs.org/@types/leaflet/-/leaflet-1.9.20.tgz",
      "integrity": "sha512-rooalPMlk61LCaLOvBF2VIf9M47HgMQqi5xQ9QRi7c8PkdIe0WrIi5IxXUXQjAdL0c+vcQ01mYWbthzmp9GHWw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/geojson": "*"
      }
    },
    "node_modules/@types/leaflet.markercluster": {
      "version": "1.5.6",
      "resolved": "https://registry.npmjs.org/@types/leaflet.markercluster/-/leaflet.markercluster-1.5.6.tgz",
      "integrity": "sha512-I7hZjO2+isVXGYWzKxBp8PsCzAYCJBc29qBdFpquOCkS7zFDqUsUvkEOyQHedsk/Cy5tocQzf+Ndorm5W9YKTQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/leaflet": "^1.9"
      }
    },
    "node_modules/@types/node": {
      "version": "20.19.14",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.19.14.tgz",
      "integrity": "sha512-gqiKWld3YIkmtrrg9zDvg9jfksZCcPywXVN7IauUGhilwGV/yOyeUsvpR796m/Jye0zUzMXPKe8Ct1B79A7N5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/react": {
      "version": "19.1.13",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.1.13.tgz",
      "integrity": "sha512-hHkbU/eoO3EG5/MZkuFSKmYqPbSVk5byPFa3e7y/8TybHiLMACgI8seVYlicwk7H5K/rI2px9xrQp/C+AUDTiQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "csstype": "^3.0.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "19.1.9",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.1.9.tgz",
      "integrity": "sha512-qXRuZaOsAdXKFyOhRBg6Lqqc0yay13vN7KrIg4L7N4aaHN68ma9OK3NE1BoDFgFOTfM7zg+3/8+2n8rLUH3OKQ==",
      "devOptional": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^19.0.0"
      }
    },
    "node_modules/@types/react-leaflet": {
      "version": "2.8.3",
      "resolved": "https://registry.npmjs.org/@types/react-leaflet/-/react-leaflet-2.8.3.tgz",
      "integrity": "sha512-MeBQnVQe6ikw8dkuZE4F96PvMdQeilZG6/ekk5XxhkSzU3lofedULn3UR/6G0uIHjbRazi4DA8LnLACX0bPhBg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/leaflet": "*",
        "@types/react": "*"
      }
    },
    "node_modules/@types/react-leaflet-markercluster": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/react-leaflet-markercluster/-/react-leaflet-markercluster-3.0.4.tgz",
      "integrity": "sha512-YhN2Jts1CI31LXv+defPHvHrbIbp88ZcMwZwUUf4iRnZ/FJ1jDgb41yOuqXrnyAdwfGkm5BU4q6eBUFnh0J4Vw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/leaflet": "*",
        "@types/leaflet.markercluster": "*",
        "@types/react": "*",
        "@types/react-leaflet": "^2.8.3"
      }
    },
    "node_modules/@types/uuid": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/@types/uuid/-/uuid-10.0.0.tgz",
      "integrity": "sha512-7gqG38EyHgyP1S+7+xomFtL+ZNHcKv6DwNaCZmJmo1vgMugyF3TCnXVg4t1uk89mLNwnLtnY3TpOpCOyp1/xHQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/web-push": {
      "version": "3.6.4",
      "resolved": "https://registry.npmjs.org/@types/web-push/-/web-push-3.6.4.tgz",
      "integrity": "sha512-GnJmSr40H3RAnj0s34FNTcJi1hmWFV5KXugE0mYWnYhgTAHLJ/dJKAwDmvPJYMke0RplY2XE9LnM4hqSqKIjhQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/webidl-conversions": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/@types/webidl-conversions/-/webidl-conversions-7.0.3.tgz",
      "integrity": "sha512-CiJJvcRtIgzadHCYXw7dqEnMNRjhGZlYK05Mj9OyktqV8uVT8fD2BFOB7S1uwBE3Kj2Z+4UyPmFw/Ixgw/LAlA==",
      "license": "MIT"
    },
    "node_modules/@types/whatwg-url": {
      "version": "11.0.5",
      "resolved": "https://registry.npmjs.org/@types/whatwg-url/-/whatwg-url-11.0.5.tgz",
      "integrity": "sha512-coYR071JRaHa+xoEvvYqvnIHaVqaYrLPbsufM9BF63HkwI5Lgmy2QR8Q5K/lYDYo5AK82wOvSOS0UsLTpTG7uQ==",
      "license": "MIT",
      "dependencies": {
        "@types/webidl-conversions": "*"
      }
    },
    "node_modules/@typescript-eslint/eslint-plugin": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/eslint-plugin/-/eslint-plugin-8.43.0.tgz",
      "integrity": "sha512-8tg+gt7ENL7KewsKMKDHXR1vm8tt9eMxjJBYINf6swonlWgkYn5NwyIgXpbbDxTNU5DgpDFfj95prcTq2clIQQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/regexpp": "^4.10.0",
        "@typescript-eslint/scope-manager": "8.43.0",
        "@typescript-eslint/type-utils": "8.43.0",
        "@typescript-eslint/utils": "8.43.0",
        "@typescript-eslint/visitor-keys": "8.43.0",
        "graphemer": "^1.4.0",
        "ignore": "^7.0.0",
        "natural-compare": "^1.4.0",
        "ts-api-utils": "^2.1.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "@typescript-eslint/parser": "^8.43.0",
        "eslint": "^8.57.0 || ^9.0.0",
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/eslint-plugin/node_modules/ignore": {
      "version": "7.0.5",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-7.0.5.tgz",
      "integrity": "sha512-Hs59xBNfUIunMFgWAbGX5cq6893IbWg4KnrjbYwX3tx0ztorVgTDA6B2sxf8ejHJ4wz8BqGUMYlnzNBer5NvGg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/@typescript-eslint/parser": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/parser/-/parser-8.43.0.tgz",
      "integrity": "sha512-B7RIQiTsCBBmY+yW4+ILd6mF5h1FUwJsVvpqkrgpszYifetQ2Ke+Z4u6aZh0CblkUGIdR59iYVyXqqZGkZ3aBw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/scope-manager": "8.43.0",
        "@typescript-eslint/types": "8.43.0",
        "@typescript-eslint/typescript-estree": "8.43.0",
        "@typescript-eslint/visitor-keys": "8.43.0",
        "debug": "^4.3.4"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0",
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/project-service": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/project-service/-/project-service-8.43.0.tgz",
      "integrity": "sha512-htB/+D/BIGoNTQYffZw4uM4NzzuolCoaA/BusuSIcC8YjmBYQioew5VUZAYdAETPjeed0hqCaW7EHg+Robq8uw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/tsconfig-utils": "^8.43.0",
        "@typescript-eslint/types": "^8.43.0",
        "debug": "^4.3.4"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/scope-manager": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/scope-manager/-/scope-manager-8.43.0.tgz",
      "integrity": "sha512-daSWlQ87ZhsjrbMLvpuuMAt3y4ba57AuvadcR7f3nl8eS3BjRc8L9VLxFLk92RL5xdXOg6IQ+qKjjqNEimGuAg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.43.0",
        "@typescript-eslint/visitor-keys": "8.43.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/tsconfig-utils": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/tsconfig-utils/-/tsconfig-utils-8.43.0.tgz",
      "integrity": "sha512-ALC2prjZcj2YqqL5X/bwWQmHA2em6/94GcbB/KKu5SX3EBDOsqztmmX1kMkvAJHzxk7TazKzJfFiEIagNV3qEA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/type-utils": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/type-utils/-/type-utils-8.43.0.tgz",
      "integrity": "sha512-qaH1uLBpBuBBuRf8c1mLJ6swOfzCXryhKND04Igr4pckzSEW9JX5Aw9AgW00kwfjWJF0kk0ps9ExKTfvXfw4Qg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.43.0",
        "@typescript-eslint/typescript-estree": "8.43.0",
        "@typescript-eslint/utils": "8.43.0",
        "debug": "^4.3.4",
        "ts-api-utils": "^2.1.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0",
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/types": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/types/-/types-8.43.0.tgz",
      "integrity": "sha512-vQ2FZaxJpydjSZJKiSW/LJsabFFvV7KgLC5DiLhkBcykhQj8iK9BOaDmQt74nnKdLvceM5xmhaTF+pLekrxEkw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-8.43.0.tgz",
      "integrity": "sha512-7Vv6zlAhPb+cvEpP06WXXy/ZByph9iL6BQRBDj4kmBsW98AqEeQHlj/13X+sZOrKSo9/rNKH4Ul4f6EICREFdw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/project-service": "8.43.0",
        "@typescript-eslint/tsconfig-utils": "8.43.0",
        "@typescript-eslint/types": "8.43.0",
        "@typescript-eslint/visitor-keys": "8.43.0",
        "debug": "^4.3.4",
        "fast-glob": "^3.3.2",
        "is-glob": "^4.0.3",
        "minimatch": "^9.0.4",
        "semver": "^7.6.0",
        "ts-api-utils": "^2.1.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.2.tgz",
      "integrity": "sha512-Jt0vHyM+jmUBqojB7E1NIYadt0vI0Qxjxd2TErW94wDz+E2LAm5vKMXXwg6ZZBTHPuUlDgQHKXvjGBdfcF1ZDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch": {
      "version": "9.0.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-9.0.5.tgz",
      "integrity": "sha512-G6T0ZX48xgozx7587koeX9Ys2NYy6Gmv//P89sEte9V9whIapMNF4idKxnW2QtCcLiTWlb/wfCabAtAFWhhBow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/@typescript-eslint/utils": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/utils/-/utils-8.43.0.tgz",
      "integrity": "sha512-S1/tEmkUeeswxd0GGcnwuVQPFWo8NzZTOMxCvw8BX7OMxnNae+i8Tm7REQen/SwUIPoPqfKn7EaZ+YLpiB3k9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.7.0",
        "@typescript-eslint/scope-manager": "8.43.0",
        "@typescript-eslint/types": "8.43.0",
        "@typescript-eslint/typescript-estree": "8.43.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0",
        "typescript": ">=4.8.4 <6.0.0"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys": {
      "version": "8.43.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/visitor-keys/-/visitor-keys-8.43.0.tgz",
      "integrity": "sha512-T+S1KqRD4sg/bHfLwrpF/K3gQLBM1n7Rp7OjjikjTEssI2YJzQpi5WXoynOaQ93ERIuq3O8RBTOUYDKszUCEHw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.43.0",
        "eslint-visitor-keys": "^4.2.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys/node_modules/eslint-visitor-keys": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.2.1.tgz",
      "integrity": "sha512-Uhdk5sfqcee/9H/rCOJikYz67o0a2Tw2hGRPOG2Y1R2dg7brRe1uG0yaNQDHu+TO/uQPF/5eCapvYSmHUjt7JQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@unrs/resolver-binding-android-arm-eabi": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-android-arm-eabi/-/resolver-binding-android-arm-eabi-1.11.1.tgz",
      "integrity": "sha512-ppLRUgHVaGRWUx0R0Ut06Mjo9gBaBkg3v/8AxusGLhsIotbBLuRk51rAzqLC8gq6NyyAojEXglNjzf6R948DNw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@unrs/resolver-binding-android-arm64": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-android-arm64/-/resolver-binding-android-arm64-1.11.1.tgz",
      "integrity": "sha512-lCxkVtb4wp1v+EoN+HjIG9cIIzPkX5OtM03pQYkG+U5O/wL53LC4QbIeazgiKqluGeVEeBlZahHalCaBvU1a2g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@unrs/resolver-binding-darwin-arm64": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-darwin-arm64/-/resolver-binding-darwin-arm64-1.11.1.tgz",
      "integrity": "sha512-gPVA1UjRu1Y/IsB/dQEsp2V1pm44Of6+LWvbLc9SDk1c2KhhDRDBUkQCYVWe6f26uJb3fOK8saWMgtX8IrMk3g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@unrs/resolver-binding-darwin-x64": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-darwin-x64/-/resolver-binding-darwin-x64-1.11.1.tgz",
      "integrity": "sha512-cFzP7rWKd3lZaCsDze07QX1SC24lO8mPty9vdP+YVa3MGdVgPmFc59317b2ioXtgCMKGiCLxJ4HQs62oz6GfRQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@unrs/resolver-binding-freebsd-x64": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-freebsd-x64/-/resolver-binding-freebsd-x64-1.11.1.tgz",
      "integrity": "sha512-fqtGgak3zX4DCB6PFpsH5+Kmt/8CIi4Bry4rb1ho6Av2QHTREM+47y282Uqiu3ZRF5IQioJQ5qWRV6jduA+iGw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm-gnueabihf": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm-gnueabihf/-/resolver-binding-linux-arm-gnueabihf-1.11.1.tgz",
      "integrity": "sha512-u92mvlcYtp9MRKmP+ZvMmtPN34+/3lMHlyMj7wXJDeXxuM0Vgzz0+PPJNsro1m3IZPYChIkn944wW8TYgGKFHw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm-musleabihf": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm-musleabihf/-/resolver-binding-linux-arm-musleabihf-1.11.1.tgz",
      "integrity": "sha512-cINaoY2z7LVCrfHkIcmvj7osTOtm6VVT16b5oQdS4beibX2SYBwgYLmqhBjA1t51CarSaBuX5YNsWLjsqfW5Cw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm64-gnu": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm64-gnu/-/resolver-binding-linux-arm64-gnu-1.11.1.tgz",
      "integrity": "sha512-34gw7PjDGB9JgePJEmhEqBhWvCiiWCuXsL9hYphDF7crW7UgI05gyBAi6MF58uGcMOiOqSJ2ybEeCvHcq0BCmQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm64-musl": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm64-musl/-/resolver-binding-linux-arm64-musl-1.11.1.tgz",
      "integrity": "sha512-RyMIx6Uf53hhOtJDIamSbTskA99sPHS96wxVE/bJtePJJtpdKGXO1wY90oRdXuYOGOTuqjT8ACccMc4K6QmT3w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-ppc64-gnu": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-ppc64-gnu/-/resolver-binding-linux-ppc64-gnu-1.11.1.tgz",
      "integrity": "sha512-D8Vae74A4/a+mZH0FbOkFJL9DSK2R6TFPC9M+jCWYia/q2einCubX10pecpDiTmkJVUH+y8K3BZClycD8nCShA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-riscv64-gnu": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-riscv64-gnu/-/resolver-binding-linux-riscv64-gnu-1.11.1.tgz",
      "integrity": "sha512-frxL4OrzOWVVsOc96+V3aqTIQl1O2TjgExV4EKgRY09AJ9leZpEg8Ak9phadbuX0BA4k8U5qtvMSQQGGmaJqcQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-riscv64-musl": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-riscv64-musl/-/resolver-binding-linux-riscv64-musl-1.11.1.tgz",
      "integrity": "sha512-mJ5vuDaIZ+l/acv01sHoXfpnyrNKOk/3aDoEdLO/Xtn9HuZlDD6jKxHlkN8ZhWyLJsRBxfv9GYM2utQ1SChKew==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-s390x-gnu": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-s390x-gnu/-/resolver-binding-linux-s390x-gnu-1.11.1.tgz",
      "integrity": "sha512-kELo8ebBVtb9sA7rMe1Cph4QHreByhaZ2QEADd9NzIQsYNQpt9UkM9iqr2lhGr5afh885d/cB5QeTXSbZHTYPg==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-x64-gnu": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-x64-gnu/-/resolver-binding-linux-x64-gnu-1.11.1.tgz",
      "integrity": "sha512-C3ZAHugKgovV5YvAMsxhq0gtXuwESUKc5MhEtjBpLoHPLYM+iuwSj3lflFwK3DPm68660rZ7G8BMcwSro7hD5w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-x64-musl": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-x64-musl/-/resolver-binding-linux-x64-musl-1.11.1.tgz",
      "integrity": "sha512-rV0YSoyhK2nZ4vEswT/QwqzqQXw5I6CjoaYMOX0TqBlWhojUf8P94mvI7nuJTeaCkkds3QE4+zS8Ko+GdXuZtA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-wasm32-wasi": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-wasm32-wasi/-/resolver-binding-wasm32-wasi-1.11.1.tgz",
      "integrity": "sha512-5u4RkfxJm+Ng7IWgkzi3qrFOvLvQYnPBmjmZQ8+szTK/b31fQCnleNl1GgEt7nIsZRIf5PLhPwT0WM+q45x/UQ==",
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@napi-rs/wasm-runtime": "^0.2.11"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@unrs/resolver-binding-win32-arm64-msvc": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-arm64-msvc/-/resolver-binding-win32-arm64-msvc-1.11.1.tgz",
      "integrity": "sha512-nRcz5Il4ln0kMhfL8S3hLkxI85BXs3o8EYoattsJNdsX4YUU89iOkVn7g0VHSRxFuVMdM4Q1jEpIId1Ihim/Uw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@unrs/resolver-binding-win32-ia32-msvc": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-ia32-msvc/-/resolver-binding-win32-ia32-msvc-1.11.1.tgz",
      "integrity": "sha512-DCEI6t5i1NmAZp6pFonpD5m7i6aFrpofcp4LA2i8IIq60Jyo28hamKBxNrZcyOwVOZkgsRp9O2sXWBWP8MnvIQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@unrs/resolver-binding-win32-x64-msvc": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-x64-msvc/-/resolver-binding-win32-x64-msvc-1.11.1.tgz",
      "integrity": "sha512-lrW200hZdbfRtztbygyaq/6jP6AKE8qQN2KvPcJ+x7wiD038YtnYtZ82IMNJ69GJibV7bwL3y9FgK+5w/pYt6g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@vercel/blob": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@vercel/blob/-/blob-1.1.1.tgz",
      "integrity": "sha512-heiJGj2qt5qTv6yiShH9f6KRAoZGj+lz61GQ+lBRL4lhvUmKI9A51KYlQTnsUd9ymdFlKHBlvmPeG+yGz2Qsbg==",
      "license": "Apache-2.0",
      "dependencies": {
        "async-retry": "^1.3.3",
        "is-buffer": "^2.0.5",
        "is-node-process": "^1.2.0",
        "throttleit": "^2.1.0",
        "undici": "^5.28.4"
      },
      "engines": {
        "node": ">=16.14"
      }
    },
    "node_modules/@vitejs/plugin-react": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-5.0.2.tgz",
      "integrity": "sha512-tmyFgixPZCx2+e6VO9TNITWcCQl8+Nl/E8YbAyPVv85QCc7/A3JrdfG2A8gIzvVhWuzMOVrFW1aReaNxrI6tbw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.28.3",
        "@babel/plugin-transform-react-jsx-self": "^7.27.1",
        "@babel/plugin-transform-react-jsx-source": "^7.27.1",
        "@rolldown/pluginutils": "1.0.0-beta.34",
        "@types/babel__core": "^7.20.5",
        "react-refresh": "^0.17.0"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "peerDependencies": {
        "vite": "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
      }
    },
    "node_modules/@vitest/expect": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/expect/-/expect-3.2.4.tgz",
      "integrity": "sha512-Io0yyORnB6sikFlt8QW5K7slY4OjqNX9jmJQ02QDda8lyM6B5oNgVWoSoKPac8/kgnCUzuHQKrSLtu/uOqqrig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/chai": "^5.2.2",
        "@vitest/spy": "3.2.4",
        "@vitest/utils": "3.2.4",
        "chai": "^5.2.0",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/mocker": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/mocker/-/mocker-3.2.4.tgz",
      "integrity": "sha512-46ryTE9RZO/rfDd7pEqFl7etuyzekzEhUbTW3BvmeO/BcCMEgq59BKhek3dXDWgAj4oMK6OZi+vRr1wPW6qjEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/spy": "3.2.4",
        "estree-walker": "^3.0.3",
        "magic-string": "^0.30.17"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "msw": "^2.4.9",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
      },
      "peerDependenciesMeta": {
        "msw": {
          "optional": true
        },
        "vite": {
          "optional": true
        }
      }
    },
    "node_modules/@vitest/pretty-format": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/pretty-format/-/pretty-format-3.2.4.tgz",
      "integrity": "sha512-IVNZik8IVRJRTr9fxlitMKeJeXFFFN0JaB9PHPGQ8NKQbGpfjlTx9zO4RefN8gp7eqjNy8nyK3NZmBzOPeIxtA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/runner": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/runner/-/runner-3.2.4.tgz",
      "integrity": "sha512-oukfKT9Mk41LreEW09vt45f8wx7DordoWUZMYdY/cyAk7w5TWkTRCNZYF7sX7n2wB7jyGAl74OxgwhPgKaqDMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/utils": "3.2.4",
        "pathe": "^2.0.3",
        "strip-literal": "^3.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/snapshot": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/snapshot/-/snapshot-3.2.4.tgz",
      "integrity": "sha512-dEYtS7qQP2CjU27QBC5oUOxLE/v5eLkGqPE0ZKEIDGMs4vKWe7IjgLOeauHsR0D5YuuycGRO5oSRXnwnmA78fQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/pretty-format": "3.2.4",
        "magic-string": "^0.30.17",
        "pathe": "^2.0.3"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/spy": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/spy/-/spy-3.2.4.tgz",
      "integrity": "sha512-vAfasCOe6AIK70iP5UD11Ac4siNUNJ9i/9PZ3NKx07sG6sUxeag1LWdNrMWeKKYBLlzuK+Gn65Yd5nyL6ds+nw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tinyspy": "^4.0.3"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/ui": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/ui/-/ui-3.2.4.tgz",
      "integrity": "sha512-hGISOaP18plkzbWEcP/QvtRW1xDXF2+96HbEX6byqQhAUbiS5oH6/9JwW+QsQCIYON2bI6QZBF+2PvOmrRZ9wA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/utils": "3.2.4",
        "fflate": "^0.8.2",
        "flatted": "^3.3.3",
        "pathe": "^2.0.3",
        "sirv": "^3.0.1",
        "tinyglobby": "^0.2.14",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "vitest": "3.2.4"
      }
    },
    "node_modules/@vitest/utils": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/@vitest/utils/-/utils-3.2.4.tgz",
      "integrity": "sha512-fB2V0JFrQSMsCo9HiSq3Ezpdv4iYaXRG1Sx8edX3MwxfyNn83mKiGzOcH+Fkxt4MHxr3y42fQi1oeAInqgX2QA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/pretty-format": "3.2.4",
        "loupe": "^3.1.4",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/acorn": {
      "version": "8.15.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.15.0.tgz",
      "integrity": "sha512-NZyJarBfL7nWwIq+FDL6Zp/yHEhePMNnnJ0y3qfieCrmNvYct8uvtiV41UvlSe6apAfk0fY1FbWx+NwfmpvtTg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/agent-base": {
      "version": "7.1.4",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/ajv": {
      "version": "6.12.6",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.6.tgz",
      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "dev": true,
      "license": "Python-2.0"
    },
    "node_modules/aria-hidden": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/aria-hidden/-/aria-hidden-1.2.6.tgz",
      "integrity": "sha512-ik3ZgC9dY/lYVVM++OISsaYDeg1tb0VtP5uL3ouh1koGOaUMDPpbFIei4JkFimWUFPn90sbMNMXQAIVOlnYKJA==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/aria-query": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/aria-query/-/aria-query-5.3.0.tgz",
      "integrity": "sha512-b0P0sZPKtyu8HkeRAfCq0IfURZK+SuwMjY1UXGBU27wpAiTwQAIlq56IbIO+ytk/JjS1fMR14ee5WBBfKi5J6A==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "dequal": "^2.0.3"
      }
    },
    "node_modules/array-buffer-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/array-buffer-byte-length/-/array-buffer-byte-length-1.0.2.tgz",
      "integrity": "sha512-LHE+8BuR7RYGDKvnrmcuSq3tDcKv9OFEXQt/HpbZhY7V6h0zlUXutnAD82GiFx9rdieCMjkvtcsPqBwgUl1Iiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "is-array-buffer": "^3.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array-includes": {
      "version": "3.1.9",
      "resolved": "https://registry.npmjs.org/array-includes/-/array-includes-3.1.9.tgz",
      "integrity": "sha512-FmeCCAenzH0KH381SPT5FZmiA/TmpndpcaShhfgEN9eCVjnFBqq3l1xrI42y8+PPLI6hypzou4GXw00WHmPBLQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.0",
        "es-object-atoms": "^1.1.1",
        "get-intrinsic": "^1.3.0",
        "is-string": "^1.1.1",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlast": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/array.prototype.findlast/-/array.prototype.findlast-1.2.5.tgz",
      "integrity": "sha512-CVvd6FHg1Z3POpBLxO6E6zr+rSKEQ9L6rZHAaY7lLfhKsWYUBBOuMs0e9o24oopj6H+geRCX0YJ+TJLBK2eHyQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlastindex": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/array.prototype.findlastindex/-/array.prototype.findlastindex-1.2.6.tgz",
      "integrity": "sha512-F/TKATkzseUExPlfvmwQKGITM3DGTK+vkAsCZoDc5daVygbJBnjEUCbgkAvVFsgfXfX4YIqZ/27G3k3tdXrTxQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-shim-unscopables": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flat": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/array.prototype.flat/-/array.prototype.flat-1.3.3.tgz",
      "integrity": "sha512-rwG/ja1neyLqCuGZ5YYrznA62D4mZXg0i1cIskIUKSiqF3Cje9/wXAls9B9s1Wa2fomMsIv8czB8jZcPmxCXFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flatmap": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/array.prototype.flatmap/-/array.prototype.flatmap-1.3.3.tgz",
      "integrity": "sha512-Y7Wt51eKJSyi80hFrJCePGGNo5ktJCslFuboqJsbf57CCPcm5zztluPlc4/aD8sWsKvlwatezpV4U1efk8kpjg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.tosorted": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/array.prototype.tosorted/-/array.prototype.tosorted-1.1.4.tgz",
      "integrity": "sha512-p6Fx8B7b7ZhL/gmUsAy0D15WhvDccw3mnGNbZpi3pmeJdxtWsj2jEaI4Y6oo3XiHfzuSgPwKc04MYt6KgvC/wA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.3",
        "es-errors": "^1.3.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/arraybuffer.prototype.slice": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/arraybuffer.prototype.slice/-/arraybuffer.prototype.slice-1.0.4.tgz",
      "integrity": "sha512-BNoCY6SXXPQ7gF2opIP4GBE+Xw7U+pHMYKuzjgCN3GwiaIR09UUeKfheyIry77QtrCBlC0KK0q5/TER/tYh3PQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.1",
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "is-array-buffer": "^3.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/asn1.js": {
      "version": "5.4.1",
      "resolved": "https://registry.npmjs.org/asn1.js/-/asn1.js-5.4.1.tgz",
      "integrity": "sha512-+I//4cYPccV8LdmBLiX8CYvf9Sp3vQsrqu2QNXRcrbiWvcx/UdlFiqUJJzxRQxgsZmvhXhn4cSKeSmoFjVdupA==",
      "license": "MIT",
      "dependencies": {
        "bn.js": "^4.0.0",
        "inherits": "^2.0.1",
        "minimalistic-assert": "^1.0.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "node_modules/assertion-error": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/ast-types-flow": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/ast-types-flow/-/ast-types-flow-0.0.8.tgz",
      "integrity": "sha512-OH/2E5Fg20h2aPrbe+QL8JZQFko0YZaF+j4mnQ7BGhfavO7OpSLa8a0y9sBwomHdSbkhTS8TQNayBfnW5DwbvQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/async-function": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/async-function/-/async-function-1.0.0.tgz",
      "integrity": "sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/async-retry": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/async-retry/-/async-retry-1.3.3.tgz",
      "integrity": "sha512-wfr/jstw9xNi/0teMHrRW7dsz3Lt5ARhYNZ2ewpadnhaIp5mbALhOAP+EAdsC7t4Z6wqsDVv9+W6gm1Dk9mEyw==",
      "license": "MIT",
      "dependencies": {
        "retry": "0.13.1"
      }
    },
    "node_modules/available-typed-arrays": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/available-typed-arrays/-/available-typed-arrays-1.0.7.tgz",
      "integrity": "sha512-wvUjBtSGN7+7SjNpq/9M2Tg350UZD3q62IFZLbRAR1bSMlCo1ZaeW+BJ+D090e4hIIZLBcTDWe4Mh4jvUDajzQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "possible-typed-array-names": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/axe-core": {
      "version": "4.10.3",
      "resolved": "https://registry.npmjs.org/axe-core/-/axe-core-4.10.3.tgz",
      "integrity": "sha512-Xm7bpRXnDSX2YE2YFfBk2FnF0ep6tmG7xPh8iHee8MIcrgq762Nkce856dYtJYLkuIoYZvGfTs/PbZhideTcEg==",
      "dev": true,
      "license": "MPL-2.0",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/axobject-query": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/axobject-query/-/axobject-query-4.1.0.tgz",
      "integrity": "sha512-qIj0G9wZbMGNLjLmg1PT6v2mE9AH2zlnADJD/2tC6E00hgmhUOfEB6greHPAfLRSufHqROIUTkw6E+M3lH0PTQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.8.3",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.8.3.tgz",
      "integrity": "sha512-mcE+Wr2CAhHNWxXN/DdTI+n4gsPc5QpXpWnyCQWiQYIYZX+ZMJ8juXZgjRa/0/YPJo/NSsgW15/YgmI4nbysYw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.js"
      }
    },
    "node_modules/bidi-js": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/bidi-js/-/bidi-js-1.0.3.tgz",
      "integrity": "sha512-RKshQI1R3YQ+n9YJz2QQ147P66ELpa1FQEg20Dk8oW9t2KgLbpDLLp9aGZ7y8WHSshDknG0bknqGw5/tyCs5tw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "require-from-string": "^2.0.2"
      }
    },
    "node_modules/bn.js": {
      "version": "4.12.2",
      "resolved": "https://registry.npmjs.org/bn.js/-/bn.js-4.12.2.tgz",
      "integrity": "sha512-n4DSx829VRTRByMRGdjQ9iqsN0Bh4OolPsFnaZBLcbi8iXcB+kJ9s7EnRt4wILZNV3kPLHkRVfOc/HvhC3ovDw==",
      "license": "MIT"
    },
    "node_modules/brace-expansion": {
      "version": "1.1.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.12.tgz",
      "integrity": "sha512-9T9UjW3r0UW5c1Q7GTwllptXwhvYmEzFhzMfZ9H7FQWt+uZePjZPjBP/W1ZEyZ1twGWom5/56TF4lPcqjnDHcg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.26.0",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.26.0.tgz",
      "integrity": "sha512-P9go2WrP9FiPwLv3zqRD/Uoxo0RSHjzFCiQz7d4vbmwNqQFo9T9WCeP/Qn5EbcKQY6DBbkxEXNcpJOmncNrb7A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.8.2",
        "caniuse-lite": "^1.0.30001741",
        "electron-to-chromium": "^1.5.218",
        "node-releases": "^2.0.21",
        "update-browserslist-db": "^1.1.3"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/bson": {
      "version": "6.10.4",
      "resolved": "https://registry.npmjs.org/bson/-/bson-6.10.4.tgz",
      "integrity": "sha512-WIsKqkSC0ABoBJuT1LEX+2HEvNmNKKgnTAyd0fL8qzK4SH2i9NXg+t08YtdZp/V9IZ33cxe3iV4yM0qg8lMQng==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=16.20.1"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/cac": {
      "version": "6.7.14",
      "resolved": "https://registry.npmjs.org/cac/-/cac-6.7.14.tgz",
      "integrity": "sha512-b6Ilus+c3RrdDk+JhLKUAQfzzgLEPy6wcXqS7f/xe1EETvsDP6GORG7SFuOs6cID5YkqchW/LXZbX5bc8j7ZcQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/call-bind": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/call-bind/-/call-bind-1.0.8.tgz",
      "integrity": "sha512-oKlSFMcMwpUg2ednkhQ454wfWiU/ul3CkJe/PEHcTKuiX6RpbehUiFMXu13HalGZxfUwCQzZG747YXBn1im9ww==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.0",
        "es-define-property": "^1.0.0",
        "get-intrinsic": "^1.2.4",
        "set-function-length": "^1.2.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001741",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001741.tgz",
      "integrity": "sha512-QGUGitqsc8ARjLdgAfxETDhRbJ0REsP6O3I96TAth/mVjh2cYzN2u+3AzPP3aVSm2FehEItaJw1xd+IGBXWeSw==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/chai": {
      "version": "5.3.3",
      "resolved": "https://registry.npmjs.org/chai/-/chai-5.3.3.tgz",
      "integrity": "sha512-4zNhdJD/iOjSH0A05ea+Ke6MU5mmpQcbQsSOkgdaUMJ9zTlDTD/GYlwohmIE2u0gaxHYiVHEn1Fw9mZ/ktJWgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assertion-error": "^2.0.1",
        "check-error": "^2.1.1",
        "deep-eql": "^5.0.1",
        "loupe": "^3.1.0",
        "pathval": "^2.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/check-error": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/check-error/-/check-error-2.1.1.tgz",
      "integrity": "sha512-OAlb+T7V4Op9OwdkjmguYRqncdlx5JiofwOAUkmTF+jNdHwzTaTs4sRAGpzLF3oOz5xAyDGrPgeIDFQmDOTiJw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 16"
      }
    },
    "node_modules/chownr": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/chownr/-/chownr-3.0.0.tgz",
      "integrity": "sha512-+IxzY9BZOQd/XuYPRmrvEVjF/nqj5kgT4kEq7VofrDoM1MxoRjEWkrCC3EtLi59TVawxTAn+orJwFQcrqEN1+g==",
      "dev": true,
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/class-variance-authority": {
      "version": "0.7.1",
      "resolved": "https://registry.npmjs.org/class-variance-authority/-/class-variance-authority-0.7.1.tgz",
      "integrity": "sha512-Ka+9Trutv7G8M6WT6SeiRWz792K5qEqIGEGzXKhAE6xOWAY6pPH8U+9IY3oCMv6kqTmLsv7Xh/2w2RigkePMsg==",
      "license": "Apache-2.0",
      "dependencies": {
        "clsx": "^2.1.1"
      },
      "funding": {
        "url": "https://polar.sh/cva"
      }
    },
    "node_modules/client-only": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz",
      "integrity": "sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA==",
      "license": "MIT"
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/color": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/color/-/color-4.2.3.tgz",
      "integrity": "sha512-1rXeuUUiGGrykh+CeBdu5Ie7OJwinCgQY0bc7GCRxy5xVHy+moaqkpL/jqQq0MtQOeYcrqEz4abc5f0KtU7W4A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-convert": "^2.0.1",
        "color-string": "^1.9.0"
      },
      "engines": {
        "node": ">=12.5.0"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/color-string": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/color-string/-/color-string-1.9.1.tgz",
      "integrity": "sha512-shrVawQFojnZv6xM40anx4CkoDP+fZsw/ZerEMsW/pyzsRbElpsL/DBVW7q3ExxwusdNXI3lXpuhEZkzs8p5Eg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-name": "^1.0.0",
        "simple-swizzle": "^0.2.2"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/css-tree": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/css-tree/-/css-tree-3.1.0.tgz",
      "integrity": "sha512-0eW44TGN5SQXU1mWSkKwFstI/22X2bG1nYzZTYMAWjylYURhse752YgbE4Cx46AC+bAvI+/dYTPRk1LqSUnu6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mdn-data": "2.12.2",
        "source-map-js": "^1.0.1"
      },
      "engines": {
        "node": "^10 || ^12.20.0 || ^14.13.0 || >=15.0.0"
      }
    },
    "node_modules/cssstyle": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/cssstyle/-/cssstyle-5.3.0.tgz",
      "integrity": "sha512-RveJPnk3m7aarYQ2bJ6iw+Urh55S6FzUiqtBq+TihnTDP4cI8y/TYDqGOyqgnG1J1a6BxJXZsV9JFSTulm9Z7g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@asamuzakjp/css-color": "^4.0.3",
        "@csstools/css-syntax-patches-for-csstree": "^1.0.14",
        "css-tree": "^3.1.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/csstype": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.1.3.tgz",
      "integrity": "sha512-M1uQkMl8rQK/szD0LNhtqxIPLpimGm8sOBwU7lLnCpSbTyY3yeU1Vc7l4KT5zT4s/yOxHH5O7tIuuLOCnLADRw==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/damerau-levenshtein": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/damerau-levenshtein/-/damerau-levenshtein-1.0.8.tgz",
      "integrity": "sha512-sdQSFB7+llfUcQHUQO3+B8ERRj0Oa4w9POWMI/puGtuf7gFywGmkaLCElnudfTiKZV+NvHqL0ifzdrI8Ro7ESA==",
      "dev": true,
      "license": "BSD-2-Clause"
    },
    "node_modules/data-urls": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/data-urls/-/data-urls-6.0.0.tgz",
      "integrity": "sha512-BnBS08aLUM+DKamupXs3w2tJJoqU+AkaE/+6vQxi/G/DPmIZFJJp9Dkb1kM03AZx8ADehDUZgsNxju3mPXZYIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "whatwg-mimetype": "^4.0.0",
        "whatwg-url": "^15.0.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/data-view-buffer": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-buffer/-/data-view-buffer-1.0.2.tgz",
      "integrity": "sha512-EmKO5V3OLXh1rtK2wgXRansaK1/mtVdTUEiEI0W8RkvgT05kfxaH29PliLnpLP73yYO6142Q72QNa8Wx/A5CqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/data-view-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-byte-length/-/data-view-byte-length-1.0.2.tgz",
      "integrity": "sha512-tuhGbE6CfTM9+5ANGf+oQb72Ky/0+s3xKUpHvShfiz2RxMFgFPjsXuRLBVMtvMs15awe45SRb83D6wH4ew6wlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/inspect-js"
      }
    },
    "node_modules/data-view-byte-offset": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/data-view-byte-offset/-/data-view-byte-offset-1.0.1.tgz",
      "integrity": "sha512-BS8PfmtDGnrgYdOonGZQdLZslWIeCGFP9tpan0hi1Co2Zr2NKADsvGYA8XxuG/4UWgJ6Cjtv+YJnB6MM69QGlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/date-fns": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/date-fns/-/date-fns-4.1.0.tgz",
      "integrity": "sha512-Ukq0owbQXxa/U3EGtsdVBkR1w7KOQ5gIBqdH2hkvknzZPYvBxb/aa6E8L7tmjFtkwZBu3UXBbjIgPo/Ez4xaNg==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/kossnocorp"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decimal.js": {
      "version": "10.6.0",
      "resolved": "https://registry.npmjs.org/decimal.js/-/decimal.js-10.6.0.tgz",
      "integrity": "sha512-YpgQiITW3JXGntzdUmyUR1V812Hn8T1YVXhCu+wO3OpS4eU9l4YdD3qjyiKdV6mvV29zapkMeD390UVEf2lkUg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/deep-eql": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/deep-eql/-/deep-eql-5.0.2.tgz",
      "integrity": "sha512-h5k/5U50IJJFpzfL6nO9jaaumfjO/f2NjK/oYB2Djzm4p9L+3T9qWpZqZ2hAbLPuuYq9wrU08WQyBTL5GbPk5Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/define-data-property": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz",
      "integrity": "sha512-rBMvIzlpA8v6E+SJZoo++HAYqsLrkg7MSfIinMPFhmkorw7X+dOXVJQs+QT69zGkzMyfDnIMN2Wid1+NbL3T+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/define-properties": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.2.1.tgz",
      "integrity": "sha512-8QmQKqEASLd5nx0U1B1okLElbUuuttJ/AnYmRXbbbGDWh6uS208EjD4Xqq/I9wK7u0v6O08XhTWnt5XtEbR6Dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.0.1",
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/dequal": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/dequal/-/dequal-2.0.3.tgz",
      "integrity": "sha512-0je+qPKHEMohvfRTCEo3CrPG6cAzAYgmzKyxRiYSSDkS6eGJdyVJm7WaYA5ECaAD9wLB2T4EEeymA5aFVcYXCA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.0.tgz",
      "integrity": "sha512-vEtk+OcP7VBRtQZ1EJ3bdgzSfBjgnEalLTp5zjJrS+2Z1w2KZly4SBdac/WDU3hhsNAZ9E8SC96ME4Ey8MZ7cg==",
      "devOptional": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/detect-node-es": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/detect-node-es/-/detect-node-es-1.1.0.tgz",
      "integrity": "sha512-ypdmJU/TbBby2Dxibuv7ZLW3Bs1QEmM7nHjEANfohJLvE0XVujisn1qPJcZxg+qDucsr+bP6fLD1rPS3AhJ7EQ==",
      "license": "MIT"
    },
    "node_modules/doctrine": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-2.1.0.tgz",
      "integrity": "sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/dom-accessibility-api": {
      "version": "0.5.16",
      "resolved": "https://registry.npmjs.org/dom-accessibility-api/-/dom-accessibility-api-0.5.16.tgz",
      "integrity": "sha512-X7BJ2yElsnOJ30pZF4uIIDfBEVgF4XEBxL9Bxhy6dnrm5hkzqmsWHGTiHqRiITNhMyFLyAiWndIJP7Z1NTteDg==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.218",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.218.tgz",
      "integrity": "sha512-uwwdN0TUHs8u6iRgN8vKeWZMRll4gBkz+QMqdS7DDe49uiK68/UX92lFb61oiFPrpYZNeZIqa4bA7O6Aiasnzg==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/emoji-regex": {
      "version": "9.2.2",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-9.2.2.tgz",
      "integrity": "sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/enhanced-resolve": {
      "version": "5.18.3",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.18.3.tgz",
      "integrity": "sha512-d4lC8xfavMeBjzGr2vECC3fsGXziXZQyJxD868h2M/mBI3PwAuODxAkLkq5HYuvrPYcUtiLzsTo8U3PgX3Ocww==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.2.0"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/entities": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/entities/-/entities-6.0.1.tgz",
      "integrity": "sha512-aN97NXWF6AWBTahfVOIrB/NShkzi5H7F9r1s9mD3cDj4Ko5f2qhhVoYMibXF7GlLveb/D2ioWay8lxI97Ven3g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.12"
      },
      "funding": {
        "url": "https://github.com/fb55/entities?sponsor=1"
      }
    },
    "node_modules/es-abstract": {
      "version": "1.24.0",
      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.24.0.tgz",
      "integrity": "sha512-WSzPgsdLtTcQwm4CROfS5ju2Wa1QQcVeT37jFjYzdFz1r9ahadC8B8/a4qxJxM+09F18iumCdRmlr96ZYkQvEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.2",
        "arraybuffer.prototype.slice": "^1.0.4",
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "data-view-buffer": "^1.0.2",
        "data-view-byte-length": "^1.0.2",
        "data-view-byte-offset": "^1.0.1",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-set-tostringtag": "^2.1.0",
        "es-to-primitive": "^1.3.0",
        "function.prototype.name": "^1.1.8",
        "get-intrinsic": "^1.3.0",
        "get-proto": "^1.0.1",
        "get-symbol-description": "^1.1.0",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "internal-slot": "^1.1.0",
        "is-array-buffer": "^3.0.5",
        "is-callable": "^1.2.7",
        "is-data-view": "^1.0.2",
        "is-negative-zero": "^2.0.3",
        "is-regex": "^1.2.1",
        "is-set": "^2.0.3",
        "is-shared-array-buffer": "^1.0.4",
        "is-string": "^1.1.1",
        "is-typed-array": "^1.1.15",
        "is-weakref": "^1.1.1",
        "math-intrinsics": "^1.1.0",
        "object-inspect": "^1.13.4",
        "object-keys": "^1.1.1",
        "object.assign": "^4.1.7",
        "own-keys": "^1.0.1",
        "regexp.prototype.flags": "^1.5.4",
        "safe-array-concat": "^1.1.3",
        "safe-push-apply": "^1.0.0",
        "safe-regex-test": "^1.1.0",
        "set-proto": "^1.0.0",
        "stop-iteration-iterator": "^1.1.0",
        "string.prototype.trim": "^1.2.10",
        "string.prototype.trimend": "^1.0.9",
        "string.prototype.trimstart": "^1.0.8",
        "typed-array-buffer": "^1.0.3",
        "typed-array-byte-length": "^1.0.3",
        "typed-array-byte-offset": "^1.0.4",
        "typed-array-length": "^1.0.7",
        "unbox-primitive": "^1.1.0",
        "which-typed-array": "^1.1.19"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-iterator-helpers": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/es-iterator-helpers/-/es-iterator-helpers-1.2.1.tgz",
      "integrity": "sha512-uDn+FE1yrDzyC0pCo961B2IHbdM8y/ACZsKD4dG6WqrjV53BADjwa7D+1aom2rsNVfLyDgU/eigvlJGJ08OQ4w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.6",
        "es-errors": "^1.3.0",
        "es-set-tostringtag": "^2.0.3",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.6",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "internal-slot": "^1.1.0",
        "iterator.prototype": "^1.1.4",
        "safe-array-concat": "^1.1.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-module-lexer": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-1.7.0.tgz",
      "integrity": "sha512-jEQoCwk8hyb2AZziIOLhDqpm5+2ww5uIE6lkO/6jcOCusfk6LhMHpXXfBLXTZ7Ydyt0j4VoUQv6uGNYbdW+kBA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-shim-unscopables": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/es-shim-unscopables/-/es-shim-unscopables-1.1.0.tgz",
      "integrity": "sha512-d9T8ucsEhh8Bi1woXCf+TIKDIROLG5WCkxg8geBCbvk22kzwC5G2OnXVMO6FUsvQlgUUXQ2itephWDLqDzbeCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-to-primitive": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.3.0.tgz",
      "integrity": "sha512-w+5mJ3GuFL+NjVtJlvydShqE1eN3h3PbI7/5LAsYJP/2qtuMXjfL2LpHSRqo4b4eSF5K/DH1JXKUAHSB2UW50g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-callable": "^1.2.7",
        "is-date-object": "^1.0.5",
        "is-symbol": "^1.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/esbuild": {
      "version": "0.25.9",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.25.9.tgz",
      "integrity": "sha512-CRbODhYyQx3qp7ZEwzxOk4JBqmD/seJrzPa/cGjY1VtIn5E09Oi9/dB4JwctnfZ8Q8iT7rioVv5k/FNT/uf54g==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.25.9",
        "@esbuild/android-arm": "0.25.9",
        "@esbuild/android-arm64": "0.25.9",
        "@esbuild/android-x64": "0.25.9",
        "@esbuild/darwin-arm64": "0.25.9",
        "@esbuild/darwin-x64": "0.25.9",
        "@esbuild/freebsd-arm64": "0.25.9",
        "@esbuild/freebsd-x64": "0.25.9",
        "@esbuild/linux-arm": "0.25.9",
        "@esbuild/linux-arm64": "0.25.9",
        "@esbuild/linux-ia32": "0.25.9",
        "@esbuild/linux-loong64": "0.25.9",
        "@esbuild/linux-mips64el": "0.25.9",
        "@esbuild/linux-ppc64": "0.25.9",
        "@esbuild/linux-riscv64": "0.25.9",
        "@esbuild/linux-s390x": "0.25.9",
        "@esbuild/linux-x64": "0.25.9",
        "@esbuild/netbsd-arm64": "0.25.9",
        "@esbuild/netbsd-x64": "0.25.9",
        "@esbuild/openbsd-arm64": "0.25.9",
        "@esbuild/openbsd-x64": "0.25.9",
        "@esbuild/openharmony-arm64": "0.25.9",
        "@esbuild/sunos-x64": "0.25.9",
        "@esbuild/win32-arm64": "0.25.9",
        "@esbuild/win32-ia32": "0.25.9",
        "@esbuild/win32-x64": "0.25.9"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint": {
      "version": "9.35.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-9.35.0.tgz",
      "integrity": "sha512-QePbBFMJFjgmlE+cXAlbHZbHpdFVS2E/6vzCy7aKlebddvl1vadiC4JFV5u/wqTkNUwEV8WrQi257jf5f06hrg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.8.0",
        "@eslint-community/regexpp": "^4.12.1",
        "@eslint/config-array": "^0.21.0",
        "@eslint/config-helpers": "^0.3.1",
        "@eslint/core": "^0.15.2",
        "@eslint/eslintrc": "^3.3.1",
        "@eslint/js": "9.35.0",
        "@eslint/plugin-kit": "^0.3.5",
        "@humanfs/node": "^0.16.6",
        "@humanwhocodes/module-importer": "^1.0.1",
        "@humanwhocodes/retry": "^0.4.2",
        "@types/estree": "^1.0.6",
        "@types/json-schema": "^7.0.15",
        "ajv": "^6.12.4",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.6",
        "debug": "^4.3.2",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^8.4.0",
        "eslint-visitor-keys": "^4.2.1",
        "espree": "^10.4.0",
        "esquery": "^1.5.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^8.0.0",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.2",
        "ignore": "^5.2.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.2",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.3"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      },
      "peerDependencies": {
        "jiti": "*"
      },
      "peerDependenciesMeta": {
        "jiti": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-config-next": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/eslint-config-next/-/eslint-config-next-15.5.2.tgz",
      "integrity": "sha512-3hPZghsLupMxxZ2ggjIIrat/bPniM2yRpsVPVM40rp8ZMzKWOJp2CGWn7+EzoV2ddkUr5fxNfHpF+wU1hGt/3g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@next/eslint-plugin-next": "15.5.2",
        "@rushstack/eslint-patch": "^1.10.3",
        "@typescript-eslint/eslint-plugin": "^5.4.2 || ^6.0.0 || ^7.0.0 || ^8.0.0",
        "@typescript-eslint/parser": "^5.4.2 || ^6.0.0 || ^7.0.0 || ^8.0.0",
        "eslint-import-resolver-node": "^0.3.6",
        "eslint-import-resolver-typescript": "^3.5.2",
        "eslint-plugin-import": "^2.31.0",
        "eslint-plugin-jsx-a11y": "^6.10.0",
        "eslint-plugin-react": "^7.37.0",
        "eslint-plugin-react-hooks": "^5.0.0"
      },
      "peerDependencies": {
        "eslint": "^7.23.0 || ^8.0.0 || ^9.0.0",
        "typescript": ">=3.3.1"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-import-resolver-node": {
      "version": "0.3.9",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-node/-/eslint-import-resolver-node-0.3.9.tgz",
      "integrity": "sha512-WFj2isz22JahUv+B788TlO3N6zL3nNJGU8CcZbPZvVEkBPaJdCV4vy5wyghty5ROFbCRnm132v8BScu5/1BQ8g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^3.2.7",
        "is-core-module": "^2.13.0",
        "resolve": "^1.22.4"
      }
    },
    "node_modules/eslint-import-resolver-node/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-import-resolver-typescript": {
      "version": "3.10.1",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-typescript/-/eslint-import-resolver-typescript-3.10.1.tgz",
      "integrity": "sha512-A1rHYb06zjMGAxdLSkN2fXPBwuSaQ0iO5M/hdyS0Ajj1VBaRp0sPD3dn1FhME3c/JluGFbwSxyCfqdSbtQLAHQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@nolyfill/is-core-module": "1.0.39",
        "debug": "^4.4.0",
        "get-tsconfig": "^4.10.0",
        "is-bun-module": "^2.0.0",
        "stable-hash": "^0.0.5",
        "tinyglobby": "^0.2.13",
        "unrs-resolver": "^1.6.2"
      },
      "engines": {
        "node": "^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint-import-resolver-typescript"
      },
      "peerDependencies": {
        "eslint": "*",
        "eslint-plugin-import": "*",
        "eslint-plugin-import-x": "*"
      },
      "peerDependenciesMeta": {
        "eslint-plugin-import": {
          "optional": true
        },
        "eslint-plugin-import-x": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils": {
      "version": "2.12.1",
      "resolved": "https://registry.npmjs.org/eslint-module-utils/-/eslint-module-utils-2.12.1.tgz",
      "integrity": "sha512-L8jSWTze7K2mTg0vos/RuLRS5soomksDPoJLXIslC7c8Wmut3bx7CPpJijDcBZtxQ5lrbUdM+s0OlNbz0DCDNw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^3.2.7"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependenciesMeta": {
        "eslint": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-import": {
      "version": "2.32.0",
      "resolved": "https://registry.npmjs.org/eslint-plugin-import/-/eslint-plugin-import-2.32.0.tgz",
      "integrity": "sha512-whOE1HFo/qJDyX4SnXzP4N6zOWn79WhnCUY/iDR0mPfQZO8wcYE4JClzI2oZrhBnnMUCBCHZhO6VQyoBU95mZA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@rtsao/scc": "^1.1.0",
        "array-includes": "^3.1.9",
        "array.prototype.findlastindex": "^1.2.6",
        "array.prototype.flat": "^1.3.3",
        "array.prototype.flatmap": "^1.3.3",
        "debug": "^3.2.7",
        "doctrine": "^2.1.0",
        "eslint-import-resolver-node": "^0.3.9",
        "eslint-module-utils": "^2.12.1",
        "hasown": "^2.0.2",
        "is-core-module": "^2.16.1",
        "is-glob": "^4.0.3",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.8",
        "object.groupby": "^1.0.3",
        "object.values": "^1.2.1",
        "semver": "^6.3.1",
        "string.prototype.trimend": "^1.0.9",
        "tsconfig-paths": "^3.15.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/eslint-plugin-jsx-a11y": {
      "version": "6.10.2",
      "resolved": "https://registry.npmjs.org/eslint-plugin-jsx-a11y/-/eslint-plugin-jsx-a11y-6.10.2.tgz",
      "integrity": "sha512-scB3nz4WmG75pV8+3eRUQOHZlNSUhFNq37xnpgRkCCELU3XMvXAxLk1eqWWyE22Ki4Q01Fnsw9BA3cJHDPgn2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "aria-query": "^5.3.2",
        "array-includes": "^3.1.8",
        "array.prototype.flatmap": "^1.3.2",
        "ast-types-flow": "^0.0.8",
        "axe-core": "^4.10.0",
        "axobject-query": "^4.1.0",
        "damerau-levenshtein": "^1.0.8",
        "emoji-regex": "^9.2.2",
        "hasown": "^2.0.2",
        "jsx-ast-utils": "^3.3.5",
        "language-tags": "^1.0.9",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.8",
        "safe-regex-test": "^1.0.3",
        "string.prototype.includes": "^2.0.1"
      },
      "engines": {
        "node": ">=4.0"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9"
      }
    },
    "node_modules/eslint-plugin-jsx-a11y/node_modules/aria-query": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/aria-query/-/aria-query-5.3.2.tgz",
      "integrity": "sha512-COROpnaoap1E2F000S62r6A60uHZnmlvomhfyT2DlTcrY1OrBKn2UhH7qn5wTC9zMvD0AY7csdPSNwKP+7WiQw==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/eslint-plugin-react": {
      "version": "7.37.5",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.37.5.tgz",
      "integrity": "sha512-Qteup0SqU15kdocexFNAJMvCJEfa2xUKNV4CC1xsVMrIIqEy3SQ/rqyxCWNzfrd3/ldy6HMlD2e0JDVpDg2qIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-includes": "^3.1.8",
        "array.prototype.findlast": "^1.2.5",
        "array.prototype.flatmap": "^1.3.3",
        "array.prototype.tosorted": "^1.1.4",
        "doctrine": "^2.1.0",
        "es-iterator-helpers": "^1.2.1",
        "estraverse": "^5.3.0",
        "hasown": "^2.0.2",
        "jsx-ast-utils": "^2.4.1 || ^3.0.0",
        "minimatch": "^3.1.2",
        "object.entries": "^1.1.9",
        "object.fromentries": "^2.0.8",
        "object.values": "^1.2.1",
        "prop-types": "^15.8.1",
        "resolve": "^2.0.0-next.5",
        "semver": "^6.3.1",
        "string.prototype.matchall": "^4.0.12",
        "string.prototype.repeat": "^1.0.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7"
      }
    },
    "node_modules/eslint-plugin-react-hooks": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react-hooks/-/eslint-plugin-react-hooks-5.2.0.tgz",
      "integrity": "sha512-+f15FfK64YQwZdJNELETdn5ibXEUQmW1DZL6KXhNnc2heoy/sg9VJJeT7n8TlMWouzWqSWavFkIhHyIbIAEapg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "eslint": "^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0 || ^9.0.0"
      }
    },
    "node_modules/eslint-plugin-react/node_modules/resolve": {
      "version": "2.0.0-next.5",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-2.0.0-next.5.tgz",
      "integrity": "sha512-U7WjGVG9sH8tvjW5SmGbQuui75FiyjAX72HX15DwBBwF9dNiQZRQAg9nnPhYy+TUnE0+VcrttuvNI8oSxZcocA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-core-module": "^2.13.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/eslint-plugin-react/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/eslint-scope": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-8.4.0.tgz",
      "integrity": "sha512-sNXOfKCn74rt8RICKMvJS7XKV/Xk9kA7DyJr8mJik3S7Cwgy3qlkkmyS2uQB3jiJg6VNdZd/pDBJu0nvG2NlTg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint/node_modules/eslint-visitor-keys": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.2.1.tgz",
      "integrity": "sha512-Uhdk5sfqcee/9H/rCOJikYz67o0a2Tw2hGRPOG2Y1R2dg7brRe1uG0yaNQDHu+TO/uQPF/5eCapvYSmHUjt7JQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree": {
      "version": "10.4.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-10.4.0.tgz",
      "integrity": "sha512-j6PAQ2uUr79PZhBjP5C5fhl8e39FmRnOjsD5lGnWrFU8i2G776tBK7+nP8KuQUTTyAZUwfQqXAgrVH5MbH9CYQ==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "acorn": "^8.15.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^4.2.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree/node_modules/eslint-visitor-keys": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.2.1.tgz",
      "integrity": "sha512-Uhdk5sfqcee/9H/rCOJikYz67o0a2Tw2hGRPOG2Y1R2dg7brRe1uG0yaNQDHu+TO/uQPF/5eCapvYSmHUjt7JQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.6.0.tgz",
      "integrity": "sha512-ca9pw9fomFcKPvFLXhBKUK90ZvGibiGOvRJNbjljY7s7uq/5YO4BOzcYtJqExdx99rF6aAcnRxHmcUHcz6sQsg==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estree-walker": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "^1.0.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/expect-type": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/expect-type/-/expect-type-1.2.2.tgz",
      "integrity": "sha512-JhFGDVJ7tmDJItKhYgJCGLOWjuK9vPxiXoUFLwLDc99NlmklilbiQJwoctZtt13+xMw91MCk/REan6MWHqDjyA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-glob": {
      "version": "3.3.3",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.3.tgz",
      "integrity": "sha512-7MptL8U0cqcFdzIzwOTHoilX9x5BrNqye7Z/LuC7kCMRio1EMSyqRK3BEAUD7sXRq4iT4AzTVuZdhgQ2TCvYLg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.8"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fastq": {
      "version": "1.19.1",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.19.1.tgz",
      "integrity": "sha512-GwLTyxkCXjXbxqIhTsMI2Nui8huMPtnxg7krajPJAjnEG/iiOS7i+zCtWGZR9G0NBKbXKh6X9m9UIsYX/N6vvQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/fflate": {
      "version": "0.8.2",
      "resolved": "https://registry.npmjs.org/fflate/-/fflate-0.8.2.tgz",
      "integrity": "sha512-cPJU47OaAoCbg0pBvzsgpTPhmhqI5eJjh/JIu8tPj5q+T7iLvW/JAYUqmE7KOB4R1ZyEhzBaIQpQpardBF5z8A==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/file-entry-cache": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-8.0.0.tgz",
      "integrity": "sha512-XXTUwCvisa5oacNGRP9SfNtYBNAMi+RPwBFmblZEF7N7swHYQS6/Zfk7SRwx4D5j3CH211YNRco1DEMNVfZCnQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flat-cache": "^4.0.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/flat-cache": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-4.0.1.tgz",
      "integrity": "sha512-f7ccFPK3SXFHpx15UIGyRJ/FJQctuKZ0zVuN3frBo4HnK3cay9VEW0R6yPYFHC0AgqhukPzKjq22t5DmAyqGyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flatted": "^3.2.9",
        "keyv": "^4.5.4"
      },
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/flatted": {
      "version": "3.3.3",
      "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.3.3.tgz",
      "integrity": "sha512-GX+ysw4PBCz0PzosHDepZGANEuFCMLrnRTiEy9McGjmkCQYwRq4A/X786G/fjM/+OjsWSU1ZrY5qyARZmO/uwg==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/for-each": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/for-each/-/for-each-0.3.5.tgz",
      "integrity": "sha512-dKx12eRCVIzqCxFGplyFKJMPvLEWgmNtUrpTiJIR5u97zEhRG8ySrtboPHZXx7daLxQVrl643cTzbab2tkQjxg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-callable": "^1.2.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/function.prototype.name": {
      "version": "1.1.8",
      "resolved": "https://registry.npmjs.org/function.prototype.name/-/function.prototype.name-1.1.8.tgz",
      "integrity": "sha512-e5iwyodOHhbMr/yNrc7fDYG4qlbIvI5gajyzPnb5TCwyhjApznQh1BMFou9b30SevY43gCJKXycoCBjMbsuW0Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "functions-have-names": "^1.2.3",
        "hasown": "^2.0.2",
        "is-callable": "^1.2.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/functions-have-names": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/functions-have-names/-/functions-have-names-1.2.3.tgz",
      "integrity": "sha512-xckBUXyTIqT97tq2x2AMb+g163b5JFysYk0x4qxNFwbfQkmNZoiRHb6sPzI9/QV33WeuvVYBUIiD4NzNIyqaRQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-nonce": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-nonce/-/get-nonce-1.0.1.tgz",
      "integrity": "sha512-FJhYRoDaiatfEkUK8HKlicmu/3SGFD51q3itKDGoSTysQJBnfOcxU5GxnhE1E6soB76MbT0MBtnKJuXyAx+96Q==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/get-symbol-description": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/get-symbol-description/-/get-symbol-description-1.1.0.tgz",
      "integrity": "sha512-w9UMqWwJxHNOvoNzSJ2oPF5wvYcvP7jUvYzhp67yEhTi17ZDBBC1z9pTdGuzjD+EFIqLSYRweZjqfiPzQ06Ebg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-tsconfig": {
      "version": "4.10.1",
      "resolved": "https://registry.npmjs.org/get-tsconfig/-/get-tsconfig-4.10.1.tgz",
      "integrity": "sha512-auHyJ4AgMz7vgS8Hp3N6HXSmlMdUyhSUrfBF16w153rxtLIEOE+HGqaBppczZvnHLqQJfiHotCYpNhl0lUROFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve-pkg-maps": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/privatenumber/get-tsconfig?sponsor=1"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/globals": {
      "version": "14.0.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/globalthis": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.4.tgz",
      "integrity": "sha512-DpLKbNU4WylpxJykQujfCcwYWiV/Jhm50Goo0wrVILAv5jOr9d+H+UR3PhSCD2rCCEIg0uc+G+muBTwD54JhDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.2.1",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/graphemer": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/graphemer/-/graphemer-1.4.0.tgz",
      "integrity": "sha512-EtKwoO6kxCL9WO5xipiHTZlSzBm7WLT627TqC/uVRd0HKmq8NXyebnNYxDoBi7wt8eTWrUrKXCOVaFq9x1kgag==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/has-bigints": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-bigints/-/has-bigints-1.1.0.tgz",
      "integrity": "sha512-R3pbpkcIqv2Pm3dUwgjclDRVmWpTJW2DcMzcIhEXEx1oh/CEMObMm3KLmRJOdvhM7o4uQBnwr8pzRK2sJWIqfg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-property-descriptors": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.2.tgz",
      "integrity": "sha512-55JNKuIW+vq4Ke1BjOTjM2YctQIvCT7GFzHwmfZPGo5wnrgkid0YQtnAleFSqumZm4az3n2BS+erby5ipJdgrg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-proto": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/has-proto/-/has-proto-1.2.0.tgz",
      "integrity": "sha512-KIL7eQPfHQRC8+XluaIw7BHUwwqL19bQn4hzNgdr+1wXoU0KKj6rufu47lhY7KbJR2C6T6+PfyN0Ea7wkSS+qQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/html-encoding-sniffer": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/html-encoding-sniffer/-/html-encoding-sniffer-4.0.0.tgz",
      "integrity": "sha512-Y22oTqIU4uuPgEemfz7NDJz6OeKf12Lsu+QC+s3BVpda64lTiMYCyGwg5ki4vFxkMwQdeZDl2adZoqUgdFuTgQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "whatwg-encoding": "^3.1.1"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/http_ece": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/http_ece/-/http_ece-1.2.0.tgz",
      "integrity": "sha512-JrF8SSLVmcvc5NducxgyOrKXe3EsyHMgBFgSaIUGmArKe+rwr0uphRkRXvwiom3I+fpIfoItveHrfudL8/rxuA==",
      "license": "MIT",
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/http-proxy-agent": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-7.0.2.tgz",
      "integrity": "sha512-T1gkAiYYDWYx3V5Bmyu7HcfcvL7mUrTWiM6yOfa3PIphViJ/gFPbvidQ+veqSOHci/PxBcDabeUNCzpOODJZig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "^7.1.0",
        "debug": "^4.3.4"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
      "license": "MIT",
      "dependencies": {
        "agent-base": "^7.1.2",
        "debug": "4"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/idb": {
      "version": "8.0.3",
      "resolved": "https://registry.npmjs.org/idb/-/idb-8.0.3.tgz",
      "integrity": "sha512-LtwtVyVYO5BqRvcsKuB2iUMnHwPVByPCXFXOpuU96IZPPoPN6xjOGxZQ74pgSVVLQWtUOYgyeL4GE98BY5D3wg==",
      "license": "ISC"
    },
    "node_modules/ignore": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz",
      "integrity": "sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/immer": {
      "version": "10.1.3",
      "resolved": "https://registry.npmjs.org/immer/-/immer-10.1.3.tgz",
      "integrity": "sha512-tmjF/k8QDKydUlm3mZU+tjM6zeq9/fFpPqH9SzWmBnVVKsPBg/V66qsMwb3/Bo90cgUN+ghdVBess+hPsxUyRw==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/immer"
      }
    },
    "node_modules/import-fresh": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
      "integrity": "sha512-TR3KfrTZTYLPB6jUjfx6MF9WcWrHL9su5TObK4ZkYgBdWKPOFoSoQIdEuTuR82pmtxH2spWG9h6etwfr1pLBqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/internal-slot": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/internal-slot/-/internal-slot-1.1.0.tgz",
      "integrity": "sha512-4gd7VpWNQNB4UKKCFFVcp1AVv+FMOgs9NKzjHKusc8jTMhd5eL1NqQqOpE0KzMds804/yHlglp3uxgluOqAPLw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "hasown": "^2.0.2",
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/is-array-buffer": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/is-array-buffer/-/is-array-buffer-3.0.5.tgz",
      "integrity": "sha512-DDfANUiiG2wC1qawP66qlTugJeL5HyzMpfr8lLK+jMQirGzNod0B12cFB/9q838Ru27sBwfw78/rdoU7RERz6A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-arrayish": {
      "version": "0.3.4",
      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.3.4.tgz",
      "integrity": "sha512-m6UrgzFVUYawGBh1dUsWR5M2Clqic9RVXC/9f8ceNlv2IcO9j9J/z8UoCLPqtsPBFNzEpfR3xftohbfqDx8EQA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/is-async-function": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-async-function/-/is-async-function-2.1.1.tgz",
      "integrity": "sha512-9dgM/cZBnNvjzaMYHVoxxfPj2QXt22Ev7SuuPrs+xav0ukGB0S6d4ydZdEiM48kLx5kDV+QBPrpVnFyefL8kkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "async-function": "^1.0.0",
        "call-bound": "^1.0.3",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bigint": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-bigint/-/is-bigint-1.1.0.tgz",
      "integrity": "sha512-n4ZT37wG78iz03xPRKJrHTdZbe3IicyucEtdRsV5yglwc3GyUfbAfpSeD0FJ41NbUNSt5wbhqfp1fS+BgnvDFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-bigints": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-boolean-object": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/is-boolean-object/-/is-boolean-object-1.2.2.tgz",
      "integrity": "sha512-wa56o2/ElJMYqjCjGkXri7it5FbebW5usLw/nPmCMs5DeZ7eziSYZhSmPRn0txqeW4LnAmQQU7FgqLpsEFKM4A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-buffer": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/is-buffer/-/is-buffer-2.0.5.tgz",
      "integrity": "sha512-i2R6zNFDwgEHJyQUtJEk0XFi1i0dPFn/oqjK3/vPCcDeJvW5NQ83V8QbicfF1SupOaB0h8ntgBC2YiE7dfyctQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/is-bun-module": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/is-bun-module/-/is-bun-module-2.0.0.tgz",
      "integrity": "sha512-gNCGbnnnnFAUGKeZ9PdbyeGYJqewpmc2aKHUEMO5nQPWU9lOmv7jcmQIv+qHD8fXW6W7qfuCwX4rY9LNRjXrkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.7.1"
      }
    },
    "node_modules/is-callable": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/is-callable/-/is-callable-1.2.7.tgz",
      "integrity": "sha512-1BC0BVFhS/p0qtw6enp8e+8OD0UrK0oFLztSjNzhcKA3WDuJxxAPXzPuPtKkjEY9UUoEWlX/8fgKeu2S8i9JTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.16.1",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.16.1.tgz",
      "integrity": "sha512-UfoeMA6fIJ8wTYFEUjelnaGI67v6+N7qXJEvQuIGa99l4xsCruSYOVSQ0uPANn4dAzm8lkYPaKLrrijLq7x23w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-data-view": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-data-view/-/is-data-view-1.0.2.tgz",
      "integrity": "sha512-RKtWF8pGmS87i2D6gqQu/l7EYRlVdfzemCJN/P3UOs//x1QE7mfhvzHIApBTRf7axvT6DMGwSwBXYCT0nfB9xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "get-intrinsic": "^1.2.6",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-date-object": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-date-object/-/is-date-object-1.1.0.tgz",
      "integrity": "sha512-PwwhEakHVKTdRNVOw+/Gyh0+MzlCl4R6qKvkhuvLtPMggI1WAHt9sOwZxQLSGpUaDnrdyDsomoRgNnCfKNSXXg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-finalizationregistry": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-finalizationregistry/-/is-finalizationregistry-1.1.1.tgz",
      "integrity": "sha512-1pC6N8qWJbWoPtEjgcL2xyhQOP491EQjeUo3qTKcmV8YSDDJrOepfG8pcC7h/QgnQHYSv0mJ3Z/ZWxmatVrysg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-generator-function": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-generator-function/-/is-generator-function-1.1.0.tgz",
      "integrity": "sha512-nPUB5km40q9e8UfN/Zc24eLlzdSf9OfKByBw9CIdw4H1giPMeA0OIJvbchsCu4npfI2QcMVBsGEBHKZ7wLTWmQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "get-proto": "^1.0.0",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-map": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-negative-zero": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-negative-zero/-/is-negative-zero-2.0.3.tgz",
      "integrity": "sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-node-process": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/is-node-process/-/is-node-process-1.2.0.tgz",
      "integrity": "sha512-Vg4o6/fqPxIjtxgUH5QLJhwZ7gW5diGCVlXpuUfELC62CuxM1iHcRe51f2W1FDy04Ai4KJkagKjx3XaqyfRKXw==",
      "license": "MIT"
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-number-object": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-number-object/-/is-number-object-1.1.1.tgz",
      "integrity": "sha512-lZhclumE1G6VYD8VHe35wFaIif+CTy5SJIi5+3y4psDgWu4wPDoBhF8NxUOinEc7pHgiTsT6MaBb92rKhhD+Xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-potential-custom-element-name": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/is-potential-custom-element-name/-/is-potential-custom-element-name-1.0.1.tgz",
      "integrity": "sha512-bCYeRA2rVibKZd+s2625gGnGF/t7DSqDs4dP7CrLA1m7jKWz6pps0LpYLJN8Q64HtmPKJ1hrN3nzPNKFEKOUiQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-regex": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/is-regex/-/is-regex-1.2.1.tgz",
      "integrity": "sha512-MjYsKHO5O7mCsmRGxWcLWheFqN9DJ/2TmngvjKXihe6efViPqc274+Fx/4fYj/r03+ESvBdTXK0V6tA3rgez1g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-set": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-set/-/is-set-2.0.3.tgz",
      "integrity": "sha512-iPAjerrse27/ygGLxw+EBR9agv9Y6uLeYVJMu+QNCoouJ1/1ri0mGrcWpfCqFZuzzx3WjtwxG098X+n4OuRkPg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-shared-array-buffer": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-shared-array-buffer/-/is-shared-array-buffer-1.0.4.tgz",
      "integrity": "sha512-ISWac8drv4ZGfwKl5slpHG9OwPNty4jOWPRIhBpxOoD+hqITiwuipOQ2bNthAzwA3B4fIjO4Nln74N0S9byq8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-string": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-string/-/is-string-1.1.1.tgz",
      "integrity": "sha512-BtEeSsoaQjlSPBemMQIrY1MY0uM6vnS1g5fmufYOtnxLGUZM2178PKbhsk7Ffv58IX+ZtcvoGwccYsh0PglkAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-symbol": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-symbol/-/is-symbol-1.1.1.tgz",
      "integrity": "sha512-9gGx6GTtCQM73BgmHQXfDmLtfjjTUDSyoxTCbp5WtoixAhfgsDirWIcVQ/IHpvI5Vgd5i/J5F7B9cN/WlVbC/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-symbols": "^1.1.0",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-typed-array": {
      "version": "1.1.15",
      "resolved": "https://registry.npmjs.org/is-typed-array/-/is-typed-array-1.1.15.tgz",
      "integrity": "sha512-p3EcsicXjit7SaskXHs1hA91QxgTw46Fv6EFKKGS5DRFLD8yKnohjF3hxoju94b/OcMZoQukzpPpBE9uLVKzgQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakmap": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/is-weakmap/-/is-weakmap-2.0.2.tgz",
      "integrity": "sha512-K5pXYOm9wqY1RgjpL3YTkF39tni1XajUIkawTLUo9EZEVUFga5gSQJF8nNS7ZwJQ02y+1YCNYcMh+HIf1ZqE+w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakref": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-weakref/-/is-weakref-1.1.1.tgz",
      "integrity": "sha512-6i9mGWSlqzNMEqpCp93KwRS1uUOodk2OJ6b+sq7ZPDSy2WuI5NFIxp/254TytR8ftefexkWn5xNiHUNpPOfSew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakset": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/is-weakset/-/is-weakset-2.0.4.tgz",
      "integrity": "sha512-mfcwb6IzQyOKTs84CQMrOwW4gQcaTOAWJ0zzJCl2WSPDrWk/OzDaImWFH3djXhb24g4eudZfLRozAvPGw4d9hQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/isarray": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-2.0.5.tgz",
      "integrity": "sha512-xHjhDr3cNBK0BzdUJSPXZntQUx/mwMS5Rw4A7lPJ90XGAO6ISP/ePDNuo0vhqOZU+UD5JoodwCAAoZQd3FeAKw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/iterator.prototype": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/iterator.prototype/-/iterator.prototype-1.1.5.tgz",
      "integrity": "sha512-H0dkQoCa3b2VEeKQBOxFph+JAbcrQdE7KC0UkqwpLmv2EC4P41QXP+rqo9wYodACiG5/WM5s9oDApTU8utwj9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.6",
        "get-proto": "^1.0.0",
        "has-symbols": "^1.1.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/jiti": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.5.1.tgz",
      "integrity": "sha512-twQoecYPiVA5K/h6SxtORw/Bs3ar+mLUtoPSc7iMXzQzK8d7eJ/R09wmTwAjiamETn1cXYPGfNnu7DMoHgu12w==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/jose": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/jose/-/jose-6.1.0.tgz",
      "integrity": "sha512-TTQJyoEoKcC1lscpVDCSsVgYzUDg/0Bt3WE//WiTPK6uOCQC2KZS4MpugbMWt/zyjkopgZoXhZuCi00gLudfUA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.0.tgz",
      "integrity": "sha512-wpxZs9NoxZaJESJGIZTyDEaYpl0FKSA+FB9aJiyemKhMwkxQg63h4T1KJgUGHpTqPDNRcmmYLugrRjJlBtWvRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/jsdom": {
      "version": "27.0.0",
      "resolved": "https://registry.npmjs.org/jsdom/-/jsdom-27.0.0.tgz",
      "integrity": "sha512-lIHeR1qlIRrIN5VMccd8tI2Sgw6ieYXSVktcSHaNe3Z5nE/tcPQYQWOq00wxMvYOsz+73eAkNenVvmPC6bba9A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@asamuzakjp/dom-selector": "^6.5.4",
        "cssstyle": "^5.3.0",
        "data-urls": "^6.0.0",
        "decimal.js": "^10.5.0",
        "html-encoding-sniffer": "^4.0.0",
        "http-proxy-agent": "^7.0.2",
        "https-proxy-agent": "^7.0.6",
        "is-potential-custom-element-name": "^1.0.1",
        "parse5": "^7.3.0",
        "rrweb-cssom": "^0.8.0",
        "saxes": "^6.0.0",
        "symbol-tree": "^3.2.4",
        "tough-cookie": "^6.0.0",
        "w3c-xmlserializer": "^5.0.0",
        "webidl-conversions": "^8.0.0",
        "whatwg-encoding": "^3.1.1",
        "whatwg-mimetype": "^4.0.0",
        "whatwg-url": "^15.0.0",
        "ws": "^8.18.2",
        "xml-name-validator": "^5.0.0"
      },
      "engines": {
        "node": ">=20"
      },
      "peerDependencies": {
        "canvas": "^3.0.0"
      },
      "peerDependenciesMeta": {
        "canvas": {
          "optional": true
        }
      }
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json-buffer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/jsx-ast-utils": {
      "version": "3.3.5",
      "resolved": "https://registry.npmjs.org/jsx-ast-utils/-/jsx-ast-utils-3.3.5.tgz",
      "integrity": "sha512-ZZow9HBI5O6EPgSJLUb8n2NKgmVWTwCvHGwFuJlMjvLFqlGG6pjirPhtdsseaLZjSibD8eegzmYpUZwoIlj2cQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-includes": "^3.1.6",
        "array.prototype.flat": "^1.3.1",
        "object.assign": "^4.1.4",
        "object.values": "^1.1.6"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.0.tgz",
      "integrity": "sha512-KDncfTmOZoOMTFG4mBlG0qUIOlc03fmzH+ru6RgYVZhPkyiy/92Owlt/8UEN+a4TXR1FQetfIpJE8ApdvdVxTg==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.0",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/kareem": {
      "version": "2.6.3",
      "resolved": "https://registry.npmjs.org/kareem/-/kareem-2.6.3.tgz",
      "integrity": "sha512-C3iHfuGUXK2u8/ipq9LfjFfXFxAZMQJJq7vLS45r3D9Y2xQ/m4S8zaR4zMLFWh9AsNPXmcFfUDhTEO8UIC/V6Q==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/keyv": {
      "version": "4.5.4",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",
      "integrity": "sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "json-buffer": "3.0.1"
      }
    },
    "node_modules/language-subtag-registry": {
      "version": "0.3.23",
      "resolved": "https://registry.npmjs.org/language-subtag-registry/-/language-subtag-registry-0.3.23.tgz",
      "integrity": "sha512-0K65Lea881pHotoGEa5gDlMxt3pctLi2RplBb7Ezh4rRdLEOtgi7n4EwK9lamnUCkKBqaeKRVebTq6BAxSkpXQ==",
      "dev": true,
      "license": "CC0-1.0"
    },
    "node_modules/language-tags": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/language-tags/-/language-tags-1.0.9.tgz",
      "integrity": "sha512-MbjN408fEndfiQXbFQ1vnd+1NoLDsnQW41410oQBXiyXDMYH5z505juWa4KUE1LqxRC7DgOgZDbKLxHIwm27hA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "language-subtag-registry": "^0.3.20"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/leaflet": {
      "version": "1.9.4",
      "resolved": "https://registry.npmjs.org/leaflet/-/leaflet-1.9.4.tgz",
      "integrity": "sha512-nxS1ynzJOmOlHp+iL3FyWqK89GtNL8U8rvlMOsQdTTssxZwCXh8N2NB3GDQOL+YR3XnWyZAxwQixURb+FA74PA==",
      "license": "BSD-2-Clause"
    },
    "node_modules/leaflet.markercluster": {
      "version": "1.5.3",
      "resolved": "https://registry.npmjs.org/leaflet.markercluster/-/leaflet.markercluster-1.5.3.tgz",
      "integrity": "sha512-vPTw/Bndq7eQHjLBVlWpnGeLa3t+3zGiuM7fJwCkiMFq+nmRuG3RI3f7f4N4TDX7T4NpbAXpR2+NTRSEGfCSeA==",
      "license": "MIT",
      "peerDependencies": {
        "leaflet": "^1.3.1"
      }
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/lightningcss": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.30.1.tgz",
      "integrity": "sha512-xi6IyHML+c9+Q3W0S4fCQJOym42pyurFiJUHEcEyHS0CeKzia4yZDEsLlqOFykxOdHpNy0NmvVO31vcSqAxJCg==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-darwin-arm64": "1.30.1",
        "lightningcss-darwin-x64": "1.30.1",
        "lightningcss-freebsd-x64": "1.30.1",
        "lightningcss-linux-arm-gnueabihf": "1.30.1",
        "lightningcss-linux-arm64-gnu": "1.30.1",
        "lightningcss-linux-arm64-musl": "1.30.1",
        "lightningcss-linux-x64-gnu": "1.30.1",
        "lightningcss-linux-x64-musl": "1.30.1",
        "lightningcss-win32-arm64-msvc": "1.30.1",
        "lightningcss-win32-x64-msvc": "1.30.1"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.30.1.tgz",
      "integrity": "sha512-c8JK7hyE65X1MHMN+Viq9n11RRC7hgin3HhYKhrMyaXflk5GVplZ60IxyoVtzILeKr+xAJwg6zK6sjTBJ0FKYQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.30.1.tgz",
      "integrity": "sha512-k1EvjakfumAQoTfcXUcHQZhSpLlkAuEkdMBsI/ivWw9hL+7FtilQc0Cy3hrx0AAQrVtQAbMI7YjCgYgvn37PzA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.30.1.tgz",
      "integrity": "sha512-kmW6UGCGg2PcyUE59K5r0kWfKPAVy4SltVeut+umLCFoJ53RdCUWxcRDzO1eTaxf/7Q2H7LTquFHPL5R+Gjyig==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.30.1.tgz",
      "integrity": "sha512-MjxUShl1v8pit+6D/zSPq9S9dQ2NPFSQwGvxBCYaBYLPlCWuPh9/t1MRS8iUaR8i+a6w7aps+B4N0S1TYP/R+Q==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.30.1.tgz",
      "integrity": "sha512-gB72maP8rmrKsnKYy8XUuXi/4OctJiuQjcuqWNlJQ6jZiWqtPvqFziskH3hnajfvKB27ynbVCucKSm2rkQp4Bw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.30.1.tgz",
      "integrity": "sha512-jmUQVx4331m6LIX+0wUhBbmMX7TCfjF5FoOH6SD1CttzuYlGNVpA7QnrmLxrsub43ClTINfGSYyHe2HWeLl5CQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.30.1.tgz",
      "integrity": "sha512-piWx3z4wN8J8z3+O5kO74+yr6ze/dKmPnI7vLqfSqI8bccaTGY5xiSGVIJBDd5K5BHlvVLpUB3S2YCfelyJ1bw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.30.1.tgz",
      "integrity": "sha512-rRomAK7eIkL+tHY0YPxbc5Dra2gXlI63HL+v1Pdi1a3sC+tJTcFrHX+E86sulgAXeI7rSzDYhPSeHHjqFhqfeQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.30.1.tgz",
      "integrity": "sha512-mSL4rqPi4iXq5YVqzSsJgMVFENoa4nGTT/GjO2c0Yl9OuQfPsIfncvLrEW6RbbB24WtZ3xP/2CCmI3tNkNV4oA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.30.1",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.30.1.tgz",
      "integrity": "sha512-PVqXh48wh4T53F/1CCu8PIPCxLzWyCnn/9T5W1Jpmdy5h9Cwd+0YQS6/LwhHXSafuc61/xg9Lv5OrCby6a++jg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/lodash.merge": {
      "version": "4.6.2",
      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/loupe": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/loupe/-/loupe-3.2.1.tgz",
      "integrity": "sha512-CdzqowRJCeLU72bHvWqwRBBlLcMEtIvGrlvef74kMnV2AolS9Y8xUv1I0U/MNAWMhBlKIoyuEgoJ0t/bbwHbLQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/lucide-react": {
      "version": "0.542.0",
      "resolved": "https://registry.npmjs.org/lucide-react/-/lucide-react-0.542.0.tgz",
      "integrity": "sha512-w3hD8/SQB7+lzU2r4VdFyzzOzKnUjTZIF/MQJGSSvni7Llewni4vuViRppfRAa2guOsY5k4jZyxw/i9DQHv+dw==",
      "license": "ISC",
      "peerDependencies": {
        "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/lz-string": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/lz-string/-/lz-string-1.5.0.tgz",
      "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "bin": {
        "lz-string": "bin/bin.js"
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.19",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.19.tgz",
      "integrity": "sha512-2N21sPY9Ws53PZvsEpVtNuSW+ScYbQdp4b9qUaL+9QkHUrGFKo56Lg9Emg5s9V/qrtNBmiR01sYhUOwu3H+VOw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/mdn-data": {
      "version": "2.12.2",
      "resolved": "https://registry.npmjs.org/mdn-data/-/mdn-data-2.12.2.tgz",
      "integrity": "sha512-IEn+pegP1aManZuckezWCO+XZQDplx1366JoVhTpMpBB1sPey/SbveZQUosKiKiGYjg1wH4pMlNgXbCiYgihQA==",
      "dev": true,
      "license": "CC0-1.0"
    },
    "node_modules/memory-pager": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/memory-pager/-/memory-pager-1.5.0.tgz",
      "integrity": "sha512-ZS4Bp4r/Zoeq6+NLJpP+0Zzm0pR8whtGPf1XExKLJBAczGMnSi3It14OiNCStjQjM6NU1okjQGSxgEZN8eBYKg==",
      "license": "MIT"
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz",
      "integrity": "sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "braces": "^3.0.3",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/minimalistic-assert": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/minimalistic-assert/-/minimalistic-assert-1.0.1.tgz",
      "integrity": "sha512-UtJcAD4yEaGtjPezWuO9wC4nwUnVH/8/Im3yEHQP4b67cXlD/Qr9hdITCU1xDbSEXg2XKNaP8jsReV7vQd00/A==",
      "license": "ISC"
    },
    "node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/minipass": {
      "version": "7.1.2",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-7.1.2.tgz",
      "integrity": "sha512-qOOzS1cBTWYF4BH8fVePDBOO9iptMnGUEZwNc/cMWnTV2nVLZ7VoNWEPHkYczZA0pdoA7dl6e7FL659nX9S2aw==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/minizlib": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/minizlib/-/minizlib-3.0.2.tgz",
      "integrity": "sha512-oG62iEk+CYt5Xj2YqI5Xi9xWUeZhDI8jjQmC5oThVH5JGCTgIjr7ciJDzC7MBzYd//WvR1OTmP5Q38Q8ShQtVA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "minipass": "^7.1.2"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/mkdirp": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/mkdirp/-/mkdirp-3.0.1.tgz",
      "integrity": "sha512-+NsyUUAZDmo6YVHzL/stxSu3t9YS1iljliy3BSDrXJ/dkn1KYdmtZODGGjLcc9XLgVVpH4KshHB8XmZgMhaBXg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mkdirp": "dist/cjs/src/bin.js"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/mongodb": {
      "version": "6.19.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-6.19.0.tgz",
      "integrity": "sha512-H3GtYujOJdeKIMLKBT9PwlDhGrQfplABNF1G904w6r5ZXKWyv77aB0X9B+rhmaAwjtllHzaEkvi9mkGVZxs2Bw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@mongodb-js/saslprep": "^1.1.9",
        "bson": "^6.10.4",
        "mongodb-connection-string-url": "^3.0.0"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.188.0",
        "@mongodb-js/zstd": "^1.1.0 || ^2.0.0",
        "gcp-metadata": "^5.2.0",
        "kerberos": "^2.0.1",
        "mongodb-client-encryption": ">=6.0.0 <7",
        "snappy": "^7.3.2",
        "socks": "^2.7.1"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mongodb-connection-string-url": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mongodb-connection-string-url/-/mongodb-connection-string-url-3.0.2.tgz",
      "integrity": "sha512-rMO7CGo/9BFwyZABcKAWL8UJwH/Kc2x0g72uhDWzG48URRax5TCIcJ7Rc3RZqffZzO/Gwff/jyKwCU9TN8gehA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@types/whatwg-url": "^11.0.2",
        "whatwg-url": "^14.1.0 || ^13.0.0"
      }
    },
    "node_modules/mongodb-connection-string-url/node_modules/webidl-conversions": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/mongodb-connection-string-url/node_modules/whatwg-url": {
      "version": "14.2.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-14.2.0.tgz",
      "integrity": "sha512-De72GdQZzNTUBBChsXueQUnPKDkg/5A5zp7pFDuQAj5UFoENpiACU0wlCvzpAGnTkj++ihpKwKyYewn/XNUbKw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "^5.1.0",
        "webidl-conversions": "^7.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/mongoose": {
      "version": "8.18.1",
      "resolved": "https://registry.npmjs.org/mongoose/-/mongoose-8.18.1.tgz",
      "integrity": "sha512-K0RfrUXXufqNRZZjvAGdyjydB91SnbWxlwFYi5t7zN2DxVWFD3c6puia0/7xfBwZm6RCpYOVdYFlRFpoDWiC+w==",
      "license": "MIT",
      "dependencies": {
        "bson": "^6.10.4",
        "kareem": "2.6.3",
        "mongodb": "~6.18.0",
        "mpath": "0.9.0",
        "mquery": "5.0.0",
        "ms": "2.1.3",
        "sift": "17.1.3"
      },
      "engines": {
        "node": ">=16.20.1"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/mongoose"
      }
    },
    "node_modules/mpath": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/mpath/-/mpath-0.9.0.tgz",
      "integrity": "sha512-ikJRQTk8hw5DEoFVxHG1Gn9T/xcjtdnOKIU1JTmGjZZlg9LST2mBLmcX3/ICIbgJydT2GOc15RnNy5mHmzfSew==",
      "license": "MIT",
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mquery": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/mquery/-/mquery-5.0.0.tgz",
      "integrity": "sha512-iQMncpmEK8R8ncT8HJGsGc9Dsp8xcgYMVSbs5jgnm1lFHTZqMJTUWTDx1LBO8+mK3tPNZWFLBghQEIOULSTHZg==",
      "license": "MIT",
      "dependencies": {
        "debug": "4.x"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/mrmime": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/mrmime/-/mrmime-2.0.1.tgz",
      "integrity": "sha512-Y3wQdFg2Va6etvQ5I82yUhGdsKrcYox6p7FfL1LbK2J4V01F9TGlepTIhnK24t7koZibmg82KGglhA1XK5IsLQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/nanoid": {
      "version": "3.3.11",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/napi-postinstall": {
      "version": "0.3.3",
      "resolved": "https://registry.npmjs.org/napi-postinstall/-/napi-postinstall-0.3.3.tgz",
      "integrity": "sha512-uTp172LLXSxuSYHv/kou+f6KW3SMppU9ivthaVTXian9sOt3XM/zHYHpRZiLgQoxeWfYUnslNWQHF1+G71xcow==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "napi-postinstall": "lib/cli.js"
      },
      "engines": {
        "node": "^12.20.0 || ^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/napi-postinstall"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/next": {
      "version": "15.5.2",
      "resolved": "https://registry.npmjs.org/next/-/next-15.5.2.tgz",
      "integrity": "sha512-H8Otr7abj1glFhbGnvUt3gz++0AF1+QoCXEBmd/6aKbfdFwrn0LpA836Ed5+00va/7HQSDD+mOoVhn3tNy3e/Q==",
      "license": "MIT",
      "dependencies": {
        "@next/env": "15.5.2",
        "@swc/helpers": "0.5.15",
        "caniuse-lite": "^1.0.30001579",
        "postcss": "8.4.31",
        "styled-jsx": "5.1.6"
      },
      "bin": {
        "next": "dist/bin/next"
      },
      "engines": {
        "node": "^18.18.0 || ^19.8.0 || >= 20.0.0"
      },
      "optionalDependencies": {
        "@next/swc-darwin-arm64": "15.5.2",
        "@next/swc-darwin-x64": "15.5.2",
        "@next/swc-linux-arm64-gnu": "15.5.2",
        "@next/swc-linux-arm64-musl": "15.5.2",
        "@next/swc-linux-x64-gnu": "15.5.2",
        "@next/swc-linux-x64-musl": "15.5.2",
        "@next/swc-win32-arm64-msvc": "15.5.2",
        "@next/swc-win32-x64-msvc": "15.5.2",
        "sharp": "^0.34.3"
      },
      "peerDependencies": {
        "@opentelemetry/api": "^1.1.0",
        "@playwright/test": "^1.51.1",
        "babel-plugin-react-compiler": "*",
        "react": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "react-dom": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "sass": "^1.3.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        },
        "@playwright/test": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        },
        "sass": {
          "optional": true
        }
      }
    },
    "node_modules/next-auth": {
      "version": "5.0.0-beta.29",
      "resolved": "https://registry.npmjs.org/next-auth/-/next-auth-5.0.0-beta.29.tgz",
      "integrity": "sha512-Ukpnuk3NMc/LiOl32njZPySk7pABEzbjhMUFd5/n10I0ZNC7NCuVv8IY2JgbDek2t/PUOifQEoUiOOTLy4os5A==",
      "license": "ISC",
      "dependencies": {
        "@auth/core": "0.40.0"
      },
      "peerDependencies": {
        "@simplewebauthn/browser": "^9.0.1",
        "@simplewebauthn/server": "^9.0.2",
        "next": "^14.0.0-0 || ^15.0.0-0",
        "nodemailer": "^6.6.5",
        "react": "^18.2.0 || ^19.0.0-0"
      },
      "peerDependenciesMeta": {
        "@simplewebauthn/browser": {
          "optional": true
        },
        "@simplewebauthn/server": {
          "optional": true
        },
        "nodemailer": {
          "optional": true
        }
      }
    },
    "node_modules/next/node_modules/postcss": {
      "version": "8.4.31",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.31.tgz",
      "integrity": "sha512-PS08Iboia9mts/2ygV3eLpY5ghnUcfLV/EXTOW1E2qYxJKGGBUtNjN76FYHnMs36RmARn41bC0AZmn+rR0OVpQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.6",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.21",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.21.tgz",
      "integrity": "sha512-5b0pgg78U3hwXkCM8Z9b2FJdPZlr9Psr9V2gQPESdGHqbntyFJKFW4r5TeWGFzafGY3hzs1JC62VEQMbl1JFkw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/oauth4webapi": {
      "version": "3.8.1",
      "resolved": "https://registry.npmjs.org/oauth4webapi/-/oauth4webapi-3.8.1.tgz",
      "integrity": "sha512-olkZDELNycOWQf9LrsELFq8n05LwJgV8UkrS0cburk6FOwf8GvLam+YB+Uj5Qvryee+vwWOfQVeI5Vm0MVg7SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz",
      "integrity": "sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.assign": {
      "version": "4.1.7",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.7.tgz",
      "integrity": "sha512-nK28WOo+QIjBkDduTINE4JkF/UJJKyf2EJxvJKfblDpyg0Q+pkOHNTL0Qwy6NP6FhE/EnzV73BxxqcJaXY9anw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0",
        "has-symbols": "^1.1.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.entries": {
      "version": "1.1.9",
      "resolved": "https://registry.npmjs.org/object.entries/-/object.entries-1.1.9.tgz",
      "integrity": "sha512-8u/hfXFRBD1O0hPUjioLhoWFHRmt6tKA4/vZPyckBr18l1KE9uHrFaFaUi8MDRTpi4uak2goyPTSNJLXX2k2Hw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.fromentries": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/object.fromentries/-/object.fromentries-2.0.8.tgz",
      "integrity": "sha512-k6E21FzySsSK5a21KRADBd/NGneRegFO5pLHfdQLpRDETUNJueLXs3WCzyQ3tFRDYgbq3KHGXfTbi2bs8WQ6rQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.groupby": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/object.groupby/-/object.groupby-1.0.3.tgz",
      "integrity": "sha512-+Lhy3TQTuzXI5hevh8sBGqbmurHbbIjAi0Z4S63nthVLmLxfbj4T54a4CfZrXIrt9iP4mVAPYMo/v99taj3wjQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.values": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/object.values/-/object.values-1.2.1.tgz",
      "integrity": "sha512-gXah6aZrcUxjWg2zR2MwouP2eHlCBzdV4pygudehaKXSGW4v2AsRQUK+lwwXhii6KFZcunEnmSUoYp5CXibxtA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/optionator": {
      "version": "0.9.4",
      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz",
      "integrity": "sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.5"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/own-keys": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/own-keys/-/own-keys-1.0.1.tgz",
      "integrity": "sha512-qFOyK5PjiWZd+QQIh+1jhdb9LpxTF0qs7Pm8o5QHYZ0M3vKqSqzsZaEB6oWlxZ+q2sJBMI/Ktgd2N5ZwQoRHfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "get-intrinsic": "^1.2.6",
        "object-keys": "^1.1.1",
        "safe-push-apply": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse5": {
      "version": "7.3.0",
      "resolved": "https://registry.npmjs.org/parse5/-/parse5-7.3.0.tgz",
      "integrity": "sha512-IInvU7fabl34qmi9gY8XOVxhYyMyuH2xUNpb2q8/Y+7552KlejkRvqvD19nMoUW/uQGGbqNpA6Tufu5FL5BZgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "entities": "^6.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/pathe": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/pathval": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/pathval/-/pathval-2.0.1.tgz",
      "integrity": "sha512-//nshmD55c46FuFw26xV/xFAaB5HF9Xdap7HJBBnrKdAd6/GxDBaNA1870O79+9ueg61cZLSVc+OaFlfmObYVQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 14.16"
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/possible-typed-array-names": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.1.0.tgz",
      "integrity": "sha512-/+5VFTchJDoVj3bhoqi6UeymcD00DAwb1nJwamzPvHEszJ4FpF6SNNbUbOS8yI56qHzdV8eK0qEfOSiodkTdxg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.6",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.6.tgz",
      "integrity": "sha512-3Ybi1tAuwAP9s0r1UQ2J4n5Y0G05bJkpUIO0/bI9MhwmD70S5aTWbXGBwxHrelT+XM1k6dM0pk+SwNkpTRN7Pg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.11",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/preact": {
      "version": "10.24.3",
      "resolved": "https://registry.npmjs.org/preact/-/preact-10.24.3.tgz",
      "integrity": "sha512-Z2dPnBnMUfyQfSQ+GBdsGa16hz35YmLmtTLhM169uW944hYL6xzTYkJjC07j+Wosz733pMWx0fgON3JNw1jJQA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/preact"
      }
    },
    "node_modules/preact-render-to-string": {
      "version": "6.5.11",
      "resolved": "https://registry.npmjs.org/preact-render-to-string/-/preact-render-to-string-6.5.11.tgz",
      "integrity": "sha512-ubnauqoGczeGISiOh6RjX0/cdaF8v/oDXIjO85XALCQjwQP+SB4RDXXtvZ6yTYSjG+PC1QRP2AhPgCEsM2EvUw==",
      "license": "MIT",
      "peerDependencies": {
        "preact": ">=10"
      }
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/pretty-format": {
      "version": "27.5.1",
      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-27.5.1.tgz",
      "integrity": "sha512-Qb1gy5OrP5+zDf2Bvnzdl3jsTf1qXVMazbvCoKhtKqVs4/YK4ozX4gKQJJVyNe+cajNPn0KoC0MC3FUmaHWEmQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "ansi-regex": "^5.0.1",
        "ansi-styles": "^5.0.0",
        "react-is": "^17.0.1"
      },
      "engines": {
        "node": "^10.13.0 || ^12.13.0 || ^14.15.0 || >=15.0.0"
      }
    },
    "node_modules/pretty-format/node_modules/ansi-styles": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/prop-types": {
      "version": "15.8.1",
      "resolved": "https://registry.npmjs.org/prop-types/-/prop-types-15.8.1.tgz",
      "integrity": "sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.4.0",
        "object-assign": "^4.1.1",
        "react-is": "^16.13.1"
      }
    },
    "node_modules/prop-types/node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/react": {
      "version": "19.1.0",
      "resolved": "https://registry.npmjs.org/react/-/react-19.1.0.tgz",
      "integrity": "sha512-FS+XFBNvn3GTAWq26joslQgWNoFu08F4kl0J4CgdNKADkdSGXQyTCnKteIAJy96Br6YbpEU1LSzV5dYtjMkMDg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "19.1.0",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.1.0.tgz",
      "integrity": "sha512-Xs1hdnE+DyKgeHJeJznQmYMIBG3TKIHJJT95Q58nHLSrElKlGQqDTR2HQ9fx5CN/Gk6Vh/kupBTDLU11/nDk/g==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.26.0"
      },
      "peerDependencies": {
        "react": "^19.1.0"
      }
    },
    "node_modules/react-hook-form": {
      "version": "7.62.0",
      "resolved": "https://registry.npmjs.org/react-hook-form/-/react-hook-form-7.62.0.tgz",
      "integrity": "sha512-7KWFejc98xqG/F4bAxpL41NB3o1nnvQO1RWZT3TqRZYL8RryQETGfEdVnJN2fy1crCiBLLjkRBVK05j24FxJGA==",
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/react-hook-form"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17 || ^18 || ^19"
      }
    },
    "node_modules/react-icons": {
      "version": "5.5.0",
      "resolved": "https://registry.npmjs.org/react-icons/-/react-icons-5.5.0.tgz",
      "integrity": "sha512-MEFcXdkP3dLo8uumGI5xN3lDFNsRtrjbOEKDLD7yv76v4wpnEq2Lt2qeHaQOr34I/wPN3s3+N08WkQ+CW37Xiw==",
      "license": "MIT",
      "peerDependencies": {
        "react": "*"
      }
    },
    "node_modules/react-is": {
      "version": "17.0.2",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-17.0.2.tgz",
      "integrity": "sha512-w2GsyukL62IJnlaff/nRegPQR94C/XXamvMWmSHRJ4y7Ts/4ocGRmTHvOs8PSE6pB3dWOrD/nueuU5sduBsQ4w==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/react-leaflet": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/react-leaflet/-/react-leaflet-5.0.0.tgz",
      "integrity": "sha512-CWbTpr5vcHw5bt9i4zSlPEVQdTVcML390TjeDG0cK59z1ylexpqC6M1PJFjV8jD7CF+ACBFsLIDs6DRMoLEofw==",
      "license": "Hippocratic-2.1",
      "dependencies": {
        "@react-leaflet/core": "^3.0.0"
      },
      "peerDependencies": {
        "leaflet": "^1.9.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0"
      }
    },
    "node_modules/react-leaflet-markercluster": {
      "version": "5.0.0-rc.0",
      "resolved": "https://registry.npmjs.org/react-leaflet-markercluster/-/react-leaflet-markercluster-5.0.0-rc.0.tgz",
      "integrity": "sha512-jWa4bPD5LfLV3Lid1RWgl+yKUuQtnqeYtJzzLb/fiRjvX+rtwzY8pMoUFuygqyxNrWxMTQlWKBHxkpI7Sxvu4Q==",
      "license": "MIT",
      "dependencies": {
        "@react-leaflet/core": "^3.0.0",
        "leaflet": "^1.9.4",
        "leaflet.markercluster": "^1.5.3",
        "react-leaflet": "^5.0.0"
      },
      "peerDependencies": {
        "leaflet": "^1.9.4",
        "leaflet.markercluster": "^1.5.3",
        "react": "^19.0.0",
        "react-leaflet": "^5.0.0"
      }
    },
    "node_modules/react-refresh": {
      "version": "0.17.0",
      "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
      "integrity": "sha512-z6F7K9bV85EfseRCp2bzrpyQ0Gkw1uLoCel9XBVWPg/TjRj94SkJzUTGfOa4bs7iJvBWtQG0Wq7wnI0syw3EBQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-remove-scroll": {
      "version": "2.7.1",
      "resolved": "https://registry.npmjs.org/react-remove-scroll/-/react-remove-scroll-2.7.1.tgz",
      "integrity": "sha512-HpMh8+oahmIdOuS5aFKKY6Pyog+FNaZV/XyJOq7b4YFwsFHe5yYfdbIalI4k3vU2nSDql7YskmUseHsRrJqIPA==",
      "license": "MIT",
      "dependencies": {
        "react-remove-scroll-bar": "^2.3.7",
        "react-style-singleton": "^2.2.3",
        "tslib": "^2.1.0",
        "use-callback-ref": "^1.3.3",
        "use-sidecar": "^1.1.3"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-remove-scroll-bar": {
      "version": "2.3.8",
      "resolved": "https://registry.npmjs.org/react-remove-scroll-bar/-/react-remove-scroll-bar-2.3.8.tgz",
      "integrity": "sha512-9r+yi9+mgU33AKcj6IbT9oRCO78WriSj6t/cF8DWBZJ9aOGPOTEDvdUDz1FwKim7QXWwmHqtdHnRJfhAxEG46Q==",
      "license": "MIT",
      "dependencies": {
        "react-style-singleton": "^2.2.2",
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-style-singleton": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/react-style-singleton/-/react-style-singleton-2.2.3.tgz",
      "integrity": "sha512-b6jSvxvVnyptAiLjbkWLE/lOnR4lfTtDAl+eUC7RZy+QQWc6wRzIV2CE6xBuMmDxc2qIihtDCZD5NPOFl7fRBQ==",
      "license": "MIT",
      "dependencies": {
        "get-nonce": "^1.0.0",
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/reflect.getprototypeof": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/reflect.getprototypeof/-/reflect.getprototypeof-1.0.10.tgz",
      "integrity": "sha512-00o4I+DVrefhv+nX0ulyi3biSHCPDe+yLv5o/p6d/UVlirijB8E16FtfwSAi4g3tcqrQ4lRAqQSoFEZJehYEcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.7",
        "get-proto": "^1.0.1",
        "which-builtin-type": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/regexp.prototype.flags": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/regexp.prototype.flags/-/regexp.prototype.flags-1.5.4.tgz",
      "integrity": "sha512-dYqgNSZbDwkaJ2ceRd9ojCGjBq+mOm9LmtXnAnEGyHhN/5R7iDW2TRw3h+o/jCFxus3P2LfWIIiwowAjANm7IA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-errors": "^1.3.0",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/require-from-string": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/require-from-string/-/require-from-string-2.0.2.tgz",
      "integrity": "sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/resolve": {
      "version": "1.22.10",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.10.tgz",
      "integrity": "sha512-NPRy+/ncIMeDlTAsuqwKIiferiawhefFJtkNSW0qZJEqMEb+qBt/77B/jGeeek+F0uOeN05CDa6HXbbIgtVX4w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-core-module": "^2.16.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/resolve-pkg-maps": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/resolve-pkg-maps/-/resolve-pkg-maps-1.0.0.tgz",
      "integrity": "sha512-seS2Tj26TBVOC2NIc2rOe2y2ZO7efxITtLZcGSOnHHNOQ7CkiUBfw0Iw2ck6xkIhPwLhKNLS8BO+hEpngQlqzw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/privatenumber/resolve-pkg-maps?sponsor=1"
      }
    },
    "node_modules/retry": {
      "version": "0.13.1",
      "resolved": "https://registry.npmjs.org/retry/-/retry-0.13.1.tgz",
      "integrity": "sha512-XQBQ3I8W1Cge0Seh+6gjj03LbmRFWuoszgK9ooCpwYIrhhoO80pfq4cUkU5DkknwfOfFteRwlZ56PYOGYyFWdg==",
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/reusify": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz",
      "integrity": "sha512-g6QUff04oZpHs0eG5p83rFLhHeV00ug/Yf9nZM6fLeUrPguBTkTQOdpAWWspMh55TZfVQDPaN3NQJfbVRAxdIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rollup": {
      "version": "4.50.2",
      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.50.2.tgz",
      "integrity": "sha512-BgLRGy7tNS9H66aIMASq1qSYbAAJV6Z6WR4QYTvj5FgF15rZ/ympT1uixHXwzbZUBDbkvqUI1KR0fH1FhMaQ9w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "1.0.8"
      },
      "bin": {
        "rollup": "dist/bin/rollup"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      "optionalDependencies": {
        "@rollup/rollup-android-arm-eabi": "4.50.2",
        "@rollup/rollup-android-arm64": "4.50.2",
        "@rollup/rollup-darwin-arm64": "4.50.2",
        "@rollup/rollup-darwin-x64": "4.50.2",
        "@rollup/rollup-freebsd-arm64": "4.50.2",
        "@rollup/rollup-freebsd-x64": "4.50.2",
        "@rollup/rollup-linux-arm-gnueabihf": "4.50.2",
        "@rollup/rollup-linux-arm-musleabihf": "4.50.2",
        "@rollup/rollup-linux-arm64-gnu": "4.50.2",
        "@rollup/rollup-linux-arm64-musl": "4.50.2",
        "@rollup/rollup-linux-loong64-gnu": "4.50.2",
        "@rollup/rollup-linux-ppc64-gnu": "4.50.2",
        "@rollup/rollup-linux-riscv64-gnu": "4.50.2",
        "@rollup/rollup-linux-riscv64-musl": "4.50.2",
        "@rollup/rollup-linux-s390x-gnu": "4.50.2",
        "@rollup/rollup-linux-x64-gnu": "4.50.2",
        "@rollup/rollup-linux-x64-musl": "4.50.2",
        "@rollup/rollup-openharmony-arm64": "4.50.2",
        "@rollup/rollup-win32-arm64-msvc": "4.50.2",
        "@rollup/rollup-win32-ia32-msvc": "4.50.2",
        "@rollup/rollup-win32-x64-msvc": "4.50.2",
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/rrweb-cssom": {
      "version": "0.8.0",
      "resolved": "https://registry.npmjs.org/rrweb-cssom/-/rrweb-cssom-0.8.0.tgz",
      "integrity": "sha512-guoltQEx+9aMf2gDZ0s62EcV8lsXR+0w8915TC3ITdn2YueuNjdAYh/levpU9nFaoChh9RUS5ZdQMrKfVEN9tw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/safe-array-concat": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/safe-array-concat/-/safe-array-concat-1.1.3.tgz",
      "integrity": "sha512-AURm5f0jYEOydBj7VQlVvDrjeFgthDdEF5H1dP+6mNpoXOMo1quQqJ4wvJDyRZ9+pO3kGWoOdmV08cSv2aJV6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.2",
        "get-intrinsic": "^1.2.6",
        "has-symbols": "^1.1.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">=0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safe-push-apply": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/safe-push-apply/-/safe-push-apply-1.0.0.tgz",
      "integrity": "sha512-iKE9w/Z7xCzUMIZqdBsp6pEQvwuEebH4vdpjcDWnyzaI6yl6O9FHvVpmGelvEHNsoY6wGblkxR6Zty/h00WiSA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-regex-test": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/safe-regex-test/-/safe-regex-test-1.1.0.tgz",
      "integrity": "sha512-x/+Cz4YrimQxQccJf5mKEbIa1NzeCRNI5Ecl/ekmlYaampdNLPalVyIcCZNNH3MvmqBugV5TMYZXv0ljslUlaw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-regex": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/saxes": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/saxes/-/saxes-6.0.0.tgz",
      "integrity": "sha512-xAg7SOnEhrm5zI3puOOKyy1OMcMlIJZYNJY7xLBwSze0UjhPLnWfj2GF2EpT0jmzaJKIWKHLsaSSajf35bcYnA==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "xmlchars": "^2.2.0"
      },
      "engines": {
        "node": ">=v12.22.7"
      }
    },
    "node_modules/scheduler": {
      "version": "0.26.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.26.0.tgz",
      "integrity": "sha512-NlHwttCI/l5gCPR3D1nNXtWABUmBwvZpEQiD4IXSbIDq8BzLIK/7Ir5gTFSGZDUu37K5cMNp0hFtzO38sC7gWA==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.7.2",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.2.tgz",
      "integrity": "sha512-RF0Fw+rO5AMf9MAyaRXI4AV0Ulj5lMHqVxxdSgiVbixSCXoEmmX/jk0CuJw4+3SqroYO9VoUh+HcuJivvtJemA==",
      "devOptional": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/set-function-length": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/set-function-length/-/set-function-length-1.2.2.tgz",
      "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "gopd": "^1.0.1",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-function-name": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/set-function-name/-/set-function-name-2.0.2.tgz",
      "integrity": "sha512-7PGFlmtwsEADb0WYyvCMa1t+yke6daIG4Wirafur5kcf+MhUnPms1UeR0CKQdTZD81yESwMHbtn+TR+dMviakQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-proto": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/set-proto/-/set-proto-1.0.0.tgz",
      "integrity": "sha512-RJRdvCo6IAnPdsvP/7m6bsQqNnn1FCBX5ZNtFL98MmFF/4xAIJTIg1YbHW5DC2W5SKZanrC6i4HsJqlajw/dZw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/sharp": {
      "version": "0.34.3",
      "resolved": "https://registry.npmjs.org/sharp/-/sharp-0.34.3.tgz",
      "integrity": "sha512-eX2IQ6nFohW4DbvHIOLRB3MHFpYqaqvXd3Tp5e/T/dSH83fxaNJQRvDMhASmkNTsNTVF2/OOopzRCt7xokgPfg==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "color": "^4.2.3",
        "detect-libc": "^2.0.4",
        "semver": "^7.7.2"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-darwin-arm64": "0.34.3",
        "@img/sharp-darwin-x64": "0.34.3",
        "@img/sharp-libvips-darwin-arm64": "1.2.0",
        "@img/sharp-libvips-darwin-x64": "1.2.0",
        "@img/sharp-libvips-linux-arm": "1.2.0",
        "@img/sharp-libvips-linux-arm64": "1.2.0",
        "@img/sharp-libvips-linux-ppc64": "1.2.0",
        "@img/sharp-libvips-linux-s390x": "1.2.0",
        "@img/sharp-libvips-linux-x64": "1.2.0",
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.0",
        "@img/sharp-libvips-linuxmusl-x64": "1.2.0",
        "@img/sharp-linux-arm": "0.34.3",
        "@img/sharp-linux-arm64": "0.34.3",
        "@img/sharp-linux-ppc64": "0.34.3",
        "@img/sharp-linux-s390x": "0.34.3",
        "@img/sharp-linux-x64": "0.34.3",
        "@img/sharp-linuxmusl-arm64": "0.34.3",
        "@img/sharp-linuxmusl-x64": "0.34.3",
        "@img/sharp-wasm32": "0.34.3",
        "@img/sharp-win32-arm64": "0.34.3",
        "@img/sharp-win32-ia32": "0.34.3",
        "@img/sharp-win32-x64": "0.34.3"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.0.tgz",
      "integrity": "sha512-ZX99e6tRweoUXqR+VBrslhda51Nh5MTQwou5tnUDgbtyM0dBgmhEDtWGP/xbKn6hqfPRHujUNwz5fy/wbbhnpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3",
        "side-channel-list": "^1.0.0",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.0.tgz",
      "integrity": "sha512-FCLHtRD/gnpCiCHEiJLOwdmFP+wzCmDEkc9y7NsYxeF4u7Btsn1ZuwgwJGxImImHicJArLP4R0yX4c2KCrMrTA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sift": {
      "version": "17.1.3",
      "resolved": "https://registry.npmjs.org/sift/-/sift-17.1.3.tgz",
      "integrity": "sha512-Rtlj66/b0ICeFzYTuNvX/EF1igRbbnGSvEyT79McoZa/DeGhMyC5pWKOEsZKnpkqtSeovd5FL/bjHWC3CIIvCQ==",
      "license": "MIT"
    },
    "node_modules/siginfo": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/siginfo/-/siginfo-2.0.0.tgz",
      "integrity": "sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/simple-swizzle": {
      "version": "0.2.4",
      "resolved": "https://registry.npmjs.org/simple-swizzle/-/simple-swizzle-0.2.4.tgz",
      "integrity": "sha512-nAu1WFPQSMNr2Zn9PGSZK9AGn4t/y97lEm+MXTtUDwfP0ksAIX4nO+6ruD9Jwut4C49SB1Ws+fbXsm/yScWOHw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "is-arrayish": "^0.3.1"
      }
    },
    "node_modules/sirv": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/sirv/-/sirv-3.0.2.tgz",
      "integrity": "sha512-2wcC/oGxHis/BoHkkPwldgiPSYcpZK3JU28WoMVv55yHJgcZ8rlXvuG9iZggz+sU1d4bRgIGASwyWqjxu3FM0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@polka/url": "^1.0.0-next.24",
        "mrmime": "^2.0.0",
        "totalist": "^3.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/sonner": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/sonner/-/sonner-2.0.7.tgz",
      "integrity": "sha512-W6ZN4p58k8aDKA4XPcx2hpIQXBRAgyiWVkYhT7CvK6D3iAu7xjvVyhQHg2/iaKJZ1XVJ4r7XuwGL+WGEK37i9w==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^18.0.0 || ^19.0.0 || ^19.0.0-rc",
        "react-dom": "^18.0.0 || ^19.0.0 || ^19.0.0-rc"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/sparse-bitfield": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/sparse-bitfield/-/sparse-bitfield-3.0.3.tgz",
      "integrity": "sha512-kvzhi7vqKTfkh0PZU+2D2PIllw2ymqJKujUcyPMd9Y75Nv4nPbGJZXNhxsgdQab2BmlDct1YnfQCguEvHr7VsQ==",
      "license": "MIT",
      "dependencies": {
        "memory-pager": "^1.0.2"
      }
    },
    "node_modules/stable-hash": {
      "version": "0.0.5",
      "resolved": "https://registry.npmjs.org/stable-hash/-/stable-hash-0.0.5.tgz",
      "integrity": "sha512-+L3ccpzibovGXFK+Ap/f8LOS0ahMrHTf3xu7mMLSpEGU0EO9ucaysSylKo9eRDFNhWve/y275iPmIZ4z39a9iA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/stackback": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
      "integrity": "sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/std-env": {
      "version": "3.9.0",
      "resolved": "https://registry.npmjs.org/std-env/-/std-env-3.9.0.tgz",
      "integrity": "sha512-UGvjygr6F6tpH7o2qyqR6QYpwraIjKSdtzyBdyytFOHmPZY917kwdwLG0RbOjWOnKmnm3PeHjaoLLMie7kPLQw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/stop-iteration-iterator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/stop-iteration-iterator/-/stop-iteration-iterator-1.1.0.tgz",
      "integrity": "sha512-eLoXW/DHyl62zxY4SCaIgnRhuMr6ri4juEYARS8E6sCEqzKpOiE521Ucofdx+KnDZl5xmvGYaaKCk5FEOxJCoQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "internal-slot": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/string.prototype.includes": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/string.prototype.includes/-/string.prototype.includes-2.0.1.tgz",
      "integrity": "sha512-o7+c9bW6zpAdJHTtujeePODAhkuicdAryFsfVKwA+wGw89wJ4GTY484WTucM9hLtDEOpOvI+aHnzqnC5lHp4Rg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/string.prototype.matchall": {
      "version": "4.0.12",
      "resolved": "https://registry.npmjs.org/string.prototype.matchall/-/string.prototype.matchall-4.0.12.tgz",
      "integrity": "sha512-6CC9uyBL+/48dYizRf7H7VAYCMCNTBeM78x/VTUe9bFEaxBepPJDa1Ow99LqI/1yF7kuy7Q3cQsYMrcjGUcskA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.6",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.6",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "internal-slot": "^1.1.0",
        "regexp.prototype.flags": "^1.5.3",
        "set-function-name": "^2.0.2",
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.repeat": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/string.prototype.repeat/-/string.prototype.repeat-1.0.0.tgz",
      "integrity": "sha512-0u/TldDbKD8bFCQ/4f5+mNRrXwZ8hg2w7ZR8wa16e8z9XpePWl3eGEcUD0OXpEH/VJH/2G3gjUtR3ZOiBe2S/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.1.3",
        "es-abstract": "^1.17.5"
      }
    },
    "node_modules/string.prototype.trim": {
      "version": "1.2.10",
      "resolved": "https://registry.npmjs.org/string.prototype.trim/-/string.prototype.trim-1.2.10.tgz",
      "integrity": "sha512-Rs66F0P/1kedk5lyYyH9uBzuiI/kNRmwJAR9quK6VOtIpZ2G+hMZd+HQbbv25MgCA6gEffoMZYxlTod4WcdrKA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.2",
        "define-data-property": "^1.1.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-object-atoms": "^1.0.0",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimend": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/string.prototype.trimend/-/string.prototype.trimend-1.0.9.tgz",
      "integrity": "sha512-G7Ok5C6E/j4SGfyLCloXTrngQIQU3PWtXGst3yM7Bea9FRURf1S42ZHlZZtsNque2FN2PoUhfZXYLNWwEr4dLQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.2",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimstart": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/string.prototype.trimstart/-/string.prototype.trimstart-1.0.8.tgz",
      "integrity": "sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/strip-literal": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-literal/-/strip-literal-3.0.0.tgz",
      "integrity": "sha512-TcccoMhJOM3OebGhSBEmp3UZ2SfDMZUEBdRA/9ynfLi8yYajyWX3JiXArcJt4Umh4vISpspkQIY8ZZoCqjbviA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^9.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/antfu"
      }
    },
    "node_modules/strip-literal/node_modules/js-tokens": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-9.0.1.tgz",
      "integrity": "sha512-mxa9E9ITFOt0ban3j6L5MpjwegGz6lBQmM1IJkWeBZGcMxto50+eWdjC/52xDbS2vy0k7vIMK0Fe2wfL9OQSpQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/styled-jsx": {
      "version": "5.1.6",
      "resolved": "https://registry.npmjs.org/styled-jsx/-/styled-jsx-5.1.6.tgz",
      "integrity": "sha512-qSVyDTeMotdvQYoHWLNGwRFJHC+i+ZvdBRYosOFgC+Wg1vx4frN2/RG/NA7SYqqvKNLf39P2LSRA2pu6n0XYZA==",
      "license": "MIT",
      "dependencies": {
        "client-only": "0.0.1"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "peerDependencies": {
        "react": ">= 16.8.0 || 17.x.x || ^18.0.0-0 || ^19.0.0-0"
      },
      "peerDependenciesMeta": {
        "@babel/core": {
          "optional": true
        },
        "babel-plugin-macros": {
          "optional": true
        }
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/symbol-tree": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/symbol-tree/-/symbol-tree-3.2.4.tgz",
      "integrity": "sha512-9QNk5KwDF+Bvz+PyObkmSYjI5ksVUYtjW7AU22r2NKcfLJcXp96hkDWU3+XndOsUb+AQ9QhfzfCT2O+CNWT5Tw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tailwind-merge": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/tailwind-merge/-/tailwind-merge-3.3.1.tgz",
      "integrity": "sha512-gBXpgUm/3rp1lMZZrM/w7D8GKqshif0zAymAhbCyIt8KMe+0v9DQ7cdYLR4FHH/cKpdTXb+A/tKKU3eolfsI+g==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/dcastil"
      }
    },
    "node_modules/tailwindcss": {
      "version": "4.1.13",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.1.13.tgz",
      "integrity": "sha512-i+zidfmTqtwquj4hMEwdjshYYgMbOrPzb9a0M3ZgNa0JMoZeFC6bxZvO8yr8ozS6ix2SDz0+mvryPeBs2TFE+w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tapable": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.2.3.tgz",
      "integrity": "sha512-ZL6DDuAlRlLGghwcfmSn9sK3Hr6ArtyudlSAiCqQ6IfE+b+HHbydbYDIG15IfS5do+7XQQBdBiubF/cV2dnDzg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/tar": {
      "version": "7.4.3",
      "resolved": "https://registry.npmjs.org/tar/-/tar-7.4.3.tgz",
      "integrity": "sha512-5S7Va8hKfV7W5U6g3aYxXmlPoZVAwUMy9AOKyF2fVuZa2UD3qZjg578OrLRt8PcNN1PleVaL/5/yYATNL0ICUw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@isaacs/fs-minipass": "^4.0.0",
        "chownr": "^3.0.0",
        "minipass": "^7.1.2",
        "minizlib": "^3.0.1",
        "mkdirp": "^3.0.1",
        "yallist": "^5.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/tar/node_modules/yallist": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-5.0.0.tgz",
      "integrity": "sha512-YgvUTfwqyc7UXVMrB+SImsVYSmTS8X/tSrtdNZMImM+n7+QTriRXyXim0mBrTXNeqzVF0KWGgHPeiyViFFrNDw==",
      "dev": true,
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/throttleit": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/throttleit/-/throttleit-2.1.0.tgz",
      "integrity": "sha512-nt6AMGKW1p/70DF/hGBdJB57B8Tspmbp5gfJ8ilhLnt7kkr2ye7hzD6NVG8GGErk2HWF34igrL2CXmNIkzKqKw==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/tinybench": {
      "version": "2.9.0",
      "resolved": "https://registry.npmjs.org/tinybench/-/tinybench-2.9.0.tgz",
      "integrity": "sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tinyexec": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-0.3.2.tgz",
      "integrity": "sha512-KQQR9yN7R5+OSwaK0XQoj22pwHoTlgYqmUscPYoknOoWCWfj/5/ABTMRi69FrKU5ffPVh5QcFikpWJI/P1ocHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tinyglobby": {
      "version": "0.2.15",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.15.tgz",
      "integrity": "sha512-j2Zq4NyQYG5XMST4cbs02Ak8iJUdxRM0XI5QyxXuZOzKOINmWurp3smXu3y5wDcJrptwpSjgXHzIQxR0omXljQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.3"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tinyglobby/node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/tinyglobby/node_modules/picomatch": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/tinypool": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/tinypool/-/tinypool-1.1.1.tgz",
      "integrity": "sha512-Zba82s87IFq9A9XmjiX5uZA/ARWDrB03OHlq+Vw1fSdt0I+4/Kutwy8BP4Y/y/aORMo61FQ0vIb5j44vSo5Pkg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.0.0 || >=20.0.0"
      }
    },
    "node_modules/tinyrainbow": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/tinyrainbow/-/tinyrainbow-2.0.0.tgz",
      "integrity": "sha512-op4nsTR47R6p0vMUUoYl/a+ljLFVtlfaXkLQmqfLR1qHma1h/ysYk4hEXZ880bf2CYgTskvTa/e196Vd5dDQXw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/tinyspy": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/tinyspy/-/tinyspy-4.0.3.tgz",
      "integrity": "sha512-t2T/WLB2WRgZ9EpE4jgPJ9w+i66UZfDc8wHh0xrwiRNN+UwH98GIJkTeZqX9rg0i0ptwzqW+uYeIF0T4F8LR7A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/tldts": {
      "version": "7.0.14",
      "resolved": "https://registry.npmjs.org/tldts/-/tldts-7.0.14.tgz",
      "integrity": "sha512-lMNHE4aSI3LlkMUMicTmAG3tkkitjOQGDTFboPJwAg2kJXKP1ryWEyqujktg5qhrFZOkk5YFzgkxg3jErE+i5w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tldts-core": "^7.0.14"
      },
      "bin": {
        "tldts": "bin/cli.js"
      }
    },
    "node_modules/tldts-core": {
      "version": "7.0.14",
      "resolved": "https://registry.npmjs.org/tldts-core/-/tldts-core-7.0.14.tgz",
      "integrity": "sha512-viZGNK6+NdluOJWwTO9olaugx0bkKhscIdriQQ+lNNhwitIKvb+SvhbYgnCz6j9p7dX3cJntt4agQAKMXLjJ5g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/totalist": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/totalist/-/totalist-3.0.1.tgz",
      "integrity": "sha512-sf4i37nQ2LBx4m3wB74y+ubopq6W/dIzXg0FDGjsYnZHVa1Da8FH853wlL2gtUhg+xJXjfk3kUZS3BRoQeoQBQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/tough-cookie": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/tough-cookie/-/tough-cookie-6.0.0.tgz",
      "integrity": "sha512-kXuRi1mtaKMrsLUxz3sQYvVl37B0Ns6MzfrtV5DvJceE9bPyspOqk9xxv7XbZWcfLWbFmm997vl83qUWVJA64w==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "tldts": "^7.0.5"
      },
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/tr46": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-5.1.1.tgz",
      "integrity": "sha512-hdF5ZgjTqgAntKkklYw0R03MG2x/bSzTtkxmIRw/sTNV8YXsCJ1tfLAX23lhxhHJlEf3CRCOCGGWw3vI3GaSPw==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^2.3.1"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/ts-api-utils": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/ts-api-utils/-/ts-api-utils-2.1.0.tgz",
      "integrity": "sha512-CUgTZL1irw8u29bzrOD/nH85jqyc74D6SshFgujOIA7osm2Rz7dYH77agkx7H4FBNxDq7Cjf+IjaX/8zwFW+ZQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.12"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4"
      }
    },
    "node_modules/tsconfig-paths": {
      "version": "3.15.0",
      "resolved": "https://registry.npmjs.org/tsconfig-paths/-/tsconfig-paths-3.15.0.tgz",
      "integrity": "sha512-2Ac2RgzDe/cn48GvOe3M+o82pEFewD3UPbyoUHHdKasHwJKjds4fLXWf/Ux5kATBKN20oaFGu+jbElp1pos0mg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json5": "^0.0.29",
        "json5": "^1.0.2",
        "minimist": "^1.2.6",
        "strip-bom": "^3.0.0"
      }
    },
    "node_modules/tsconfig-paths/node_modules/json5": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/json5/-/json5-1.0.2.tgz",
      "integrity": "sha512-g1MWMLBiz8FKi1e4w0UyVL3w+iJceWAFBAaBnnGKOpNa5f8TLktkbre1+s6oICydWAm+HRUGTmI+//xv2hvXYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "minimist": "^1.2.0"
      },
      "bin": {
        "json5": "lib/cli.js"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/tw-animate-css": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/tw-animate-css/-/tw-animate-css-1.3.8.tgz",
      "integrity": "sha512-Qrk3PZ7l7wUcGYhwZloqfkWCmaXZAoqjkdbIDvzfGshwGtexa/DAs9koXxIkrpEasyevandomzCBAV1Yyop5rw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/Wombosvideo"
      }
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/typed-array-buffer": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-buffer/-/typed-array-buffer-1.0.3.tgz",
      "integrity": "sha512-nAYYwfY3qnzX30IkA6AQZjVbtK6duGontcQm1WSG1MD94YLqK0515GNApXkoxKOWMusVssAHWLh9SeaoefYFGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/typed-array-byte-length": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-byte-length/-/typed-array-byte-length-1.0.3.tgz",
      "integrity": "sha512-BaXgOuIxz8n8pIq3e7Atg/7s+DpiYrxn4vdot3w9KbnBhcRQq6o3xemQdIfynqSeXeDrF32x+WvfzmOjPiY9lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-byte-offset": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/typed-array-byte-offset/-/typed-array-byte-offset-1.0.4.tgz",
      "integrity": "sha512-bTlAFB/FBYMcuX81gbL4OcpH5PmlFHqlCCpAl8AlEzMz5k53oNDvN8p1PNOWLEmI2x4orp3raOFB51tv9X+MFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.15",
        "reflect.getprototypeof": "^1.0.9"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-length": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/typed-array-length/-/typed-array-length-1.0.7.tgz",
      "integrity": "sha512-3KS2b+kL7fsuk/eJZ7EQdnEmQoaho/r6KUef7hxvltNA5DR8NAUM+8wJMbJyZ4G9/7i3v5zPBIMN5aybAh2/Jg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "for-each": "^0.3.3",
        "gopd": "^1.0.1",
        "is-typed-array": "^1.1.13",
        "possible-typed-array-names": "^1.0.0",
        "reflect.getprototypeof": "^1.0.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.2",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.2.tgz",
      "integrity": "sha512-CWBzXQrc/qOkhidw1OzBTQuYRbfyxDXJMVJ1XNwUHGROVmuaeiEm3OslpZ1RV96d7SKKjZKrSJu3+t/xlw3R9A==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/unbox-primitive": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/unbox-primitive/-/unbox-primitive-1.1.0.tgz",
      "integrity": "sha512-nWJ91DjeOkej/TA8pXQ3myruKpKEYgqvpw9lz4OPHj/NWFNluYrjbz9j01CJ8yKQd2g4jFoOkINCTW2I5LEEyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-bigints": "^1.0.2",
        "has-symbols": "^1.1.0",
        "which-boxed-primitive": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/undici": {
      "version": "5.29.0",
      "resolved": "https://registry.npmjs.org/undici/-/undici-5.29.0.tgz",
      "integrity": "sha512-raqeBD6NQK4SkWhQzeYKd1KmIG6dllBOTt55Rmkt4HtI9mwdWtJljnrXjAFUBLTSN67HWrOIZ3EPF4kjUw80Bg==",
      "license": "MIT",
      "dependencies": {
        "@fastify/busboy": "^2.0.0"
      },
      "engines": {
        "node": ">=14.0"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unrs-resolver": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/unrs-resolver/-/unrs-resolver-1.11.1.tgz",
      "integrity": "sha512-bSjt9pjaEBnNiGgc9rUiHGKv5l4/TGzDmYw3RhnkJGtLhbnnA/5qJj7x3dNDCRx/PJxu774LlH8lCOlB4hEfKg==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "napi-postinstall": "^0.3.0"
      },
      "funding": {
        "url": "https://opencollective.com/unrs-resolver"
      },
      "optionalDependencies": {
        "@unrs/resolver-binding-android-arm-eabi": "1.11.1",
        "@unrs/resolver-binding-android-arm64": "1.11.1",
        "@unrs/resolver-binding-darwin-arm64": "1.11.1",
        "@unrs/resolver-binding-darwin-x64": "1.11.1",
        "@unrs/resolver-binding-freebsd-x64": "1.11.1",
        "@unrs/resolver-binding-linux-arm-gnueabihf": "1.11.1",
        "@unrs/resolver-binding-linux-arm-musleabihf": "1.11.1",
        "@unrs/resolver-binding-linux-arm64-gnu": "1.11.1",
        "@unrs/resolver-binding-linux-arm64-musl": "1.11.1",
        "@unrs/resolver-binding-linux-ppc64-gnu": "1.11.1",
        "@unrs/resolver-binding-linux-riscv64-gnu": "1.11.1",
        "@unrs/resolver-binding-linux-riscv64-musl": "1.11.1",
        "@unrs/resolver-binding-linux-s390x-gnu": "1.11.1",
        "@unrs/resolver-binding-linux-x64-gnu": "1.11.1",
        "@unrs/resolver-binding-linux-x64-musl": "1.11.1",
        "@unrs/resolver-binding-wasm32-wasi": "1.11.1",
        "@unrs/resolver-binding-win32-arm64-msvc": "1.11.1",
        "@unrs/resolver-binding-win32-ia32-msvc": "1.11.1",
        "@unrs/resolver-binding-win32-x64-msvc": "1.11.1"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.1.3.tgz",
      "integrity": "sha512-UxhIZQ+QInVdunkDAaiazvvT/+fXL5Osr0JZlJulepYu6Jd7qJtDZjlur0emRlT71EN3ScPoE7gvsuIKKNavKw==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/use-callback-ref": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/use-callback-ref/-/use-callback-ref-1.3.3.tgz",
      "integrity": "sha512-jQL3lRnocaFtu3V00JToYz/4QkNWswxijDaCVNZRiRTO3HQDLsdu1ZtmIUvV4yPp+rvWm5j0y0TG/S61cuijTg==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/use-sidecar": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/use-sidecar/-/use-sidecar-1.1.3.tgz",
      "integrity": "sha512-Fedw0aZvkhynoPYlA5WXrMCAMm+nSWdZt6lzJQ7Ok8S6Q+VsHmHpRWndVRJ8Be0ZbkfPc5LRYH+5XrzXcEeLRQ==",
      "license": "MIT",
      "dependencies": {
        "detect-node-es": "^1.1.0",
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/uuid": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-11.1.0.tgz",
      "integrity": "sha512-0/A9rDy9P7cJ+8w1c9WD9V//9Wj15Ce2MPz8Ri6032usz+NfePxx5AcN3bN+r6ZL6jEo066/yNYB3tn4pQEx+A==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/esm/bin/uuid"
      }
    },
    "node_modules/vite": {
      "version": "7.1.5",
      "resolved": "https://registry.npmjs.org/vite/-/vite-7.1.5.tgz",
      "integrity": "sha512-4cKBO9wR75r0BeIWWWId9XK9Lj6La5X846Zw9dFfzMRw38IlTk2iCcUt6hsyiDRcPidc55ZParFYDXi0nXOeLQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "^0.25.0",
        "fdir": "^6.5.0",
        "picomatch": "^4.0.3",
        "postcss": "^8.5.6",
        "rollup": "^4.43.0",
        "tinyglobby": "^0.2.15"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "lightningcss": "^1.21.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "lightningcss": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/vite-node": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/vite-node/-/vite-node-3.2.4.tgz",
      "integrity": "sha512-EbKSKh+bh1E1IFxeO0pg1n4dvoOTt0UDiXMd/qn++r98+jPO1xtJilvXldeuQ8giIB5IkpjCgMleHMNEsGH6pg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cac": "^6.7.14",
        "debug": "^4.4.1",
        "es-module-lexer": "^1.7.0",
        "pathe": "^2.0.3",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
      },
      "bin": {
        "vite-node": "vite-node.mjs"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/vite/node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/vite/node_modules/picomatch": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/vitest": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/vitest/-/vitest-3.2.4.tgz",
      "integrity": "sha512-LUCP5ev3GURDysTWiP47wRRUpLKMOfPh+yKTx3kVIEiu5KOMeqzpnYNsKyOoVrULivR8tLcks4+lga33Whn90A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/chai": "^5.2.2",
        "@vitest/expect": "3.2.4",
        "@vitest/mocker": "3.2.4",
        "@vitest/pretty-format": "^3.2.4",
        "@vitest/runner": "3.2.4",
        "@vitest/snapshot": "3.2.4",
        "@vitest/spy": "3.2.4",
        "@vitest/utils": "3.2.4",
        "chai": "^5.2.0",
        "debug": "^4.4.1",
        "expect-type": "^1.2.1",
        "magic-string": "^0.30.17",
        "pathe": "^2.0.3",
        "picomatch": "^4.0.2",
        "std-env": "^3.9.0",
        "tinybench": "^2.9.0",
        "tinyexec": "^0.3.2",
        "tinyglobby": "^0.2.14",
        "tinypool": "^1.1.1",
        "tinyrainbow": "^2.0.0",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0",
        "vite-node": "3.2.4",
        "why-is-node-running": "^2.3.0"
      },
      "bin": {
        "vitest": "vitest.mjs"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "@edge-runtime/vm": "*",
        "@types/debug": "^4.1.12",
        "@types/node": "^18.0.0 || ^20.0.0 || >=22.0.0",
        "@vitest/browser": "3.2.4",
        "@vitest/ui": "3.2.4",
        "happy-dom": "*",
        "jsdom": "*"
      },
      "peerDependenciesMeta": {
        "@edge-runtime/vm": {
          "optional": true
        },
        "@types/debug": {
          "optional": true
        },
        "@types/node": {
          "optional": true
        },
        "@vitest/browser": {
          "optional": true
        },
        "@vitest/ui": {
          "optional": true
        },
        "happy-dom": {
          "optional": true
        },
        "jsdom": {
          "optional": true
        }
      }
    },
    "node_modules/vitest/node_modules/picomatch": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/w3c-xmlserializer": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/w3c-xmlserializer/-/w3c-xmlserializer-5.0.0.tgz",
      "integrity": "sha512-o8qghlI8NZHU1lLPrpi2+Uq7abh4GGPpYANlalzWxyWteJOCsr/P+oPBA49TOLu5FTZO4d3F9MnWJfiMo4BkmA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "xml-name-validator": "^5.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/web-push": {
      "version": "3.6.7",
      "resolved": "https://registry.npmjs.org/web-push/-/web-push-3.6.7.tgz",
      "integrity": "sha512-OpiIUe8cuGjrj3mMBFWY+e4MMIkW3SVT+7vEIjvD9kejGUypv8GPDf84JdPWskK8zMRIJ6xYGm+Kxr8YkPyA0A==",
      "license": "MPL-2.0",
      "dependencies": {
        "asn1.js": "^5.3.0",
        "http_ece": "1.2.0",
        "https-proxy-agent": "^7.0.0",
        "jws": "^4.0.0",
        "minimist": "^1.2.5"
      },
      "bin": {
        "web-push": "src/cli.js"
      },
      "engines": {
        "node": ">= 16"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-8.0.0.tgz",
      "integrity": "sha512-n4W4YFyz5JzOfQeA8oN7dUYpR+MBP3PIUsn2jLjWXwK5ASUzt0Jc/A5sAUZoCYFJRGF0FBKJ+1JjN43rNdsQzA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/whatwg-encoding": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/whatwg-encoding/-/whatwg-encoding-3.1.1.tgz",
      "integrity": "sha512-6qN4hJdMwfYBtE3YBTTHhoeuUrDBPZmbQaxWAqSALV/MeEnR5z1xd8UKud2RAkFoPkmB+hli1TZSnyi84xz1vQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "iconv-lite": "0.6.3"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/whatwg-mimetype": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-mimetype/-/whatwg-mimetype-4.0.0.tgz",
      "integrity": "sha512-QaKxh0eNIi2mE9p2vEdzfagOKHCcj1pJ56EEHGQOVxp8r9/iszLUUV7v89x9O1p/T+NlTM5W7jW6+cz4Fq1YVg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/whatwg-url": {
      "version": "15.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-15.0.0.tgz",
      "integrity": "sha512-+0q+Pc6oUhtbbeUfuZd4heMNOLDJDdagYxv756mCf9vnLF+NTj4zvv5UyYNkHJpc3CJIesMVoEIOdhi7L9RObA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tr46": "^5.1.1",
        "webidl-conversions": "^8.0.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/which-boxed-primitive": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/which-boxed-primitive/-/which-boxed-primitive-1.1.1.tgz",
      "integrity": "sha512-TbX3mj8n0odCBFVlY8AxkqcHASw3L60jIuF8jFP78az3C2YhmGvqbHBpAjTRH2/xqYunrJ9g1jSyjCjpoWzIAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-bigint": "^1.1.0",
        "is-boolean-object": "^1.2.1",
        "is-number-object": "^1.1.1",
        "is-string": "^1.1.1",
        "is-symbol": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-builtin-type": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/which-builtin-type/-/which-builtin-type-1.2.1.tgz",
      "integrity": "sha512-6iBczoX+kDQ7a3+YJBnh3T+KZRxM/iYNPXicqk66/Qfm1b93iu+yOImkg0zHbj5LNOcNv1TEADiZ0xa34B4q6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "function.prototype.name": "^1.1.6",
        "has-tostringtag": "^1.0.2",
        "is-async-function": "^2.0.0",
        "is-date-object": "^1.1.0",
        "is-finalizationregistry": "^1.1.0",
        "is-generator-function": "^1.0.10",
        "is-regex": "^1.2.1",
        "is-weakref": "^1.0.2",
        "isarray": "^2.0.5",
        "which-boxed-primitive": "^1.1.0",
        "which-collection": "^1.0.2",
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-collection": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/which-collection/-/which-collection-1.0.2.tgz",
      "integrity": "sha512-K4jVyjnBdgvc86Y6BkaLZEN933SwYOuBFkdmBu9ZfkcAbdVbpITnDmjvZ/aQjRXQrv5EPkTnD1s39GiiqbngCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-map": "^2.0.3",
        "is-set": "^2.0.3",
        "is-weakmap": "^2.0.2",
        "is-weakset": "^2.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-typed-array": {
      "version": "1.1.19",
      "resolved": "https://registry.npmjs.org/which-typed-array/-/which-typed-array-1.1.19.tgz",
      "integrity": "sha512-rEvr90Bck4WZt9HHFC4DJMsjvu7x+r6bImz0/BrbWb7A2djJ8hnZMrWnHo9F8ssv0OMErasDhftrfROTyqSDrw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "for-each": "^0.3.5",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/why-is-node-running": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/why-is-node-running/-/why-is-node-running-2.3.0.tgz",
      "integrity": "sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "siginfo": "^2.0.0",
        "stackback": "0.0.2"
      },
      "bin": {
        "why-is-node-running": "cli.js"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/word-wrap": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
      "integrity": "sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ws": {
      "version": "8.18.3",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.3.tgz",
      "integrity": "sha512-PEIGCY5tSlUt50cqyMXfCzX+oOPqN0vuGqWzbcJ2xvnkzkq46oOpz7dQaTDBdfICb4N14+GARUDw2XV2N4tvzg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/xml-name-validator": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/xml-name-validator/-/xml-name-validator-5.0.0.tgz",
      "integrity": "sha512-EvGK8EJ3DhaHfbRlETOWAS5pO9MZITeauHKJyb8wyajUfQUenkIg2MvLDTZ4T/TgIcm3HU0TFBgWWboAZ30UHg==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/xmlchars": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/xmlchars/-/xmlchars-2.2.0.tgz",
      "integrity": "sha512-JZnDKK8B0RCDw84FNdDAIpZK+JuJw+s7Lz8nksI7SIuU3UXJJslUthsi+uWBUYOwPFwW7W7PRLRfUKpxjtjFCw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "4.1.8",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.1.8.tgz",
      "integrity": "sha512-5R1P+WwQqmmMIEACyzSvo4JXHY5WiAFHRMg+zBZKgKS+Q1viRa0C1hmUKtHltoIFKtIdki3pRxkmpP74jnNYHQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/zustand": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/zustand/-/zustand-5.0.8.tgz",
      "integrity": "sha512-gyPKpIaxY9XcO2vSMrLbiER7QMAMGOQZVRdJ6Zi782jkbzZygq5GI9nG8g+sMgitRtndwaBSl7uiqC49o1SSiw==",
      "license": "MIT",
      "engines": {
        "node": ">=12.20.0"
      },
      "peerDependencies": {
        "@types/react": ">=18.0.0",
        "immer": ">=9.0.6",
        "react": ">=18.0.0",
        "use-sync-external-store": ">=1.2.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "immer": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "use-sync-external-store": {
          "optional": true
        }
      }
    }
  }
}

```

<!-- path: middleware.ts -->
```typescript
import { auth } from "@/auth"

// The middleware will run on all paths defined in the matcher.
// The `auth` function from NextAuth handles the redirection logic automatically.
// If the user is not authenticated, it will redirect them to the login page defined in `auth.config.ts`.
export default auth;

export const runtime = "nodejs";

// This config specifies that the middleware should ONLY run on the specified paths.
export const config = {
  /*
   * This is a "protect-first" or "include-only" matcher. The middleware will ONLY
   * run on paths that match these patterns.
   *
   * We want to protect:
   * - The root page ("/")
   * - Any other pages you create (e.g., "/dashboard", "/profile")
   *
   * We explicitly DO NOT include '/login' because we don't want the middleware
   * to run on the login page itself, which would cause a redirect loop.
   */
  matcher: [
    '/',
    '/profile/:path*', // Example: Protect the profile page
    '/settings/:path*', // Example: Protect the settings page
    // Add any other top-level routes you want to protect here.
  ],
}
```

<!-- path: public/sw.js -->
```javascript
// public/sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.');
  event.notification.close();
  event.waitUntil(clients.openWindow('https://route-survey.vercel.app'));
});

// --- Define IndexedDB logic inside the service worker ---
const DB_NAME = 'route-survey-outbox';
const DB_VERSION = 1;
const STORE_NAME = 'pending-routes';

function openOutboxDB() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject('Error opening IndexedDB.');
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      let store;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: '_id' });
      } else {
        // This line is needed for subsequent upgrades if the store already exists.
        store = event.target.transaction.objectStore(STORE_NAME);
      }
      // Ensure the index exists for querying by status.
      if (!store.indexNames.contains('by_status')) {
        store.createIndex('by_status', 'syncStatus');
      }
    };
  });
}

async function deleteRouteFromOutbox(routeId) {
  const db = await openOutboxDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.delete(routeId);
  return tx.done;
}

// Get routes that are specifically marked as 'pending'
async function getPendingRoutesFromOutbox() {
  const db = await openOutboxDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('by_status');
  return index.getAll('pending'); // Only get 'pending' routes
}

// Update an existing route in the outbox
async function updateOutboxRoute(route) {
  const db = await openOutboxDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.put(route);
  return tx.done;
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-routes') {
    console.log('[Service Worker] Sync event for "sync-routes" received.');
    event.waitUntil(syncRoutes());
  }
});

async function syncRoutes() {
  console.log('[Service Worker] Starting sync process...');
  // UPDATED FUNCTION CALL: Using the renamed function for clarity
  const pendingRoutes = await getPendingRoutesForSync();

  if (pendingRoutes.length === 0) {
    console.log('[Service Worker] No pending routes to sync.');
    return;
  }

  for (const route of pendingRoutes) {
    const routeId = route._id;
    const routeDataToServer = { ...route };
    delete routeDataToServer._id;
    delete routeDataToServer.syncStatus;
    delete routeDataToServer.syncError;

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeDataToServer),
      });

      if (response.ok) {
        console.log(`[Service Worker] Successfully synced route: ${routeId}`);
        await deleteRouteFromOutbox(routeId);
      } else {
        console.error(`[Service Worker] Failed to sync route ${routeId}. Status: ${response.status}`);
        const errorBody = await response.json().catch(() => ({ error: 'Could not parse error response.' }));
        route.syncStatus = 'failed';
        route.syncError = errorBody.error || `Server responded with status ${response.status}.`;
        await updateOutboxRoute(route);
        console.warn(`[Service Worker] Marked route ${routeId} as 'failed' due to server error.`);
      }
    } catch (error) {
      console.error(`[Service Worker] Network error syncing route ${routeId}:`, error);
      route.syncStatus = 'failed';
      route.syncError = 'Network error. The app will automatically retry later.';
      await updateOutboxRoute(route);
      console.warn(`[Service Worker] Marked route ${routeId} as 'failed' due to network error.`);
    }
  }
  console.log('[Service Worker] Sync process finished.');
}


// --- Caching logic for offline support ---

const CACHE_NAME = 'route-survey-cache-v1';
const urlsToCache = ['/', '/login', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache opened');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

```

<!-- path: components/RouteList.tsx -->
```typescript
// components/RouteList.tsx
import { useState, useMemo } from 'react';
import { Route, RouteStats } from '@/types';
import { useDeleteRoute } from '@/lib/react-query';
import { RouteListHeader } from '@/components/route-list/RouteListHeader';
import { RouteItem } from '@/components/route-list/RouteItem';
import { DeleteConfirmationModal } from '@/components/modal/DeleteConfirmationModal';
import { generateKML } from '@/components/route-list/generateKML';
import { useProcessedRoute, useOriginalRouteForProcessing, useRouteStats } from '@/store/orsStore';
import { useSearchTerm, useFilterStatus, useSelectedRouteForView } from '@/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/route-list/EmptyState';

interface RouteListProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
  onDeleteRoute: (routeId: string) => void;
  isLoading: boolean;
}

export const RouteList: React.FC<RouteListProps> = ({
  routes,
  onSelectRoute,
  onDeleteRoute,
  isLoading,
}) => {
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const deleteRouteMutation = useDeleteRoute();

  // Get state from stores using atomic selectors
  const processedRoute = useProcessedRoute();
  const originalRouteForProcessing = useOriginalRouteForProcessing();
  const routeStats = useRouteStats();

  // UI state
  const searchTerm = useSearchTerm();
  const filterStatus = useFilterStatus();
  const selectedRouteForView = useSelectedRouteForView();
  const selectedRouteId = selectedRouteForView?._id;

  const filteredRoutes = useMemo(() => {
    if (!Array.isArray(routes)) return [];

    return routes.filter((route) => {
      const statusMatch = !filterStatus || route.status === filterStatus;
      const searchMatch =
        !searchTerm ||
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (route.description &&
          route.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return statusMatch && searchMatch;
    });
  }, [routes, searchTerm, filterStatus]);

  const handleDelete = async (routeId: string) => {
    try {
      await deleteRouteMutation.mutateAsync(routeId);
      onDeleteRoute(routeId);
      setRouteToDelete(null);
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const exportRouteAsKML = (route: Route) => {
    let finalRouteData = { ...route };
    if (selectedRouteId === route._id && processedRoute) {
      const defaultStats: RouteStats = {
        originalDistance: 0,
        optimizedDistance: 0,
        timeSaved: 0,
        efficiency: 0,
      };
      finalRouteData = {
        ...route,
        orsData: {
          processedPath: processedRoute,
          originalPath: originalRouteForProcessing || route.path,
          routeStats: routeStats ?? route.orsData?.routeStats ?? defaultStats,
          profile: route.orsData?.profile || 'cycling-regular',
          processedAt: new Date(),
        },
      };
    }
    const kmlContent = generateKML(finalRouteData);
    const blob = new Blob([kmlContent], {
      type: 'application/vnd.google-earth.kml+xml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(route.name || `Route_${route._id}`).replace(
      /\s+/g,
      '_'
    )}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredRoutes.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {filteredRoutes.map((route) => (
          <RouteItem
            key={route._id}
            route={route}
            isSelected={selectedRouteId === route._id}
            onSelect={onSelectRoute}
            onExportKML={exportRouteAsKML}
            setShowDeleteConfirm={setRouteToDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/30 mx-2 sm:mx-0">
      <RouteListHeader count={filteredRoutes.length} />
      {renderContent()}
      <DeleteConfirmationModal
        routeId={routeToDelete}
        onConfirm={handleDelete}
        onCancel={() => setRouteToDelete(null)}
      />
    </div>
  );
};

```

<!-- path: components/modal/ReprocessRouteModal.tsx -->
```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ORSProfiles, Route } from '@/types';
import { ORSProfileType } from '@/lib/services/orsService';

interface ReprocessRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
  onConfirm: (newProfile: ORSProfileType) => void;
}

export function ReprocessRouteModal({ isOpen, onClose, route, onConfirm }: ReprocessRouteModalProps) {
  // Initialize state with the route's current profile or the default
  const [selectedProfile, setSelectedProfile] = useState<ORSProfileType>(
    route?.orsData?.profile as ORSProfileType || 'cycling-regular'
  );

  if (!isOpen || !route) return null;

  const handleConfirm = () => {
    onConfirm(selectedProfile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Re-process Route</DialogTitle>
          <DialogDescription>
            Select a new OpenRouteService profile to re-analyze the route <span className="font-semibold">"{route.name}"</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">New Route Profile</label>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value as ORSProfileType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {ORSProfiles.map((profile) => (
              <option key={profile.value} value={profile.value}>
                {profile.icon} {profile.label}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm & Re-process</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

<!-- path: components/modal/ProcessingStatusModal.tsx -->
```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CheckCircle, XCircle } from 'lucide-react';
import { ProcessingStatus } from '@/store/orsStore';

interface ProcessingStatusModalProps {
  status: ProcessingStatus;
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProcessingStatusModal({ status, error, isOpen, onClose }: ProcessingStatusModalProps) {
  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-lg text-gray-700 dark:text-gray-300">Optimizing route...</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Processing Complete!</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Processing Failed</p>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">{error || 'An unknown error occurred.'}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Route Optimization</DialogTitle>
        </DialogHeader>
        <div className="py-8">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

<!-- path: components/modal/DeleteConfirmationModal.tsx -->
```typescript
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  routeId: string | null; // Allow null to control visibility
  onConfirm: (routeId: string) => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  routeId,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    if (routeId) {
      onConfirm(routeId);
    }
  };

  return (
    <Dialog open={!!routeId} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this route? This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleConfirm}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

<!-- path: components/modal/EditRouteModal.tsx -->
```typescript
'use client';

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Route } from "@/types";
import { useUpdateRouteDetails } from "@/lib/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditRouteModalProps {
  route: Route | null;
  isOpen: boolean;
  onClose: () => void;
}

// Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Route name must be at least 3 characters.",
  }).max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditRouteModal({ route, isOpen, onClose }: EditRouteModalProps) {
  const updateRouteMutation = useUpdateRouteDetails();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Pre-populate the form with the route's current details
    defaultValues: {
      name: route?.name || "",
      description: route?.description || "",
    },
  });

  // Reset the form if the route prop changes (e.g., user opens it for a different route)
  if (route && form.getValues().name !== route.name) {
    form.reset({
        name: route.name,
        description: route.description || "",
    });
  }

  const onSubmit = async (values: FormValues) => {
    if (!route?._id) return;

    const promise = updateRouteMutation.mutateAsync({
      id: route._id,
      details: values,
    });

    toast.promise(promise, {
      loading: "Saving changes...",
      success: () => {
        onClose(); // Close the modal on success
        return "Route details updated successfully!";
      },
      error: (err) => `Failed to save: ${err.message}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Route Details</DialogTitle>
          <DialogDescription>
            Update the name and description for your route.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Downtown Fiber Line A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a detailed description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateRouteMutation.isPending}>
                {updateRouteMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

<!-- path: components/modal/AddPointModal.tsx -->
```typescript
// components/modal/AddPointModal.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { pointTypes, SurveyPoint, Location, PointTypeValue } from '@/types';
import { uploadPhoto } from '@/app/actions/upload';
import { toast } from 'sonner';
import { Camera, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// --- THIS IS THE FIX ---
// The props interface is updated to expect 'pointType' instead of 'type'.
interface AddPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pointData: { pointType: PointTypeValue; notes: string; photos?: string[]; id?: string }) => void;
  pointData?: { location: Location; pointType?: PointTypeValue } | SurveyPoint | null;
}
// --- END OF FIX ---

export const AddPointModal: React.FC<AddPointModalProps> = ({ isOpen, onClose, onSave, pointData }) => {
  const [pointType, setPointType] = useState<PointTypeValue>('UG_JC');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = pointData && '_id' in pointData;
  const location = pointData && 'location' in pointData ? pointData.location : null;

  useEffect(() => {
    if (isOpen && pointData) {
      if ('_id' in pointData) { // Editing an existing point
        setPointType(pointData.pointType);
        setNotes(pointData.notes || '');
        setPhotos(pointData.photos || []);
      } else { // Adding a new point
        // The logic is now simpler and consistent
        setPointType(pointData.pointType || 'UG_JC');
        setNotes('');
        setPhotos([]);
      }
      setIsUploading(false);
    }
  }, [isOpen, pointData]);

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    const result = await uploadPhoto(formData);
    setIsUploading(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.url) {
      setPhotos(prev => [...prev, result.url!]);
      toast.success("Photo uploaded successfully!");
    }
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setPhotos(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = () => {
    const saveData = {
      pointType,
      notes,
      photos,
      id: isEditing ? (pointData as SurveyPoint)._id : undefined,
    };
    onSave(saveData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Survey Point' : 'Add New Survey Point'}</DialogTitle>
          {location && <DialogDescription>At coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Point Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {pointTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPointType(type.value)}
                  className={`flex flex-col items-center justify-center h-20 gap-2 p-2 text-center rounded-lg border-2 transition-colors ${
                    pointType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`p-2 rounded-full ${type.color} text-white`}><type.icon className="w-4 h-4" /></div>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name / Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add notes about this location..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photos</label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(url => (
                <div key={url} className="relative group">
                  <Image src={url} alt="Uploaded photo" width={100} height={100} className="w-full h-24 object-cover rounded-md" />
                  <button onClick={() => handleRemovePhoto(url)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-4 h-4" /></button>
                </div>
              ))}
              {isUploading ? (
                <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
              ) : (
                photos.length < 3 && (
                  <label className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Camera className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Add Photo</span>
                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isUploading}>{isUploading ? 'Uploading...' : (isEditing ? 'Save Changes' : 'Save Point')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

<!-- path: components/controls/PointStatistics.tsx -->
```typescript
import { BarChart3 } from 'lucide-react';

interface PointStatisticsProps {
  pointTypeStats: Array<{ value: string; label: string; color: string; count: number }>;
}

export const PointStatistics: React.FC<PointStatisticsProps> = ({ pointTypeStats }) => {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2 flex items-center gap-1 dark:text-gray-100">
        <BarChart3 className="w-4 h-4" />
        Point Statistics
      </h4>
      <div className="space-y-1">
        {pointTypeStats.map((type) => (
          <div key={type.value} className="flex items-center justify-between text-sm dark:text-gray-300">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
              <span>{type.label}</span>
            </div>
            <span className="font-medium dark:text-gray-100">{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

```

<!-- path: components/controls/MapOptions.tsx -->
```typescript
import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { Location } from '@/types';

interface MapOptionsProps {
  originalRoute: Location[] | null;
  processedRoute: Location[] | null;
}

const MapOptions: React.FC<MapOptionsProps> = ({ originalRoute, processedRoute }) => {
  const [followUser, setFollowUser] = useState(true);
  const [showOriginalRoute, setShowOriginalRoute] = useState(true);
  const [showProcessedRoute, setShowProcessedRoute] = useState(true);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 dark:text-gray-300">
            <input
              type="checkbox"
              checked={followUser}
              onChange={(e) => setFollowUser(e.target.checked)}
              className="rounded dark:bg-gray-700 dark:border-gray-600"
            />
            Follow user
          </label>
        </div>

        {(originalRoute || processedRoute) && (
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showOriginalRoute}
                onChange={(e) => setShowOriginalRoute(e.target.checked)}
                className="rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <Eye className="w-3 h-3" />
              GPS Route
            </label>
            {processedRoute && (
              <label className="flex items-center gap-2 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showProcessedRoute}
                  onChange={(e) => setShowProcessedRoute(e.target.checked)}
                  className="rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <Eye className="w-3 h-3" />
                ORS Route
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapOptions;

```

<!-- path: components/controls/ControlButton.tsx -->
```typescript
'use client';

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  title?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  fullWidth = false,
  title,
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700',
  };

  return (
    <button
      name={label}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
        variantClasses[variant]
      } disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-600 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {icon}
      {label}
    </button>
  );
};

```

<!-- path: components/controls/MobileTabNavigation.tsx -->
```typescript
import { BarChart3, MapPin, Settings } from 'lucide-react';
import { MobileTab } from '@/types/tabs';

interface MobileTabNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const MobileTabNavigation: React.FC<MobileTabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'controls' as const, label: 'Controls', icon: Settings },
    { id: 'points' as const, label: 'Points', icon: MapPin },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          name={tab.id}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium text-sm ${
            activeTab === tab.id
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

```

<!-- path: components/controls/PointTypeButton.tsx -->
```typescript
import { pointTypes } from '@/types';

interface PointTypeButtonProps {
  type: (typeof pointTypes)[number];
  onClick: () => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export const PointTypeButton: React.FC<PointTypeButtonProps> = ({
  type,
  onClick,
  disabled = false,
  showLabel = true,
}) => {
  return (
    <button
      name={type.value}
      onClick={onClick}
      disabled={disabled}
      className={`${type.color} hover:opacity-80 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm`}
    >
      <type.icon className="w-4 h-4" />
      {showLabel && type.shortLabel}
    </button>
  );
};

```

<!-- path: components/controls/RouteControls.tsx -->
```typescript
// components/controls/RouteControls.tsx
'use client';

import { Play, Pause, Square, Trash2 } from 'lucide-react';
import { useSurveyStore } from '@/store/surveyStore';
import { ControlButton } from '@/components/controls/ControlButton';

interface RouteControlsProps {
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClear: () => void;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  onPause,
  onResume,
  onStop,
  onClear,
}) => {
  // We only need to know if we are actively tracking. The parent component
  // (`SurveySidebar`) already guarantees that this component is only rendered
  // for a valid, non-completed route.
  const isTracking = useSurveyStore(state => state.isTracking);

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        Survey Actions
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {/* --- THIS IS THE FIX --- */}
        {/* The redundant conditional wrapper around these buttons has been removed. */}
        {isTracking ? (
          <ControlButton
            icon={<Pause />}
            label="Pause"
            onClick={onPause}
            variant="warning"
            fullWidth
          />
        ) : (
          <ControlButton
            icon={<Play />}
            label="Resume"
            onClick={onResume}
            variant="primary"
            fullWidth
          />
        )}
        <ControlButton
          icon={<Square />}
          label="Stop & Finalize"
          onClick={onStop}
          variant="danger"
          fullWidth
        />
        <ControlButton
          icon={<Trash2 />}
          label="Clear Current"
          onClick={onClear}
          variant="secondary"
          fullWidth
          title="Abandon and delete the current survey"
        />
        {/* --- END OF FIX --- */}
      </div>
    </div>
  );
};
```

<!-- path: components/controls/RouteStatus.tsx -->
```typescript
import { Route } from '@/types';
import { formatDuration } from '@/utils/formatDuration';
import { RouteIcon } from 'lucide-react';

interface RouteStatusProps {
  route: Route;
  currentDuration: number;
}

export const RouteStatus: React.FC<RouteStatusProps> = ({ route, currentDuration }) => {
  if (!route) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
          <RouteIcon className="w-5 h-5" />
          Route Survey
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            route.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : route.status === 'paused'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              : route.status === 'completed'
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {route.status}
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="font-medium dark:text-gray-100">{route.name}</div>
        {route.description && <div className="text-xs text-gray-500 dark:text-gray-400">{route.description}</div>}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="dark:text-gray-300">
            Points: <span className="font-medium dark:text-gray-100">{route.points.length}</span>
          </div>
          <div className="dark:text-gray-300">
            Path: <span className="font-medium dark:text-gray-100">{route.path.length}</span>
          </div>
          <div className="dark:text-gray-300">
            Duration: <span className="font-medium dark:text-gray-100">{formatDuration(currentDuration)}</span>
          </div>
          <div className="dark:text-gray-300">
            Status: <span className="font-medium dark:text-gray-100 capitalize">{route.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

```

<!-- path: components/controls/LocationUpdateToggle.tsx -->
```typescript
'use client';

interface LocationUpdateToggleProps {
  allowUpdate: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const LocationUpdateToggle: React.FC<LocationUpdateToggleProps> = ({
  allowUpdate,
  onToggle,
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {allowUpdate ? 'Following' : 'Paused'}
        </span>
        <button
          name="locationUpdateToggle"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            allowUpdate ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
          }`}
          title={allowUpdate ? 'Location updates active - Click to pause' : 'Location updates paused - Click to resume'}
        >
          <span
            className={`${
              allowUpdate ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Updates</div>
        <button
          name="locationUpdateToggle"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            allowUpdate ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`${
              allowUpdate ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {allowUpdate ? 'Map will follow your location' : 'Map will stay at current position'}
      </p>
    </div>
  );
};

```

<!-- path: components/MapViewTypes.ts -->
```typescript
import { Route } from '@/types';

export interface MapViewRoute extends Omit<Route, 'path' | 'points'> {
  path?: { lat: number; lng: number }[];
  points?: unknown[]; // Using unknown[] for better type safety
  processedRoute?: { lat: number; lng: number }[] | null;
  originalRoute?: { lat: number; lng: number }[] | null;
}

export interface MapViewProps {
  currentLocation: { lat: number; lng: number } | null;
  route: MapViewRoute | null;
  onMapClick: (location: [number, number]) => void;
  onLocationRefresh?: () => void;
  onSaveRoute?: () => void;
  isMobile?: boolean;
  className?: string;
  allowLocationUpdate?: boolean;
  handleToggleLocationUpdate?: (newValue: boolean) => void;
  mapHeight?: string;
  currentPath?: [number, number][];
  routeStatus?: string;
  accuracy?: number | null;
}

```

<!-- path: components/route-list/RouteItem.tsx -->
```typescript
// components/route-list/RouteItem.tsx - Mobile Optimized

import { Route } from '@/types';
import { formatDuration } from '@/utils/formatDuration';
import { getStatusColor } from '@/utils/getStatusColor';
import { format } from 'date-fns';
import { Camera, Clock, MapPin } from 'lucide-react';
import { RouteActionButtons } from '@/components/route-list/RouteActionButtons';

interface RouteItemProps {
  route: Route;
  isSelected: boolean;
  onSelect: (route: Route) => void;
  setShowDeleteConfirm: (id: string | null) => void;
  onExportKML: (route: Route) => void;
}

export const RouteItem: React.FC<RouteItemProps> = ({
  route,
  isSelected,
  onSelect,
  onExportKML,
  setShowDeleteConfirm,
}) => {
  const pointsCount = route.points ? route.points.length : 0;

  const photoCount =
    route.points?.reduce(
      (acc, point) => acc + (point.photos?.length || 0),
      0
    ) || 0;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(route._id || null);
  };

  return (
    <div
      className={`
        p-3 sm:p-4
        hover:bg-gray-50 dark:hover:bg-gray-700
        transition-colors
        cursor-pointer
        touch-manipulation
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
            : ''
        }
      `}
      onClick={() => onSelect(route)}
    >
      {/* Mobile: Stack layout, Desktop: Flex layout */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Status Row */}
          <div className="flex items-start gap-2 mb-2">
            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 flex-1 min-w-0 leading-tight">
              {route.name}
            </h3>
            <span
              className={`
              px-2 py-1 text-xs font-medium rounded-full flex-shrink-0
              ${getStatusColor(route.status)}
            `}
            >
              {route.status}
            </span>
          </div>

          {/* Description */}
          {route.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 sm:truncate">
              {route.description}
            </p>
          )}

          {/* Metadata - Mobile: Stack, Desktop: Inline */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
            {/* Start Time */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {route.startTime
                  ? format(
                      route.startTime instanceof Date
                        ? route.startTime
                        : new Date(route.startTime),
                      'MMM d, yyyy HH:mm'
                    )
                  : 'N/A'}
              </span>
            </div>

            {/* Points Count */}
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{pointsCount} points</span>
            </div>

            {photoCount > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3 flex-shrink-0" />
                <span>
                  {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                </span>
              </div>
            )}

            {/* Duration */}
            {route.totalDuration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{formatDuration(route.totalDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Mobile: Full width row, Desktop: Right aligned */}
        <div className="flex-shrink-0 sm:ml-4" onClick={handleActionClick}>
          <RouteActionButtons
            route={route}
            onSelect={onSelect}
            onExportKML={onExportKML}
            setShowDeleteConfirm={handleDeleteClick}
          />
        </div>
      </div>
    </div>
  );
};

```

<!-- path: components/route-list/EmptyState.tsx -->
```typescript
import { RouteIcon } from 'lucide-react';

export const EmptyState: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/30 p-8 text-center">
    <RouteIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Routes Yet</h3>
    <p className="text-gray-500 dark:text-gray-400">Start your first route survey to see it appear here.</p>
  </div>
);

```

<!-- path: components/route-list/generateKML.ts -->
```typescript
// components/route-list/generateKML.ts

import { Route } from '@/types';
import { format } from 'date-fns';

// Helper to escape XML characters in strings
const escapeXML = (str: string | undefined | null): string => {
  // If the string is null, undefined, or empty, return a default value
  if (!str) {
    return 'N/A';
  }
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

export const generateKML = (route: Route): string => {
  const path = route.orsData?.processedPath || route.path;
  const coordinatesString = path.map((p) => `${p.lng},${p.lat},0`).join(' ');
  const points = route.points || [];
  const routeName = route.name || `Route_${route._id || 'Untitled'}`;
  const routeDescription = route.description || 'No description provided.';

  const pointsKML = points
    .map((point) => {
      // Provide a default fallback value if point.pointType is missing.
      const pointName = (point.pointType || 'Survey Point').replace('_', ' ');

      return `
    <Placemark>
      <name>${escapeXML(pointName)}</name>
      <description>
        <![CDATA[
          <b>Notes:</b> ${escapeXML(point.notes)}<br/>
          <b>Timestamp:</b> ${format(new Date(point.timestamp), 'PP p')}<br/>
          <b>Coordinates:</b> ${point.location.lat.toFixed(
            6
          )}, ${point.location.lng.toFixed(6)}
        ]]>
      </description>
      <Point>
        <coordinates>${point.location.lng},${point.location.lat},0</coordinates>
      </Point>
    </Placemark>
  `;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
  <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
      <name>${escapeXML(routeName)}</name>
      <description>${escapeXML(routeDescription)}</description>
      <Style id="routeLineStyle">
        <LineStyle>
          <color>ff00ff00</color>
          <width>4</width>
        </LineStyle>
      </Style>
      <Placemark>
        <name>${escapeXML(routeName)} Path</name>
        <styleUrl>#routeLineStyle</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${coordinatesString}</coordinates>
        </LineString>
      </Placemark>
      ${pointsKML}
    </Document>
  </kml>`;
};

```

<!-- path: components/route-list/KmlUploadButton.tsx -->
```typescript
'use client';

import React, { useRef } from 'react';
import { useSaveRoute } from '@/lib/react-query';
import { useAuth } from '@/hooks/useAuth';
import { parseKmlFile, NewRoutePayload } from '@/lib/kmlParser'; // Import the new type
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export const KmlUploadButton = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveRouteMutation = useSaveRoute();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?._id) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const kmlString = e.target?.result as string;

        // --- FIX 1: Convert user._id from ObjectId to string ---
        const newRoute: NewRoutePayload = parseKmlFile(
          kmlString,
          user._id.toString()
        );
        // --- END FIX 1 ---

        const promise = saveRouteMutation.mutateAsync(newRoute);

        toast.promise(promise, {
          loading: 'Importing KML route...',
          success: (savedRoute) =>
            `Route "${savedRoute.name}" imported successfully!`,
          error: (err) => `Failed to import route: ${(err as Error).message}`,
        });
      } catch (error) {
        toast.error('Failed to parse KML file. Please check the file format.');
        console.error('KML Parsing Error:', error);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".kml"
      />
      <Button onClick={handleClick} disabled={saveRouteMutation.isPending}>
        <Upload className="mr-2 h-4 w-4" />
        {saveRouteMutation.isPending ? 'Importing...' : 'Import KML'}
      </Button>
    </>
  );
};

```

<!-- path: components/route-list/OfflineOutbox.tsx -->
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAllRoutesFromOutbox, OutboxRoute, deleteRouteFromOutbox, updateOutboxRouteStatus } from '@/lib/outbox-db';
import { AlertTriangle, UploadCloud, RefreshCw, Trash2, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function OfflineOutbox() {
  const [outboxRoutes, setOutboxRoutes] = useState<OutboxRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOutbox = async () => {
    const routes = await getAllRoutesFromOutbox();
    setOutboxRoutes(routes);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOutbox();
    // Refresh the outbox when the user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOutbox();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRetry = async (route: OutboxRoute) => {
    try {
      await updateOutboxRouteStatus(route._id!, 'pending');
      toast.info("Route has been re-queued. It will sync in the background when online.");
      // Trigger a sync event immediately if online
      if ('serviceWorker' in navigator && 'SyncManager' in window && navigator.onLine) {
        navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-routes'));
      }
      loadOutbox(); // Refresh the list
    } catch (error) {
      toast.error("Could not re-queue the route.");
    }
  };

  const handleDelete = async (routeId: string) => {
    if (confirm('Are you sure you want to permanently delete this unsynced route? This cannot be undone.')) {
      await deleteRouteFromOutbox(routeId);
      toast.success("Unsynced route deleted.");
      loadOutbox();
    }
  };

  if (isLoading || outboxRoutes.length === 0) {
    return null; // Don't show anything if the outbox is empty or loading
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 mt-6 border-t-4 border-yellow-500 bg-yellow-50 dark:bg-gray-800/50 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
        <UploadCloud className="w-5 h-5" />
        Offline Outbox
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        These routes are saved on your device and are waiting to be synced to the server.
      </p>
      <div className="mt-4 space-y-3">
        {outboxRoutes.map(route => (
          <div key={route._id} className={`p-3 rounded-md border ${route.syncStatus === 'failed' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' : 'bg-white dark:bg-gray-700'}`}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{route.name}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {route.syncStatus === 'pending' && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"><Hourglass className="w-3 h-3" /> Pending Sync</span>
                  )}
                  {route.syncStatus === 'failed' && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold"><AlertTriangle className="w-3 h-3" /> Sync Failed</span>
                  )}
                </div>
                {route.syncStatus === 'failed' && (
                   <p className="text-xs text-red-700 dark:text-red-500 mt-1">{route.syncError}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {route.syncStatus === 'failed' && (
                  <Button size="sm" variant="outline" onClick={() => handleRetry(route)} title="Retry Sync">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(route._id!)} title="Delete from Outbox">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

<!-- path: components/route-list/RouteListHeader.tsx -->
```typescript
// components/route-list/RouteListHeader.tsx
'use client';

import { Search, Circle, CheckCircle, PauseCircle, X } from 'lucide-react';
import { Route } from '@/types';
import {
  useSearchTerm,
  useFilterStatus,
  useSetSearchTerm,
  useSetFilterStatus,
  useClearFilters
} from '@/store/uiStore';

interface RouteListHeaderProps {
  count: number;
}

const filterOptions: {
  label: string;
  value: Route['status'] | null;
  icon: React.ReactNode;
}[] = [
  { label: 'All', value: null, icon: <Circle className="w-3 h-3" /> },
  {
    label: 'Active',
    value: 'active',
    icon: <Circle className="w-3 h-3 text-green-500 fill-current" />,
  },
  {
    label: 'Paused',
    value: 'paused',
    icon: <PauseCircle className="w-3 h-3 text-yellow-500" />,
  },
  {
    label: 'Completed',
    value: 'completed',
    icon: <CheckCircle className="w-3 h-3 text-gray-500" />,
  },
];

export const RouteListHeader: React.FC<RouteListHeaderProps> = ({ count }) => {
  // Get route filters using atomic selectors
  const searchTerm = useSearchTerm();
  const filterStatus = useFilterStatus();
  const setSearchTerm = useSetSearchTerm();
  const setFilterStatus = useSetFilterStatus();
  const clearFilters = useClearFilters();

  const hasActiveFilters = searchTerm.trim() !== '' || filterStatus !== null;

  return (
    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Route History
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {count} route{count !== 1 ? 's' : ''} found
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center">• Filtered</span>
            )}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                       flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or description..."
          className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                     transition-colors duration-200"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                       dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Status:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map(({ label, value, icon }) => (
            <button
              key={`filter-${label}`}
              onClick={() => setFilterStatus(value)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-full
                         flex items-center gap-1.5 transition-all duration-200
                         border min-w-0 whitespace-nowrap ${
                           filterStatus === value
                             ? `bg-blue-600 text-white border-blue-600 shadow-sm`
                             : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                     border-gray-300 dark:border-gray-600
                     hover:bg-gray-50 dark:hover:bg-gray-700
                     hover:border-gray-400 dark:hover:border-gray-500
                     active:scale-95`
                         }`}
            >
              <span className="flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

```

<!-- path: components/route-list/RouteActionButtons.tsx -->
```typescript
// components/route-list/RouteActionButtons.tsx

import { Route } from '@/types';
import { Download, Eye, Trash2, Globe } from 'lucide-react';

interface RouteActionButtonsProps {
  route: Route;
  onSelect: (route: Route) => void;
  setShowDeleteConfirm: (id: string | null) => void;
  onExportKML: (route: Route) => void;
}

export const RouteActionButtons: React.FC<RouteActionButtonsProps> = ({
  route,
  onSelect,
  onExportKML,
  setShowDeleteConfirm,
}) => {
  return (
    <div className="flex items-center gap-1 ml-2">
      <button
        name="view"
        onClick={() => onSelect(route)}
        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
        title="View route"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        name="exportKML"
        onClick={() => onExportKML(route)}
        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
        title="Export as KML (for Google Earth)"
      >
        <Globe className="w-4 h-4" />
      </button>
      <button
        name="delete"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          setShowDeleteConfirm(route._id || '');
        }}
        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors dark:hover:text-red-400 dark:hover:bg-red-900/30"
        title="Delete route"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

```

<!-- path: components/ors/ORSProcessing.tsx -->
```typescript
import React from 'react';
import { Route, Zap, CheckCircle } from 'lucide-react';
import { RouteStats, Location } from '@/types';

interface ORSProcessingProps {
  isProcessing: boolean;
  progress: number;
  processedRoute: Location[] | null;
  routeStats: RouteStats;
  onProcess: () => void;
  onClear: () => void;
  orsApiKey: string | null;
}

const ORSProcessing: React.FC<ORSProcessingProps> = ({
  isProcessing,
  progress,
  processedRoute,
  routeStats,
  onProcess,
  onClear,
  orsApiKey,
}) => {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium flex items-center gap-2 dark:text-gray-100">
          <Route className="w-4 h-4" />
          Route Optimization
        </h4>
        <div className="flex gap-2">
          {processedRoute && (
            <button
              name="clear"
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isProcessing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            Processing route with ORS...
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : processedRoute ? (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Route optimized successfully!</span>
          </div>
          {routeStats && (
            <div className="text-sm text-green-600 dark:text-green-400">
              Original: {(routeStats.originalDistance / 1000).toFixed(2)} km • Optimized:{' '}
              {(routeStats.optimizedDistance / 1000).toFixed(2)} km • Efficiency: {routeStats.efficiency.toFixed(1)}%
            </div>
          )}
        </div>
      ) : (
        <button
          name="process"
          onClick={onProcess}
          disabled={!orsApiKey}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Optimize Route with ORS
        </button>
      )}
    </div>
  );
};

export default ORSProcessing;

```

<!-- path: components/ors/ORSSettingsPanel.tsx -->
```typescript
// components/ors/ORSSettingsPanel.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ORSProfileType } from '@/lib/services/orsService';
import { ORSProfiles } from '@/types';
import { useUpdateProfile } from '@/hooks/useAuthMutations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useOrsStore } from '@/store/orsStore';
import { cn } from '@/lib/utils';
import LoadingSpinner from '../common/LoadingSpinner';
import { Input } from '@/components/ui/input';

// The props interface no longer needs many of the old props, as this component is now more self-contained.
interface ORSSettingsPanelProps {
  disabled?: boolean;
}

const ORSSettingsPanel: React.FC<ORSSettingsPanelProps> = ({
  disabled = false,
}) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  // Local state for the input field and save button status
  const [tempApiKey, setTempApiKey] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Zustand state and actions
  const orsProfile = useOrsStore((state) => state.orsProfile);
  const setORSConfig = useOrsStore((state) => state.setORSConfig);
  const setORSProfile = useOrsStore((state) => state.setORSProfile);

  // Sync local input with user data when it loads
  useEffect(() => {
    if (user?.orsApiKey) {
      setTempApiKey(user.orsApiKey);
    }
  }, [user]);

  // Derived state to determine the current status
  const isConfigured = !!user?.orsApiKey;
  const isDirty = tempApiKey.trim() !== '' && tempApiKey.trim() !== user?.orsApiKey;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    setSaveState('saving');
    const keyToSave = tempApiKey.trim();

    try {
      const updatedData = await updateProfileMutation.mutateAsync({ orsApiKey: keyToSave });
      setORSConfig(updatedData.user.orsApiKey, true);
      setSaveState('saved');
      toast.success('ORS API key saved successfully!');
    } catch (err) {
      toast.error(`Failed to save key: ${(err as Error).message}`);
      setSaveState('idle');
    }
  };

  // Reset the "Saved!" button state after a short delay
  useEffect(() => {
    if (saveState === 'saved') {
      const timer = setTimeout(() => setSaveState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveState]);

  const StatusIndicator = useMemo(() => {
    if (isConfigured && !isDirty) {
      return <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3" /> Active</span>;
    }
    if (isDirty) {
      return <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"><Clock className="w-3 h-3" /> Pending Save</span>;
    }
    return <span className="flex items-center gap-1 text-xs text-gray-500"><AlertCircle className="w-3 h-3" /> Not Configured</span>;
  }, [isConfigured, isDirty]);

  return (
    <fieldset disabled={disabled || isAuthLoading} className="space-y-4 w-full">
      <form onSubmit={handleSave} className={cn("p-4 rounded-lg border-2", {
        "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-gray-800": isConfigured && !isDirty,
        "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-gray-800": isDirty,
        "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800": !isConfigured && !isDirty
      }, "disabled:opacity-70")}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold flex items-center gap-2 dark:text-gray-100">
            <Zap className="w-4 h-4" />
            ORS Config
          </h3>
          {StatusIndicator}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">API Key</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder={isAuthLoading ? "Loading..." : "Enter ORS API key"}
              />
              <Button type="submit" disabled={!isDirty || saveState !== 'idle'} className="w-full sm:w-auto">
                {saveState === 'saving' && <LoadingSpinner size="sm" className="mr-2" />}
                {saveState === 'saved' && <CheckCircle className="w-4 h-4 mr-2" />}
                {saveState === 'idle' ? 'Save' : saveState === 'saving' ? 'Saving...' : 'Saved!'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Route Profile</label>
            <select
              value={orsProfile}
              onChange={(e) => setORSProfile(e.target.value as ORSProfileType)}
              className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-input/80 dark:text-white"
            >
              {ORSProfiles.map((profile) => (
                <option key={profile.value} value={profile.value}>
                  {profile.icon} {profile.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </fieldset>
  );
};

export default ORSSettingsPanel;
```

<!-- path: components/ui/button.tsx -->
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```

<!-- path: components/ui/form.tsx -->
```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

```

<!-- path: components/ui/skeleton.tsx -->
```typescript
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

```

<!-- path: components/ui/dialog.tsx -->
```typescript
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'z-50 bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
```

<!-- path: components/ui/badge.tsx -->
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

```

<!-- path: components/ui/input.tsx -->
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

```

<!-- path: components/ui/dropdown-menu.tsx -->
```typescript
// components/ui/dropdown-menu.tsx
'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-40 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    {/* --- THIS IS THE FIX --- */}
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-40 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
    {/* --- END OF FIX --- */}
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
```

<!-- path: components/ui/switch.tsx -->
```typescript
"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

```

<!-- path: components/ui/textarea.tsx -->
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

```

<!-- path: components/ui/label.tsx -->
```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }

```

<!-- path: components/ui/card.tsx -->
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

```

<!-- path: components/pwa/urlBase64ToUint8Array.ts -->
```typescript
// components/pwa/urlBase64ToUint8Array.ts

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

<!-- path: components/pwa/InstallPrompt.tsx -->
```typescript
'use client'

import { useState, useEffect } from 'react'
import { MdClose, MdDownload } from 'react-icons/md'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  if (isInstalled || !showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MdDownload className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-sm">Install App</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Install this app for a better experience
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Install
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
          >
            <MdClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

<!-- path: components/pwa/PushNotificationManager.tsx -->
```typescript
// components/pwa/PushNotificationManager.tsx

"use client"

import { urlBase64ToUint8Array } from "@/components/pwa/urlBase64ToUint8Array"
import { useEffect, useState } from "react"
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions'

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  }

  async function subscribeToPush() {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
      setShowToast({type: 'success', text: 'Notifications enabled!'})
      setShowModal(false)
    } catch (error) {
      console.error('Subscribe failed:', error)
      setShowToast({type: 'error', text: 'Failed to enable notifications'})
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeUser()
      setShowToast({type: 'success', text: 'Notifications disabled'})
    } catch (error) {
      console.error('Unsubscribe failed:', error)
      setShowToast({type: 'error', text: 'Failed to disable notifications'})
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      await sendNotification(message)
      setMessage('')
      setShowToast({type: 'success', text: 'Test notification sent!'})
    } catch (error) {
      console.error('Send notification failed:', error)
      setShowToast({type: 'error', text: 'Failed to send notification'})
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => setShowModal(true)}
          className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
            subscription
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
          title="Push Notifications"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H4l5-5v5z" />
          </svg>
          {subscription && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          showToast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {showToast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{showToast.text}</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  subscription ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    subscription ? 'text-green-600' : 'text-blue-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H4l5-5v5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {subscription ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800 font-medium">Notifications enabled</span>
                  </div>

                  {/* Test Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Send test:</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Test message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && sendTestNotification()}
                        disabled={isLoading}
                      />
                      <button
                        name="sendTest"
                        onClick={sendTestNotification}
                        disabled={!message.trim() || isLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Unsubscribe */}
                  <button
                    name="unsubscribe"
                    onClick={unsubscribeFromPush}
                    disabled={isLoading}
                    className="w-full text-red-600 hover:bg-red-50 font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    Disable Notifications
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Get instant updates and never miss important information.
                    </p>

                    <button
                      name="subscribe"
                      onClick={subscribeToPush}
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H4l5-5v5z" />
                          </svg>
                          <span>Enable Notifications</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

<!-- path: components/pwa/offline-status.tsx -->
```typescript
'use client'

import { useState, useEffect } from 'react'
import { MdWifiOff, MdWifi } from 'react-icons/md'

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  if (!isOnline) {
    return (
      <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <MdWifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">You&apos;re offline</span>
        </div>
      </div>
    )
  }

  if (isOnline && wasOffline) {
    return (
      <div className="fixed top-4 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <MdWifi className="h-5 w-5" />
          <span className="text-sm font-medium">Back online</span>
        </div>
      </div>
    )
  }

  return null
}
```

<!-- path: components/sidebar/WakeLockControl.tsx -->
```typescript
'use client';

import { Power, PowerOff } from 'lucide-react';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useIsWakeLockEnabled, useToggleWakeLock } from '@/store/uiStore';
import { useIsTracking } from '@/store/surveyStore';

export const WakeLockControl = () => {
  // Get the user's preference and the action to toggle it
  const isWakeLockEnabled = useIsWakeLockEnabled();
  const toggleWakeLock = useToggleWakeLock();
  const isTracking = useIsTracking();

  // The useWakeLock hook now reflects the combined state (manual override OR tracking)
  // We use its return value `isLocked` as the source of truth for the UI.
  const { isLocked } = useWakeLock(isTracking || isWakeLockEnabled);

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {isLocked ? (
            <Power className="w-4 h-4 text-green-500" />
          ) : (
            <PowerOff className="w-4 h-4 text-gray-400" />
          )}
          Screen Wake Lock
        </h3>
        <button
          onClick={toggleWakeLock}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
            isWakeLockEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
          aria-label="Toggle Screen Wake Lock"
          // Disable the manual toggle while a survey is active, as it's forced on
          disabled={isTracking}
        >
          <span
            className={`${
              isWakeLockEnabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {isTracking
          ? 'Wake Lock is automatically active during a survey.'
          : 'Enable to prevent the screen from turning off.'}
      </p>
    </div>
  );
};

```

<!-- path: components/sidebar/QuickAddPanel.tsx -->
```typescript
// components/sidebar/QuickAddPanel.tsx
'use client';

import { PointTypeButton } from '@/components/controls/PointTypeButton';
import { useGpsStore } from '@/store/gpsStore';
import { pointTypes, PointTypeValue } from '@/types';
import { toast } from 'sonner';

// --- THIS IS THE FIX ---
// The component now accepts a handler function as a prop.
interface QuickAddPanelProps {
  onQuickAdd: (pointType: PointTypeValue) => void;
}

export const QuickAddPanel: React.FC<QuickAddPanelProps> = ({ onQuickAdd }) => {
  const { location } = useGpsStore();

  // The hook is no longer called here.

  const handleQuickAdd = (pointType: PointTypeValue) => {
    if (!location) {
      toast.error('Current location not available. Cannot add point.');
      return;
    }
    // Call the prop function passed down from the parent.
    onQuickAdd(pointType);
  };
  // --- END OF FIX ---

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        Quick Add Point at Current Location
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {pointTypes.map((type) => (
          <PointTypeButton
            key={type.value}
            type={type}
            onClick={() => handleQuickAdd(type.value)}
            disabled={!location}
            showLabel={false}
          />
        ))}
      </div>
    </div>
  );
};
```

<!-- path: components/sidebar/PhotoGallery.tsx -->
```typescript
'use client';

import { Route } from '@/types';
import Image from 'next/image';
import { CameraOff } from 'lucide-react';

interface PhotoGalleryProps {
  route: Route;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ route }) => {
  // console.log('Rendering PhotoGallery for route:', route);

  // Collect all photos from all points in the route
  const allPhotos = route.points.flatMap((point) =>
    (point.photos || []).map((photoUrl) => ({
      photoUrl,
      pointNotes: point.notes || point.pointType, // Use note as a caption
    }))
  );

  if (allPhotos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/30 text-center">
        <CameraOff className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No photos were added to this route.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/30">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        Photo Gallery ({allPhotos.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-2">
        {allPhotos.map(({ photoUrl, pointNotes }, index) => (
          <a
            key={`${photoUrl}-${index}`}
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group block"
          >
            <Image
              src={photoUrl}
              alt={`Photo for ${pointNotes}`}
              width={150}
              height={150}
              className="w-full h-24 object-cover rounded-md transition-transform group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-md truncate">
              {pointNotes}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

```

<!-- path: components/sidebar/GpsInfoPanel.tsx -->
```typescript
// components/sidebar/GpsInfoPanel.tsx
'use client';

import { GpsStatusCard } from '@/components/common/GpsStatus';
import {
  useGpsLocation,
  useGpsLoading,
  useGpsError,
  useGpsAccuracy,
  useGpsSpeed,
  useRequestLocation

} from '@/store/gpsStore';
import { RefreshCw } from 'lucide-react';

export const GpsInfoPanel = () => {
  // Get all GPS state and actions in a single selector for better performance
  const location = useGpsLocation();
  const gpsLoading = useGpsLoading();
  const gpsError = useGpsError();
  const accuracy = useGpsAccuracy();
  const speed = useGpsSpeed();
  const requestLocation = useRequestLocation();


  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          GPS Status
        </h3>
        <button
          name="locationRefresh"
          onClick={requestLocation} // Use the action from the store
          className="text-blue-600 hover:text-blue-800 p-1 dark:text-blue-400 dark:hover:text-blue-300"
          title="Refresh location"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <GpsStatusCard
        location={location}
        loading={gpsLoading}
        error={gpsError}
        accuracy={accuracy}
        speed={speed}
      />
    </div>
  );
};

```

<!-- path: components/sidebar/RecentPointItem.tsx -->
```typescript
'use client';

import { SurveyPoint } from '@/types';
import { format } from 'date-fns';

export const RecentPointItem: React.FC<{ point: SurveyPoint }> = ({
  point,
}) => {
  const getPointColor = (pointType: string) => {
    switch (pointType) {
      case 'UG_JC':
        return 'bg-blue-500';
      case 'OH_JC':
        return 'bg-green-500';
      case 'Post':
        return 'bg-red-500';
      default:
        return 'bg-purple-500';
    }
  };

  // 1. Create a safe, display-friendly version of the point type with a fallback.
  const pointTypeLabel = point.pointType
    ? point.pointType.replace('_', ' ')
    : 'Survey Point';

  // 2. Use the user's note as the primary name if it exists. Otherwise, use our safe label.
  const displayName = point.notes?.trim() ? point.notes : pointTypeLabel;

  // 3. The secondary detail is ONLY the point type, and ONLY if a custom note was provided.
  const secondaryDetail = point.notes?.trim() ? pointTypeLabel : null;

  return (
    <div className="text-xs border-l-2 border-gray-200 dark:border-gray-700 pl-2">
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${getPointColor(point.pointType)}`}
        />
        <span className="font-medium capitalize dark:text-gray-100">
          {displayName}
        </span>
      </div>
      <div className="text-gray-500 dark:text-gray-400">
        {format(new Date(point.timestamp), 'p')}
      </div>
      {secondaryDetail && (
        <div className="text-gray-600 dark:text-gray-300 truncate">
          {secondaryDetail}
        </div>
      )}
    </div>
  );
};

```

<!-- path: components/sidebar/SidebarHeader.tsx -->
```typescript
// components/sidebar/SidebarHeader.tsx
'use client';

import { useCallback } from 'react';
import { LogOut, X, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import ORSSettingsPanel from '@/components/ors/ORSSettingsPanel';
import { useCurrentRoute } from '@/store/surveyStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// --- FIX #1: CORRECTLY DEFINE THE PROPS INTERFACE ---
interface SidebarHeaderProps {
  isMobile: boolean;
  onClose?: () => void;
}
// --- END FIX #1 ---

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isMobile, onClose }) => {
  const currentRoute = useCurrentRoute();

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  const renderDesktopControls = () => (
    <div className="flex items-center gap-2">
      <ORSSettingsPanel />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Sign out"
      >
        <LogOut className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderMobileControls = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More options">
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0">
        <div className="p-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <ORSSettingsPanel />
          </div>
        </div>
        <DropdownMenuSeparator className="my-2" />
        {/* --- FIX #2: PREVENT EVENT PROPAGATION AND FIX TYPE --- */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault(); // Stop the event from closing the menu immediately
            handleSignOut();
          }}
          className="text-red-600 dark:text-red-400 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/40 m-1 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign Out</span>
        </DropdownMenuItem>
        {/* --- END FIX #2 --- */}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {/* This is now safe because the parent component handles the mounted state */}
          {currentRoute?.name || 'Route Survey'}
        </h2>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isMobile ? renderMobileControls() : renderDesktopControls()}
      </div>
    </div>
  );
};
```

<!-- path: components/sidebar/MobileOverlay.tsx -->
```typescript
'use client';

export const MobileOverlay: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40" onClick={onClose} />;
};
```

<!-- path: components/sidebar/RouteInfo.tsx -->
```typescript
// components/sidebar/RouteInfo.tsx
'use client';

import { ORSProfiles, Route } from '@/types';
import { format } from 'date-fns';
import { useCurrentRoute } from '@/store/surveyStore';
import { useSelectedRouteForView, useSetSelectedRouteForView } from '@/store/uiStore';
import { useOrsProfile } from '@/store/orsStore';

interface RouteInfoProps {
  displayRoute: Route;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({ displayRoute }) => {
  const currentRoute = useCurrentRoute();
  const selectedRouteForView = useSelectedRouteForView();
  const setSelectedRouteForView = useSetSelectedRouteForView();
  const orsProfile = useOrsProfile();

  // This check is still useful for the title
  const isDisplayingCurrentRoute = displayRoute._id === currentRoute?._id;

  const handleStopViewing = () => {
    setSelectedRouteForView(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/30">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {isDisplayingCurrentRoute && !selectedRouteForView ? 'Current Route Details' : 'Viewing Route'}
      </h3>
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
        <div className="font-medium dark:text-gray-100">
          {displayRoute.name}
        </div>
        {displayRoute.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {displayRoute.description}
          </div>
        )}
        <div>Points: {displayRoute.points.length}</div>
        <div>Path: {displayRoute.path.length} coordinates</div>
        <div>Started: {format(new Date(displayRoute.startTime), 'PPp')}</div>
      </div>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Status:{' '}
        <span
          className={`font-medium capitalize ${
            displayRoute.status === 'active'
              ? 'text-green-600 dark:text-green-400'
              : displayRoute.status === 'paused'
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {displayRoute.status}
        </span>
        <span className="ml-2 text-blue-600 dark:text-blue-400">
          • Profile: {ORSProfiles.find((p) => p.value === orsProfile)?.label}
        </span>
      </div>
      {/* The button now appears whenever a route is selected for viewing,
          making it easy for the user to return to their previous state. */}
      {selectedRouteForView && (
        <button
          name="stopViewing"
          onClick={handleStopViewing}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {/* The button text is now more generic and always accurate. */}
          &larr; Stop viewing
        </button>
      )}
    </div>
  );
};
```

<!-- path: components/sidebar/RecentPoints.tsx -->
```typescript
import { Route } from '@/types';
import { RecentPointItem } from './RecentPointItem';

export const RecentPoints: React.FC<{ displayRoute: Route }> = ({ displayRoute }) => {
    if (displayRoute.points.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-900/30">
  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
    Recent Points
  </h3>
  <div className="space-y-2 max-h-48 overflow-y-auto">
    {displayRoute.points
      .slice(-5)
      .reverse()
      .map((point, index) => (
        <RecentPointItem key={index} point={point} />
      ))}
  </div>
</div>
    );
  };

```

<!-- path: components/sidebar/RouteStatistics.tsx -->
```typescript
import React from 'react';
import { calculateRouteStats } from '@/utils/routeCalculations';
import { Location } from '@/types';
import { RouteStats } from '@/types';

interface RouteStatisticsProps {
  currentPath: Location[];
  routeStats: RouteStats | null;
}

const RouteStatistics: React.FC<RouteStatisticsProps> = ({ currentPath, routeStats }) => {
  const currentStats = calculateRouteStats(currentPath);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
        <div className="font-medium text-blue-800 dark:text-blue-300">Current Distance</div>
        <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
          {(currentStats.distance / 1000).toFixed(2)} km
        </div>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-md">
        <div className="font-medium text-purple-800 dark:text-purple-300">GPS Points</div>
        <div className="text-lg font-bold text-purple-900 dark:text-purple-200">{currentStats.points}</div>
      </div>
      {routeStats && (
        <>
          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-md">
            <div className="font-medium text-green-800 dark:text-green-300">ORS Distance</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-200">
              {(routeStats.optimizedDistance / 1000).toFixed(2)} km
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
            <div className="font-medium text-yellow-800 dark:text-yellow-300">Efficiency</div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-200">
              {routeStats.efficiency.toFixed(1)}%
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RouteStatistics;

```

<!-- path: components/forms/StartSurveyForm.tsx -->
```typescript
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// 1. Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Route name must be at least 3 characters.",
  }).max(100, {
    message: "Route name cannot be longer than 100 characters.",
  }),
  description: z.string().max(500, {
    message: "Description cannot be longer than 500 characters.",
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StartSurveyFormProps {
  onStartSurvey: (data: FormValues) => void;
  onFormSubmit: () => void;
}

export function StartSurveyForm({ onStartSurvey, onFormSubmit }: StartSurveyFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(values: FormValues) {
    onStartSurvey(values);
    onFormSubmit();
    form.reset();
  }

  return (
    <>
      {/* These components will now work because they're inside DialogContent */}
      <DialogHeader>
        <DialogTitle>Start a New Survey</DialogTitle>
        <DialogDescription>
          Give your new route a name and an optional description to get started.
        </DialogDescription>
      </DialogHeader>

      <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Route Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Downtown Fiber Line A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Surveying the main fiber trunk for the city center project."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit">Start Survey</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
```

<!-- path: components/auth/ProfileSettings.tsx -->
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useAuthMutations';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCamera,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import Image from 'next/image';

export default function ProfileSettings() {
  const { user, isLoading } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    image: user?.image || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name.trim(),
        image: formData.image.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      image: user?.image || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Profile Information
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Update your profile information and photo
        </p>
      </div>

      {/* Success Message */}
      {updateProfileMutation.isSuccess && !isEditing && (
        <div className="mx-6 mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-center space-x-2">
          <HiOutlineCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Profile updated successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {updateProfileMutation.isError && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center space-x-2">
          <HiOutlineExclamationCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to update profile. Please try again.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            {(isEditing ? formData.image : user.image) ? (
              <Image
                src={isEditing ? formData.image : user.image!}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-200 dark:ring-gray-600"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                width={80}
                height={80}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <HiOutlineUser className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <HiOutlineCamera className="inline h-4 w-4 mr-1" />
                Profile Image URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image}</p>
              )}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <HiOutlineUser className="inline h-4 w-4 mr-1" />
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          ) : (
            <p className="px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-md">
              {user.name || 'Not set'}
            </p>
          )}
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <HiOutlineMail className="inline h-4 w-4 mr-1" />
            Email Address
          </label>
          <div className="flex items-center space-x-2">
            <p className="flex-1 px-3 py-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md">
              {user.email}
            </p>
            {user.emailVerified && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                <HiOutlineCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                  Verified
                </span>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email cannot be changed here. Contact support if needed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                <HiOutlineX className="inline h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="h-4 w-4 mr-1" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

<!-- path: components/auth/signin-button.tsx -->
```typescript
import { signIn } from "@/auth"

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn()
      }}
    >
      <button type="submit">Sign in</button>
    </form>
  )
}
```

<!-- path: components/auth/AuthProvider.tsx -->
```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthActions } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, updateLastActivity, setDeviceInfo } = useAuthActions();

  useEffect(() => {
    // Initialize auth store
    initializeAuth();

    // Set device info
    if (typeof window !== 'undefined') {
      setDeviceInfo({
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
      });
    }

    // Set up activity tracking
    const handleActivity = () => {
      updateLastActivity();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [initializeAuth, updateLastActivity, setDeviceInfo]);

  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
```

<!-- path: components/auth/UserAvatarClient.tsx -->
```typescript
'use client'

import Image from "next/image"
import { useState } from "react"

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Session {
  user?: User
}

interface UserAvatarProps {
  session: Session | null
  size?: number
}

function UserAvatarClient({ session, size = 40 }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  if (!session?.user) return null

  const user = session.user

  // Get the first letter for fallback
  const getInitial = (): string => {
    if (user.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U" // Ultimate fallback
  }

  // Generate a consistent color based on the initial
  const getBackgroundColor = (initial: string): string => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-lime-500", "bg-amber-500"
    ]
    const index = initial.charCodeAt(0) % colors.length
    return colors[index]
  }

  const initial = getInitial()
  const bgColor = getBackgroundColor(initial)

  const showFallback = !user.image || imageError

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      {user.image && !imageError && (
        <Image
          src={user.image}
          alt="User Avatar"
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {showFallback && (
        <div
          className={`
            rounded-full ${bgColor}
            flex items-center justify-center text-white font-semibold
          `}
          style={{
            width: size,
            height: size,
            fontSize: `${size * 0.35}px` // Dynamic font size based on avatar size
          }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

export default UserAvatarClient
```

<!-- path: components/auth/signout-button.tsx -->
```typescript
import { signOut } from "@/auth"

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  )
}
```

<!-- path: components/auth/UserAvatar.tsx -->
```typescript
import { auth } from "@/auth"
import UserAvatarClient from "./UserAvatarClient" // Adjust path as needed

interface UserAvatarServerProps {
  size?: number
}

export default async function UserAvatar({ size = 40 }: UserAvatarServerProps) {
  const session = await auth()

  return <UserAvatarClient session={session} size={size} />
}
```

<!-- path: components/auth/AuthGuard.tsx -->
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function AuthGuard({
  children,
  redirectTo = '/login',
  requireAuth = true
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated && redirectTo === '/login') {
        // Redirect authenticated users away from login page
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!requireAuth && isAuthenticated && redirectTo === '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

<!-- path: components/auth/UserDropdown.tsx -->
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useAuthMutations';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineChevronDown,
  HiOutlineMail,
  HiOutlineCalendar,
} from 'react-icons/hi';
import Image from 'next/image';
import { format } from 'date-fns';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const signOutMutation = useSignOut();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync('/login');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
      >
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
              width={32}
              height={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <HiOutlineUser className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium truncate max-w-32">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
            {user.email}
          </p>
        </div>

        {/* Chevron */}
        <HiOutlineChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-12 w-12 rounded-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                  <HiOutlineUser className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name || 'Unnamed User'}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <HiOutlineMail className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                {user.emailVerified && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Verified
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/profile');
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <HiOutlineUser className="h-4 w-4 mr-3" />
              Profile Settings
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/settings');
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <HiOutlineCog className="h-4 w-4 mr-3" />
              Account Settings
            </button>

            {user.createdAt && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <HiOutlineCalendar className="h-3 w-3" />
                  <span>
                    Member since {format(new Date(user.createdAt), 'PP')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={handleSignOut}
              disabled={signOutMutation.isPending}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50"
            >
              {signOutMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-3" />
              ) : (
                <HiOutlineLogout className="h-4 w-4 mr-3" />
              )}
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

```

<!-- path: components/SurveyMap.tsx -->
```typescript
// components/SurveyMap.tsx
'use client';

import React, { useMemo, useRef, useEffect, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';
import { Route, SurveyPoint } from '@/types';
import { MapViewRef, MapViewProps } from '@/components/MapView'; // Import MapViewProps
import { useOrsStore } from '@/store/orsStore';

// Import the new MapControls component
import { MapControls } from './map/MapControls';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

// Use the existing MapViewProps for SurveyMapProps
export type SurveyMapProps = MapViewProps & {
  ref?: React.ForwardedRef<MapViewRef>;
  sidebarCollapsed?: boolean;
};

const SurveyMap = forwardRef<MapViewRef, Omit<SurveyMapProps, 'ref'>>(
  (props, ref) => {
    const { processedRoute, originalRouteForProcessing } = useOrsStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const routeWithProcessed = useMemo(() => {
      if (!props.route) return null;
      return {
        ...props.route,
        processedRoute:
          props.route.orsData?.processedPath || processedRoute || null,
        originalRouteForProcessing:
          props.route.orsData?.originalPath ||
          originalRouteForProcessing ||
          null,
      };
    }, [props.route, processedRoute, originalRouteForProcessing]);

    useEffect(() => {
      const handleMapResize = () => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (containerRef.current) {
              window.dispatchEvent(new Event('resize'));
            }
          }, 150);
        });
      };
      handleMapResize();
    }, [props.sidebarCollapsed]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex-1 flex flex-col"
      >
        <MapView
          ref={ref}
          // Pass all props through to MapView
          {...props}
        />
        {/* Render the new MapControls component instead of RecenterButton */}
        <MapControls
          onLocationRefresh={props.onLocationRefresh}
          isMobile={!!props.isMobile}
        />
      </div>
    );
  }
);

SurveyMap.displayName = 'SurveyMap';
export { SurveyMap };
```

<!-- path: components/SurveyControls.tsx -->
```typescript
// components/SurveyControls.tsx
import React, { useCallback, useState } from 'react';
import { useSurveyStore, useCurrentRoute } from '@/store/surveyStore';
import { useOrsStore } from '@/store/orsStore';
import { Location, RouteStats, SurveyPoint, PointTypeValue } from '@/types';
import { MobileTab } from '@/types/tabs';
import { AddPointModal } from '@/components/modal/AddPointModal';
import { RouteControls } from '@/components/controls/RouteControls';
import ORSProcessing from '@/components/ors/ORSProcessing';
import { StartSurveyForm } from '@/components/forms/StartSurveyForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProcessRoute } from '@/hooks/useProcessRoute';
import { toast } from 'sonner';

interface SurveyControlsProps {
  currentLocation: Location | null;
  onSaveRoute?: () => void;
  onLocationRefresh?: () => void;
  className?: string;
  isMobile?: boolean;
  allowUpdate?: boolean;
  onToggleUpdate?: (allowUpdate: boolean) => void;
  gpsLoading?: boolean;
  requestLocation?: () => void;
  gpsError?: string | null;
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
  accuracy?: number;
  speed?: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClear: () => void;
}

export const SurveyControls: React.FC<SurveyControlsProps> = (props) => {
  const { accuracy } = props;
  const currentRoute = useCurrentRoute();
  const surveyActions = useSurveyStore();

  const orsState = useOrsStore();
  const processedRoute = orsState.processedRoute;
  const routeStats = orsState.routeStats;
  const clearProcessedRoute = orsState.clearProcessedRoute;

  const orsEnabled = false;
  const [open, setOpen] = useState(false);
  const [showPointForm, setShowPointForm] = useState(false);
  const [preselectedPointType] = useState<PointTypeValue>('UG_JC');

  const handleStartSurvey = ({ name, description }: { name: string; description?: string }) => {
    surveyActions.startSurvey(name, description || '');
    props.requestLocation?.();
  };

  const handleFormSubmit = () => setOpen(false);

  const handleAddPoint = (pointData: { pointType: PointTypeValue; notes: string; photos?: string[]; }) => {
    if (!props.currentLocation) return;
    const newPoint: Omit<SurveyPoint, 'timestamp' | 'routeId'> = {
      location: props.currentLocation,
      pointType: pointData.pointType,
      notes: pointData.notes,
      photos: pointData.photos || [],
      accuracy: accuracy,
    };
    surveyActions.addSurveyPoint(newPoint);
    setShowPointForm(false);
  };

  const processRouteMutation = useProcessRoute();
  const handleProcessRoute = useCallback(() => {
    if (!currentRoute) {
      toast.error("No route is currently selected to process.");
      return;
    }
    processRouteMutation.mutate({ route: currentRoute, profile: 'driving-car' });
  }, [currentRoute, processRouteMutation]);

  if (!currentRoute) {
    return (
      <div className={`bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg h-fit ${props.className}`}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild className="w-full">
            <Button>Start New Survey</Button>
          </DialogTrigger>
          <DialogContent>
            <StartSurveyForm onStartSurvey={handleStartSurvey} onFormSubmit={handleFormSubmit} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg h-fit ${props.className}`}>
      {/* --- THIS IS THE FIX --- */}
      {/* Pass the required props down to the RouteControls component */}
      <RouteControls
        onPause={props.onPause}
        onResume={props.onResume}
        onStop={props.onStop}
        onClear={props.onClear}
      />
      {/* --- END OF FIX --- */}
      {orsEnabled && currentRoute?.status === 'completed' && currentRoute?.path.length >= 2 && (
        <ORSProcessing
          isProcessing={false}
          progress={0}
          processedRoute={processedRoute}
          routeStats={routeStats as RouteStats}
          onProcess={handleProcessRoute}
          onClear={clearProcessedRoute}
          orsApiKey=""
        />
      )}
      <AddPointModal
        isOpen={showPointForm}
        onClose={() => setShowPointForm(false)}
        onSave={handleAddPoint}
        // The `pointData` prop was renamed, ensure it's passed correctly
        pointData={props.currentLocation ? { location: props.currentLocation, pointType: preselectedPointType } : undefined}
      />
    </div>
  );
};
```

<!-- path: components/map/SurveyPointPopup.tsx -->
```typescript
import { SurveyPoint } from '@/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface SurveyPointPopupProps {
  point: SurveyPoint;
  onEdit: (point: SurveyPoint) => void;
  // The handler is just a function that takes no arguments now
  onDelete: () => void;
}

export const SurveyPointPopup: React.FC<SurveyPointPopupProps> = ({
  point,
  onEdit,
  onDelete,
}) => {
  // ... existing display logic remains the same ...
  const pointTypeLabel = point.pointType
    ? point.pointType.replace('_', ' ')
    : 'Survey Point';
  const displayName = point.notes?.trim() ? point.notes : pointTypeLabel;

  return (
    <div className="text-sm max-w-xs">
      <div className="font-semibold capitalize dark:text-gray-100">
        {displayName}
      </div>
      <div className="text-gray-600 dark:text-gray-400 mb-2">
        {displayName.toLowerCase() !== pointTypeLabel.toLowerCase() &&
          `${pointTypeLabel} • `}
        {format(new Date(point.timestamp), 'PP p')}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <div>Lat: {point.location.lat.toFixed(6)}</div>
        <div>Lng: {point.location.lng.toFixed(6)}</div>
        {point.accuracy && <div>Accuracy: {point.accuracy.toFixed(1)}m</div>}
      </div>

      {/* --- NEW PHOTO DISPLAY SECTION --- */}
      {point.photos && point.photos.length > 0 && (
        <div className="mt-2">
          <div className="grid grid-cols-3 gap-1">
            {point.photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={url}
                  alt="Survey point photo"
                  width={60}
                  height={60}
                  className="rounded object-cover w-full h-16"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* --- NEW ACTION BUTTONS --- */}
      <div className="flex gap-2 mt-3 border-t pt-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(point)}>
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

```

<!-- path: components/map/MobileDragHandler.tsx -->
```typescript
import { useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';

export const MobileDragHandler = ({
  setAllowLocationUpdate,
  isLocationUpdateEnabled = false
}: {
  setAllowLocationUpdate?: (allowUpdate: boolean) => void,
  isLocationUpdateEnabled?: boolean
}) => {
    const map = useMap();
    const isManualOverride = useRef(false);
    const isDraggingRef = useRef(false);
    const wasLocationUpdateEnabled = useRef(isLocationUpdateEnabled);
    const touchStartRef = useRef<{x: number, y: number} | null>(null);
    const TOUCH_MOVE_THRESHOLD = 10; // pixels

    // Handle map drag events
    useMapEvents({
      dragstart: () => {
        if (isManualOverride.current) {
          isManualOverride.current = false;
          return;
        }
        wasLocationUpdateEnabled.current = isLocationUpdateEnabled;
        isDraggingRef.current = true;
        setAllowLocationUpdate?.(false);
      },
      dragend: () => {
        if (isManualOverride.current || !isDraggingRef.current) {
          return;
        }
        if (wasLocationUpdateEnabled.current) {
          setAllowLocationUpdate?.(true);
        }
        isDraggingRef.current = false;
      }
    });

    // Handle touch events for mobile
    useEffect(() => {
      const container = map.getContainer();

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!touchStartRef.current || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);

        // Only consider it a drag if the touch moved more than the threshold
        if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
          if (!isDraggingRef.current) {
            wasLocationUpdateEnabled.current = isLocationUpdateEnabled;
            isDraggingRef.current = true;
            setAllowLocationUpdate?.(false);
          }
        }
      };

      const handleTouchEnd = () => {
        if (isDraggingRef.current) {
          if (wasLocationUpdateEnabled.current) {
            setAllowLocationUpdate?.(true);
          }
          isDraggingRef.current = false;
        }
        touchStartRef.current = null;
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }, [map, setAllowLocationUpdate, isLocationUpdateEnabled]);

    return null;
};
```

<!-- path: components/map/mapIcons.ts -->
```typescript
'use client';

import L, { DivIcon } from 'leaflet';
import { Home, Cable, Zap, Navigation, Cpu, ArrowLeftRight, Radio } from 'lucide-react';

// This function applies the critical fix for default marker icons.
// It's safe to call multiple times, but will only run its logic once.
let leafletPatched = false;
function patchLeafletIconPaths() {
  if (leafletPatched) return;

  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    leafletPatched = true;
  }
}

// Run the patch as soon as the module loads on the client.
patchLeafletIconPaths();


/**
 * Custom icon creator. This MUST be an async function.
 * It is now very simple and has no side effects.
 */
export async function createCustomIcon(color: string, IconComponent: React.ComponentType): Promise<DivIcon> {
  const getSvgPath = () => {
    switch (IconComponent) {
      case Cable:
        return '<path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1Z"></path><path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"></path><path d="M21 21-3-3 9-9"></path>';

      case Zap:
        return '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>';

      case Navigation:
        return '<polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>';

      case Cpu:
        return '<rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2"></path><path d="M15 20v2"></path><path d="M2 15h2"></path><path d="M2 9h2"></path><path d="M20 15h2"></path><path d="M20 9h2"></path><path d="M9 2v2"></path><path d="M9 20v2"></path>';

      case ArrowLeftRight:
        return '<path d="M8 3 4 7l4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>';

      case Radio:
        return '<path d="m2 16 4-7"></path><path d="m7 21 4-7"></path><path d="m12 16 4-7"></path><path d="m17 21 4-7"></path><path d="M4.5 8.5a5 5 0 0 1 15 0"></path><circle cx="12" cy="13" r="1"></circle>';

      case Home:
      default:
        return '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline>';
    }
  };

  // Create a unique ID for the SVG to avoid style conflicts
  const iconId = `icon-${Math.random().toString(36).substr(2, 9)}`;

  return L.divIcon({
    html: `
      <div class="custom-marker" style="
        background: ${color};
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="white"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          ${getSvgPath()}
        </svg>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -16]
  });
}
```

<!-- path: components/map/MapDragHandler.tsx -->
```typescript
'use client';

import { useMapEvents } from 'react-leaflet';
import { useRef } from 'react';

interface MapDragHandlerProps {
  // A function to change the "follow mode" state in the parent component (app/page.tsx)
  onManualInteraction: (isFollowing: boolean) => void;
  // The current state of "follow mode"
  isFollowing: boolean;
}

export const MapDragHandler = ({ onManualInteraction, isFollowing }: MapDragHandlerProps) => {
  // Use a ref to remember if the user *wanted* to be following before they started dragging.
  const wasFollowingRef = useRef(isFollowing);

  useMapEvents({
    // This event fires as soon as a mouse-drag starts.
    dragstart: () => {
      // Remember the state from before the drag.
      wasFollowingRef.current = isFollowing;

      // Immediately tell the app to STOP following the user.
      // This prevents the map from snapping back on the next GPS update.
      onManualInteraction(false);
    },
    // This event fires when the mouse-drag ends.
    dragend: () => {
      // If the user *originally* had "Follow Mode" enabled, re-enable it for them.
      // If they had it disabled, this will leave it disabled.
      if (wasFollowingRef.current) {
        onManualInteraction(true);
      }
    },
  });

  // This component renders nothing to the DOM. It only listens for map events.
  return null;
};
```

<!-- path: components/map/MapClickHandler.tsx -->
```typescript
// components/map/MapClickHandler.tsx
import { useMapEvents } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import { useEffect } from 'react';
import { useIsDragMode, useToggleDragMode } from '@/store/uiStore';

interface MapClickHandlerProps {
  onMapClick: (location: LatLngTuple) => void;
}

export const MapClickHandler = ({ onMapClick }: MapClickHandlerProps) => {
  // FIXED: Use atomic selectors instead of object-creating selector
  const isDragMode = useIsDragMode();
  const toggleDragMode = useToggleDragMode();

  const map = useMapEvents({
    click: (e) => {
      // Only trigger the onMapClick callback if we are in "point adding" mode
      if (!isDragMode) {
        const { lat, lng } = e.latlng;
        onMapClick([lat, lng]);
      }
    },
    dblclick: () => {
      // Double-clicking always toggles the mode
      toggleDragMode();
    },
  });

  // This effect correctly updates the map's cursor and interaction settings
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();

    if (isDragMode) {
      if (!container.classList.contains('leaflet-grab')) {
        container.classList.add('leaflet-grab');
      }
      container.classList.remove('leaflet-crosshair');
      map.dragging.enable();
    } else {
      container.classList.remove('leaflet-grab');
      if (!container.classList.contains('leaflet-crosshair')) {
        container.classList.add('leaflet-crosshair');
      }
      map.dragging.disable();
    }
  }, [isDragMode, map]);

  return null;
};
```

<!-- path: components/map/CurrentLocationMarker.tsx -->
```typescript
"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { DivIcon } from 'leaflet';
import { createCustomIcon } from "@/components/map/mapIcons";
import { MapPin } from "lucide-react";
import { Location } from "@/types";

export const CurrentLocationMarker: React.FC<{ location: Location }> = ({ location }) => {
  const [icon, setIcon] = useState<DivIcon | null>(null);

  useEffect(() => {
    // Create the icon when the component mounts
    createCustomIcon("#f59e0b", MapPin).then(setIcon);
  }, []);

  // Render nothing until the icon has been created
  if (!icon) {
    return null;
  }

  return (
    <Marker position={[location.lat, location.lng]} icon={icon}>
      <Popup>
        <div className="text-sm">
          <div className="font-semibold">Current Location</div>
          <div>Lat: {location.lat.toFixed(6)}</div>
          <div>Lng: {location.lng.toFixed(6)}</div>
        </div>
      </Popup>
    </Marker>
  );
};
```

<!-- path: components/map/LocationUpdateIndicator.tsx -->
```typescript
export const LocationUpdateIndicator: React.FC<{ allowLocationUpdate?: boolean }> = ({ allowLocationUpdate }) => {
  if (allowLocationUpdate) return null;

  return (
    <div className="absolute top-4 left-4 bg-orange-500 dark:bg-orange-600 text-white px-3 py-2 rounded-lg shadow-lg dark:shadow-gray-900/30 text-sm z-10">
      📍 Location updates paused
    </div>
  );
};

```

<!-- path: components/map/MapLegend.tsx -->
```typescript
// components/map/MapLegend.tsx

import { MapPin } from 'lucide-react';

export const MapLegend = ({ isMobile }: { isMobile: boolean }) => (
  <div
    className={`absolute ${
      isMobile ? 'bottom-4 right-4' : 'top-4 right-4'
    } z-10 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg dark:shadow-gray-900/30 text-xs max-w-[200px]`}
  >
    <div className="font-semibold mb-2 flex items-center gap-2 dark:text-gray-100">
      <MapPin className="w-4 h-4" />
      Legend
    </div>
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-amber-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Current Location</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Underground JC</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Overhead JC</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Post</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-purple-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Transformer</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-yellow-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Exchange</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-pink-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">BTS</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-500 rounded-full border border-white dark:border-gray-800 shadow-sm"></div>
        <span className="dark:text-gray-300">Customer Premises</span>
      </div>
    </div>
  </div>
);

```

<!-- path: components/map/MapPolylines.tsx -->
```typescript
// components/map/MapPolylines.tsx
import React from 'react';
import { Polyline } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

interface MapPolylinesProps {
  currentPath: LatLngTuple[];
  originalRoute: LatLngTuple[] | null;
  processedRoute: LatLngTuple[] | null;
}

const MapPolylines: React.FC<MapPolylinesProps> = ({
  currentPath,
  originalRoute,
  processedRoute,
}) => {
  // --- THIS IS THE FIX ---
  // The component now returns a React Fragment (<>...</>), allowing it to render
  // multiple Polyline components simultaneously instead of just one.
  return (
    <>
      {/* 1. Live, in-progress survey path (solid blue) */}
      {/* This will now always render during an active survey. */}
      {currentPath.length > 1 && (
        <Polyline
          positions={currentPath}
          color="#3b82f6" // Blue
          weight={4}
          opacity={0.8}
        />
      )}

      {/* 2. Historical original path (dotted red) - used for comparison when viewing routes */}
      {originalRoute && originalRoute.length > 1 && (
        <Polyline
          positions={originalRoute}
          color="#ef4444" // Dotted red
          weight={3}
          opacity={0.7}
          dashArray="5, 10"
        />
      )}

      {/* 3. Optimized/Processed path (solid green) */}
      {processedRoute && processedRoute.length > 1 && (
        <Polyline
          positions={processedRoute}
          color="#10b981" // Solid green
          weight={5}
          opacity={0.9}
        />
      )}
    </>
  );
  // --- END OF FIX ---
};

export default MapPolylines;

```

<!-- path: components/map/MapMarkers.tsx -->
```typescript
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LatLngTuple } from 'leaflet';

interface MapMarkersProps {
  currentPath: LatLngTuple[];
  routeStatus?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  currentPath = [],
  routeStatus,
}) => {

  // Event handler to stop the click from bubbling up to the map
  const markerEventHandlers = {
    click: (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
    },
  };

  // If no currentPath, show a default marker at 0,0 with a message
  if (!currentPath || currentPath.length === 0) {
    return (
      <Marker
        position={[0, 0]}
        icon={L.divIcon({
          className: 'custom-marker default-marker',
          html: '<div style="background: #3b82f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);">!</div>',
          iconSize: [24, 24],
        })}
        eventHandlers={markerEventHandlers}
      >
        <Popup>No route points available</Popup>
      </Marker>
    );
  }

  return (
    <>
      {/* Start Marker */}
      <Marker
        position={currentPath[0]}
        icon={L.divIcon({
          className: 'custom-marker start-marker',
          html: '<div style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);">S</div>',
          iconSize: [24, 24],
        })}
        eventHandlers={markerEventHandlers}
        zIndexOffset={1000}
      >
        <Popup>Route Start</Popup>
      </Marker>

      {/* End Marker - Only show if route is completed and has more than one point */}
      {currentPath.length > 1 && routeStatus === 'completed' && (
        <Marker
          position={currentPath[currentPath.length - 1]}
          icon={L.divIcon({
            className: 'custom-marker end-marker',
            html: '<div style="background: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);">E</div>',
            iconSize: [24, 24],
          })}
          eventHandlers={markerEventHandlers}
          zIndexOffset={1000}
        >
          <Popup>Route End</Popup>
        </Marker>
      )}
    </>
  );
};

export default MapMarkers;

```

<!-- path: components/map/MobileInstructor.tsx -->
```typescript
import { useEffect, useState } from 'react';
import L from 'leaflet';

export const MobileInstructor = () => {
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!L.Browser.mobile || !showInstructions) return null;

  return (
    <div className="absolute top-16 left-4 right-4 bg-blue-500 dark:bg-blue-600 text-white p-3 rounded-lg shadow-lg dark:shadow-gray-900/30 text-sm z-10 animate-pulse">
      <div className="flex justify-between items-center">
        <span>📱 Touch and drag to navigate the map</span>
        <button
          name="closeInstructions"
          onClick={() => setShowInstructions(false)}
          className="text-white hover:text-gray-200 dark:hover:text-gray-300 text-lg font-bold"
          aria-label="Close instructions"
        >
          ×
        </button>
      </div>
    </div>
  );
};

```

<!-- path: components/map/SurveyPoints.tsx -->
```typescript
// components/map/SurveyPoints.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L, { DivIcon } from 'leaflet'; // Import L for event handling
import { createCustomIcon } from './mapIcons';
import { SurveyPoint, pointTypes, PointTypeValue } from '@/types';
import { SurveyPointPopup } from './SurveyPointPopup';
import MarkerClusterGroup from 'react-leaflet-markercluster';

const colorMap: Record<string, string> = {
  blue: '#3b82f6', green: '#10b981', red: '#ef4444', purple: '#8b5cf6',
  yellow: '#eab308', pink: '#ec4899', gray: '#6b7280',
};
const pointTypeConfig = pointTypes.reduce((acc, type) => {
  const colorName = type.color.replace('bg-', '').split('-')[0];
  acc[type.value] = { color: colorMap[colorName] || '#3b82f6', component: type.icon, label: type.label, shortLabel: type.shortLabel };
  return acc;
}, {} as Record<PointTypeValue, { color: string; component: any; label: string; shortLabel: string }>);

const normalizePointType = (type: string | undefined): PointTypeValue => {
  if (!type) return 'UG_JC';
  const normalized = type.trim().toUpperCase();
  if (pointTypeConfig[normalized as PointTypeValue]) return normalized as PointTypeValue;
  const matchedType = Object.keys(pointTypeConfig).find((key) => key.toUpperCase() === normalized);
  return (matchedType || 'UG_JC') as PointTypeValue;
};

interface SurveyPointsProps {
  points: SurveyPoint[];
  onEdit: (point: SurveyPoint) => void;
  onDelete: (point: SurveyPoint) => void;
}

const SurveyPointsComponent: React.FC<SurveyPointsProps> = ({ points, onEdit, onDelete }) => {
  const [customIcons, setCustomIcons] = useState<Record<string, DivIcon>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadIcons = async () => {
      const icons: Record<string, DivIcon> = {};
      for (const [type, config] of Object.entries(pointTypeConfig)) {
        try {
          icons[type] = await createCustomIcon(config.color, config.component);
        } catch (error) {
          console.error(`Failed to create icon for type ${type}:`, error);
        }
      }
      setCustomIcons(icons);
    };
    loadIcons();
  }, []);

  const markers = useMemo(() => {
    if (Object.keys(customIcons).length === 0) return null;
    return points.map((point) => {
      const normalizedType = normalizePointType(point.pointType);
      const icon = customIcons[normalizedType];
      if (!icon) return null;

      return (
        <Marker
          key={point._id}
          position={[point.location.lat, point.location.lng]}
          icon={icon}
          // --- THIS IS THE FIX ---
          // This stops the click event from propagating to the map,
          // preventing the map's own click handler from firing.
          eventHandlers={{
            click: (e) => {
              // In react-leaflet, the original Leaflet event is on `originalEvent`
              e.originalEvent.stopPropagation();
            },
          }}
          // --- END OF FIX ---
        >
          <Popup>
            <SurveyPointPopup
              point={point}
              onEdit={onEdit}
              onDelete={() => onDelete(point)}
            />
          </Popup>
        </Marker>
      );
    });
  }, [customIcons, points, onEdit, onDelete]);

  if (Object.keys(customIcons).length === 0) return null;

  return (
    <MarkerClusterGroup chunkedLoading maxClusterRadius={60} spiderfyOnMaxZoom={true}>
      {markers}
    </MarkerClusterGroup>
  );
};

export const SurveyPoints = React.memo(SurveyPointsComponent);
```

<!-- path: components/map/RecenterButton.tsx -->
```typescript
import { Navigation } from 'lucide-react';

export const RecenterButton: React.FC<{
  onLocationRefresh?: () => void;
  isMobile: boolean;
}> = ({ onLocationRefresh, isMobile }) => {
  if (!onLocationRefresh) return null;

  return (
    <button
      name="recenter"
      onClick={onLocationRefresh}
      className={`absolute ${isMobile ? 'bottom-20 left-4 z-[400]' : 'bottom-4 right-4'}
    bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border hover:bg-gray-50 dark:hover:bg-gray-700 z-10 dark:border-gray-700`}
      title="Recenter to current location"
      aria-label="Recenter to current location"
    >
      <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    </button>
  );
};

```

<!-- path: components/map/MapSettingsPanel.tsx -->
```typescript
'use client';

// Correctly import the hooks from the auth store
import { useAuthPreferences, useUpdatePreferences } from '@/store/authStore';
import { Map, Satellite, Mountain } from 'lucide-react';

const mapTypes = [
  { id: 'street', label: 'Street', icon: Map },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
] as const; // Use 'as const' for better type inference

type MapTypeId = typeof mapTypes[number]['id'];

export const MapSettingsPanel = () => {
  const preferences = useAuthPreferences();
  const updatePreferences = useUpdatePreferences();

  const handleMapTypeChange = (mapType: MapTypeId) => {
    updatePreferences({ defaultMapType: mapType });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Map Type</label>
      <div className="grid grid-cols-3 gap-2">
        {mapTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleMapTypeChange(type.id)}
            className={`px-2 py-2 text-xs font-medium rounded-md flex flex-col items-center justify-center gap-1 transition-colors border-2 ${
              preferences.defaultMapType === type.id
                ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-700 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

<!-- path: components/map/RoutePath.tsx -->
```typescript
import { LatLngTuple } from "leaflet";
import { Polyline } from "react-leaflet";
import { Location } from "@/types";

export const RoutePath: React.FC<{ path: Location[] }> = ({ path }) => {
    const pathPositions: LatLngTuple[] = path.map((loc) => [loc.lat, loc.lng]);

    if (pathPositions.length <= 1) return null;

    return <Polyline positions={pathPositions} color="#3b82f6" weight={4} opacity={0.7} />;
  };
```

<!-- path: components/map/MapControls.tsx -->
```typescript
// components/map/MapControls.tsx
'use client';

import { Navigation, Hand, Crosshair } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

interface MapControlsProps {
  onLocationRefresh?: () => void;
  isMobile: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({ onLocationRefresh, isMobile }) => {
  const isDragMode = useUIStore((state) => state.isDragMode);
  const toggleDragMode = useUIStore((state) => state.toggleDragMode);

  return (
    <div
      className={`absolute ${
        isMobile ? 'bottom-20 left-4' : 'bottom-4 left-4'
      } z-10 flex flex-col gap-2`}
    >
      {/* Drag Mode Toggle Button */}
      <button
        onClick={toggleDragMode}
        className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 transition-colors"
        title={isDragMode ? 'Switch to Add Point Mode' : 'Switch to Pan/Drag Mode'}
        aria-label={isDragMode ? 'Switch to Add Point Mode' : 'Switch to Pan/Drag Mode'}
      >
        {isDragMode ? (
          <Hand className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <Crosshair className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {/* Recenter Button */}
      {onLocationRefresh && (
        <button
          onClick={onLocationRefresh}
          className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 transition-colors"
          title="Recenter to current location"
          aria-label="Recenter to current location"
        >
          <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </button>
      )}
    </div>
  );
};
```

<!-- path: components/map/PointTypeModal.tsx -->
```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PointTypeValue, pointTypes } from '@/types';

type PointTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pointType: PointTypeValue) => void;
  position?: { lat: number; lng: number };
};

export function PointTypeModal({ isOpen, onClose, onSelect, position }: PointTypeModalProps) {
  const handleSelect = (pointType: PointTypeValue) => {
    onSelect(pointType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Point Type</DialogTitle>
          {position && (
            <p className="text-sm text-muted-foreground">
              Position: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          )}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-4">
          {pointTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 p-2 text-center"
                onClick={() => handleSelect(type.value)}
              >
                <div className={`p-2 rounded-full ${type.color} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs">{type.label}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

```

<!-- path: components/map/LocationUpdater.tsx -->
```typescript
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { LatLngTuple } from 'leaflet';

export const LocationUpdater = ({ location, allowUpdate = true }: { location: LatLngTuple | null; allowUpdate?: boolean }) => {
    const map = useMap();
    const lastLocationRef = useRef<LatLngTuple | null>(null);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      if (location && allowUpdate) {
        if (!lastLocationRef.current ||
            lastLocationRef.current[0] !== location[0] ||
            lastLocationRef.current[1] !== location[1]) {

          updateTimeoutRef.current = setTimeout(() => {
            map.setView(location, map.getZoom(), {
              animate: true,
              duration: 1,
              easeLinearity: 0.5
            });
            lastLocationRef.current = location;
          }, 100);
        }
      }

      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }, [location, map, allowUpdate]);

    return null;
  };
```

<!-- path: components/SurveyHeader.tsx -->
```typescript
// components/SurveyHeader.tsx
'use client';

import { memo, useState, useEffect } from 'react'; // Import useState and useEffect
import { Logo } from './header/Logo';
import { MobileNavigation } from './header/MobileNavigation';
import { DesktopNavigation } from './header/DesktopNavigation';
import { useIsMobile } from '@/hooks/useMediaQuery';

// NEW: A client-only wrapper to handle the mobile/desktop switch safely.
const HeaderNavigation = ({ routesCount }: { routesCount: number }) => {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // On the server and initial client render, render nothing to avoid mismatch.
  if (!isMounted) {
    return null;
  }

  // After mounting, we can safely render the correct navigation component.
  return isMobile ? <MobileNavigation /> : <DesktopNavigation routesCount={routesCount} />;
};


interface SurveyHeaderProps {
  routesCount: number;
}

const SurveyHeaderComponent: React.FC<SurveyHeaderProps> = ({ routesCount }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 flex-shrink-0 z-500 relative">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />
          {/* We now render the new safe component */}
          <HeaderNavigation routesCount={routesCount} />
        </div>
      </div>
    </header>
  );
};

const areEqual = (prevProps: SurveyHeaderProps, nextProps: SurveyHeaderProps) => {
  return prevProps.routesCount === nextProps.routesCount;
};

export const SurveyHeader = memo(SurveyHeaderComponent, areEqual);
```

<!-- path: components/header/MobileNavigation.tsx -->
```typescript
// components/header/MobileNavigation.tsx
'use client';

import { memo, useCallback } from 'react';
import { X, MapPin, List, Menu } from 'lucide-react';
// Import the individual atomic selectors
import {
  useActiveMainTab,
  useSetActiveMainTab,
  useMobileSidebarOpen,
  useSetMobileSidebarOpen
} from '@/store/uiStore';

const MobileNavigationComponent: React.FC = () => {
  // Use atomic selectors to prevent unnecessary re-renders
  const activeMainTab = useActiveMainTab();
  const setActiveMainTab = useSetActiveMainTab();
  const mobileSidebarOpen = useMobileSidebarOpen();
  const setMobileSidebarOpen = useSetMobileSidebarOpen();

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  }, [mobileSidebarOpen, setMobileSidebarOpen]);

  const handleMapClick = useCallback(() => setActiveMainTab('map'), [setActiveMainTab]);
  const handleRoutesClick = useCallback(() => setActiveMainTab('routes'), [setActiveMainTab]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={handleMapClick}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeMainTab === 'map'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Map
        </button>
        <button
          onClick={handleRoutesClick}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeMainTab === 'routes'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <List className="w-4 h-4" />
          Routes
        </button>
      </div>
      <button
        name="sidebarToggle"
        onClick={toggleMobileSidebar}
        className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-600"
        aria-label={mobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {mobileSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

// No props are passed, so we can use a simple memoization
export const MobileNavigation = memo(MobileNavigationComponent);

```

<!-- path: components/header/DesktopNavigation.tsx -->
```typescript
// components/header/DesktopNavigation.tsx
'use client';

import { ChevronLeft, ChevronRight, List, MapPin } from 'lucide-react';
import { NavTabButton } from './NavTabButton';
import { useUIStore } from '@/store/uiStore';

interface DesktopNavigationProps {
  routesCount: number;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  routesCount,
}) => {
  // Use atomic selectors to prevent unnecessary re-renders
  const activeMainTab = useUIStore(state => state.activeMainTab);
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const setActiveMainTab = useUIStore(state => state.setActiveMainTab);
  const toggleSidebarCollapsed = useUIStore(state => state.toggleSidebarCollapsed);

  return (
    <nav className="flex space-x-1 items-center">
      <NavTabButton
        icon={<MapPin className="w-4 h-4 inline" />}
        label="Map"
        isActive={activeMainTab === 'map'}
        onClick={() => setActiveMainTab('map')}
      />
      <NavTabButton
        icon={<List className="w-4 h-4 inline" />}
        label="Routes"
        isActive={activeMainTab === 'routes'}
        onClick={() => setActiveMainTab('routes')}
        count={routesCount}
      />
      <button
        name="sidebarToggle"
        onClick={toggleSidebarCollapsed}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </nav>
  );
};

```

<!-- path: components/header/NavTabButton.tsx -->
```typescript
interface NavTabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

export const NavTabButton: React.FC<NavTabButtonProps> = ({ icon, label, isActive, onClick, count }) => {
  return (
    <button
      name={label}
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="ml-1">{label}</span>
      {count !== undefined && <span className="ml-1">({count})</span>}
    </button>
  );
};

```

<!-- path: components/header/Logo.tsx -->
```typescript
// components/header/Logo.tsx
'use client'; // This component now needs to be a client component

import { MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useEffect, useState } from 'react';

// This new wrapper ensures the part that changes is only rendered on the client after mount.
const ClientOnlyTitle = () => {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // On the server and initial client render, render nothing to match the mobile output.
    return null;
  }

  if (isMobile) {
    return null;
  }

  return <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Route Survey</h1>;
};

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
      <ClientOnlyTitle />
    </div>
  );
};

```

<!-- path: components/SurveySidebar.tsx -->
```typescript
// components/SurveySidebar.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { RouteInfo } from '@/components/sidebar/RouteInfo';
import { RecentPoints } from '@/components/sidebar/RecentPoints';
import { MobileOverlay } from '@/components/sidebar/MobileOverlay';
import { ReprocessRouteModal } from '@/components/modal/ReprocessRouteModal';
import { PhotoGallery } from '@/components/sidebar/PhotoGallery';
import { GpsInfoPanel } from './sidebar/GpsInfoPanel';
import { QuickAddPanel } from './sidebar/QuickAddPanel';
import { RouteControls } from '@/components/controls/RouteControls';
import { MapSettingsPanel } from '@/components/map/MapSettingsPanel';
import { StartSurveyForm } from '@/components/forms/StartSurveyForm';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDisplayRoute } from '@/hooks/useDisplayRoute';
import { useProcessRoute } from '@/hooks/useProcessRoute';

import { useUIStore } from '@/store/uiStore';
import { useSurveyStore } from '@/store/surveyStore';
import { useGpsStore } from '@/store/gpsStore';
import { useOrsStore } from '@/store/orsStore';
import type { ORSProfileType } from '@/lib/services/orsService';
import StatusMessages from '@/components/common/StatusMessages';
import { Skeleton } from './ui/skeleton';
import { PointTypeValue } from '@/types';
import { WakeLockControl } from '@/components/sidebar/WakeLockControl';

// --- THIS IS THE FIX ---
// Define the props that this component receives from app/page.tsx
interface SurveySidebarProps {
  onStartSurvey: (data: { name: string; description?: string }) => void;
  onPauseSurvey: () => void;
  onResumeSurvey: () => void;
  onStopSurvey: () => void;
  onClearSurvey: () => void;
  onQuickAdd: (pointType: PointTypeValue) => void;
}
// --- END OF FIX ---

export const SurveySidebar: React.FC<SurveySidebarProps> = React.memo(
  ({
    onStartSurvey,
    onPauseSurvey,
    onResumeSurvey,
    onStopSurvey,
    onClearSurvey,
    onQuickAdd,
  }) => {
    const [isMounted, setIsMounted] = useState(false);
    const isMobile = useIsMobile();

    const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
    const selectedRouteForView = useUIStore(
      (state) => state.selectedRouteForView
    );
    const setMobileSidebarOpen = useUIStore(
      (state) => state.setMobileSidebarOpen
    );
    const currentRoute = useSurveyStore((state) => state.currentRoute);
    const gpsError = useGpsStore((state) => state.gpsError);
    const orsEnabled = useOrsStore((state) => state.orsEnabled);
    const processingStatus = useOrsStore((state) => state.processingStatus);
    const routeStats = useOrsStore((state) => state.routeStats);
    const [showReprocessModal, setShowReprocessModal] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const isProcessingRoute = useMemo(
      () => processingStatus === 'processing',
      [processingStatus]
    );
    const { displayRoute } = useDisplayRoute();
    const processRouteMutation = useProcessRoute();

    const handleConfirmReprocess = useCallback(
      (newProfile: ORSProfileType) => {
        setShowReprocessModal(false);
        if (selectedRouteForView) {
          processRouteMutation.mutate({
            route: selectedRouteForView,
            profile: newProfile,
          });
        } else {
          toast.error('No route selected for reprocessing.');
        }
      },
      [selectedRouteForView, processRouteMutation]
    );

    const handleMobileClose = useCallback(
      () => setMobileSidebarOpen(false),
      [setMobileSidebarOpen]
    );
    const handleMobileSidebarClose = useCallback(
      () => setMobileSidebarOpen(false),
      [setMobileSidebarOpen]
    );

    const sidebarClass = useMemo(() => {
      if (isMobile) {
        return `fixed right-0 top-0 h-full w-4/5 max-w-sm z-50 shadow-xl transform transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`;
      }
      return `relative z-10 transition-transform duration-300 ${
        sidebarCollapsed ? 'hidden' : 'w-[380px]'
      }`;
    }, [isMobile, mobileSidebarOpen, sidebarCollapsed]);

    const handleShowReprocessModal = useCallback(
      () => setShowReprocessModal(true),
      []
    );
    const handleCloseReprocessModal = useCallback(
      () => setShowReprocessModal(false),
      []
    );

    if (!isMounted) {
      return (
        <aside className="bg-gray-50 dark:bg-gray-800 flex-col relative z-10 w-[380px] hidden lg:flex">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </aside>
      );
    }

    return (
      <>
        <aside
          className={`bg-gray-50 dark:bg-gray-800 flex flex-col ${sidebarClass}`}
        >
          <SidebarHeader
            isMobile={isMobile}
            onClose={isMobile ? handleMobileClose : undefined}
          />
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentRoute ? (
              <>
                {/* Pass the handlers down to RouteControls */}
                <RouteControls
                  onPause={onPauseSurvey}
                  onResume={onResumeSurvey}
                  onStop={onStopSurvey}
                  onClear={onClearSurvey}
                />
                <GpsInfoPanel />
                <QuickAddPanel onQuickAdd={onQuickAdd} />
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
                <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Start New Survey</Button>
                  </DialogTrigger>
                  <DialogContent>
                    {/* Pass the handler down to the form */}
                    <StartSurveyForm
                      onStartSurvey={onStartSurvey}
                      onFormSubmit={() => setShowStartModal(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {displayRoute && <RouteInfo displayRoute={displayRoute} />}
            <WakeLockControl />
            {selectedRouteForView &&
              selectedRouteForView.status === 'completed' && (
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
                  <Button
                    onClick={handleShowReprocessModal}
                    disabled={isProcessingRoute}
                    className="w-full"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${
                        isProcessingRoute ? 'animate-spin' : ''
                      }`}
                    />
                    {isProcessingRoute ? 'Reprocessing...' : 'Re-process Route'}
                  </Button>
                </div>
              )}
            {displayRoute && displayRoute.points.length > 0 && (
              <RecentPoints displayRoute={displayRoute} />
            )}
            {displayRoute && <PhotoGallery route={displayRoute} />}
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-600 p-4 space-y-4">
            <MapSettingsPanel />
            <StatusMessages gpsError={gpsError} orsEnabled={orsEnabled} />
          </div>
        </aside>
        <MobileOverlay
          isVisible={isMobile && mobileSidebarOpen}
          onClose={handleMobileSidebarClose}
        />
        <ReprocessRouteModal
          isOpen={showReprocessModal}
          onClose={handleCloseReprocessModal}
          route={selectedRouteForView ?? null}
          onConfirm={handleConfirmReprocess}
        />
      </>
    );
  }
);

SurveySidebar.displayName = 'SurveySidebar';

```

<!-- path: components/MapView.tsx -->
```typescript
// components/MapView.tsx
'use client';

import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';
import { Route, SurveyPoint } from '@/types';
import {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { DEFAULT_CENTER, MAP_ZOOM_LEVEL } from '@/constants';
import { useAuthPreferences } from '@/store/authStore';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

const tileLayers = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{y}/{x}',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

// Import the new MapControls component
import { MapControls } from './map/MapControls';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const MapClickHandler = dynamic(() => import('./map/MapClickHandler').then((mod) => mod.MapClickHandler), { ssr: false });
const SurveyPoints = dynamic(() => import('./map/SurveyPoints').then((mod) => mod.SurveyPoints), { ssr: false });
const CurrentLocationMarker = dynamic(() => import('./map/CurrentLocationMarker').then((mod) => mod.CurrentLocationMarker), { ssr: false });
const MapPolylines = dynamic(() => import('./map/MapPolylines'), { ssr: false });
const LocationUpdateIndicator = dynamic(() => import('./map/LocationUpdateIndicator').then((mod) => mod.LocationUpdateIndicator), { ssr: false });
const MapLegend = dynamic(() => import('./map/MapLegend').then((mod) => mod.MapLegend), { ssr: false });
const MobileDragHandler = dynamic(() => import('./map/MobileDragHandler').then((mod) => mod.MobileDragHandler), { ssr: false });

// The props interface is expanded to include everything the map needs
export interface MapViewProps {
  currentLocation: { lat: number; lng: number } | null;
  route: Route | null;
  onMapClick: (location: LatLngTuple) => void;
  onLocationRefresh?: () => void;
  isMobile?: boolean;
  allowLocationUpdate?: boolean;
  handleToggleLocationUpdate?: (newValue: boolean) => void;
  accuracy?: number | null;
  onEditPoint: (point: SurveyPoint) => void;
  onDeletePoint: (point: SurveyPoint) => void;
  sidebarCollapsed?: boolean; // Added for resize effect
}

export interface MapViewRef {
  invalidateSize: () => void;
  setView: (latlng: [number, number]) => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(
  (props, ref) => {
    const {
      currentLocation,
      route,
      onMapClick,
      onLocationRefresh,
      isMobile = false,
      allowLocationUpdate,
      handleToggleLocationUpdate,
      onEditPoint,
      onDeletePoint,
      sidebarCollapsed,
    } = props;

    const mapRef = useRef<L.Map>(null);
    const [initialCenter, setInitialCenter] = useState<LatLngTuple>(DEFAULT_CENTER);
    const { defaultMapType } = useAuthPreferences();

    useEffect(() => {
      if (currentLocation && initialCenter[0] === DEFAULT_CENTER[0] && initialCenter[1] === DEFAULT_CENTER[1]) {
        setInitialCenter([currentLocation.lat, currentLocation.lng]);
      }
    }, [currentLocation, initialCenter]);

    useImperativeHandle(ref, () => ({
      invalidateSize: () => mapRef.current?.invalidateSize(),
      setView: (latlng) => mapRef.current?.setView(latlng),
    }));

    // Logic moved from SurveyMap to handle sidebar resizing
    useEffect(() => {
      const handleMapResize = () => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            mapRef.current?.invalidateSize();
          }, 150); // Delay to allow for CSS transition
        });
      };
      handleMapResize();
    }, [sidebarCollapsed]);


    const handleMapReady = useCallback(() => {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }, []);

    const debouncedResize = useDebouncedCallback(() => mapRef.current?.invalidateSize(), 300);
    useEffect(() => {
      window.addEventListener('resize', debouncedResize);
      return () => window.removeEventListener('resize', debouncedResize);
    }, [debouncedResize]);

    const currentTileLayer = tileLayers[defaultMapType] || tileLayers.street;

    const displayProcessedPath = useMemo(() => route?.orsData?.processedPath?.map((loc) => [loc.lat, loc.lng] as LatLngTuple), [route]);
    const displayOriginalPath = useMemo(() => route?.path?.map((loc) => [loc.lat, loc.lng] as LatLngTuple), [route]);

    const livePath = useMemo(
      () =>
        route?.status === 'active' || route?.status === 'paused'
          ? route.path.map((loc) => [loc.lat, loc.lng] as LatLngTuple)
          : [],
      [route]
    );

    const historicalPath = useMemo(
      () =>
        route?.status === 'completed'
          ? route.path.map((loc) => [loc.lat, loc.lng] as LatLngTuple)
          : null,
      [route]
    );

    const processedPath = useMemo(
      () =>
        route?.orsData?.processedPath?.map((loc) => [loc.lat, loc.lng] as LatLngTuple) || null,
      [route]
    );

    return (
      <div className="relative w-full h-full">
        <MapContainer
          center={initialCenter}
          zoom={MAP_ZOOM_LEVEL}
          ref={mapRef}
          className="h-full w-full"
          whenReady={handleMapReady}
          zoomControl={!isMobile}
        >
          <TileLayer url={currentTileLayer.url} attribution={currentTileLayer.attribution} />
          {currentLocation && <CurrentLocationMarker location={currentLocation} />}
          <MapPolylines
            currentPath={livePath}
            originalRoute={historicalPath}
            processedRoute={processedPath}
          />
          {route?.points && (
            <SurveyPoints
              points={route.points as SurveyPoint[]}
              onEdit={onEditPoint}
              onDelete={onDeletePoint}
            />
          )}
          <MapClickHandler onMapClick={onMapClick} />
          {handleToggleLocationUpdate && (
            <MobileDragHandler
              setAllowLocationUpdate={handleToggleLocationUpdate}
              isLocationUpdateEnabled={!!allowLocationUpdate}
            />
          )}
        </MapContainer>

        <MapLegend isMobile={isMobile} />
        <LocationUpdateIndicator allowLocationUpdate={allowLocationUpdate} />
        {/* Render the new MapControls component here */}
        <MapControls
          onLocationRefresh={onLocationRefresh}
          isMobile={isMobile}
        />
      </div>
    );
  }
);
MapView.displayName = 'MapView';
export default MapView;
```

<!-- path: components/common/PageHeader.tsx -->
```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { KmlUploadButton } from '@/components/route-list/KmlUploadButton';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // For action buttons or other elements
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <KmlUploadButton />
        {children}
      </div>
    </div>
  );
};

```

<!-- path: components/common/GpsStatus.tsx -->
```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // We'll add this next
import { Navigation, WifiOff, AlertTriangle } from "lucide-react";
import { Location } from "@/types";

interface GpsStatusCardProps {
  location: Location | null;
  loading: boolean | undefined;
  accuracy: number | null;
  speed: number | null;
  error: string | null | undefined;
}

export const GpsStatusCard: React.FC<GpsStatusCardProps> = ({ location, loading, accuracy, speed, error }) => {
  const getStatus = () => {
    if (error) return { text: "Error", color: "destructive" as const, icon: <AlertTriangle className="h-4 w-4 text-destructive" /> };
    if (loading) return { text: "Searching...", color: "secondary" as const, icon: <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> };
    if (location) return { text: "Connected", color: "success" as const, icon: <Navigation className="h-4 w-4 text-green-500" /> };
    return { text: "No Signal", color: "secondary" as const, icon: <WifiOff className="h-4 w-4" /> };
  };

  const status = getStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">GPS Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.icon}
            <span className="font-medium">{status.text}</span>
          </div>
          <Badge variant={status.color === 'success' ? 'default' : status.color}>{status.color === 'destructive' ? 'Error' : 'Live'}</Badge>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Accuracy</p>
            <p className="font-semibold">{accuracy ? `${accuracy.toFixed(1)}m` : "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Speed</p>
            <p className="font-semibold">{speed !== null && speed > 0 ? `${(speed * 3.6).toFixed(1)} km/h` : "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

```

<!-- path: components/common/MapCenterUpdater.tsx -->
```typescript
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

interface MapCenterUpdaterProps {
  center: LatLngTuple;
}

const MapCenterUpdater: React.FC<MapCenterUpdaterProps> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

export default MapCenterUpdater;
```

<!-- path: components/common/StatusMessages.tsx -->
```typescript
import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';

interface StatusMessagesProps {
  gpsError: string | null;
  orsEnabled: boolean;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({ gpsError, orsEnabled }) => {
  return (
    <>
      {gpsError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">GPS Error:</span>
          </div>
          <p className="mt-1 text-sm">{gpsError}</p>
        </div>
      )}

      {!orsEnabled && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="font-medium">ORS Integration Available:</span>
          </div>
          <p className="mt-1 text-sm">
            Configure your OpenRouteService API key to enable route optimization and road snapping features.
          </p>
        </div>
      )}
    </>
  );
};

export default StatusMessages;

```

<!-- path: components/common/ErrorBoundary.tsx -->
```typescript
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

<!-- path: components/common/LoadingSpinner.tsx -->
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses: Record<
    NonNullable<LoadingSpinnerProps['size']>,
    string
  > = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`
        animate-spin rounded-full border-2
        border-gray-300 dark:border-gray-600
        border-t-blue-600 dark:border-t-blue-400
        ${sizeClasses[size]} ${className}
      `}
    />
  );
}

```

<!-- path: providers/QueryProviders.tsx -->
```typescript
'use client';

import AuthProvider from '@/components/auth/AuthProvider';
import { queryClient } from '@/lib/react-query-options';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

export function QueryProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// // In any component
// import { useAuth } from '@/hooks/useAuth';
// import { useAuthSync } from '@/hooks/useAuthSync';

// function MyComponent() {
//   const { user, isAuthenticated, isLoading } = useAuth();
//   useAuthSync(); // Sync auth state

//   if (isLoading) return <div>Loading...</div>;
//   if (!isAuthenticated) return <div>Please log in</div>;

//   return <div>Welcome {user?.name}!</div>;
// }

// // Protected route
// import AuthGuard from '@/components/auth/AuthGuard';

// export default function ProtectedPage() {
//   return (
//     <AuthGuard>
//       <div>This is protected content</div>
//     </AuthGuard>
//   );
// }

```

<!-- path: scripts/db-setup.ts -->
```typescript
#!/usr/bin/env tsx

import mongoose from 'mongoose';
import '../lib/models/User';
import '../lib/models/Account';
import '../lib/models/Session';
import '../lib/models/VerificationToken';
import '../lib/models/Route';

async function setupDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully!');

    // Create indexes
    console.log('Creating database indexes...');

    // User indexes
    await mongoose.model('User').collection.createIndex({ email: 1 }, { unique: true });

    // Account indexes
    await mongoose.model('Account').collection.createIndex(
      { provider: 1, providerAccountId: 1 },
      { unique: true }
    );
    await mongoose.model('Account').collection.createIndex({ userId: 1 });

    // Session indexes
    await mongoose.model('Session').collection.createIndex({ sessionToken: 1 }, { unique: true });
    await mongoose.model('Session').collection.createIndex({ userId: 1 });
    await mongoose.model('Session').collection.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });

    // VerificationToken indexes
    await mongoose.model('VerificationToken').collection.createIndex(
      { identifier: 1, token: 1 },
      { unique: true }
    );
    await mongoose.model('VerificationToken').collection.createIndex(
      { expires: 1 },
      { expireAfterSeconds: 0 }
    );

    // Route indexes
    await mongoose.model('Route').collection.createIndex({ userId: 1 });
    await mongoose.model('Route').collection.createIndex({ createdAt: -1 });

    console.log('Database setup completed successfully!');

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupDatabase();
```

<!-- path: hooks/useSurveyManagerContext.ts -->
```typescript
// hooks/useSurveyManagerContext.ts
'use client';

import { createContext, useContext } from 'react';
import { useSurveyManager } from './useSurveyManager';

// Create a type from the return value of the hook itself
type SurveyManagerContextType = ReturnType<typeof useSurveyManager>;

// Create the context with a default undefined value
const SurveyManagerContext = createContext<SurveyManagerContextType | undefined>(undefined);

// The provider component that will wrap our page
export const SurveyManagerProvider = SurveyManagerContext.Provider;

// The custom hook that components will use to access the context
export function useSurveyManagerContext() {
  const context = useContext(SurveyManagerContext);
  if (context === undefined) {
    throw new Error('useSurveyManagerContext must be used within a SurveyManagerProvider');
  }
  return context;
}
```

<!-- path: hooks/useAuthMutations.ts -->
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signIn, signOut } from 'next-auth/react';
import { useAuthActions, useAuthStore } from '@/store/authStore';
import { authKeys } from './useAuth';
import { invalidateAuthQueries } from '@/lib/react-query-auth-options';

interface SignInData {
  provider: string;
  callbackUrl?: string;
}

export interface UpdateProfileData {
  name?: string;
  image?: string;
  orsApiKey?: string;
}

// Sign in mutation
export function useSignIn() {
  const { setLastLoginTime, resetLoginAttempts } = useAuthActions();

  return useMutation({
    mutationFn: async ({ provider, callbackUrl = '/' }: SignInData) => {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      setLastLoginTime(new Date());
      resetLoginAttempts();
    },
    onError: () => {
      const { incrementLoginAttempts } = useAuthStore.getState();
      incrementLoginAttempts();
    },
  });
}

// Sign out mutation
export function useSignOut() {
  const queryClient = useQueryClient();
  const { clearAuthData } = useAuthStore();

  return useMutation({
    mutationFn: async (callbackUrl: string = '/login') => {
      await signOut({ callbackUrl: callbackUrl, redirect: false });
    },
    onSuccess: async () => {
      try {
        // Clear all auth-related queries
        await invalidateAuthQueries.all(queryClient);
        queryClient.clear();

        // Clear auth store data
        clearAuthData();
      } catch (error) {
        console.error('Error during sign out cleanup:', error);
      }
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update the profile query cache immediately for a better UX
      queryClient.setQueryData(authKeys.profile, data.user);

      // Invalidate related queries to ensure freshness
      invalidateAuthQueries.userProfile(queryClient);
    },
  });
}

// Delete account mutation
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { clearAuthData } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      return response.json();
    },
    onSuccess: () => {
      // Sign out and clear all data
      signOut({ callbackUrl: '/login', redirect: false });
      queryClient.clear();
      clearAuthData();
    },
  });
}

// Request email verification mutation
export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request email verification');
      }

      return response.json();
    },
  });
}

// Change email mutation
export function useChangeEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch('/api/auth/change-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change email');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user profile to refetch updated email
      invalidateAuthQueries.userProfile(queryClient);
    },
  });
}
```

<!-- path: hooks/useSurveyManager.ts -->
```typescript
// hooks/useSurveyManager.ts
'use client';

import { useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useGpsStore } from '@/store/gpsStore';
import { useSurveyStore } from '@/store/surveyStore';

/**
 * A "headless" hook that manages the geolocation side-effect and syncs its state
 * with the appropriate global Zustand stores. It acts as a controller.
 */
export function useSurveyManager() {
  // --- FIX 1: Use atomic selectors for state and actions ---
  // This prevents the hook from re-running unnecessarily when unrelated state changes.
  // Actions are stable and can be selected once.
  const setGpsStatus = useGpsStore((state) => state.setGpsStatus);
  const enableGeolocation = useGpsStore((state) => state.enableGeolocation);
  const updateCurrentPath = useSurveyStore((state) => state.updateCurrentPath);

  // State values that control the hook's logic.
  const isGeolocationEnabled = useGpsStore(
    (state) => state.isGeolocationEnabled
  );
  const isTracking = useSurveyStore((state) => state.isTracking);
  // --- END FIX 1 ---

  // 2. Initialize the useGeolocation hook. It's controlled by `isGeolocationEnabled` from our store.
  const {
    location,
    error,
    loading,
    accuracy,
    speed,
    permissionState,
    source,
    requestLocation, // This is the REAL function from useGeolocation
  } = useGeolocation({
    watch: isGeolocationEnabled, // Controlled by our Zustand state
    enableHighAccuracy: true,
  });

  // --- FIX 2: More robust permission handling ---
  // This effect now handles both granting and denying/prompting for permission.
  useEffect(() => {
    if (permissionState === 'granted') {
      enableGeolocation(true);
    } else if (permissionState === 'denied') {
      // If permission is denied, ensure watching is disabled and update the store.
      enableGeolocation(false);
      setGpsStatus({ gpsError: 'Location permission has been denied.' });
    }
  }, [permissionState, enableGeolocation, setGpsStatus]);
  // --- END FIX 2 ---

  // 4. Effect to sync geolocation state with the useGpsStore
  useEffect(() => {
    setGpsStatus({
      location,
      gpsError: error,
      gpsLoading: loading,
      accuracy,
      speed,
      permissionState,
      source,
    });
  }, [
    location,
    error,
    loading,
    accuracy,
    speed,
    permissionState,
    source,
    setGpsStatus,
  ]);

  // 5. Effect to update the active survey's path in useSurveyStore
  useEffect(() => {
    // Only update the path if we have a location AND a survey is actively tracking.
    if (location && isTracking) {
      updateCurrentPath(location);
    }
  }, [location, isTracking, updateCurrentPath]);

  // 6. Effect to hydrate the useGpsStore with the real requestLocation function.
  // This replaces the placeholder function in the store.
  useEffect(() => {
    useGpsStore.setState({ requestLocation });
  }, [requestLocation]);

  // This hook doesn't return anything. It's a "headless" controller.
}

```

<!-- path: hooks/useGeolocation.ts -->
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { Location } from '@/types';

const isClient = typeof window !== 'undefined' && typeof navigator !== 'undefined';

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  permissionState: PermissionState | null;
  source: 'network' | 'gps' | null; // Track location source
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  immediate?: boolean;
  progressiveEnhancement?: boolean; // Get quick fix first, then improve
  maxAccuracy?: number;
  minDistance?: number;
  updateInterval?: number;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true, // Default to true for better accuracy overall
    timeout = 10000,
    maximumAge = 60000,
    watch = true,
    immediate = true,
    progressiveEnhancement = true, // Keep this beneficial feature
    maxAccuracy = 1000,
    minDistance = 0,
    updateInterval = 500,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: isClient ? null : 'Geolocation is not available on the server',
    loading: immediate,
    accuracy: null,
    heading: null,
    speed: null,
    permissionState: null,
    source: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastLocationRef = useRef<Location | null>(null);
  const hasInitialFixRef = useRef<boolean>(false);
  // REFACTORED: Use a ref to ensure the switch to high accuracy only happens once.
  const switchedToHighAccuracyRef = useRef<boolean>(false);

  // No changes needed for calculateDistance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isGeolocationSupported = () => {
    if (!isClient || !navigator.geolocation) {
      return { supported: false, error: 'Geolocation is not supported by this browser' };
    }
    return { supported: true, error: null };
  };

  const checkPermissionStatus = async () => {
    if (!isClient || !navigator.permissions) return null;
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setState(prev => ({ ...prev, permissionState: permission.state }));
      permission.onchange = () => {
        setState(prev => ({ ...prev, permissionState: permission.state }));
      };
      return permission.state;
    } catch (err) {
      console.error('Error checking geolocation permission:', err);
      return null;
    }
  };

  const handleSuccess = useCallback((position: GeolocationPosition, isHighAccuracy = false) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    const now = Date.now();

    // For initial fix, be very lenient with accuracy
    if (!hasInitialFixRef.current && accuracy <= maxAccuracy) {
        hasInitialFixRef.current = true;
    }

    // Filter out inaccurate readings after getting the first fix.
    if (hasInitialFixRef.current && accuracy > maxAccuracy) {
      console.warn(`GPS accuracy too low: ${accuracy}m (max allowed: ${maxAccuracy}m)`);
      return;
    }

    // Throttle updates based on time interval
    if (now - lastUpdateRef.current < updateInterval) {
      return;
    }

    const newLocation = { lat: latitude, lng: longitude };

    // Check minimum distance only after initial fix
    if (lastLocationRef.current && minDistance > 0) {
      const distance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        latitude,
        longitude
      );
      if (distance < minDistance) {
        return;
      }
    }

    lastUpdateRef.current = now;
    lastLocationRef.current = newLocation;

    setState(prev => ({
      ...prev,
      location: newLocation,
      error: null,
      loading: false,
      accuracy,
      heading,
      speed,
      source: isHighAccuracy ? 'gps' : 'network',
    }));
  }, [maxAccuracy, minDistance, updateInterval]);

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Unknown geolocation error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please allow location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable. Check connection or GPS signal.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Retrying...';
        break;
    }
    setState(prev => ({ ...prev, error: errorMessage, loading: false }));
  };

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && isClient) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // REFACTORED: This is the core logic change.
  const requestLocation = useCallback(async () => {
    const { supported, error } = isGeolocationSupported();
    if (!supported) {
      setState(prev => ({ ...prev, error: error!, loading: false }));
      return;
    }

    await checkPermissionStatus();
    setState(prev => ({ ...prev, loading: true, error: null }));
    switchedToHighAccuracyRef.current = false;

    // Always clear previous watch to prevent duplicates
    stopWatching();

    if (watch) {
      if (progressiveEnhancement) {
        // --- NEW RELIABLE PROGRESSIVE ENHANCEMENT LOGIC ---
        const lowAccuracyOptions: PositionOptions = { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 };
        const highAccuracyOptions: PositionOptions = { enableHighAccuracy: true, timeout, maximumAge };

        const lowAccuracySuccess = (position: GeolocationPosition) => {
          handleSuccess(position, false);
          // Once we get the FIRST low-accuracy fix, we switch to high-accuracy.
          if (!switchedToHighAccuracyRef.current) {
            switchedToHighAccuracyRef.current = true;
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
            }
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => handleSuccess(pos, true),
              handleError,
              highAccuracyOptions
            );
          }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(lowAccuracySuccess, handleError, lowAccuracyOptions);
      } else {
        // Original single-strategy watch
        const positionOptions: PositionOptions = { enableHighAccuracy, timeout, maximumAge };
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => handleSuccess(pos, enableHighAccuracy),
          handleError,
          positionOptions
        );
      }
    } else {
      // Logic for single position request (getCurrentPosition)
      const positionOptions: PositionOptions = { enableHighAccuracy, timeout, maximumAge };
      navigator.geolocation.getCurrentPosition(
        (pos) => handleSuccess(pos, enableHighAccuracy),
        handleError,
        positionOptions
      );
    }
  }, [enableHighAccuracy, timeout, maximumAge, watch, handleSuccess, progressiveEnhancement, stopWatching]);

  const getCurrentPosition = useCallback(() => {
    const { supported, error } = isGeolocationSupported();
    if (!supported) {
      setState(prev => ({ ...prev, error: error!, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Use progressive enhancement for single position requests too
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSuccess(pos, false);
        // Then try to get better accuracy
        if (enableHighAccuracy) {
          navigator.geolocation.getCurrentPosition(
            (pos) => handleSuccess(pos, true),
            () => {}, // Ignore errors on second attempt
            { enableHighAccuracy: true, timeout: timeout / 2, maximumAge }
          );
        }
      },
      handleError,
      { enableHighAccuracy: false, timeout: 5000, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess]);

  useEffect(() => {
    if (immediate) {
      requestLocation();
    }

    // Cleanup on unmount
    return () => {
      stopWatching();
    };
  }, [immediate, requestLocation, stopWatching]);

  return {
    ...state,
    requestLocation,
    stopWatching,
    getCurrentPosition,
    isSupported: isGeolocationSupported().supported,
  };
};
```

<!-- path: hooks/useAuthSync.ts -->
```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAuthActions } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateAuthQueries } from '@/lib/react-query-auth-options';

/**
 * Hook to synchronize auth state between NextAuth session,
 * React Query cache, and Zustand store
 */
export function useAuthSync() {
  const { session, user, isAuthenticated } = useAuth();
  const {
    initializeAuth,
    setLastLoginTime,
    updateLastActivity,
    clearAuthData
  } = useAuthActions();
  const queryClient = useQueryClient();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync login state
  useEffect(() => {
    if (isAuthenticated && user) {
      setLastLoginTime(new Date());
      updateLastActivity();
    } else if (!isAuthenticated) {
      // Clear auth data when logged out
      clearAuthData();
      // Clear all auth queries
      invalidateAuthQueries.all(queryClient);
    }
  }, [isAuthenticated, user, setLastLoginTime, updateLastActivity, clearAuthData, queryClient]);

  // Sync user data changes
  useEffect(() => {
    if (user) {
      // Update React Query cache with latest user data
      queryClient.setQueryData(['auth', 'profile'], user);
    }
  }, [user, queryClient]);

  // Handle session changes
  useEffect(() => {
    if (session?.user) {
      // Session is available, ensure queries are fresh
      invalidateAuthQueries.userProfile(queryClient);
    }
  }, [session, queryClient]);

  // Activity tracking
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      updateLastActivity();
    };

    // Throttle activity updates (max once per minute)
    let lastUpdate = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // 1 minute
        handleActivity();
        lastUpdate = now;
      }
    };

    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler);
      });
    };
  }, [isAuthenticated, updateLastActivity]);

  return {
    isAuthenticated,
    user,
    session,
  };
}
```

<!-- path: hooks/useProcessRoute.ts -->
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrsStore } from '@/store/orsStore';
import { Route } from '@/types';
import {
  ORSDirectionsResponse,
  ORSProfileType,
} from '@/lib/services/orsService';
import { toast } from 'sonner';
import { processRouteWithORS } from '@/app/actions/ors';

interface ProcessRouteVariables {
  route: Route;
  profile: ORSProfileType;
}

export function useProcessRoute() {
  const queryClient = useQueryClient();
  // Get actions directly from the ORS store
  const { setProcessedRouteData, setProcessingStatus } = useOrsStore();

  return useMutation<ORSDirectionsResponse, Error, ProcessRouteVariables>({
    mutationFn: ({ route, profile }: ProcessRouteVariables) => {
      if (route.path.length < 2) {
        throw new Error('Route must have at least 2 points to process.');
      }
      return processRouteWithORS(route.path, profile);
    },
    onMutate: () => {
      setProcessingStatus('processing');
    },
    onSuccess: (data, variables) => {
      setProcessedRouteData(data, variables.route.path);
      setProcessingStatus('success');
      toast.success('Route optimized successfully!');
      queryClient.invalidateQueries({
        queryKey: ['routes', { id: variables.route._id }],
      });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (error) => {
      setProcessingStatus('error', error.message);
      toast.error(`Failed to process route: ${error.message}`);
    },
  });
}

```

<!-- path: hooks/useDebouncedCallback.ts -->
```typescript
// hooks/useDebouncedCallback.ts

'use client';

import { useRef, useEffect, useCallback } from 'react';

// A custom hook to debounce a callback function
export function useDebouncedCallback<A extends any[]>(
  callback: (...args: A) => void,
  delay: number
) {
  const callbackRef = useRef(callback);

  // --- THIS IS THE FIX ---
  // The ref can hold a NodeJS.Timeout object OR undefined.
  // We initialize it with no arguments, so its initial .current value is undefined.
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // --- END OF FIX ---

  // Update the callback reference if the callback function changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: A) => {
    // If a timeout is already scheduled, clear it
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule a new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}
```

<!-- path: hooks/useAuth.ts -->
```typescript
// hooks/useAuth.ts
'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { IUser } from '@/lib/models/User'; // IUser should already include orsApiKey

// Query keys for react-query
export const authKeys = {
  session: ['auth', 'session'] as const,
  user: (userId?: string) => ['auth', 'user', userId] as const,
  profile: ['auth', 'profile'] as const,
} as const;

// Fetch current user profile from API
async function fetchUserProfile(): Promise<IUser | null> {
  const response = await fetch('/api/profile');

  if (!response.ok) {
    if (response.status === 401) return null;
    throw new Error('Failed to fetch user profile');
  }

  const data = await response.json();
  // The user object from your API already contains orsApiKey
  return data.data?.user || null;
}

// Fetch user by ID from API
async function fetchUserById(userId: string): Promise<IUser | null> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch user');
  }
  const data = await response.json();
  return data.user;
}

// Main auth hook
export function useAuth() {
  const { data: session, status } = useSession();

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: authKeys.profile,
    queryFn: fetchUserProfile,
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const isLoading = status === 'loading' || (status === 'authenticated' && userLoading);
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  return {
    session,
    user, // This user object now contains the orsApiKey
    isLoading,
    isAuthenticated,
    userError,
    refetchUser,
    userId: session?.user?.id,
  };
}

// Hook to fetch any user by ID
export function useUser(userId?: string) {
  return useQuery({
    queryKey: authKeys.user(userId),
    queryFn: () => userId ? fetchUserById(userId) : null,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

<!-- path: hooks/useMediaQuery.ts -->
```typescript
import { useState, useEffect, useCallback } from 'react';

const isClient = typeof window !== 'undefined';

const queryCache = new Map<string, boolean>();

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (!isClient) return false;
    if (queryCache.has(query)) return queryCache.get(query)!;
    const mq = window.matchMedia(query);
    return mq.matches;
  });

  const updateMatches = useCallback((event: MediaQueryListEvent) => {
    const newMatches = event.matches;
    queryCache.set(query, newMatches);
    setMatches(newMatches);
  }, [query]);

  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia(query);

    // Initialize cache
    if (!queryCache.has(query)) {
      queryCache.set(query, mediaQuery.matches);
      setMatches(mediaQuery.matches);
    }

    // Add event listener for changes
    mediaQuery.addEventListener('change', updateMatches);

    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query, updateMatches]);

  return matches;
};

// Predefined breakpoint hooks
export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)');
};

export const useIsTablet = (): boolean => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery('(min-width: 1025px)');
};

export const useIsTouchDevice = (): boolean => {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
};
```

<!-- path: hooks/useAuthPreferences.ts -->
```typescript

```

<!-- path: hooks/useMapInteraction.ts -->
```typescript
// hooks/useMapInteraction.ts
import { useCallback, useState } from 'react';
import { LatLngTuple } from 'leaflet';
import { SurveyPoint, PointTypeValue } from '@/types';
import {
  useCurrentRoute,
  useAddSurveyPoint
} from '@/store/surveyStore';
import {
  useIsDragMode,
  useToggleDragMode
} from '@/store/uiStore';
import { toast } from 'sonner';

type PendingPoint = {
  location: { lat: number; lng: number };
  resolve: (pointType: PointTypeValue) => void;
  reject: () => void;
};

export function useMapInteraction() {
  const currentRoute = useCurrentRoute();
  const addSurveyPoint = useAddSurveyPoint();
  const isDragMode = useIsDragMode();
  const toggleDragMode = useToggleDragMode();

  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = useCallback(
    (clickLocation: LatLngTuple) => {
      if (!isDragMode && currentRoute) {
        // Just store the click location
        setPendingPoint({ lat: clickLocation[0], lng: clickLocation[1] });
      }
    },
    [isDragMode, currentRoute]
  );

  const handlePointTypeSelect = useCallback((pointType: PointTypeValue) => {
    if (pendingPoint) {
      const newPoint: Omit<SurveyPoint, 'routeId' | 'timestamp'> = {
        location: { lat: pendingPoint.lat, lng: pendingPoint.lng },
        notes: '',
        pointType,
      };
      addSurveyPoint(newPoint);
      toast.success(`Added ${pointType} point at ${pendingPoint.lat.toFixed(6)}, ${pendingPoint.lng.toFixed(6)}`);
      setPendingPoint(null);
    }
  }, [pendingPoint, addSurveyPoint]);

  const handleCloseModal = useCallback(() => {
    setPendingPoint(null);
  }, []);

  return {
    isDragMode,
    handleToggleDragMode: toggleDragMode,
    handleMapClick,
    showPointTypeModal: !!pendingPoint,
    pendingPoint,
    handlePointTypeSelect,
    handleCloseModal,
  };
}
```

<!-- path: hooks/useWakeLock.ts -->
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean = false) {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (enabled && 'wakeLock' in navigator) {
        try {
          wakeLockSentinel.current = await navigator.wakeLock.request('screen');
          setIsLocked(true);
          console.log('Screen Wake Lock is active.');

          // Re-acquire the lock if it's released by the browser (e.g., tab visibility change)
          wakeLockSentinel.current.addEventListener('release', () => {
            console.log('Screen Wake Lock was released.');
            setIsLocked(false);
          });
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
          setIsLocked(false);
        }
      }
    };

    requestWakeLock();

    // This function is called when the component unmounts or the `enabled` prop changes.
    return () => {
      if (wakeLockSentinel.current) {
        wakeLockSentinel.current.release()
          .then(() => {
            wakeLockSentinel.current = null;
            setIsLocked(false);
            console.log('Screen Wake Lock released.');
          });
      }
    };
  }, [enabled]);

  // Handle visibility changes to re-acquire the lock if necessary
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLockSentinel.current !== null && document.visibilityState === 'visible') {
        if (enabled) {
          navigator.wakeLock.request('screen').then(lock => {
            wakeLockSentinel.current = lock;
            setIsLocked(true);
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);

  return { isLocked };
}
```

<!-- path: hooks/usePointInteractionManager.ts -->
```typescript
// hooks/usePointInteractionManager.ts
'use client';

import { useCallback, useState } from 'react';
import { LatLngTuple } from 'leaflet';
import { SurveyPoint, PointTypeValue, Location } from '@/types';
import { useSurveyStore } from '@/store/surveyStore';
import { toast } from 'sonner';

// --- THIS IS THE FIX ---
// The state shape is now consistent with the SurveyPoint type.
type PointModalState =
  | { location: Location; pointType?: PointTypeValue }
  | SurveyPoint;
// --- END OF FIX ---

export function usePointInteractionManager() {
  const { addSurveyPoint, updateSurveyPoint, deleteSurveyPoint } = useSurveyStore();
  const [pointModalState, setPointModalState] = useState<PointModalState | null>(null);
  const [pointToDelete, setPointToDelete] = useState<SurveyPoint | null>(null);

  // handleMapClick now uses the correct property name 'pointType'.
  const handleMapClick = useCallback((location: LatLngTuple, type?: PointTypeValue) => {
    setPointModalState({ location: { lat: location[0], lng: location[1] }, pointType: type });
  }, []);

  const handleEditPoint = useCallback((point: SurveyPoint) => {
    setPointModalState(point);
  }, []);

  const handleDeleteRequest = useCallback((point: SurveyPoint) => {
    setPointToDelete(point);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (pointToDelete?._id) {
      deleteSurveyPoint(pointToDelete._id);
      toast.success(`Point "${pointToDelete.notes || pointToDelete.pointType}" deleted.`);
    }
    setPointToDelete(null);
  }, [pointToDelete, deleteSurveyPoint]);

  const handleCancelDelete = useCallback(() => {
    setPointToDelete(null);
  }, []);

  const handleSavePoint = useCallback(
    (data: { pointType: PointTypeValue; notes: string; photos?: string[]; id?: string; }) => {
      const isEditing = pointModalState && '_id' in pointModalState;

      if (isEditing) {
        const pointToUpdate = pointModalState as SurveyPoint;
        updateSurveyPoint(pointToUpdate._id!, {
          notes: data.notes,
          pointType: data.pointType,
          photos: data.photos || [],
        });
        toast.success('Point updated successfully.');
      } else if (pointModalState && 'location' in pointModalState) {
        const newPoint: Omit<SurveyPoint, 'routeId' | 'timestamp'> = {
          location: pointModalState.location,
          notes: data.notes,
          pointType: data.pointType,
          photos: data.photos || [],
        };
        addSurveyPoint(newPoint);
        toast.success(`Added ${data.pointType.replace('_', ' ')} point.`);
      }
      setPointModalState(null);
    },
    [pointModalState, addSurveyPoint, updateSurveyPoint]
  );

  const handleCloseModal = useCallback(() => {
    setPointModalState(null);
  }, []);

  return {
    isPointModalOpen: !!pointModalState,
    pointToEditOrAdd: pointModalState,
    pointToDelete,
    handleMapClick,
    handleEditPoint,
    handleDeleteRequest,
    handleConfirmDelete,
    handleCancelDelete,
    handleSavePoint,
    handleCloseModal,
  };
}
```

<!-- path: hooks/useDisplayRoute.ts -->
```typescript
// hooks/useDisplayRoute.ts
'use client';

import { useMemo } from 'react';
// Import atomic selectors from stores
import { useCurrentRoute } from '@/store/surveyStore';
import { useSelectedRouteForView } from '@/store/uiStore';
import {
  useProcessedRoute,
  useOriginalRouteForProcessing,
  useRouteStats
} from '@/store/orsStore';

/**
 * A custom hook to determine the route that should be displayed in the UI.
 * It centralizes the logic for choosing between a route selected for viewing
 * and the active survey route. A selected route always takes precedence.
 *
 * @returns The route object to be displayed, augmented with any live ORS processing data.
 */
export function useDisplayRoute() {
  // Get state from stores using atomic selectors
  const currentRoute = useCurrentRoute();
  const selectedRouteForView = useSelectedRouteForView();
  const processedRoute = useProcessedRoute();
  const originalRouteForProcessing = useOriginalRouteForProcessing();
  const routeStats = useRouteStats();

  const displayRoute = useMemo(() => {
    // --- FIX: A route selected for viewing should always take precedence. ---

    // Case 1: A route is selected from the history list for viewing.
    if (selectedRouteForView) {
      return {
        ...selectedRouteForView,
        // If a re-process is active, show the live data, otherwise show stored data.
        orsData: processedRoute
          ? {
              processedPath: processedRoute,
              originalPath:
                originalRouteForProcessing || selectedRouteForView.path,
              routeStats: routeStats!,
              profile: '',
              processedAt: new Date(),
            }
          : selectedRouteForView.orsData,
      };
    }

    // Case 2: No route is selected, so fall back to the active survey route.
    if (currentRoute) {
      return {
        ...currentRoute,
        // Augment with live processing data from the ORS store if it exists
        orsData: processedRoute
          ? {
              processedPath: processedRoute,
              originalPath: originalRouteForProcessing || currentRoute.path,
              routeStats: routeStats!,
              profile: '',
              processedAt: new Date(),
            }
          : currentRoute.orsData,
      };
    }

    // Case 3: Nothing is active or selected.
    return null;
  }, [
    currentRoute,
    selectedRouteForView,
    processedRoute,
    originalRouteForProcessing,
    routeStats,
  ]);

  return { displayRoute };
}
```

<!-- path: auth.ts -->
```typescript
import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { authConfig } from "@/lib/auth-config";
import User, { IUser } from '@/lib/models/User';

import { getClientPromise } from "@/lib/mongodb";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // ✅ Use the dedicated connection for the adapter
  adapter: MongoDBAdapter(getClientPromise(), {
    databaseName: "route-survey" // Force the adapter to use the correct database
  }),

  session: {
    strategy: "database",
  },

  events: {
    createUser: async (message) => {
      // ✅ We need to connect to the DB with Mongoose here to set the status
      // because the user object is a Mongoose model.
      const { connectDB } = await import('@/lib/mongodb');
      await connectDB();
      await User.findByIdAndUpdate(message.user.id, { $set: { status: "pending" } });
      console.log(`✅ Set default status to 'pending' for new user: ${message.user.email}`);
    }
  },

  callbacks: {
    authorized: authConfig.callbacks?.authorized,
    async session({ session, user }) {
      if (user?.id && session?.user) {
        // ✅ We use Mongoose here to fetch app-specific user fields
        const { connectDB } = await import('@/lib/mongodb');
        await connectDB();
        const userFromDb = await User.findById(user.id).lean<IUser | null>();
        if (userFromDb) {
          session.user.id = userFromDb._id.toString();
          session.user.status = userFromDb.status;
        }
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
});

```

<!-- path: package.json -->
```json
{
  "name": "route-survey-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:push": "next dev --experimental-https",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "gitpush": "git add . && git commit -m \"$(date +'%Y-%m-%d %H:%M:%S')\" && git push"
  },
  "overrides": {
    "mongodb": "^6.19.0"
  },
  "dependencies": {
    "@auth/mongodb-adapter": "^3.10.0",
    "@hookform/resolvers": "^5.2.1",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@tanstack/react-query": "^5.85.9",
    "@tanstack/react-query-devtools": "^5.87.1",
    "@vercel/blob": "^1.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "idb": "^8.0.3",
    "immer": "^10.1.3",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.542.0",
    "mongodb": "^6.19.0",
    "mongoose": "^8.18.1",
    "next": "15.5.2",
    "next-auth": "^5.0.0-beta.29",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.62.0",
    "react-icons": "^5.5.0",
    "react-leaflet": "^5.0.0",
    "react-leaflet-markercluster": "^5.0.0-rc.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "uuid": "^11.1.0",
    "web-push": "^3.6.7",
    "zod": "^4.1.5",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@tanstack/eslint-plugin-query": "^5.83.1",
    "@testing-library/react": "^16.3.0",
    "@types/leaflet": "^1.9.20",
    "@types/node": "^20.19.12",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/react-leaflet-markercluster": "^3.0.4",
    "@types/uuid": "^10.0.0",
    "@types/web-push": "^3.6.4",
    "@vitejs/plugin-react": "^5.0.2",
    "@vitest/ui": "^3.2.4",
    "eslint": "^9",
    "eslint-config-next": "15.5.2",
    "jsdom": "^27.0.0",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.8",
    "typescript": "^5",
    "vitest": "^3.2.4"
  }
}

```

<!-- path: vitest.config.ts -->
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', // Optional setup file
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

<!-- path: test.json -->
```json
{
  "_id": { "$oid": "68c16fd236a09b356aea9afd" },
  "name": "Harinavi to mission",
  "description": "Harinavi to Mission Telephone Exchange",
  "points": [
    { "$oid": "68c16fd436a09b356aea9b07" },
    { "$oid": "68c16fd436a09b356aea9b08" },
    { "$oid": "68c16fd436a09b356aea9b09" },
    { "$oid": "68c16fd436a09b356aea9b0a" },
    { "$oid": "68c16fd436a09b356aea9b0b" },
    { "$oid": "68c16fd436a09b356aea9b0c" }
  ],
  "startTime": { "$date": { "$numberLong": "1757506530509" } },
  "endTime": { "$date": { "$numberLong": "1757507438958" } },
  "totalDuration": { "$numberInt": "908449" },
  "status": "completed",
  "path": [
    { "lat": { "$numberDouble": "22.4160121" }, "lng": { "$numberDouble": "88.4159323" } },
    { "lat": { "$numberDouble": "22.4160889" }, "lng": { "$numberDouble": "88.416028" } },
    { "lat": { "$numberDouble": "22.4160374" }, "lng": { "$numberDouble": "88.4159138" } },
    { "lat": { "$numberDouble": "22.4159861" }, "lng": { "$numberDouble": "88.4145345" } },
    { "lat": { "$numberDouble": "22.4159718" }, "lng": { "$numberDouble": "88.4144246" } },
    { "lat": { "$numberDouble": "22.4160578" }, "lng": { "$numberDouble": "88.4143245" } },
    { "lat": { "$numberDouble": "22.4161549" }, "lng": { "$numberDouble": "88.4142387" } },
    { "lat": { "$numberDouble": "22.4161311" }, "lng": { "$numberDouble": "88.4141096" } },
    { "lat": { "$numberDouble": "22.4159551" }, "lng": { "$numberDouble": "88.4140166" } },
    { "lat": { "$numberDouble": "22.416091" }, "lng": { "$numberDouble": "88.4136813" } },
    { "lat": { "$numberDouble": "22.4160957" }, "lng": { "$numberDouble": "88.4135056" } },
    { "lat": { "$numberDouble": "22.4160884" }, "lng": { "$numberDouble": "88.4132362" } },
    { "lat": { "$numberDouble": "22.4160199" }, "lng": { "$numberDouble": "88.4129803" } },
    { "lat": { "$numberDouble": "22.415969" }, "lng": { "$numberDouble": "88.4127361" } },
    { "lat": { "$numberDouble": "22.41929" }, "lng": { "$numberDouble": "88.4103399" } },
    { "lat": { "$numberDouble": "22.4194741" }, "lng": { "$numberDouble": "88.4103862" } },
    { "lat": { "$numberDouble": "22.4196656" }, "lng": { "$numberDouble": "88.4105293" } },
    { "lat": { "$numberDouble": "22.4197931" }, "lng": { "$numberDouble": "88.4106979" } },
    { "lat": { "$numberDouble": "22.4211637" }, "lng": { "$numberDouble": "88.4096013" } },
    { "lat": { "$numberDouble": "22.4211822" }, "lng": { "$numberDouble": "88.4095884" } },
    { "lat": { "$numberDouble": "22.4213254" }, "lng": { "$numberDouble": "88.4094386" } },
    { "lat": { "$numberDouble": "22.4214731" }, "lng": { "$numberDouble": "88.4092724" } },
    { "lat": { "$numberDouble": "22.4215818" }, "lng": { "$numberDouble": "88.4091566" } },
    { "lat": { "$numberDouble": "22.4217424" }, "lng": { "$numberDouble": "88.4089332" } },
    { "lat": { "$numberDouble": "22.4218114" }, "lng": { "$numberDouble": "88.4088121" } },
    { "lat": { "$numberDouble": "22.4309779" }, "lng": { "$numberDouble": "88.4036813" } },
    { "lat": { "$numberDouble": "22.430746" }, "lng": { "$numberDouble": "88.4038383" } },
    { "lat": { "$numberDouble": "22.4307824" }, "lng": { "$numberDouble": "88.4038361" } },
    { "lat": { "$numberDouble": "22.4307903" }, "lng": { "$numberDouble": "88.4036833" } }
  ],
  "metadata": { "hasORSData": false },
  "createdAt": { "$date": { "$numberLong": "1757506530509" } },
  "updatedAt": { "$date": { "$numberLong": "1757507541248" } },
  "__v": { "$numberInt": "1" }
}

```

<!-- path: next.config.ts -->
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              [
                "connect-src 'self'",
                'https://api.openrouteservice.org',
                'https://*.tile.openstreetmap.org',
                'https://server.arcgisonline.com',
                'https://*.tile.opentopomap.org',
                'https://github.com',
                'https://api.github.com',
                'https://accounts.google.com',
                'https://oauth2.googleapis.com',
                'https://www.googleapis.com',
              ].join(' '),
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline'",
              [
                "img-src 'self' data: https: blob:",
                'https://*.tile.openstreetmap.org',
                'https://server.arcgisonline.com',
                'https://*.tile.opentopomap.org',
              ].join(' '),
              "font-src 'self' data:",
              "frame-src 'self' https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
    domains: [
      'images.unsplash.com',
      'vercel.com',
      'lh3.googleusercontent.com',
      'cdn-vercel.com',
      'vercel.app',
    ],
  },
};

export default nextConfig;

```

<!-- path: eslint.config.mjs -->
```mjs
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      "react/no-unescaped-entities": "warn"
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;

```

<!-- path: next-env.d.ts -->
```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

<!-- path: vitest.setup.ts -->
```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});
```

<!-- path: components.json -->
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}

```

<!-- path: utils/saltAndHashPassword.ts -->
```typescript
// Web Crypto API implementation (Edge Runtime compatible)

// Type guard to validate credentials
export function isValidCredentials(
    credentials: Partial<Record<string, unknown>>
  ): credentials is { email: string; password: string } {
    return (
      credentials &&
      typeof credentials.email === 'string' &&
      typeof credentials.password === 'string' &&
      credentials.email.length > 0 &&
      credentials.password.length > 0
    );
  }

  export async function saltAndHashPassword(password: string): Promise<string> {
    // Generate a random salt (16 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Convert password to Uint8Array
    const passwordBuffer = new TextEncoder().encode(password);

    // Import password as cryptographic key
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-512'
      },
      passwordKey,
      512 // 64 bytes * 8 bits
    );

    // Convert to hex strings
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${saltHex}:${hashHex}`;
  }

  export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
    const [saltHex, originalHashHex] = storedPassword.split(':');

    // Convert hex salt back to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    // Convert password to Uint8Array
    const passwordBuffer = new TextEncoder().encode(password);

    // Import password as cryptographic key
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key using same parameters
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-512'
      },
      passwordKey,
      512
    );

    // Convert to hex string
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === originalHashHex;
  }

  // Utility function for generating secure random strings (useful for tokens, etc.)
  export function generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }
```

<!-- path: utils/getStatusColor.ts -->
```typescript
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
};
```

<!-- path: utils/apiResponse.ts -->
```typescript
import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error,
  } as ApiResponse, { status });
}

export function validationErrorResponse(message: string) {
  return errorResponse(message, 422);
}

export function notFoundResponse(message: string = 'Resource not found') {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function internalServerErrorResponse(message: string = 'Internal server error') {
  return errorResponse(message, 500);
}
```

<!-- path: utils/routeCalculations.ts -->
```typescript
import { Location } from '@/types';

// calculateDistance function (part of calculateRouteStats)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// calculateRouteStats function
export const calculateRouteStats = (path: Location[]) => {
  if (path.length < 2) return { distance: 0, points: path.length };

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += calculateDistance(
      path[i-1].lat, path[i-1].lng,
      path[i].lat, path[i].lng
    );
  }

  return {
    distance: totalDistance,
    points: path.length
  };
};

/**
 * Simplifies a GPS path to a maximum number of points using distance-based sampling.
 * @param path The original array of Location points.
 * @param maxPoints The maximum number of points in the returned path.
 * @returns A new, simplified array of Location points.
 */
export const simplifyPath = (path: Location[], maxPoints: number): Location[] => {
  // If the path is already within the limit, return it as is.
  if (path.length <= maxPoints) {
    return path;
  }

  const simplifiedPath: Location[] = [path[0]]; // Always include the start point.
  const totalDistance = calculateRouteStats(path).distance;
  const interval = totalDistance / (maxPoints - 1); // Desired distance between points.

  let distanceSinceLastPoint = 0;

  for (let i = 1; i < path.length - 1; i++) {
    distanceSinceLastPoint += calculateDistance(path[i-1].lat, path[i-1].lng, path[i].lat, path[i].lng);

    if (distanceSinceLastPoint >= interval) {
      simplifiedPath.push(path[i]);
      distanceSinceLastPoint = 0; // Reset the distance counter
    }
  }

  simplifiedPath.push(path[path.length - 1]); // Always include the end point.
  return simplifiedPath;
};
```

<!-- path: utils/routeCalculations.test.ts -->
```typescript
import { describe, it, expect } from 'vitest';
import { calculateRouteStats, simplifyPath } from './routeCalculations';
import { Location } from '@/types';

describe('calculateRouteStats', () => {
  it('should return 0 distance for an empty path', () => {
    const path: Location[] = [];
    const stats = calculateRouteStats(path);
    expect(stats.distance).toBe(0);
    expect(stats.points).toBe(0);
  });

  it('should return 0 distance for a path with a single point', () => {
    const path: Location[] = [{ lat: 50.1, lng: 8.2 }];
    const stats = calculateRouteStats(path);
    expect(stats.distance).toBe(0);
    expect(stats.points).toBe(1);
  });

  it('should calculate the distance correctly for a simple path', () => {
    // A path from Cologne to Dusseldorf, which is roughly 34km
    const path: Location[] = [
      { lat: 50.9375, lng: 6.9603 }, // Cologne
      { lat: 51.2277, lng: 6.7735 }, // Dusseldorf
    ];
    const stats = calculateRouteStats(path);
    // We expect the distance to be around 34,000 meters.
    // We use toBeGreaterThan and toBeLessThan for a safe range.
    expect(stats.distance).toBeGreaterThan(33000);
    expect(stats.distance).toBeLessThan(35000);
    expect(stats.points).toBe(2);
  });
});

describe('simplifyPath', () => {
  const longPath: Location[] = Array.from({ length: 100 }, (_, i) => ({
    lat: 50 + i * 0.01,
    lng: 8 + i * 0.01,
  }));

  it('should not change a path that is already within the limit', () => {
    const simplified = simplifyPath(longPath, 150);
    expect(simplified.length).toBe(100);
  });

  it('should simplify a path to the specified maximum number of points', () => {
    const simplified = simplifyPath(longPath, 25);
    // The algorithm is approximate, so we check if it's close to the max
    expect(simplified.length).toBeLessThanOrEqual(25);
  });

  it('should always include the first and last points of the original path', () => {
    const simplified = simplifyPath(longPath, 10);
    expect(simplified[0]).toEqual(longPath[0]);
    expect(simplified[simplified.length - 1]).toEqual(longPath[99]);
  });
});
```

<!-- path: utils/formatDuration.ts -->
```typescript
export const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };
```

<!-- path: utils/errorHandler.ts -->
```typescript
import { ZodError } from 'zod';
import { errorResponse, internalServerErrorResponse, validationErrorResponse } from './apiResponse';

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    const errorMessage = error.issues
      .map((err) => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      })
      .join(', ');
    return validationErrorResponse(errorMessage);
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return validationErrorResponse(error.message);
    }

    if (error.name === 'CastError') {
      return validationErrorResponse('Invalid ID format');
    }

    if (error.message.includes('duplicate key')) {
      return validationErrorResponse('Resource already exists');
    }

    return errorResponse(error.message);
  }

  return internalServerErrorResponse();
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createError(message: string, statusCode: number = 400) {
  return new AppError(message, statusCode);
}
```

<!-- path: tsconfig.json -->
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

<!-- path: postcss.config.mjs -->
```mjs
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;

```

<!-- path: lib/mongodb.ts -->
```typescript
import mongoose, { Mongoose } from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DATABASE_NAME = 'route-survey';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Augment the global object to hold our cache.
// Using `var` is necessary for global declaration merging.
declare global {
  var mongooseCache: {
    promise: Promise<Mongoose> | null;
    conn: Mongoose | null;
    clientPromise: Promise<MongoClient> | null;
  };
}

// Initialize the cache on the global object if it doesn't exist.
// This is the core of the singleton pattern for Next.js hot-reloading.
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null, clientPromise: null };
}

/**
 * The main connection function for Mongoose used by your app's business logic.
 * It ensures that we only have one active connection promise at a time.
 */
export async function connectDB(): Promise<Mongoose> {
  // If we have a cached connection, return it.
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  // If we don't have a promise to connect, create one.
  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      dbName: DATABASE_NAME, // ✅ Explicitly set database name
    };
    console.log("Creating new Mongoose connection promise.");
    console.log("Connecting to database:", DATABASE_NAME);
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("✅ Mongoose connection established.");
      return mongooseInstance;
    });
  }

  // Await the connection promise and cache the connection object.
  global.mongooseCache.conn = await global.mongooseCache.promise;
  return global.mongooseCache.conn;
}


/**
 * A connection function specifically for the NextAuth adapter.
 * It returns a promise that resolves to the raw MongoClient.
 */
export async function getClientPromise(): Promise<MongoClient> {
  if (global.mongooseCache.clientPromise) {
    return global.mongooseCache.clientPromise;
  }

  // ✅ Create a separate MongoClient connection for NextAuth with explicit database
  const client = new MongoClient(MONGODB_URI, {
    // Add any MongoDB client options here if needed
  });

  global.mongooseCache.clientPromise = client.connect().then((connectedClient) => {
    console.log("✅ Auth DB client connected to database:", DATABASE_NAME);
    return connectedClient;
  });

  console.log("✅ Auth DB client promise created.");
  return global.mongooseCache.clientPromise;
}

// Default export for app logic
export default connectDB;

```

<!-- path: lib/utils.ts -->
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

<!-- path: lib/serviceWorker.ts -->
```typescript
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((error: string) => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}

```

<!-- path: lib/react-query-options.ts -->
```typescript
import { QueryClient } from "@tanstack/react-query";

// Create a client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Globally set staleTime for most queries
      // This means data is considered fresh for 5 minutes.
      // After 5 minutes, it will be refetched in the background on next access.
      staleTime: 1000 * 60 * 5, // 5 minutes

      // ✅ Control how often data is refetched automatically
      // Don't refetch on window focus by default, as it can be aggressive.
      // Consider enabling for specific, highly dynamic data if needed.
      refetchOnWindowFocus: false,

      // ✅ Don't refetch when the network reconnects by default.
      // Similar to refetchOnWindowFocus, this can be aggressive.
      // Enable for critical, real-time data if required.
      refetchOnReconnect: false,

      // ✅ Refetching on mount is usually desired for initial data freshness.
      // This ensures that when a component mounts, it gets the latest data.
      refetchOnMount: true,

      // ✅ Number of times to retry a failed query.
      // A common practice is 3 retries, giving the server some chances.
      retry: 3,

      // ✅ How long to wait between retries. Exponential backoff is good.
      // A function can be used for more sophisticated retry delays.
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s

      // ✅ Keep data in cache for a certain amount of time even if no components are using it.
      // After this time, unused data will be garbage collected.
      // This helps with quick re-mounts or navigation.
      gcTime: 1000 * 60 * 60, // 1 hour

      // ✅ Control caching behavior for queries that return an error.
      // By default, a query that errors will be garbage collected immediately
      // unless gcTime is also specified. Setting it to 0 means don't cache errors.
      // You might want to keep it undefined or set it to gcTime if you want to retry the error.
      // For most cases, you probably want to retry on errors rather than cache them.
      // Setting gcTime on queries is generally preferred over error-specific gcTime.
      // If a query *fails after all retries*, it's considered an error.
      // error: {
      //   gcTime: 0, // Don't cache errored queries by default
      // },
    },
    mutations: {
      // ✅ Global settings for mutations.
      // You might want to add default error handling or retry logic here.
      // For example, an `onSuccess` or `onError` to show global notifications.
      onError: (error) => {
        console.error("Mutation failed:", error);
        // toast.error("Something went wrong!");
      },
      retry: 1, // Maybe retry a mutation once if it fails due to transient network issues
    },
  },
});
```

<!-- path: lib/react-query.ts -->
```typescript
// lib/react-query.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Route, SurveyPoint, Location } from "@/types";
import { toast } from "sonner";

// Define the shape of the data for the new mutation
interface UpdateRouteDetailsPayload {
  id: string;
  details: {
    name?: string;
    description?: string;
  };
}

interface UpdateRouteDataPayload {
  id: string;
  data: {
    status?: Route['status'];
    path?: Location[];
    points?: SurveyPoint[];
    endTime?: Date;
    totalDuration?: number;
  };
}

// API functions
const api = {
  // Routes
  getRoutes: async (): Promise<Route[]> => {
    const response = await fetch("/api/routes");
    if (!response.ok) throw new Error("Failed to fetch routes");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  getRoute: async (id: string): Promise<Route> => {
    const response = await fetch(`/api/routes/${id}`);
    if (!response.ok) throw new Error("Failed to fetch route");
    return response.json();
  },

  saveRoute: async (route: Partial<Route>): Promise<Route> => {
    const response = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(route),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save route");
    }
    return response.json();
  },

  updateRouteData: async (payload: UpdateRouteDataPayload): Promise<Route> => {
    console.log("Updating route data with payload:", payload);

    const { id, data } = payload;
    const response = await fetch(`/api/routes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update route data");
    }
    return response.json();
  },

  updateRoute: async ({ id, route }: { id: string; route: Partial<Route> }): Promise<Route> => {
    const response = await fetch(`/api/routes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(route),
    });
    if (!response.ok) throw new Error("Failed to update route");
    return response.json();
  },

  updateRouteDetails: async (payload: UpdateRouteDetailsPayload): Promise<Route> => {
    console.log("Updating route details with payload:", payload);

    const { id, details } = payload;
    const response = await fetch(`/api/routes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update route details");
    }
    return response.json();
  },

  deleteRoute: async (id: string): Promise<void> => {
    const response = await fetch(`/api/routes/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete route");
  },

  // Points
  getPoints: async (routeId: string): Promise<SurveyPoint[]> => {
    const response = await fetch(`/api/points?routeId=${routeId}`);
    if (!response.ok) throw new Error("Failed to fetch points");
    return response.json();
  },

  createPoint: async (point: Partial<SurveyPoint>): Promise<SurveyPoint> => {
    const response = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(point),
    });
    if (!response.ok) throw new Error("Failed to create point");
    return response.json();
  },
};

// Custom Hooks
export const useRoutes = () => useQuery({ queryKey: ["routes"], queryFn: api.getRoutes });

export const useRoute = (id: string) => {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => api.getRoute(id),
    enabled: !!id,
  });
};

export const useSaveRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saveRoute,
    onSuccess: (savedRoute) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      // Immediately add the new route to the cache for a snappy UI update
      queryClient.setQueryData(['routes', savedRoute._id], savedRoute);
    },
  });
};

export const useUpdateRouteData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateRouteData,
    onSuccess: (updatedRoute) => {
      // Invalidate the list to refetch in the background
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      // Immediately update the specific route in the cache
      queryClient.setQueryData(['routes', updatedRoute._id], updatedRoute);
    },
    onError: (error) => {
      console.error("Failed to update route data:", error);
      toast.error("Failed to sync route update.");
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateRoute,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes", variables.id] });
    },
  });
};

export const useUpdateRouteDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateRouteDetails,
    onSuccess: (updatedRoute) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.setQueryData(["routes", updatedRoute._id], updatedRoute);
    },
    onError: (error) => {
      console.error("Failed to update route details:", error);
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};

export const usePoints = (routeId: string) => {
  return useQuery({
    queryKey: ["points", routeId],
    queryFn: () => api.getPoints(routeId),
    enabled: !!routeId,
  });
};

export const useCreatePoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPoint,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["points", data.routeId] });
      queryClient.invalidateQueries({ queryKey: ["routes", data.routeId] });
    },
  });
};
```

<!-- path: lib/services/orsService.ts -->
```typescript
// lib/services/orsService.ts
import { Location } from "@/types";

export interface ORSProfile {
  "driving-car": "driving-car";
  "driving-hgv": "driving-hgv";
  "cycling-regular": "cycling-regular";
  "cycling-road": "cycling-road";
  "cycling-mountain": "cycling-mountain";
  "cycling-electric": "cycling-electric";
  "foot-walking": "foot-walking";
  "foot-hiking": "foot-hiking";
  wheelchair: "wheelchair";
}

// ✅ ADD NEW INTERFACES specifically for the Snap API
export interface ORSSnapOptions {
  coordinates: [number, number][];
  profile: ORSProfileType;
  radius?: number;
}

export interface ORSSnapResponse {
  locations: Array<{ // <-- CORRECTED PROPERTY NAME
    location: [number, number]; // [lng, lat]
    distance: number;
    name: string;
  }> | null;
}

export interface ORSStandardizedResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number][]; // [lng, lat]
    };
    properties: {
      summary: {
        distance: number; // meters
        duration: number; // seconds
      };
    };
  }>;
}

export type ORSProfileType = keyof ORSProfile;

export interface ORSDirectionsOptions {
  profile: ORSProfileType;
  coordinates: [number, number][]; // [lng, lat] format for ORS
  format?: "json" | "geojson";
  alternative_routes?: {
    target_count?: number;
    weight_factor?: number;
  };
  continue_straight?: boolean;
  avoid_borders?: "all" | "controlled" | "none";
  avoid_countries?: string[];
  avoid_features?: ("highways" | "tollways" | "ferries" | "fords" | "steps")[];
  avoid_polygons?: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
}

export interface ORSDirectionsResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: [number, number][]; // [lng, lat]
    };
    properties: {
      segments: Array<{
        distance: number;
        duration: number;
        steps: Array<{
          distance: number;
          duration: number;
          type: number;
          instruction: string;
          name: string;
          way_points: [number, number];
        }>;
      }>;
      summary: {
        distance: number; // meters
        duration: number; // seconds
      };
      way_points: [number, number][];
    };
  }>;
  bbox: [number, number, number, number];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: [number, number][];
      profile: string;
      format: string;
    };
    engine: {
      version: string;
      build_date: string;
      graph_date: string;
    };
  };
}

export interface ORSMapMatchingOptions {
  coordinates: [number, number][]; // [lng, lat] format
  profile: ORSProfileType;
  format?: "json" | "geojson";
  radiuses?: number[]; // Search radius for each coordinate
  timestamps?: number[]; // Unix timestamps for each coordinate
}

export interface ORSMapMatchingResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: [number, number][];
    };
    properties: {
      matched_points: Array<{
        distance_along_geometry: number;
        waypoint_index: number;
        location: [number, number];
        distance_from_trace: number;
      }>;
      summary: {
        distance: number;
        duration: number;
        confidence: number;
      };
    };
  }>;
}

export interface ORSError {
  error: {
    code: number;
    message: string;
  };
}

class ORSService {
  private apiKey: string;
  private baseUrl: string = "https://api.openrouteservice.org";
  private rateLimitDelay: number = 1500; // 1.5 seconds between requests (40 requests/min)
  private lastRequestTime: number = 0;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("ORS API key is required. Get one from https://openrouteservice.org/");
    }
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Rate limiting - ensure we don't exceed 40 requests per minute
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`ORS API Error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Get directions between multiple points
   */
  async getDirections(options: ORSDirectionsOptions): Promise<ORSDirectionsResponse> {
    if (options.coordinates.length < 2) {
      throw new Error("At least 2 coordinates are required for directions");
    }

    if (options.coordinates.length > 50) {
      throw new Error("Maximum 50 waypoints allowed for directions");
    }

    const body = {
      coordinates: options.coordinates,
      format: options.format || "geojson",
      alternative_routes: options.alternative_routes,
      continue_straight: options.continue_straight,
      avoid_borders: options.avoid_borders,
      avoid_countries: options.avoid_countries,
      avoid_features: options.avoid_features,
      avoid_polygons: options.avoid_polygons,
    };

    // Remove undefined properties
    const cleanBody = Object.fromEntries(Object.entries(body).filter(([_, value]) => value !== undefined));

    return this.makeRequest<ORSDirectionsResponse>(`/v2/directions/${options.profile}/geojson`, {
      method: "POST",
      body: JSON.stringify(cleanBody),
    });
  }

  /**
   * Snaps a list of points to the nearest road using the Snap V2 service.
   * This is the correct method for your plan.
   */
  async snapPointsToRoad(options: ORSSnapOptions): Promise<ORSSnapResponse> {
    console.log(`Server-side ORSService.snapPointsToRoad called with profile: ${options.profile}`);

    // ✅ Construct the body with the 'locations' parameter.
    const body: { locations: [number, number][]; radius?: number } = {
      locations: options.coordinates,
    };

    // ✅ If a radius is provided, add it to the body.
    if (options.radius) {
      body.radius = options.radius;
    }

    // ✅ The URL is constructed with the profile and the required '/json' suffix.
    return this.makeRequest<ORSSnapResponse>(
      `/v2/snap/${options.profile}/json`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }



  /**
   * Map matching - snap GPS points to road network
   * This is perfect for route surveys as it corrects GPS inaccuracies
   */
  async mapMatching(options: ORSMapMatchingOptions): Promise<ORSMapMatchingResponse> {
    console.log("ORS mapMatching called with profile:", options.profile);

    if (options.coordinates.length < 2) {
      throw new Error("At least 2 coordinates are required for map matching");
    }

    const body = {
      coordinates: options.coordinates,
      format: options.format || "geojson",
      radiuses: options.radiuses,
      timestamps: options.timestamps,
    };

    // Remove undefined properties
    const cleanBody = Object.fromEntries(Object.entries(body).filter(([_, value]) => value !== undefined));

    try {
      const response = await this.makeRequest<ORSMapMatchingResponse>(`/v2/match/${options.profile}`, {
        method: "POST",
        body: JSON.stringify(cleanBody),
      });

      console.log("ORS mapMatching successful, received", response?.features?.[0]?.geometry?.coordinates?.length || 0, "matched points");

      return response;
    } catch (error) {
      console.error("ORS mapMatching failed:", error);
      throw error;
    }
  }

  /**
   * Batch process GPS points into optimized route segments
   * This splits large routes into smaller chunks to respect API limits
   */
  async processRouteInBatches(
    gpsPoints: Location[],
    profile: ORSProfileType = "cycling-regular",
    batchSize: number = 25
  ): Promise<{
    matchedRoute: Location[];
    originalRoute: Location[];
    segments: Array<{
      start: number;
      end: number;
      distance: number;
      duration: number;
    }>;
    totalDistance: number;
    totalDuration: number;
  }> {
    if (gpsPoints.length < 2) {
      throw new Error("At least 2 GPS points are required");
    }

    const segments: Array<{
      start: number;
      end: number;
      distance: number;
      duration: number;
    }> = [];
    let allMatchedCoordinates: Location[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // Process in batches to respect API limits
    for (let i = 0; i < gpsPoints.length - 1; i += batchSize - 1) {
      const endIndex = Math.min(i + batchSize - 1, gpsPoints.length - 1);
      const batchPoints = gpsPoints.slice(i, endIndex + 1);

      if (batchPoints.length < 2) continue;

      try {
        // Convert Location[] to [lng, lat][] format required by ORS
        const coordinates: [number, number][] = batchPoints.map((point) => [point.lng, point.lat]);

        const result = await this.mapMatching({
          coordinates,
          profile,
          format: "geojson",
        });

        if (result.features.length > 0) {
          const feature = result.features[0];
          const matchedCoords = feature.geometry.coordinates.map((coord) => ({
            lat: coord[1],
            lng: coord[0],
          }));

          // Avoid duplicating the connection point between batches
          if (i > 0 && allMatchedCoordinates.length > 0) {
            matchedCoords.shift(); // Remove first point to avoid duplication
          }

          allMatchedCoordinates = allMatchedCoordinates.concat(matchedCoords);

          const segmentDistance = feature.properties.summary.distance;
          const segmentDuration = feature.properties.summary.duration;

          segments.push({
            start: i,
            end: endIndex,
            distance: segmentDistance,
            duration: segmentDuration,
          });

          totalDistance += segmentDistance;
          totalDuration += segmentDuration;
        }
      } catch (error) {
        console.error(`Batch ${i}-${endIndex} failed:`, error);
        // Fallback: use original GPS points for this batch
        const fallbackCoords = batchPoints.slice(i > 0 ? 1 : 0); // Avoid duplication
        allMatchedCoordinates = allMatchedCoordinates.concat(fallbackCoords);
      }
    }

    return {
      matchedRoute: allMatchedCoordinates,
      originalRoute: gpsPoints,
      segments,
      totalDistance,
      totalDuration,
    };
  }

  /**
   * Get optimized route between start and end points
   * Useful for planning surveys or comparing actual vs optimal routes
   */
  async getOptimalRoute(
    start: Location,
    end: Location,
    profile: ORSProfileType = "cycling-regular"
  ): Promise<{
    route: Location[];
    distance: number;
    duration: number;
    instructions: string[];
  }> {
    const coordinates: [number, number][] = [
      [start.lng, start.lat],
      [end.lng, end.lat],
    ];

    const result = await this.getDirections({
      coordinates,
      profile,
      format: "geojson",
    });

    if (result.features.length === 0) {
      throw new Error("No route found between the specified points");
    }

    const feature = result.features[0];
    const route = feature.geometry.coordinates.map((coord) => ({
      lat: coord[1],
      lng: coord[0],
    }));

    const instructions = feature.properties.segments.flatMap((segment) => segment.steps.map((step) => step.instruction));

    return {
      route,
      distance: feature.properties.summary.distance,
      duration: feature.properties.summary.duration,
      instructions,
    };
  }

  /**
   * Utility: Convert GPS points to ORS coordinate format
   */
  static locationToORS(locations: Location[]): [number, number][] {
    return locations.map((loc) => [loc.lng, loc.lat]);
  }

  /**
   * Utility: Convert ORS coordinates back to Location format
   */
  static ORSToLocation(coordinates: [number, number][]): Location[] {
    return coordinates.map((coord) => ({ lat: coord[1], lng: coord[0] }));
  }

  /**
   * Utility: Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

export default ORSService;

```

<!-- path: lib/react-query-auth-options.ts -->
```typescript
// lib/react-query-auth-options.ts

import { QueryClient } from '@tanstack/react-query';

// Auth-related query options and configurations
export const authQueryOptions = {
  // Stale time for auth queries (how long data is considered fresh)
  staleTime: {
    session: 2 * 60 * 1000, // 2 minutes
    userProfile: 5 * 60 * 1000, // 5 minutes
    userList: 10 * 60 * 1000, // 10 minutes
  },

  // Cache time (how long unused data stays in cache)
  cacheTime: {
    session: 10 * 60 * 1000, // 10 minutes
    userProfile: 15 * 60 * 1000, // 15 minutes
    userList: 30 * 60 * 1000, // 30 minutes
  },

  // Retry configuration
  retry: {
    session: 1, // Retry once for session queries
    userProfile: 2, // Retry twice for user profile
    userList: 3, // Retry 3 times for user lists
  },
};

// Query invalidation utilities for auth-related queries
export const invalidateAuthQueries = {
  // Invalidate all auth queries
  all: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: ['auth'],
    });
  },

  // Invalidate session queries
  session: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: ['auth', 'session'],
    });
  },

  // Invalidate user profile queries
  userProfile: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({
      queryKey: ['auth', 'profile'],
    });
  },

  // Invalidate specific user queries
  user: (queryClient: QueryClient, userId?: string) => {
    return queryClient.invalidateQueries({
      queryKey: ['auth', 'user', userId],
    });
  },
};

// Prefetch utilities for auth queries
export const prefetchAuthQueries = {
  userProfile: async (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: ['auth', 'profile'],
      queryFn: async () => {
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        return data.user;
      },
      staleTime: authQueryOptions.staleTime.userProfile,
    });
  },
};

// Query client default options for auth-related queries
export const getAuthQueryClientOptions = () => ({
  defaultOptions: {
    queries: {
      staleTime: authQueryOptions.staleTime.session,
      cacheTime: authQueryOptions.cacheTime.session,
      retry: (failureCount: number, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        console.error('Auth mutation error:', error);
      },
    },
  },
});
```

<!-- path: lib/models/User.ts -->
```typescript
import mongoose from 'mongoose';

export type UserStatus = 'active' | 'pending' | 'suspended';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  orsApiKey?: string;
  status?: UserStatus;
}


const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    required: false,
  },
  emailVerified: {
    type: Date,
    required: false,
  },
  orsApiKey: {
    type: String,
    required: false,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'pending', // <-- New users start as pending
    required: true,
  }
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
```

<!-- path: lib/models/Route.ts -->
```typescript
// lib/models/Route.ts
import { RouteStats } from '@/types';
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocation {
  lat: number;
  lng: number;
}

export interface IORSData {
  processedPath: ILocation[];
  originalPath: ILocation[];
  routeStats: RouteStats;
  profile: string;
  processedAt: Date;
  processingMetadata?: {
    processingTime?: number;
    batchCount?: number;
    apiCalls?: number;
    confidence?: number;
  };
}

export interface ISurveyPoint extends Document {
  _id: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  location: ILocation;
  timestamp: Date;
  notes?: string;
  photos?: string[];
  metadata?: mongoose.Schema.Types.Mixed;
}

export interface IRoute extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Crucial for data ownership
  name: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  path: ILocation[];
  points: mongoose.Types.ObjectId[] | ISurveyPoint[];
  orsData?: IORSData;
  metadata?: {
    hasORSData?: boolean;
    orsProcessingVersion?: string;
    gpsAccuracy?: { average: number; min: number; max: number; };
    deviceInfo?: { userAgent?: string; platform?: string; };
  };
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({ lat: { type: Number, required: true }, lng: { type: Number, required: true } }, { _id: false });
// const ORSDataSchema = new Schema<IORSData>({}, { _id: false });

const SurveyPointSchema = new Schema<ISurveyPoint>({
  routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
  location: { type: LocationSchema, required: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  notes: { type: String, maxlength: 1000 },
  photos: [{ type: String }],
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const RouteSchema = new Schema<IRoute>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Added userId
  name: { type: String, required: true, trim: true, maxlength: 200, index: true },
  description: { type: String, trim: true, maxlength: 1000 },
  points: [{ type: Schema.Types.ObjectId, ref: 'SurveyPoint' }],
  startTime: { type: Date, required: true, default: Date.now, index: true },
  endTime: { type: Date },
  totalDuration: { type: Number },
  status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' },
  path: { type: [LocationSchema], default: [] },
  orsData: { type: Schema.Types.Mixed, default: undefined },
  // orsData: { type: ORSDataSchema, default: undefined },
  metadata: { hasORSData: { type: Boolean, default: false } }
}, { timestamps: true });

export const RouteModel = (mongoose.models.Route as Model<IRoute>) || mongoose.model<IRoute>('Route', RouteSchema);
export const SurveyPointModel = (mongoose.models.SurveyPoint as Model<ISurveyPoint>) || mongoose.model<ISurveyPoint>('SurveyPoint', SurveyPointSchema);
```

<!-- path: lib/models/VerificationToken.ts -->
```typescript
import mongoose from 'mongoose';

export interface IVerificationToken extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  identifier: string;
  token: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verificationTokenSchema = new mongoose.Schema<IVerificationToken>({
  identifier: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expires: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index for identifier and token
verificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

export default mongoose.models.VerificationToken || mongoose.model<IVerificationToken>('VerificationToken', verificationTokenSchema);
```

<!-- path: lib/models/Account.ts -->
```typescript
import mongoose from 'mongoose';

export interface IAccount extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new mongoose.Schema<IAccount>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  providerAccountId: {
    type: String,
    required: true,
  },
  refresh_token: {
    type: String,
    required: false,
  },
  access_token: {
    type: String,
    required: false,
  },
  expires_at: {
    type: Number,
    required: false,
  },
  token_type: {
    type: String,
    required: false,
  },
  scope: {
    type: String,
    required: false,
  },
  id_token: {
    type: String,
    required: false,
  },
  session_state: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

// Compound index for provider and providerAccountId
accountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export default mongoose.models.Account || mongoose.model<IAccount>('Account', accountSchema);
```

<!-- path: lib/models/Session.ts -->
```typescript
import mongoose from 'mongoose';

export interface ISession extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  sessionToken: string;
  userId: mongoose.Types.ObjectId;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema<ISession>({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);
```

<!-- path: lib/kmlParser.ts -->
```typescript
import { Route, SurveyPoint, Location } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Defines the shape of a new route object created from a KML file,
 * ready to be sent to the saveRoute mutation.
 */
export type NewRoutePayload = Omit<Route, '_id' | 'createdAt' | 'updatedAt'> & {
  userId: string;
};

/**
 * Parses a KML file content (as a string) and transforms it into a Route object.
 * @param kmlString The string content of the KML file.
 * @param userId The ID of the user who is uploading the route.
 * @returns A new Route object ready to be saved.
 */
export const parseKmlFile = (
  kmlString: string,
  userId: string
): NewRoutePayload => {
  const parser = new DOMParser();
  const kml = parser.parseFromString(kmlString, 'application/xml');

  // --- FIX 2: Start searching from the documentElement to correctly handle types ---
  const rootElement = kml.documentElement;

  // Helper to get text content from a tag, now starting from an Element
  const getText = (node: Element, tagName: string): string => {
    return node.getElementsByTagName(tagName)[0]?.textContent || '';
  };

  const placemarks = rootElement.getElementsByTagName('Placemark');
  let routeName = getText(rootElement, 'name') || 'Imported KML Route';
  const routeDescription =
    getText(rootElement, 'description') || 'Route imported from a KML file.';
  // --- END FIX 2 ---

  const path: Location[] = [];
  const points: SurveyPoint[] = [];

  for (const placemark of Array.from(placemarks)) {
    const lineString = placemark.getElementsByTagName('LineString')[0];
    const point = placemark.getElementsByTagName('Point')[0];

    if (lineString) {
      const coordsText =
        lineString.getElementsByTagName('coordinates')[0]?.textContent;
      if (coordsText) {
        coordsText
          .trim()
          .split(/\s+/)
          .forEach((coord) => {
            const [lng, lat] = coord.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) path.push({ lat, lng });
          });
        if (routeName === 'Imported KML Route') {
          routeName = getText(placemark, 'name') || routeName;
        }
      }
    }

    if (point) {
      const coordsText =
        point.getElementsByTagName('coordinates')[0]?.textContent;
      if (coordsText) {
        const [lng, lat] = coordsText.trim().split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({
            _id: uuidv4(), // Client-side temporary ID
            routeId: '', // Will be assigned by the server logic
            location: { lat, lng },
            notes: getText(placemark, 'name') || 'Imported Point',
            pointType: 'UG_JC',
            timestamp: new Date(),
          });
        }
      }
    }
  }

  if (path.length === 0 && points.length > 0) {
    points.sort((a, b) => a.notes.localeCompare(b.notes));
    path.push(...points.map((p) => p.location));
  }

  // --- FIX 3: Use the dedicated NewRoutePayload type ---
  // This ensures full type safety without needing @ts-ignore.
  const newRoute: NewRoutePayload = {
    userId: userId,
    name: routeName,
    description: routeDescription,
    startTime: new Date(),
    endTime: new Date(),
    status: 'completed',
    totalDuration: 0,
    points: points,
    path: path,
  };
  // --- END FIX 3 ---

  return newRoute;
};

```

<!-- path: lib/auth-utils.ts -->
```typescript
// lib/auth-utils.ts
import { auth } from '@/auth';
import User, { IUser } from './models/User';
import { Session } from 'next-auth';
import { ObjectId } from 'mongodb';
import { getClientPromise } from './mongodb';

export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return null;

    const client = await getClientPromise();
    const user = await User.findById(session.user.id).lean().exec() as unknown as IUser | null;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserFromDb(userId: string): Promise<any | null> {
  try {
    const client = await getClientPromise();

    // Query the NextAuth users collection directly
    const db = client.db("route-survey");
    const usersCollection = db.collection("users");

    // Convert string ID to ObjectId if necessary
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      // If not a valid ObjectId, try as string
      const user = await usersCollection.findOne({ _id: userId as any });
      return user;
    }

    // If we got here, we have a valid ObjectId
    const user = await usersCollection.findOne({ _id: objectId });
    console.log('Found user:', user);
    return user;
  } catch (error) {
    console.error('Error getting user from db:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const client = await getClientPromise();
    const db = client.db("route-survey");
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email });
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<{ name?: string; image?: string }>
): Promise<any | null> {
  try {
    const client = await getClientPromise();
    const db = client.db("route-survey");
    const usersCollection = db.collection("users");

    // First, try to update by ObjectId
    try {
      const objectId = new ObjectId(userId);
      const result = await usersCollection.findOneAndUpdate(
        { _id: objectId },
        {
          $set: {
            ...data,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result && result.value) {
        return result.value;
      }
    } catch (objectIdError) {
      console.log('userId is not a valid ObjectId for update, trying as string');
    }

    // If ObjectId fails, try as string
    const stringResult = await usersCollection.findOneAndUpdate(
      { _id: userId } as any,
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!stringResult || !stringResult.value) {
      throw new Error('User not found');
    }

    return stringResult.value;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user?.id;
}

export function requireAuth(session: Session | null): asserts session is Session & { user: { id: string } } {
  if (!isAuthenticated(session)) {
    throw new Error('Authentication required');
  }
}
```

<!-- path: lib/zod.ts -->
```typescript
import z, { object, string } from "zod"

export const signInSchema = object({
  email: z.email("Invalid email")
    .min(1, "Email is required"),
  password: string()
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
})
```

<!-- path: lib/auth-config.ts -->
```typescript
// lib/auth-config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userStatus = auth?.user?.status; // Get status from the session token
      const isOnProtectedRoute = !['/login', '/unauthorized'].includes(nextUrl.pathname);

      if (isOnProtectedRoute) {
        if (!isLoggedIn) {
          // Not logged in, redirect to login page.
          return false;
        }

        // --- THIS IS THE FIX ---
        // User is logged in, now check their status.
        if (userStatus !== 'active') {
          // If not active, redirect them to the unauthorized page.
          // This prevents them from accessing any protected part of the app.
          const unauthorizedUrl = new URL('/unauthorized', nextUrl.origin);
          return Response.redirect(unauthorizedUrl);
        }
        // --- END OF FIX ---

        // User is logged in and active, allow access.
        return true;
      } else if (isLoggedIn) {
        // If the user is already logged in...
        if (userStatus === 'active' && ['/login', '/unauthorized'].includes(nextUrl.pathname)) {
          // ...and they are active, redirect them away from login/unauthorized pages to the dashboard.
          return Response.redirect(new URL('/', nextUrl));
        }
        // If they are logged in but not active, and trying to access login, let them stay to see the error.
      }

      // Allow access to login/unauthorized pages if not logged in.
      return true;
    },
  },
};
```

<!-- path: lib/outbox-db.ts -->
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Route } from '@/types';

const DB_NAME = 'route-survey-outbox';
const DB_VERSION = 2;
const STORE_NAME = 'pending-routes';

export type OutboxRoute = Route & {
  syncStatus: 'pending' | 'failed';
  syncError?: string;
};

// --- FIX 1: ALIGN THE SCHEMA TYPES ---
// The key of the index is a string, and the value it points to is also a string.
interface OutboxDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: OutboxRoute;
    indexes: {
      by_status: string; // The index 'by_status' contains string values ('pending' or 'failed')
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OutboxDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    if (typeof window !== 'undefined') {
      dbPromise = openDB<OutboxDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, tx) {
          // --- FIX 2: ROBUST UPGRADE LOGIC ---
          // This function is the only place where schema changes can happen.

          let store;
          // Case 1: The database is being created for the first time.
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            store = db.createObjectStore(STORE_NAME, { keyPath: '_id' });
          } else {
            // Case 2: The store already exists, get a reference to it.
            store = tx.objectStore(STORE_NAME);
          }

          // Now, check if the index needs to be created.
          if (!store.indexNames.contains('by_status')) {
            // The second argument is the keyPath - the property on the object to index.
            store.createIndex('by_status', 'syncStatus');
          }
        },
      });
    } else {
      return Promise.reject(new Error("IndexedDB can only be accessed in the browser."));
    }
  }
  return dbPromise;
}

export async function addRouteToOutbox(route: Route): Promise<void> {
  try {
    const db = await getDB();
    const outboxRoute: OutboxRoute = { ...route, syncStatus: 'pending' };
    await db.put(STORE_NAME, outboxRoute);
  } catch (error) {
    console.error("Failed to add route to outbox:", error);
    throw error;
  }
}

export async function updateOutboxRouteStatus(routeId: string, status: 'pending' | 'failed', error?: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const route = await store.get(routeId);
  if (route) {
    route.syncStatus = status;
    route.syncError = error;
    await store.put(route);
  }
  await tx.done;
}

// This function is for the service worker
export async function getPendingRoutesForSync(): Promise<OutboxRoute[]> {
  try {
    const db = await getDB();
    // This will now be type-correct because the schema matches the query.
    return db.getAllFromIndex(STORE_NAME, 'by_status', 'pending');
  } catch (error) {
    console.error("Failed to get pending routes from outbox:", error);
    return [];
  }
}

// This function is for the UI component
export async function getAllRoutesFromOutbox(): Promise<OutboxRoute[]> {
  try {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  } catch (error) {
    console.error("Failed to get all routes from outbox:", error);
    return [];
  }
}

export async function deleteRouteFromOutbox(routeId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, routeId);
  } catch (error) {
    console.error("Failed to delete route from outbox:", error);
    throw error;
  }
}
```

