# OpsBridge

Internal customer-service operations platform for case enrichment, system integrations, AI-assisted workflows, and human approval.

![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxt\&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-42B883?logo=vue.js\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript\&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql\&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1)

## Overview

OpsBridge is a full-stack internal application that helps customer-service employees manage cases involving customers, orders, shipments, and phone contacts.

A case can be enriched with data from several mock business systems:

* CRM
* fulfillment system
* call system
* AI assistance service

The collected information is stored as snapshots and displayed in one case view.

The AI prepares a case summary, suggests the next action, and generates a draft customer response. A human employee must review, edit, and approve the result.

The application does not send customer messages or execute business actions automatically.

## Business scenario

A customer-service employee receives a request such as:

> Customer [anna@example.de](mailto:anna@example.de) called because order ORD-1024 has not arrived. Please check the problem and prepare the next steps.

The employee creates a case in OpsBridge.

The application then:

1. saves the original request
2. loads the customer from a mock CRM
3. loads the order from a mock fulfillment system
4. loads the latest call from a mock call system
5. stores the external data as snapshots
6. generates AI-assisted case information
7. prepares a draft response
8. waits for human approval
9. records important actions in the case timeline

## Current workflow

```mermaid
flowchart TD
    A[Create case] --> B[Save case in PostgreSQL]
    B --> C[Set status to ENRICHING]
    C --> D[Load CRM data]
    C --> E[Load fulfillment data]
    C --> F[Load latest call]
    D --> G[Save customer snapshot]
    E --> H[Save order snapshot]
    F --> I[Save call snapshot]
    G --> J[Generate AI assistance]
    H --> J
    I --> J
    J --> K[Set status to READY_FOR_REVIEW]
    K --> L[Human reviews and edits draft]
    L --> M[Approve response]
    M --> N[Set status to APPROVED]
```

## Features

### Case management

* Create customer-service cases
* View all cases
* Open a case detail page
* Store subject, message, department, priority, and status
* Store customer email, order ID, and phone number
* Track creation and update timestamps

### System integrations

* Mock CRM integration
* Mock fulfillment integration
* Mock call-system integration
* Dedicated client for each external system
* Snapshot storage for external data
* Retry-safe snapshot updates with Prisma `upsert`

### AI-assisted workflow

* Mocked AI service
* Case summary generation
* Suggested next action
* Draft customer response
* Editable draft before approval
* Separate generated and approved responses

### Human-in-the-Loop

* AI cannot send messages
* AI cannot update orders
* AI cannot issue refunds
* AI cannot resolve cases
* A human employee must approve the response
* Approval is restricted to valid case states

### Timeline

The application records events such as:

* `CASE_CREATED`
* `CRM_DATA_LOADED`
* `ORDER_DATA_LOADED`
* `CALL_DATA_LOADED`
* `AI_SUMMARY_GENERATED`
* `DRAFT_APPROVED`

## Technology stack

| Area            | Technology                              |
| --------------- | --------------------------------------- |
| Frontend        | Nuxt 3, Vue 3                           |
| Language        | TypeScript                              |
| Backend         | Nuxt server routes, Nitro, Node.js      |
| Database        | PostgreSQL                              |
| ORM             | Prisma                                  |
| Validation      | Zod                                     |
| Package manager | pnpm                                    |
| Automation      | n8n planned                             |
| AI              | Mocked service, optional real LLM later |

## Architecture

OpsBridge is a full-stack Nuxt application.

The frontend and backend are located in the same repository, while responsibilities are separated into different layers.

```text
opsbridge/
├── pages/
│   └── cases/
│       ├── index.vue
│       ├── new.vue
│       └── [id].vue
│
├── server/
│   ├── api/
│   │   ├── cases/
│   │   └── mock/
│   │
│   ├── database/
│   │   └── prisma.ts
│   │
│   ├── integrations/
│   │   ├── crmClient.ts
│   │   ├── fulfillmentClient.ts
│   │   └── callClient.ts
│   │
│   ├── repositories/
│   │   ├── caseRepository.ts
│   │   ├── customerSnapshotRepository.ts
│   │   ├── orderSnapshotRepository.ts
│   │   ├── callSnapshotRepository.ts
│   │   └── eventRepository.ts
│   │
│   └── services/
│       ├── caseService.ts
│       ├── enrichmentService.ts
│       ├── aiService.ts
│       ├── assistanceService.ts
│       └── approvalService.ts
│
├── shared/
│   └── schemas/
│       └── case.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── app.vue
├── nuxt.config.ts
└── package.json
```

## Responsibility boundaries

### API routes

Handle:

* HTTP requests
* route parameters
* request bodies
* response status codes
* HTTP errors

### Services

Handle:

* business workflows
* status changes
* approval rules
* enrichment coordination
* AI assistance generation

### Integration clients

Handle communication with:

* CRM
* fulfillment system
* call system
* n8n later

### Repositories

Handle:

* Prisma queries
* database reads
* database writes
* snapshot persistence
* event persistence

## Database models

### Case

Stores the main customer-service case.

Important fields include:

