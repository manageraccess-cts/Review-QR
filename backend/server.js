const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const OpenAI = require("openai");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 465);
const EMAIL_SECURE = process.env.EMAIL_SECURE !== "false";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const emailTransporter =
  EMAIL_USER && EMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_SECURE,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_APP_PASSWORD.replace(/\s/g, ""),
        },
      })
    : null;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-6-luna";

const openai = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  : null;

// --------------------------------------------------
// ENVIRONMENT VALIDATION
// --------------------------------------------------

if (
  !ADMIN_EMAIL ||
  !ADMIN_PASSWORD ||
  !JWT_SECRET ||
  !MONGODB_URI
) {
  console.error(
    "Missing required environment variables."
  );

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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
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

    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    businessType: {
      type: String,
      default: "",
    },

    specialization: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    googleReviewUrl: {
      type: String,
      default: "",
    },

    selectedQuestions: {
      type: [
        mongoose.Schema.Types.Mixed,
      ],
      default: [],
    },

    status: {
      type: String,
      default: "Active",
    },

    qrStatus: {
      type: String,
      default: "Pending",
    },

    reviewsGenerated: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: String,
      default: () =>
        new Date()
          .toISOString()
          .split("T")[0],
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const reviewActivitySchema =
  new mongoose.Schema(
    {
      id: {
        type: String,
        required: true,
        unique: true,
      },

      businessId: {
        type: String,
        required: true,
        index: true,
      },

      event: {
        type: String,
        enum: [
          "started",
          "generated",
          "copied",
          "google_opened",
        ],
        required: true,
      },

      answers: {
        type: [
          mongoose.Schema.Types.Mixed,
        ],
        default: [],
      },

      generatedReview: {
        type: String,
        default: "",
      },

      createdAt: {
        type: String,
        default: () =>
          new Date().toISOString(),
      },
    },
    {
      timestamps: true,
    }
  );

// Admin credentials are stored separately
// from business data.

const adminCredentialSchema =
  new mongoose.Schema(
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

      resetOtpHash: {
        type: String,
        default: undefined,
      },
      
      resetOtpExpires: {
        type: Date,
        default: undefined,
      },

      resetOtpVerifiedAt: {
        type: Date,
        default: undefined,
      },
    },
    {
      timestamps: true,
    }
  );

const Business =
  mongoose.model(
    "Business",
    businessSchema
  );

const ReviewActivity =
  mongoose.model(
    "ReviewActivity",
    reviewActivitySchema
  );

const AdminCredential =
  mongoose.model(
    "AdminCredential",
    adminCredentialSchema
  );

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

const requireAuth = (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    if (
      decoded.email
        ?.trim()
        .toLowerCase() !==
      ADMIN_EMAIL
        .trim()
        .toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized access.",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Session expired or invalid.",
    });
  }
};

// --------------------------------------------------
// AI QUESTION GENERATOR
// --------------------------------------------------

