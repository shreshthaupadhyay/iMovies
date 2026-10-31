const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const { generateSeatsForShow } = require('../controllers/showController');

let mongoServer;
let adminToken;
let userToken1;
let userToken2;
let user1Id;
let user2Id;
let testMovie;
let testTheatre;
let futureShow;
let nearShow;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_super_secret_64char_string_imovies_production_quality_key_123';

  // Initialize in-memory MongoDB for clean test isolation
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Admin
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin Test',
    email: 'admintest@imovies.com',
    password: 'Password@123',
    phone: '9999999999',
  });
  await User.findByIdAndUpdate(adminRes.body.user.id, { role: 'admin' });
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admintest@imovies.com',
    password: 'Password@123',
  });
  adminToken = adminLogin.body.token;

  // 2. Create User 1
  const user1Res = await request(app).post('/api/auth/register').send({
    name: 'User One',
    email: 'user1@test.com',
    password: 'Password@123',
    phone: '8888888888',
  });
  userToken1 = user1Res.body.token;
  user1Id = user1Res.body.user.id;

  // 3. Create User 2
  const user2Res = await request(app).post('/api/auth/register').send({
    name: 'User Two',
    email: 'user2@test.com',
    password: 'Password@123',
    phone: '7777777777',
  });
  userToken2 = user2Res.body.token;
  user2Id = user2Res.body.user.id;

  // 4. Create Test Movie
  testMovie = await Movie.create({
    title: 'Inception Test',
    description: 'A thief who steals corporate secrets through dream-sharing technology.',
    genre: ['Sci-Fi', 'Action'],
    language: 'English',
    duration: 148,
    rating: 8.8,
    status: 'nowShowing',
  });

  // 5. Create Test Theatre
  testTheatre = await Theatre.create({
    name: 'PVR Test Cineplex',
    city: 'Bhopal',
    address: 'Test Mall, Bhopal',
    screens: [{ name: 'Screen 1', rows: 10, seatsPerRow: 12 }],
  });

  // 6. Create Future Show (> 24 hours away)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow.getTime() + 150 * 60 * 1000);
  futureShow = await Show.create({
    movie: testMovie._id,
    theatre: testTheatre._id,
    screen: 'Screen 1',
    startTime: tomorrow,
    endTime: tomorrowEnd,
    prices: { premium: 350, regular: 250, economy: 150 },
  });
  await generateSeatsForShow(futureShow._id, futureShow.prices);

  // 7. Create Near Show (only 45 mins away, for < 2h cancellation test)
  const soon = new Date(Date.now() + 45 * 60 * 1000);
  const soonEnd = new Date(soon.getTime() + 150 * 60 * 1000);
  nearShow = await Show.create({
    movie: testMovie._id,
    theatre: testTheatre._id,
    screen: 'Screen 1',
    startTime: soon,
    endTime: soonEnd,
    prices: { premium: 350, regular: 250, economy: 150 },
  });
  await generateSeatsForShow(nearShow._id, nearShow.prices);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('IMovies Full API Test Suite', () => {
  describe('1. Authentication & Profile', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'New Customer',
        email: 'newcustomer@test.com',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should prevent registration with duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Guy',
        email: 'user1@test.com',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should login user with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'user1@test.com',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('user1@test.com');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'user1@test.com',
        password: 'WrongPassword',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get current user profile with token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken1}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe('user1@test.com');
    });
  });

  describe('2. Role-Based Access Control', () => {
    it('should block non-admin users from creating movies', async () => {
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          title: 'Unauthorized Movie',
          description: 'Should fail',
          language: 'English',
          duration: 120,
        });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Admin access required/i);
    });

    it('should allow admin users to create movies', async () => {
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Interstellar Director Cut',
          description: 'Mankind was born on Earth, not meant to die here.',
          language: 'English',
          genre: 'Sci-Fi, Adventure',
          duration: 169,
          rating: 8.9,
          status: 'nowShowing',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.movie.title).toBe('Interstellar Director Cut');
    });
  });

  describe('3. Movie Catalogue, Search & Pagination', () => {
    it('should return list of movies with pagination', async () => {
      const res = await request(app).get('/api/movies?page=1&limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.movies)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });

    it('should search movies by title query', async () => {
      const res = await request(app).get('/api/movies?search=Inception');
      expect(res.statusCode).toBe(200);
      expect(res.body.movies.length).toBeGreaterThanOrEqual(1);
      expect(res.body.movies[0].title).toMatch(/Inception/i);
    });

    it('should filter movies by genre', async () => {
      const res = await request(app).get('/api/movies?genre=Sci-Fi');
      expect(res.statusCode).toBe(200);
      res.body.movies.forEach((m) => {
        expect(m.genre).toContain('Sci-Fi');
      });
    });

    it('should fetch single movie details by ID', async () => {
      const res = await request(app).get(`/api/movies/${testMovie._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.movie.title).toBe(testMovie.title);
    });
  });

  describe('4. Seat Lock Conflict & Race Condition Protection', () => {
    it('should lock seats for User 1', async () => {
      const res = await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['A1', 'A2'],
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seats.length).toBe(2);
    });

    it('should REJECT User 2 attempting to lock the same seat (A1)', async () => {
      const res = await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          showId: futureShow._id,
          seatIds: ['A1', 'A3'],
        });
      expect(res.statusCode).toBe(500); // Thrown error caught by centralized handler
      expect(res.body.message).toMatch(/already reserved or booked/i);
    });

    it('should allow User 1 to unlock their seat', async () => {
      const res = await request(app)
        .post('/api/bookings/unlock-seats')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['A1'],
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should now allow User 2 to lock A1 after User 1 released it', async () => {
      const res = await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken2}`)
        .send({
          showId: futureShow._id,
          seatIds: ['A1'],
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Booking & Payment Success Flow', () => {
    let bookingId;

    it('should book and pay successfully with mock gateway', async () => {
      // 1. Lock seats B1, B2 for user 1
      await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['B1', 'B2'],
        });

      // 2. Submit payment
      const payRes = await request(app)
        .post('/api/bookings/pay')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['B1', 'B2'],
          paymentMethod: 'card',
          forceFail: false,
        });

      expect(payRes.statusCode).toBe(201);
      expect(payRes.body.success).toBe(true);
      expect(payRes.body.booking.status).toBe('confirmed');
      expect(payRes.body.booking.bookingCode).toMatch(/^IMV-/);
      expect(payRes.body.payment.status).toBe('success');

      bookingId = payRes.body.booking._id;

      // 3. Verify in database seats are now marked 'booked'
      const seats = await Seat.find({
        show: futureShow._id,
        seatId: { $in: ['B1', 'B2'] },
      });
      seats.forEach((s) => {
        expect(s.status).toBe('booked');
      });
    });

    it('should retrieve user bookings list containing the new booking', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${userToken1}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.bookings.some((b) => b._id.toString() === bookingId.toString())).toBe(true);
    });
  });

  describe('6. Payment Failure Releases Seats', () => {
    it('should release locked seats when payment forcibly fails', async () => {
      // 1. Lock seats C1, C2
      await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['C1', 'C2'],
        });

      // 2. Submit payment with forceFail: true
      const payRes = await request(app)
        .post('/api/bookings/pay')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['C1', 'C2'],
          paymentMethod: 'card',
          forceFail: true,
        });

      expect(payRes.statusCode).toBe(400);
      expect(payRes.body.success).toBe(false);
      expect(payRes.body.message).toMatch(/Forced payment failure/i);

      // 3. Verify that seats are released back to 'available'
      const seats = await Seat.find({
        show: futureShow._id,
        seatId: { $in: ['C1', 'C2'] },
      });
      seats.forEach((s) => {
        expect(s.status).toBe('available');
        expect(s.lockedBy).toBeNull();
      });
    });
  });

  describe('7. Cancellation Rules (> 2 hours vs < 2 hours)', () => {
    it('should allow cancellation if show is > 2 hours away', async () => {
      // Book seats D1, D2 on futureShow (tomorrow)
      await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['D1', 'D2'],
        });

      const payRes = await request(app)
        .post('/api/bookings/pay')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: futureShow._id,
          seatIds: ['D1', 'D2'],
          paymentMethod: 'card',
          forceFail: false,
        });

      const bookingId = payRes.body.booking._id;

      // Cancel the booking
      const cancelRes = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ reason: 'Schedule change' });

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.booking.status).toBe('cancelled');

      // Verify seats are released back to available
      const seats = await Seat.find({
        show: futureShow._id,
        seatId: { $in: ['D1', 'D2'] },
      });
      seats.forEach((s) => {
        expect(s.status).toBe('available');
      });
    });

    it('should REJECT cancellation if show is < 2 hours away', async () => {
      // Book seats E1, E2 on nearShow (45 mins away)
      await request(app)
        .post('/api/bookings/lock-seats')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: nearShow._id,
          seatIds: ['E1', 'E2'],
        });

      const payRes = await request(app)
        .post('/api/bookings/pay')
        .set('Authorization', `Bearer ${userToken1}`)
        .send({
          showId: nearShow._id,
          seatIds: ['E1', 'E2'],
          paymentMethod: 'card',
          forceFail: false,
        });

      const bookingId = payRes.body.booking._id;

      // Attempt to cancel
      const cancelRes = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send({ reason: 'Emergency' });

      expect(cancelRes.statusCode).toBe(400);
      expect(cancelRes.body.success).toBe(false);
      expect(cancelRes.body.message).toMatch(/Cancellation not allowed.*2 hours before/i);
    });
  });

  describe('8. Centralized Error Handling & Health API', () => {
    it('should return 404 for invalid ObjectId on movie details', async () => {
      const res = await request(app).get('/api/movies/invalid-id-format');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return health check status online', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.database.isConnected).toBe(true);
    });
  });
});