* `subject`
* `originalMessage`
* `customerEmail`
* `orderId`
* `phoneNumber`
* `department`
* `priority`
* `status`
* `aiSummary`
* `suggestedAction`
* `draftResponse`
* `approvedResponse`
* `createdAt`
* `updatedAt`

### CustomerSnapshot

Stores customer data returned by the mock CRM.

### OrderSnapshot

Stores order and shipping data returned by the mock fulfillment system.

### CallSnapshot

Stores the latest customer call returned by the mock call system.

### CaseEvent

Stores timeline and audit events related to a case.

## API endpoints

### Cases

| Method | Endpoint                             | Description            |
| ------ | ------------------------------------ | ---------------------- |
| `POST` | `/api/cases`                         | Create a case          |
| `GET`  | `/api/cases`                         | List all cases         |
| `GET`  | `/api/cases/:id`                     | Get one case           |
| `POST` | `/api/cases/:id/enrich`              | Enrich a case          |
| `POST` | `/api/cases/:id/generate-assistance` | Generate AI assistance |
| `POST` | `/api/cases/:id/approve`             | Approve a response     |

### Mock systems

| Method | Endpoint                           | Description          |
| ------ | ---------------------------------- | -------------------- |
| `GET`  | `/api/mock/crm/contacts?email=...` | Find a customer      |
| `GET`  | `/api/mock/fulfillment/orders/:id` | Find an order        |
| `GET`  | `/api/mock/calls?phone=...`        | Find the latest call |

## Case statuses

Currently implemented:

* `NEW`
* `ENRICHING`
* `READY_FOR_REVIEW`
* `APPROVED`

Planned:

* `REJECTED`
* `IN_PROGRESS`
* `RESOLVED`
* `FAILED`

## Local development

### Requirements

* Node.js 22 or newer
* pnpm

### Install dependencies

```bash
pnpm install
```

### Configure environment variables

Create a `.env` file:

```env
# Local development can point DATABASE_URL at any Postgres database.
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/opsbridge?schema=public"

# Netlify Database exposes the production connection as NETLIFY_DB_URL.
NETLIFY_DB_URL=

AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

If you previously used a SQLite setup, replace any `file:./dev.db` value with a Postgres connection string.

### Generate the Prisma Client

```bash
pnpm db:generate
```

### Apply database migrations

```bash
pnpm db:migrate
```

### Start the development server

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Cases page:

```text
http://localhost:3000/cases
```

Create-case page:

```text
http://localhost:3000/cases/new
```

## Example case

Use this test data:

```text
Subject:
Delayed order

Customer email:
anna@example.de

Order ID:
ORD-1024

Original message:
Customer says order ORD-1024 has not arrived.

Department:
CUSTOMER_SERVICE

Priority:
HIGH
```

Expected mock data:

* Customer: Anna Müller
* Order: ORD-1024
* Shipping status: delayed
* Latest call note: Customer asked about delayed order

## Useful commands

Start the development server:

```bash
pnpm dev
```

Generate Prisma Client:

```bash
pnpm db:generate
```

Create a migration:

```bash
pnpm exec prisma migrate dev --name migration-name
```

Open Prisma Studio:

```bash
pnpm prisma studio
```

Build the application:

```bash
pnpm build
```

Seed demo data:

```bash
pnpm db:seed
```

## Netlify deployment

### Required environment variables

* `DATABASE_URL` or `NETLIFY_DB_URL`
* `GROQ_API_KEY`
* `GROQ_MODEL=openai/gpt-oss-20b`
* `AI_PROVIDER=groq`

### Database setup

Production uses Netlify Database as the PostgreSQL database. Netlify exposes the connection string as `NETLIFY_DB_URL`; OpsBridge accepts either `DATABASE_URL` or `NETLIFY_DB_URL` on the server side through Prisma.

### Build command

Use this Netlify build command:

```bash
pnpm build
```

`pnpm build` runs `prisma generate` before `nuxt build`.

### First deployment

1. Deploy the project.
2. Create or connect the Netlify Database.
3. Confirm Netlify provides `NETLIFY_DB_URL` to the site runtime.
4. Let Netlify apply the SQL migrations from `netlify/database/migrations` during deploy.
5. Optionally seed demo content manually with `pnpm db:seed` after the schema is ready.

## Security boundaries

* Only fake test data is used.
* Secrets are stored in environment variables.
* API keys are never exposed to the browser.
* Server input is validated with Zod.
* AI cannot execute business actions.
* No real customer emails are sent.
* No refunds or order changes are performed.

## Project status

Currently implemented:

* case creation
* case list
* case detail page
* PostgreSQL persistence
* Zod validation
* CRM enrichment
* fulfillment enrichment
* call enrichment
* snapshot storage
* mocked AI assistance
* editable draft response
* human approval
* event timeline

Planned next:

* rejection workflow
* case resolution
* partial integration failure handling
* retry endpoint
* urgent-case n8n webhook
* dashboard
* filters
* deployment with hosted PostgreSQL
* optional real LLM integration

## Author

Built by [Igal Vilensky](https://github.com/igalVilensky) as a portfolio and interview-preparation project.
