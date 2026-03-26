const bcrypt = require('bcrypt');

const password = 'admin123'; // รหัสผ่าน
bcrypt.hash(password, 10).then(hash => {
    console.log(hash);
});