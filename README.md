<div align="center">

# SEEMZ Atelier

### Contemporary Fashion. Thoughtfully Curated.

*A full-stack fashion e-commerce platform built on the MERN stack — designed to feel like a digital fashion experience, not just a product catalog.*

![React](https://img.shields.io/badge/React-000000?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-000000?style=flat-square&logo=vite&logoColor=646CFF)
![Node.js](https://img.shields.io/badge/Node.js-000000?style=flat-square&logo=node.js&logoColor=339933)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=FFFFFF)
![MongoDB](https://img.shields.io/badge/MongoDB-000000?style=flat-square&logo=mongodb&logoColor=47A248)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=FFFFFF)
![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-000000?style=flat-square&logo=cloudinary&logoColor=3448C5)
![Resend](https://img.shields.io/badge/Email-Resend-000000?style=flat-square)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=FFFFFF)
![Render](https://img.shields.io/badge/Backend-Render-000000?style=flat-square&logo=render&logoColor=FFFFFF)

**[Live Application](https://seemz.vercel.app/)** &nbsp;·&nbsp; **[Frontend Repository](https://github.com/MayurAtlani01)&nbsp;·&nbsp; **[Backend Repository](https://github.com/MayurAtlani01)
</div>

<br>

> **A note on how this document was written**
> This README was generated from the project's feature set, architecture, and design decisions as described by the team. Sections that depend on inspecting source code directly — exact API routes, database schema fields, the literal folder tree, and the specific libraries behind the About page animation — are marked **`[verify against repository]`**. Replace those placeholders once you've confirmed them against the actual codebase.

<br>

## Table of Contents

- [Project Overview](#project-overview)
- [Why SEEMZ](#why-seemz)
- [Key Highlights](#key-highlights)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [Authentication and Security](#authentication-and-security)
- [OTP Architecture](#otp-architecture)
- [Email Architecture](#email-architecture)
- [Body Scanner Technical Deep Dive](#body-scanner-technical-deep-dive)
- [Interactive About Experience](#interactive-about-experience)
- [UI and UX Design System](#ui-and-ux-design-system)
- [Responsive Design](#responsive-design)
- [Performance](#performance)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Production Configuration](#production-configuration)
- [Challenges and Solutions](#challenges-and-solutions)
- [Engineering Decisions](#engineering-decisions)
- [Testing](#testing)
- [Screenshots](#screenshots)
- [Future Scope](#future-scope)
- [Learning Outcomes](#learning-outcomes)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

<br>

## Project Overview

SEEMZ Atelier is a full-stack fashion e-commerce platform built on the MERN stack (MongoDB, Express, React, Node.js). It combines a browsing-and-checkout commerce flow with two less conventional pieces of engineering: a browser-based body measurement scanner using pose detection, and a scroll-driven interactive About page that assembles an outfit piece by piece as the user scrolls.

The project sits at the intersection of fashion, e-commerce, and full-stack engineering — the goal was not to rebuild a generic product-listing storefront, but to explore what a more editorial, experience-led commerce interface could look like when paired with a genuine backend architecture: authentication, verified email delivery, cloud media storage, and production deployment.

<br>

## Why SEEMZ

Most student and portfolio e-commerce projects follow the same shape:

```
Homepage → Products → Product Page → Cart → Checkout
```

SEEMZ was built around a longer, more connected path:

```
Brand Experience → Collections → Discovery → Product Experience →
Wishlist → Shopping → Account → Fashion-Tech Experiences
```

The underlying idea is simple: **e-commerce should feel like an experience, not just a store.** That shows up in two concrete places — the interactive About page (brand storytelling as interaction, not a static paragraph) and the Body Scanner (turning a common fashion-tech idea — fit estimation — into something a user can actually try in the browser).

<br>

## Key Highlights

**What this project demonstrates:**

`Full-stack development` · `REST API design` · `JWT authentication` · `bcrypt + OTP security` · `Transactional email integration` · `Cloud media storage (Cloudinary)` · `Split frontend/backend deployment` · `Production incident debugging` · `Browser-based computer vision` · `Responsive UI engineering` · `Technical documentation`

**A few things worth reading before the rest of the document:**

- **A real production fix, not a toy feature.** Transactional email broke in production because the hosting provider blocks outbound SMTP — the fix was an architecture change (SMTP → HTTPS email API), not a workaround. Full story in [Challenges and Solutions](#challenges-and-solutions).
- **OTP-based email verification**, built with hashed, expiring, attempt-limited codes rather than a plain "send a link" flow.
- **A browser-based body measurement scanner** using pose detection, multi-frame temporal smoothing, and outlier rejection — described honestly below as an experimental feature, not a certified measurement tool.
- **An interactive, scroll-driven About page** that assembles a full outfit as the user scrolls, instead of a static brand paragraph.

<br>

## Features

| Feature | Description |
|---|---|
| **Authentication** | Registration, login, logout, JWT-protected routes, email OTP verification, forgot/reset password |
| **Product Collections** | Browse collections and categories, open product detail pages with images and descriptions |
| **Search** | Case-insensitive, partial-match search across product name, category, description, and metadata |
| **Wishlist** | Add, remove, and view saved products; persisted per authenticated user via the backend |
| **Shopping Bag** | Add/remove items, update quantities, view computed totals |
| **Checkout and Orders** | Bag → checkout → order creation → order history, tied to the authenticated user |
| **User Profile** | Account details, order history, and other account-scoped data |
| **Admin Panel** | Product and platform management tools for administrators |
| **Body Scanner** | Camera-based pose estimation for experimental body measurement (see [deep dive](#body-scanner-technical-deep-dive)) |
| **Interactive About** | Scroll-driven outfit assembly used as brand storytelling (see [deep dive](#interactive-about-experience)) |
| **Responsive UI** | Layouts adapted across desktop, tablet, mobile, and small mobile breakpoints |
| **Homepage Video** | Hero video experience tuned for load time and playback behavior |

<br>

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, JavaScript, CSS |
| **Backend** | Node.js, Express.js, JavaScript |
| **Database** | MongoDB, MongoDB Atlas |
| **Authentication** | JWT, bcrypt, custom OTP verification |
| **Media Storage** | Cloudinary |
| **Transactional Email** | Resend (HTTPS API) |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |
| **Body Scanner** | Browser Camera API + client-side pose/landmark detection `[verify exact library in repository]` |

> The database layer (Mongoose or another MongoDB driver) and the exact pose-detection library used by the Body Scanner aren't specified here — confirm both in `backend/package.json` and `frontend/package.json` and list them explicitly.

<br>

## System Architecture

```
User
  │
  ▼
React + Vite Frontend (SPA)
  │
  ▼  REST API over HTTPS
Node.js + Express Backend
  │
  ├──▶ MongoDB Atlas     (primary data store)
  ├──▶ Cloudinary        (product images and media)
  └──▶ Resend            (transactional email, HTTPS API)
```

Typical request flow:

```
Client → Express Route → Middleware → Controller → Business Logic → Database / External Service → JSON Response → Client
```

<br>

## Frontend Architecture

Built with **React + Vite**, using page-level composition backed by reusable components.

**Major pages:**

Home · Collections · Product Details · Shopping Bag · Wishlist · Profile · Orders · Login · Register · OTP Verification · Forgot Password · Reset Password · About · Body Scanner · Admin

**Structural conventions** (exact directories confirmed in [Project Structure](#project-structure)):

- `components/` — shared, reusable UI pieces
- `pages/` — route-level views
- `context/` — cross-cutting app state
- `hooks/` — reusable client-side logic
- `services/` — API-calling layer
- `assets/` — static assets

<br>

## Backend Architecture

Built with **Node.js + Express**, using a layered, service-oriented structure:

| Layer | Responsibility |
|---|---|
| Routes | Define API endpoints and HTTP methods |
| Middleware | Authentication checks, request validation, error handling |
| Controllers | Handle request/response logic per endpoint |
| Services | Reusable business logic (OTP, email, Cloudinary) |
| Models | MongoDB schema definitions |
| Utilities | Shared helper functions |

**Service-oriented pieces used across the backend:**

- OTP Service
- Email Service
- Cloudinary Service
- Authentication utilities

<br>

## Database Architecture

Data is stored in **MongoDB**, hosted on **MongoDB Atlas** as the primary cloud database. The schema is organized around the platform's core domains — users, products, cart/wishlist state, and orders — with authenticated ownership on user-scoped data (wishlist, bag, orders, profile).

Exact schema fields, validation rules, and relationships between collections are documented in [Database Models](#database-models) and should be verified against `backend/src/models` before being treated as final.

<br>

## Authentication and Security

**Authentication flow:**

```
Register
  ↓
Validate input
  ↓
Create or reuse unverified account
  ↓
Generate 6-digit OTP
  ↓
Hash OTP before storage
  ↓
Store verification record (with expiry)
  ↓
Send OTP via Resend
  ↓
User submits OTP
  ↓
Backend verifies hash, expiry, and attempt count
  ↓
Account marked verified
  ↓
Login issues JWT
```

**Security measures currently implemented:**

- JWT-based authentication with protected backend routes
- Password hashing with bcrypt
- Hashed OTP storage (not stored in plaintext)
- OTP expiry, resend cooldown, and attempt limits
- Environment-variable configuration — no secrets committed to source
- No API keys or sensitive values exposed to the frontend or logs
- Authentication checks enforced server-side, not just in the UI

**Explicitly not implemented (as of now):** OAuth, two-factor authentication, CSRF protection, rate limiting, encryption at rest, or WAF-level protection. If any of these matter for your use case, treat them as [Future Scope](#future-scope) rather than current guarantees.

<br>

## OTP Architecture

| Property | Detail |
|---|---|
| Format | 6-digit numeric code |
| Storage | Hashed, never stored or logged in plaintext |
| Expiry | Time-limited validity window |
| Resend | Cooldown period before a new OTP can be requested |
| Attempts | Maximum verification attempts before invalidation |
| Verification | Performed server-side only |

OTPs, passwords, API keys, and JWT secrets are never hardcoded or exposed in frontend code or logs.

<br>

## Email Architecture

SEEMZ uses **Resend**, accessed over its **HTTPS API**, for all production transactional email. Resend is not an SMTP service — it is called over standard HTTPS, which is what makes it work on a host that blocks SMTP ports (see [Challenges and Solutions](#challenges-and-solutions) for why that matters here).

```
Authentication Controller
  ↓
OTP Service
  ↓
Email Service
  ↓
Resend API (HTTPS)
  ↓
User's inbox
```

**Email is used for:**

- Registration OTP delivery
- Resending a verification OTP
- Forgot password
- Password reset

The sending address uses a verified domain in production.

<br>

## Body Scanner Technical Deep Dive

The Body Scanner is a browser-based feature that estimates body measurements from camera input using pose detection.

```
Camera
  ↓
Live video frames
  ↓
Pose detection
  ↓
Landmark detection
  ↓
Confidence filtering
  ↓
Temporal smoothing (multi-frame)
  ↓
Body geometry construction
  ↓
Measurement estimation
  ↓
Validation (outlier rejection, anatomical consistency checks)
  ↓
Scan result (with a quality indicator)
```

**Pipeline considerations built into the feature:**

| Stage | Purpose |
|---|---|
| Camera framing guidance | Helps the user position themselves correctly before capture |
| Full-body detection | Confirms the full body is visible before proceeding |
| Multi-frame averaging | Reduces single-frame noise in landmark positions |
| Temporal smoothing | Stabilizes measurements across frames over time |
| Height calibration | Anchors relative measurements to a known reference |
| Outlier rejection | Discards implausible frame-to-frame readings |
| Anatomical consistency checks | Flags geometrically inconsistent results |
| Scan quality handling | Surfaces a confidence/quality signal with the result |

> **Important:** the Body Scanner is an experimental fashion-tech feature for estimating measurements to support sizing decisions. It is **not** medically accurate and is **not** a certified measurement device. It should not be relied on for medical or clinical purposes.

<br>

## Interactive About Experience

Instead of a static About page, SEEMZ uses scroll position to progressively assemble an outfit on a mannequin-style stand.

```
Empty stand
  ↓  scroll down
Pants
  ↓
Top
  ↓
Jacket
  ↓
Shoes
  ↓
Accessories
  ↓
Complete look
  ↑  scrolling up reverses the sequence
```

The intent is to turn the brand story into something interactive rather than a paragraph of copy.

> **`[verify against repository]`** — the current implementation may use 3D rendering and scroll-linked animation (for example, Three.js, GSAP, and glTF/GLB assets). Confirm the exact libraries in `frontend/package.json` and the About page component before listing them under [Technology Stack](#technology-stack).

<br>

## UI and UX Design System

**Color system (customer-facing UI):** black, white, off-white, charcoal, neutral gray. No gold or golden tones appear in the customer-facing interface by design.

> The admin panel may retain a separate visual treatment, including existing gold-accented styling from an earlier iteration — this applies to admin only, not the customer-facing product. Confirm the current extent of this in the admin UI before describing it further.

**Typography:** uses the project's existing custom font system. `[verify against repository]` — confirm the exact font family and type scale from the frontend's global stylesheet/theme before naming a specific typeface here.

**Visual language:** minimal, editorial, premium, fashion-oriented, high contrast.

<br>

## Responsive Design

The interface is built to adapt across desktop, laptop, tablet, mobile, and small mobile screens, with responsive handling across:

Navigation · Authentication · OTP inputs · Product cards · Collections · Product details · Wishlist · Shopping bag · Profile · Body Scanner · About experience

<br>

## Performance

Performance work focused on the areas most likely to matter for a media-heavy, editorial-style commerce site:

- **Homepage video:** resolution, bitrate, and file size tuning; preloading strategy; autoplay behavior; poster/fallback image; `playsInline` for mobile playback
- **Responsive media:** appropriately sized images/video across breakpoints
- **Client-side rendering:** avoiding unnecessary re-renders in React
- **Body Scanner:** frame processing considerations to keep pose detection responsive
- **General mobile performance:** keeping visual effects lightweight rather than decorative-heavy

No specific benchmark numbers (Lighthouse scores, load-time percentages, etc.) are claimed here — measure these yourself if you want to publish them.

<br>

## API Documentation

> **`[verify against repository]`** — the tables below are organized around the feature set described in this document. Confirm exact paths, request/response bodies, and error handling against `backend/src/routes` and `backend/src/controllers`, and update this section before publishing.

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/verify-otp` | No | Verify registration OTP |
| POST | `/api/auth/resend-otp` | No | Resend a verification OTP |
| POST | `/api/auth/login` | No | Authenticate a user, issue JWT |
| POST | `/api/auth/forgot-password` | No | Initiate password reset |
| POST | `/api/auth/reset-password` | No | Complete password reset |

</details>

<details>
<summary><strong>Users / Profile</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/users/me` | Yes | Get current user's profile |
| PUT | `/api/users/me` | Yes | Update profile information |

</details>

<details>
<summary><strong>Products</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | No | List / search / filter products |
| GET | `/api/products/:id` | No | Get a single product's details |

</details>

<details>
<summary><strong>Cart</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/cart` | Yes | Get the current user's bag |
| POST | `/api/cart` | Yes | Add an item to the bag |
| PUT | `/api/cart/:itemId` | Yes | Update item quantity |
| DELETE | `/api/cart/:itemId` | Yes | Remove an item from the bag |

</details>

<details>
<summary><strong>Wishlist</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/wishlist` | Yes | Get saved products |
| POST | `/api/wishlist` | Yes | Add a product to the wishlist |
| DELETE | `/api/wishlist/:productId` | Yes | Remove a product from the wishlist |

</details>

<details>
<summary><strong>Orders</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Yes | Create an order from the current bag |
| GET | `/api/orders` | Yes | Get the current user's order history |
| GET | `/api/orders/:id` | Yes | Get a single order's details |

</details>

<details>
<summary><strong>Admin</strong></summary>

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/products` | Admin | List products for management |
| POST | `/api/admin/products` | Admin | Create a product |
| PUT | `/api/admin/products/:id` | Admin | Update a product |
| DELETE | `/api/admin/products/:id` | Admin | Remove a product |

</details>

<br>

## Database Models

> **`[verify against repository]`** — the domains below reflect the platform's features. Confirm exact field names, types, indexes, and validation against `backend/src/models` before publishing.

<details>
<summary><strong>User</strong></summary>

- Purpose: stores account credentials and verification state
- Likely fields: email, hashed password, verification status, timestamps
- Relationships: referenced by Orders, Wishlist, Cart, and Profile data

</details>

<details>
<summary><strong>OTP / Verification</strong></summary>

- Purpose: stores hashed OTP codes and their verification state
- Likely fields: associated user/email, hashed code, expiry, attempt count
- Relationships: tied to a User record during the verification window

</details>

<details>
<summary><strong>Product</strong></summary>

- Purpose: stores catalog data shown across collections, search, and product detail pages
- Likely fields: name, description, category, images (Cloudinary references), price, available metadata (e.g. color)

</details>

<details>
<summary><strong>Cart</strong></summary>

- Purpose: stores a user's in-progress shopping bag
- Likely fields: user reference, line items (product reference + quantity)
- Relationships: owned by a single authenticated User

</details>

<details>
<summary><strong>Wishlist</strong></summary>

- Purpose: stores a user's saved products
- Likely fields: user reference, list of product references
- Relationships: owned by a single authenticated User

</details>

<details>
<summary><strong>Order</strong></summary>

- Purpose: stores completed checkout transactions
- Likely fields: user reference, line items, totals, status, timestamps
- Relationships: owned by a single authenticated User; referenced by order history

</details>

<br>

## Project Structure

> **`[verify against repository]`** — this is the expected high-level layout. Replace with the actual folder tree once confirmed.

```
SEEMZ/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── README.md
```

<br>

## Environment Variables

No real values are included below — these are variable names only.

**Backend**

```
PORT=
MONGODB_URI=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
EMAIL_FROM=
```

Never commit real credentials, API keys, database URIs, or JWT secrets to source control or this document.

<br>

## Installation

**Prerequisites:**

- Node.js and npm
- A MongoDB Atlas (or local MongoDB) instance
- A Cloudinary account
- A Resend account

**Clone the repository:**

```bash
git clone YOUR_REPOSITORY_URL
```

**Install dependencies:**

```bash
cd frontend
npm install
```

```bash
cd backend
npm install
```

Configure `.env` in both `frontend/` and `backend/` as needed using the variable names above.

<br>

## Running Locally

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

> If your actual `package.json` scripts differ from `npm run dev` (for example `npm start`), use the scripts defined there.

<br>

## Deployment

```
Internet
  │
  ├──▶ Vercel ── React Frontend (SPA)
  │
  └──▶ Render ── Node.js + Express API
                     │
                     ├──▶ MongoDB Atlas
                     ├──▶ Cloudinary
                     └──▶ Resend
```

- **Frontend** deploys to **Vercel**
- **Backend** deploys to **Render**

<br>

## Production Configuration

- Environment variables are set per-service in the Vercel and Render dashboards, not committed to the repository
- The Resend sending domain is verified in production
- In a split-deployment setup like this, cross-origin configuration between the Vercel frontend origin and the Render backend needs to be correctly set — confirm the allowed origins in the backend's CORS setup

<br>

## Challenges and Solutions

### The transactional email outage (SMTP → HTTPS)

During development, email verification worked reliably using **Nodemailer with Gmail SMTP** on localhost. After deploying the backend to **Render's free tier**, authentication emails started timing out.

```
Development (localhost)
Backend → Nodemailer → Gmail SMTP → email delivered

Production (Render Free)
Backend → Nodemailer → Gmail SMTP (ports 25 / 465 / 587) → connection timeout
                                                             (outbound SMTP blocked by host)
```

Investigation showed the issue wasn't a code bug — Render's free tier blocks outbound traffic on the ports commonly used by SMTP. Increasing timeout values on the frontend wouldn't have fixed anything, because the connection was never being established at all. The actual fix was an architecture change: move transactional email off SMTP entirely and onto an HTTPS-based email API.

```
Resolution
Backend → Resend API → HTTPS (port 443) → email delivered
```

This is the kind of constraint that only shows up once code leaves localhost, and it changed the shape of the email layer rather than just patching around the symptom.

### Other areas worked through during development

The following are common friction points in a project of this shape — confirm specifics against your own commit history / issue tracker and expand with detail where relevant:

- Responsive layout adjustments across breakpoints
- Wishlist rendering and product-page CSS conflicts
- Body Scanner detection stability across devices/lighting
- OTP countdown and verification edge cases
- Homepage video performance tuning
- General frontend/backend communication issues during early integration

<br>

## Engineering Decisions

**Why React?** Component-based UI made sense for a product catalog with many repeated, data-driven views (product cards, collection grids, forms).

**Why Node.js and Express?** A JavaScript backend keeps the stack consistent with the frontend and gives a lightweight, well-understood framework for building a REST API.

**Why MongoDB?** Product and order data doesn't map cleanly to a fixed relational schema up front — a document database gave more flexibility while the data model was still evolving.

**Why JWT?** A stateless token fits a REST API that's called from a separately deployed frontend, without needing shared server-side session storage.

**Why Cloudinary?** Offloads image storage and delivery from the application server, rather than serving product images directly from the backend.

**Why Resend over SMTP in production?** Directly driven by the outage above — Render's free tier blocks the ports SMTP relies on, but standard HTTPS (port 443) is always available. An HTTPS-based email API sidesteps the constraint entirely instead of working around it.

**Why separate frontend/backend deployment?** Vercel is well suited to a static/SPA frontend build; Render runs a persistent Node process for the API. Deploying each to the platform it fits best, rather than forcing both onto one host.

**Why a browser-based Body Scanner?** No native app or install required — measurement estimation happens directly in the browser using the device camera, keeping the experience part of the web platform rather than a separate product.

<br>

## Testing

The checklist below reflects manual QA performed during development. Automated test coverage is not currently implemented — see [Future Scope](#future-scope).

**Authentication**

- [ ] Registration
- [ ] OTP delivery
- [ ] OTP verification
- [ ] OTP expiry
- [ ] OTP resend
- [ ] OTP attempt limits
- [ ] Login
- [ ] Logout
- [ ] Forgot password
- [ ] Password reset

**E-commerce**

- [ ] Product browsing
- [ ] Search
- [ ] Filtering
- [ ] Product details
- [ ] Add to bag
- [ ] Remove from bag
- [ ] Quantity update
- [ ] Wishlist
- [ ] Checkout
- [ ] Orders

**UI**

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
- [ ] Small mobile

**Production**

- [ ] Frontend deployment
- [ ] Backend deployment
- [ ] MongoDB connection
- [ ] Cloudinary
- [ ] Resend
- [ ] API communication

<br>

## Screenshots

*No screenshots are included yet — add images to a `docs/screenshots/` folder and reference them below.*

| Page | Preview |
|---|---|
| Homepage | *(screenshot pending)* |
| Collections | *(screenshot pending)* |
| Product Details | *(screenshot pending)* |
| Shopping Bag | *(screenshot pending)* |
| Wishlist | *(screenshot pending)* |
| Login / Register | *(screenshot pending)* |
| OTP Verification | *(screenshot pending)* |
| Profile | *(screenshot pending)* |
| Body Scanner | *(screenshot pending)* |
| About | *(screenshot pending)* |
| Admin | *(screenshot pending)* |

<br>

## Future Scope

The following are planned or potential improvements — **not currently implemented:**

- AI-powered product recommendations
- Smart size recommendation
- Personalized styling
- Natural-language product search
- Advanced recommendation engine
- Inventory management
- Payment gateway integration
- Redis caching
- Background job processing
- Automated testing
- CI/CD pipeline
- Advanced analytics
- AR/3D fashion experiences

<br>

## Learning Outcomes

Building SEEMZ involved more than wiring together CRUD screens:

- Designing and implementing a full authentication flow, including OTP-based email verification with hashing, expiry, and attempt limits
- Debugging a real production incident (SMTP blocked in production) and resolving it with an architecture change, not a workaround
- Integrating third-party cloud services (Cloudinary, Resend, MongoDB Atlas) into a coherent backend
- Experimenting with browser-based computer vision (pose detection) for a practical, non-trivial use case
- Building a scroll-driven interactive experience as an alternative to a static content page
- Coordinating frontend and backend work across a four-person team
- Writing technical documentation that's honest about what is and isn't implemented

<br>

## Team

SEEMZ was developed collaboratively by four contributors.

| Contributor | Responsibility |
|---|---|
| _Add name_ | _Add role_ |
| _Add name_ | _Add role_ |
| _Add name_ | _Add role_ |
| _Add name_ | _Add role_ |

<br>

## Contributing

This project is primarily maintained by its core team. If you'd like to suggest a change:

1. Fork the repository
2. Create a feature branch
3. Commit your changes with a clear message
4. Open a pull request describing the change

<br>

## License

No license has been specified yet. If you intend for this project to be reused or contributed to by others, add a `LICENSE` file (for example, MIT) to the repository root.

<br>

## Acknowledgements

Built with React, Vite, Node.js, Express, and MongoDB, and made possible in production by MongoDB Atlas, Cloudinary, Resend, Vercel, and Render.

<br>

<div align="center">

**SEEMZ Atelier** — contemporary fashion, thoughtfully curated, and built with the same attention to detail on the backend as on the runway.

</div>
