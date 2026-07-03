/**
 * Migration Script: MongoDB Atlas → SQLite
 * B-Hair Project
 * 
 * Usage:
 *   node scripts/migrate_mongo_to_sqlite.js
 * 
 * Requirements:
 *   - MONGODB_URI in .env
 *   - bhair.db initialized (run init_sqlite.sql first)
 */

const Database = require('better-sqlite3');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const DB_PATH = './bhair.db';

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const db = new Database(DB_PATH, { verbose: console.log });

// Helper: Convert MongoDB ObjectId to string
const oid = (id) => id ? id.toString() : null;

// Helper: Convert Date to ISO string
const dateStr = (date) => date ? date.toISOString() : null;

async function migrate() {
  console.log('🚀 Starting migration from MongoDB Atlas to SQLite...\n');
  
  let client;
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    client = await MongoClient.connect(MONGO_URI);
    const mongodb = client.db('BHair'); // Capital H
    console.log('✅ Connected to MongoDB\n');
    
    // Disable foreign key checks during migration
    db.pragma('foreign_keys = OFF');
    
    // Start transaction for SQLite
    db.exec('BEGIN TRANSACTION');
    
    // ========================================
    // 1. Migrate Users
    // ========================================
    console.log('👤 Migrating users...');
    const users = await mongodb.collection('users').find().toArray();
    
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, phone_number, password, email, google_id, full_name, 
        role, avatar, is_active, shop_id, fcm_token, barber_profile, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const user of users) {
      insertUser.run(
        oid(user._id),
        user.phoneNumber || null,
        user.password || null,
        user.email || null,
        user.googleId || null,
        user.fullName,
        user.role || 'CUSTOMER',
        user.avatar || '',
        user.isActive !== false ? 1 : 0,
        oid(user.shopId),
        user.fcmToken || null,
        user.barberProfile ? JSON.stringify(user.barberProfile) : null,
        dateStr(user.createdAt) || new Date().toISOString(),
        dateStr(user.updatedAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${users.length} users\n`);
    
    // ========================================
    // 2. Migrate Shops
    // ========================================
    console.log('🏪 Migrating shops...');
    const shops = await mongodb.collection('shops').find().toArray();
    
    const insertShop = db.prepare(`
      INSERT OR REPLACE INTO shops (
        id, name, address, gender, location_type, location_longitude, location_latitude,
        phone, images1, images2, images3, videos, manager_id, average_rating, total_reviews,
        is_active, subscription_plan, subscription_expiry, is_paid,
        open_time, close_time, break_start, break_end, slot_duration,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const shop of shops) {
      insertShop.run(
        oid(shop._id),
        shop.name,
        shop.address,
        shop.gender || 'MALE',
        'Point',
        shop.location?.coordinates?.[0] || 0,
        shop.location?.coordinates?.[1] || 0,
        shop.phone,
        JSON.stringify(shop.images1 || []),
        JSON.stringify(shop.images2 || []),
        JSON.stringify(shop.images3 || []),
        JSON.stringify(shop.videos || []),
        oid(shop.managerId),
        shop.averageRating || 5.0,
        shop.totalReviews || 0,
        shop.isActive !== false ? 1 : 0,
        shop.subscriptionPlan || 'MONTHLY',
        dateStr(shop.subscriptionExpiry),
        shop.isPaid ? 1 : 0,
        shop.openTime || '09:00',
        shop.closeTime || '21:00',
        shop.breakStart || null,
        shop.breakEnd || null,
        shop.slotDuration || 30,
        dateStr(shop.createdAt) || new Date().toISOString(),
        dateStr(shop.updatedAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${shops.length} shops\n`);
    
    // ========================================
    // 3. Migrate Services
    // ========================================
    console.log('✂️ Migrating services...');
    const services = await mongodb.collection('services').find().toArray();
    
    const insertService = db.prepare(`
      INSERT OR REPLACE INTO services (
        id, shop_id, name, description, price, manager_extra_fee, 
        duration, image, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const service of services) {
      insertService.run(
        oid(service._id),
        oid(service.shopId),
        service.name,
        service.description || '',
        service.price,
        service.managerExtraFee || 0,
        service.duration,
        service.image || '',
        service.isActive !== false ? 1 : 0,
        dateStr(service.createdAt) || new Date().toISOString(),
        dateStr(service.updatedAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${services.length} services\n`);
    
    // ========================================
    // 4. Migrate Appointments
    // ========================================
    console.log('📅 Migrating appointments...');
    const appointments = await mongodb.collection('appointments').find().toArray();
    
    const insertAppointment = db.prepare(`
      INSERT OR REPLACE INTO appointments (
        id, shop_id, customer_id, customer_name, customer_phone, barber_id,
        service_ids, booking_date, end_time, total_price, status, 
        booking_code, note, service_changes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const apt of appointments) {
      insertAppointment.run(
        oid(apt._id),
        oid(apt.shopId),
        oid(apt.customerId),
        apt.customerName || null,
        apt.customerPhone || null,
        oid(apt.barberId),
        JSON.stringify((apt.serviceIds || []).map(id => oid(id))),
        dateStr(apt.bookingDate),
        dateStr(apt.endTime),
        apt.totalPrice,
        apt.status || 'PENDING',
        apt.bookingCode || `BH${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`, // Generate if missing
        apt.note || '',
        apt.serviceChanges ? JSON.stringify(apt.serviceChanges.map(sc => ({
          action: sc.action,
          serviceId: oid(sc.serviceId),
          byName: sc.byName,
          byId: oid(sc.byId),
          date: dateStr(sc.date)
        }))) : null,
        dateStr(apt.createdAt) || new Date().toISOString(),
        dateStr(apt.updatedAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${appointments.length} appointments\n`);
    
    // ========================================
    // 5. Migrate Reviews
    // ========================================
    console.log('⭐ Migrating reviews...');
    const reviews = await mongodb.collection('reviews').find().toArray();
    
    const insertReview = db.prepare(`
      INSERT OR REPLACE INTO reviews (
        id, appointment_id, shop_id, customer_id, barber_id, 
        rating, comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const review of reviews) {
      insertReview.run(
        oid(review._id),
        oid(review.appointmentId),
        oid(review.shopId),
        oid(review.customerId),
        oid(review.barberId),
        review.rating,
        review.comment || '',
        dateStr(review.createdAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${reviews.length} reviews\n`);
    
    // ========================================
    // 6. Migrate Notifications
    // ========================================
    console.log('🔔 Migrating notifications...');
    const notifications = await mongodb.collection('notifications').find().toArray();
    
    const insertNotification = db.prepare(`
      INSERT OR REPLACE INTO notifications (
        id, recipient_id, sender_id, type, title, message, 
        data, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const notif of notifications) {
      insertNotification.run(
        oid(notif._id),
        oid(notif.recipientId),
        oid(notif.senderId),
        notif.type,
        notif.title,
        notif.message,
        notif.data ? JSON.stringify(notif.data) : null,
        notif.isRead ? 1 : 0,
        dateStr(notif.createdAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${notifications.length} notifications\n`);
    
    // ========================================
    // 7. Migrate History Logs
    // ========================================
    console.log('📜 Migrating history logs...');
    const historyLogs = await mongodb.collection('historylogs').find().toArray();
    
    const insertHistory = db.prepare(`
      INSERT OR REPLACE INTO history_logs (
        id, shop_id, actor_id, actor_name, action, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const log of historyLogs) {
      insertHistory.run(
        oid(log._id),
        oid(log.shopId),
        oid(log.actorId),
        log.actorName,
        log.action,
        log.details,
        dateStr(log.createdAt) || new Date().toISOString()
      );
    }
    console.log(`✅ Migrated ${historyLogs.length} history logs\n`);
    
    // Commit transaction
    db.exec('COMMIT');
    
    // Re-enable foreign key checks
    db.pragma('foreign_keys = ON');
    
    // ========================================
    // Summary
    // ========================================
    console.log('📊 Migration Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`  Users:         ${users.length}`);
    console.log(`  Shops:         ${shops.length}`);
    console.log(`  Services:      ${services.length}`);
    console.log(`  Appointments:  ${appointments.length}`);
    console.log(`  Reviews:       ${reviews.length}`);
    console.log(`  Notifications: ${notifications.length}`);
    console.log(`  History Logs:  ${historyLogs.length}`);
    console.log('═══════════════════════════════════════');
    
    // Verify counts
    console.log('\n🔍 Verifying SQLite data...');
    const counts = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      shops: db.prepare('SELECT COUNT(*) as count FROM shops').get().count,
      services: db.prepare('SELECT COUNT(*) as count FROM services').get().count,
      appointments: db.prepare('SELECT COUNT(*) as count FROM appointments').get().count,
      reviews: db.prepare('SELECT COUNT(*) as count FROM reviews').get().count,
      notifications: db.prepare('SELECT COUNT(*) as count FROM notifications').get().count,
      history_logs: db.prepare('SELECT COUNT(*) as count FROM history_logs').get().count,
    };
    
    console.log('SQLite Record Counts:');
    console.log('═══════════════════════════════════════');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table.padEnd(15)}: ${count}`);
    });
    console.log('═══════════════════════════════════════\n');
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Backup MongoDB data (if not done)');
    console.log('  2. Test SQLite queries');
    console.log('  3. Update backend code to use SQLite');
    console.log('  4. Run test suite');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    db.exec('ROLLBACK');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n📡 Disconnected from MongoDB');
    }
    db.close();
    console.log('💾 Closed SQLite database\n');
  }
}

// Run migration
migrate().catch(console.error);