app.post(
  "/api/questions/generate",
  requireAuth,
  async (req, res) => {
    try {
      const {
        category,
        businessType,
        specialization,
      } = req.body || {};

      // --------------------------------------------
      // VALIDATE CATEGORY
      // --------------------------------------------

      if (!category) {
        return res.status(400).json({
          success: false,
          message:
            "Category is required.",
        });
      }

      // --------------------------------------------
      // CHECK OPENAI CONFIGURATION
      // --------------------------------------------

      if (
        !OPENAI_API_KEY ||
        !openai
      ) {
        return res.status(503).json({
          success: false,
          message:
            "AI question generation is not configured. Please add OPENAI_API_KEY to the backend .env file.",
        });
      }

      // --------------------------------------------
      // NORMALIZE INPUT
      // --------------------------------------------

      const categoryText =
        String(category).trim();

      const businessTypeText =
        String(
          businessType || ""
        ).trim();

      const specializationText =
        String(
          specialization || ""
        ).trim();

      // --------------------------------------------
      // BUILD BUSINESS DESCRIPTION
      // --------------------------------------------

      const businessDescription = [
        categoryText,
        businessTypeText,
        specializationText,
      ]
        .filter(Boolean)
        .join(" → ");

      console.log(
        "Generating AI questions for:",
        businessDescription
      );

      // --------------------------------------------
      // OPENAI REQUEST
      // --------------------------------------------

      const response =
        await openai.responses.create(
          {
            model:
              OPENAI_MODEL,

            input: [
              {
                role: "system",

                content: [
                  {
                    type: "input_text",

                    text: `You are the question designer for ReviewQR, a customer feedback and Google review QR platform.

Generate exactly 15 useful, natural customer-feedback questions for the selected business type.

Business type:
${businessDescription}

Rules:

1. Questions must be specific to the business type, not generic whenever a more relevant question is possible.

2. Cover different aspects of the customer experience such as service quality, staff, product/treatment, cleanliness, communication, value, convenience, and overall experience when relevant.

3. Do not ask two questions that are essentially the same.

4. Keep every question short and easy for a customer to understand on a mobile screen.

5. Do not ask for personal, medical, financial, or other sensitive information.

6. Do not ask open-ended questions. Every question must be answerable by the supplied options.

7. Each question must have exactly 4 answer options.

8. The four options should be natural for that particular question and should progress from negative to positive.

9. Use scores exactly as follows:
- least positive answer = 1
- second answer = 2
- third answer = 4
- most positive answer = 5

10. Do not use a score of 3.

11. Do not put question marks at the end of the question text.

12. Do not include numbering in the question text.

13. Do not include emojis in the question text or answer text.

14. Every question must be different.

15. Every answer option should be meaningful for the specific question.

16. The answer options should not simply be "Excellent, Good, Average, Poor" for every question. Adapt them naturally to the question.

17. Return exactly 15 questions.

18. Return nothing outside the requested JSON structure.`,
                  },
                ],
              },

              {
                role: "user",

                content: [
                  {
                    type: "input_text",

                    text: `Create the 15 ReviewQR questions for:

Category:
${categoryText}

Business Type:
${businessTypeText || "Not specified"}

Specialization:
${specializationText || "Not specified"}`,
                  },
                ],
              },
            ],

            text: {
              format: {
                type: "json_schema",

                name:
                  "reviewqr_question_set",

                description:
                  "Exactly 15 customer feedback questions with four scored answer options each.",

                strict: true,

                schema: {
                  type: "object",

                  additionalProperties:
                    false,

                  properties: {
                    questions: {
                      type: "array",

                      minItems: 15,

                      maxItems: 15,

                      items: {
                        type: "object",

                        additionalProperties:
                          false,

                        properties: {
                          question: {
                            type: "string",
                          },

                          options: {
                            type: "array",

                            minItems: 4,

                            maxItems: 4,

                            items: {
                              type: "object",

                              additionalProperties:
                                false,

                              properties: {
                                text: {
                                  type: "string",
                                },

                                score: {
                                  type: "number",

                                  enum: [
                                    1,
                                    2,
                                    4,
                                    5,
                                  ],
                                },
                              },

                              required: [
                                "text",
                                "score",
                              ],
                            },
                          },
                        },

                        required: [
                          "question",
                          "options",
                        ],
                      },
                    },
                  },

                  required: [
                    "questions",
                  ],
                },
              },
            },

            max_output_tokens:
              5000,
          }
        );

      // --------------------------------------------
      // CHECK AI RESPONSE
      // --------------------------------------------

      if (
        !response.output_text
      ) {
        return res.status(502).json({
          success: false,
          message:
            "AI did not return any questions. Please try again.",
        });
      }

      // --------------------------------------------
      // PARSE JSON
      // --------------------------------------------

      let parsed;

      try {
        parsed = JSON.parse(
          response.output_text
        );
      } catch (
        parseError
      ) {
        console.error(
          "AI question JSON parse error:",
          parseError
        );

        console.error(
          "AI raw output:",
          response.output_text
        );

        return res.status(502).json({
          success: false,
          message:
            "AI returned an invalid question format. Please try again.",
        });
      }

      // --------------------------------------------
      // VERIFY EXACTLY 15 QUESTIONS
      // --------------------------------------------

      if (
        !parsed ||
        !Array.isArray(
          parsed.questions
        ) ||
        parsed.questions.length !==
          15
      ) {
        return res.status(502).json({
          success: false,
          message:
            "AI did not generate exactly 15 questions. Please try again.",
        });
      }

      // --------------------------------------------
      // NORMALIZE QUESTIONS
      // --------------------------------------------

      const questions =
        parsed.questions.map(
          (
            item,
            index
          ) => ({
            id: `AI_${Date.now()}_${String(
              index + 1
            ).padStart(
              2,
              "0"
            )}_${Math.random()
              .toString(36)
              .slice(
                2,
                7
              )}`,

            category:
              categoryText,

            businessType:
              businessTypeText,

            specialization:
              specializationText,

            question:
              String(
                item.question ||
                  ""
              )
                .replace(
                  /[?؟]+$/g,
                  ""
                )
                .trim(),

            options:
              Array.isArray(
                item.options
              )
                ? item.options.map(
                    (
                      option
                    ) => ({
                      text:
                        String(
                          option.text ||
                            ""
                        ).trim(),

                      score:
                        Number(
                          option.score
                        ),
                    })
                  )
                : [],

            status:
              "Active",

            source:
              "AI",
          })
        );

      // --------------------------------------------
      // VALIDATE GENERATED DATA
      // --------------------------------------------

      const valid =
        questions.every(
          (
            question
          ) =>
            question.question &&
            Array.isArray(
              question.options
            ) &&
            question.options
              .length === 4 &&
            question.options.every(
              (
                option
              ) =>
                option.text &&
                [
                  1,
                  2,
                  4,
                  5,
                ].includes(
                  option.score
                )
            )
        );

      if (!valid) {
        return res.status(502).json({
          success: false,
          message:
            "AI generated an invalid question or answer format. Please try again.",
        });
      }

      // --------------------------------------------
      // SUCCESS
      // --------------------------------------------

      console.log(
        `AI generated ${questions.length} questions successfully.`
      );

      return res.json({
        success: true,

        message:
          "15 questions generated successfully.",

        data: {
          category:
            categoryText,

          businessType:
            businessTypeText,

          specialization:
            specializationText,

          questions,
        },
      });
    } catch (error) {
      console.error(
        "AI question generation error:",
        error
      );

      const status =
        error?.status &&
        Number.isInteger(
          error.status
        )
          ? error.status
          : 500;

      return res.status(status).json({
        success: false,

        message:
          error?.message ||
          "Failed to generate questions with AI. Please try again.",
      });
    }
  }
);

