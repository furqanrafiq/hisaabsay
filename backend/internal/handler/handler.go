package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"hisaabsay-backend/internal/auth"
	"hisaabsay-backend/internal/httpx"
	"hisaabsay-backend/internal/middleware"
	"hisaabsay-backend/internal/model"
	"hisaabsay-backend/internal/store"
)

type Handler struct {
	Store *store.Store
	Auth  *auth.Service
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", h.handleHealth)
	mux.HandleFunc("/auth/send-otp", h.handleSendOTP)
	mux.HandleFunc("/auth/verify-otp", h.handleVerifyOTP)

	protected := http.NewServeMux()
	protected.HandleFunc("/profile", h.handleProfile)
	protected.HandleFunc("/transactions", h.handleTransactions)
	protected.HandleFunc("/transactions/", h.handleTransactionByID)
	protected.HandleFunc("/budgets", h.handleBudgets)
	protected.HandleFunc("/budgets/", h.handleBudgetByID)
	protected.HandleFunc("/goals", h.handleGoals)
	protected.HandleFunc("/goals/", h.handleGoalByIDOrAction)
	protected.HandleFunc("/categories/custom", h.handleCustomCategories)
	protected.HandleFunc("/categories/custom/", h.handleCustomCategoryByID)
	protected.HandleFunc("/currencies", h.handleCurrencies)
	protected.HandleFunc("/accounts", h.handleAccounts)
	protected.HandleFunc("/accounts/", h.handleAccountByID)

	mux.Handle("/", middleware.RequireAuth(h.Auth, protected))
	return httpx.WithJSONHeaders(mux)
}

func (h *Handler) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Auth

type sendOTPRequest struct {
	Phone string `json:"phone"`
}

type verifyOTPRequest struct {
	Phone string `json:"phone"`
	OTP   string `json:"otp"`
}

type verifyOTPResponse struct {
	Token   string            `json:"token"`
	Profile model.UserProfile `json:"profile"`
}

func (h *Handler) handleSendOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpx.MethodNotAllowed(w)
		return
	}
	var req sendOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Phone) == "" {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "OTP sent"})
}

func (h *Handler) handleVerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpx.MethodNotAllowed(w)
		return
	}
	var req verifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Phone) == "" || len(req.OTP) != 6 {
		httpx.WriteError(w, http.StatusBadRequest, "invalid phone or otp")
		return
	}

	uid, profile, err := h.Store.EnsureUserByPhone(r.Context(), req.Phone)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to verify otp")
		return
	}
	token, err := h.Auth.Issue(uid, req.Phone)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, verifyOTPResponse{Token: token, Profile: profile})
}

// Profile

func (h *Handler) handleProfile(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		p, err := h.Store.GetProfile(r.Context(), uid)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "profile not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to load profile")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, p)
	case http.MethodPut, http.MethodPatch:
		var req model.UserProfile
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		p, err := h.Store.UpsertProfile(r.Context(), uid, req)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to save profile")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, p)
	default:
		httpx.MethodNotAllowed(w)
	}
}

// Transactions

func (h *Handler) handleTransactions(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		list, err := h.Store.ListTransactions(r.Context(), uid)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to list transactions")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, list)
	case http.MethodPost:
		var req model.Transaction
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		created, err := h.Store.CreateTransaction(r.Context(), uid, req)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to create transaction")
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, created)
	default:
		httpx.MethodNotAllowed(w)
	}
}

func (h *Handler) handleTransactionByID(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/transactions/")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing id")
		return
	}

	switch r.Method {
	case http.MethodGet:
		t, err := h.Store.GetTransaction(r.Context(), uid, id)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "transaction not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to load transaction")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, t)
	case http.MethodPut, http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		updated, err := h.Store.UpdateTransaction(r.Context(), uid, id, patch)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "transaction not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to update transaction")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := h.Store.DeleteTransaction(r.Context(), uid, id); err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "transaction not found")
			return
		} else if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to delete transaction")
			return
		}
		httpx.WriteJSON(w, http.StatusNoContent, nil)
	default:
		httpx.MethodNotAllowed(w)
	}
}

// Budgets

func (h *Handler) handleBudgets(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		list, err := h.Store.ListBudgets(r.Context(), uid)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to list budgets")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, list)
	case http.MethodPost:
		var req model.Budget
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		created, err := h.Store.CreateBudget(r.Context(), uid, req)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to create budget")
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, created)
	default:
		httpx.MethodNotAllowed(w)
	}
}

func (h *Handler) handleBudgetByID(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/budgets/")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing id")
		return
	}

	switch r.Method {
	case http.MethodPut, http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		updated, err := h.Store.UpdateBudget(r.Context(), uid, id, patch)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "budget not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to update budget")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := h.Store.DeleteBudget(r.Context(), uid, id); err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "budget not found")
			return
		} else if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to delete budget")
			return
		}
		httpx.WriteJSON(w, http.StatusNoContent, nil)
	default:
		httpx.MethodNotAllowed(w)
	}
}

// Goals

