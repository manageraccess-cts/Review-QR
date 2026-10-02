import { useMemo, useState } from "react";

import Icon from "../../components/Icon";
import StatusBadge from "../../components/StatusBadge";
import { useQuestions } from "../../context/QuestionContext";

import "./Questions.css";

/* =========================================
   SMALL INLINE ICON
========================================= */

const SmallIcon = ({
  name,
  size = 18,
}) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "filter":
      return (
        <svg {...commonProps}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );

    case "reset":
      return (
        <svg {...commonProps}>
          <path d="M20 11a8 8 0 0 0-14.9-4" />
          <path d="M4 4v5h5" />
          <path d="M4 13a8 8 0 0 0 14.9 4" />
          <path d="M20 20v-5h-5" />
        </svg>
      );

    case "edit":
      return (
        <svg {...commonProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );

    case "trash":
      return (
        <svg {...commonProps}>
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M6 7l1 14h10l1-14" />
          <path d="M9 7V4h6v3" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...commonProps}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      );

    case "left":
      return (
        <svg {...commonProps}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );

    case "right":
      return (
        <svg {...commonProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "sort":
      return (
        <svg {...commonProps}>
          <path d="m8 7 3-3 3 3" />
          <path d="M11 4v8" />
          <path d="m16 17-3 3-3-3" />
          <path d="M13 20v-8" />
        </svg>
      );

    case "check":
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    default:
      return null;
  }
};

/* =========================================
   EMPTY FORM
========================================= */

const EMPTY_FORM = {
  category: "",
  text: "",
  options: ["", "", "", ""],
};

/* =========================================
   QUESTIONS PAGE
========================================= */

