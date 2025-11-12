// Google Login
router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Google token is required' });
  }

  try {
    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const username = email.split('@')[0];

    // Check if user already exists in DB
    let user;
    try {
      user = await UserModel.findByUsername(username);
    } catch (err) {
      console.warn('DB lookup error, fallback to JSON file:', err.message);
      const users = loadJSON(usersPath);
      user = users.find((u) => u.username === username);
    }

    // If user doesn’t exist, create one
    if (!user) {
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username,
        password: null, // no password for Google login
        email,
        full_name: name,
        role: 'student',
        created_at: new Date(),
        last_login: new Date(),
        picture,
      };

      const userId = await UserModel.create(newUser);
      user = await UserModel.findById(userId);
    } else {
      // Update last login
      try {
        await UserModel.update(user.id, { last_login: new Date() });
      } catch (dbError) {
        console.log('DB update failed, skipping:', dbError.message);
      }
    }

    // Generate your own JWT for app sessions
    const appToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.full_name,
        role: user.role,
      },
      token: appToken,
    });
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});
