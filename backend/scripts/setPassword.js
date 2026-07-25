require('dotenv').config({ path: __dirname + '/../.env' });
const dns = require('dns');
dns.setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const [,, identifier, newPass] = process.argv;
if (!identifier || !newPass) {
  console.error('Usage: node setPassword.js <email_or_userId> <newPassword>');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { $or: [{ email: identifier }, { _id: identifier }] } : { email: identifier };
    let user = await User.findOne(query);
    const hash = await bcrypt.hash(newPass, 12);
    if (!user) {
      // create a new user if not found
      const defaultName = (identifier && identifier.includes('@')) ? identifier.split('@')[0] : 'NewUser';
      user = new User({ name: defaultName, email: identifier, password: hash });
      await user.save();
      console.log('Created new user and set password for:', user.email);
    } else {
      user.password = hash;
      await user.save();
      console.log('Password updated for user:', user.email || user._id.toString());
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  }
})();