func (h *Handler) handleGoals(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		list, err := h.Store.ListGoals(r.Context(), uid)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to list goals")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, list)
	case http.MethodPost:
		var req model.Goal
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		created, err := h.Store.CreateGoal(r.Context(), uid, req)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to create goal")
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, created)
	default:
		httpx.MethodNotAllowed(w)
	}
}

type contributeRequest struct {
	Amount float64 `json:"amount"`
}

func (h *Handler) handleGoalByIDOrAction(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/goals/")

	if strings.HasSuffix(path, "/contribute") {
		id := strings.TrimSuffix(path, "/contribute")
		id = strings.TrimSuffix(id, "/")
		if id == "" {
			httpx.WriteError(w, http.StatusBadRequest, "missing id")
			return
		}
		if r.Method != http.MethodPost {
			httpx.MethodNotAllowed(w)
			return
		}
		var req contributeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
			httpx.WriteError(w, http.StatusBadRequest, "invalid amount")
			return
		}
		updated, err := h.Store.ContributeToGoal(r.Context(), uid, id, req.Amount)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "goal not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to contribute to goal")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, updated)
		return
	}

	id := strings.Trim(path, "/")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing id")
		return
	}

	switch r.Method {
	case http.MethodPut, http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		updated, err := h.Store.UpdateGoal(r.Context(), uid, id, patch)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "goal not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to update goal")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := h.Store.DeleteGoal(r.Context(), uid, id); err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "goal not found")
			return
		} else if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to delete goal")
			return
		}
		httpx.WriteJSON(w, http.StatusNoContent, nil)
	default:
		httpx.MethodNotAllowed(w)
	}
}

// Custom categories

func (h *Handler) handleCustomCategories(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		list, err := h.Store.ListCustomCategories(r.Context(), uid)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to list categories")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, list)
	case http.MethodPost:
		var req model.Category
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		created, err := h.Store.CreateCustomCategory(r.Context(), uid, req)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to create category")
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, created)
	default:
		httpx.MethodNotAllowed(w)
	}
}

// Currencies

func (h *Handler) handleCurrencies(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w)
		return
	}
	list, err := h.Store.ListCurrencies(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "failed to list currencies")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, list)
}

func (h *Handler) handleCustomCategoryByID(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/categories/custom/")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing id")
		return
	}

	switch r.Method {
	case http.MethodDelete:
		if err := h.Store.DeleteCustomCategory(r.Context(), uid, id); err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "category not found")
			return
		} else if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to delete category")
			return
		}
		httpx.WriteJSON(w, http.StatusNoContent, nil)
	default:
		httpx.MethodNotAllowed(w)
	}
}

// Accounts

func (h *Handler) handleAccounts(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		list, err := h.Store.ListAccounts(r.Context(), uid)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to list accounts")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, list)
	case http.MethodPost:
		var req model.Account
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if strings.TrimSpace(req.Name) == "" {
			httpx.WriteError(w, http.StatusBadRequest, "name is required")
			return
		}
		created, err := h.Store.CreateAccount(r.Context(), uid, req)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to create account")
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, created)
	default:
		httpx.MethodNotAllowed(w)
	}
}

func (h *Handler) handleAccountByID(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	rest := strings.TrimPrefix(r.URL.Path, "/accounts/")
	if rest == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing id")
		return
	}

	// /accounts/{id}/reassign  (POST { toAccountId })
	if strings.HasSuffix(rest, "/reassign") {
		id := strings.TrimSuffix(rest, "/reassign")
		id = strings.TrimSuffix(id, "/")
		if id == "" {
			httpx.WriteError(w, http.StatusBadRequest, "missing id")
			return
		}
		if r.Method != http.MethodPost {
			httpx.MethodNotAllowed(w)
			return
		}
		var req struct {
			ToAccountID string `json:"toAccountId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.ToAccountID) == "" {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.ToAccountID == id {
			httpx.WriteError(w, http.StatusBadRequest, "cannot reassign to same account")
			return
		}
		if err := h.Store.ReassignAccountTransactions(r.Context(), uid, id, req.ToAccountID); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to reassign transactions")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		return
	}

	id := strings.Trim(rest, "/")
	if id == "" {
		httpx.WriteError(w, http.StatusBadRequest, "missing id")
		return
	}

	switch r.Method {
	case http.MethodGet:
		a, err := h.Store.GetAccount(r.Context(), uid, id)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "account not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to load account")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, a)
	case http.MethodPut, http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		updated, err := h.Store.UpdateAccount(r.Context(), uid, id, patch)
		if err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "account not found")
			return
		}
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to update account")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, updated)
	case http.MethodDelete:
		n, err := h.Store.CountAccountTransactions(r.Context(), uid, id)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to check account usage")
			return
		}
		if n > 0 {
			httpx.WriteError(w, http.StatusConflict, "account has transactions; reassign first")
			return
		}
		if err := h.Store.DeleteAccount(r.Context(), uid, id); err == store.ErrNotFound {
			httpx.WriteError(w, http.StatusNotFound, "account not found")
			return
		} else if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "failed to delete account")
			return
		}
		httpx.WriteJSON(w, http.StatusNoContent, nil)
	default:
		httpx.MethodNotAllowed(w)
	}
}

