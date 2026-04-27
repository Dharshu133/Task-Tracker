const bcrypt = require('bcryptjs');
const hash = '$2a$12$LQv3c1yqBWVHxkd0LqCFS.Djg5yP6p3m.S3e/9T0lV9f9.mG.qY.q';
const password = 'password123';

bcrypt.compare(password, hash).then(res => {
  console.log('Match:', res);
});
