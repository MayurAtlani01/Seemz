# SEEMZ — Luxury Fashion E-Commerce

SEEMZ is a full-stack luxury fashion e-commerce platform built with the MERN stack.

Designed around a monochrome black-and-white aesthetic, SEEMZ combines a premium editorial interface with a complete e-commerce experience including authentication, product management, wishlist, cart, addresses, orders, profiles, and an admin panel.

The project is fully deployed with a React/Vite frontend, Node/Express backend, MongoDB Atlas database, and Cloudinary image storage.

---

## ✦ Live Project

**Frontend:**  
https://seemz.vercel.app

**Backend:**  
https://seemz.onrender.com

---

## ✦ Features

### Fashion Experience

- Luxury black-and-white visual identity
- Editorial-inspired UI
- Men & Women collections
- New Arrivals
- Product catalogue
- Product detail pages
- Responsive product cards
- Mobile-first responsive experience

### Authentication

- User registration
- User login
- JWT authentication
- HTTP-only authentication cookies
- Protected routes
- Admin authentication
- Forgot password
- Reset password
- Logout

### Shopping

- Add products to cart
- Update cart quantities
- Remove products from cart
- Wishlist
- Add wishlist products to cart
- Product size selection
- Stock handling
- Address management
- Checkout
- Order placement
- Order history
- User profile

### Admin

- Admin dashboard
- Product management
- Create products
- Update products
- Delete products
- Product categories
- Product sizes
- Stock management
- Product image uploads

### Media

Product images are uploaded to Cloudinary and stored as hosted URLs in MongoDB.

---

## ✦ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- JWT
- HTTP cookies
- Mongoose

### Database

- MongoDB
- MongoDB Atlas

### Image Storage

- Cloudinary

### Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

## ✦ Architecture

```text
                    SEEMZ
                      │
              ┌───────┴───────┐
              │               │
          Frontend          Backend
          Vercel            Render
              │               │
              └───────┬───────┘
                      │
                 MongoDB Atlas
                      │
                  Product Data

Product Images:

Admin Panel
     ↓
Render API
     ↓
Cloudinary
     ↓
Secure Image URL
     ↓
MongoDB Atlas


SEEMZ/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── public/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
│   │
│   └── ...
│
└── README.md


# ✦ Routes

## Main Routes

| Route | Description | Access |
|---|---|---|
| `/` | Home page | Public |
| `/men` | Men's collection | Public |
| `/women` | Women's collection | Public |
| `/new` | New Arrivals | Public |
| `/about` | About SEEMZ | Public |
| `/products` | Product catalogue | Public |
| `/products/:id` | Product details | Public |

## Authentication Routes

| Route | Description | Access |
|---|---|---|
| `/login` | User login | Public |
| `/register` | User registration | Public |
| `/forgot-password` | Request password reset | Public |
| `/reset-password` | Reset password | Public |

## Commerce Routes

| Route | Description | Access |
|---|---|---|
| `/cart` | Shopping bag | Authenticated |
| `/checkout` | Checkout | Authenticated |
| `/orders` | Order history | Authenticated |
| `/profile` | User profile | Authenticated |
| `/wishlist` | Wishlist | Authenticated |

## Admin Routes

| Route | Description | Access |
|---|---|---|
| `/admin` | Admin dashboard | Admin |
| `/admin/products` | Product management | Admin |

---
## ✦ Screenshots

### Home
![SEEMZ Home](./screenshots/home.png)

### Collections
![SEEMZ Collections](./screenshots/collections.png)

### Product Details
![SEEMZ Product Details](./screenshots/product-details.png)

### Profile & Account
![SEEMZ Profile](./screenshots/profile.png)
