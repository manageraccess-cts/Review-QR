import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Icon from "../../../components/Icon";
import { useBusiness } from "../../../context/BusinessContext";
import { useQuestion } from "../../../context/QuestionContext";
import { generateQuestions } from "../../../services/api";
import "./CreateBusiness.css";
const CATEGORY_CONFIG = {
  "Restaurants & Food": {
    types: [
      "Restaurant",
      "Cafe",
      "Bakery",
      "Fast Food",
      "Cloud Kitchen",
      "Food Truck",
    ],
    specializations: [
      "Vegetarian",
      "Non-Vegetarian",
      "Vegetarian & Non-Vegetarian",
      "Fine Dining",
      "Casual Dining",
      "General",
    ],
  },
  Healthcare: {
    types: [
      "Doctor",
      "Clinic",
      "Hospital",
      "Dental Clinic",
      "Diagnostic Center",
      "Pharmacy",
    ],
    specializations: [
      "General Physician",
      "Dentist",
      "Dermatologist",
      "Pediatrician",
      "Cardiologist",
      "Orthopedic",
      "Gynecologist",
      "ENT",
      "Ophthalmologist",
      "Other",
    ],
  },
  "PGs & Stays": {
    types: [
      "Hotel",
      "Resort",
      "Gents PG",
      "Hostel",
      "Ladies PG",
      "Homestay",
    ],
    specializations: [
      "Budget",
      "Business",
      "Luxury",
      "Family",
      "Student",
      "General",
    ],
  },
  "Beauty & Wellness": {
    types: [
      "Salon",
      "Beauty Parlour",
      "Spa",
      "Skin Clinic",
      "Wellness Center",
    ],
    specializations: [
      "Hair",
      "Skin",
      "Nails",
      "Massage",
      "Bridal",
      "General",
    ],
  },
  "Travel & Tourism": {
    types: [
      "Travel Agency",
      "Tour Operator",
      "Taxi Service",
      "Car Rental",
      "Tour Guide",
    ],
    specializations: [
      "Domestic Travel",
      "International Travel",
      "Adventure",
      "Pilgrimage",
      "Family Tours",
      "Corporate Travel",
      "General",
    ],
  },
  "Home & Furniture": {
    types: [
      "Furniture Store",
      "Interior Designer",
      "Glass Store",
      "Home Decor",
      "Hardware Store",
    ],
    specializations: [
      "Sofa",
      "Beds",
      "Dining",
      "Curtains",
      "Glass",
      "Interior Design",
      "General",
    ],
  },
  Automotive: {
    types: [
      "Car Service",
      "Bike Service",
      "Car Dealer",
      "Bike Dealer",
      "Car Wash",
      "Detailing Center",
    ],
    specializations: [
      "General Service",
      "Repair",
      "Body Work",
      "Accessories",
      "Electric Vehicles",
      "General",
    ],
  },
  Education: {
    types: [
      "School",
      "College",
      "Coaching Center",
      "Tuition Center",
      "Training Institute",
      "Online Course",
    ],
    specializations: [
      "Computer Science",
      "Engineering",
      "Medical",
      "Competitive Exams",
      "School Education",
      "Professional Training",
      "General",
    ],
  },
  Fitness: {
    types: [
      "Gym",
      "Yoga Center",
      "Fitness Studio",
      "Zumba Center",
      "Sports Academy",
    ],
    specializations: [
      "Strength Training",
      "Yoga",
      "Weight Loss",
      "CrossFit",
      "Dance Fitness",
      "Sports Training",
      "General",
    ],
  },
  Shopping: {
    types: [
      "Clothing Store",
      "Electronics Store",
      "Grocery Store",
      "Jewellery Store",
      "Supermarket",
      "General Store",
    ],
    specializations: [
      "Men",
      "Women",
      "Kids",
      "Electronics",
      "Grocery",
      "Jewellery",
      "General",
    ],
  },
  "Professional Services": {
    types: [
      "CA",
      "Lawyer",
      "Consultant",
      "IT Services",
      "Digital Marketing Agency",
      "Financial Advisor",
    ],
    specializations: [
      "Tax",
      "Legal",
      "Technology",
      "Marketing",
      "Finance",
      "Business Consulting",
      "General",
    ],
  },
  "Events & Photography": {
    types: [
      "Photographer",
      "Videographer",
      "Event Planner",
      "Wedding Planner",
      "Event Venue",
    ],
    specializations: [
      "Wedding",
      "Birthday",
      "Corporate",
      "Pre-Wedding",
      "Product Photography",
      "General",
    ],
  },
  "Packers & Movers": {
    types: [
      "Packers & Movers",
      "Local Movers",
      "Relocation Service",
    ],
    specializations: [
      "Local",
      "Domestic",
      "Office Relocation",
      "Vehicle Transport",
      "General",
    ],
  },
  "Real Estate": {
    types: [
      "Real Estate Agent",
      "Builder",
      "Property Management",
      "Real Estate Developer",
    ],
    specializations: [
      "Residential",
      "Commercial",
      "Luxury",
      "Rental",
      "General",
    ],
  },
  "Repair & Maintenance": {
    types: [
      "Electrician",
      "Plumber",
      "AC Repair",
      "Appliance Repair",
      "Computer Repair",
      "Mobile Repair",
    ],
    specializations: [
      "Home",
      "Office",
      "Electronics",
      "Appliances",
      "General",
    ],
  },
  PG: {
    types: [
      "Boys PG",
      "Girls PG",
      "Co-Living",
      "Student PG",
    ],
    specializations: [
      "Students",
      "Working Professionals",
      "Women",
      "Men",
      "General",
    ],
  },
  Glass: {
    types: [
      "Glass Store",
      "Glass Manufacturer",
      "Glass Installer",
      "Aluminium & Glass",
    ],
    specializations: [
      "Residential Glass",
      "Commercial Glass",
      "Shower Glass",
      "Office Glass",
      "General",
    ],
  },
};
const normalizeGeneratedQuestions = (response) => {
  const raw =
    response?.questions ||
    response?.data?.questions ||
    response?.output?.questions ||
    [];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item, index) => {
      const options =
        Array.isArray(item?.options)
          ? item.options
            .map((option, optionIndex) => {
              if (
                option &&
                typeof option === "object"
              ) {
                return {
                  id:
                    option.id ||
                    `AI_OPT_${index + 1}_${optionIndex + 1
                    }`,
                  text:
                    String(
                      option.text ||
                      option.label ||
                      option.value ||
                      ""
                    ).trim(),
                  score:
                    Number.isFinite(
                      Number(option.score)
                    )
                      ? Number(option.score)
                      : [1, 2, 4, 5][
                      optionIndex
                      ],
                };
              }
              return {
                id:
                  `AI_OPT_${index + 1}_${optionIndex + 1
                  }`,
                text:
                  String(option || "").trim(),
                score:
                  [1, 2, 4, 5][optionIndex],
              };
            })
            .filter((option) => option.text)
          : [];
      return {
        id:
          item?.id ||
          `AI_Q_${Date.now()}_${index + 1}`,
        question:
          String(
            item?.question || item?.text || ""
          )
            .replace(/[?؟]+$/g, "")
            .trim(),
        options,
        category: item?.category || "",
        status: item?.status || "Active",
      };
    })
    .filter(
      (item) =>
        item.question &&
        item.options.length === 4
    )
    .slice(0, 15);
};
const CUSTOM_CATEGORY_CONFIG_KEY = "reviewqr_custom_category_config_v1";
const loadCustomCategoryConfig = () => {
  try {
    const saved = localStorage.getItem(
      CUSTOM_CATEGORY_CONFIG_KEY
    );
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    return parsed;
  } catch (error) {
    console.warn(
      "Unable to load custom category configuration:",
      error
    );
    return {};
  }
};
const saveCustomCategoryConfig = (config) => {
  try {
    localStorage.setItem(
      CUSTOM_CATEGORY_CONFIG_KEY,
      JSON.stringify(config)
    );
  } catch (error) {
    console.warn(
      "Unable to save custom category configuration:",
      error
    );
  }
};
const mergeCategoryConfig = (
  baseConfig,
  customConfig
) => {
  const merged = {};
  Object.entries(baseConfig || {}).forEach(
    ([category, config]) => {
      merged[category] = {
        types: [
          ...(config?.types || []),
        ],
        specializations: [
          ...(config?.specializations || []),
        ],
      };
    }
  );
  Object.entries(customConfig || {}).forEach(
    ([category, config]) => {
      const existing =
        merged[category] || {
          types: [],
          specializations: [],
        };
      merged[category] = {
        types: [
          ...new Set([
            ...(existing.types || []),
            ...(config?.types || []),
          ]),
        ],
        specializations: [
          ...new Set([
            ...(existing.specializations || []),
            ...(config?.specializations || []),
          ]),
        ],
      };
    }
  );
  return merged;
};
const AI_QUESTION_CACHE_PREFIX =
  "reviewqr_ai_questions_v3";
