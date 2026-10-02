
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

// --------------------------------------------------
// ENVIRONMENT VALIDATION
// --------------------------------------------------

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_SECRET || !MONGODB_URI) {
  console.error("Missing required environment variables.");
  console.error(
    "Required: ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET, MONGODB_URI"
  );
  process.exit(1);
}

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// --------------------------------------------------
// MONGODB MODELS
// --------------------------------------------------

const businessSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true },
    category: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    googleReviewUrl: { type: String, default: "" },
    selectedQuestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    status: { type: String, default: "Active" },
    qrStatus: { type: String, default: "Pending" },
    reviewsGenerated: { type: Number, default: 0 },
    createdAt: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  { timestamps: true, strict: false }
);

const reviewActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    businessId: { type: String, required: true, index: true },
    event: {
      type: String,
      enum: ["started", "generated", "copied", "google_opened"],
      required: true,
    },
    answers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    generatedReview: { type: String, default: "" },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  { timestamps: true }
);

// Admin credentials are stored separately from business data.
const adminCredentialSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Business = mongoose.model("Business", businessSchema);
const ReviewActivity = mongoose.model(
  "ReviewActivity",
  reviewActivitySchema
);
const AdminCredential = mongoose.model(
  "AdminCredential",
  adminCredentialSchema
);

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      decoded.email?.trim().toLowerCase() !==
      ADMIN_EMAIL.trim().toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid.",
    });
  }
};

// --------------------------------------------------
// ROOT & HEALTH
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ReviewQR Backend API is running",
  });
});

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected
      ? "Backend and database connected successfully"
      : "Backend is running, but database is not connected",
    server: "ReviewQR API",
    port: PORT,
    database: connected ? "connected" : "disconnected",
  });
});

// --------------------------------------------------
// ADMIN LOGIN
// --------------------------------------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (normalizedEmail !== ADMIN_EMAIL.trim().toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const savedCredential = await AdminCredential.findOne({
      email: normalizedEmail,
    });

    let isPasswordValid = false;

    if (savedCredential) {
      isPasswordValid = await bcrypt.compare(
        password,
        savedCredential.passwordHash
      );
    } else {
      // Use the .env password until the first password change.
      isPasswordValid = password === ADMIN_PASSWORD;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: "admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      admin: {
        email: ADMIN_EMAIL,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

// --------------------------------------------------
// CHECK ADMIN SESSION
// --------------------------------------------------

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    admin: {
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

// --------------------------------------------------
// CHANGE ADMIN PASSWORD
// --------------------------------------------------

app.put(
  "/api/auth/change-password",
  requireAuth,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Current password and new password are required.",
        });
      }

      if (String(newPassword).length < 8) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 8 characters long.",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from the current password.",
        });
      }

      const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();

      const savedCredential = await AdminCredential.findOne({
        email: normalizedEmail,
      });

      let isCurrentPasswordValid = false;

      if (savedCredential) {
        isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          savedCredential.passwordHash
        );
      } else {
        // Verify against the original .env password before
        // a MongoDB password hash has been created.
        isCurrentPasswordValid =
          currentPassword === ADMIN_PASSWORD;
      }

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await AdminCredential.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: {
            email: normalizedEmail,
            passwordHash,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      return res.json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (error) {
      console.error("Change password error:", error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to change password. Please try again.",
      });
    }
  }
);

// --------------------------------------------------
// GET ALL BUSINESSES - ADMIN ONLY
// --------------------------------------------------

app.get("/api/businesses", requireAuth, async (req, res) => {
  try {
    const businesses = await Business.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: businesses,
      count: businesses.length,
    });
  } catch (error) {
    console.error("Get businesses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve businesses.",
    });
  }
});

// --------------------------------------------------
// GET SINGLE BUSINESS - ADMIN ONLY
// --------------------------------------------------

app.get(
  "/api/businesses/:id",
  requireAuth,
  async (req, res) => {
    try {
      const business = await Business.findOne({
        id: req.params.id,
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      res.json({ success: true, data: business });
    } catch (error) {
      console.error("Get business error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve business.",
      });
    }
  }
);

// --------------------------------------------------
// GET SINGLE BUSINESS - PUBLIC QR PAGE
// --------------------------------------------------

app.get(
  "/api/public/businesses/:id",
  async (req, res) => {
    try {
      const business = await Business.findOne({
        id: req.params.id,
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      res.json({ success: true, data: business });
    } catch (error) {
      console.error("Public business error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve business.",
      });
    }
  }
);

// --------------------------------------------------
// CREATE BUSINESS - ADMIN ONLY
// --------------------------------------------------

app.post("/api/businesses", requireAuth, async (req, res) => {
  try {
    const {
      name,
      category,
      address,
      phone,
      googleReviewUrl,
      selectedQuestions,
      status,
      qrStatus,
      reviewsGenerated,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "Business name and category are required",
      });
    }

    const existing = await Business.find(
      { id: /^BUS_\d+$/ },
      { id: 1, _id: 0 }
    );

    const highestNumber = existing.reduce((max, item) => {
      const match = item.id.match(/^BUS_(\d+)$/);
      return match
        ? Math.max(max, Number(match[1]))
        : max;
    }, 0);

    const businessId = `BUS_${String(
      highestNumber + 1
    ).padStart(6, "0")}`;

    const newBusiness = await Business.create({
      id: businessId,
      name: String(name).trim(),
      category,
      address: address || "",
      phone: phone || "",
      googleReviewUrl: googleReviewUrl || "",
      selectedQuestions: Array.isArray(selectedQuestions)
        ? selectedQuestions
        : [],
      status: status || "Active",
      qrStatus: qrStatus || "Pending",
      reviewsGenerated: Number(reviewsGenerated || 0),
      createdAt: new Date().toISOString().split("T")[0],
    });

    res.status(201).json({
      success: true,
      message: "Business created successfully",
      data: newBusiness,
    });
  } catch (error) {
    console.error("Create business error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create business.",
    });
  }
});

