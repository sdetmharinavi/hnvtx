Here is a comprehensive project overview document designed for your customer. It translates the technical complexity of the codebase into business value, explaining the **What**, **Why**, **How**, and **Benefits** of the Harinavi Transmission Maintenance Database.

***

# 📡 Harinavi Transmission Maintenance Database

### System Overview & Architectural Report

## 1. Executive Summary

This project is a **Next-Generation Progressive Web Application (PWA)** designed specifically for the management of telecom transmission networks. Unlike traditional web portals that require a constant internet connection, this system is built on a **Local-First Architecture**.

It allows field engineers to view diagrams, update inventory, and manage fiber routes even in remote locations with zero connectivity, automatically synchronizing with the central server once a connection is restored.

---

## 2. What is in this Project? (Key Modules)

The application is divided into specialized modules, secured by Role-Based Access Control (RBAC):

### 🌐 Network Infrastructure

* **Systems Management:** Manage active equipment (SDH, CPAN, MAAN) with specific port configurations.
* **Node Registry:** precise GPS tracking of all Exchanges, Towers (BTS), and Junctions.
* **Maintenance Areas:** Hierarchical organization of zones and terminals for regional management.

### ⚡ Optical Fiber (OFC) Intelligence

* **Route Manager:** A visual tool to define cable routes, insert Junction Closures (JCs), and manage physical topology.
* **Splice Matrix:** Digital twin of fiber splicing. Connect fibers 1-to-1 or perform complex cross-connects.
* **Fiber Tracing:** Click any fiber to instantly trace its path from Source to Destination across multiple hops.

### 📦 Assets & Inventory

* **Smart Inventory:** Track stock levels with "In/Out" transaction history.
* **QR Code Generation:** Generate and print QR codes for any asset to allow instant scanning and identification in the field.

### 📂 Operational Tools

* **E-File Tracking:** Digital movement register for physical office files (Initiate → Forward → Close).
* **Log Book (Diary):** Daily maintenance logs with rich text support and tagging.
* **KML Manager:** Overlay Google Earth (KML/KMZ) route data onto the application's interactive maps.

---

## 3. The "Why": Architectural Philosophy

We chose a **Local-First, Offline-Ready** architecture for specific reasons relevant to field operations:

1. **Field Reality:** Transmission maintenance often happens in areas with poor or no network coverage. A standard website would fail here.
2. **Data Integrity:** In unstable networks, data submission often fails or gets duplicated. Our system guarantees data safety.
3. **Speed:** Waiting for a server to respond for every click slows down workflow. By loading data locally, the app feels instant.

---

## 4. How It Was Built (The Development Lifecycle)

The project was constructed in distinct, logical phases to ensure stability at every step:

### Phase 1: Foundation & Security 🛡️

* **Setup:** Established Next.js 15 framework with Tailwind CSS for modern styling.
* **Auth:** Implemented robust Authentication (Login/Signup) and **Role-Based Access Control (RBAC)**.
* **Result:** Only authorized personnel (Admins, Viewers, Asset Managers) can access sensitive data.

### Phase 2: Core Infrastructure 🏗️

* **Database Schema:** Designed PostgreSQL tables for Nodes, Systems, and Employees.
* **Master Data:** Created management tools for Designations and Lookup Types (Dropdown options).
* **Result:** The "skeleton" of the network was defined.

### Phase 3: Advanced OFC Logic 🔗

* **Topology Engine:** Built logic to handle Cable Segments, Splicing, and Logical Paths.
* **Automation:** Created database triggers that automatically generate fiber strands when a cable is created.
* **Result:** Complex physical network reality mapped to digital twins.

### Phase 4: Offline Engine & Resilience 💾

* **Local Database:** Integrated **Dexie.js (IndexedDB)** to store data inside the user's browser.
* **Sync Logic:** Built the **Mutation Queue**. When a user saves data offline, it enters a queue. When internet returns, the system automatically replays these actions to the server.
* **Result:** "Airplane Mode" functionality achieved.

### Phase 5: UX & Performance Polish 🚀

* **Visualizers:** Added Leaflet Maps for geospatial data and Visual Trace tools.
* **Optimization:** Added `pg_trgm` indexes for instant search across thousands of records.
* **Feedback:** Implemented the **Network Status Bar** to clearly inform users of sync status.

---

## 5. Benefits of Following This Pattern

By adhering to this rigorous development pattern, the system offers distinct ROI (Return on Investment):

