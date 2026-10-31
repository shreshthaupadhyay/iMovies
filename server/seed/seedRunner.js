const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { movies, theatres } = require('./seedData');
const { generateSeatsForShow } = require('../controllers/showController');
const logger = require('../utils/logger');
const { connectDB } = require('../config/db');

const seedDatabase = async (force = false) => {
  try {
    const existingUsers = await User.countDocuments();
    const existingMovies = await Movie.countDocuments();

    if (!force && existingUsers > 0 && existingMovies > 0) {
      logger.info(`[SEED] Database already populated with ${existingMovies} movies and ${existingUsers} users. Skipping auto-seed.`);
      return;
    }

    logger.info(`[SEED] Initializing database seed...`);

    if (force) {
      await Promise.all([
        User.deleteMany({}),
        Movie.deleteMany({}),
        Theatre.deleteMany({}),
        Show.deleteMany({}),
        Seat.deleteMany({}),
        Booking.deleteMany({}),
        Payment.deleteMany({}),
        Notification.deleteMany({}),
      ]);
      logger.info(`[SEED] Cleared existing data.`);
    }

    // 1. Create Default Admin & User
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@imovies.com',
      password: 'Admin@123',
      phone: '+91 9876543210',
      role: 'admin',
    });

    const demoUser = await User.create({
      name: 'Aman Sharma',
      email: 'user@imovies.com',
      password: 'User@123',
      phone: '+91 9823456789',
      role: 'user',
    });

    logger.info(`[SEED] Created Admin (admin@imovies.com) and Demo User (user@imovies.com)`);

    // 2. Insert Movies
    const createdMovies = await Movie.insertMany(movies);
    logger.info(`[SEED] Inserted ${createdMovies.length} movies.`);

    // 3. Insert Theatres
    const createdTheatres = await Theatre.insertMany(theatres);
    logger.info(`[SEED] Inserted ${createdTheatres.length} theatres.`);

    // 4. Generate Shows for next 7 days (4 shows/day/screen)
    const nowShowingMovies = createdMovies.filter((m) => m.status === 'nowShowing');
    let movieIndex = 0;
    let totalShowsCount = 0;

    const showtimesConfig = [
      { startHour: 10, startMin: 0, durationMin: 165 },
      { startHour: 13, startMin: 30, durationMin: 165 },
      { startHour: 17, startMin: 0, durationMin: 165 },
      { startHour: 20, startMin: 30, durationMin: 165 },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const theatre of createdTheatres) {
      for (const screen of theatre.screens) {
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          for (const slot of showtimesConfig) {
            const currentMovie = nowShowingMovies[movieIndex % nowShowingMovies.length];
            movieIndex++;

            const startTime = new Date(today);
            startTime.setDate(today.getDate() + dayOffset);
            startTime.setHours(slot.startHour, slot.startMin, 0, 0);

            const endTime = new Date(startTime.getTime() + slot.durationMin * 60 * 1000);

            let format = '2D';
            if (screen.name.includes('IMAX')) format = 'IMAX 2D';
            else if (screen.name.includes('4DX')) format = '4DX';
            else if (screen.name.includes('3D')) format = '3D';

            const showPrices = screen.name.includes('IMAX')
              ? { premium: 450, regular: 350, economy: 200 }
              : { premium: 350, regular: 250, economy: 150 };

            const show = await Show.create({
              movie: currentMovie._id,
              theatre: theatre._id,
              screen: screen.name,
              startTime,
              endTime,
              prices: showPrices,
              format,
              language: currentMovie.language,
            });

            await generateSeatsForShow(show._id, showPrices);
            totalShowsCount++;
          }
        }
      }
    }

    logger.info(`[SEED] Created ${totalShowsCount} shows with seat layouts across 7 days.`);

    // 5. Seed a sample booking for demo user
    const sampleShow = await Show.findOne({
      startTime: { $gt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    }).populate('movie theatre');

    if (sampleShow) {
      const seatsToBook = await Seat.find({
        show: sampleShow._id,
        seatId: { $in: ['C6', 'C7'] },
      });

      if (seatsToBook.length === 2) {
        await Seat.updateMany(
          { _id: { $in: seatsToBook.map((s) => s._id) } },
          { $set: { status: 'booked', lockedBy: demoUser._id } }
        );

        const totalAmt = seatsToBook.reduce((acc, s) => acc + s.price, 0);
        const sampleBooking = await Booking.create({
          user: demoUser._id,
          show: sampleShow._id,
          seats: seatsToBook.map((s) => ({
            seatId: s.seatId,
            row: s.row,
            number: s.number,
            tier: s.tier,
            price: s.price,
          })),
          totalAmount: totalAmt,
          status: 'confirmed',
          bookingCode: 'IMV-DEMO01',
        });

        await Payment.create({
          booking: sampleBooking._id,
          user: demoUser._id,
          amount: totalAmt,
          method: 'card',
          status: 'success',
          transactionId: `TXN_MOCK_DEMO_${Date.now()}`,
          gateway: 'mock',
        });

        await Notification.create({
          user: demoUser._id,
          message: `Booking confirmed for "${sampleShow.movie.title}" at ${sampleShow.theatre.name}. Code: IMV-DEMO01`,
          type: 'booking',
        });

        logger.info(`[SEED] Created sample demo booking IMV-DEMO01 for demo user.`);
      }
    }

    logger.info(`[SEED] Database seeding completed successfully!`);
  } catch (err) {
    logger.error(`[SEED] Error seeding database: ${err.message}`);
    throw err;
  }
};

if (require.main === module) {
  require('dotenv').config();
  connectDB()
    .then(() => seedDatabase(true))
    .then(() => {
      logger.info('[SEED] Standalone seed script finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(`[SEED] Standalone seed error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = seedDatabase;
