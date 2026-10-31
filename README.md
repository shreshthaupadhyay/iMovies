# 🎬 IMovies - Production Cinema Ticket Booking Platform (MERN Stack)

A complete, end-to-end, full-stack cinema ticket booking platform built with the MERN stack (MongoDB, Express.js, React + Vite, Node.js) and real-time Socket.io seat synchronization.

---

## ⚡ Zero-Setup Execution

IMovies runs out of the box with **NO API keys, NO external database setup, and NO manual configuration**.

- **Embedded In-Memory Database:** If `MONGO_URI` is not provided in `server/.env`, IMovies automatically spins up an embedded in-memory MongoDB via `mongodb-memory-server`.
- **Pre-Generated Security Secrets:** Ready-to-use 64-character cryptographic JWT secrets are automatically configured.
- **Built-in Mock Payment Gateway:** Test card, UPI, and Net Banking payments with 92% simulated success and a dedicated "Force Fail" toggle to test transaction rollbacks and seat release.
- **Automatic Seed on First Launch:** Populates 14 realistic movies, 5 multiplex theatres across 3 cities (Bhopal, Indore, Mumbai), 364 shows across 7 days, 120-seat interactive layouts per show, an administrator account, and a demo customer account.

---

## 🚀 Quick Start (Single Command)

### Step 1: Install All Dependencies
```bash
npm run install-all
```

### Step 2: Run Both Backend & Frontend Simultaneously
```bash
npm run dev
```

- **Client App (React + Vite):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Express + Socket.io):** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Running Automated Test Suite
```bash
npm test
```
Runs 22 comprehensive integration tests (Jest + Supertest) covering Auth, Role-Based Access, Movie CRUD/Search/Filter/Pagination, Seat Lock Concurrency Conflicts, Mock Payments, Transaction Rollback on Payment Decline, Show Cancellation Rules (>2h vs <2h), and Error Handling.

---

## 🔐 Demo Credentials