| Feature | Benefit to Customer |
| :--- | :--- |
| **Offline-First** | **Zero Downtime:** Field teams can work 24/7, regardless of network conditions. No data is ever lost due to a dropped connection. |
| **PWA (Progressive Web App)** | **Installable:** Users can install this as an app on their Android/iOS devices without going through an App Store. It behaves like a native app. |
| **Centralized Hooks** | **Stability:** We standardized how data is fetched. This means if we fix a bug in one dropdown, it is fixed everywhere. Less maintenance cost in the future. |
| **Realtime Sync** | **Collaboration:** If the Control Room updates a ticket, the Field Engineer sees it instantly without refreshing the page. |
| **Bulk Import (Excel)** | **Efficiency:** Migration of legacy data is fast. Upload thousands of assets or cable routes in seconds with built-in error checking. |
| **Audit Logging** | **Accountability:** Every action (Create, Update, Delete) is logged. You know exactly who changed what and when. |

---

## 6. How to Use the App (Quick Start)

1. **Login:** Use your credentials. If you are offline, you can still log in if you have visited before.
2. **Check Status:** Look at the bottom of the screen.
    * 🟢 **Green Check:** Online & Synced.
    * ⚫ **Dark Grey:** Offline Mode (You can still work!).
    * 🔵 **Blue Spinner:** Syncing data...
3. **Manage:** Use the Sidebar to navigate modules.
4. **Trace:** Go to **OFC Manager**, select a cable, and click the **Eye Icon** on a fiber to trace its path end-to-end.
5. **Troubleshoot:** If data seems "stuck", click the **Cloud Icon** in the header to view the Sync Queue or force a refresh.

---

### Conclusion

This system is not just a database; it is a resilient operational platform built to withstand the realities of telecom field maintenance. It prioritizes **data safety** and **user efficiency** above all else.

##  `logical_paths` and `logical_fiber_paths`  in your current architecture, they serve **two fundamentally different layers** of your network model.
- They represent the difference between **Infrastructure (Topology)** and **Services (Circuits)**.

---

### The Fundamental Difference

| Feature | `logical_paths` | `logical_fiber_paths` |
| :--- | :--- | :--- |
| **Concept** | **The Road** (Infrastructure) | **The Car** (Service/Traffic) |
| **Purpose** | Defines that a connection *exists* or is *planned* between two Systems in a Ring. | Defines the *specific fiber strands* used to carry traffic for a specific Service. |
| **Cardinality** | Usually **1** record per physical link between two systems. | **Many** records per link. You can have 10 different services (10 `logical_fiber_paths`) running over 1 `logical_path`. |
| **Complexity** | Simple: A connects to B. | Complex: Includes Working vs. Protection roles, dB Loss, Bandwidth, and specific fiber IDs. |
| **Managed In** | **Ring Manager** (Topological View) | **System Details -> Allocation** (Provisioning View) |
| **Status** | Configured / Manual | Active / Provisioned |

### Why you cannot merge them easily

If you deleted `logical_fiber_paths` and tried to stuff everything into `logical_paths`, you would hit these problems:

1.  **Multiple Services per Link:**
    *   A single cable between Node A and Node B (represented by one `logical_path`) might carry traffic for **Customer X**, **Customer Y**, and **Internal Management**.
    *   `logical_fiber_paths` allows you to have 3 separate records tracking the specific fibers (F1/F2, F3/F4, F5/F6) for those 3 services.
    *   If you only had `logical_paths`, you could only define the link once.

2.  **Working vs. Protection (1:2 Relationship):**
    *   A single Service Connection often has **two** paths: a Working path and a Protection path.
    *   Your schema handles this by creating two rows in `logical_fiber_paths` (one with `path_role='working'`, one `'protection'`) that both point to the same `system_connection_id`.
    *   `logical_paths` is designed to be a flat topology link; it doesn't handle the concept of "Redundant pairs" well.

3.  **Planning vs. Reality:**
    *   `logical_paths` allows you to design a Ring topology ("I plan to connect Hub A to Hub B") **before** you even lay the cable or splice the fibers.
    *   `logical_fiber_paths` is the record of **reality**. It is created only when you physically assign specific fiber IDs in the Allocation Modal.

### The Correct Mental Model

Think of your database tables like layers of an onion:

1.  **`ofc_cables`**: The physical plastic/glass cable in the ground.
2.  **`ofc_connections`**: The individual strands inside that cable (1-48).
3.  **`logical_paths` (Topology)**: The defined map connections. "System A talks to System B".
4.  **`system_connections` (Service Definition)**: The commercial/logical requirement. "We need 10G capacity for Customer X".
5.  **`logical_fiber_paths` (Provisioning)**: The bridge. "Customer X's 10G service (Layer 4) is travelling over Logical Path A->B (Layer 3) using Fibers 5 & 6 (Layer 2)."


**Ideally:**
1.  `logical_fiber_paths` should define the detailed circuits.
2.  `logical_paths` should act as a "Container" or "Group" for those circuits.

