// path: components/doc/data/workflowData.ts
import { WorkflowSection } from "../types/workflowTypes";

export const workflowSections: WorkflowSection[] = [
  // ============================================================================
  // MODULE 1: AUTHENTICATION & USER MANAGEMENT
  // ============================================================================
  {
    value: "auth_onboarding",
    icon: "ShieldCheck",
    title: "Authentication & Users",
    subtitle: "Security, Roles & Profiles",
    gradient: "from-violet-500 to-purple-600",
    iconColor: "text-violet-400",
    bgGlow: "bg-violet-500/10",
    color: "violet",
    purpose: "To manage user identities, secure sessions via Supabase Auth, and enforce Role-Based Access Control (RBAC).",
    workflows: [
      {
        title: "1. Registration & Onboarding",
        userSteps: [
          "Navigate to `/signup`.",
          "Enter Email, Password, First Name, and Last Name. Click 'Create Account'.",
          "Check email inbox for verification link. Click it to verify.",
          "Log in. If this is your first time, the `OnboardingPromptModal` appears.",
          "Click 'Update Profile' to add Phone Number and Address.",
        ],
        uiSteps: [
          "Redirects to `/verify-email` after signup.",
          "Redirects to `/dashboard` after login.",
          "The onboarding modal persists until the user completes the profile or clicks 'Don't show again'.",
        ],
        techSteps: [
          "**Database Trigger:** `on_auth_user_created` automatically inserts a row into `public.user_profiles`.",
          "**Context:** `UserProvider` fetches `v_user_profiles_extended` to check `preferences->needsOnboarding`.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 2: BASE MASTER DATA (Setup)
  // ============================================================================
  {
    value: "base_structure",
    icon: "Database",
    title: "Base Master Data",
    subtitle: "Lookups, Areas & Designations",
    gradient: "from-cyan-500 to-blue-600",
    iconColor: "text-cyan-400",
    bgGlow: "bg-cyan-500/10",
    color: "cyan",
    purpose: "To configure the foundational hierarchies and data dictionaries required before any network assets can be created.",
    workflows: [
      {
        title: "1. Managing Categories & Lookups",
        userSteps: [
          "Go to `/dashboard/categories`.",
          "Click 'Add New Category' (e.g., 'SYSTEM_CAPACITY').",
          "Navigate to `/dashboard/lookup`.",
          "Select the new Category from the dropdown.",
          "Click 'Add New' to add options (e.g., '10G', 'STM-16').",
        ],
        uiSteps: [
          "The Category page auto-formats input to `UPPER_SNAKE_CASE`.",
          "The Lookups table allows sorting by 'Sort Order' to control dropdown lists elsewhere in the app.",
        ],
        techSteps: [
          "**Table:** `lookup_types`. The `category` column acts as the grouper.",
          "**Validation:** Checks for `is_system_default` flag to prevent deletion of critical system types.",
        ],
      },
      {
        title: "2. Designation Hierarchy (Tree)",
        userSteps: [
          "Go to `/dashboard/designations`.",
          "Click 'Add New' to create a root role (e.g., 'General Manager').",
          "Click 'Add New' again, create 'DGM', and select 'General Manager' as Parent.",
          "Toggle 'Tree View' to visualize the organizational chart.",
        ],
        uiSteps: [
          "The `EntityManagementComponent` renders a recursive tree structure.",
          "Expand/Collapse buttons show/hide child designations.",
        ],
        techSteps: [
          "**Hook:** `useDesignationsData` constructs the tree client-side from a flat list.",
          "**Table:** `employee_designations` using a self-referencing `parent_id`.",
        ],
      },
      {
        title: "3. Maintenance Areas (Geo-Hierarchy)",
        userSteps: [
          "Go to `/dashboard/maintenance-areas`.",
          "Create a 'Zone' (Top Level).",
          "Create a 'Terminal' and assign it to the Zone (Parent).",
          "Enter GPS coordinates for the office location.",
        ],
        uiSteps: [
          "Details panel shows contact info and hierarchy ('Child of: Zone A').",
        ],
        techSteps: [
          "**Table:** `maintenance_areas`.",
          "**Usage:** These IDs are later used in `nodes` and `systems` to assign ownership.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 3: CORE INFRASTRUCTURE (Physical Layer)
  // ============================================================================
  {
    value: "core_infrastructure",
    icon: "MapPin",
    title: "Physical Infrastructure",
    subtitle: "Nodes, OFC Routes & Topology",
    gradient: "from-teal-500 to-emerald-600",
    iconColor: "text-teal-400",
    bgGlow: "bg-teal-500/10",
    color: "teal",
    purpose: "To map the physical reality of the network: Where nodes are located and how physical cables connect them.",
    workflows: [
      {
        title: "1. Creating Network Nodes",
        userSteps: [
          "Go to `/dashboard/nodes`.",
          "Click 'Add New'.",
          "Enter Node Name (e.g., 'Harinavi Exch'), Select Type (e.g., 'Exchange') and Maintenance Area.",
          "Enter Latitude/Longitude (Required for maps).",
          "Click 'Create Node'.",
        ],
        uiSteps: [
          "Validates coordinates are numbers.",
          "Success toast appears.",
        ],
        techSteps: [
          "**Hook:** `useNodesData` (Offline-first).",
          "**Table:** `nodes`.",
          "**View:** `v_nodes_complete` is refreshed.",
        ],
      },
      {
        title: "2. OFC Route Creation",
        userSteps: [
          "Go to `/dashboard/ofc` -> 'Add New'.",
          "Select 'Start Node' and 'End Node'.",
          "Select 'OFC Type' (e.g., 24F). Capacity is auto-locked.",
          "Click 'Create'.",
        ],
        uiSteps: [
          "The system auto-generates a route name: `StartNode⇔EndNode_1`.",
          "Shows a warning if a route already exists between these nodes.",
        ],
        techSteps: [
          "**Trigger:** `create_initial_connections_for_cable` fires on insert.",
          "**Automation:** It automatically generates `N` rows in `ofc_connections` (where N=Capacity).",
        ],
      },
      {
        title: "3. Route Topology (JCs)",
        userSteps: [
          "In OFC List, click 'View Details' -> 'Route Visualization' tab.",
          "Click 'Add Junction Closure'.",
          "Select a 'Joint' node from the dropdown and enter 'Position (KM)'.",
          "Click 'Save'.",
        ],
        uiSteps: [
          "The linear graph redraws. The cable line is split visually by the new JC icon.",
          "Segment list below updates: 'Segment 1' and 'Segment 2'.",
        ],
        techSteps: [
          "**RPC:** `add_junction_closure`.",
          "**Trigger:** `manage_cable_segments` fires. It calls `recalculate_segments_for_cable` which splits the cable into `cable_segments` based on JC positions.",
        ],
      },
      {
        title: "4. Fiber Splicing",
        userSteps: [
          "In Route Visualization, click a JC icon.",
          "Switch tab to 'Splice Management'.",
          "**Manual:** Click Fiber 1 on Left (Incoming) -> Click Fiber 1 on Right (Outgoing) -> 'Confirm'.",
          "**Auto:** Click 'Auto-Splice' between two segments -> 'Confirm'.",
          "**Important:** After this, go to `/dashboard/ofc/id` open ***Trace Fiber Path*** and click ***Sync Path to DB***.",
        ],
        uiSteps: [
          "Visual lines connect the fiber indicators.",
          "Colors change to indicate 'Occupied'.",
        ],
        techSteps: [
          "**RPC:** `manage_splice` (for single) or `auto_splice_straight_segments` (for bulk).",
          "**Table:** `fiber_splices`. Tracks which segment-fiber connects to which segment-fiber.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 4: SYSTEMS & RINGS MANAGEMENT
  // ============================================================================
  {
    value: "systems_rings",
    icon: "Server",
    title: "Systems & Rings",
    subtitle: "Equipment, Logic & Automation",
    gradient: "from-blue-500 to-indigo-600",
    iconColor: "text-blue-400",
    bgGlow: "bg-blue-500/10",
    color: "blue",
    purpose: "To manage the physical and logical network equipment (Systems), their capacities, and their organization into Rings.",
    workflows: [
      {
        title: "1. Creating Systems",
        userSteps: [
          "Go to `/dashboard/systems` -> 'Add New'.",
          "Enter Name, Select Node, and IP Address.",
          "Select 'System Type' (e.g., 'CPAN').",
          "If Type is 'Ring-Based', select the Ring immediately in step 2.",
        ],
        uiSteps: [
          "Multi-step modal handles complex relationships.",
        ],
        techSteps: [
          "**RPC:** `upsert_system_with_details` handles the transaction of creating the system and linking it to `ring_based_systems` if needed.",
        ],
      },
      {
        title: "2. Port Automation",
        userSteps: [
          "On a System row, click 'Manage Ports' (Server Icon).",
          "Click 'Apply Template'.",
          "Select a configuration (e.g., 'A1 Config - 2 Slots').",
          "Click 'Apply'.",
        ],
        uiSteps: [
          "The table populates with 20+ ports instantly.",
          "Ports are named naturally (1.1, 1.2, etc.).",
        ],
        techSteps: [
          "**Config:** `PORT_TEMPLATES` in `config/port-templates.ts`.",
          "**Hook:** `useTableBulkOperations.bulkUpsert` sends the batch to `ports_management`.",
        ],
      },
      {
        title: "3. Ring Topology & Maps",
        userSteps: [
          "Go to `/dashboard/rings`. Click a Ring Name.",
          "**Map View:** See systems plotted on a map.",
          "**Schematic View:** Click toggle to see a logical diagram (Hubs in center).",
          "Click 'Configure Topology' to logically break connections.",
        ],
        uiSteps: [
          "Leaflet map renders with custom icons based on equipment type.",
        ],
        techSteps: [
          "**View:** `v_ring_nodes` aggregates geo-data.",
          "**Logic:** `ClientRingMap.tsx` draws lines sequentially based on `order_in_ring`.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 5: SERVICE PROVISIONING
  // ============================================================================
  {
    value: "provisioning_flow",
    icon: "GitBranch",
    title: "Service Provisioning",
    subtitle: "End-to-End Path Allocation",
    gradient: "from-orange-500 to-red-500",
    iconColor: "text-orange-400",
    bgGlow: "bg-orange-500/10",
    color: "orange",
    purpose: "To create logical circuits and reserve specific fiber strands across the network.",
    workflows: [
      {
        title: "1. Connection Creation",
        userSteps: [
          "Open a System -> Click 'New Connection'.",
          "Select Destination System and Media Type.",
          "Select specific Ports (Tx/Rx) on both ends.",
          "Status defaults to 'Pending'.",
        ],
        uiSteps: [
          "Dropdowns filter ports to show only those available.",
          "UI Note: If no 'Start Node' is selected, the source system defaults as 'End A' automatically.",
        ],
        techSteps: [
          "**RPC:** `upsert_system_connection_with_details`.",
        ],
      },
      {
        title: "2. Fiber Allocation Wizard",
        userSteps: [
          "Click 'Allocate Fibers' on the connection.",
          "The Modal shows 'Working Path' and optional 'Protection Path'.",
          "**Step 1:** Select the Cable leaving Source.",
          "**Step 2:** Select Fiber Strand.",
          "**Step 3 (Cascade):** If the cable ends at a transit node, select the *next* cable and fiber.",
          "Repeat until Destination is reached. Click 'Confirm'.",
        ],
        uiSteps: [
          "Dropdowns filter to show only *Available* fibers.",
          "UI validates continuity.",
        ],
        techSteps: [
          "**RPC:** `provision_service_path`.",
          "**Logic:** Creates `logical_fiber_paths` and updates `ofc_connections` rows to 'occupied'.",
        ],
      },
      {
        title: "3. Fiber Tracing",
        userSteps: [
          "Click 'View Path' (Eye Icon) on a provisioned connection.",
          "See a step-by-step list: System -> Cable 1 -> Splice -> Cable 2 -> System.",
          "Shows accumulated loss (dB) and distance.",
        ],
        techSteps: [
          "**RPC:** `trace_fiber_path` uses a recursive SQL query (CTE) to traverse `fiber_splices` and `cable_segments`.",
        ],
      },
      {
        title: "4. Viewing Connection Details",
        userSteps: [
          "In the Systems list or Connections table, click 'Full Details' (Monitor Icon).",
          "A comprehensive modal opens showing Circuit Info, End A/B details, and mapped OFC data.",
        ],
        uiSteps: [
          "The 'End A & End B Details' table dynamically displays connection points.",
          "If End A (Start Node) is not explicitly defined in the database, the UI intelligently falls back to display the Parent System's Name and IP Address.",
        ],
        techSteps: [
          "**Component:** `SystemConnectionDetailsModal`.",
          "**Logic:** Uses `useTableRecord` to fetch the parent system and populate missing `sn_ip` or `sn_name` fields on the fly.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 6: INVENTORY & ASSETS
  // ============================================================================
  {
    value: "inventory_assets",
    icon: "Cpu",
    title: "Inventory Management",
    subtitle: "Assets, Tracking & QR Codes",
    gradient: "from-indigo-500 to-purple-500",
    iconColor: "text-indigo-400",
    bgGlow: "bg-indigo-500/10",
    color: "violet",
    purpose: "To track physical stock and generate labels.",
    workflows: [
      {
        title: "1. Asset Tracking",
        userSteps: [
          "Go to `/dashboard/inventory`.",
          "Click 'Add New'.",
          "Enter 'Asset No', Name, Quantity.",
          "Select 'Location' (Node) and 'Functional Location' (Area).",
          "Save.",
        ],
        uiSteps: [
          "Search bar allows filtering by Asset No or Name.",
        ],
        techSteps: [
          "**Hook:** `useInventoryData`.",
          "**View:** `v_inventory_items` joins location IDs to names.",
        ],
      },
      {
        title: "2. QR Code Generation",
        userSteps: [
          "In the Inventory list, click the 'QR Code' icon on an item.",
          "A new page opens displaying a large QR code containing asset details.",
          "Click 'Print QR Code'.",
        ],
        uiSteps: [
          "The print view hides navigation/sidebars, printing only the label.",
        ],
        techSteps: [
          "**Library:** `qrcode.react`.",
          "**Route:** `/dashboard/inventory/qr/[id]`.",
          "**CSS:** `@media print` styles ensure clean label printing.",
        ],
      },
    ],
  },

  // ============================================================================
  // MODULE 7: UTILITIES & MAINTENANCE
  // ============================================================================
  {
    value: "utilities",
    icon: "Server",
    title: "Utilities & Logs",
    subtitle: "Import, Export, Audit & KML",
    gradient: "from-gray-500 to-slate-600",
    iconColor: "text-gray-400",
    bgGlow: "bg-gray-500/10",
    color: "yellow",
    purpose: "Administrative tools for bulk data handling and auditing.",
    workflows: [
      {
        title: "1. Excel Bulk Import",
        userSteps: [
          "Sidebar -> Quick Actions -> 'Upload Excel'.",
          "Select file. The system maps columns automatically.",
          "Click 'Upload'.",
        ],
        uiSteps: [
          "Preview shows rows and validation errors.",
        ],
        techSteps: [
          "**Hook:** `useExcelUpload` (using `xlsx`).",
          "**Config:** `constants/table-column-keys.ts` schema validation.",
        ],
      },
      {
        title: "2. Audit Logs & Diff Viewer",
        userSteps: [
          "Go to `/dashboard/audit-logs`.",
          "See list of actions (INSERT, UPDATE, DELETE).",
          "Click 'View Details' to see a JSON Diff (Before vs. After).",
        ],
        uiSteps: [
          "Red/Green syntax highlighting for changed fields.",
        ],
        techSteps: [
          "**Table:** `user_activity_logs`.",
          "**Trigger:** `log_data_changes` captures old/new state.",
        ],
      },
      {
        title: "3. KML Map Overlay",
        userSteps: [
          "Go to `/dashboard/kml-manager`.",
          "Upload a `.kml` or `.kmz` file.",
          "Click the file to overlay it on the Leaflet map.",
        ],
        techSteps: [
          "**Storage:** Vercel Blob Storage via `/api/kml`.",
          "**Parsing:** `@mapbox/togeojson`.",
        ],
      },
    ],
  },
];