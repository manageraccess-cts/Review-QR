import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import Icon from "../../../components/Icon";
import { useBusiness } from "../../../context/BusinessContext";
import { useQuestion } from "../../../context/QuestionContext";

import "./CreateBusiness.css";

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

  const [formData, setFormData] =
    useState({
      name: "",
      category: "",
      phone: "",
      address: "",
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

  /* =========================================
     CATEGORY QUESTIONS
  ========================================= */

  const categoryQuestions =
    useMemo(() => {
      if (!formData.category) {
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

  /* =========================================
     FORM CHANGE
  ========================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setErrors(
      (current) => ({
        ...current,
        [name]: "",
      })
    );

    if (
      name === "category"
    ) {
      setFormData(
        (current) => ({
          ...current,
          category: value,
          selectedQuestions: [],
        })
      );
    }
  };

  /* =========================================
     QUESTION SELECTION
  ========================================= */

  const toggleQuestion = (
    questionId
  ) => {
    setFormData(
      (current) => {
        const selected =
          current.selectedQuestions;

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

    setErrors(
      (current) => ({
        ...current,
        questions: "",
      })
    );
  };

  /* =========================================
     STEP 1 VALIDATION
  ========================================= */

  const validateBusinessDetails =
    () => {
      const newErrors = {};

      if (
        !formData.name.trim()
      ) {
        newErrors.name =
          "Business name is required.";
      }

      if (
        !formData.category
      ) {
        newErrors.category =
          "Please select a category.";
      }

      if (
        !formData.phone.trim()
      ) {
        newErrors.phone =
          "Phone number is required.";
      }

      if (
        !formData.address.trim()
      ) {
        newErrors.address =
          "Business address is required.";
      }

      if (
        !formData.googleReviewUrl.trim()
      ) {
        newErrors.googleReviewUrl =
          "Google Review URL is required.";
      }

      setErrors(
        newErrors
      );

      return (
        Object.keys(
          newErrors
        ).length === 0
      );
    };

  /* =========================================
     NEXT STEP
  ========================================= */

  const handleContinue =
    () => {
      if (
        step === 1
      ) {
        if (
          !validateBusinessDetails()
        ) {
          return;
        }

        setErrors({});
        setStep(2);
        return;
      }

      if (
        step === 2
      ) {
        if (
          formData
            .selectedQuestions
            .length !== 6
        ) {
          setErrors({
            questions:
              "Please select exactly 6 questions.",
          });

          return;
        }

        setErrors({});
        setStep(3);
      }
    };

  /* =========================================
     GO BACK
  ========================================= */

  const handleBack =
    () => {
      if (step === 1) {
        onNavigate(
          "businesses"
        );

        return;
      }

      setErrors({});

      setStep(
        (current) =>
          current - 1
      );
    };

  /* =========================================
     CREATE BUSINESS + GENERATE QR
  ========================================= */

  const handleGenerateQR =
    async () => {
      if (
        formData
          .selectedQuestions
          .length !== 6
      ) {
        setErrors({
          questions:
            "Please select exactly 6 questions.",
        });

        return;
      }

      setErrors({});

      setIsGeneratingQR(true);
      setQrGenerated(false);

      try {
        /*
          IMPORTANT:

          addBusiness() is asynchronous because
          it sends the business to the Express
          backend.

          We must await it so that we receive
          the actual backend-generated business ID.
        */

        const business =
          await addBusiness({
            name:
              formData.name.trim(),

            category:
              formData.category,

            phone:
              formData.phone.trim(),

            address:
              formData.address.trim(),

            googleReviewUrl:
              formData.googleReviewUrl.trim(),

            selectedQuestions:
              formData.selectedQuestions,

            status:
              "Active",

            qrStatus:
              "Generating",

            reviewsGenerated:
              0,
          });

        /*
          Store the actual business returned
          from the backend.

          Example:
          BUS_000005
        */

        setCreatedBusiness(
          business
        );

        /*
          Keep the same QR generation
          animation from the original UI.
        */

        setTimeout(
          async () => {
            try {
              /*
                Update backend QR status after
                the QR generation animation.
              */

              const generatedBusiness =
                await updateBusiness(
                  business.id,
                  {
                    qrStatus:
                      "Generated",
                  }
                );

              /*
                Keep the latest backend data.
              */

              setCreatedBusiness(
                generatedBusiness
              );

              setIsGeneratingQR(
                false
              );

              setQrGenerated(
                true
              );
            } catch (error) {
              console.error(
                "Failed to update QR status:",
                error
              );

              /*
                Even if the QR status update
                fails, the business itself was
                already created.
              */

              setIsGeneratingQR(
                false
              );

              setQrGenerated(
                true
              );
            }
          },
          2200
        );
      } catch (error) {
        console.error(
          "Failed to create business:",
          error
        );

        setIsGeneratingQR(false);

        setErrors({
          submit:
            error.message ||
            "Failed to create business. Please try again.",
        });
      }
    };

  /* =========================================
     QR URL
  ========================================= */

  const qrUrl =
    createdBusiness
      ? `${window.location.origin}/r/${createdBusiness.id}`
      : "";

  /* =========================================
     COPY QR URL
  ========================================= */

  const copyQrUrl =
    async () => {
      if (!qrUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          qrUrl
        );
      } catch (error) {
        console.error(
          "Unable to copy QR URL:",
          error
        );
      }
    };

  /* =========================================
     DOWNLOAD QR
  ========================================= */

  const downloadQR =
    () => {
      const svg =
        document.getElementById(
          "reviewqr-generated"
        );

      if (!svg) {
        return;
      }

      const serializer =
        new XMLSerializer();

      const source =
        serializer.serializeToString(
          svg
        );

      const blob =
        new Blob(
          [source],
          {
            type: "image/svg+xml;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download = `${createdBusiness?.name || "business"}-review-qr.svg`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );
    };

  /* =========================================
     QR GENERATION SCREEN
  ========================================= */

  if (
    isGeneratingQR
  ) {
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

  /* =========================================
     QR SUCCESS SCREEN
  ========================================= */

  if (qrGenerated && createdBusiness) {
    return (
      <div className="create-business-page">
        <section className="qr-success-page qr-premium-success">
          <div className="qr-premium-decoration" aria-hidden="true">
            <span className="qr-decoration-orb qr-orb-one" />
            <span className="qr-decoration-orb qr-orb-two" />
            <span className="qr-decoration-orb qr-orb-three" />
            <div className="qr-decoration-mark"><Icon name="qr" size={48} /></div>
          </div>

          <header className="qr-success-header qr-premium-header">
            <div className="qr-success-copy">
              <span className="qr-success-eyebrow">
                <span className="qr-success-check"><Icon name="check" size={16} /></span>
                QR CODE GENERATED
              </span>
              <h1>Your Review QR is <span>Ready!</span></h1>
              <p>Customers can now scan this QR code to create their review for <strong>{createdBusiness.name}</strong>.</p>
            </div>
          </header>

          <div className="qr-success-content qr-premium-content">
            <div className="qr-preview-card qr-premium-preview">
              <div className="qr-preview-glow" />
              <span className="qr-preview-orbit qr-orbit-a" />
              <span className="qr-preview-orbit qr-orbit-b" />
              <span className="qr-preview-dot qr-dot-a" />
              <span className="qr-preview-dot qr-dot-b" />
              <div className="qr-code-wrapper qr-premium-code">
                <QRCodeSVG id="reviewqr-generated" value={qrUrl} size={230} bgColor="#ffffff" fgColor="#17233e" level="H" includeMargin />
              </div>
              <div className="qr-code-label qr-premium-label">
                <Icon name="qr" size={16} />
                Scan to write a review
              </div>
            </div>

            <div className="qr-details-card qr-premium-details">
              <div className="qr-premium-detail-title">
                <div className="qr-premium-business-icon"><Icon name="building" size={25} /></div>
                <div className="qr-premium-business-copy">
                  <h2>Business Details</h2>
                  <p>Here are the details for your business review setup.</p>
                </div>
                <span className="qr-premium-status"><i />Active</span>
              </div>

              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon"><Icon name="building" size={17} /></span>
                <span>Business</span><strong>{createdBusiness.name}</strong>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon"><Icon name="hash" size={17} /></span>
                <span>Business ID</span><strong>{createdBusiness.id}</strong>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon"><Icon name="tag" size={17} /></span>
                <span>Category</span><strong>{createdBusiness.category}</strong>
              </div>
              <div className="qr-premium-detail-row">
                <span className="qr-premium-row-icon"><Icon name="questions" size={17} /></span>
                <span>Questions</span><strong>6 / 6</strong>
              </div>
              <div className="qr-premium-url">
                <div className="qr-premium-url-label"><span className="qr-premium-row-icon"><Icon name="link" size={17} /></span><span>Review URL</span></div>
                <div className="qr-premium-url-controls">
                  <input type="text" value={qrUrl} readOnly aria-label="Review URL" />
                  <button type="button" onClick={copyQrUrl}><Icon name="copy" size={15} />Copy</button>
                </div>
              </div>
              <div className="qr-success-actions qr-premium-actions">
                <button type="button" className="qr-download-button" onClick={downloadQR}>
                  <Icon name="download" size={17} />Download QR
                </button>
                <button type="button" className="qr-business-button" onClick={() => onNavigate("businesses")}>
                  View Business<Icon name="arrow" size={17} />
                </button>
              </div>
            </div>
          </div>

          <aside className="qr-success-note qr-premium-note">
            <div className="qr-note-icon"><Icon name="lightbulb" size={23} /></div>
            <div><strong>What's Next?</strong><span>Share this QR code at your store, on your bills, or on social media. Customers will be redirected to your Google review page after completing the questions.</span></div>
          </aside>
        </section>
      </div>
    );
  }

  /* =========================================
     NORMAL CREATE BUSINESS FLOW
  ========================================= */

  return (
    <div className="create-business-page">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="create-business-header">
        <button
          type="button"
          className="create-back-button"
          onClick={
            handleBack
          }
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
          Configure a business and create
          its review QR experience.
        </p>
      </div>

      {/* =========================================
          STEPPER
      ========================================= */}

      <div className="create-stepper">
        <div
          className={`create-step ${
            step >= 1
              ? "active"
              : ""
          } ${
            step > 1
              ? "completed"
              : ""
          }`}
        >
          <div className="create-step-number">
            {step > 1 ? (
              "✓"
            ) : (
              "1"
            )}
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
          className={`create-step ${
            step >= 2
              ? "active"
              : ""
          } ${
            step > 2
              ? "completed"
              : ""
          }`}
        >
          <div className="create-step-number">
            {step > 2 ? (
              "✓"
            ) : (
              "2"
            )}
          </div>

          <div>
            <strong>
              Select Questions
            </strong>

            <span>
              Choose 6 questions
            </span>
          </div>
        </div>

        <div className="create-step-line" />

        <div
          className={`create-step ${
            step >= 3
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

      {/* =========================================
          STEP 1
      ========================================= */}

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
                Enter the basic details of
                the business.
              </p>
            </div>
          </div>

          <div className="create-form">
            <div className="create-form-grid">
              <div className="create-field">
                <label>
                  Business Name
                  <span>*</span>
                </label>

                <input
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

                <select
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  <option value="PG">
                    PG
                  </option>

                  <option value="Packers & Movers">
                    Packers & Movers
                  </option>

                  <option value="Glass">
                    Glass
                  </option>
                </select>

                {errors.category && (
                  <small>
                    {
                      errors.category
                    }
                  </small>
                )}
              </div>

              <div className="create-field">
                <label>
                  Phone Number
                  <span>*</span>
                </label>

                <input
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter phone number"
                />

                {errors.phone && (
                  <small>
                    {errors.phone}
                  </small>
                )}
              </div>

              <div className="create-field create-field-full">
                <label>
                  Business Address
                  <span>*</span>
                </label>

                <textarea
                  name="address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter complete business address"
                  rows="3"
                />

                {errors.address && (
                  <small>
                    {
                      errors.address
                    }
                  </small>
                )}
              </div>

              <div className="create-field create-field-full">
                <label>
                  Google Review URL
                  <span>*</span>
                </label>

                <input
                  name="googleReviewUrl"
                  value={
                    formData.googleReviewUrl
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="https://g.page/r/..."
                />

                <span className="create-field-help">
                  Customers will be redirected
                  to this Google review page
                  after generating their
                  review.
                </span>

                {errors.googleReviewUrl && (
                  <small>
                    {
                      errors.googleReviewUrl
                    }
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="create-card-footer">
            <button
              type="button"
              className="create-cancel-button"
              onClick={() =>
                onNavigate(
                  "businesses"
                )
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="create-primary-button"
              onClick={
                handleContinue
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

      {/* =========================================
          STEP 2
      ========================================= */}

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
                Select Questions
              </h2>

              <p>
                Select exactly 6 questions
                for this business.
              </p>
            </div>

            <div className="selected-question-count">
              {
                formData
                  .selectedQuestions
                  .length
              }{" "}
              / 6
            </div>
          </div>

          <div className="create-question-area">
            {categoryQuestions.length >
            0 ? (
              <div className="create-question-grid">
                {categoryQuestions.map(
                  (
                    question,
                    index
                  ) => {
                    const selected =
                      formData.selectedQuestions.includes(
                        question.id
                      );

                    return (
                      <button
                        type="button"
                        key={
                          question.id
                        }
                        className={`create-question-option ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleQuestion(
                            question.id
                          )
                        }
                      >
                        <span className="question-option-number">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="question-option-text">
                          {
                            question.question
                          }
                        </span>

                        <span
                          className={`question-option-check ${
                            selected
                              ? "checked"
                              : ""
                          }`}
                        >
                          {selected
                            ? "✓"
                            : ""}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="create-no-questions">
                <Icon
                  name="questions"
                  size={30}
                />

                <strong>
                  No questions available
                </strong>

                <span>
                  Add active questions for
                  this category first.
                </span>
              </div>
            )}

            {errors.questions && (
              <div className="create-question-error">
                {errors.questions}
              </div>
            )}
          </div>

          <div className="create-card-footer">
            <button
              type="button"
              className="create-cancel-button"
              onClick={
                handleBack
              }
            >
              Back
            </button>

            <button
              type="button"
              className="create-primary-button"
              onClick={
                handleContinue
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

      {/* =========================================
          STEP 3
      ========================================= */}

      {step === 3 && (
        <section className="create-business-card review-create-card">
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
                Review the configuration
                before generating the QR.
              </p>
            </div>
          </div>

          <div className="review-summary">
            <div className="review-summary-top">
              <div>
                <span>
                  BUSINESS
                </span>

                <strong>
                  {formData.name}
                </strong>
              </div>

              <div>
                <span>
                  CATEGORY
                </span>

                <strong>
                  {
                    formData.category
                  }
                </strong>
              </div>

              <div>
                <span>
                  QUESTIONS
                </span>

                <strong>
                  6 / 6
                </strong>
              </div>

              <div>
                <span>
                  STATUS
                </span>

                <strong className="review-active-status">
                  <span />
                  Ready
                </strong>
              </div>
            </div>

            <div className="review-business-info">
              <h3>
                Business Information
              </h3>

              <div className="review-info-grid">
                <div>
                  <span>
                    Business Name
                  </span>

                  <strong>
                    {formData.name}
                  </strong>
                </div>

                <div>
                  <span>
                    Category
                  </span>

                  <strong>
                    {
                      formData.category
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Phone Number
                  </span>

                  <strong>
                    {formData.phone}
                  </strong>
                </div>

                <div>
                  <span>
                    Google Review URL
                  </span>

                  <strong>
                    {
                      formData.googleReviewUrl
                    }
                  </strong>
                </div>

                <div className="review-info-full">
                  <span>
                    Address
                  </span>

                  <strong>
                    {formData.address}
                  </strong>
                </div>
              </div>
            </div>

            <div className="review-selected-questions">
              <div className="review-selected-header">
                <div>
                  <h3>
                    Selected Questions
                  </h3>

                  <p>
                    These 6 questions will
                    be used for this business.
                  </p>
                </div>

                <span>
                  6 / 6
                </span>
              </div>

              <div className="review-question-grid">
                {formData.selectedQuestions.map(
                  (
                    questionId,
                    index
                  ) => {
                    const question =
                      questions.find(
                        (item) =>
                          item.id ===
                          questionId
                      );

                    return (
                      <div
                        className="review-question"
                        key={
                          questionId
                        }
                      >
                        <span>
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <p>
                          {
                            question?.question
                          }
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
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
              onClick={
                handleBack
              }
            >
              Back
            </button>

            <button
              type="button"
              className="generate-qr-button"
              onClick={
                handleGenerateQR
              }
              disabled={
                isGeneratingQR
              }
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
    </div>
  );
};

export default CreateBusiness;