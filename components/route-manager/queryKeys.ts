// components/route-manager/queryKeys.ts

export const queryKeys = {
  routes: ['routes'] as const,
  routeDetails: (routeId: string | null) => ['routeDetails', routeId] as const,
};
