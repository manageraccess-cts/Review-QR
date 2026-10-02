import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getBusinesses,
  getBusiness,
  createBusiness as createBusinessApi,
  updateBusiness as updateBusinessApi,
  deleteBusiness as deleteBusinessApi,
} from "../services/api";

const BusinessContext =
  createContext(null);

/* =========================================
   PROVIDER
========================================= */

export const BusinessProvider = ({
  children,
}) => {
  const [
    businesses,
    setBusinesses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================
     LOAD BUSINESSES FROM BACKEND
  ========================================= */

  const loadBusinesses =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getBusinesses();

        if (
          response &&
          response.success
        ) {
          setBusinesses(
            Array.isArray(
              response.data
            )
              ? response.data
              : []
          );
        } else {
          setBusinesses([]);
        }
      } catch (err) {
        console.error(
          "Failed to load businesses:",
          err
        );

        setError(
          err.message ||
            "Failed to load businesses"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================
     INITIAL LOAD
  ========================================= */

  useEffect(() => {
    loadBusinesses();
  }, []);

  /* =========================================
     CREATE BUSINESS
  ========================================= */

  const addBusiness =
    async (businessData) => {
      try {
        setError("");

        const response =
          await createBusinessApi(
            businessData
          );

        if (
          !response ||
          !response.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to create business"
          );
        }

        const newBusiness =
          response.data;

        setBusinesses(
          (current) => [
            ...current,
            newBusiness,
          ]
        );

        return newBusiness;
      } catch (err) {
        console.error(
          "Failed to create business:",
          err
        );

        setError(
          err.message ||
            "Failed to create business"
        );

        throw err;
      }
    };

  /* =========================================
     GET SINGLE BUSINESS
  ========================================= */

  const fetchBusiness =
    async (businessId) => {
      try {
        setError("");

        const response =
          await getBusiness(
            businessId
          );

        if (
          !response ||
          !response.success
        ) {
          throw new Error(
            response?.message ||
              "Business not found"
          );
        }

        return response.data;
      } catch (err) {
        console.error(
          "Failed to get business:",
          err
        );

        setError(
          err.message ||
            "Failed to get business"
        );

        throw err;
      }
    };

  /* =========================================
     UPDATE BUSINESS
  ========================================= */

  const updateBusiness =
    async (
      businessId,
      businessData
    ) => {
      try {
        setError("");

        const response =
          await updateBusinessApi(
            businessId,
            businessData
          );

        if (
          !response ||
          !response.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to update business"
          );
        }

        const updatedBusiness =
          response.data;

        setBusinesses(
          (current) =>
            current.map(
              (business) =>
                business.id ===
                businessId
                  ? updatedBusiness
                  : business
            )
        );

        return updatedBusiness;
      } catch (err) {
        console.error(
          "Failed to update business:",
          err
        );

        setError(
          err.message ||
            "Failed to update business"
        );

        throw err;
      }
    };

  /* =========================================
     DELETE BUSINESS
  ========================================= */

  const removeBusiness =
    async (businessId) => {
      try {
        setError("");

        const response =
          await deleteBusinessApi(
            businessId
          );

        if (
          !response ||
          !response.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to delete business"
          );
        }

        setBusinesses(
          (current) =>
            current.filter(
              (business) =>
                business.id !==
                businessId
            )
        );

        return true;
      } catch (err) {
        console.error(
          "Failed to delete business:",
          err
        );

        setError(
          err.message ||
            "Failed to delete business"
        );

        throw err;
      }
    };

  /* =========================================
     GET BUSINESS FROM CURRENT STATE
  ========================================= */

  const getBusinessById =
    (businessId) => {
      return businesses.find(
        (business) =>
          business.id ===
          businessId
      );
    };

  /* =========================================
     REFRESH
  ========================================= */

  const refreshBusinesses =
    async () => {
      await loadBusinesses();
    };

  /* =========================================
     STATISTICS
  ========================================= */

  const statistics =
    useMemo(() => {
      const total =
        businesses.length;

      const active =
        businesses.filter(
          (business) =>
            business.status ===
            "Active"
        ).length;

      const inactive =
        businesses.filter(
          (business) =>
            business.status ===
            "Inactive"
        ).length;

      const qrGenerated =
        businesses.filter(
          (business) =>
            business.qrStatus ===
            "Generated"
        ).length;

      const qrPending =
        businesses.filter(
          (business) =>
            business.qrStatus !==
            "Generated"
        ).length;

      const reviewsGenerated =
        businesses.reduce(
          (
            totalReviews,
            business
          ) => {
            return (
              totalReviews +
              Number(
                business.reviewsGenerated ||
                  0
              )
            );
          },
          0
        );

      return {
        total,
        active,
        inactive,
        qrGenerated,
        qrPending,
        reviewsGenerated,
      };
    }, [businesses]);

  /* =========================================
     CONTEXT VALUE
  ========================================= */

  const value = {
    businesses,

    loading,

    error,

    statistics,

    addBusiness,

    fetchBusiness,

    updateBusiness,

    removeBusiness,

    deleteBusiness:
      removeBusiness,

    getBusinessById,

    refreshBusinesses,

    loadBusinesses,
  };

  return (
    <BusinessContext.Provider
      value={value}
    >
      {children}
    </BusinessContext.Provider>
  );
};

/* =========================================
   HOOK
========================================= */

export const useBusiness = () => {
  const context =
    useContext(
      BusinessContext
    );

  if (!context) {
    throw new Error(
      "useBusiness must be used inside BusinessProvider"
    );
  }

  return context;
};

/* =========================================
   PLURAL HOOK
========================================= */

export const useBusinesses = () => {
  const context =
    useContext(
      BusinessContext
    );

  if (!context) {
    throw new Error(
      "useBusinesses must be used inside BusinessProvider"
    );
  }

  return context;
};

export default BusinessContext;