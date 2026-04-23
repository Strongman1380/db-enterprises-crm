# Implementation Plan: DB Enterprises Invoice & CRM

## Project Overview
Develop a high-end, automated CRM and Invoicing application for **DB Enterprises**. The system will streamline lead capture from web forms and chatbots, manage a centralized contact list for marketing, and automate job estimation and invoice generation based on square footage and material costs.

## Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Framer Motion (Animations) + GSAP (Advanced UI)
- **Backend/Database**: Firebase (Firestore, Authentication)
- **Functions**: Firebase Cloud Functions (for Lead Capture API)
- **Invoicing**: jsPDF / React-PDF (Client-side generation)
- **Icons**: Lucide React

---

## Phase 1: Foundation & Architecture
1.  **Project Initialization**
    - Scaffold Vite project with React and Tailwind.
    - Setup folder structure: `src/components`, `src/hooks`, `src/services`, `src/pages`.
2.  **Firebase Integration**
    - Initialize Firebase project `db-enterprises-crm`.
    - Configure Firestore for three main collections:
        - `contacts`: Lead info, communication history, marketing tags.
        - `jobs`: Project details, dimensions (SqFt), rates, materials.
        - `invoices`: Linked to jobs, payment status, PDF metadata.
    - Enable Firebase Authentication (Email/Password for owner access).
3.  **Global State & Routing**
    - Implement React Router for Dashboard, CRM, and Invoicing views.
    - Use Context API or Zustand for lightweight state management.

## Phase 2: CRM & Lead Management
1.  **Unified Lead Capture API**
    - Create a Firebase Cloud Function (HTTPS trigger) to serve as a webhook.
    - Integrate the website chatbot and contact forms to POST data to this endpoint.
    - Logic to check for existing contacts and update or create new ones.
2.  **Contacts Dashboard**
    - Searchable list of all leads and customers.
    - "Marketing Blast" feature: Filter contacts by tag and export for email/social campaigns.
    - Activity feed for each contact (captured from chatbot/form submissions).

## Phase 3: Automated Invoicing & Job Calculator
1.  **The "Job Builder" Component**
    - Dynamic inputs:
        - **Area Calculation**: `Length * Width` or direct `Square Feet`.
        - **Rate Logic**: `SqFt * BaseRate`.
        - **Materials & Misc**: Dynamic line items for material costs, labor, and surcharges.
    - Real-time total calculation.
2.  **Invoice Generation**
    - Template design following DB Enterprises branding (Navy, Ivory, Gold).
    - One-click "Generate Invoice" button.
    - Automated PDF creation with professional layout, logo, and business details.
3.  **Status Tracking**
    - Dashboard widget for "Draft", "Sent", and "Paid" invoices.

## Phase 4: Premium Design Implementation
1.  **Brand Integration**
    - Use the established palette:
        - Primary: Navy `#16324F`
        - Accent: Muted Gold `#C8A96B`
        - Background: Ivory `#F7F5F0`
        - Text: Charcoal `#22262B`
2.  **UI/UX Excellence**
    - Implement glassmorphism for dashboard cards.
    - GSAP-driven transitions between CRM and Invoicing modules.
    - Fully responsive design for use on mobile devices in the field.
3.  **Asset Utilization**
    - Incorporate `logo_dynamic.png` and `Banner.png` into the header and invoice templates.

## Phase 5: Deployment & Integration
1.  **CI/CD Pipeline**
    - Deploy frontend to Vercel or Firebase Hosting.
    - Deploy Cloud Functions for the webhook.
2.  **Website Wiring**
    - Update existing website forms to point to the new CRM webhook.
    - Link the chatbot to the CRM lead capture endpoint.
3.  **Final Quality Audit**
    - Verify PDF layout on various devices.
    - Test lead capture from end-to-end.

---

## Key Milestones
- [ ] **M1**: Firebase & Project Auth Setup.
- [ ] **M2**: Lead Capture Webhook Live.
- [ ] **M3**: CRM Dashboard (Contact List) Functional.
- [ ] **M4**: Job Calculator & PDF Generation Complete.
- [ ] **M5**: Full Brand Polish & Deployment.
