package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"hisaabsay-backend/internal/db"
	"hisaabsay-backend/internal/id"
	"hisaabsay-backend/internal/model"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	DB *db.DB
}

func New(d *db.DB) *Store {
	return &Store{DB: d}
}

func nowRFC3339() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// Users & profile

func (s *Store) EnsureUserByPhone(ctx context.Context, phone string) (userID string, profile model.UserProfile, err error) {
	var uid string
	err = s.DB.SQL.QueryRowContext(ctx, `SELECT id FROM users WHERE phone = ?`, phone).Scan(&uid)
	if err != nil && err != sql.ErrNoRows {
		return "", model.UserProfile{}, err
	}

	if err == sql.ErrNoRows {
		uid = id.New("usr")
		if _, err := s.DB.SQL.ExecContext(ctx, `INSERT INTO users (id, phone, created_at) VALUES (?, ?, ?)`, uid, phone, nowRFC3339()); err != nil {
			return "", model.UserProfile{}, err
		}
		p := model.UserProfile{
			Name:                 "",
			Phone:                phone,
			Currency:             "PKR",
			NotificationsEnabled: true,
		}
		if _, err := s.DB.SQL.ExecContext(ctx,
			`INSERT INTO profiles (user_id, name, phone, currency, notifications_enabled) VALUES (?, ?, ?, ?, ?)`,
			uid, p.Name, p.Phone, p.Currency, boolToInt(p.NotificationsEnabled),
		); err != nil {
			return "", model.UserProfile{}, err
		}
		if _, err := s.CreateAccount(ctx, uid, model.Account{
			Name: "Default " + p.Currency, Currency: p.Currency,
		}); err != nil {
			return "", model.UserProfile{}, err
		}
		return uid, p, nil
	}

	p, err := s.GetProfile(ctx, uid)
	if err != nil {
		return "", model.UserProfile{}, err
	}
	return uid, p, nil
}

func (s *Store) GetProfile(ctx context.Context, userID string) (model.UserProfile, error) {
	var p model.UserProfile
	var notif int
	err := s.DB.SQL.QueryRowContext(ctx,
		`SELECT name, phone, currency, notifications_enabled FROM profiles WHERE user_id = ?`,
		userID,
	).Scan(&p.Name, &p.Phone, &p.Currency, &notif)
	if err == sql.ErrNoRows {
		return model.UserProfile{}, ErrNotFound
	}
	if err != nil {
		return model.UserProfile{}, err
	}
	p.NotificationsEnabled = notif != 0
	return p, nil
}

func (s *Store) UpsertProfile(ctx context.Context, userID string, p model.UserProfile) (model.UserProfile, error) {
	_, err := s.DB.SQL.ExecContext(ctx,
		`INSERT INTO profiles (user_id, name, phone, currency, notifications_enabled)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(user_id) DO UPDATE SET
		   name=excluded.name,
		   phone=excluded.phone,
		   currency=excluded.currency,
		   notifications_enabled=excluded.notifications_enabled`,
		userID, p.Name, p.Phone, p.Currency, boolToInt(p.NotificationsEnabled),
	)
	if err != nil {
		return model.UserProfile{}, err
	}
	return p, nil
}

// Transactions

