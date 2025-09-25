import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {

    try {
      //get token from the header
      token = req.headers.authorization.split(' ')[1];

      //verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // get user from token's payload (id)
      // and attach it to the request object
      // then exclude password from the use object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        return res.json({ message: 'Not authorized, token for user not found.' });
      }

      next();

    } catch (error) {
      console.error('Token verification error:', error.message);
      res.status(401);
      return res.json({ message: 'Not authorized, token failed.' });
    };
  };

  if (!token) {
    res.status(401);
    return res.json({ message: 'Not authorized, no token.' });
  };
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403);
    return res.json({ message: 'Not authorized, not an admin.' });
  };
};

export { protect, admin };