const getAIQuestionCacheKey = (
  category,
  businessType,
  specialization
) => {
  const normalizedCategory = String(
    category || ""
  )
    .trim()
    .toLowerCase();
  const normalizedBusinessType = String(
    businessType || ""
  )
    .trim()
    .toLowerCase();
  const normalizedSpecialization = String(
    specialization || "General"
  )
    .trim()
    .toLowerCase();
  return `${AI_QUESTION_CACHE_PREFIX}__${encodeURIComponent(
    normalizedCategory
  )}__${encodeURIComponent(
    normalizedBusinessType
  )}__${encodeURIComponent(
    normalizedSpecialization
  )}`;
};
const getCachedAIQuestions = (
  category,
  businessType,
  specialization
) => {
  try {
    const key = getAIQuestionCacheKey(
      category,
      businessType,
      specialization
    );
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }
    const parsed = JSON.parse(cached);
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 15
    ) {
      return null;
    }
    const validQuestions = parsed.filter(
      (question) =>
        question &&
        question.question &&
        Array.isArray(question.options) &&
        question.options.length === 4
    );
    return validQuestions.length === 15
      ? validQuestions
      : null;
  } catch (error) {
    console.warn(
      "Unable to read cached AI questions:",
      error
    );
    return null;
  }
};
const cacheAIQuestions = (
  category,
  businessType,
  specialization,
  generatedQuestions
) => {
  try {
    const key = getAIQuestionCacheKey(
      category,
      businessType,
      specialization
    );
    localStorage.setItem(
      key,
      JSON.stringify(generatedQuestions)
    );
  } catch (error) {
    console.warn(
      "Unable to cache AI questions:",
      error
    );
  }
};
const CreateBusiness = ({
  onNavigate,
}) => {
  const {
    addBusiness,
    updateBusiness,
  } = useBusiness();
  const {
    questions,
  } = useQuestion();
  const [step, setStep] =
    useState(1);
  const [customSpecialization, setCustomSpecialization] =
    useState("");
  const [customCategoryConfig, setCustomCategoryConfig] =
    useState(() => loadCustomCategoryConfig());
  const [categoryManager, setCategoryManager] =
    useState({
      open: false,
      mode: "category",
    });
  const [newCategoryName, setNewCategoryName] =
    useState("");
  const [newBusinessType, setNewBusinessType] =
    useState("");
  const [newSpecialization, setNewSpecialization] =
    useState("");
  const [formData, setFormData] =
    useState({
      name: "",
      category: "",
      businessType: "",
      specialization: "",
      googleReviewUrl: "",
      selectedQuestions: [],
    });
  const [errors, setErrors] =
    useState({});
  const [createdBusiness, setCreatedBusiness] =
    useState(null);
  const [isGeneratingQR, setIsGeneratingQR] =
    useState(false);
  const [qrGenerated, setQrGenerated] =
    useState(false);
  const [selectedQrTemplate, setSelectedQrTemplate] =
    useState("color");
  const [isQrUrlCopied, setIsQrUrlCopied] =
    useState(false);
  const [aiQuestions, setAiQuestions] =
    useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] =
    useState(false);
  const [questionsGenerated, setQuestionsGenerated] =
    useState(false);
  const allCategoryConfig = useMemo(
    () =>
      mergeCategoryConfig(
        CATEGORY_CONFIG,
        customCategoryConfig
      ),
    [customCategoryConfig]
  );
  const categoryConfig =
    allCategoryConfig[
    formData.category
    ] || {
      types: [],
      specializations: [],
    };
  const availableSpecializations =
    categoryConfig.specializations || [];
  const selectedSpecialization =
    formData.specialization === "Other"
      ? customSpecialization.trim() || "General"
      : formData.specialization || "General";
  const existingCategoryQuestions =
    useMemo(() => {
      if (
        !formData.category ||
        !Array.isArray(questions)
      ) {
        return [];
      }
      return questions.filter(
        (question) =>
          question.category ===
          formData.category &&
          question.status === "Active"
      );
    }, [
      questions,
      formData.category,
    ]);
  const displayedQuestions =
    aiQuestions.length
      ? aiQuestions
      : existingCategoryQuestions;
  const selectedQuestionObjects =
    useMemo(() => {
      return formData.selectedQuestions
        .map((id) =>
          displayedQuestions.find(
            (question) =>
              question.id === id
          )
        )
        .filter(Boolean);
    }, [
      formData.selectedQuestions,
      displayedQuestions,
    ]);
  const [categoryManagerError, setCategoryManagerError] =
    useState("");
  const persistCategoryConfig = (nextConfig) => {
    setCustomCategoryConfig(nextConfig);
    saveCustomCategoryConfig(nextConfig);
  };
  const openCategoryManager = (mode) => {
    setCategoryManagerError("");
    setCategoryManager({
      open: true,
      mode,
    });
    setNewCategoryName("");
    setNewBusinessType("");
    setNewSpecialization("");
  };
  const closeCategoryManager = () => {
    setCategoryManager({
      open: false,
      mode: "category",
    });
    setCategoryManagerError("");
    setNewCategoryName("");
    setNewBusinessType("");
    setNewSpecialization("");
  };
  const addCategoryConfigValue = (
    category,
    field,
    value
  ) => {
    const cleanValue = String(
      value || ""
    ).trim();
    if (!category || !cleanValue) {
      return false;
    }
    const current =
      customCategoryConfig[category] || {
        types: [],
        specializations: [],
      };
    const existingValues = [
      ...(
        allCategoryConfig[category]?.[field] || []
      ),
    ];
    const alreadyExists = existingValues.some(
      (item) =>
        String(item)
          .trim()
          .toLowerCase() ===
        cleanValue.toLowerCase()
    );
    if (alreadyExists) {
      return false;
    }
    const nextConfig = {
      ...customCategoryConfig,
      [category]: {
        types: [
          ...(current.types || []),
        ],
        specializations: [
          ...(current.specializations || []),
        ],
      },
    };
    nextConfig[category][field] = [
      ...nextConfig[category][field],
      cleanValue,
    ];
    persistCategoryConfig(nextConfig);
    return true;
  };
  const handleSaveCategoryManager = () => {
    const mode = categoryManager.mode;
    if (mode === "category") {
      const categoryName =
        newCategoryName.trim();
      if (!categoryName) {
        setCategoryManagerError(
          "Please enter a category name."
        );
        return;
      }
      const categoryExists = Object.keys(
        allCategoryConfig
      ).some(
        (category) =>
          category.toLowerCase() ===
          categoryName.toLowerCase()
      );
      if (categoryExists) {
        setCategoryManagerError(
          "This category already exists. Use the + buttons to add a business type or specialization to it."
        );
        return;
      }
      const type =
        newBusinessType.trim();
      const specialization =
        newSpecialization.trim();
      const nextConfig = {
        ...customCategoryConfig,
        [categoryName]: {
          types: type
            ? [type]
            : [],
          specializations: specialization
            ? [specialization]
            : [],
        },
      };
      persistCategoryConfig(nextConfig);
      setFormData((current) => ({
        ...current,
        category: categoryName,
        businessType: type || "",
        specialization: specialization || "",
        selectedQuestions: [],
      }));
      setAiQuestions([]);
      setCustomSpecialization("");
      setQuestionsGenerated(false);
      closeCategoryManager();
      return;
    }
    if (!formData.category) {
      setCategoryManagerError(
        "Please select a category first."
      );
      return;
    }
    if (mode === "businessType") {
      const type =
        newBusinessType.trim();
      if (!type) {
        setCategoryManagerError(
          "Please enter a business type."
        );
        return;
      }
      if (
        !addCategoryConfigValue(
          formData.category,
          "types",
          type
        )
      ) {
        setCategoryManagerError(
          "This business type already exists for the selected category."
        );
        return;
      }
      setFormData((current) => ({
        ...current,
        businessType: type,
        specialization: "",
        selectedQuestions: [],
      }));
      setAiQuestions([]);
      setCustomSpecialization("");
      setQuestionsGenerated(false);
      closeCategoryManager();
      return;
    }
    if (mode === "specialization") {
      const specialization =
        newSpecialization.trim();
      if (!specialization) {
        setCategoryManagerError(
          "Please enter a specialization."
        );
        return;
      }
      if (
        !addCategoryConfigValue(
          formData.category,
          "specializations",
          specialization
        )
      ) {
        setCategoryManagerError(
          "This specialization already exists for the selected category."
        );
        return;
      }
      setFormData((current) => ({
        ...current,
        specialization,
      }));
      setAiQuestions([]);
      setQuestionsGenerated(false);
      closeCategoryManager();
    }
  };
  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;
    if (name === "category") {
      const nextCategoryConfig =
        allCategoryConfig[value] || {
          types: [],
          specializations: [],
        };
      const nextTypes =
        Array.isArray(nextCategoryConfig.types)
          ? nextCategoryConfig.types
          : [];
      const nextSpecializations =
        Array.isArray(nextCategoryConfig.specializations)
          ? nextCategoryConfig.specializations
          : [];
      setFormData(
        (current) => ({
          ...current,
          category: value,
          businessType:
            nextTypes.length === 1
              ? nextTypes[0]
              : "",
          specialization:
            nextSpecializations.length === 1
              ? nextSpecializations[0]
              : "",
          selectedQuestions: [],
        })
      );
      setAiQuestions([]);
      setCustomSpecialization("");
      setQuestionsGenerated(false);
    }
    else if (
      name === "businessType"
    ) {
      const currentCategoryConfig =
        allCategoryConfig[formData.category] || {
          types: [],
          specializations: [],
        };
      const nextSpecializations =
        Array.isArray(
          currentCategoryConfig.specializations
        )
          ? currentCategoryConfig.specializations
          : [];
      setFormData(
        (current) => ({
          ...current,
          businessType: value,
          specialization:
            nextSpecializations.length === 1
              ? nextSpecializations[0]
              : "",
          selectedQuestions: [],
        })
      );
      setAiQuestions([]);
      setCustomSpecialization("");
      setQuestionsGenerated(false);
    }
    else if (name === "specialization") {
      setFormData(
        (current) => ({
          ...current,
          specialization: value,
        })
      );
      if (value !== "Other") {
        setCustomSpecialization("");
      }
    }
    else {
      setFormData(
        (current) => ({
          ...current,
          [name]: value,
        })
      );
    }
    setErrors(
      (current) => ({
        ...current,
        [name]: "",
        questions: "",
      })
    );
  };
  const validateBusinessDetails =
    () => {
      const newErrors = {};
      if (
        !formData.name.trim()
      ) {
        newErrors.name =
          "Business name is required.";
      }
      if (!formData.category) {
        newErrors.category =
          "Please select a category.";
      }
      if (
        !formData.businessType
      ) {
        newErrors.businessType =
          "Please select a business type.";
      }
      if (
        !formData.googleReviewUrl.trim()
      ) {
        newErrors.googleReviewUrl =
          "Google Review URL is required.";
      }
      setErrors(newErrors);
      return (
        Object.keys(
          newErrors
        ).length === 0
      );
    };
  const generateAIQuestions =
    async () => {
      if (
        !formData.category ||
        !formData.businessType
      ) {
        return;
      }
      setIsGeneratingQuestions(
        true
      );
      setErrors(
        (current) => ({
          ...current,
          questions: "",
        })
      );
      try {
        /*
        * First check whether these exact
        * Category + Business Type + Specialization
        * questions already exist.
        */
        const cachedQuestions =
          getCachedAIQuestions(
            formData.category,
            formData.businessType,
            selectedSpecialization
          );
        if (cachedQuestions) {
          setAiQuestions(
            cachedQuestions
          );
          setQuestionsGenerated(
            true
          );
          setFormData(
            (current) => ({
              ...current,
              selectedQuestions: [],
            })
          );
          setIsGeneratingQuestions(
            false
          );
          return;
        }
        /*
        * No saved questions found.
        * Generate them only once.
        */
        const response =
          await generateQuestions({
            category:
              formData.category,
            businessType:
              formData.businessType,
            specialization:
              selectedSpecialization,
            businessName:
              formData.name.trim(),
            questionContext: {
              category:
                formData.category,
              businessType:
                formData.businessType,
              specialization:
                selectedSpecialization,
              instruction:
                "Generate customer-feedback questions specifically for this exact Category + Business Type + Specialization. Do not use questions that belong to a different industry, service, product, treatment, or specialization. If the specialization is specific, make the relevant questions specific to it.",
            },
          });
        const generated =
          normalizeGeneratedQuestions(
            response
          );
        if (
          generated.length !== 15
        ) {
          throw new Error(
            `AI generated ${generated.length} valid questions. Exactly 15 are required.`
          );
        }
        /*
        * Save the first successful
        * generation so it can be reused
        * by future businesses having the
        * same Category + Business Type + Specialization.
        */
        cacheAIQuestions(
          formData.category,
          formData.businessType,
          selectedSpecialization,
          generated
        );
        setAiQuestions(
          generated
        );
        setQuestionsGenerated(
          true
        );
        setFormData(
          (current) => ({
            ...current,
            selectedQuestions: [],
          })
        );
      } catch (error) {
        console.error(
          "AI question generation failed:",
          error
        );
        setAiQuestions([]);
        setQuestionsGenerated(
          false
        );
        setErrors(
          (current) => ({
            ...current,
            questions:
              error.message ||
              "Unable to generate questions. Please check your OpenAI API key and try again.",
          })
        );
      } finally {
        setIsGeneratingQuestions(
          false
        );
      }
    };
  const handleContinue =
    async () => {
      if (step === 1) {
        if (
          !validateBusinessDetails()
        ) {
          return;
        }
        setErrors({});
        setStep(2);
        await generateAIQuestions();
        return;
      }
      if (step === 2) {
        if (
          !questionsGenerated ||
          aiQuestions.length !== 15
        ) {
          setErrors({
            questions:
              "Please generate the 15 AI questions first.",
          });
          return;
        }
        if (
          formData.selectedQuestions
            .length !== 6
        ) {
          setErrors({
            questions:
              "Please select exactly 6 questions.",
          });
          return;
        }
        setStep(3);
        return;
      }
      await handleGenerateQR();
    };
  const handleQuestionToggle = (
    questionId
  ) => {
    setFormData(
      (current) => {
        const selected =
          current.selectedQuestions || [];
        if (
          selected.includes(
            questionId
          )
        ) {
          return {
            ...current,
            selectedQuestions:
              selected.filter(
                (id) =>
                  id !== questionId
              ),
          };
        }
        if (
          selected.length >= 6
        ) {
          return current;
        }
        return {
          ...current,
          selectedQuestions: [
            ...selected,
            questionId,
          ],
        };
      }
    );
    setErrors((current) => ({
      ...current,
      questions: "",
    }));
  };
  const handleBack = () => {
    if (step === 1) {
      onNavigate("businesses");
      return;
    }
    setErrors({});
    if (step === 2) {
      setStep(1);
      return;
    }
    setStep(2);
  };
  const handleGenerateQR =
  async () => {
    if (
      formData.selectedQuestions
        .length !== 6
    ) {
      setErrors({
        questions:
          "Please select exactly 6 questions.",
      });

      return;
    }

    if (
      selectedQuestionObjects
        .length !== 6
    ) {
      setErrors({
        submit:
          "The selected AI questions could not be prepared. Please go back and select them again.",
      });

      return;
    }

    setErrors({});
    setIsGeneratingQR(true);
    setQrGenerated(false);

    try {
      const business =
        await addBusiness({
          name:
            formData.name.trim(),

          category:
            formData.category,

          businessType:
            formData.businessType,

          specialization:
            selectedSpecialization,

          phone:
            formData.phone?.trim?.() ||
            "",

          address:
            formData.address?.trim?.() ||
            "",

          googleReviewUrl:
            formData.googleReviewUrl.trim(),

          selectedQuestions:
            selectedQuestionObjects,

          status:
            "Active",

          qrStatus:
            "Generating",
        });

      setCreatedBusiness(
        business
      );

      /*
       * QR generation is complete.
       * Update the business status from
       * "Generating" to "Generated".
       */
      try {
        const generatedBusiness =
          await updateBusiness(
            business.id,
            {
              qrStatus:
                "Generated",
            }
          );

        setCreatedBusiness(
          generatedBusiness?.data ||
            generatedBusiness ||
            business
        );
      } catch (updateError) {
        console.error(
          "Failed to update QR status:",
          updateError
        );
      }

      setQrGenerated(
        true
      );

    } catch (error) {
      console.error(
        "Business creation failed:",
        error
      );

      setErrors({
        submit:
          error.message ||
          "Unable to create business. Please try again.",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };
  const qrUrl =
    createdBusiness
      ? `${window.location.origin}/r/${createdBusiness.id}`
      : "";
  const copyQrUrl =
    async () => {
      
      if (!qrUrl) {
        return;
      }
      try {
        await navigator.clipboard.writeText(
          qrUrl
        );
        setIsQrUrlCopied(true);
        setTimeout(
          () =>
            setIsQrUrlCopied(false),
          2000
        );
      } catch (error) {
        console.error(
          "Failed to copy QR URL:",
          error
        );
      }
    };
  const downloadQR = async () => {
    const svg = document.getElementById("reviewqr-generated");
    const preview = document.querySelector(".qr-template-preview");
    if (!svg || !preview || !createdBusiness) return;

    const templateFiles = {
      color: "/qr-template-color.png",
      black: "/qr-template-black.png",
      wave: "/qr-template-wave.png",
    };

    let svgUrl;

    try {
      const templateImage = new Image();
      templateImage.crossOrigin = "anonymous";
      templateImage.src = templateFiles[selectedQrTemplate];

      await new Promise((resolve, reject) => {
        templateImage.onload = resolve;
        templateImage.onerror = () =>
          reject(new Error(`Could not load ${templateFiles[selectedQrTemplate]}. Make sure the image is in frontend/public.`));
      });

      const svgSource = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgSource], {
        type: "image/svg+xml;charset=utf-8",
      });
      svgUrl = URL.createObjectURL(svgBlob);

      const qrImage = new Image();
      qrImage.src = svgUrl;
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      // Export at the exact aspect ratio of the template image.
      const canvas = document.createElement("canvas");
      canvas.width = templateImage.naturalWidth;
      canvas.height = templateImage.naturalHeight;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not supported in this browser.");

      context.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const isBlackTemplate = selectedQrTemplate === "black";
      const isWaveTemplate = selectedQrTemplate === "wave";

      // Match the preview's heading placement and preserve all text.
      context.save();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = isWaveTemplate ? "#202a3a" : "#ffffff";
      context.shadowColor = isWaveTemplate
        ? "rgba(255,255,255,0)"
        : "rgba(0,0,0,0.65)";
      context.shadowBlur = Math.max(2, w * 0.003);
      context.shadowOffsetY = 1;
      context.font = `800 ${Math.round(w * 0.045)}px Arial, sans-serif`;
      context.fillText("REVIEW US ON", centerX, h * 0.101);
      context.restore();

      // Draw the Google wordmark in its six official letter colours.
      context.save();
      context.textBaseline = "middle";
      context.font = `700 ${Math.round(w * 0.075)}px Arial, sans-serif`;
      context.textAlign = "left";
      context.shadowColor = "transparent";
      const googleLetters = [
        ["G", "#4285F4"],
        ["o", "#EA4335"],
        ["o", "#FBBC05"],
        ["g", "#4285F4"],
        ["l", "#34A853"],
        ["e", "#EA4335"],
      ];
      const letterWidths = googleLetters.map(([letter]) =>
        context.measureText(letter).width
      );
      const totalGoogleWidth = letterWidths.reduce((sum, width) => sum + width, 0);
      let letterX = centerX - totalGoogleWidth / 2;
      googleLetters.forEach(([letter, color], index) => {
        context.fillStyle = color;
        context.fillText(letter, letterX, h * 0.145);
        letterX += letterWidths[index];
      });
      context.restore();

      // Match the responsive preview: QR width is 30% of the full image.
      // The Wave template's frame sits higher than the Color and Black frames.
      const qrBoxWidth = w * 0.55;
      const qrSize = qrBoxWidth * (230 / 238);
      const qrX = (w - qrSize) / 2;
      const qrCenterY = h * (isWaveTemplate ? 0.46 : 0.51);
      const qrY = qrCenterY - qrSize / 2;

      context.save();
      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
      context.fillStyle = "#ffffff";
      const qrPadding = qrBoxWidth * 0.025;
      context.fillRect(
        qrX - qrPadding,
        qrY - qrPadding,
        qrSize + qrPadding * 2,
        qrSize + qrPadding * 2
      );
      context.restore();
      context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Keep the review prompt and five stars visible like the website preview.
      context.save();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = isBlackTemplate || isWaveTemplate ? "#ffffff" : "#ffffff";
      context.shadowColor = "rgba(0,0,0,0.65)";
      context.shadowBlur = w * 0.004;
      context.shadowOffsetY = 1;
      context.font = `600 ${Math.round(w * 0.047)}px Arial, sans-serif`;
      context.fillText("Please take a moment to give", centerX, h * 0.805);
      context.fillText("us a Google Review!", centerX, h * 0.838);
      context.shadowBlur = 0;
      context.fillStyle = "#fbbc05";
      context.font = `700 ${Math.round(w * 0.057)}px Arial, sans-serif`;
      context.fillText("★★★★★", centerX, h * 0.870);
      context.restore();

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Could not create the PNG download.");

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${createdBusiness.name || "business"}-review-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      console.error("Unable to download designed QR card:", error);
      window.alert(
        "Could not download the QR card. Check that the three QR template PNG files are in frontend/public."
      );
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
    }
  };
  const resetForm = () => {
    setStep(1);
    setFormData({
      name: "",
      category: "",
      businessType: "",
      specialization: "",
      googleReviewUrl: "",
      selectedQuestions: [],
    });

    setCustomSpecialization("");
    setAiQuestions([]);
    setQuestionsGenerated(false);
    setCreatedBusiness(null);
    setQrGenerated(false);
    setErrors({});
  };

  if (isGeneratingQR) {
    return (
      <div className="create-business-page">
        <div className="qr-generation-screen">
          <div className="qr-animation-container">
            <div className="qr-animation-box">
              <div className="qr-scan-line" />
              <div className="fake-qr">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="qr-animation-ring ring-one" />
            <div className="qr-animation-ring ring-two" />
          </div>
          <h1>
            Generating Your QR Code
          </h1>
          <p>
            Creating a unique review
            experience for{" "}
            <strong>
              {formData.name}
            </strong>
          </p>
          <div className="qr-generation-progress">
            <span />
          </div>
          <div className="qr-generation-status">
            <span className="generation-dot" />
            Creating business QR
          </div>
        </div>
      </div>
    );
  }
  /* =======================================================
  QR SUCCESS SCREEN
  ======================================================= */
  if (
    qrGenerated &&
    createdBusiness
  ) {
    return (
      <div className="create-business-page">
        <section className="qr-success-page qr-premium-success">
          <div
            className="qr-premium-decoration"
            aria-hidden="true"
          >
            <span className="qr-decoration-orb qr-orb-one" />
            <span className="qr-decoration-orb qr-orb-two" />
            <span className="qr-decoration-orb qr-orb-three" />
            <div className="qr-decoration-mark">
              <Icon
                name="qr"
                size={48}
              />
            </div>
          </div>
          <header className="qr-success-header qr-premium-header">
            <div className="qr-success-copy">
              <span className="qr-success-eyebrow">
                <span className="qr-success-check">
                  <Icon
                    name="check"
                    size={16}
                  />
                </span>
                QR CODE GENERATED
              </span>
              <h1>
                Your Review QR is{" "}
                <span>
                  Ready!
                </span>
              </h1>
              <p>
                Customers can now scan
                this QR code to create
                their review for{" "}
                <strong>
                  {createdBusiness.name}
                </strong>
                .
              </p>
            </div>
          </header>
          <div className="qr-success-content qr-premium-content">
            <div className="qr-preview-column">
              <div className="qr-template-picker" aria-label="Choose your QR template">
                <strong>Choose your QR template</strong>
                <div className="qr-template-options">
                  {[
                    { id: "color", label: "Color", image: "/qr-template-color.png" },
                    { id: "black", label: "Black", image: "/qr-template-black.png" },
                    { id: "wave", label: "Wave", image: "/qr-template-wave.png" },
                  ].map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`qr-template-option ${selectedQrTemplate === template.id ? "selected" : ""}`}
                      onClick={() => setSelectedQrTemplate(template.id)}
                      aria-pressed={selectedQrTemplate === template.id}
                    >
                      <img src={template.image} alt={`${template.label} QR template preview`} />
                      <span>{template.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={`qr-preview-card qr-template-preview qr-template-${selectedQrTemplate}`}>
                <img
                  className="qr-template-background"
                  src={`/qr-template-${selectedQrTemplate === "color" ? "color" : selectedQrTemplate === "black" ? "black" : "wave"}.png`}
                  alt={`${selectedQrTemplate} QR template`}
                />
                <div className="qr-template-heading" aria-label="Review us on Google">
                  <span className="qr-template-title">REVIEW US ON</span>
                  <span className="qr-template-google" aria-label="Google">
                    <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
                  </span>
                </div>
                <div className="qr-template-code-overlay">
                  <QRCodeSVG
                    id="reviewqr-generated"
                    value={qrUrl}
                    size={230}
                    bgColor="#ffffff"
                    fgColor="#17233e"
                    level="H"
                    includeMargin
                  />
                </div>
                <div className="qr-template-footer">
                  <span>Please take a moment to give</span>
                  <span>us a Google Review!</span>
                  <span className="qr-template-stars" aria-label="Five stars">★★★★★</span>
                </div>
              </div>
            </div>
            <div className="qr-details-card qr-premium-details">
              <div className="qr-premium-detail-title">
                <div className="qr-premium-business-icon">
                  <Icon
                    name="building"
                    size={25}
                  />
                </div>
                <div className="qr-premium-business-copy">
                  <h2>
                    Business Details
                  </h2>
                  <p>
                    Here are the details
                    for your business
                    review setup.
                  </p>
                </div>
                <span className="qr-premium-status">
                  <i />
                  Active
                </span>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon">
                  <Icon
                    name="building"
                    size={17}
                  />
                </span>
                <span>
                  Business
                </span>
                <strong>
                  {createdBusiness.name}
                </strong>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon">
                  <Icon
                    name="hash"
                    size={17}
                  />
                </span>
                <span>
                  Business ID
                </span>
                <strong>
                  {createdBusiness.id}
                </strong>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon">
                  <Icon
                    name="tag"
                    size={17}
                  />
                </span>
                <span>
                  Category
                </span>
                <strong>
                  {createdBusiness.category}
                </strong>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon">
                  <Icon
                    name="questions"
                    size={17}
                  />
                </span>
                <span>
                  Questions
                </span>
                <strong>
                  6 / 6
                </strong>
              </div>
              <div className="qr-premium-url">
                <div className="qr-premium-url-label">
                  <span className="qr-premium-row-icon">
                    <Icon
                      name="link"
                      size={17}
                    />
                  </span>
                  <span>
                    Review URL
                  </span>
                </div>
                <div className="qr-premium-url-controls">
                  <input
                    type="text"
                    value={qrUrl}
                    readOnly
                    aria-label="Review URL"
                  />
                  <button
                    type="button"
                    onClick={copyQrUrl}
                  >
                    <Icon
                      name={
                        isQrUrlCopied
                          ? "check"
                          : "copy"
                      }
                      size={15}
                    />
                    {
                      isQrUrlCopied
                        ? "Copied"
                        : "Copy"
                    }
                  </button>
                </div>
              </div>
              <div className="qr-success-actions qr-premium-actions">
                <button
                  type="button"
                  className="qr-download-button"
                  onClick={downloadQR}
                >
                  <Icon
                    name="download"
                    size={17}
                  />
                  Download QR
                </button>
                <button
                  type="button"
                  className="qr-business-button"
                  onClick={() =>
                    onNavigate(
                      "businesses"
                    )
                  }
                >
                  View Business
                  <Icon
                    name="arrow"
                    size={17}
                  />
                </button>
              </div>
            </div>
          </div>
          <aside className="qr-success-note qr-premium-note">
            <div className="qr-note-icon">
              <Icon
                name="lightbulb"
                size={23}
              />
            </div>
            <div>
              <strong>
                What's Next?
              </strong>
              <span>
                Share this QR code at
                your store, on your
                bills, or on social
                media. Customers will
                be redirected to your
                Google review page
                after completing the
                questions.
              </span>
            </div>
          </aside>
        </section>
      </div>
    );
  }
  return (
    <div className="create-business-page">
      <div className="create-business-header">
        <div>
          <button
            type="button"
            className="create-back-button"
            onClick={handleBack}
          >
            <Icon
              name="arrow"
              size={16}
            />
            Back
          </button>
          <h1>
            Create New Business
          </h1>
          <p>
            Configure a business and
            create its review QR
            experience.
          </p>
        </div>
      </div>
      <div className="create-stepper">
        <div
          className={`create-step ${step >= 1
              ? "active"
              : ""
            } ${step > 1
              ? "completed"
              : ""
            }`}
        >
          <div className="create-step-number">
            {step > 1
              ? "✓"
              : "1"}
          </div>
          <div>
            <strong>
              Business Details
            </strong>
            <span>
              Basic information
            </span>
          </div>
        </div>
        <div className="create-step-line" />
        <div
          className={`create-step ${step >= 2
              ? "active"
              : ""
            } ${step > 2
              ? "completed"
              : ""
            }`}
        >
          <div className="create-step-number">
            {step > 2
              ? "✓"
              : "2"}
          </div>
          <div>
            <strong>
              AI Questions
            </strong>
            <span>
              Generate 15, choose 6
            </span>
          </div>
        </div>
        <div className="create-step-line" />
        <div
          className={`create-step ${step >= 3
              ? "active"
              : ""
            }`}
        >
          <div className="create-step-number">
            3
          </div>
          <div>
            <strong>
              Review & Generate
            </strong>
            <span>
              Confirm and generate QR
            </span>
          </div>
        </div>
      </div>
      {step === 1 && (
        <section className="create-business-card">
          <div className="create-card-heading">
            <div className="create-heading-icon">
              <Icon
                name="building"
                size={22}
              />
            </div>
            <div>
              <h2>
                Business Details
              </h2>
              <p>
                Enter the basic details of the business.
              </p>
            </div>
          </div>
          <div className="create-form-grid">
            <div className="create-field">
              <label>
                Business Name
                <span>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter business name"
              />
              {errors.name && (
                <small>
                  {errors.name}
                </small>
              )}
            </div>
            <div className="create-field">
              <label>
                Business Category
                <span>*</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                >
                  <option value="">Select category</option>
                  {Object.keys(allCategoryConfig).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => openCategoryManager("category")}
                  title="Add new category"
                  aria-label="Add new category"
                  style={{ width: "42px", minWidth: "42px", height: "42px", border: "1px solid #dbe3f0", borderRadius: "10px", background: "#f7f9ff", color: "#2864e8", fontSize: "24px", fontWeight: 700, lineHeight: 1, cursor: "pointer" }}
                >
                  +
                </button>
              </div>
              {errors.category && (
                <small>{errors.category}</small>
              )}
            </div>
            {formData.category && (
              <div className="create-field">
                <label>
                  Business Type
                  <span>*</span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select business type</option>
                    {categoryConfig.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.businessType && (
                  <small>{errors.businessType}</small>
                )}
              </div>
            )}
            {formData.businessType && (
              <div className="create-field">
                <label>
                  Specialization
                  <span style={{ fontWeight: 400 }}> (optional)</span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select specialization</option>
                    {availableSpecializations.map((specialization) => (
                      <option key={specialization} value={specialization}>
                        {specialization}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.specialization === "Other" && (
                  <input
                    type="text"
                    value={customSpecialization}
                    onChange={(event) => setCustomSpecialization(event.target.value)}
                    placeholder="Enter your specialization"
                    style={{ marginTop: "10px" }}
                  />
                )}
              </div>
            )}
            <div className="create-field create-field-full">
              <label>
                Google Review URL
                <span>*</span>
              </label>
              <input
                type="text"
                name="googleReviewUrl"
                value={
                  formData.googleReviewUrl
                }
                onChange={
                  handleChange
                }
                placeholder="https://g.page/r/..."
              />
              {errors.googleReviewUrl && (
                <small>
                  {errors.googleReviewUrl}
                </small>
              )}
              <p>
                Customers will be redirected to this Google review page after generating their review.
              </p>
            </div>
          </div>
          {errors.questions && (
            <div className="create-question-error">
              {errors.questions}
            </div>
          )}
          <div className="create-card-footer">
            <button
              type="button"
              className="create-cancel-button"
              onClick={handleBack}
            >
              Cancel
            </button>
            <button
              type="button"
              className="generate-questions-button"
              onClick={handleContinue}
              disabled={isGeneratingQuestions}
            >
              {isGeneratingQuestions ? (
                "Generating..."
              ) : (
                "Generate Questions"
              )}
              <Icon
                name="arrow"
                size={15}
              />
            </button>
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="create-business-card">
          <div className="create-card-heading">
            <div className="create-heading-icon">
              <Icon
                name="questions"
                size={22}
              />
            </div>
            <div>
              <h2>
                AI Questions
              </h2>
              <p>
                Choose exactly 6 questions for this business.
              </p>
            </div>
          </div>
          {isGeneratingQuestions ? (
            <div className="create-loading-state">
              <div className="create-spinner" />
              <h3>
                Generating questions...
              </h3>
              <p>
                Creating questions for {
                  formData.businessType
                }
                {selectedSpecialization &&
                  selectedSpecialization !== "General"
                  ? ` → ${selectedSpecialization}`
                  : ""}
                .
              </p>
            </div>
          ) : (
            <>
              {errors.questions && (
                <div className="create-question-error">
                  {errors.questions}
                </div>
              )}
              <div className="questions-selection-header">
                <div>
                  <strong>
                    Select questions
                  </strong>
                  <span>
                    Choose 6 out of {aiQuestions.length}
                  </span>
                </div>
                <div className="questions-selection-count">
                  {formData.selectedQuestions.length} / 6
                </div>
              </div>
              <div className="ai-question-list">
                {displayedQuestions.map(
                  (question, index) => (
                    <button
                      type="button"
                      key={question.id}
                      className={`ai-question-item ${formData.selectedQuestions.includes(
                        question.id
                      )
                          ? "selected"
                          : ""
                        }`}
                      onClick={() =>
                        handleQuestionToggle(
                          question.id
                        )
                      }
                    >
                      <span className="ai-question-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="ai-question-content">
                        <strong>
                          {question.question}
                        </strong>
                        <span className="ai-question-content">
  <strong>
    {question.question}
  </strong>
</span>
                      </span>
                      <span className="ai-question-check">
                        {formData.selectedQuestions.includes(
                          question.id
                        )
                          ? "✓"
                          : ""}
                      </span>
                    </button>
                  )
                )}
              </div>
            </>
          )}
          <div className="create-card-footer">
            <button
              type="button"
              className="create-cancel-button"
              onClick={handleBack}
            >
              Back
            </button>
            <button
              type="button"
              className="generate-questions-button"
              onClick={handleContinue}
              disabled={
                isGeneratingQuestions ||
                formData.selectedQuestions.length !== 6
              }
            >
              Continue
              <Icon
                name="arrow"
                size={15}
              />
            </button>
          </div>
        </section>
      )}
     {step === 3 && (
  <section
    className="create-business-card"
    style={{
      padding: "24px",
    }}
  >
    <div className="create-card-heading">
      <div className="create-heading-icon">
        <Icon
          name="review"
          size={22}
        />
      </div>

      <div>
        <h2>
          Review & Generate QR
        </h2>

        <p>
          Confirm the details before creating the review QR experience.
        </p>
      </div>
    </div>

    {/* BUSINESS INFORMATION */}

    <div
      className="review-summary"
      style={{
        marginTop: "18px",
        padding: "18px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px 0",
          padding: 0,
          fontSize: "15px",
          fontWeight: 800,
          color: "#1d2e4d",
        }}
      >
        Business Information
      </h3>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          boxSizing: "border-box",
        }}
      >

        {/* BUSINESS NAME */}

        <div
          style={{
            minWidth: 0,
            padding: "13px 15px",
            border: "1px solid #e3eaf4",
            borderRadius: "10px",
            background: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              margin: 0,
              fontSize: "10px",
              lineHeight: "1.4",
              color: "#8998b0",
              fontWeight: 600,
            }}
          >
            Business Name
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "5px",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#34445f",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formData.name}
          </strong>
        </div>

        {/* CATEGORY */}

        <div
          style={{
            minWidth: 0,
            padding: "13px 15px",
            border: "1px solid #e3eaf4",
            borderRadius: "10px",
            background: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              margin: 0,
              fontSize: "10px",
              lineHeight: "1.4",
              color: "#8998b0",
              fontWeight: 600,
            }}
          >
            Category
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "5px",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#34445f",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formData.category}
          </strong>
        </div>

        {/* BUSINESS TYPE */}

        <div
          style={{
            minWidth: 0,
            padding: "13px 15px",
            border: "1px solid #e3eaf4",
            borderRadius: "10px",
            background: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              margin: 0,
              fontSize: "10px",
              lineHeight: "1.4",
              color: "#8998b0",
              fontWeight: 600,
            }}
          >
            Business Type
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "5px",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#34445f",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formData.businessType}
          </strong>
        </div>

        {/* SPECIALIZATION */}

        <div
          style={{
            minWidth: 0,
            padding: "13px 15px",
            border: "1px solid #e3eaf4",
            borderRadius: "10px",
            background: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              margin: 0,
              fontSize: "10px",
              lineHeight: "1.4",
              color: "#8998b0",
              fontWeight: 600,
            }}
          >
            Specialization
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "5px",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#34445f",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedSpecialization}
          </strong>
        </div>

        {/* GOOGLE REVIEW URL */}

        <div
          style={{
            gridColumn: "1 / -1",
            minWidth: 0,
            padding: "13px 15px",
            border: "1px solid #e3eaf4",
            borderRadius: "10px",
            background: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              margin: 0,
              fontSize: "10px",
              lineHeight: "1.4",
              color: "#8998b0",
              fontWeight: 600,
            }}
          >
            Google Review URL
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "5px",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#34445f",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formData.googleReviewUrl}
          </strong>
        </div>

      </div>
    </div>

    {/* SELECTED QUESTIONS */}

    <div
      className="review-selected-questions"
      style={{
        marginTop: "18px",
      }}
    >
      <div className="review-selected-header">
        <div>
          <h3>
            Selected AI Questions
          </h3>

          <p>
            These 6 questions will be stored with this business and shown to customers scanning its QR code.
          </p>
        </div>

        <span>
          6 / 6
        </span>
      </div>

      <div className="review-question-grid">
        {selectedQuestionObjects.map(
          (question, index) => (
            <div
              className="review-question"
              key={question.id}
            >
              <span>
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <p>
                {question.question}
              </p>
            </div>
          )
        )}
      </div>
    </div>

    {errors.submit && (
      <div className="create-question-error">
        {errors.submit}
      </div>
    )}

    <div className="create-card-footer">
      <button
        type="button"
        className="create-cancel-button"
        onClick={handleBack}
      >
        Back
      </button>

      <button
        type="button"
        className="generate-qr-button"
        onClick={handleGenerateQR}
        disabled={isGeneratingQR}
      >
        <Icon
          name="qr"
          size={17}
          strokeWidth={2}
        />

        Generate QR

        <Icon
          name="arrow"
          size={15}
        />
      </button>
    </div>
  </section>
)}
      {categoryManager.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            categoryManager.mode === "category"
              ? "Add category"
              : categoryManager.mode === "businessType"
                ? "Add business type"
                : "Add specialization"
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCategoryManager();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
              padding: "26px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: "#15264a", fontSize: "22px" }}>
                  {categoryManager.mode === "category"
                    ? "Add New Category"
                    : categoryManager.mode === "businessType"
                      ? "Add Business Type"
                      : "Add Specialization"}
                </h2>
                <p style={{ margin: "7px 0 0", color: "#71809d", fontSize: "14px", lineHeight: 1.5 }}>
                  {categoryManager.mode === "category"
                    ? "Create a new category and optionally add its first business type and specialization."
                    : categoryManager.mode === "businessType"
                      ? `Add a business type to ${formData.category}.`
                      : `Add a specialization to ${formData.category}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCategoryManager}
                aria-label="Close"
                style={{ border: "none", background: "transparent", color: "#7a879f", fontSize: "26px", lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
              >
                ×
              </button>
            </div>
            {categoryManager.mode === "category" && (
              <div className="create-field" style={{ marginBottom: "15px" }}>
                <label>
                  Category Name
                  <span>*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g. Pet Care"
                  autoFocus
                />
              </div>
            )}
            {(categoryManager.mode === "category" || categoryManager.mode === "businessType") && (
              <div className="create-field" style={{ marginBottom: "15px" }}>
                <label>
                  {categoryManager.mode === "category" ? "First Business Type" : "Business Type"}
                  {categoryManager.mode === "category" && (
                    <span style={{ fontWeight: 400 }}> (optional)</span>
                  )}
                  {categoryManager.mode === "businessType" && <span>*</span>}
                </label>
                <input
                  type="text"
                  value={newBusinessType}
                  onChange={(event) => setNewBusinessType(event.target.value)}
                  placeholder={categoryManager.mode === "category" ? "e.g. Pet Grooming" : "e.g. Mobile Grooming"}
                  autoFocus={categoryManager.mode === "businessType"}
                />
              </div>
            )}
            {(categoryManager.mode === "category" || categoryManager.mode === "specialization") && (
              <div className="create-field" style={{ marginBottom: "15px" }}>
                <label>
                  {categoryManager.mode === "category" ? "First Specialization" : "Specialization"}
                  {categoryManager.mode === "category" && (
                    <span style={{ fontWeight: 400 }}> (optional)</span>
                  )}
                  {categoryManager.mode === "specialization" && <span>*</span>}
                </label>
                <input
                  type="text"
                  value={newSpecialization}
                  onChange={(event) => setNewSpecialization(event.target.value)}
                  placeholder={categoryManager.mode === "category" ? "e.g. Dog Grooming" : "e.g. Puppy Grooming"}
                  autoFocus={categoryManager.mode === "specialization"}
                />
              </div>
            )}
            {categoryManagerError && (
              <div style={{ color: "#d14343", background: "#fff3f3", border: "1px solid #ffd5d5", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", lineHeight: 1.4, marginBottom: "16px" }}
              >
                {categoryManagerError}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={closeCategoryManager}
                style={{ height: "44px", padding: "0 18px", borderRadius: "10px", border: "1px solid #dce4f0", background: "#ffffff", color: "#596780", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCategoryManager}
                style={{ height: "44px", padding: "0 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2878ee, #7252e9)", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CreateBusiness;