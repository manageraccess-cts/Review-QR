import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const QuestionContext = createContext(null);

const STORAGE_KEY = "reviewqr_questions";

/* =========================================
   INITIAL QUESTION BANK
========================================= */

const INITIAL_QUESTIONS = [
  // PG
  {
    id: "Q_PG_001",
    category: "PG",
    question: "How would you rate the cleanliness of the PG?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_002",
    category: "PG",
    question: "How comfortable are the rooms?",
    options: [
      "Very Comfortable",
      "Comfortable",
      "Average",
      "Uncomfortable",
    ],
    status: "Active",
  },
  {
    id: "Q_PG_003",
    category: "PG",
    question: "How would you rate the food quality?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_004",
    category: "PG",
    question: "How helpful and friendly is the staff?",
    options: [
      "Very Helpful",
      "Helpful",
      "Average",
      "Not Helpful",
    ],
    status: "Active",
  },
  {
    id: "Q_PG_005",
    category: "PG",
    question: "How would you rate the location?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_006",
    category: "PG",
    question: "How would you rate the overall atmosphere?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_007",
    category: "PG",
    question: "How would you rate the Wi-Fi connectivity?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_008",
    category: "PG",
    question: "How satisfied are you with the facilities?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Average",
      "Dissatisfied",
    ],
    status: "Active",
  },
  {
    id: "Q_PG_009",
    category: "PG",
    question: "How safe and secure do you feel here?",
    options: [
      "Very Safe",
      "Safe",
      "Average",
      "Unsafe",
    ],
    status: "Active",
  },
  {
    id: "Q_PG_010",
    category: "PG",
    question: "How would you rate the maintenance service?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_011",
    category: "PG",
    question: "How would you rate the value for money?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PG_012",
    category: "PG",
    question: "Would you recommend this PG to others?",
    options: ["Definitely", "Probably", "Maybe", "No"],
    status: "Active",
  },

  // PACKERS & MOVERS
  {
    id: "Q_PM_001",
    category: "Packers & Movers",
    question: "How would you rate the packing quality?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_002",
    category: "Packers & Movers",
    question: "How safely were your belongings handled?",
    options: [
      "Very Safely",
      "Safely",
      "Average",
      "Poorly",
    ],
    status: "Active",
  },
  {
    id: "Q_PM_003",
    category: "Packers & Movers",
    question: "How would you rate the staff?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_004",
    category: "Packers & Movers",
    question: "How was the delivery experience?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_005",
    category: "Packers & Movers",
    question: "How would you rate the punctuality?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_006",
    category: "Packers & Movers",
    question: "How would you rate the communication?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_007",
    category: "Packers & Movers",
    question: "How satisfied are you with the overall service?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Average",
      "Dissatisfied",
    ],
    status: "Active",
  },
  {
    id: "Q_PM_008",
    category: "Packers & Movers",
    question: "How would you rate the transportation service?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_009",
    category: "Packers & Movers",
    question: "How would you rate the pricing?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_010",
    category: "Packers & Movers",
    question: "How well were your items delivered?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_011",
    category: "Packers & Movers",
    question: "How would you rate the professionalism?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_PM_012",
    category: "Packers & Movers",
    question: "Would you recommend this service to others?",
    options: ["Definitely", "Probably", "Maybe", "No"],
    status: "Active",
  },

  // GLASS
  {
    id: "Q_GLASS_001",
    category: "Glass",
    question: "How would you rate the quality of the glass?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_002",
    category: "Glass",
    question: "How would you rate the finishing quality?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_003",
    category: "Glass",
    question: "How would you rate the installation service?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_004",
    category: "Glass",
    question: "How professional was the staff?",
    options: [
      "Very Professional",
      "Professional",
      "Average",
      "Unprofessional",
    ],
    status: "Active",
  },
  {
    id: "Q_GLASS_005",
    category: "Glass",
    question: "How would you rate the design options?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_006",
    category: "Glass",
    question: "How satisfied are you with the service?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Average",
      "Dissatisfied",
    ],
    status: "Active",
  },
  {
    id: "Q_GLASS_007",
    category: "Glass",
    question: "How would you rate the pricing?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_008",
    category: "Glass",
    question: "How would you rate the durability?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_009",
    category: "Glass",
    question: "How would you rate the delivery time?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_010",
    category: "Glass",
    question: "How satisfied are you with the final result?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Average",
      "Dissatisfied",
    ],
    status: "Active",
  },
  {
    id: "Q_GLASS_011",
    category: "Glass",
    question: "How would you rate the overall experience?",
    options: ["Excellent", "Good", "Average", "Poor"],
    status: "Active",
  },
  {
    id: "Q_GLASS_012",
    category: "Glass",
    question: "Would you recommend this business to others?",
    options: ["Definitely", "Probably", "Maybe", "No"],
    status: "Active",
  },
];

/* =========================================
   NORMALIZE QUESTION DATA
========================================= */

const normalizeQuestion = (question) => {
  return {
    ...question,

    /*
      Support old data formats too.
    */

    question:
      question.question ||
      question.text ||
      question.questionText ||
      question.title ||
      "",

    options:
      Array.isArray(question.options)
        ? question.options
        : [],

    status:
      question.status || "Active",
  };
};

