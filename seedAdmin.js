require('dotenv').config();
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

async function seed(){
  await connectDB(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL;
  const pass = process.env.ADMIN_PASSWORD;
  const exists = await Admin.findOne({ email });
  if(exists){
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const admin = new Admin({ email, password: pass, name: 'Super Admin' });
  await admin.save();
  console.log('Admin created:', email);
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