// --------------------------------------------------
// ROOT & HEALTH
// --------------------------------------------------

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "ReviewQR Backend API is running",
    });
  }
);

app.get(
  "/api/health",
  (req, res) => {
    const connected =
      mongoose.connection.readyState ===
      1;

    res
      .status(
        connected
          ? 200
          : 503
      )
      .json({
        success:
          connected,

        message:
          connected
            ? "Backend and database connected successfully"
            : "Backend is running, but database is not connected",

        server:
          "ReviewQR API",

        port:
          PORT,

        database:
          connected
            ? "connected"
            : "disconnected",
      });
  }
);

// --------------------------------------------------
// ADMIN LOGIN
// --------------------------------------------------

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      if (
        normalizedEmail !==
        ADMIN_EMAIL
          .trim()
          .toLowerCase()
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      const savedCredential =
        await AdminCredential.findOne(
          {
            email:
              normalizedEmail,
          }
        );

      let isPasswordValid =
        false;

      if (
        savedCredential
      ) {
        isPasswordValid =
          await bcrypt.compare(
            password,
            savedCredential.passwordHash
          );
      } else {
        // Use the .env password until
        // the first password change.

        isPasswordValid =
          password ===
          ADMIN_PASSWORD;
      }

      if (
        !isPasswordValid
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      const token =
        jwt.sign(
          {
            email:
              ADMIN_EMAIL,

            role:
              "admin",
          },

          JWT_SECRET,

          {
            expiresIn:
              "8h",
          }
        );

      return res.json({
        success: true,

        message:
          "Login successful.",

        token,

        admin: {
          email:
            ADMIN_EMAIL,

          role:
            "admin",
        },
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Login failed. Please try again.",
      });
    }
  }
);