// --------------------------------------------------
// UPDATE BUSINESS - ADMIN ONLY
// --------------------------------------------------

app.put(
  "/api/businesses/:id",
  requireAuth,
  async (req, res) => {
    try {
      const updates = { ...req.body };
      delete updates.id;
      delete updates._id;
      delete updates.__v;

      const business = await Business.findOneAndUpdate(
        { id: req.params.id },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      res.json({
        success: true,
        message: "Business updated successfully",
        data: business,
      });
    } catch (error) {
      console.error("Update business error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update business.",
      });
    }
  }
);

// --------------------------------------------------
// DELETE BUSINESS - ADMIN ONLY
// --------------------------------------------------

app.delete(
  "/api/businesses/:id",
  requireAuth,
  async (req, res) => {
    try {
      const business = await Business.findOneAndDelete({
        id: req.params.id,
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      await ReviewActivity.deleteMany({
        businessId: req.params.id,
      });

      res.json({
        success: true,
        message: "Business deleted successfully",
        data: business,
      });
    } catch (error) {
      console.error("Delete business error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete business.",
      });
    }
  }
);

// --------------------------------------------------
// CREATE REVIEW ACTIVITY - PUBLIC
// --------------------------------------------------

app.post(
  "/api/reviews/activity",
  async (req, res) => {
    try {
      const {
        businessId,
        event,
        answers,
        generatedReview,
      } = req.body;

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Business ID is required.",
        });
      }

      const business = await Business.findOne({
        id: businessId,
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      const allowedEvents = [
        "started",
        "generated",
        "copied",
        "google_opened",
      ];

      if (!allowedEvents.includes(event)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review activity event",
        });
      }

      const activity = await ReviewActivity.create({
        id: `REV_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        businessId,
        event,
        answers: Array.isArray(answers) ? answers : [],
        generatedReview: generatedReview || "",
        createdAt: new Date().toISOString(),
      });

      if (event === "generated") {
        business.reviewsGenerated =
          Number(business.reviewsGenerated || 0) + 1;
        await business.save();
      }

      res.status(201).json({
        success: true,
        message: "Review activity recorded",
        data: activity,
        reviewsGenerated: business.reviewsGenerated,
      });
    } catch (error) {
      console.error(
        "Create review activity error:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to record review activity.",
      });
    }
  }
);

// --------------------------------------------------
// GET REVIEW ACTIVITIES - ADMIN ONLY
// --------------------------------------------------

app.get(
  "/api/reviews/activity",
  requireAuth,
  async (req, res) => {
    try {
      const filter = req.query.businessId
        ? { businessId: req.query.businessId }
        : {};

      const data = await ReviewActivity.find(filter).sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      console.error("Get review activity error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve review activity.",
      });
    }
  }
);

// --------------------------------------------------
// GET REVIEW STATISTICS - ADMIN ONLY
// --------------------------------------------------

app.get(
  "/api/reviews/statistics",
  requireAuth,
  async (req, res) => {
    try {
      const counts = await ReviewActivity.aggregate([
        {
          $group: {
            _id: "$event",
            count: { $sum: 1 },
          },
        },
      ]);

      const data = {
        started: 0,
        generated: 0,
        copied: 0,
        googleOpened: 0,
      };

      counts.forEach((item) => {
        if (item._id === "started") {
          data.started = item.count;
        }
        if (item._id === "generated") {
          data.generated = item.count;
        }
        if (item._id === "copied") {
          data.copied = item.count;
        }
        if (item._id === "google_opened") {
          data.googleOpened = item.count;
        }
      });

      res.json({ success: true, data });
    } catch (error) {
      console.error("Review statistics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve review statistics.",
      });
    }
  }
);

// --------------------------------------------------
// START SERVER AFTER DATABASE CONNECTION
// --------------------------------------------------

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        `Admin login configured for: ${ADMIN_EMAIL}`
      );
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();