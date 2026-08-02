import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import mongoose from "mongoose";
import Student from "./database/mern.js";
const app = express();
// Middleware
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
  })
);
// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/StudentForm1")
  .then(()=>console.log("✅ MongoDB Connected"))
  .catch((err)=>console.log("❌ MongoDB Error:", err));
// Routes
app.get("/et", (req, res) => {
  res.send("Hello Ethiopia");
});
// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({
      success: true,
      message: "Student Saved Successfully",
      data: student,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({
        message: "Email not found",
      });
    }
    res.json({
      message: "Login successful",
      student,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});
// Server
app.listen(process.env.PORT, () => {
  console.log("🚀 Server running on http://localhost:3000");
});