func (s *Store) ListTransactions(ctx context.Context, userID string) ([]model.Transaction, error) {
	rows, err := s.DB.SQL.QueryContext(ctx,
		`SELECT id, type, amount, category, note, date, fixed, overspend_reason, currency, account_id, created_at
		 FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Transaction
	for rows.Next() {
		var t model.Transaction
		var fixed int
		if err := rows.Scan(&t.ID, &t.Type, &t.Amount, &t.Category, &t.Note, &t.Date, &fixed, &t.OverspendReason, &t.Currency, &t.AccountID, &t.CreatedAt); err != nil {
			return nil, err
		}
		t.Fixed = fixed != 0
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) CreateTransaction(ctx context.Context, userID string, t model.Transaction) (model.Transaction, error) {
	if t.ID == "" {
		t.ID = id.New("tx")
	}
	if t.CreatedAt == "" {
		t.CreatedAt = nowRFC3339()
	}
	if t.Currency == "" {
		t.Currency = "PKR"
	}
	_, err := s.DB.SQL.ExecContext(ctx,
		`INSERT INTO transactions (id, user_id, type, amount, category, note, date, fixed, overspend_reason, currency, account_id, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, userID, string(t.Type), t.Amount, t.Category, t.Note, t.Date, boolToInt(t.Fixed), t.OverspendReason, t.Currency, t.AccountID, t.CreatedAt,
	)
	if err != nil {
		return model.Transaction{}, err
	}
	return t, nil
}

func (s *Store) UpdateTransaction(ctx context.Context, userID, id string, patch map[string]interface{}) (model.Transaction, error) {
	cur, err := s.GetTransaction(ctx, userID, id)
	if err != nil {
		return model.Transaction{}, err
	}
	if v, ok := patch["type"].(string); ok {
		cur.Type = model.TransactionType(v)
	}
	if v, ok := patch["amount"].(float64); ok {
		cur.Amount = v
	}
	if v, ok := patch["category"].(string); ok {
		cur.Category = v
	}
	if v, ok := patch["note"].(string); ok {
		cur.Note = v
	}
	if v, ok := patch["date"].(string); ok {
		cur.Date = v
	}
	if v, ok := patch["fixed"].(bool); ok {
		cur.Fixed = v
	}
	if v, ok := patch["overspendReason"].(string); ok {
		cur.OverspendReason = v
	}
	if v, ok := patch["currency"].(string); ok && v != "" {
		cur.Currency = v
	}
	if v, ok := patch["accountId"].(string); ok {
		cur.AccountID = v
	}
	_, err = s.DB.SQL.ExecContext(ctx,
		`UPDATE transactions SET type=?, amount=?, category=?, note=?, date=?, fixed=?, overspend_reason=?, currency=?, account_id=? WHERE user_id=? AND id=?`,
		string(cur.Type), cur.Amount, cur.Category, cur.Note, cur.Date, boolToInt(cur.Fixed), cur.OverspendReason, cur.Currency, cur.AccountID, userID, id,
	)
	if err != nil {
		return model.Transaction{}, err
	}
	return cur, nil
}

func (s *Store) GetTransaction(ctx context.Context, userID, txID string) (model.Transaction, error) {
	var t model.Transaction
	var fixed int
	err := s.DB.SQL.QueryRowContext(ctx,
		`SELECT id, type, amount, category, note, date, fixed, overspend_reason, currency, account_id, created_at
		 FROM transactions WHERE user_id = ? AND id = ?`,
		userID, txID,
	).Scan(&t.ID, &t.Type, &t.Amount, &t.Category, &t.Note, &t.Date, &fixed, &t.OverspendReason, &t.Currency, &t.AccountID, &t.CreatedAt)
	if err == sql.ErrNoRows {
		return model.Transaction{}, ErrNotFound
	}
	if err != nil {
		return model.Transaction{}, err
	}
	t.Fixed = fixed != 0
	return t, nil
}

func (s *Store) DeleteTransaction(ctx context.Context, userID, txID string) error {
	res, err := s.DB.SQL.ExecContext(ctx, `DELETE FROM transactions WHERE user_id = ? AND id = ?`, userID, txID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Budgets

func (s *Store) ListBudgets(ctx context.Context, userID string) ([]model.Budget, error) {
	rows, err := s.DB.SQL.QueryContext(ctx,
		`SELECT id, category, limit_amount, month, currency, account_id FROM budgets WHERE user_id = ?`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Budget
	for rows.Next() {
		var b model.Budget
		if err := rows.Scan(&b.ID, &b.Category, &b.Limit, &b.Month, &b.Currency, &b.AccountID); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (s *Store) CreateBudget(ctx context.Context, userID string, b model.Budget) (model.Budget, error) {
	if b.ID == "" {
		b.ID = id.New("bdg")
	}
	if b.Currency == "" {
		b.Currency = "PKR"
	}
	_, err := s.DB.SQL.ExecContext(ctx,
		`INSERT INTO budgets (id, user_id, category, limit_amount, month, currency, account_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		b.ID, userID, b.Category, b.Limit, b.Month, b.Currency, b.AccountID,
	)
	if err != nil {
		return model.Budget{}, err
	}
	return b, nil
}

func (s *Store) UpdateBudget(ctx context.Context, userID, budgetID string, patch map[string]interface{}) (model.Budget, error) {
	cur, err := s.GetBudget(ctx, userID, budgetID)
	if err != nil {
		return model.Budget{}, err
	}
	if v, ok := patch["category"].(string); ok {
		cur.Category = v
	}
	if v, ok := patch["limit"].(float64); ok {
		cur.Limit = v
	}
	if v, ok := patch["month"].(string); ok {
		cur.Month = v
	}
	if v, ok := patch["currency"].(string); ok && v != "" {
		cur.Currency = v
	}
	if v, ok := patch["accountId"].(string); ok {
		cur.AccountID = v
	}
	_, err = s.DB.SQL.ExecContext(ctx,
		`UPDATE budgets SET category=?, limit_amount=?, month=?, currency=?, account_id=? WHERE user_id=? AND id=?`,
		cur.Category, cur.Limit, cur.Month, cur.Currency, cur.AccountID, userID, budgetID,
	)
	if err != nil {
		return model.Budget{}, err
	}
	return cur, nil
}

func (s *Store) GetBudget(ctx context.Context, userID, budgetID string) (model.Budget, error) {
	var b model.Budget
	err := s.DB.SQL.QueryRowContext(ctx,
		`SELECT id, category, limit_amount, month, currency, account_id FROM budgets WHERE user_id=? AND id=?`,
		userID, budgetID,
	).Scan(&b.ID, &b.Category, &b.Limit, &b.Month, &b.Currency, &b.AccountID)
	if err == sql.ErrNoRows {
		return model.Budget{}, ErrNotFound
	}
	if err != nil {
		return model.Budget{}, err
	}
	return b, nil
}

func (s *Store) DeleteBudget(ctx context.Context, userID, budgetID string) error {
	res, err := s.DB.SQL.ExecContext(ctx, `DELETE FROM budgets WHERE user_id = ? AND id = ?`, userID, budgetID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Goals

func (s *Store) ListGoals(ctx context.Context, userID string) ([]model.Goal, error) {
	rows, err := s.DB.SQL.QueryContext(ctx,
		`SELECT id, name, target_amount, saved_amount, deadline, emoji, monthly_contribution, currency, created_at
		 FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Goal
	for rows.Next() {
		var g model.Goal
		if err := rows.Scan(&g.ID, &g.Name, &g.TargetAmount, &g.SavedAmount, &g.Deadline, &g.Emoji, &g.MonthlyContribution, &g.Currency, &g.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

func (s *Store) CreateGoal(ctx context.Context, userID string, g model.Goal) (model.Goal, error) {
	if g.ID == "" {
		g.ID = id.New("goal")
	}
	if g.CreatedAt == "" {
		g.CreatedAt = nowRFC3339()
	}
	if g.Currency == "" {
		g.Currency = "PKR"
	}
	_, err := s.DB.SQL.ExecContext(ctx,
		`INSERT INTO goals (id, user_id, name, target_amount, saved_amount, deadline, emoji, monthly_contribution, currency, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		g.ID, userID, g.Name, g.TargetAmount, g.SavedAmount, g.Deadline, g.Emoji, g.MonthlyContribution, g.Currency, g.CreatedAt,
	)
	if err != nil {
		return model.Goal{}, err
	}
	return g, nil
}

func (s *Store) GetGoal(ctx context.Context, userID, goalID string) (model.Goal, error) {
	var g model.Goal
	err := s.DB.SQL.QueryRowContext(ctx,
		`SELECT id, name, target_amount, saved_amount, deadline, emoji, monthly_contribution, currency, created_at
		 FROM goals WHERE user_id = ? AND id = ?`,
		userID, goalID,
	).Scan(&g.ID, &g.Name, &g.TargetAmount, &g.SavedAmount, &g.Deadline, &g.Emoji, &g.MonthlyContribution, &g.Currency, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return model.Goal{}, ErrNotFound
	}
	if err != nil {
		return model.Goal{}, err
	}
	return g, nil
}

func (s *Store) UpdateGoal(ctx context.Context, userID, goalID string, patch map[string]interface{}) (model.Goal, error) {
	cur, err := s.GetGoal(ctx, userID, goalID)
	if err != nil {
		return model.Goal{}, err
	}
	if v, ok := patch["name"].(string); ok {
		cur.Name = v
	}
	if v, ok := patch["targetAmount"].(float64); ok {
		cur.TargetAmount = v
	}
	if v, ok := patch["savedAmount"].(float64); ok {
		cur.SavedAmount = v
	}
	if v, ok := patch["deadline"].(string); ok {
		cur.Deadline = v
	}
	if v, ok := patch["emoji"].(string); ok {
		cur.Emoji = v
	}
	if v, ok := patch["monthlyContribution"].(float64); ok {
		cur.MonthlyContribution = v
	}
	if v, ok := patch["currency"].(string); ok && v != "" {
		cur.Currency = v
	}
	_, err = s.DB.SQL.ExecContext(ctx,
		`UPDATE goals SET name=?, target_amount=?, saved_amount=?, deadline=?, emoji=?, monthly_contribution=?, currency=? WHERE user_id=? AND id=?`,
		cur.Name, cur.TargetAmount, cur.SavedAmount, cur.Deadline, cur.Emoji, cur.MonthlyContribution, cur.Currency, userID, goalID,
	)
	if err != nil {
		return model.Goal{}, err
	}
	return cur, nil
}

func (s *Store) DeleteGoal(ctx context.Context, userID, goalID string) error {
	res, err := s.DB.SQL.ExecContext(ctx, `DELETE FROM goals WHERE user_id=? AND id=?`, userID, goalID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ContributeToGoal(ctx context.Context, userID, goalID string, amount float64) (model.Goal, error) {
	cur, err := s.GetGoal(ctx, userID, goalID)
	if err != nil {
		return model.Goal{}, err
	}
	cur.SavedAmount += amount
	if cur.SavedAmount > cur.TargetAmount {
		cur.SavedAmount = cur.TargetAmount
	}
	_, err = s.DB.SQL.ExecContext(ctx,
		`UPDATE goals SET saved_amount=? WHERE user_id=? AND id=?`,
		cur.SavedAmount, userID, goalID,
	)
	if err != nil {
		return model.Goal{}, err
	}
	return cur, nil
}

// Custom categories

func (s *Store) ListCustomCategories(ctx context.Context, userID string) ([]model.Category, error) {
	rows, err := s.DB.SQL.QueryContext(ctx,
		`SELECT id, name, emoji, type FROM custom_categories WHERE user_id = ?`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Category
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Emoji, &c.Type); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) CreateCustomCategory(ctx context.Context, userID string, c model.Category) (model.Category, error) {
	if c.ID == "" {
		c.ID = "custom_" + id.New("cat")
	}
	_, err := s.DB.SQL.ExecContext(ctx,
		`INSERT INTO custom_categories (id, user_id, name, emoji, type) VALUES (?, ?, ?, ?, ?)`,
		c.ID, userID, c.Name, c.Emoji, c.Type,
	)
	if err != nil {
		return model.Category{}, err
	}
	return c, nil
}

func (s *Store) DeleteCustomCategory(ctx context.Context, userID, catID string) error {
	res, err := s.DB.SQL.ExecContext(ctx, `DELETE FROM custom_categories WHERE user_id=? AND id=?`, userID, catID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Currencies

func (s *Store) ListCurrencies(ctx context.Context) ([]model.Currency, error) {
	rows, err := s.DB.SQL.QueryContext(ctx, `SELECT code, name, symbol FROM currencies ORDER BY code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Currency
	for rows.Next() {
		var c model.Currency
		if err := rows.Scan(&c.Code, &c.Name, &c.Symbol); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// Accounts

func (s *Store) ListAccounts(ctx context.Context, userID string) ([]model.Account, error) {
	rows, err := s.DB.SQL.QueryContext(ctx,
		`SELECT id, name, bank, currency, opening_balance, emoji, color, archived, created_at
		 FROM accounts WHERE user_id = ? ORDER BY created_at ASC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Account
	for rows.Next() {
		var a model.Account
		var archived int
		if err := rows.Scan(&a.ID, &a.Name, &a.Bank, &a.Currency, &a.OpeningBalance, &a.Emoji, &a.Color, &archived, &a.CreatedAt); err != nil {
			return nil, err
		}
		a.Archived = archived != 0
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) CreateAccount(ctx context.Context, userID string, a model.Account) (model.Account, error) {
	if a.ID == "" {
		a.ID = id.New("acc")
	}
	if a.CreatedAt == "" {
		a.CreatedAt = nowRFC3339()
	}
	if a.Currency == "" {
		a.Currency = "PKR"
	}
	if a.Emoji == "" {
		a.Emoji = "🏦"
	}
	if a.Color == "" {
		a.Color = "#1E293B"
	}
	_, err := s.DB.SQL.ExecContext(ctx,
		`INSERT INTO accounts (id, user_id, name, bank, currency, opening_balance, emoji, color, archived, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		a.ID, userID, a.Name, a.Bank, a.Currency, a.OpeningBalance, a.Emoji, a.Color, boolToInt(a.Archived), a.CreatedAt,
	)
	if err != nil {
		return model.Account{}, err
	}
	return a, nil
}

func (s *Store) GetAccount(ctx context.Context, userID, accID string) (model.Account, error) {
	var a model.Account
	var archived int
	err := s.DB.SQL.QueryRowContext(ctx,
		`SELECT id, name, bank, currency, opening_balance, emoji, color, archived, created_at
		 FROM accounts WHERE user_id = ? AND id = ?`,
		userID, accID,
	).Scan(&a.ID, &a.Name, &a.Bank, &a.Currency, &a.OpeningBalance, &a.Emoji, &a.Color, &archived, &a.CreatedAt)
	if err == sql.ErrNoRows {
		return model.Account{}, ErrNotFound
	}
	if err != nil {
		return model.Account{}, err
	}
	a.Archived = archived != 0
	return a, nil
}

func (s *Store) UpdateAccount(ctx context.Context, userID, accID string, patch map[string]interface{}) (model.Account, error) {
	cur, err := s.GetAccount(ctx, userID, accID)
	if err != nil {
		return model.Account{}, err
	}
	if v, ok := patch["name"].(string); ok {
		cur.Name = v
	}
	if v, ok := patch["bank"].(string); ok {
		cur.Bank = v
	}
	if v, ok := patch["currency"].(string); ok && v != "" {
		cur.Currency = v
	}
	if v, ok := patch["openingBalance"].(float64); ok {
		cur.OpeningBalance = v
	}
	if v, ok := patch["emoji"].(string); ok && v != "" {
		cur.Emoji = v
	}
	if v, ok := patch["color"].(string); ok && v != "" {
		cur.Color = v
	}
	if v, ok := patch["archived"].(bool); ok {
		cur.Archived = v
	}
	_, err = s.DB.SQL.ExecContext(ctx,
		`UPDATE accounts SET name=?, bank=?, currency=?, opening_balance=?, emoji=?, color=?, archived=? WHERE user_id=? AND id=?`,
		cur.Name, cur.Bank, cur.Currency, cur.OpeningBalance, cur.Emoji, cur.Color, boolToInt(cur.Archived), userID, accID,
	)
	if err != nil {
		return model.Account{}, err
	}
	return cur, nil
}

// CountAccountTransactions returns the number of transactions linked to an account.
func (s *Store) CountAccountTransactions(ctx context.Context, userID, accID string) (int, error) {
	var n int
	err := s.DB.SQL.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM transactions WHERE user_id = ? AND account_id = ?`,
		userID, accID,
	).Scan(&n)
	if err != nil {
		return 0, err
	}
	return n, nil
}

// ReassignAccountTransactions moves transactions from one account to another.
func (s *Store) ReassignAccountTransactions(ctx context.Context, userID, fromID, toID string) error {
	_, err := s.DB.SQL.ExecContext(ctx,
		`UPDATE transactions SET account_id = ? WHERE user_id = ? AND account_id = ?`,
		toID, userID, fromID,
	)
	return err
}

func (s *Store) DeleteAccount(ctx context.Context, userID, accID string) error {
	res, err := s.DB.SQL.ExecContext(ctx, `DELETE FROM accounts WHERE user_id=? AND id=?`, userID, accID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