const Questions = () => {
  const {
    questions,
    categories,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestionStatus,
  } = useQuestions();

  /* =========================================
     FILTER STATE
  ========================================= */

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  /* =========================================
     PAGINATION
  ========================================= */

  const [currentPage, setCurrentPage] =
    useState(1);

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  /* =========================================
     MODAL
  ========================================= */

  const [showModal, setShowModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState("add");

  const [editingQuestion, setEditingQuestion] =
    useState(null);

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [formError, setFormError] =
    useState("");

  /* =========================================
     DELETE
  ========================================= */

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  /* =========================================
     SELECTED ROWS
  ========================================= */

  const [selectedRows, setSelectedRows] =
    useState([]);

  /* =========================================
     BUILD CATEGORY LIST
  ========================================= */

  const allCategories = useMemo(() => {
    const categorySet = new Set();

    questions.forEach((question) => {
      if (question.category) {
        categorySet.add(
          question.category
        );
      }
    });

    categories.forEach((category) => {
      if (category) {
        categorySet.add(category);
      }
    });

    return Array.from(categorySet).sort(
      (a, b) =>
        a.localeCompare(b)
    );
  }, [questions, categories]);

  /* =========================================
     STATS
  ========================================= */

  const totalQuestions =
    questions.length;

  const activeQuestions =
    questions.filter(
      (question) =>
        question.status === "Active"
    ).length;

  const inactiveQuestions =
    questions.filter(
      (question) =>
        question.status === "Inactive"
    ).length;

  const categoryCount =
    allCategories.length;

  /* =========================================
     FILTER QUESTIONS
  ========================================= */

  const filteredQuestions = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return questions.filter(
      (question) => {
        const matchesSearch =
          !searchValue ||
          question.id
            .toLowerCase()
            .includes(searchValue) ||
          question.text
            .toLowerCase()
            .includes(searchValue) ||
          question.category
            .toLowerCase()
            .includes(searchValue) ||
          question.options.some(
            (option) =>
              option
                .toLowerCase()
                .includes(searchValue)
          );

        const matchesCategory =
          categoryFilter === "All" ||
          question.category ===
            categoryFilter;

        const matchesStatus =
          statusFilter === "All" ||
          question.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus
        );
      }
    );
  }, [
    questions,
    search,
    categoryFilter,
    statusFilter,
  ]);

  /* =========================================
     PAGINATION CALCULATION
  ========================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredQuestions.length /
        rowsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    rowsPerPage;

  const endIndex =
    startIndex + rowsPerPage;

  const paginatedQuestions =
    filteredQuestions.slice(
      startIndex,
      endIndex
    );

  /* =========================================
     RESET PAGE WHEN FILTER CHANGES
  ========================================= */

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (
    value
  ) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (
    value
  ) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  /* =========================================
     RESET FILTERS
  ========================================= */

  const handleReset = () => {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
    setSelectedRows([]);
  };

  /* =========================================
     OPEN ADD
  ========================================= */

  const openAddModal = () => {
    setModalMode("add");
    setEditingQuestion(null);

    setFormData({
      category:
        categoryFilter !== "All"
          ? categoryFilter
          : allCategories[0] || "",
      text: "",
      options: [
        "",
        "",
        "",
        "",
      ],
    });

    setFormError("");
    setShowModal(true);
  };

  /* =========================================
     OPEN EDIT
  ========================================= */

  const openEditModal = (question) => {
    setModalMode("edit");
    setEditingQuestion(question);

    const existingOptions =
      question.options || [];

    const paddedOptions = [
      ...existingOptions,
    ];

    while (
      paddedOptions.length < 2
    ) {
      paddedOptions.push("");
    }

    setFormData({
      category:
        question.category,
      text: question.text,
      options:
        paddedOptions.slice(0, 6),
    });

    setFormError("");
    setShowModal(true);
  };

  /* =========================================
     CLOSE MODAL
  ========================================= */

  const closeModal = () => {
    setShowModal(false);
    setModalMode("add");
    setEditingQuestion(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  /* =========================================
     FORM CHANGE
  ========================================= */

  const handleFormChange = (
    field,
    value
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError("");
  };

  /* =========================================
     OPTION CHANGE
  ========================================= */

  const handleOptionChange = (
    index,
    value
  ) => {
    setFormData((current) => {
      const updated = [
        ...current.options,
      ];

      updated[index] = value;

      return {
        ...current,
        options: updated,
      };
    });

    setFormError("");
  };

  /* =========================================
     ADD OPTION
  ========================================= */

  const handleAddOption = () => {
    if (
      formData.options.length >= 6
    ) {
      return;
    }

    setFormData((current) => ({
      ...current,
      options: [
        ...current.options,
        "",
      ],
    }));
  };

  /* =========================================
     REMOVE OPTION
  ========================================= */

  const handleRemoveOption = (
    index
  ) => {
    if (
      formData.options.length <= 2
    ) {
      return;
    }

    setFormData((current) => ({
      ...current,
      options:
        current.options.filter(
          (_, optionIndex) =>
            optionIndex !== index
        ),
    }));
  };

  /* =========================================
     SAVE QUESTION
  ========================================= */

  const handleSaveQuestion = () => {
    const text =
      formData.text.trim();

    const cleanedOptions =
      formData.options
        .map((option) =>
          option.trim()
        )
        .filter(Boolean);

    if (!formData.category) {
      setFormError(
        "Please select a category."
      );
      return;
    }

    if (!text) {
      setFormError(
        "Please enter a question."
      );
      return;
    }

    if (
      cleanedOptions.length < 2
    ) {
      setFormError(
        "Please add at least 2 options."
      );
      return;
    }

    const uniqueOptions =
      new Set(
        cleanedOptions.map(
          (option) =>
            option.toLowerCase()
        )
      );

    if (
      uniqueOptions.size !==
      cleanedOptions.length
    ) {
      setFormError(
        "Answer options must be unique."
      );
      return;
    }

    if (modalMode === "add") {
      addQuestion({
        category:
          formData.category,
        text,
        options: cleanedOptions,
      });
    } else if (
      modalMode === "edit" &&
      editingQuestion
    ) {
      updateQuestion(
        editingQuestion.id,
        {
          category:
            formData.category,
          text,
          options: cleanedOptions,
        }
      );
    }

    closeModal();
  };

  /* =========================================
     DELETE
  ========================================= */

  const openDeleteModal = (
    question
  ) => {
    setDeleteTarget(question);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    deleteQuestion(
      deleteTarget.id
    );

    setSelectedRows((current) =>
      current.filter(
        (id) =>
          id !== deleteTarget.id
      )
    );

    setDeleteTarget(null);

    if (
      paginatedQuestions.length ===
        1 &&
      safeCurrentPage > 1
    ) {
      setCurrentPage(
        (current) =>
          current - 1
      );
    }
  };

  /* =========================================
     SELECT ONE
  ========================================= */

  const toggleRowSelection = (
    questionId
  ) => {
    setSelectedRows((current) =>
      current.includes(questionId)
        ? current.filter(
            (id) =>
              id !== questionId
          )
        : [
            ...current,
            questionId,
          ]
    );
  };

  /* =========================================
     SELECT ALL CURRENT PAGE
  ========================================= */

  const currentPageIds =
    paginatedQuestions.map(
      (question) => question.id
    );

  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) =>
      selectedRows.includes(id)
    );

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedRows((current) =>
        current.filter(
          (id) =>
            !currentPageIds.includes(
              id
            )
        )
      );
    } else {
      setSelectedRows((current) => [
        ...new Set([
          ...current,
          ...currentPageIds,
        ]),
      ]);
    }
  };

  /* =========================================
     CATEGORY COLOR
  ========================================= */

  const getCategoryClass = (
    category
  ) => {
    const categoryName =
      category
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        );

    const knownClasses = [
      "pg",
      "packers-movers",
      "glass",
      "electrical",
      "plumbing",
      "carpentry",
      "painting",
    ];

    if (
      knownClasses.includes(
        categoryName
      )
    ) {
      return `category-${categoryName}`;
    }

    const colors = [
      "category-blue",
      "category-purple",
      "category-orange",
      "category-teal",
      "category-pink",
    ];

    let hash = 0;

    for (
      let index = 0;
      index < category.length;
      index += 1
    ) {
      hash =
        category.charCodeAt(index) +
        ((hash << 5) - hash);
    }

    return colors[
      Math.abs(hash) %
        colors.length
    ];
  };

  /* =========================================
     PAGINATION ITEMS
  ========================================= */

  const paginationItems =
    useMemo(() => {
      const items = [];

      if (totalPages <= 7) {
        for (
          let page = 1;
          page <= totalPages;
          page += 1
        ) {
          items.push(page);
        }

        return items;
      }

      items.push(1);

      if (safeCurrentPage > 4) {
        items.push("...");
      }

      const start = Math.max(
        2,
        safeCurrentPage - 1
      );

      const end = Math.min(
        totalPages - 1,
        safeCurrentPage + 1
      );

      for (
        let page = start;
        page <= end;
        page += 1
      ) {
        items.push(page);
      }

      if (
        safeCurrentPage <
        totalPages - 3
      ) {
        items.push("...");
      }

      items.push(totalPages);

      return items;
    }, [
      totalPages,
      safeCurrentPage,
    ]);

  return (
    <div className="questions-page">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="questions-page-header">
        <div>
          <h1>Questions</h1>

          <p>
            Manage the question bank used
            for business review experiences.
          </p>
        </div>

        <button
          type="button"
          className="add-question-button"
          onClick={openAddModal}
        >
          <Icon
            name="plus"
            size={18}
            strokeWidth={2}
          />

          <span>
            Add Question
          </span>
        </button>
      </div>

      {/* =========================================
          STAT CARDS
      ========================================= */}

      <div className="questions-stats-grid">
        <div className="questions-stat-card">
          <div className="questions-stat-icon stat-blue">
            <Icon
              name="questions"
              size={24}
            />
          </div>

          <div className="questions-stat-content">
            <span>
              Total Questions
            </span>

            <strong>
              {totalQuestions}
            </strong>

            <small>
              Across all categories
            </small>
          </div>
        </div>

        <div className="questions-stat-card">
          <div className="questions-stat-icon stat-green">
            <Icon
              name="review"
              size={24}
            />
          </div>

          <div className="questions-stat-content">
            <span>
              Active Questions
            </span>

            <strong>
              {activeQuestions}
            </strong>

            <small>
              {totalQuestions > 0
                ? (
                    (activeQuestions /
                      totalQuestions) *
                    100
                  ).toFixed(1)
                : 0}
              % of total
            </small>
          </div>
        </div>

        <div className="questions-stat-card">
          <div className="questions-stat-icon stat-red">
            <Icon
              name="settings"
              size={24}
            />
          </div>

          <div className="questions-stat-content">
            <span>
              Inactive Questions
            </span>

            <strong>
              {inactiveQuestions}
            </strong>

            <small>
              {totalQuestions > 0
                ? (
                    (inactiveQuestions /
                      totalQuestions) *
                    100
                  ).toFixed(1)
                : 0}
              % of total
            </small>
          </div>
        </div>

        <div className="questions-stat-card">
          <div className="questions-stat-icon stat-purple">
            <Icon
              name="building"
              size={24}
            />
          </div>

          <div className="questions-stat-content">
            <span>
              Categories
            </span>

            <strong>
              {categoryCount}
            </strong>

            <small>
              Business categories
            </small>
          </div>
        </div>
      </div>

      {/* =========================================
          FILTER + TABLE CARD
      ========================================= */}

      <section className="questions-main-card">
        {/* FILTER BAR */}

        <div className="questions-filter-container">
          <div className="questions-search-box">
            <SmallIcon
              name="search"
              size={19}
            />

            <input
              type="text"
              value={search}
              placeholder="Search question, ID, option or category..."
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() =>
                  handleSearchChange(
                    ""
                  )
                }
              >
                ×
              </button>
            )}
          </div>

          <div className="questions-select-box">
            <SmallIcon
              name="filter"
              size={17}
            />

            <select
              value={
                categoryFilter
              }
              onChange={(event) =>
                handleCategoryChange(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Categories
              </option>

              {allCategories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <SmallIcon
              name="chevron"
              size={15}
            />
          </div>

          <div className="questions-select-box status-select">
            <SmallIcon
              name="filter"
              size={17}
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

            <SmallIcon
              name="chevron"
              size={15}
            />
          </div>

          <button
            type="button"
            className="reset-filter-button"
            onClick={handleReset}
          >
            <SmallIcon
              name="reset"
              size={17}
            />

            <span>
              Reset
            </span>
          </button>
        </div>

        {/* TABLE */}

        <div className="questions-table-wrapper">
          <table className="questions-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <button
                    type="button"
                    className={`table-checkbox ${
                      allCurrentPageSelected
                        ? "checked"
                        : ""
                    }`}
                    onClick={
                      toggleSelectAll
                    }
                    aria-label="Select all"
                  >
                    {allCurrentPageSelected && (
                      <SmallIcon
                        name="check"
                        size={14}
                      />
                    )}
                  </button>
                </th>

                <th>
                  <span className="sortable-heading">
                    ID
                    <SmallIcon
                      name="sort"
                      size={13}
                    />
                  </span>
                </th>

                <th>
                  <span className="sortable-heading">
                    QUESTION
                    <SmallIcon
                      name="sort"
                      size={13}
                    />
                  </span>
                </th>

                <th>
                  <span className="sortable-heading">
                    CATEGORY
                    <SmallIcon
                      name="sort"
                      size={13}
                    />
                  </span>
                </th>

                <th>
                  <span className="sortable-heading">
                    OPTIONS
                    <SmallIcon
                      name="sort"
                      size={13}
                    />
                  </span>
                </th>

                <th>
                  <span className="sortable-heading">
                    STATUS
                    <SmallIcon
                      name="sort"
                      size={13}
                    />
                  </span>
                </th>

                <th>
                  <span className="sortable-heading">
                    UPDATED
                    <SmallIcon
                      name="sort"
                      size={13}
                    />
                  </span>
                </th>

                <th className="actions-column">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedQuestions.length >
              0 ? (
                paginatedQuestions.map(
                  (question) => (
                    <tr
                      key={
                        question.id
                      }
                    >
                      {/* CHECKBOX */}

                      <td>
                        <button
                          type="button"
                          className={`table-checkbox ${
                            selectedRows.includes(
                              question.id
                            )
                              ? "checked"
                              : ""
                          }`}
                          onClick={() =>
                            toggleRowSelection(
                              question.id
                            )
                          }
                        >
                          {selectedRows.includes(
                            question.id
                          ) && (
                            <SmallIcon
                              name="check"
                              size={14}
                            />
                          )}
                        </button>
                      </td>

                      {/* ID */}

                      <td>
                        <span className="question-id-pill">
                          {question.id}
                        </span>
                      </td>

                      {/* QUESTION */}

                      <td>
                        <div className="question-table-text">
                          {
                            question.text
                          }
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        <span
                          className={`category-badge ${getCategoryClass(
                            question.category
                          )}`}
                        >
                          <span className="category-badge-dot" />

                          {
                            question.category
                          }
                        </span>
                      </td>

                      {/* OPTIONS */}

                      <td>
                        <div className="options-cell">
                          <strong>
                            {
                              question
                                .options
                                .length
                            }{" "}
                            options
                          </strong>

                          <span>
                            {question.options
                              .slice(
                                0,
                                4
                              )
                              .join(
                                ", "
                              )}

                            {question
                              .options
                              .length >
                              4 &&
                              "..."}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td>
                        <button
                          type="button"
                          className="status-click-button"
                          onClick={() =>
                            toggleQuestionStatus(
                              question.id
                            )
                          }
                          title="Change status"
                        >
                          <StatusBadge
                            status={
                              question.status
                            }
                          />
                        </button>
                      </td>

                      {/* UPDATED */}

                      <td>
                        <span className="updated-date">
                          {question.updatedAt ||
                            "30 Sep 2026"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-edit-button"
                            onClick={() =>
                              openEditModal(
                                question
                              )
                            }
                            title="Edit question"
                          >
                            <SmallIcon
                              name="edit"
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className="table-delete-button"
                            onClick={() =>
                              openDeleteModal(
                                question
                              )
                            }
                            title="Delete question"
                          >
                            <SmallIcon
                              name="trash"
                              size={17}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="questions-empty-row"
                  >
                    <div>
                      <Icon
                        name="questions"
                        size={32}
                      />

                      <strong>
                        No questions found
                      </strong>

                      <span>
                        Try changing your
                        search or filters.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================
            TABLE FOOTER
        ========================================= */}

        <div className="questions-table-footer">
          <div className="rows-per-page">
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(
                  Number(
                    event.target.value
                  )
                );
                setCurrentPage(1);
              }}
            >
              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={30}>
                30
              </option>

              <option value={50}>
                50
              </option>
            </select>

            <SmallIcon
              name="chevron"
              size={13}
            />
          </div>

          <span className="showing-text">
            Showing{" "}
            {filteredQuestions.length ===
            0
              ? 0
              : startIndex + 1}{" "}
            to{" "}
            {Math.min(
              endIndex,
              filteredQuestions.length
            )}{" "}
            of{" "}
            {filteredQuestions.length}{" "}
            questions
          </span>

          <div className="pagination">
            <button
              type="button"
              disabled={
                safeCurrentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
            >
              <SmallIcon
                name="left"
                size={16}
              />
            </button>

            {paginationItems.map(
              (item, index) =>
                item === "..." ? (
                  <span
                    className="pagination-dots"
                    key={`dots-${index}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    type="button"
                    key={item}
                    className={
                      item ===
                      safeCurrentPage
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setCurrentPage(
                        item
                      )
                    }
                  >
                    {item}
                  </button>
                )
            )}

            <button
              type="button"
              disabled={
                safeCurrentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
            >
              <SmallIcon
                name="right"
                size={16}
              />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================
          ADD / EDIT MODAL
      ========================================= */}

      {showModal && (
        <div
          className="questions-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="questions-modal">
            <div className="questions-modal-header">
              <div>
                <h2>
                  {modalMode === "add"
                    ? "Add Question"
                    : "Edit Question"}
                </h2>

                <p>
                  Manage the question and
                  answer options.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="modal-close-button"
              >
                ×
              </button>
            </div>

            <div className="questions-modal-body">
              <div className="modal-field">
                <label>
                  Category
                  <span>*</span>
                </label>

                <select
                  value={
                    formData.category
                  }
                  onChange={(event) =>
                    handleFormChange(
                      "category",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  {allCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={
                          category
                        }
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="modal-field">
                <label>
                  Question
                  <span>*</span>
                </label>

                <textarea
                  rows={3}
                  value={
                    formData.text
                  }
                  placeholder="Enter your question..."
                  onChange={(event) =>
                    handleFormChange(
                      "text",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="modal-options-section">
                <div className="modal-options-header">
                  <div>
                    <label>
                      Answer Options
                      <span>*</span>
                    </label>

                    <p>
                      Add 2 to 6 answer
                      options.
                    </p>
                  </div>

                  {formData.options
                    .length < 6 && (
                    <button
                      type="button"
                      className="modal-add-option"
                      onClick={
                        handleAddOption
                      }
                    >
                      <Icon
                        name="plus"
                        size={14}
                      />

                      Add Option
                    </button>
                  )}
                </div>

                <div className="modal-options-list">
                  {formData.options.map(
                    (
                      option,
                      index
                    ) => (
                      <div
                        className="modal-option-row"
                        key={
                          index
                        }
                      >
                        <span>
                          {index +
                            1}
                        </span>

                        <input
                          value={
                            option
                          }
                          placeholder={`Option ${
                            index +
                            1
                          }`}
                          onChange={(
                            event
                          ) =>
                            handleOptionChange(
                              index,
                              event
                                .target
                                .value
                            )
                          }
                        />

                        {formData
                          .options
                          .length >
                          2 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveOption(
                                index
                              )
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {formError && (
                <div className="modal-error">
                  {formError}
                </div>
              )}
            </div>

            <div className="questions-modal-footer">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-save-button"
                onClick={
                  handleSaveQuestion
                }
              >
                {modalMode === "add"
                  ? "Add Question"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          DELETE MODAL
      ========================================= */}

      {deleteTarget && (
        <div
          className="questions-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >
          <div className="delete-modal">
            <div className="delete-modal-icon">
              <SmallIcon
                name="trash"
                size={22}
              />
            </div>

            <h2>
              Delete Question?
            </h2>

            <p>
              This question will be removed
              from the question bank.
            </p>

            <div className="delete-question-preview">
              {deleteTarget.text}
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={
                  closeDeleteModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={
                  confirmDelete
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;