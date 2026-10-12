const API_BASE_URL = "/api";

/* =========================================================
   API REQUEST HELPER
========================================================= */

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("reviewqr_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach admin JWT when available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: "Invalid server response.",
    };
  }

  // If admin token is invalid/expired
  if (response.status === 401) {
    localStorage.removeItem("reviewqr_token");
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};


/* =========================================================
   HEALTH
========================================================= */

export const checkBackend = async () => {
  return apiRequest("/health");
};


/* =========================================================
   ADMIN LOGIN
========================================================= */

export const loginAdmin = async (email, password) => {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (response.success && response.token) {
    localStorage.setItem("reviewqr_token", response.token);
  }

  return response;
};



/* =========================================================
   FORGOT ADMIN PASSWORD - SEND / RESEND OTP
========================================================= */

export const forgotAdminPassword = async (email) => {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};


/* =========================================================
   VERIFY RESET OTP
========================================================= */

export const verifyAdminResetOtp = async (email, otp) => {
  return apiRequest("/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
};


/* =========================================================
   RESET ADMIN PASSWORD AFTER OTP VERIFICATION
========================================================= */

export const resetAdminPassword = async (
  email,
  newPassword
) => {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      newPassword,
    }),
  });
};


/* =========================================================
   CURRENT ADMIN
========================================================= */

export const getCurrentAdmin = async () => {
  return apiRequest("/auth/me");
};


/* =========================================================
   CHANGE ADMIN PASSWORD
========================================================= */

export const changeAdminPassword = async (
  currentPassword,
  newPassword
) => {
  return apiRequest("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
};


/* =========================================================
   AUTH STATUS
========================================================= */

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("reviewqr_token"));
};

export const isAdminLoggedIn = isAuthenticated;


/* =========================================================
   LOGOUT
========================================================= */

export const logoutAdmin = () => {
  localStorage.removeItem("reviewqr_token");
};


/* =========================================================
   ADMIN BUSINESS APIs
   These require admin authentication.
========================================================= */

export const getBusinesses = async () => {
  return apiRequest("/businesses");
};


export const getBusiness = async (id) => {
  return apiRequest(`/businesses/${id}`);
};


export const createBusiness = async (businessData) => {
  return apiRequest("/businesses", {
    method: "POST",
    body: JSON.stringify(businessData),
  });
};


export const updateBusiness = async (id, businessData) => {
  return apiRequest(`/businesses/${id}`, {
    method: "PUT",
    body: JSON.stringify(businessData),
  });
};


export const deleteBusiness = async (id) => {
  return apiRequest(`/businesses/${id}`, {
    method: "DELETE",
  });
};


/* =========================================================
   AI QUESTION GENERATION
   Generates 15 questions with 4 answer options each
   for the selected business category/type/specialization.

   IMPORTANT:
   - Requires admin authentication.
   - AI is called during business creation.
   - Generated questions are then stored with the business.
   - Customers do NOT call this endpoint.
========================================================= */

export const generateQuestions = async ({
  category,
  businessType,
  specialization = "",
  businessName = "",
}) => {
  return apiRequest("/questions/generate", {
    method: "POST",
    body: JSON.stringify({
      category,
      businessType,
      specialization,
      businessName,
    }),
  });
};


/* =========================================================
   PUBLIC BUSINESS API
   Used by customers scanning QR codes.

   IMPORTANT:
   This endpoint does NOT require admin login.
========================================================= */

export const getPublicBusiness = async (id) => {
  return apiRequest(`/public/businesses/${id}`);
};


/* =========================================================
   REVIEW ACTIVITY
========================================================= */

export const startReview = async (businessId) => {
  return apiRequest("/reviews/activity", {
    method: "POST",
    body: JSON.stringify({
      businessId,
      event: "started",
      answers: [],
      generatedReview: "",
    }),
  });
};


export const recordReviewActivity = async (
  businessId,
  event,
  answers = [],
  generatedReview = ""
) => {
  return apiRequest("/reviews/activity", {
    method: "POST",
    body: JSON.stringify({
      businessId,
      event,
      answers,
      generatedReview,
    }),
  });
};


/*
  Backward-compatible name.
*/
export const recordReviewEvent = recordReviewActivity;


/* =========================================================
   GET REVIEW ACTIVITY
========================================================= */

export const getReviewActivity = async (businessId) => {
  const query = businessId
    ? `?businessId=${encodeURIComponent(businessId)}`
    : "";

  return apiRequest(`/reviews/activity${query}`);
};


/* =========================================================
   REVIEW STATISTICS
========================================================= */

export const getReviewStatistics = async () => {
  return apiRequest("/reviews/statistics");
};
