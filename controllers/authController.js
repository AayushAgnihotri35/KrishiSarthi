const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "krishi_sarthi_secret";

// Signup
const registerUser = async (req, res) => {
  const { fullname, username, email, password } = req.body;

  if (!fullname || !username || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "All fields are required" 
    });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email or username already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullname, username, email, password: hashedPassword });
    await newUser.save();

    // Generate token for auto-login after registration
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ 
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// Login - FIXED VERSION
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt for username:', username);

  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Username and password are required" 
    });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', username);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    console.log('Login successful for:', username);

    // CRITICAL FIX: Added success: true
    res.status(200).json({
      success: true,  // ← THIS WAS MISSING!
      message: "Login successful",
      token,
      user: { 
        id: user._id,
        fullname: user.fullname, 
        username: user.username, 
        email: user.email 
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// Get profile (requires auth middleware to set req.user)
const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

module.exports = { registerUser, loginUser, getProfile };