Quick-fill buttons are built directly into the login screen for instant testing:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@imovies.com` | `Admin@123` | Full Admin Dashboard, Manage Movies, Upload Posters, Theatres, Screens, Shows, Global Bookings & Users |
| **Demo Customer** | `user@imovies.com` | `User@123` | Browse Movies, Pick Theatres, Real-time Seat Hold (5-min timer), Checkout, Printable QR Ticket, Cancel Bookings |

---

## 📁 Project Architecture

```
imovies/
├── package.json                   # Root orchestrator (scripts: install-all, dev, test, seed)
├── README.md                      # Comprehensive documentation
├── server/
│   ├── package.json               # Backend dependencies
│   ├── .env                       # Pre-configured environment variables
│   ├── .env.example               # Example template
│   ├── server.js                  # Main Express server & Socket.io setup
│   ├── config/
│   │   ├── db.js                  # Automatic MongoDB fallback (Memory vs Atlas)
│   │   └── razorpay.js            # Optional Razorpay SDK setup
│   ├── models/
│   │   ├── User.js                # User schema (bcrypt hashing, JWT)
│   │   ├── Movie.js               # Movies schema (text index, genres, language)
│   │   ├── Theatre.js             # Theatres & screen configurations
│   │   ├── Show.js                # Showtimes, screen assignments, tier pricing
│   │   ├── Seat.js                # Atomic seat state (available, locked, booked)
│   │   ├── Booking.js             # Bookings with codes & cancellation rules
│   │   ├── Payment.js             # Payment audit trail (mock / razorpay)
│   │   └── Notification.js        # User notifications
│   ├── controllers/               # Express route handlers
│   ├── middleware/
│   │   ├── auth.js                # protect & adminOnly middleware
│   │   ├── errorHandler.js        # Centralized error handler
│   │   ├── rateLimiter.js         # Global & auth rate limiters
│   │   ├── upload.js              # Multer poster file uploader
│   │   └── validator.js           # Express-validator schemas
│   ├── services/
│   │   ├── seatLockService.js     # Atomic seat locking & 5-min expiration cleaner
│   │   ├── paymentService.js      # Mock gateway logic & Razorpay verification
│   │   └── tmdbService.js         # Optional TMDB movie importer
│   ├── sockets/
│   │   └── seatSocket.js          # Real-time room events (seat:lock, seat:booked, etc.)
│   ├── seed/
│   │   ├── seedData.js            # 14 movies & 5 multiplex theatres
│   │   └── seedRunner.js          # Auto-seeder for first boot
│   └── tests/
│       └── api.test.js            # 22 automated Jest/Supertest integration tests
└── client/
    ├── package.json               # Frontend dependencies
    ├── vite.config.js             # Vite config with /api and /socket.io proxy
    ├── index.html                 # HTML shell
    ├── .env                       # Frontend environment config
    ├── .env.example               # Example template
    └── src/
        ├── main.jsx               # React entry point
        ├── App.jsx                # Router & toast container
        ├── index.css              # Custom dark cinema theme & Bootstrap styling
        ├── api/apiClient.js       # Axios client with JWT interceptor
        ├── redux/
        │   ├── store.js           # Redux Toolkit store
        │   └── slices/            # authSlice, movieSlice, bookingSlice, notificationSlice
        ├── hooks/
        │   └── useSocket.js       # Socket.io hook for show rooms
        ├── components/
        │   ├── Navbar.jsx         # Responsive bar, city selector, notification bell
        │   ├── Footer.jsx         # Cinema platform footer
        │   ├── ProtectedRoute.jsx # User auth guard
        │   ├── AdminRoute.jsx     # Admin role guard
        │   ├── MovieCard.jsx      # Card with rating, tags, trailer modal
        │   ├── HeroCarousel.jsx   # Featured movies banner
        │   ├── FilterBar.jsx      # Multi-filter (genre, language, city, date, sort)
        │   ├── SeatGrid.jsx       # Curved screen, rows A-J, tier pricing
        │   ├── CountdownTimer.jsx # 5-minute seat reservation countdown
        │   ├── MockPaymentGateway.jsx # Card / UPI / NetBanking checkout
        │   ├── RazorpayPaymentButton.jsx # Optional Razorpay modal
        │   ├── TicketView.jsx     # Printable QR-code cinema ticket
        │   └── TrailerModal.jsx   # YouTube video modal
        └── pages/
            ├── HomePage.jsx           # Movie discovery & filtering
            ├── MovieDetailsPage.jsx   # Movie info, cast, trailer, theatre showtimes
            ├── SeatBookingPage.jsx    # Interactive seat layout & live sync
            ├── PaymentPage.jsx        # Checkout gateway & timer
            ├── ConfirmationPage.jsx   # Ticket generation & QR pass
            ├── MyBookingsPage.jsx     # Upcoming/Past/Cancelled with cancellation
            ├── ProfilePage.jsx        # Account details & password update
            ├── LoginPage.jsx          # Login with 1-click demo credentials
            ├── RegisterPage.jsx       # Account registration
            ├── NotFoundPage.jsx       # 404 page
            └── admin/
                ├── AdminDashboardPage.jsx # Analytics cards & Recharts chart
                ├── AdminMoviesPage.jsx    # Movie CRUD & poster upload
                ├── AdminTheatresPage.jsx  # Cinema halls & screen setup
                ├── AdminShowsPage.jsx     # Show scheduling with overlap prevention
                ├── AdminBookingsPage.jsx  # Global booking audit trail
                └── AdminUsersPage.jsx     # User management & role promotion
