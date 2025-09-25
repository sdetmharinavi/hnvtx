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
          {/* 1. Authentication */}
          <AccordionItem value="auth">
            <AccordionTrigger className="text-xl font-semibold">
              <ShieldCheck className="w-5 h-5 mr-2 text-indigo-400" />
              Authentication (`/login`, `/signup`, etc.)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="To manage user access, registration, and account recovery securely."
                workflows={[
                  {
                    title: "Workflow A: User Login",
                    userSteps: [
                      "User enters email/password on `/login` and clicks Sign in.",
                    ],
                    uiSteps: [
                      "Loading indicator shows, redirect on success.",
                      "Error toast shown on failure.",
                    ],
                    techSteps: [
                      "`LoginPage.handleSubmit` calls `signIn`.",
                      "`useAuth` sets Zustand `authState`.",
                      "Supabase `signInWithPassword` sets cookie.",
                      "`onAuthStateChange` updates Zustand user/session.",
                      "Success → dashboard, Fail → toast.",
                    ],
                  },
                  {
                    title: "Workflow B: User Registration (Sign Up)",
                    userSteps: [
                      "User fills signup form → clicks Create account.",
                    ],
                    uiSteps: [
                      "Loading shown → redirect to `/verify-email` + success toast.",
                    ],
                    techSteps: [
                      "`SignUpPage.onSubmit` → calls `signUp`.",
                      "Supabase `signUp` → unconfirmed user + email sent.",
                      "DB Trigger `on_auth_user_created` → inserts into `user_profiles`.",
                      "Router navigates to confirmation.",
                    ],
                  },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 2. User Management */}
          <AccordionItem value="users">
            <AccordionTrigger className="text-xl font-semibold">
              <Users className="w-5 h-5 mr-2 text-green-400" />
              User Management (`/dashboard/users`)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="Allows administrators to view, manage, and modify user profiles."
                workflows={[
                  {
                    title: "Workflow A: Viewing & Filtering Users",
                    userSteps: [
                      "Admin navigates to `/dashboard/users`.",
                    ],
                    uiSteps: [
                      "`DataTable` shows paginated users.",
                    ],
                    techSteps: [
                      "`AdminUsersPage` → `useCrudManager`.",
                      "`useUsersData` → RPC `admin_get_all_users_extended`.",
                      "View returns user data with counts.",
                      "`DataTable` renders.",
                    ],
                  },
                  {
                    title: "Workflow B: Creating a New User",
                    userSteps: ["Admin clicks Add New, fills modal."],
                    uiSteps: ["Modal opens, form submitted → list updates."],
                    techSteps: [
                      "`handleCreateUser` → `useAdminCreateUser` → `/api/admin/users`.",
                      "Uses Supabase Admin Client with SERVICE_ROLE_KEY.",
                      "Inserts into `auth.users` and fires trigger to create `user_profiles`.",
                      "Success → refetch, UI updates.",
                    ],
                  },
                  {
                    title: "Workflow C: Bulk Updating Roles",
                    userSteps: ["Admin selects users, sets new role."],
                    uiSteps: ["Loading → roles updated in table."],
                    techSteps: [
                      "`bulkUpdateRole` mutation → RPC `admin_bulk_update_role`.",
                      "Updates `user_profiles`.",
                      "Trigger `sync_user_role_trigger` syncs `auth.users` role claims.",
                    ],
                  },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 3. Base Structure */}
          <AccordionItem value="base">
            <AccordionTrigger className="text-xl font-semibold">
              <Database className="w-5 h-5 mr-2 text-blue-400" />
              Base Structure (Nodes, Rings, Areas, Designations)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="Manage foundational master data of the network with CRUD flows."
                workflows={[
                  {
                    title: "Example Workflow: Nodes Page (`/dashboard/nodes`)",
                    userSteps: [
                      "User navigates to `/dashboard/nodes`.",
                      "Clicks Add New or Delete.",
                    ],
                    uiSteps: [
                      "Page shows stats header + DataTable.",
                      "Modal opens for add/edit.",
                      "ConfirmModal for delete.",
                    ],
                    techSteps: [
                      "`NodesPage` → `useCrudManager` → `usePagedNodesComplete` RPC.",
                      "`NodeFormModal` uses Zod validation + mutations.",
                      "Insert/Update/Delete on `nodes` table in Supabase.",
                      "Success → refetch and refresh UI.",
                    ],
                  },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 4. System Details */}
          <AccordionItem value="systems">
            <AccordionTrigger className="text-xl font-semibold">
              <Network className="w-5 h-5 mr-2 text-purple-400" />
              System Details (`/dashboard/systems/[id]`)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="Detailed dashboard for a system and interface for building logical ring paths."
                workflows={[
                  {
                    title: "Workflow: Building Logical Ring Path",
                    userSteps: [
                      "User opens system detail page.",
                      "Clicks Initialize Path, Add Segment, Assign Fibers.",
                    ],
                    uiSteps: [
                      "Shows Initialize Path button if empty.",
                      "Path builder UI loads.",
                      "FiberProvisioning dropdowns show available fibers.",
                    ],
                    techSteps: [
                      "`SystemRingPath` queries `logical_fiber_paths`.",
                      "Insert new record on init.",
                      "Segments added via `logical_path_segments` table.",
                      "`get_continuous_available_fibers` RPC → fiber list.",
                      "`provision_ring_path` RPC → creates working & protection paths.",
                    ],
                  },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 5. Diagrams */}
          <AccordionItem value="diagrams">
            <AccordionTrigger className="text-xl font-semibold">
              <FileText className="w-5 h-5 mr-2 text-yellow-400" />
              Diagrams / File Management (`/dashboard/diagrams`)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="Provide document management for network diagrams and files."
                workflows={[
                  {
                    title: "Workflow: Uploading a File",
                    userSteps: [
                      "User selects folder, drags file, clicks Upload.",
                    ],
                    uiSteps: [
                      "File shows with progress bar in Uppy UI.",
                    ],
                    techSteps: [
                      "`useFolders` manages folder state.",
                      "`useUppyUploader` preprocesses images before upload.",
                      "API `/api/upload` streams file to storage.",
                      "Success → insert into `files` table with metadata.",
                    ],
                  },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 6. OFC Pages */}
          <AccordionItem value="ofc">
            <AccordionTrigger className="text-xl font-semibold">
              <Cable className="w-5 h-5 mr-2 text-red-400" />
              OFC Cables (`/dashboard/ofc`)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="Inventory of all Optical Fiber Cables in the network."
                workflows={[
                  {
                    title: "Workflow A: Viewing & Navigating",
                    userSteps: ["User opens `/dashboard/ofc`."],
                    uiSteps: ["Table shows paginated OFC cables."],
                    techSteps: [
                      "`OfcPage` → `useOfcData` → `get_paged_ofc_cables_complete` RPC.",
                    ],
                  },
                  {
                    title: "Workflow B: Searching & Filtering",
                    userSteps: ["User types search or filter active cables."],
                    uiSteps: ["Table updates with filtered results."],
                    techSteps: [
                      "Filters → `serverFilters` JSON → RPC applies WHERE filters.",
                    ],
                  },
                  {
                    title: "Workflow C: Creating a New Cable",
                    userSteps: ["User clicks Add New, fills form."],
                    uiSteps: ["`OfcForm` modal appears, auto-fills capacity."],
                    techSteps: [
                      "Form → `useRouteGeneration` auto-creates unique route_name.",
                      "Insert into `ofc_cables` table, trigger refetch.",
                    ],
                  },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 7. Route Manager */}
          <AccordionItem value="routes">
            <AccordionTrigger className="text-xl font-semibold">
              <Route className="w-5 h-5 mr-2 text-teal-400" />
              Route Manager (`/dashboard/route-manager`)
            </AccordionTrigger>
            <AccordionContent>
              <WorkflowCard
                purpose="Advanced tool to evolve cable routes with JCs and splicing."
                workflows={[
                  {
                    title: "Workflow A: Adding a Junction Closure",
                    userSteps: ["User selects route, clicks Add JC."],
                    uiSteps: ["RouteVisualizer updates with JC position."],
                    techSteps: [
                      "`add_junction_closure` RPC inserts JC.",
                      "Trigger → `create_cable_segments_on_jc_add` recreates segments.",
                    ],
                  },
                  {
                    title: "Workflow B: Managing Splices in JC",
                    userSteps: ["User clicks JC, opens Fiber Splice Manager."],
                    uiSteps: ["UI shows splice matrix, dropdown for fibers."],
                    techSteps: [
                      "`get_jc_splicing_details` RPC fetches fibers.",
                      "`auto_splice_straight` RPC bulk creates splices.",
                      "`manage_splice` RPC inserts/updates specific splice.",
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
                      <li key={j}>{s}</li>
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
