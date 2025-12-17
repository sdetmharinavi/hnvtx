// path: components/doc/data/workflowData.ts
import { WorkflowSection } from '../types/workflowTypes';

export const workflowSections: WorkflowSection[] = [
  // ============================================================================
  // MODULE 1: AUTHENTICATION & USER MANAGEMENT
  // ============================================================================
  {
    value: 'auth_onboarding',
    icon: 'ShieldCheck',
    title: 'Authentication & Users',
    subtitle: 'Security, Roles & Profiles',
    gradient: 'from-violet-500 to-purple-600',
    iconColor: 'text-violet-400',
    bgGlow: 'bg-violet-500/10',
    color: 'violet',
    purpose:
      'To manage user identities, secure sessions via Supabase Auth, and enforce Role-Based Access Control (RBAC).',
    workflows: [
      {
        title: '1. Registration & Onboarding',
        userSteps: [
          'Navigate to `/signup`.',
          "Enter Email, Password, First Name, and Last Name. Click 'Create Account'.",
          'Check email inbox for verification link. Click it to verify.',
          'Log in. If this is your first time, the `OnboardingPromptModal` appears.',
          "Click 'Update Profile' to add Phone Number and Address.",
        ],
        uiSteps: [
          'Redirects to `/verify-email` after signup.',
          'Redirects to `/dashboard` after login.',
          "The onboarding modal persists until the user completes the profile or clicks 'Don't show again'.",
        ],
        techSteps: [
          '**Database Trigger:** `on_auth_user_created` automatically inserts a row into `public.user_profiles`.',
          '**Context:** `UserProvider` fetches `v_user_profiles_extended` to check `preferences->needsOnboarding`.',
        ],
      },
    ],
  },

  // ============================================================================
  // NEW MODULE: OFFLINE & SYNC
  // ============================================================================
  {
    value: 'offline_sync',
    icon: 'WifiOff',
    title: 'Offline & Sync',
    subtitle: 'Data Availability',
    gradient: 'from-slate-500 to-gray-600',
    iconColor: 'text-slate-400',
    bgGlow: 'bg-slate-500/10',
    color: 'teal',
    purpose:
      'To explain how the application behaves without internet connection and how data synchronization works.',
    workflows: [
      {
        title: '1. Offline Mode',
        userSteps: [
          'The app automatically detects network status.',
          '**Read Access:** You can view Systems, Nodes, Employees, Inventory, and Diagrams while offline.',
          '**Write Access:** You can Create/Edit records (except Routes). Changes are queued locally.',
          '**Route Manager:** Splicing and topology editing are **disabled** offline to prevent conflicts.',
        ],
        uiSteps: [
          'A "You\'re offline" banner appears at the top.',
          'The Sync Cloud icon in the header turns grey/crossed out.',
        ],
        techSteps: [
          '**Storage:** `Dexie.js` (IndexedDB) stores a local replica of all critical tables.',
          '**Hooks:** `useLocalFirstQuery` serves local data instantly, bypassing network calls by default.',
        ],
      },
      {
        title: '2. Data Synchronization',
        userSteps: [
          'Data is **Manual Sync** by default to save bandwidth and improve speed.',
          "**To Update:** Click the **'Refresh'** button on any table or the **Sync Cloud** icon in the header.",
          '**Uploads:** Offline changes (mutations) are stored in a queue.',
          'When internet is restored, the app automatically processes the queue.',
        ],
        uiSteps: [
          "The Cloud icon animates (Blue/Bouncing) while syncing.",
          "Green Checkmark indicates 'All Synced'.",
          "Red Warning indicates sync errors (click to view details).",
        ],
        techSteps: [
          '**Queue:** `useMutationQueue` stores requests in `mutation_queue` table.',
          '**Sync Logic:** `useDataSync` pulls fresh data from Supabase RPCs and updates IndexedDB.',
        ],
      },
    ],
  },

    // ============================================================================
  // MODULE 2: LOG BOOK (DIARY)
  // ============================================================================
  {
    value: 'log_book_diary',
    icon: 'FileClock',
    title: 'Log Book (Diary)',
    subtitle: 'Daily Logs & Events',
    gradient: 'from-pink-500 to-rose-600',
    iconColor: 'text-pink-400',
    bgGlow: 'bg-pink-500/10',
    color: 'orange', // Reusing orange theme for similar warmth
    purpose:
      'To record daily maintenance activities, faults attended, and critical events in a structured timeline.',
    workflows: [
      {
        title: '1. Viewing Daily Logs',
        userSteps: [
          'Navigate to `/dashboard/diary`.',
          "The default view shows the **current month's calendar** on the left and selected day's entries on the right.",
          '**Day View:** Click any date on the calendar. The list updates to show notes for *that specific day*.',
          "**Feed View:** Click 'Month Feed' to see a scrolling list of ALL activities for the selected month.",
          "Click 'Today' to instantly jump back to the current date.",
        ],
        uiSteps: [
          'Dates with entries are highlighted on the calendar.',
          'Search bar filters notes by content or tags across the *entire month*.',
        ],
        techSteps: [
          '**Hook:** `useDiaryData` fetches a range (start of month to end of month).',
          '**Optimization:** Data is fetched once for the month and filtered client-side for speed.',
        ],
      },
      {
        title: '2. Creating Entries',
        userSteps: [
          "Click 'Create Entry' (visible if you have Admin permissions).",
          'The date defaults to the currently selected day on the calendar.',
          "**Tags:** Enter comma-separated tags (e.g., 'fault, fiber cut, critical') for easier searching later.",
          '**Content:** Use the Rich Text Editor to format your log (Bold, Lists, Tables, etc.).',
          "Click 'Submit'.",
        ],
        uiSteps: [
          'The new note appears immediately in the list.',
          'A toast notification confirms success.',
        ],
        techSteps: [
          '**Component:** `DiaryFormModal` uses `FormRichTextEditor` based on Tiptap.',
          '**Mutation:** `useTableInsert` sends data to `diary_notes` table.',
        ],
      },
      {
        title: '3. Bulk Import Logs',
        userSteps: [
          "Click 'Actions' -> 'Upload'.",
          'Select an Excel file with columns: `note_date`, `content`, `tags`.',
          'The system will upsert these records, matching by Date + User.',
        ],
        techSteps: [
          '**Hook:** `useDiaryExcelUpload` handles parsing and batch insertion.',
          '**Constraint:** `unique_note_per_user_per_day` ensures no duplicates for the same day/user.',
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 3: EMPLOYEE DIRECTORY
  // ============================================================================
  {
    value: 'employee_directory',
    icon: 'BsPeople',
    title: 'Employee Directory',
    subtitle: 'Staff & Contact Management',
    gradient: 'from-blue-400 to-cyan-500',
    iconColor: 'text-blue-500',
    bgGlow: 'bg-blue-500/10',
    color: 'blue',
    purpose:
      'To maintain a centralized registry of all staff members, their contact details, designations, and assigned maintenance areas.',
    workflows: [
      {
        title: '1. Adding Employees',
        userSteps: [
          'Navigate to `/dashboard/employees`.',
          "Click 'Add New' in the top right corner.",
          "Fill in 'Employee Name', 'Designation' (from dropdown), and 'Maintenance Area'.",
          'Optional: Add Contact Number, Email, DOB, and Address.',
          "Click 'Submit'.",
        ],
        uiSteps: [
          'The list automatically sorts alphabetically by name (Ascending).',
          'Success toast appears confirming creation.',
        ],
        techSteps: [
          '**Hook:** `useEmployeesData` fetches data via RPC/Local DB and applies `localeCompare` sort.',
          '**Table:** `employees` linked to `employee_designations` and `maintenance_areas`.',
        ],
      },
      {
        title: '2. Managing Staff Details',
        userSteps: [
          "**Grid View:** Click the 'Edit' button on an employee card.",
          "**List View:** Click the 'Edit' action in the table row.",
          "Update fields like 'Contact Number' or change 'Designation'.",
          "Toggle 'Status' to deactivate employees who have left/transferred.",
        ],
        uiSteps: [
          'Inactive employees show a red status indicator.',
          'Filters allow viewing only Active or Inactive staff.',
        ],
        techSteps: [
          '**Mutation:** `useTableUpdate` handles partial updates.',
          '**Validation:** Zod schema ensures required fields like Name are present.',
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 4: INVENTORY & ASSETS
  // ============================================================================
  {
    value: 'inventory_assets',
    icon: 'Cpu',
    title: 'Inventory Management',
    subtitle: 'Assets, Tracking & QR Codes',
    gradient: 'from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-400',
    bgGlow: 'bg-indigo-500/10',
    color: 'violet',
    purpose: 'To track physical stock, manage asset lifecycle, and generate identification labels.',
    workflows: [
      {
        title: '1. Asset Tracking',
        userSteps: [
          'Go to `/dashboard/inventory`.',
          "**Sorting:** Items are sorted alphabetically by 'Item Name' by default.",
          "Click 'Add New' (Requires Admin or Asset Admin role).",
          "Enter 'Asset No', Name, Quantity, and Cost.",
          "Select 'Location' (Node) and 'Functional Location' (Area).",
          "Click 'Save'.",
        ],
        uiSteps: [
          'Search bar filters by Asset No, Name, or Description.',
          'Cards show live stock status (In Stock/Low/Out).',
          'Total Value is calculated based on visible items.',
        ],
        techSteps: [
          '**Hook:** `useInventoryData` enforces name-based sorting (ascending).',
          '**View:** `v_inventory_items` joins location IDs to names.',
          '**Permissions:** Edit restricted to Admin/Asset Admin; Delete restricted to Super Admin.',
        ],
      },
      {
        title: '2. Issuing Stock',
        userSteps: [
          "Click the 'Issue' button (Minus Icon) on an item card.",
          "Enter Quantity, Date, 'Issued To' (Person), and Reason.",
          "Click 'Confirm Issue'.",
        ],
        uiSteps: [
          'Stock count decreases immediately.',
          "The 'History' log is updated with the transaction details.",
        ],
        techSteps: [
          '**RPC:** `issue_inventory_item` performs atomic stock deduction and transaction logging.',
          '**Validation:** Prevents issuing more than available quantity.',
        ],
      },
      {
        title: '3. QR Code Generation',
        userSteps: [
          "Click the 'QR Code' icon on an item.",
          'A dedicated page opens with a high-res QR code containing asset metadata.',
          "Click 'Print QR Code'.",
        ],
        uiSteps: ['The print layout strips navigation and sidebars.'],
        techSteps: ['**Library:** `qrcode.react`.', '**Route:** `/dashboard/inventory/qr/[id]`.'],
      },
    ],
  },

  // ============================================================================
  // MODULE 5: E-FILE TRACKING
  // ============================================================================
  {
    value: 'efile_tracking',
    icon: 'FileText',
    title: 'E-File Tracking',
    subtitle: 'Digital Movement Register',
    gradient: 'from-blue-600 to-indigo-700',
    iconColor: 'text-blue-500',
    bgGlow: 'bg-blue-500/10',
    color: 'blue',
    purpose:
      'To digitize the physical file movement register, tracking the current location and movement history of office files.',
    workflows: [
      {
        title: '1. Initiating a File',
        userSteps: [
          'Navigate to `/dashboard/e-files`.',
          "Click 'Initiate File'.",
          "Enter 'File Number', 'Subject', and select 'Category' (Admin/Tech/Other).",
          "Select the 'Initiator' (the employee starting the file) from the dropdown.",
          'Set Priority (Normal/Urgent/Immediate).',
          "Click 'Submit'.",
        ],
        uiSteps: [
          "The file appears in the list with status 'Active'.",
          "The 'Currently With' column shows the Initiator.",
        ],
        techSteps: [
          '**RPC:** `initiate_e_file` creates the file record and the first movement log entry simultaneously.',
        ],
      },
      {
        title: '2. Forwarding a File',
        userSteps: [
          'Locate the file in the grid or list.',
          "Click the 'Forward' button (Paper Plane icon).",
          "Select 'Forward To' (Employee) from the dropdown.",
          "Add 'Remarks' explaining the action.",
          "Click 'Send'.",
        ],
        uiSteps: [
          "The 'Currently With' field updates instantly.",
          "The movement is recorded in the file's history.",
        ],
        techSteps: [
          '**RPC:** `forward_e_file` updates `current_holder_employee_id` on the file and inserts a new row into `file_movements`.',
        ],
      },
      {
        title: '3. Closing/Archiving',
        userSteps: [
          'Open the file details view.',
          "Click 'Close File' (Archive icon).",
          'Confirm the action.',
        ],
        uiSteps: [
          "Status changes to 'Closed'.",
          "File moves to the 'Closed/Archived' filter view.",
          'Further forwarding is disabled.',
        ],
        techSteps: ['**RPC:** `close_e_file` updates status and logs the final movement.'],
      },
    ],
  },

  // ============================================================================
  // MODULE 6: BASE MASTER DATA (Setup)
  // ============================================================================
  {
    value: 'base_structure',
    icon: 'Database',
    title: 'Base Master Data',
    subtitle: 'Lookups, Areas & Designations',
    gradient: 'from-cyan-500 to-blue-600',
    iconColor: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/10',
    color: 'cyan',
    purpose:
      'To configure the foundational hierarchies and data dictionaries required before any network assets can be created.',
    workflows: [
      {
        title: '1. Creating Designations',
        userSteps: [
          'Navigate to `/dashboard/designations`.',
          "Click 'Add New' (Admin or Super Admin only).",
          "Enter 'Name' (e.g., 'Senior Engineer').",
          "Select 'Parent Designation' (e.g., 'Chief Engineer') to build the hierarchy.",
          "Click 'Submit'.",
        ],
        uiSteps: [
          'The list updates immediately.',
          'Duplicates are flagged if a name already exists.',
        ],
        techSteps: [
          '**Table:** `employee_designations` uses a self-referencing `parent_id` foreign key.',
        ],
      },
      {
        title: '1.1. Designations Visualization Modes',
        userSteps: [
          '**List View:** Standard table showing all designations flatly.',
          "**Tree View:** Click the 'Tree' toggle to see the nested hierarchy.",
          'Expand/Collapse nodes using the chevron icons.',
        ],
        uiSteps: [
          'The `EntityManagementComponent` recursively renders `EntityTreeItem` components based on the `children` array.',
        ],
        techSteps: [
          '**Hook:** `useDesignationsData` reconstructs the flat database rows into a nested object structure in memory.',
          '**Permissions:** Deletion is strictly limited to **Super Admin**.',
        ],
      },
      {
        title: '2. Managing Categories',
        userSteps: [
          'Navigate to `/dashboard/categories`.',
          '**Sorting:** Categories are listed alphabetically.',
          '**Permissions:** Create/Edit is restricted to Admin+. Delete is Super Admin only.',
          "Click 'Add New' to define a new classification group (e.g., 'CABLE_MANUFACTURERS').",
          'Click the Edit icon to rename a category globally.',
        ],
        uiSteps: [
          'Input names are auto-converted to `UPPER_SNAKE_CASE`.',
          'The list shows how many lookup options exist within each category.',
        ],
        techSteps: [
          '**Logic:** Categories are derived from the `lookup_types` table using `useDeduplicated`.',
          '**Renaming:** Uses a batch SQL update to change the `category` string for all matching rows.',
        ],
      },
      {
        title: '2.2 Managing Options (Lookups)',
        userSteps: [
          "Click the number in the 'Lookup Types Count' column to jump to the details view.",
          'Alternatively, go to `/dashboard/lookup` and select a category.',
          "Add specific options (e.g., 'Sterlite', 'Finolex') under the selected category.",
        ],
        uiSteps: [
          "System Default options (marked 'Yes') cannot be deleted to ensure data integrity.",
        ],
        techSteps: [
          '**Table:** `lookup_types` stores all options.',
          '**Validation:** Prevent deletion if `is_system_default` is true.',
        ],
      },
      {
        title: '3. Viewing & Filtering',
        userSteps: [
          'Navigate to `/dashboard/lookup`.',
          '**Step 1:** Select a Category from the dropdown (e.g., `PORT_TYPES`).',
          '**Step 2:** View the table of options.',
          '**Search:** Use the search bar to find specific codes or names.',
        ],
        uiSteps: [
          'Table displays Sort Order, Name, Short Code, and Description.',
          'Defaults to sorting by `Order` then `Name`.',
        ],
        techSteps: [
          '**Hook:** `useLookupTypesData` uses `useLocalFirstQuery`.',
          '**Filtering:** RPC call filters by `category` column.',
        ],
      },
      {
        title: '3.1. Adding/Editing Options',
        userSteps: [
          "Click 'Add New' (Admin/Super Admin).",
          'Enter Name. Code is auto-generated but can be edited.',
          "Set 'Sort Order' to control dropdown position (Lower numbers appear first).",
          "Click 'Create'.",
        ],
        uiSteps: [
          "System Default options (marked 'Yes') and have disabled Edit/Delete buttons.",
        ],
        techSteps: [
          '**Validation:** Prevent editing if `is_system_default` is true to avoid breaking application logic.',
        ],
      },
      {
        title: '3.2. Deletion Rules',
        userSteps: ['Click the Trash icon (Super Admin Only).', 'Confirm the action.'],
        uiSteps: [
          'Delete button is hidden for non-Super Admins.',
          'Delete button is disabled for System Default items.',
        ],
        techSteps: [
          '**Constraint:** Standard Foreign Key constraints prevent deleting lookups that are in use by other tables (e.g., a Port Type assigned to a Port).',
        ],
      },
      {
        title: '4. Creating Areas',
        userSteps: [
          'Navigate to `/dashboard/maintenance-areas`.',
          "Click 'Add New' (Admin/Super Admin only).",
          "Enter 'Name', 'Code' (e.g., 'KOL-SOUTH'), and select 'Area Type' (Zone/Terminal).",
          "Use 'Parent Area' to nest a Terminal under a Zone.",
          'Add GPS coordinates and contact details.',
        ],
        uiSteps: [
          'Coordinates are validated as numbers.',
          'Areas are sorted alphabetically by default.',
        ],
        techSteps: [
          '**Table:** `maintenance_areas` with self-referencing `parent_id`.',
          '**Permissions:** Create/Edit for Admins; Delete for Super Admin only.',
        ],
      },
      {
        title: '4.1. Hierarchy Visualization',
        userSteps: [
          "Use the 'Tree' view toggle to see the nested structure.",
          'Click on an area to open the details panel.',
          'View parent/child relationships and contact info in the details modal.',
        ],
        uiSteps: ['The list/tree view uses the shared `EntityManagementComponent`.'],
        techSteps: ['**Hook:** `useMaintenanceAreasData` builds the tree structure in memory.'],
      },
      {
        title: '5. Creating Nodes',
        userSteps: [
          'Navigate to `/dashboard/nodes`.',
          "**Sorting:** Nodes are sorted alphabetically by 'Node Name' by default.",
          "Click 'Add New' (Admin/Asset Admin/Super Admin).",
          "Enter 'Name' (e.g., 'Kolkata Exchange').",
          "Select 'Node Type' (e.g., Exchange, BTS, Joint) and 'Maintenance Area'.",
          'Enter exact GPS coordinates (Latitude/Longitude).',
          "Click 'Submit'.",
        ],
        uiSteps: ["Duplicates can be checked using the 'Find Duplicates' button."],
        techSteps: [
          '**Hook:** `useNodesData` uses RPC for efficient fetching and sorting.',
          '**Table:** `nodes`.',
        ],
      },
      {
        title: '5.1. Visualizing Nodes',
        userSteps: [
          '**Grid View:** Displays cards with Node Name, Type, and GPS coordinates.',
          '**Table View:** Shows detailed columns including Status and Remarks.',
          "Click on a card or 'View Details' to see full metadata in a modal.",
        ],
        uiSteps: [
          'Icons on cards change dynamically based on Node Type (e.g., Tower vs. Building).',
        ],
        techSteps: ['**Logic:** `getNodeIcon` helper determines the visual representation.'],
      },
      {
        title: '6. Managing Rings',
        userSteps: [
          'Navigate to `/dashboard/rings`.',
          '**Stats:** The header displays live counts of Nodes On-Air, OFC Ready status, and SPEC Issued status.',
          "**Filtering:** Use the expanded filter panel to find rings by Phase Status (e.g., 'OFC Ready' or 'BTS On-Air').",
          "Click 'Add New' to create a ring. Set its type (Access, Aggregation) and initial status.",
        ],
        uiSteps: ["The 'Manage Systems' button opens a modal to add/remove systems from the ring."],
        techSteps: [
          '**Hook:** `useRingsData` applies complex filtering locally for speed.',
          '**Stats:** Calculated dynamically on the client based on the filtered dataset.',
        ],
      },
      {
        title: '6.1. Ring Topology Visualization',
        userSteps: [
          "Click the ring name or 'View Details' icon.",
          '**Schematic View:** Shows a logical diagram with Hubs in the center and spurs radiating outward.',
          '**Map View:** Shows systems plotted on a geographic map, connected by lines.',
          "Click 'Configure Topology' to logically break links (e.g., open loop).",
        ],
        uiSteps: [
          'Leaflet map renders custom icons based on the system/node type.',
          'Connections are drawn based on `order_in_ring` sequence.',
        ],
        techSteps: [
          '**View:** `v_ring_nodes` joins systems, nodes, and ring associations.',
          '**Logic:** `ClientRingMap` handles the visual rendering.',
        ],
      },
      {
        title: '7. Defining Services',
        userSteps: [
          'Navigate to `/dashboard/services`.',
          "Click 'Add New' (Admin/System Admins only).",
          'Enter Service Name (e.g., Customer Name + Location).',
          "Select 'Start Location' (Node) and optional 'End Location'.",
          "Define attributes like 'Link Type' (MPLS, ILL), 'Bandwidth', and 'VLAN'.",
          "Click 'Submit'.",
        ],
        uiSteps: [
          'Services are sorted alphabetically by Name.',
          'Duplicate names (Name + Link Type) are flagged with an icon.',
        ],
        techSteps: [
          '**Table:** `services` stores these definitions.',
          '**Validation:** `useDuplicateFinder` checks `name` + `link_type` combination.',
        ],
      },
      {
        title: '7.1. Linking to Connections',
        userSteps: [
          'Once created, a Service can be selected in the **System Connection Form**.',
          "Go to a System -> Add Connection -> Select 'Existing Service'.",
          'The system will pre-fill VLAN, Bandwidth, and IDs from this definition.',
        ],
        uiSteps: [
          'This separates the *Logical* definition (Customer contract) from the *Physical* implementation (Port assignment).',
        ],
        techSteps: ['**Relation:** `system_connections` table has a `service_id` FK.'],
      },
    ],
  },

  // ============================================================================
  // MODULE 7: OFC & ROUTES
  // ============================================================================
  {
    value: 'ofc_management',
    icon: 'AiFillMerge',
    title: 'OFC Management',
    subtitle: 'Physical Fiber Routes',
    gradient: 'from-orange-500 to-amber-500',
    iconColor: 'text-orange-500',
    bgGlow: 'bg-orange-500/10',
    color: 'orange',
    purpose: 'To manage the physical Optical Fiber Cables (OFC) connecting the network nodes.',
    workflows: [
      {
        title: '1. Creating Routes',
        userSteps: [
          'Navigate to `/dashboard/ofc`.',
          "**Sorting:** Routes are sorted alphabetically by 'Route Name'.",
          "Click 'Add New' (Admin/Asset Admin).",
          "Select 'Start Node' and 'End Node'. The system auto-checks for existing routes between these points.",
          "Select 'OFC Type' (e.g., 24F, 48F). Capacity is auto-populated and locked.",
          "Enter 'Asset No' and 'Current RKM' (Route Km).",
          "Click 'Submit'.",
        ],
        uiSteps: [
          'Route Name is auto-generated (`Start⇔End_N`) but can be manually edited.',
          'Success message appears, and initial fiber strands are generated in the background.',
        ],
        techSteps: [
          '**Hook:** `useOfcData` handles searching and filtering.',
          '**Trigger:** Database trigger `create_initial_connections_for_cable` populates `ofc_connections`.',
        ],
      },
      {
        title: '2. Cable Details',
        userSteps: [
          "Click on a cable card or the 'View' icon.",
          '**Header:** Shows Summary (Asset No, Route Name) and Metadata (Owner, Comm. Date).',
          "**Visualization:** Switch to 'Route Visualization' to add JCs (Joints).",
          '**Fibers:** The table below shows the status of every fiber strand (Available/Occupied).',
        ],
        uiSteps: ["Utilization stats are shown in the header (e.g., '12/24 Used')."],
        techSteps: ['**View:** `v_ofc_connections_complete` joins detailed fiber status.'],
      },
    ],
  },
  {
    value: 'route_details',
    icon: 'GitBranch',
    title: 'OFC Details',
    subtitle: 'Fiber-Level Management',
    gradient: 'from-orange-400 to-amber-500',
    iconColor: 'text-orange-500',
    bgGlow: 'bg-orange-500/10',
    color: 'orange',
    purpose:
      'To manage the granular details of a fiber route, including OTDR distances, splice losses, and end-to-end tracing.',
    workflows: [
      {
        title: '1. Fiber Strand Management',
        userSteps: [
          'Navigate to `/dashboard/ofc` and click on a cable route.',
          'The table lists every fiber strand (1 to Capacity).',
          '**Edit:** Update OTDR distance, Power Levels (dBm), or Remarks for specific strands.',
          "**Status:** See which fibers are 'Available', 'Working', or 'Protection'.",
        ],
        uiSteps: [
          'Utilization percentage is shown in the header stats.',
          'Connected System/Service names are clickable links.',
        ],
        techSteps: [
          '**View:** `v_ofc_connections_complete`.',
          '**Permissions:** Edit allowed for Admins/Asset Admins. Delete restricted to Super Admin (rarely used).',
        ],
      },
      {
        title: '2. Fiber Path Tracing',
        userSteps: [
          "Click the 'Trace Fiber Path' (Eye icon) on any fiber row.",
          'A modal opens visualizing the complete path: Start Node -> Cable -> JC Splice -> Cable -> End Node.',
          "Click 'Sync Path to DB' to update the logical connection references based on physical connectivity.",
        ],
        uiSteps: ['Visualizer handles direction orientation (A->B vs B->A) automatically.'],
        techSteps: [
          '**RPC:** `trace_fiber_path` performs recursive traversal.',
          '**Sync:** Updates `updated_sn_id`, `updated_en_id` columns.',
        ],
      },
    ],
  },
  // ============================================================================
  // MODULE 8: ROUTE MANAGER & SPLICING
  // ============================================================================
  {
    value: 'route_manager',
    icon: 'FaRoute',
    title: 'Route Manager',
    subtitle: 'Advanced Topology Editing',
    gradient: 'from-amber-500 to-orange-600',
    iconColor: 'text-amber-500',
    bgGlow: 'bg-amber-500/10',
    color: 'orange',
    purpose:
      'To provide a specialized workspace for defining the physical structure of a route, inserting Junction Closures (JCs), and managing complex splicing.',
    workflows: [
      {
        title: '1. Route Visualization',
        userSteps: [
          'Select a Route from the dropdown.',
          'The linear graph displays Start Node, End Node, and all intermediate JCs.',
          "Click 'Add Junction Closure' to insert a new splice point at a specific KM mark.",
        ],
        uiSteps: [
          'The system automatically recalculates cable segments.',
          'Visual markers indicate existing vs. planned equipment.',
        ],
        techSteps: [
          '**Trigger:** `manage_cable_segments` splits one cable into multiple segments in `cable_segments` table.',
        ],
      },
      {
        title: '2. Splice Matrix',
        userSteps: [
          'Click on a JC icon in the visualizer.',
          "Switch to the 'Splice Management' tab.",
          '**Manual:** Select an incoming fiber (Left) and an outgoing fiber (Right) to link them.',
          "**Auto:** Use 'Auto-Splice' to connect fibers 1-to-1, 2-to-2, etc., automatically.",
          '**Loss:** Enter splice loss (dB) for accurate power budget calculations.',
        ],
        uiSteps: [
          'Connected fibers change color.',
          "The 'Apply Path Updates' button syncs changes to the main database.",
        ],
        techSteps: [
          '**RPC:** `manage_splice` creates entries in `fiber_splices`.',
          '**Data:** `useJcSplicingDetails` fetches the complex join of segments + fibers + splices.',
        ],
      },
      {
        title: '3. Import/Export Topology',
        userSteps: [
          "Use 'Export Topology' to get an Excel sheet of all JCs, segments, and splices.",
          'Modify offline.',
          "Use 'Import Topology' to bulk update the route structure.",
        ],
        techSteps: [
          '**RPC:** `upsert_route_topology_from_excel` performs a massive transactional update, handling deletions and insertions safely.',
        ],
      },
    ],
  },
// ============================================================================
  // MODULE 9: SYSTEMS MANAGEMENT
  // ============================================================================
  {
    value: "systems_management",
    icon: "GoServer",
    title: "Systems",
    subtitle: "Active Network Elements",
    gradient: "from-blue-600 to-cyan-600",
    iconColor: "text-blue-500",
    bgGlow: "bg-blue-500/10",
    color: "blue",
    purpose: "To manage the active network elements (CPAN, SDH, MAAN, OLT) that light up the fiber network.",
    workflows: [
      {
        title: "1. Adding Systems",
        userSteps: [
          "Navigate to `/dashboard/systems`.",
          "Click 'Add New' (Restricted to specific Admins).",
          "Enter 'System Name', select 'Type' (e.g., CPAN) and 'Location' (Node).",
          "If it's a Ring-Based system, assign the Ring immediately.",
          "Add IP Address (automatically formats without subnet) and other details.",
        ],
        uiSteps: [
          "Multi-step modal guides through basic info and topology configuration.",
        ],
        techSteps: [
          "**RPC:** `upsert_system_with_details` transactionally handles system creation and ring association.",
        ],
      },
      {
        title: "2. Port Management",
        userSteps: [
          "Click the 'Manage Ports' (Server icon) on a system card.",
          "**Templates:** Click 'Apply Template' to auto-generate standard port configs (e.g., 'A1 Config').",
          "**Heatmap:** View port status (Up/Down/Used) visually.",
          "Click a port to manually edit its status or capacity.",
        ],
        uiSteps: [
          "Heatmap uses color coding: Green (Free), Blue (Used), Red (Admin Down).",
        ],
        techSteps: [
          "**Bulk Upsert:** Uses `useTableBulkOperations` to efficiently create/update hundreds of ports.",
          "**View:** `v_ports_management_complete` aggregates status.",
        ],
      },
      {
        title: "3. System Connections",
        userSteps: [
          "Click 'View Details' to see connections originating from or terminating at this system.",
          "Navigate to `/dashboard/connections` for a global view of all logical links.",
        ],
        uiSteps: [
          "Bi-directional view logic ensures connections are visible from both ends.",
        ],
        techSteps: [
          "**Hook:** `useSystemConnectionsData` normalizes the `sn_id` vs `en_id` perspective.",
        ],
      },
    ],
  },
  // ============================================================================
  // MODULE 10: SYSTEM CONNECTION DETAILS
  // ============================================================================
  {
    value: "system_connection_details",
    icon: "FiGitBranch",
    title: "System Connections",
    subtitle: "Bi-Directional Links & Ports",
    gradient: "from-blue-500 to-indigo-600",
    iconColor: "text-indigo-400",
    bgGlow: "bg-indigo-500/10",
    color: "blue",
    purpose: "To manage individual physical and logical links from a specific system perspective.",
    workflows: [
      {
        title: "1. Connection Management",
        userSteps: [
          "Navigate to `/dashboard/systems/[id]`.",
          "**List View:** Shows all connections where this system is either the *Source* or *Destination*.",
          "**Edit:** Update bandwidth, VLANs, or physical ports (Admin).",
          "**Stats:** Header shows port utilization specific to this system.",
        ],
        uiSteps: [
          "The 'End Node' column dynamically shows the *other* end of the link.",
          "Port heatmap shows visual status of all slots/ports.",
        ],
        techSteps: [
          "**Hook:** `useSystemConnectionsData` normalizes the `sn_id` vs `en_id` perspective so the current system is always 'local'.",
        ],
      },
      {
        title: "2. Fiber Provisioning",
        userSteps: [
          "Click 'Allocate Fibers' on a connection.",
          "Select the outgoing cable and specific fiber strand.",
          "If the route is multi-hop, select subsequent cables/fibers until the destination is reached.",
          "Click 'Confirm'.",
        ],
        uiSteps: [
          "Dropdowns filter out already-occupied fibers.",
        ],
        techSteps: [
          "**RPC:** `provision_service_path` atomically updates `logical_fiber_paths` and marks `ofc_connections` as used.",
        ],
      },
      {
        title: "3. Path Tracing",
        userSteps: [
          "Click the 'Eye' icon on a provisioned connection.",
          "View the complete physical path: System A -> Cable -> JC -> Cable -> System B.",
          "Shows total distance and loss budget.",
        ],
        techSteps: [
          "**RPC:** `trace_fiber_path`.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 11: GLOBAL CONNECTIONS EXPLORER
  // ============================================================================
  {
    value: "global_connections",
    icon: "FiGitBranch",
    title: "Global Connections",
    subtitle: "Network-Wide Circuit View",
    gradient: "from-indigo-600 to-violet-600",
    iconColor: "text-indigo-500",
    bgGlow: "bg-indigo-500/10",
    color: "violet",
    purpose: "To provide a searchable, unified view of every logical service connection across the entire network.",
    workflows: [
      {
        title: "1. Finding Circuits",
        userSteps: [
          "Navigate to `/dashboard/connections`.",
          "**Sorting:** Connections are sorted alphabetically by 'Service Name'.",
          "**Search:** Enter a customer name, service ID, or any system name in the route to find a specific link.",
          "**Filtering:** Use dropdowns to isolate 'MPLS' links or specific Media Types.",
        ],
        uiSteps: [
          "Grid View shows cards with Start/End points and status.",
          "Table View provides detailed columns for bandwidth and interface data.",
        ],
        techSteps: [
          "**Hook:** `useAllSystemConnectionsData` fetches `v_system_connections_complete`.",
        ],
      },
      {
        title: "2. Deep Diving",
        userSteps: [
          "Click 'Full Details' to open the connection inspector modal.",
          "Click 'View Path' to see the physical fiber trace.",
          "Click 'Go to System' to jump to the parent system's management page for editing.",
        ],
        uiSteps: [
          "This page is read-only by design to prevent accidental modification of complex routes without context.",
        ],
        techSteps: [
          "**Navigation:** Uses Next.js router to switch contexts.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 12: RINGS MANAGEMENT
  // ============================================================================
{
    value: 'ring_manager',
    icon: 'GiLinkedRings',
    title: 'Ring Manager',
    subtitle: 'Ring Association & Order',
    gradient: 'from-pink-600 to-rose-600',
    iconColor: 'text-pink-500',
    bgGlow: 'bg-pink-500/10',
    color: 'orange', // Reusing orange palette or create pink
    purpose:
      'To manage the logical membership of systems within rings, defining their sequence and hub/spur relationships.',
    workflows: [
      {
        title: '1. Ring Definition',
        userSteps: [
          'Navigate to `/dashboard/ring-manager`.',
          "Click 'Add New Ring' to create a named ring entity.",
          "Set metadata like Ring Type (Access/Aggregation) and Maintenance Area.",
        ],
        uiSteps: [
          'The list shows all rings with their active system counts.',
          'Expand a ring row to see the list of associated systems in order.',
        ],
        techSteps: [
          '**Table:** `rings` stores the parent entity.',
          '**Hook:** `useRingManagerData` fetches rings with stats.',
        ],
      },
      {
        title: '2. Adding Systems to Ring',
        userSteps: [
          "Click 'Add Systems to Ring'.",
          "**Step 1:** Select the target Ring.",
          "**Step 2:** Select the System to add (Search by Name/IP).",
          "Set 'Order in Ring' (e.g., 1.0, 2.0). Decimals (1.1) indicate spurs.",
          "Toggle 'Is Hub' if this system connects spurs to the backbone.",
          "Click 'Save' (You can queue multiple adds before saving).",
        ],
        uiSteps: [
          'Queued systems appear in a list below the form.',
          'Clicking Save performs a batch update.',
        ],
        techSteps: [
          '**RPC:** `upsert_system_with_details` handles the `ring_based_systems` association.',
        ],
      },
      {
        title: '3. Editing Associations',
        userSteps: [
          'Expand a ring row in the list.',
          "Click the 'Edit' (Pencil) icon next to a system.",
          'Update the Sequence Number or Hub Status.',
          "Click 'Remove' (Trash icon) to disassociate the system from the ring.",
        ],
        techSteps: [
          '**RPC:** `disassociate_system_from_ring` safely removes the link without deleting the system.',
        ],
      },
    ],
  },

// ============================================================================
  // MODULE 13: DIAGRAMS & FILES
  // ============================================================================
  {
    value: 'diagrams_files',
    icon: 'TfiLayoutMediaOverlayAlt',
    title: 'Diagrams & Documents',
    subtitle: 'File Storage & Management',
    gradient: 'from-slate-500 to-gray-600',
    iconColor: 'text-slate-500',
    bgGlow: 'bg-slate-500/10',
    color: 'teal',
    purpose: 'To securely store network diagrams, manuals, and site photos with folder organization.',
    workflows: [
      {
        title: '1. Folder Management',
        userSteps: [
          'Navigate to `/dashboard/diagrams`.',
          "Click 'Show Upload' to reveal the control panel.",
          "**Create:** Enter a new folder name and click 'Create'.",
          "**Delete:** Select a folder and click the trash icon (Admin only).",
        ],
        uiSteps: [
          'The file list filters automatically when a folder is selected.',
        ],
        techSteps: [
          '**Hook:** `useFolders` manages folder state via React Query.',
          '**Validation:** Prevents deleting non-empty folders (handled by DB constraint/UI check).',
        ],
      },
      {
        title: '2. Uploading Files',
        userSteps: [
          "Select a destination folder.",
          "**Simple Upload:** Drag & drop files or click to browse.",
          "**Advanced (Camera):** Switch to 'Advanced Upload' to use the webcam/camera directly.",
          "Click 'Start Upload'.",
        ],
        uiSteps: [
          'Image optimization (WebP conversion + resizing) happens client-side before upload.',
          'Progress bars show upload status.',
        ],
        techSteps: [
          '**Library:** `Uppy` handles chunked uploads.',
          '**Storage:** Files are stored in Supabase Storage/Cloudinary via `/api/upload`.',
          '**Optimization:** `smartCompress` reduces image size without quality loss.',
        ],
      },
      {
        title: '3. Viewing & Managing Files',
        userSteps: [
          'Switch between Grid and List view.',
          '**Search:** Filter files by name within the selected folder.',
          "**Action:** Click the eye icon to preview, download icon to save.",
        ],
        uiSteps: [
          'PDFs open in a new tab.',
          'Images show a thumbnail preview.',
        ],
        techSteps: [
          '**Table:** `files` linked to `folders` and `users`.',
        ],
      },
    ],
  },
  
  // ============================================================================
  // MODULE 14: UTILITIES & MAINTENANCE
  // ============================================================================
  {
    value: 'utilities',
    icon: 'Server',
    title: 'Utilities & Logs',
    subtitle: 'Import, Export, Audit & KML',
    gradient: 'from-gray-500 to-slate-600',
    iconColor: 'text-gray-400',
    bgGlow: 'bg-gray-500/10',
    color: 'yellow',
    purpose: 'Administrative tools for bulk data handling and auditing.',
    workflows: [
      {
        title: '1. Excel Bulk Import',
        userSteps: [
          "Sidebar -> Quick Actions -> 'Upload Excel'.",
          'Select file. The system maps columns automatically.',
          "Click 'Upload'.",
        ],
        uiSteps: ['Preview shows rows and validation errors.'],
        techSteps: [
          '**Hook:** `useExcelUpload` (using `xlsx`).',
          '**Config:** `constants/table-column-keys.ts` schema validation.',
        ],
      },
      {
        title: '2. Audit Logs & Diff Viewer',
        userSteps: [
          'Go to `/dashboard/audit-logs`.',
          'See list of actions (INSERT, UPDATE, DELETE).',
          "Click 'View Details' to see a JSON Diff (Before vs. After).",
        ],
        uiSteps: ['Red/Green syntax highlighting for changed fields.'],
        techSteps: [
          '**Table:** `user_activity_logs`.',
          '**Trigger:** `log_data_changes` captures old/new state.',
        ],
      },
      {
        title: '3. KML Map Overlay',
        userSteps: [
          'Go to `/dashboard/kml-manager`.',
          'Upload a `.kml` or `.kmz` file.',
          'Click the file to overlay it on the Leaflet map.',
        ],
        techSteps: [
          '**Storage:** Vercel Blob Storage via `/api/kml`.',
          '**Parsing:** `@mapbox/togeojson`.',
        ],
      },
    ],
  },
];
