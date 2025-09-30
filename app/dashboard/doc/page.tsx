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
  Users,
  Database,
  Network,
  FileText,
  Cable,
  Route,
  GitCommit,
  GitBranch,
} from "lucide-react";

export default function Workflows() {
  const [open, setOpen] = useState<string | undefined>("auth");

  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-white">
          Step-by-step User & Technical Workflows
        </h1>
        <Separator className="bg-gray-700" />

        <Accordion
          type="single"
          collapsible
          value={open}
          onValueChange={setOpen}
          className="space-y-4"
        >
          {/* 1. Authentication & Authorization */}
          <AccordionItem value="auth">
            <AccordionTrigger className="text-xl font-semibold">
              <ShieldCheck className="w-5 h-5 mr-2 text-indigo-400" />
              Authentication & Authorization
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
              />
            </AccordionContent>
          </AccordionItem>

          {/* 2. User & Core Data Management */}
          <AccordionItem value="crud">
            <AccordionTrigger className="text-xl font-semibold">
              <Database className="w-5 h-5 mr-2 text-blue-400" />
              Standard CRUD (Users, Nodes, Rings, etc.)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="To provide a consistent and reusable pattern for managing core data entities across the application."
                workflows={[
                  {
                    title: "Workflow: Viewing & Filtering Data (e.g., `/dashboard/nodes`)",
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
              />
            </AccordionContent>
          </AccordionItem>

          {/* 3. OFC & Route Management */}
          <AccordionItem value="routes">
            <AccordionTrigger className="text-xl font-semibold">
              <Route className="w-5 h-5 mr-2 text-teal-400" />
              OFC & Route Management (`/dashboard/route-manager`)
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
                    title: "Workflow B: Adding a Junction Closure (Route Evolution)",
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
              />
            </AccordionContent>
          </AccordionItem>

          {/* 4. Logical Path & Fiber Provisioning */}
          <AccordionItem value="provisioning">
            <AccordionTrigger className="text-xl font-semibold">
              <GitBranch className="w-5 h-5 mr-2 text-cyan-400" />
              Logical Path & Fiber Provisioning
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
              />
            </AccordionContent>
          </AccordionItem>
          
          {/* 5. Auditing */}
          <AccordionItem value="auditing">
            <AccordionTrigger className="text-xl font-semibold">
              <GitCommit className="w-5 h-5 mr-2 text-orange-400" />
              Auditing System
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
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

/* Helper Component to render workflows */
function WorkflowCard({
  purpose,
  workflows,
}: {
  purpose: string;
  workflows: {
    title: string;
    userSteps: string[];
    uiSteps: string[];
    techSteps: string[];
  }[];
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200">Purpose</CardTitle>
      </CardHeader>
      <CardContent className="text-gray-400">{purpose}</CardContent>

      <ScrollArea className="h-[500px] mt-4 rounded-lg border border-gray-800 bg-gray-950">
        <div className="p-4 space-y-6">
          {workflows.map((wf, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-indigo-400" /> {wf.title}
              </h3>
              <ul className="list-decimal ml-6 space-y-2 text-gray-300">
                <li>
                  <strong>User Action:</strong>
                  <ul className="list-disc ml-6 text-sm text-gray-400 space-y-1">
                    {wf.userSteps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                </li>
                <li>
                  <strong>System Response (UI):</strong>
                  <ul className="list-disc ml-6 text-sm text-gray-400 space-y-1">
                    {wf.uiSteps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                </li>
                <li>
                  <strong>Technical Flow:</strong>
                  <ul className="list-disc ml-6 text-sm text-gray-400 space-y-1">
                    {wf.techSteps.map((s, j) => (
                      <li key={j} dangerouslySetInnerHTML={{ __html: s.replace(/`([^`]+)`/g, '<code class=\"bg-gray-800 text-yellow-300 px-1 py-0.5 rounded text-xs\">$1</code>') }} />
                    ))}
                  </ul>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}