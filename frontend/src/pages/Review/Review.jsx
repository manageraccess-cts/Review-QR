import { useEffect, useMemo, useState } from "react";

import Icon from "../../components/Icon";

import {
  getPublicBusiness,
  recordReviewActivity,
} from "../../services/api";

import { useQuestion } from "../../context/QuestionContext";

import "./Review.css";


const getOptionEmoji = (option, index = 0, total = 5) => {
  const value = String(option || "").trim().toLowerCase().replace(/[’']/g, "'");
  const normalized = value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

  // Match negated and stronger phrases before broad positive keywords.
  if (/\b(not satisfied|not good|not helpful|very dissatisfied|extremely dissatisfied|very poor|extremely poor|strongly disagree|terrible|awful|awful experience)\b/.test(normalized)) return "😕";
  if (/\b(very satisfied|extremely satisfied|highly satisfied|excellent|outstanding|exceptional|amazing|very good|strongly agree)\b/.test(normalized)) return "🤩";
  if (/\b(average|okay|ok|somewhat|neutral|moderate|fair|neither|undecided)\b/.test(normalized)) return "😐";
  if (/\b(poor|bad|unsatisfied|dissatisfied|unhelpful|uncomfortable|difficult|disagree|no)\b/.test(normalized)) return "😞";
  if (/\b(good|satisfied|helpful|agree|positive|comfortable|easy|recommend|great|yes|well)\b/.test(normalized)) return "😊";

  // Use a distinct ordered expression for custom/numeric options.
  const palettes = {
    2: ["😊", "😕"],
    3: ["🤩", "😐", "😕"],
    4: ["🤩", "😊", "😐", "😕"],
    5: ["🤩", "😊", "😐", "😕", "😣"],
  };
  const palette = palettes[total] || ["🤩", "😊", "😐", "😕", "😣"];
  return palette[index % palette.length];
};


const Review = () => {
  const { questions } = useQuestion();

  const [business, setBusiness] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [started, setStarted] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [generatedReview, setGeneratedReview] =
    useState("");

  const [reviewGenerated, setReviewGenerated] =
    useState(false);

  const [copied, setCopied] =
    useState(false);


  /*
   * =========================================
   * GET BUSINESS ID FROM URL
   *
   * Example:
   * /r/BUS_000005
   * =========================================
   */

  const businessId = useMemo(() => {
    const path =
      window.location.pathname;

    const parts =
      path
        .split("/")
        .filter(Boolean);

    if (
      parts.length >= 2 &&
      parts[0].toLowerCase() === "r"
    ) {
      return parts[1];
    }

    return null;
  }, []);


  /*
   * =========================================
   * LOAD BUSINESS
   * =========================================
   */

  useEffect(() => {
    const loadBusiness =
      async () => {
        if (!businessId) {
          setError(
            "Invalid review link."
          );

          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await getPublicBusiness(
              businessId
            );

          if (
            !response ||
            !response.success ||
            !response.data
          ) {
            throw new Error(
              "Business not found."
            );
          }

          setBusiness(
            response.data
          );
        } catch (err) {
          console.error(
            "Failed to load business:",
            err
          );

          setError(
            err.message ||
              "Unable to load this review page."
          );
        } finally {
          setLoading(false);
        }
      };

    loadBusiness();
  }, [businessId]);


  /*
   * =========================================
   * GET SELECTED QUESTIONS
   * =========================================
   */

  const reviewQuestions =
    useMemo(() => {
      if (
        !business ||
        !Array.isArray(
          business.selectedQuestions
        )
      ) {
        return [];
      }

      return business.selectedQuestions
        .map((questionId) =>
          questions.find(
            (question) =>
              question.id ===
              questionId
          )
        )
        .filter(Boolean);
    }, [
      business,
      questions,
    ]);


  /*
   * =========================================
   * RECORD REVIEW ACTIVITY
   * =========================================
   */

  const recordActivity = async (
    event,
    extraData = {}
  ) => {
    if (!business?.id) {
      return;
    }

    try {
      await recordReviewActivity(
        business.id,
        event,
        extraData.answers || [],
        extraData.generatedReview || ""
      );
    } catch (activityError) {
      console.error(
        "Failed to record review activity:",
        activityError
      );
    }
  };


  /*
   * =========================================
   * SELECT ANSWER
   * =========================================
   */

  const handleAnswer = (
    answer
  ) => {
    const question =
      reviewQuestions[
        currentQuestion
      ];

    if (!question) {
      return;
    }

    setAnswers(
      (current) => ({
        ...current,

        [question.id]:
          answer,
      })
    );
  };


  /*
   * =========================================
   * ANSWER SENTIMENT
   * =========================================
   */

  const getAnswerType = (
    answer
  ) => {
    if (!answer) {
      return "neutral";
    }

    const value =
      answer.toLowerCase();

    const positiveWords = [
      "excellent",
      "very comfortable",
      "very helpful",
      "very safe",
      "very satisfied",
      "very professional",
      "very safely",
      "definitely",
      "good",
      "comfortable",
      "helpful",
      "safe",
      "satisfied",
      "professional",
      "safely",
      "probably",
      "easy",
    ];

    const negativeWords = [
      "poor",
      "poorly",
      "uncomfortable",
      "not helpful",
      "unsafe",
      "dissatisfied",
      "unprofessional",
      "no",
      "difficult",
      "very difficult",
    ];

    if (
      positiveWords.some(
        (word) =>
          value === word ||
          value.includes(word)
      )
    ) {
      return "positive";
    }

    if (
      negativeWords.some(
        (word) =>
          value === word ||
          value.includes(word)
      )
    ) {
      return "negative";
    }

    return "neutral";
  };

  // Give each selected option a satisfaction score instead of assigning
  // every positive-sounding answer 5 stars. Unanswered questions are ignored.
  // Explicit wording takes priority; option order is the fallback and should
  // be configured from most satisfied to least satisfied.
  const getAnswerScore = (question, answer) => {
    if (!question || !answer) return null;

    const value = String(answer)
      .trim()
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");

    // Check negative / negated phrases before positive keywords so that
    // wording such as "not satisfied" cannot accidentally score as positive.
    if (/\b(very dissatisfied|extremely dissatisfied|completely dissatisfied|very poor|extremely poor|terrible|awful|strongly disagree|very unlikely|not fully satisfied|not completely satisfied|not very satisfied|not satisfied|not good|not helpful|not excellent|not happy|not comfortable|not safe|not professional)\b/.test(value)) {
      return 1;
    }

    if (/\b(dissatisfied|unsatisfied|poor|bad|unhelpful|uncomfortable|unsafe|unprofessional|difficult|disagree|unlikely|no)\b/.test(value)) {
      return 2;
    }

    if (/\b(average|okay|ok|neutral|moderate|fair|neither|undecided|somewhat)\b/.test(value)) {
      return 3;
    }

    // Fully satisfied / strongest positive choices = 5.
    if (/\b(extremely satisfied|completely satisfied|fully satisfied|very satisfied|extremely happy|completely happy|excellent|outstanding|exceptional|amazing|definitely|absolutely|strongly agree|very likely)\b/.test(value)) {
      return 5;
    }

    // Satisfied / positive, but not the strongest choice = 4.
    if (/\b(satisfied|happy|good|great|helpful|comfortable|safe|professional|probably|likely|agree|recommend|easy|yes)\b/.test(value)) {
      return 4;
    }

    const options = Array.isArray(question.options) ? question.options : [];
    const selectedIndex = options.findIndex(
      (option) => String(option).trim() === String(answer).trim()
    );

    if (selectedIndex < 0 || options.length <= 1) return 3;
    return 5 - (selectedIndex * 4) / (options.length - 1);
  };

  const answeredScores = reviewQuestions
    .map((item) => getAnswerScore(item, answers[item.id]))
    .filter((score) => score !== null);

  const overallRating = answeredScores.length
    ? Math.round(
        (answeredScores.reduce((total, score) => total + score, 0) /
          answeredScores.length) * 10
      ) / 10
    : 0;

  const filledRatingStars = Math.round(overallRating);

  /*
   * =========================================
   * GET CATEGORY DESCRIPTION
   * =========================================
   */

  const getCategoryDescription =
    (category) => {
      switch (category) {
        case "PG":
          return "stay";

        case "Packers & Movers":
          return "moving experience";

        case "Glass":
          return "overall experience";

        default:
          return "experience";
      }
    };


  /*
   * =========================================
   * CLEAN QUESTION TEXT
   * =========================================
   */

  const getQuestionTopic =
    (question) => {
      if (!question) {
        return "";
      }

      let text =
        question.question || "";

      text = text.replace(
        /^how would you rate\s+/i,
        ""
      );

      text = text.replace(
        /^how would you\s+/i,
        ""
      );

      text = text.replace(
        /^how satisfied are you with\s+/i,
        ""
      );

      text = text.replace(
        /^how comfortable are\s+/i,
        ""
      );

      text = text.replace(
        /^how safe and secure do you feel\s+/i,
        ""
      );

      text = text.replace(
        /^how easy was\s+/i,
        ""
      );

      text = text.replace(
        /^how professional was\s+/i,
        ""
      );

      text = text.replace(
        /^would you recommend\s+/i,
        ""
      );

      text = text.replace(
        /\?$/,
        ""
      );

      /*
       * Prevent phrases such as:
       *
       * "the pricing"
       *
       * from becoming:
       *
       * "the the pricing"
       */

      text = text.replace(
        /^(the|a|an)\s+/i,
        ""
      );

      return text.trim();
    };


  /*
   * =========================================
   * FORMAT TOPIC
   * =========================================
   */

  const formatTopic =
    (topic) => {
      if (!topic) {
        return "";
      }

      return (
        topic.charAt(0).toLowerCase() +
        topic.slice(1)
      );
    };


  /*
   * =========================================
   * GENERATE NATURAL REVIEW
   * =========================================
   */

  const generateReview =
    () => {
      if (!business) {
        return "";
      }

      const selectedAnswers =
        reviewQuestions.map(
          (question) => ({
            question,

            answer:
              answers[
                question.id
              ],

            type:
              getAnswerType(
                answers[
                  question.id
                ]
              ),
          })
        );

      const positiveAnswers =
        selectedAnswers.filter(
          (item) =>
            item.type ===
            "positive"
        );

      const negativeAnswers =
        selectedAnswers.filter(
          (item) =>
            item.type ===
            "negative"
        );

      const neutralAnswers =
        selectedAnswers.filter(
          (item) =>
            item.type ===
            "neutral"
        );

      const positiveTopics =
        positiveAnswers
          .slice(0, 3)
          .map((item) =>
            getQuestionTopic(
              item.question
            )
          )
          .filter(Boolean);

      const negativeTopics =
        negativeAnswers
          .slice(0, 2)
          .map((item) =>
            getQuestionTopic(
              item.question
            )
          )
          .filter(Boolean);

      const categoryDescription =
        getCategoryDescription(
          business.category
        );

      let review = "";


      /*
       * =======================================
       * MOSTLY POSITIVE
       * =======================================
       */

      if (
        positiveAnswers.length >= 4 &&
        negativeAnswers.length === 0
      ) {
        review =
          `I had a positive ${categoryDescription} with ${business.name}.`;

        if (
          positiveTopics.length ===
          1
        ) {
          review +=
            ` I particularly liked the ${formatTopic(
              positiveTopics[0]
            )}.`;
        }

        if (
          positiveTopics.length >= 2
        ) {
          const topics =
            positiveTopics
              .slice(0, 2)
              .map(
                (topic) =>
                  formatTopic(topic)
              );

          review +=
            ` I was happy with the ${topics[0]} and ${topics[1]}.`;
        }

        if (
          positiveAnswers.length >= 5
        ) {
          review +=
            ` Overall, the experience was good and I would recommend ${business.name} to others.`;
        } else {
          review +=
            ` Overall, it was a good experience.`;
        }

        return review;
      }


      /*
       * =======================================
       * MIXED EXPERIENCE
       * =======================================
       */

      if (
        positiveAnswers.length > 0 &&
        negativeAnswers.length > 0
      ) {
        review =
          `My experience with ${business.name} was mixed.`;

        if (
          positiveTopics.length > 0
        ) {
          review +=
            ` I was satisfied with the ${formatTopic(
              positiveTopics[0]
            )}`;
        }

        if (
          negativeTopics.length > 0
        ) {
          review +=
            `, but there is room for improvement with the ${formatTopic(
              negativeTopics[0]
            )}`;
        }

        review += ".";

        if (
          neutralAnswers.length > 0
        ) {
          review +=
            ` Some aspects of the experience were average as well.`;
        }

        return review;
      }


      /*
       * =======================================
       * MOSTLY NEGATIVE
       * =======================================
       */

      if (
        negativeAnswers.length >= 3
      ) {
        review =
          `My experience with ${business.name} did not fully meet my expectations.`;

        if (
          negativeTopics.length ===
          1
        ) {
          review +=
            ` I felt that the ${formatTopic(
              negativeTopics[0]
            )} could be improved.`;
        }

        if (
          negativeTopics.length >= 2
        ) {
          review +=
            ` I felt that the ${formatTopic(
              negativeTopics[0]
            )} and ${formatTopic(
              negativeTopics[1]
            )} could be improved.`;
        }

        if (
          positiveAnswers.length > 0
        ) {
          review +=
            ` There were still some aspects that I found satisfactory.`;
        }

        return review;
      }


      /*
       * =======================================
       * MOSTLY NEUTRAL
       * =======================================
       */

      if (
        neutralAnswers.length >= 3
      ) {
        review =
          `My experience with ${business.name} was average overall.`;

        if (
          positiveTopics.length > 0
        ) {
          review +=
            ` I appreciated the ${formatTopic(
              positiveTopics[0]
            )}.`;
        }

        if (
          negativeTopics.length > 0
        ) {
          review +=
            ` Some areas, such as the ${formatTopic(
              negativeTopics[0]
            )}, could be improved.`;
        }

        return review;
      }


      /*
       * =======================================
       * FALLBACK
       * =======================================
       */

      review =
        `I recently had an experience with ${business.name}.`;

      if (
        positiveTopics.length > 0
      ) {
        review +=
          ` I appreciated the ${formatTopic(
            positiveTopics[0]
          )}.`;
      }

      if (
        negativeTopics.length > 0
      ) {
        review +=
          ` I think the ${formatTopic(
            negativeTopics[0]
          )} could be improved.`;
      }

      return review;
    };


  /*
   * =========================================
   * FINISH QUESTIONS
   * =========================================
   */

  const handleFinish =
    () => {
      const question =
        reviewQuestions[
          currentQuestion
        ];

      if (!question) {
        return;
      }

      if (
        !answers[question.id]
      ) {
        return;
      }

      const review =
        generateReview();

      setGeneratedReview(
        review
      );

      setReviewGenerated(
        true
      );


      /*
       * Record generated review.
       */

      recordActivity(
        "generated",
        {
          answers:
            reviewQuestions.map(
              (item) => ({
                questionId:
                  item.id,

                question:
                  item.question,

                answer:
                  answers[
                    item.id
                  ],
              })
            ),

          generatedReview:
            review,
        }
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  /*
   * =========================================
   * NEXT QUESTION
   * =========================================
   */

  const handleNext = () => {
    const question =
      reviewQuestions[
        currentQuestion
      ];

    if (!question) {
      return;
    }

    if (
      !answers[question.id]
    ) {
      return;
    }

    if (
      currentQuestion <
      reviewQuestions.length - 1
    ) {
      setCurrentQuestion(
        (current) =>
          current + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    handleFinish();
  };


  /*
   * =========================================
   * PREVIOUS QUESTION
   * =========================================
   */

  const handlePrevious = () => {
    if (
      currentQuestion > 0
    ) {
      setCurrentQuestion(
        (current) =>
          current - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  /*
   * =========================================
   * START REVIEW
   * =========================================
   */

  const handleStart = () => {
    if (
      reviewQuestions.length ===
      0
    ) {
      return;
    }

    setStarted(true);

    recordActivity(
      "started"
    );
  };


  /*
   * =========================================
   * COPY REVIEW
   * =========================================
   */

  const handleCopyReview =
    async () => {
      if (!generatedReview) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          generatedReview
        );

        setCopied(true);

        await recordActivity(
          "copied",
          {
            answers:
              reviewQuestions.map(
                (question) => ({
                  questionId:
                    question.id,

                  question:
                    question.question,

                  answer:
                    answers[
                      question.id
                    ],
                })
              ),

            generatedReview:
              generatedReview,
          }
        );

        setTimeout(() => {
          setCopied(false);
        }, 2000);

      } catch (error) {
        console.error(
          "Failed to copy review:",
          error
        );

        /*
         * Clipboard fallback.
         */

        try {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            generatedReview;

          textarea.style.position =
            "fixed";

          textarea.style.opacity =
            "0";

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            "copy"
          );

          document.body.removeChild(
            textarea
          );

          setCopied(true);

          await recordActivity(
            "copied",
            {
              answers:
                reviewQuestions.map(
                  (question) => ({
                    questionId:
                      question.id,

                    question:
                      question.question,

                    answer:
                      answers[
                        question.id
                      ],
                  })
                ),

              generatedReview:
                generatedReview,
            }
          );

          setTimeout(() => {
            setCopied(false);
          }, 2000);

        } catch (fallbackError) {
          console.error(
            "Copy failed:",
            fallbackError
          );
        }
      }
    };


  /*
   * =========================================
   * OPEN GOOGLE REVIEW
   * =========================================
   */

  const handleOpenGoogleReview =
    async () => {
      const googleReviewUrl =
        business?.googleReviewUrl?.trim();

      /*
       * Check that a URL exists.
       */

      if (!googleReviewUrl) {
        alert(
          "Google Review URL is not configured for this business."
        );

        return;
      }


      /*
       * Only allow real external
       * HTTP/HTTPS URLs.
       */

      let validUrl;

      try {
        validUrl =
          new URL(
            googleReviewUrl
          );

        if (
          validUrl.protocol !==
            "http:" &&
          validUrl.protocol !==
            "https:"
        ) {
          throw new Error(
            "Invalid protocol"
          );
        }

      } catch {
        alert(
          "The Google Review URL is invalid. Please configure the full Google Review URL starting with https://"
        );

        return;
      }


      /*
       * Record Google Review
       * opened.
       */

      await recordActivity(
        "google_opened",
        {
          answers:
            reviewQuestions.map(
              (question) => ({
                questionId:
                  question.id,

                question:
                  question.question,

                answer:
                  answers[
                    question.id
                  ],
              })
            ),

          generatedReview:
            generatedReview,
        }
      );


      /*
       * Open Google Review page.
       */

      window.open(
        validUrl.href,
        "_blank",
        "noopener,noreferrer"
      );
    };


  /*
   * =========================================
   * REGENERATE
   * =========================================
   */

  const handleRegenerate =
    () => {
      const review =
        generateReview();

      setGeneratedReview(
        review
      );

      setCopied(false);
    };


  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-loading">
          <div className="review-spinner" />

          <p>
            Loading review experience...
          </p>
        </div>
      </div>
    );
  }


  /*
   * =========================================
   * ERROR
   * =========================================
   */

  if (error) {
    return (
      <div className="review-page">
        <div className="review-error-page">
          <div className="review-error-icon">
            !
          </div>

          <h1>
            Review page unavailable
          </h1>

          <p>
            {error}
          </p>

          <span>
            Please check the QR code and
            try again.
          </span>
        </div>
      </div>
    );
  }


  /*
   * =========================================
   * BUSINESS NOT FOUND
   * =========================================
   */

  if (!business) {
    return (
      <div className="review-page">
        <div className="review-error-page">
          <div className="review-error-icon">
            !
          </div>

          <h1>
            Business not found
          </h1>

          <p>
            We couldn't find this business.
          </p>
        </div>
      </div>
    );
  }


  /*
   * =========================================
   * NO QUESTIONS
   * =========================================
   */

  if (
    reviewQuestions.length ===
    0
  ) {
    return (
      <div className="review-page">
        <div className="review-error-page">
          <div className="review-error-icon">
            !
          </div>

          <h1>
            Review unavailable
          </h1>

          <p>
            No review questions are
            currently configured for this
            business.
          </p>
        </div>
      </div>
    );
  }


  /*
   * =========================================
   * GENERATED REVIEW SCREEN
   * =========================================
   */

  if (reviewGenerated) {
    return (
      <div className="review-page">
        <div className="review-container review-result-container">
          <div className="review-topbar review-result-topbar">
            <div className="review-brand">
              <div className="review-brand-icon">
                <Icon name="qr" size={19} />
              </div>
              <span>ReviewQR</span>
            </div>
          </div>

          <section className="review-result-card" aria-labelledby="review-result-title">
            <img
              className="review-result-illustration"
              src="/review.png"
              alt="Illustration of a review document and pen"
            />

            <h1 id="review-result-title">Your review is ready!</h1>
            <p className="review-result-description">
              Based on your answers, we've created
              <br className="review-result-desktop-break" /> this review for you.
            </p>

            <div className="review-result-business">
              <div className="review-result-business-icon">
                <Icon name="business" size={17} />
              </div>
              <div>
                <strong>{business.name}</strong>
                <span>{business.category}</span>
              </div>
            </div>

            <div className="review-overall-rating" aria-label={`Overall rating ${overallRating.toFixed(1)} out of 5`}>
              <span className="review-rating-title">Overall Rating</span>
              <div className="review-rating-stars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= filledRatingStars ? "review-rating-star is-filled" : "review-rating-star"}>★</span>
                ))}
                <span className="review-rating-sparkle" aria-hidden="true">✦</span>
              </div>
              <strong className="review-rating-value">{overallRating.toFixed(1)} / 5</strong>
            </div>

            <div className="review-text-wrapper">
              <div className="review-text-header">
                <span>Generated Review</span>
                <span className="review-editable-label">Editable</span>
              </div>
              <textarea
                className="generated-review-text"
                value={generatedReview}
                onChange={(event) => setGeneratedReview(event.target.value)}
                aria-label="Edit generated review"
              />
            </div>

            <div className="review-result-actions">
              <button type="button" className="review-copy-button" onClick={handleCopyReview}>
                <Icon name="review" size={16} />
                {copied ? "Copied!" : "Copy Review"}
              </button>
              <button type="button" className="review-google-button" onClick={handleOpenGoogleReview}>
                Open Google Review
                <Icon name="arrow" size={16} />
              </button>
            </div>

            <button type="button" className="review-regenerate-button" onClick={handleRegenerate}>
              Generate Again
            </button>
          </section>
        </div>
      </div>
    );
  }

  /*
   * =========================================
   * WELCOME SCREEN
   * =========================================
   */

  if (!started) {
    return (
      <div className="review-page">
        <div className="review-container">

          <div className="review-brand">

            <div className="review-brand-icon">
              <Icon
                name="qr"
                size={21}
              />
            </div>

            <span>
              ReviewQR
            </span>

          </div>


          <div className="review-welcome-card">

            <div className="review-welcome-icon">
              <Icon
                name="review"
                size={30}
              />
              <span className="review-welcome-sparkle" aria-hidden="true">✨</span>
            </div>

            <span className="review-eyebrow">
              SHARE YOUR EXPERIENCE
            </span>


            <h1>
              How was your experience
              with{" "}
              <strong>
                {business.name}
              </strong>
              ?
            </h1>


            <p>
              Answer a few quick questions
              and we'll help you create your
              review.
            </p>


            <div className="review-business-chip">

              <div className="review-business-chip-icon">
                <Icon
                  name="business"
                  size={17}
                />
              </div>

              <div>

                <strong>
                  {business.name}
                </strong>

                <span>
                  {business.category}
                </span>

              </div>

            </div>


            <div className="review-time-info">

              <span>
                <Icon
                  name="questions"
                  size={15}
                />

                {reviewQuestions.length}{" "}
                questions
              </span>

              <span>
                •
              </span>

              <span>
                Takes about 1 minute
              </span>

            </div>


            <button
              type="button"
              className="review-start-button"
              onClick={
                handleStart
              }
            >
              Start Review

              <Icon
                name="arrow"
                size={17}
              />
            </button>

          </div>


          <p className="review-footer-text">
            Your answers help create a review
            based on your actual experience.
          </p>

        </div>
      </div>
    );
  }


  /*
   * =========================================
   * QUESTION SCREEN
   * =========================================
   */

  const question =
    reviewQuestions[
      currentQuestion
    ];

  const selectedAnswer =
    answers[question.id];

  const progress =
    ((currentQuestion + 1) /
      reviewQuestions.length) *
    100;


  return (
    <div className="review-page">

      <div className="review-container review-question-container">

        <div className="review-topbar">

          <div className="review-brand">

            <div className="review-brand-icon">
              <Icon
                name="qr"
                size={19}
              />
            </div>

            <span>
              ReviewQR
            </span>

          </div>


          <span className="review-business-name">
            {business.name}
          </span>

        </div>


        <div className="review-progress-section">

          <div className="review-progress-top">

            <span>
              Question{" "}
              {currentQuestion + 1}{" "}
              of{" "}
              {reviewQuestions.length}
            </span>

            <strong>
              {Math.round(progress)}%
            </strong>

          </div>


          <div className="review-progress-bar">

            <div
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>


        <div className="review-question-card">

          <span className="review-question-label">
            QUESTION{" "}
            {String(
              currentQuestion + 1
            ).padStart(2, "0")}
          </span>


          <h1>
            {question.question}
          </h1>


          <p className="review-question-help">
            Select the option that best
            describes your experience.
          </p>


          <div className="review-options">

            {question.options.map(
              (option, optionIndex) => {
                const selected =
                  selectedAnswer ===
                  option;

                return (
                  <button
                    type="button"
                    key={option}
                    className={`review-option ${
                      selected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleAnswer(
                        option
                      )
                    }
                  >

                    <span className="review-option-emoji" aria-hidden="true">
                      {getOptionEmoji(option, optionIndex, question.options.length)}
                    </span>

                    <span className="review-option-text">
                      {option}
                    </span>

                    <span className="review-option-radio" aria-hidden="true">
                      {selected && <span />}
                    </span>


                    {selected && (
                      <Icon
                        name="arrow"
                        size={15}
                      />
                    )}

                  </button>
                );
              }
            )}

          </div>

        </div>


        <div className="review-navigation">

          <button
            type="button"
            className="review-back-button"
            onClick={
              handlePrevious
            }
            disabled={
              currentQuestion === 0
            }
          >

            <Icon
              name="arrow"
              size={15}
            />

            Back

          </button>


          <button
            type="button"
            className="review-next-button"
            onClick={
              handleNext
            }
            disabled={
              !selectedAnswer
            }
          >

            {currentQuestion ===
            reviewQuestions.length -
              1
              ? "Generate Review"
              : "Next"}

            <Icon
              name="arrow"
              size={16}
            />

          </button>

        </div>


        <p className="review-question-footer">
          Your responses are used to create
          a review based on your experience.
        </p>

      </div>

    </div>
  );
};


export default Review;