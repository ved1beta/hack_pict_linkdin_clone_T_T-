const mongoose = require('mongoose');

const uri = "mongodb+srv://harshagrawal6996:TestPass123@cluster0.i7jfkde.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });
