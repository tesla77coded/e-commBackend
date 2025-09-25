import 'dotenv/config';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: 100000,
    }
  );
};

export default generateToken;
