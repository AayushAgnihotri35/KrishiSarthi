const mongoose = require("mongoose");

const connectDB = async (mongoUri) => {
  try {
   await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
