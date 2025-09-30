"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/ui/card/card";
import { ScrollArea } from "@/components/common/ui/scroll-area";
import { Separator } from "@/components/common/ui/separator";
import {
  Workflow,
  ShieldCheck,
  Database,
  Route,
  GitCommit,
  GitBranch,
  User,
  Monitor,
  Zap,
  ChevronRight,
} from "lucide-react";

export default function Workflows() {
  const [open, setOpen] = useState<string | undefined>("auth");

  const sections = [
    {
      value: "auth",
      icon: ShieldCheck,
      title: "Authentication & Authorization",
      color: "from-violet-500 to-purple-600",
      iconColor: "text-violet-400",
      bgGlow: "bg-violet-500/10",
    },
    {
      value: "crud",
      icon: Database,
      title: "Standard CRUD Operations",
      color: "from-blue-500 to-cyan-600",
      iconColor: "text-blue-400",
      bgGlow: "bg-blue-500/10",
    },
    {
      value: "routes",
      icon: Route,
      title: "OFC & Route Management",
      color: "from-teal-500 to-emerald-600",
      iconColor: "text-teal-400",
      bgGlow: "bg-teal-500/10",
    },
    {
      value: "provisioning",
      icon: GitBranch,
      title: "Logical Path & Fiber Provisioning",
      color: "from-cyan-500 to-blue-600",
      iconColor: "text-cyan-400",
      bgGlow: "bg-cyan-500/10",
    },
    {
      value: "auditing",
      icon: GitCommit,
      title: "Auditing System",
      color: "from-orange-500 to-red-600",
      iconColor: "text-orange-400",
      bgGlow: "bg-orange-500/10",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-full border border-violet-500/30 backdrop-blur-sm">
            <Workflow className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-gray-300">Technical Documentation</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            System Workflows
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Comprehensive step-by-step user and technical workflows for your application
          </p>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-gray-700 to-transparent h-px" />

        {/* Accordion */}
        <Accordion
          type="single"
          collapsible
          value={open}
          onValueChange={setOpen}
          className="space-y-4"
        >
          {/* Authentication & Authorization */}
          <AccordionItem value="auth" className="border-none">
            <AccordionTrigger className="hover:no-underline group">
              <div className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-gray-800 hover:border-violet-500/50 transition-all duration-300 ${open === "auth" ? "border-violet-500/50 shadow-lg shadow-violet-500/20" : ""}`}>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${sections[0].color} ${sections[0].bgGlow}`}>
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
                    Authentication & Authorization
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">User registration, login & RBAC</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open === "auth" ? "rotate-90" : ""}`} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="To manage user registration, login, session handling, and role-based access control (RBAC)."
                workflows={[
                  {
                    title: "Workflow A: New User Registration",
                    userSteps: [
                      "User fills out the form on `/signup` and submits.",
                      "User receives a verification email.",
                      "User clicks the verification link in the email.",
                    ],
                    uiSteps: [
                      "On submit, loading state is shown.",
                      "On success, user is redirected to `/verify-email` and a toast appears.",
                      "After verification, user is redirected to the login page.",
                    ],
                    techSteps: [
                      "`SignUpPage` uses `useAuth` hook.",
                      "`signUp` function in `useAuth` calls `supabase.auth.signUp`.",
                      "Supabase creates a new user in `auth.users` with an unconfirmed email.",
                      "A database trigger (`on_auth_user_created`) automatically inserts a corresponding record into the `public.user_profiles` table.",
                      "Supabase sends the verification email.",
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
                      "Supabase verifies credentials and returns a session with a JWT.",
                      "The `supabase-ssr` client helper securely stores the session in cookies.",
                      "The `middleware.ts` refreshes the user's auth token on subsequent requests.",
                      "The `useAuthStore` (Zustand) is updated by the `onAuthStateChange` listener, making the user session globally available in the frontend.",
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
                      "The user's JWT is now minted with the new role claim, which is used by database Row-Level Security (RLS) policies to grant access.",
                    ],
                  },
                ]}
                color="violet"
              />
            </AccordionContent>
          </AccordionItem>

          {/* CRUD Operations */}
          <AccordionItem value="crud" className="border-none">
            <AccordionTrigger className="hover:no-underline group">
              <div className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-gray-800 hover:border-blue-500/50 transition-all duration-300 ${open === "crud" ? "border-blue-500/50 shadow-lg shadow-blue-500/20" : ""}`}>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${sections[1].color} ${sections[1].bgGlow}`}>
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
                    Standard CRUD Operations
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Users, Nodes, Rings & more</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open === "crud" ? "rotate-90" : ""}`} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="To provide a consistent and reusable pattern for managing core data entities across the application."
                workflows={[
                  {
                    title: "Workflow: Viewing & Filtering Data",
                    userSteps: [
                      "User navigates to a data management page like `/dashboard/nodes`.",
                      "User types in the search bar or selects a filter option.",
                    ],
                    uiSteps: [
                      "`PageHeader` shows aggregate stats (total, active, inactive).",
                      "`DataTable` displays the first page of data.",
                      "Table updates in real-time as the user types or selects filters.",
                    ],
                    techSteps: [
                      "The page component uses the `useCrudManager` hook, providing a data-fetching adapter (`useNodesData`).",
                      "`useCrudManager` manages state for pagination, search, and filters.",
                      "The data-fetching hook (`useNodesData`) calls the generic `usePagedData` hook.",
                      "`usePagedData` calls the `get_paged_data` Supabase RPC function, passing filters as a JSONB object.",
                      "The RPC function dynamically builds and executes a secure SQL query against the appropriate view (e.g., `v_nodes_complete`).",
                      "Data is returned to the `DataTable` for rendering.",
                    ],
                  },
                  {
                    title: "Workflow: Creating or Editing an Entity",
                    userSteps: [
                      "User clicks 'Add New' or the 'Edit' icon on a table row.",
                      "User fills out the form in the modal and clicks 'Save'.",
                    ],
                    uiSteps: [
                      "A modal (`NodeFormModal`) appears with a form for the entity.",
                      "Form fields are validated using Zod schemas (`nodesInsertSchema`).",
                      "On successful save, a toast notification appears and the table refreshes.",
                    ],
                    techSteps: [
                      "`useCrudManager` manages the modal state (`editModal`).",
                      "The form component (`NodeFormModal`) uses `react-hook-form` with `@hookform/resolvers/zod` for validation.",
                      "On submit, `useCrudManager`'s `handleSave` is called.",
                      "This triggers either `useTableInsert` or `useTableUpdate` from `@tanstack/react-query` hooks.",
                      "The hook performs the insert/update operation on the appropriate Supabase table (e.g., `nodes`).",
                      "On mutation success, `react-query` automatically invalidates the relevant query keys, triggering a refetch via `useCrudManager` to update the UI.",
                    ],
                  },
                ]}
                color="blue"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Route Management */}
          <AccordionItem value="routes" className="border-none">
            <AccordionTrigger className="hover:no-underline group">
              <div className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-gray-800 hover:border-teal-500/50 transition-all duration-300 ${open === "routes" ? "border-teal-500/50 shadow-lg shadow-teal-500/20" : ""}`}>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${sections[2].color} ${sections[2].bgGlow}`}>
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
                    OFC & Route Management
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Cable segmentation & fiber splicing</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open === "routes" ? "rotate-90" : ""}`} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="An advanced tool to manage the physical segmentation and fiber splicing of an optical fiber cable (OFC) route."
                workflows={[
                  {
                    title: "Workflow A: Visualizing a Route",
                    userSteps: [
                      "User selects an OFC route from the dropdown.",
                    ],
                    uiSteps: [
                      "The `RouteVisualization` component renders the start/end nodes and any existing Junction Closures (JCs).",
                      "A list of `Cable Segments` is displayed below the visualization.",
                    ],
                    techSteps: [
                      "The page component's `useQuery` fetches data from the API route `/api/route/[id]`.",
                      "The API route fetches data from multiple tables: `v_ofc_cables_complete`, `junction_closures`, and `cable_segments`.",
                      "The API returns a consolidated `RouteDetailsPayload` object.",
                    ],
                  },
                  {
                    title: "Workflow B: Adding a Junction Closure",
                    userSteps: [
                      "User clicks 'Add Junction Closure'.",
                      "User fills in the JC's name and position in the `JcFormModal` and saves.",
                    ],
                    uiSteps: [
                      "The `RouteVisualization` updates to show the new JC on the cable path.",
                      "The `Cable Segments` list is recalculated and re-rendered.",
                    ],
                    techSteps: [
                      "The `JcFormModal` calls the `add_junction_closure` Supabase RPC function.",
                      "This RPC inserts a new record into the `nodes` table (for the JC's physical location) and the `junction_closures` table.",
                      "An `AFTER INSERT` trigger on `junction_closures` fires the `recalculate_segments_for_cable` function.",
                      "This function deletes all old segments for that cable and creates new ones based on the new sequence of nodes and JCs, storing them in the `cable_segments` table.",
                      "The frontend refetches the route details, updating the UI.",
                    ],
                  },
                  {
                    title: "Workflow C: Managing Fiber Splices",
                    userSteps: [
                      "User clicks on an existing JC in the visualization.",
                      "The 'Splice Management' tab becomes active.",
                      "User selects a fiber from one segment and then clicks an available fiber on another segment to create a splice.",
                    ],
                    uiSteps: [
                      "The `FiberSpliceManager` component displays a matrix of all segments and fibers at that JC.",
                      "UI provides visual cues for selected, available, and used fibers.",
                    ],
                    techSteps: [
                      "`FiberSpliceManager` calls the `get_jc_splicing_details` RPC function to fetch the current state of all fibers and splices at the JC node.",
                      "When a splice is created, the `manage_splice` RPC function is called with `p_action: 'create'`, inserting a record into the `fiber_splices` table.",
                      "The frontend query for splicing details is invalidated and refetched, updating the UI.",
                    ],
                  },
                ]}
                color="teal"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Provisioning */}
          <AccordionItem value="provisioning" className="border-none">
            <AccordionTrigger className="hover:no-underline group">
              <div className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 ${open === "provisioning" ? "border-cyan-500/50 shadow-lg shadow-cyan-500/20" : ""}`}>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${sections[3].color} ${sections[3].bgGlow}`}>
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
                    Logical Path & Fiber Provisioning
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">End-to-end service provisioning</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open === "provisioning" ? "rotate-90" : ""}`} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="To define an end-to-end logical path over physical cable segments and provision working/protection fibers for a service."
                workflows={[
                  {
                    title: "Workflow A: Building a Logical Path",
                    userSteps: [
                      "User navigates to a System's detail page (`/dashboard/systems/[id]`).",
                      "User clicks 'Initialize Path' to create a logical path record.",
                      "In 'Build Mode', user clicks on nodes in the map to add cable segments to the path.",
                    ],
                    uiSteps: [
                      "The `SystemRingPath` component displays a map of nodes and a list of segments in the path.",
                      "The map highlights nodes in the current path.",
                    ],
                    techSteps: [
                      "Initializing inserts a new record into `logical_fiber_paths`.",
                      "Clicking a node calls the `find_cable_between_nodes` RPC to find the physical `ofc_cables` record.",
                      "A new record is inserted into `logical_path_segments`, linking the `logical_fiber_paths` ID with the `ofc_cables` ID.",
                      "The path is validated in real-time using the `validate_ring_path` RPC.",
                    ],
                  },
                  {
                    title: "Workflow B: Provisioning Fibers",
                    userSteps: [
                      "Once a valid path is built, the `FiberProvisioning` section appears.",
                      "User selects a 'Working Fiber' and a 'Protection Fiber' from the dropdowns and clicks 'Save Changes'.",
                    ],
                    uiSteps: [
                      "The dropdowns only show fibers that are continuously available across all segments of the logical path.",
                      "After saving, the UI switches to a read-only view showing the provisioned fibers.",
                    ],
                    techSteps: [
                      "The `useAvailableFibers` hook calls the `get_continuous_available_fibers` RPC, which finds common unallocated fiber numbers across all `ofc_connections` in the path.",
                      "Saving calls the `provision_ring_path` RPC.",
                      "This RPC creates two new `logical_fiber_paths` records (one for working, one for protection) and then updates the `logical_path_id` and `fiber_role` columns on all relevant `ofc_connections` records.",
                      "This atomically allocates the fibers to the service.",
                    ],
                  },
                ]}
                color="cyan"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Auditing */}
          <AccordionItem value="auditing" className="border-none">
            <AccordionTrigger className="hover:no-underline group">
              <div className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm border border-gray-800 hover:border-orange-500/50 transition-all duration-300 ${open === "auditing" ? "border-orange-500/50 shadow-lg shadow-orange-500/20" : ""}`}>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${sections[4].color} ${sections[4].bgGlow}`}>
                  <GitCommit className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
                    Auditing System
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Automatic change tracking & logging</p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open === "auditing" ? "rotate-90" : ""}`} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="To automatically log all data modifications (INSERT, UPDATE, DELETE) for accountability and history tracking."
                workflows={[
                  {
                    title: "Workflow: Automatic Data Change Logging",
                    userSteps: [
                      "An admin edits and saves an employee's profile.",
                    ],
                    uiSteps: [
                      "The change is reflected in the UI as usual.",
                      "An admin with permission can view the change log in the 'User Activity' section.",
                    ],
                    techSteps: [
                      "The `UPDATE` operation on the `employees` table completes.",
                      "An `AFTER UPDATE` trigger (`employees_log_trigger`) on the table fires automatically.",
                      "The trigger executes the `log_data_changes()` function.",
                      "This function captures the `OLD` and `NEW` row data, converts them to JSONB, and determines the operation type ('UPDATE').",
                      "It then calls `log_user_activity()`, passing the captured data.",
                      "The `log_user_activity()` function inserts a new record into the `user_activity_logs` table, including the current user's ID (`auth.uid()`) and role (`get_my_role()`).",
                      "The entire process is atomic and happens within the same database transaction as the original update.",
                    ],
                  },
                ]}
                color="orange"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function WorkflowCard({
  purpose,
  workflows,
  color,
}: {
  purpose: string;
  workflows: {
    title: string;
    userSteps: string[];
    uiSteps: string[];
    techSteps: string[];
  }[];
  color: string;
}) {
  const colorMap: Record<string, { border: string; glow: string; badge: string }> = {
    violet: {
      border: "border-violet-500/30",
      glow: "shadow-violet-500/10",
      badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    },
    blue: {
      border: "border-blue-500/30",
      glow: "shadow-blue-500/10",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    teal: {
      border: "border-teal-500/30",
      glow: "shadow-teal-500/10",
      badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    },
    cyan: {
      border: "border-cyan-500/30",
      glow: "shadow-cyan-500/10",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
    orange: {
      border: "border-orange-500/30",
      glow: "shadow-orange-500/10",
      badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
  };

  const colors = colorMap[color];

  return (
    <Card className={`mt-4 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm border ${colors.border} ${colors.glow} shadow-2xl`}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
            <Workflow className={`w-5 h-5 ${color === 'violet' ? 'text-violet-400' : color === 'blue' ? 'text-blue-400' : color === 'teal' ? 'text-teal-400' : color === 'cyan' ? 'text-cyan-400' : 'text-orange-400'}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-100 mb-2">Purpose</CardTitle>
            <p className="text-gray-400 text-sm leading-relaxed">{purpose}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-[600px] rounded-xl border border-gray-800/50 bg-gray-950/50 backdrop-blur-sm">
          <div className="p-6 space-y-8">
            {workflows.map((wf, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${colors.badge}`}>
                    Workflow {String.fromCharCode(65 + i)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 flex-1">
                    {wf.title.replace(/^Workflow [A-Z]: /, '')}
                  </h3>
                </div>

                <div className="space-y-4 pl-4 border-l-2 border-gray-800/50">
                  {/* User Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-gray-200">User Actions</h4>
                    </div>
                    <ul className="space-y-2 ml-6">
                      {wf.userSteps.map((s, j) => (
                        <li key={j} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* UI Response */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-semibold text-gray-200">System Response (UI)</h4>
                    </div>
                    <ul className="space-y-2 ml-6">
                      {wf.uiSteps.map((s, j) => (
                        <li key={j} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical Flow */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-semibold text-gray-200">Technical Flow</h4>
                    </div>
                    <ul className="space-y-2 ml-6">
                      {wf.techSteps.map((s, j) => (
                        <li key={j} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          <span dangerouslySetInnerHTML={{ 
                            __html: s.replace(
                              /`([^`]+)`/g, 
                              '<code class="bg-gray-800/80 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-700/50">$1</code>'
                            ) 
                          }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {i < workflows.length - 1 && (
                  <Separator className="bg-gradient-to-r from-transparent via-gray-800 to-transparent my-6" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}