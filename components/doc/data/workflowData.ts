import { ShieldCheck, Database, Route, GitBranch, GitCommit } from 'lucide-react';
import { WorkflowSection } from '../types/workflowTypes';

export const workflowSections: WorkflowSection[] = [
  {
    value: "auth",
    icon: ShieldCheck,
    title: "Authentication & Authorization",
    subtitle: "User registration, login & RBAC",
    gradient: "from-violet-500 to-purple-600",
    iconColor: "text-violet-400",
    bgGlow: "bg-violet-500/10",
    color: "violet",
    purpose: "To manage user registration, login, session handling, and role-based access control (RBAC).",
    workflows: [
      {
        title: "Workflow A: New User Registration & Onboarding Prompt",
        userSteps: [
          "User fills out the form on `/signup` and submits.",
          "User receives a verification email and clicks the link.",
          "User is redirected to the `/dashboard` page.",
          "A welcome popup appears, prompting them to complete their profile.",
          "User can choose to 'Update Profile', 'Maybe Later', or 'Don't show again'.",
        ],
        uiSteps: [
          "On submit, user is redirected to `/verify-email`.",
          "After email verification, the `/auth/callback` route sends the user to `/dashboard`.",
          "On the dashboard, the `OnboardingPromptModal` appears if the profile is incomplete.",
        ],
        techSteps: [
          "`signUp` calls `supabase.auth.signUp`.",
          "DB Trigger `on_auth_user_created` inserts a `user_profiles` record and adds `{\"needsOnboarding\": true}` to the `preferences` JSONB column.",
          "The `app/dashboard/page.tsx` component uses the `useGetMyUserDetails` hook.",
          "A `useEffect` checks if `profile.preferences.needsOnboarding` is `true` and if `profile.preferences.showOnboardingPrompt` is not `false`.",
          "If conditions are met, the modal's state is set to open.",
          "Clicking 'Don't show again' updates the `preferences` column, setting `showOnboardingPrompt: false`.",
          "Clicking 'Update Profile' navigates the user to the `/onboarding` page.",
        ],
      },
      {
        title: "Workflow B: User Login & Session Management",
        userSteps: [
          "User enters credentials on `/login` and clicks 'Sign in'.",
        ],
        uiSteps: [
          "Loading state shown.",
          "On success, user is redirected to `/dashboard`.",
          "On failure, an error toast is displayed.",
        ],
        techSteps: [
          "`signIn` function in `useAuth` calls `supabase.auth.signInWithPassword`.",
          "The hook verifies that the response contains no error AND a valid session object.",
          "If verification fails, an error toast is shown and the function returns `success: false`.",
          "If successful, Supabase returns a session with a JWT, which is stored in cookies.",
          "The `middleware.ts` refreshes the user's auth token on subsequent requests.",
          "The `useAuthStore` (Zustand) is updated by the `onAuthStateChange` listener, making the user session globally available.",
        ],
      },
      {
        title: "Workflow C: Role Synchronization & RLS",
        userSteps: ["An admin changes a user's role in the User Management page."],
        uiSteps: ["The user's permissions are updated for their next session."],
        techSteps: [
          "An admin action updates the `role` column in the `public.user_profiles` table.",
          "A database trigger (`sync_user_role_trigger`) fires on update.",
          "This trigger updates the `raw_app_meta_data` JSONB column in the corresponding `auth.users` table, setting the new role.",
          "The user's JWT is now minted with the new role claim, which is used by RLS policies to grant access.",
        ],
      },
      {
        title: "Workflow D: Existing User Profile Update",
        userSteps: [
            "User clicks on their avatar in the header and selects 'Update Profile'.",
            "User is taken to the `/onboarding` page, which acts as a profile editor.",
            "User changes their details and clicks 'Update Profile'."
        ],
        uiSteps: [
            "The form on the `/onboarding` page is pre-populated with the user's existing data.",
            "A toast notification confirms that the profile has been updated successfully.",
            "The user remains on the profile page to make further changes.",
        ],
        techSteps: [
            "The `AuthButton` component contains a `<Link>` that navigates to `/onboarding`.",
            "The `OnboardingFormEnhanced` component fetches the user's profile using the `useGetMyUserDetails` hook.",
            "An `useEffect` populates the form fields with the fetched data.",
            "On submit, `OnboardingFormEnhanced` calls the `useTableUpdate` mutation, which updates the `user_profiles` record and sets `needsOnboarding` to `false` within the `preferences` column.",
            "The `isDirty` state from `react-hook-form` ensures the update only happens if changes were actually made."
        ]
      }
    ],
  },
  {
    value: 'crud',
    icon: Database,
    title: 'Standard CRUD Operations',
    subtitle: 'Users, Nodes, Rings & more',
    gradient: 'from-blue-500 to-cyan-600',
    iconColor: 'text-blue-400',
    bgGlow: 'bg-blue-500/10',
    color: 'blue',
    purpose:
      'To provide a consistent and reusable pattern for managing core data entities across the application.',
    workflows: [
      {
        title: 'Workflow: Viewing & Filtering Data',
        userSteps: [
          'User navigates to a data management page like `/dashboard/nodes`.',
          'User types in the search bar or selects a filter option.',
        ],
        uiSteps: [
          '`PageHeader` shows aggregate stats (total, active, inactive).',
          '`DataTable` displays the first page of data.',
          'Table updates in real-time as the user types or selects filters.',
        ],
        techSteps: [
          'The page component uses the `useCrudManager` hook, providing a data-fetching adapter (`useNodesData`).',
          '`useCrudManager` manages state for pagination, search, and filters.',
          'The data-fetching hook (`useNodesData`) calls the generic `usePagedData` hook.',
          '`usePagedData` calls the `get_paged_data` Supabase RPC function, passing filters as a JSONB object.',
          'The RPC function dynamically builds and executes a secure SQL query against the appropriate view (e.g., `v_nodes_complete`).',
          'Data is returned to the `DataTable` for rendering.',
        ],
      },
      {
        title: 'Workflow: Creating or Editing an Entity',
        userSteps: [
          "User clicks 'Add New' or the 'Edit' icon on a table row.",
          "User fills out the form in the modal and clicks 'Save'.",
        ],
        uiSteps: [
          'A modal (`NodeFormModal`) appears with a form for the entity.',
          'Form fields are validated using Zod schemas (`nodesInsertSchema`).',
          'On successful save, a toast notification appears and the table refreshes.',
        ],
        techSteps: [
          '`useCrudManager` manages the modal state (`editModal`).',
          'The form component (`NodeFormModal`) uses `react-hook-form` with `@hookform/resolvers/zod` for validation.',
          "On submit, `useCrudManager`'s `handleSave` is called.",
          'This triggers either `useTableInsert` or `useTableUpdate` from `@tanstack/react-query` hooks.',
          'The hook performs the insert/update operation on the appropriate Supabase table (e.g., `nodes`).',
          'On mutation success, `react-query` automatically invalidates the relevant query keys, triggering a refetch via `useCrudManager` to update the UI.',
        ],
      },
    ],
  },
  {
    value: 'routes',
    icon: Route,
    title: 'OFC & Route Management',
    subtitle: 'Cable segmentation & fiber splicing',
    gradient: 'from-teal-500 to-emerald-600',
    iconColor: 'text-teal-400',
    bgGlow: 'bg-teal-500/10',
    color: 'teal',
    purpose:
      'An advanced tool to manage the physical segmentation and fiber splicing of an optical fiber cable (OFC) route.',
    workflows: [
      {
        title: 'Workflow A: Visualizing a Route',
        userSteps: ['User selects an OFC route from the dropdown.'],
        uiSteps: [
          'The `RouteVisualization` component renders the start/end nodes and any existing Junction Closures (JCs).',
          'A list of `Cable Segments` is displayed below the visualization.',
        ],
        techSteps: [
          "The page component's `useQuery` fetches data from the API route `/api/route/[id]`.",
          'The API route fetches data from multiple tables: `v_ofc_cables_complete`, `junction_closures`, and `cable_segments`.',
          'The API returns a consolidated `RouteDetailsPayload` object.',
        ],
      },
      {
        title: 'Workflow B: Adding a Junction Closure',
        userSteps: [
          "User clicks 'Add Junction Closure'.",
          "User fills in the JC's name and position in the `JcFormModal` and saves.",
        ],
        uiSteps: [
          'The `RouteVisualization` updates to show the new JC on the cable path.',
          'The `Cable Segments` list is recalculated and re-rendered.',
        ],
        techSteps: [
          'The `JcFormModal` calls the `add_junction_closure` Supabase RPC function.',
          "This RPC inserts a new record into the `nodes` table (for the JC's physical location) and the `junction_closures` table.",
          'An `AFTER INSERT` trigger on `junction_closures` fires the `recalculate_segments_for_cable` function.',
          'This function deletes all old segments for that cable and creates new ones based on the new sequence of nodes and JCs, storing them in the `cable_segments` table.',
          'The frontend refetches the route details, updating the UI.',
        ],
      },
      {
        title: 'Workflow C: Managing Fiber Splices',
        userSteps: [
          'User clicks on an existing JC in the visualization.',
          "The 'Splice Management' tab becomes active.",
          'User selects a fiber from one segment and then clicks an available fiber on another segment to create a splice.',
        ],
        uiSteps: [
          'The `FiberSpliceManager` component displays a matrix of all segments and fibers at that JC.',
          'UI provides visual cues for selected, available, and used fibers.',
        ],
        techSteps: [
          '`FiberSpliceManager` calls the `get_jc_splicing_details` RPC function to fetch the current state of all fibers and splices at the JC node.',
          "`manage_splice` RPC function is called with `p_action: 'create'`, inserting a record into the `fiber_splices` table.",
          'The frontend query for splicing details is invalidated and refetched, updating the UI.',
        ],
      },
    ],
  },
  {
    value: 'provisioning',
    icon: GitBranch,
    title: 'Logical Path & Fiber Provisioning',
    subtitle: 'End-to-end service provisioning',
    gradient: 'from-cyan-500 to-blue-600',
    iconColor: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/10',
    color: 'cyan',
    purpose:
      'To define an end-to-end logical path over physical cable segments and provision working/protection fibers for a service.',
    workflows: [
      {
        title: 'Workflow A: Building a Logical Path',
        userSteps: [
          "User navigates to a System's detail page (`/dashboard/systems/[id]`).",
          "User clicks 'Initialize Path' to create a logical path record.",
          "In 'Build Mode', user clicks on nodes in the map to add cable segments to the path.",
        ],
        uiSteps: [
          'The `SystemRingPath` component displays a map of nodes and a list of segments in the path.',
          'The map highlights nodes in the current path.',
        ],
        techSteps: [
          'Initializing inserts a new record into `logical_fiber_paths`.',
          'Clicking a node calls the `find_cable_between_nodes` RPC to find the physical `ofc_cables` record.',
          'A new record is inserted into `logical_path_segments`, linking the `logical_fiber_paths` ID with the `ofc_cables` ID.',
          'The path is validated in real-time using the `validate_ring_path` RPC.',
        ],
      },
      {
        title: 'Workflow B: Provisioning Fibers',
        userSteps: [
          'Once a valid path is built, the `FiberProvisioning` section appears.',
          "User selects a 'Working Fiber' and a 'Protection Fiber' from the dropdowns and clicks 'Save Changes'.",
        ],
        uiSteps: [
          'The dropdowns only show fibers that are continuously available across all segments of the logical path.',
          'After saving, the UI switches to a read-only view showing the provisioned fibers.',
        ],
        techSteps: [
          'The `useAvailableFibers` hook calls the `get_continuous_available_fibers` RPC, which finds common unallocated fiber numbers across all `ofc_connections` in the path.',
          'Saving calls the `provision_ring_path` RPC.',
          'This RPC creates two new `logical_fiber_paths` records (one for working, one for protection) and then updates the `logical_path_id` and `fiber_role` columns on all relevant `ofc_connections` records.',
          'This atomically allocates the fibers to the service.',
        ],
      },
    ],
  },
  {
    value: 'auditing',
    icon: GitCommit,
    title: 'Auditing System',
    subtitle: 'Automatic change tracking & logging',
    gradient: 'from-orange-500 to-red-600',
    iconColor: 'text-orange-400',
    bgGlow: 'bg-orange-500/10',
    color: 'orange',
    purpose:
      'To automatically log all data modifications (INSERT, UPDATE, DELETE) for accountability and history tracking.',
    workflows: [
      {
        title: 'Workflow: Automatic Data Change Logging',
        userSteps: ["An admin edits and saves an employee's profile."],
        uiSteps: [
          'The change is reflected in the UI as usual.',
          "An admin with permission can view the change log in the 'User Activity' section.",
        ],
        techSteps: [
          'The `UPDATE` operation on the `employees` table completes.',
          'An `AFTER UPDATE` trigger (`employees_log_trigger`) on the table fires automatically.',
          'The trigger executes the `log_data_changes()` function.',
          "This function captures the `OLD` and `NEW` row data, converts them to JSONB, and determines the operation type ('UPDATE').",
          'It then calls `log_user_activity()`, passing the captured data.',
          "The `log_user_activity()` function inserts a new record into the `user_activity_logs` table, including the current user's ID (`auth.uid()`) and role (`get_my_role()`).",
          'The entire process is atomic and happens within the same database transaction as the original update.',
        ],
      },
    ],
  },
];