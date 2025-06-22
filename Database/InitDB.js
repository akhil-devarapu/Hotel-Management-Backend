// Database/initDB.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db=require('../src/config/database')
const schemaPath = path.resolve(__dirname, 'schema.sql');
const seedPath = path.resolve(__dirname, 'seed.sql');
function initializeDatabase() {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const seed = fs.readFileSync(seedPath, 'utf8');

    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Failed to apply schema:', err.message);
      } else {
        console.log('✅ Schema applied successfully');

        db.exec(seed, (err) => {
          if (err) {
            console.error('❌ Failed to apply seed data:', err.message);
          } else {
            console.log('✅ Seed data inserted successfully');
          }
        });
      }
    });
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

module.exports = { db, initializeDatabase };
