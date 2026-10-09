
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import { hashPassword, verifyPassword } from "./utils/passwordUtils.js";
import Student from "./database/mern.js";
import Student1 from "./database/contact.js";
import User from "./database/user.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT ||3001;
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET||"change-this-secret",
    resave:false,
    saveUninitialized:false,
    cookie: {
      httpOnly: true,
      secure: false, //Local HTTP development only
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
// ================= DATABASE =================
mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/StudentForm1"
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) =>
    console.error("MongoDB connection error:", error)
  );
// ================= USER REGISTRATION =================
app.post("/user", async (req, res)=>{
  try {
    const {fullName, phone, email, password, role= "customer"} =
      req.body;
    if (!fullName||!phone||!email||!password){
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    if (!["customer", "business"].includes(role)) {
      return res.status(400).json({
        message: "Choose Customer or Business",
      });
    }
    const normalizedEmail =email.trim().toLowerCase();
    const existingUser =await User.findOne({
      email: normalizedEmail,
    });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    const newUser = new User({
      fullName,
      phone,
      email:normalizedEmail,
      password:await hashPassword(password),
      role,
    });
    await newUser.save();
    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }
    return res.status(500).json({
      message: "Failed to register user",
    });
  }
});
// =================LOGIN=================
app.post("/login", async(req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    const passwordIsValid =await verifyPassword(
      password,
      user.password
    );
    if (!passwordIsValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    // Regenerate session to help prevent session fixation.
    req.session.regenerate((error)=>{
      if (error) {
        console.error("Session regeneration error:", error);
        return res.status(500).json({
          message: "Failed to create session",
        });
      }
      req.session.userId =user._id.toString();
      req.session.email =user.email;
      req.session.role =user.role;
      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);
          return res.status(500).json({
            message: "Failed to save session",
          });
        }
        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user._id,
            fullName:user.fullName,
            email:user.email,
            role:user.role,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Failed to login",
    });
  }
});
// =================ADMIN SESSION=================
app.get("/admin/session", (req, res) => {
  if (!req.session?.userId || req.session.role !== "admin") {
    return res.status(401).json({
      loggedIn: false,
      message: "Admin is not logged in",
    });
  }
  return res.status(200).json({
    loggedIn: true,
    email: req.session.email,
    role: req.session.role,
  });
});
// =================CREATE STAFF ACCOUNT=================
app.post("/admin/users", async (req, res) => {
  try {
    if (!req.session?.userId || req.session.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }
    const { fullName, phone, email, password, role } = req.body;
    if (!fullName || !phone || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }
    const newUser = new User({
      fullName,
      phone,
      email: normalizedEmail,
      password: await hashPassword(password),
      role,
    });
    await newUser.save();
    return res.status(201).json({
      message: `${role} account created successfully`,
    });
  } catch (error) {
    console.error("Staff creation error:", error);
    return res.status(500).json({
      message: "Failed to create staff account",
    });
  }
});
//=================FOOD REGISTRATION =================
app.post("/adminregistor", async (req, res) => {
  try {
    if (!req.session?.userId || req.session.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }
    const { name, cost, type, file }=req.body;
    if (!name || cost == null || !type) {
      return res.status(400).json({
        message: "Name, cost, and type are required",
      });
    }
    const newFood =new Student({
      name,
      cost,
      type,
      file,
    });
    await newFood.save();
    return res.status(201).json({
      message: "Food registered successfully",
    });
  } catch (error) {
    console.error("Food registration error:", error);
    return res.status(500).json({
      message: "Failed to register food",
    });
  }
});
// ================= ORDER REGISTRATION =================
app.post("/registor", async (req, res) => {
  try {
    const {fullName, phone, location, item, service, notes } =
      req.body;
    const newStudent=new Student1({
      fullName,
      phone,
      location,
      item,
      service,
      notes,
    });
    await newStudent.save();
    return res.status(201).json({
      message: "Order saved successfully",
    });
  } catch (error) {
    console.error("Order registration error:", error);
    return res.status(500).json({
      message: "Failed to save order",
    });
  }
});
// ================= CONTACT FORM =================
app.post("/contact", async (req, res) => {
  try {
    const {name, email, phone, message}=req.body;
    const newContact =new Student1({
      name,
      email,
      phone,
      message,
    });
    await newContact.save();
    return res.status(201).json({
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact error:", error);
    return res.status(500).json({
      message: "Failed to send message",
    });
  }
});
//================= LOGOUT=================
app.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        message: "Could not sign out",
      });
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    return res.status(200).json({
      message: "Signed out successfully",
    });
  });
});
//=================TEST ROUTE=================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "MERN API is running",
  });
});
//=================START SERVER=================
app.listen(PORT, () => {
  console.log(`MERN API server running at http://localhost:${PORT}`);
});