```

---

## 🎟️ Core Features & Engineering Highlights

### 1. Concurrency-Safe Seat Hold Engine
- **Race Condition Prevention:** Seats are locked atomically via Mongoose `findOneAndUpdate` requiring `{ status: 'available' }` or expired hold. If two guests simultaneously attempt to select the same seat, only the first request succeeds; the second receives an explicit conflict response and rolls back.
- **5-Minute Countdown Lock:** Seats remain locked for 5 minutes. An active background interval (`setInterval` running every 15 seconds) automatically releases expired locks and broadcasts `seat:released` events to all connected clients viewing that show.
- **WebSocket Synchronization:** Live changes (lock, unlock, booked, released) are broadcast across room `show_${showId}` via Socket.io.

### 2. Built-in Mock Payment Gateway & Transaction Rollback
- Supports Credit/Debit Card, UPI (VPA), and Net Banking.
- Simulated network latency (600ms) and ~92% realistic bank approval rate.
- **Force Fail Testing Switch:** Toggle "Force Payment Failure" to test bank declines, seat release, and failed transaction audit logging.

### 3. Strict Cancellation Policy
- Cancellations are only permitted **at least 2 hours before the scheduled showtime**.
- If within 2 hours, cancellation is disabled with explicit notification.
- When cancelled, seats are restored to `available`, a refund payment record is logged, and a user notification is emitted.

### 4. Admin Management Portal
- Real-time KPI cards: Total Revenue, Total Bookings, Active Titles, Registered Customers.
- Recharts 7-day velocity chart showing daily revenue and booking volume.
- Screen conflict detection: prevents scheduling overlapping shows in the same auditorium.
- Automatic generation of 120 seats per show (Rows A-C: Premium ₹350, Rows D-H: Executive ₹250, Rows I-J: Economy ₹150).

---

## 🔌 API Endpoint Directory

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new customer account (Rate limited)
- `POST /api/auth/login` - Authenticate & obtain JWT (Rate limited)
- `GET /api/auth/me` - Get current user profile & unread notification count
- `PUT /api/auth/profile` - Update profile name, phone, or password
- `POST /api/auth/logout` - Logout

### Movies (`/api/movies`)
- `GET /api/movies` - List movies (search, genre, language, city, date, sort, pagination)
- `GET /api/movies/filters/options` - Get available filter tags
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies` - Create movie with poster upload (Admin only)
- `PUT /api/movies/:id` - Update movie (Admin only)
- `DELETE /api/movies/:id` - Delete movie (Admin only)

### Theatres & Shows (`/api/theatres`, `/api/shows`)
- `GET /api/theatres` - List theatres by city
- `POST /api/theatres` - Create theatre and screens (Admin only)
- `PUT /api/theatres/:id` - Update theatre (Admin only)
- `DELETE /api/theatres/:id` - Delete theatre (Admin only)
- `GET /api/shows` - Query shows by movie, theatre, city, date
- `GET /api/shows/:id/seats` - Retrieve 120-seat layout with live lock state
- `POST /api/shows` - Create show with screen overlap check & auto seat generation (Admin only)
- `DELETE /api/shows/:id` - Delete show & seats (Admin only)

### Bookings & Payments (`/api/bookings`, `/api/payments`)
- `POST /api/bookings/lock-seats` - Lock seats for 5 minutes (Max 10 seats)
- `POST /api/bookings/unlock-seats` - Release locked seats
- `POST /api/bookings/pay` - Process payment & confirm booking
- `GET /api/bookings/my` - Get user's bookings (tabs: upcoming, past, cancelled)
- `GET /api/bookings/:id` - Get booking ticket details
- `POST /api/bookings/:id/cancel` - Cancel booking (>2 hours before show)
- `GET /api/payments/config` - Check payment gateway configuration

### Admin & System (`/api/admin`, `/api/health`)
- `GET /api/health` - Health check & database connection status
- `GET /api/admin/stats` - Platform metrics & 7-day chart data (Admin only)
- `GET /api/admin/bookings` - Global bookings list with status filters (Admin only)
- `GET /api/admin/users` - User directory & role management (Admin only)
- `PUT /api/admin/users/:id/role` - Toggle user role (Admin only)
- `POST /api/admin/tmdb/import` - Import now-playing titles from TMDB (Admin only)

---

## 🔑 API KEYS / THINGS YOU MAY ADD YOURSELF (ALL OPTIONAL)

The application works completely out of the box without any keys or accounts. If you wish to connect real external services, you can configure the following optional environment variables in `server/.env`:

| Environment Variable | Target File | Where to Get It | Description |
|---|---|---|---|
| `MONGO_URI` | `server/.env` | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Connect to a remote persistent MongoDB database. If left empty, IMovies automatically runs the embedded in-memory MongoDB! |
| `RAZORPAY_KEY_ID` | `server/.env` | [Razorpay Dashboard](https://dashboard.razorpay.com/) | Razorpay public key ID. When set together with the secret, the Razorpay checkout button activates alongside the mock gateway. |
| `RAZORPAY_KEY_SECRET` | `server/.env` | [Razorpay Dashboard](https://dashboard.razorpay.com/) | Razorpay secret key used for HMAC-SHA256 payment signature verification. |
| `TMDB_API_KEY` | `server/.env` | [The Movie Database (TMDB)](https://www.themoviedb.org/settings/api) | When set, displays an "Import from TMDB" button in the Admin Portal to fetch real movie metadata and posters dynamically. |

---

## 🛡️ License
MIT License. Built for production-grade cinema ticketing demonstrations.