// --------------------------------------------------
// CHECK ADMIN SESSION
// --------------------------------------------------

app.get(
  "/api/auth/me",
  requireAuth,
  (req, res) => {
    res.json({
      success: true,
      admin: {
        email: req.admin.email,
        role: req.admin.role,
      },
    });
  }
);
  // --------------------------------------------------
// CHANGE ADMIN PASSWORD
// --------------------------------------------------

app.put(
  "/api/auth/change-password",
  requireAuth,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

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
        isCurrentPasswordValid = currentPassword === ADMIN_PASSWORD;
      }

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await AdminCredential.findOneAndUpdate(
        {
          email: normalizedEmail,
        },
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


/* =========================================================
   FORGOT ADMIN PASSWORD - SEND / RESEND OTP
========================================================= */

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const adminEmail = String(ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    const genericMessage =
      "If the email matches the admin account, an OTP will be sent.";

    if (!email || email !== adminEmail) {
      return res.json({
        success: true,
        message: genericMessage,
      });
    }

    if (!emailTransporter) {
      return res.status(503).json({
        success: false,
        message: "Email is not configured on the server.",
      });
    }

    let credential = await AdminCredential.findOne({
      email: adminEmail,
    });

    if (!credential) {
      credential = await AdminCredential.create({
        email: adminEmail,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    credential.resetOtpHash = await bcrypt.hash(otp, 10);
    credential.resetOtpExpires = new Date(
      Date.now() + 1 * 60 * 1000
    );
    credential.resetOtpVerifiedAt = undefined;

    await credential.save();

    try {
      await emailTransporter.sendMail({
        from: `"ReviewQR" <${EMAIL_USER}>`,
        to: adminEmail,
        subject: "Your ReviewQR password reset OTP",
        text: `Your ReviewQR password reset OTP is ${otp}. It expires in 1 minute. If you did not request this, ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>ReviewQR Password Reset</h2>
            <p>Your one-time password (OTP) is:</p>
            <div style="font-size:30px;font-weight:bold;letter-spacing:8px">
              ${otp}
            </div>
            <p>This OTP expires in 1 minute.</p>
            <p>If you did not request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError) {
      await AdminCredential.updateOne(
        { email: adminEmail },
        {
          $unset: {
            resetOtpHash: 1,
            resetOtpExpires: 1,
            resetOtpVerifiedAt: 1,
          },
        }
      );

      throw mailError;
    }

    return res.json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send the OTP. Please try again.",
    });
  }
});


/* =========================================================
   VERIFY OTP - MUST SUCCEED BEFORE SHOWING PASSWORD FIELDS
========================================================= */

app.post("/api/auth/verify-reset-otp", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const otp = String(req.body?.otp || "").trim();

    const adminEmail = String(ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    if (
      email !== adminEmail ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Request a new OTP.",
      });
    }

    const credential = await AdminCredential.findOne({
      email: adminEmail,
    });

    if (
      !credential ||
      !credential.resetOtpHash ||
      !credential.resetOtpExpires ||
      credential.resetOtpExpires <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    const matches = await bcrypt.compare(
      otp,
      credential.resetOtpHash
    );

    if (!matches) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    credential.resetOtpVerifiedAt = new Date();
    await credential.save();

    return res.json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP. Please try again.",
    });
  }
});


/* =========================================================
   RESET PASSWORD - ONLY AFTER OTP VERIFICATION
========================================================= */

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const newPassword = req.body?.newPassword;

    const adminEmail = String(ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    if (
      email !== adminEmail ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password of at least 8 characters are required.",
      });
    }

    const credential = await AdminCredential.findOne({
      email: adminEmail,
    });

    const now = new Date();

    if (
      !credential ||
      !credential.resetOtpHash ||
      !credential.resetOtpExpires ||
      credential.resetOtpExpires <= now ||
      !credential.resetOtpVerifiedAt ||
      credential.resetOtpVerifiedAt > now
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired. Please request a new OTP.",
      });
    }

    credential.passwordHash = await bcrypt.hash(newPassword, 12);

    // Invalidate the OTP after a successful password reset.
    credential.resetOtpHash = undefined;
    credential.resetOtpExpires = undefined;
    credential.resetOtpVerifiedAt = undefined;

    await credential.save();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset the password. Please try again.",
    });
  }
});



// --------------------------------------------------
// RESET ADMIN PASSWORD - VERIFY OTP
// --------------------------------------------------

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const otp = String(req.body?.otp || "").trim();
    const newPassword = req.body?.newPassword;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const adminEmail = String(ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    if (email !== adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Request a new OTP.",
      });
    }

    const credential = await AdminCredential.findOne({
      email: adminEmail,
    });

    if (
      !credential ||
      !credential.resetOtpHash ||
      !credential.resetOtpExpires ||
      credential.resetOtpExpires <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired. Request a new OTP.",
      });
    }

    const otpMatches = await bcrypt.compare(
      otp,
      credential.resetOtpHash
    );

    if (!otpMatches) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    credential.passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    // OTP can only be used once.
    credential.resetOtpHash = undefined;
    credential.resetOtpExpires = undefined;

    await credential.save();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset the password. Please try again.",
    });
  }
});

// --------------------------------------------------
// RESET ADMIN PASSWORD
// --------------------------------------------------

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (
      typeof token !== "string" ||
      !token ||
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const normalizedEmail = String(ADMIN_EMAIL)
      .trim()
      .toLowerCase();

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically validate and consume the token.
    const updatedCredential =
      await AdminCredential.findOneAndUpdate(
        {
          email: normalizedEmail,
          resetTokenHash,
          resetTokenExpires: { $gt: new Date() },
        },
        {
          $set: {
            passwordHash,
          },
          $unset: {
            resetTokenHash: 1,
            resetTokenExpires: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedCredential) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset the password. Please try again.",
    });
  }
});

// --------------------------------------------------
// GET ALL BUSINESSES - ADMIN ONLY
// --------------------------------------------------

app.get(
  "/api/businesses",
  requireAuth,
  async (req, res) => {
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
  }
);

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

      res.json({
        success: true,
        data: business,
      });
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

      res.json({
        success: true,
        data: business,
      });
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

app.post(
  "/api/businesses",
  requireAuth,
  async (req, res) => {
    try {
      const {
        name,
        category,
        businessType,
        specialization,
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
        {
          id: /^BUS_\d+$/,
        },
        {
          id: 1,
          _id: 0,
        }
      );

      const highestNumber = existing.reduce(
        (max, item) => {
          const match = item.id.match(/^BUS_(\d+)$/);

          return match
            ? Math.max(max, Number(match[1]))
            : max;
        },
        0
      );

      const businessId =
        `BUS_${String(highestNumber + 1).padStart(6, "0")}`;

      const newBusiness = await Business.create({
        id: businessId,
        name: String(name).trim(),
        category,
        businessType: businessType || "",
        specialization: specialization || "",
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
  }
);

// --------------------------------------------------
// UPDATE BUSINESS - ADMIN ONLY
// --------------------------------------------------

app.put(
  "/api/businesses/:id",
  requireAuth,
  async (req, res) => {
    try {
      const updates = {
        ...req.body,
      };

      delete updates.id;
      delete updates._id;
      delete updates.__v;

      const business = await Business.findOneAndUpdate(
        {
          id: req.params.id,
        },
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
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
        answers: Array.isArray(answers)
          ? answers
          : [],
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
      console.error("Create review activity error:", error);

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
        ? {
            businessId: req.query.businessId,
          }
        : {};

      const data = await ReviewActivity.find(
        filter
      ).sort({
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
            count: {
              $sum: 1,
            },
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

      res.json({
        success: true,
        data,
      });
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
    await mongoose.connect(
      MONGODB_URI
    );

    console.log(
      "MongoDB connected successfully"
    );

    if (OPENAI_API_KEY) {
      console.log(
        `OpenAI question generation enabled using model: ${OPENAI_MODEL}`
      );
    } else {
      console.log(
        "OpenAI question generation is not configured yet."
      );
    }

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );

        console.log(
          `Admin login configured for: ${ADMIN_EMAIL}`
        );
      }
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
}

startServer();