/* =========================================
   LOAD QUESTIONS
========================================= */

const getStoredQuestions = () => {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return INITIAL_QUESTIONS;
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return INITIAL_QUESTIONS;
    }

    return parsed.map(
      normalizeQuestion
    );
  } catch (error) {
    console.error(
      "Failed to load questions:",
      error
    );

    return INITIAL_QUESTIONS;
  }
};

/* =========================================
   PROVIDER
========================================= */

export const QuestionProvider = ({
  children,
}) => {
  const [questions, setQuestions] =
    useState(
      getStoredQuestions
    );

  /* =========================================
     SAVE
  ========================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          questions
        )
      );
    } catch (error) {
      console.error(
        "Failed to save questions:",
        error
      );
    }
  }, [questions]);

  /* =========================================
     ADD
  ========================================= */

  const addQuestion = (
    questionData
  ) => {
    const categoryPrefix = {
      PG: "PG",
      "Packers & Movers": "PM",
      Glass: "GLASS",
    };

    const prefix =
      categoryPrefix[
        questionData.category
      ] || "GEN";

    const categoryQuestions =
      questions.filter(
        (question) =>
          question.category ===
          questionData.category
      );

    const nextNumber =
      categoryQuestions.length +
      1;

    const newQuestion =
      normalizeQuestion({
        ...questionData,

        id: `Q_${prefix}_${String(
          nextNumber
        ).padStart(3, "0")}`,

        status:
          questionData.status ||
          "Active",
      });

    setQuestions(
      (current) => [
        ...current,
        newQuestion,
      ]
    );

    return newQuestion;
  };

  /* =========================================
     UPDATE
  ========================================= */

  const updateQuestion = (
    questionId,
    updates
  ) => {
    setQuestions(
      (current) =>
        current.map(
          (question) =>
            question.id ===
            questionId
              ? normalizeQuestion({
                  ...question,
                  ...updates,
                })
              : question
        )
    );
  };

  /* =========================================
     DELETE
  ========================================= */

  const deleteQuestion = (
    questionId
  ) => {
    setQuestions(
      (current) =>
        current.filter(
          (question) =>
            question.id !==
            questionId
        )
    );
  };

  /* =========================================
     TOGGLE STATUS
  ========================================= */

  const toggleQuestionStatus = (
    questionId
  ) => {
    setQuestions(
      (current) =>
        current.map(
          (question) =>
            question.id ===
            questionId
              ? {
                  ...question,
                  status:
                    question.status ===
                    "Active"
                      ? "Inactive"
                      : "Active",
                }
              : question
        )
    );
  };

  /* =========================================
     CATEGORY QUESTIONS
  ========================================= */

  const getQuestionsByCategory = (
    category,
    activeOnly = false
  ) => {
    return questions.filter(
      (question) => {
        const categoryMatch =
          question.category ===
          category;

        const statusMatch =
          activeOnly
            ? question.status ===
              "Active"
            : true;

        return (
          categoryMatch &&
          statusMatch
        );
      }
    );
  };

  /* =========================================
     GET BY ID
  ========================================= */

  const getQuestionById = (
    questionId
  ) => {
    return questions.find(
      (question) =>
        question.id ===
        questionId
    );
  };

  /* =========================================
     CATEGORIES

     Dynamic — works for 50+
     categories.
  ========================================= */

  const categories =
    useMemo(() => {
      return [
        ...new Set(
          questions
            .map(
              (question) =>
                question.category
            )
            .filter(Boolean)
        ),
      ];
    }, [questions]);

  /* =========================================
     STATISTICS
  ========================================= */

  const statistics =
    useMemo(() => {
      const total =
        questions.length;

      const active =
        questions.filter(
          (question) =>
            question.status ===
            "Active"
        ).length;

      const inactive =
        questions.filter(
          (question) =>
            question.status ===
            "Inactive"
        ).length;

      const categoryCounts =
        {};

      categories.forEach(
        (category) => {
          categoryCounts[
            category
          ] =
            questions.filter(
              (question) =>
                question.category ===
                category
            ).length;
        }
      );

      return {
        total,
        active,
        inactive,
        categoryCounts,
      };
    }, [
      questions,
      categories,
    ]);

  /* =========================================
     CONTEXT VALUE
  ========================================= */

  const value = {
    questions,

    categories,

    statistics,

    addQuestion,

    updateQuestion,

    deleteQuestion,

    toggleQuestionStatus,

    getQuestionsByCategory,

    getQuestionById,
  };

  return (
    <QuestionContext.Provider
      value={value}
    >
      {children}
    </QuestionContext.Provider>
  );
};

/* =========================================
   HOOK
========================================= */

export const useQuestion = () => {
  const context =
    useContext(
      QuestionContext
    );

  if (!context) {
    throw new Error(
      "useQuestion must be used inside QuestionProvider"
    );
  }

  return context;
};

/* =========================================
   PLURAL HOOK
========================================= */

export const useQuestions = () => {
  const context =
    useContext(
      QuestionContext
    );

  if (!context) {
    throw new Error(
      "useQuestions must be used inside QuestionProvider"
    );
  }

  return context;
};

export default QuestionContext;