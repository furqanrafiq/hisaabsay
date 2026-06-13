package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

type DB struct {
	SQL *sql.DB
}

func Open(path string) (*DB, error) {
	dsn := fmt.Sprintf("file:%s?_pragma=foreign_keys(1)", path)
	s, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	s.SetConnMaxLifetime(5 * time.Minute)
	s.SetMaxOpenConns(1) // SQLite is happiest with low concurrency
	s.SetMaxIdleConns(1)

	d := &DB{SQL: s}
	if err := d.migrate(context.Background()); err != nil {
		_ = s.Close()
		return nil, err
	}
	return d, nil
}

func (d *DB) Close() error {
	return d.SQL.Close()
}

func (d *DB) migrate(ctx context.Context) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			phone TEXT NOT NULL UNIQUE,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS profiles (
			user_id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			phone TEXT NOT NULL,
			currency TEXT NOT NULL,
			notifications_enabled INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			type TEXT NOT NULL,
			amount REAL NOT NULL,
			category TEXT NOT NULL,
			note TEXT NOT NULL,
			date TEXT NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS budgets (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			category TEXT NOT NULL,
			limit_amount REAL NOT NULL,
			month TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS goals (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			target_amount REAL NOT NULL,
			saved_amount REAL NOT NULL,
			deadline TEXT NOT NULL,
			emoji TEXT NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS custom_categories (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			emoji TEXT NOT NULL,
			type TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS currencies (
			code TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			symbol TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			bank TEXT NOT NULL DEFAULT '',
			currency TEXT NOT NULL,
			opening_balance REAL NOT NULL DEFAULT 0,
			emoji TEXT NOT NULL DEFAULT '🏦',
			color TEXT NOT NULL DEFAULT '#1E293B',
			archived INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
	}

	tx, err := d.SQL.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	for _, s := range stmts {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			_ = tx.Rollback()
			return err
		}
	}
	if err := tx.Commit(); err != nil {
		return err
	}

	// Add new columns to existing tables — ignore errors (column may already exist)
	alterStmts := []string{
		`ALTER TABLE transactions ADD COLUMN fixed INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE transactions ADD COLUMN overspend_reason TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE goals ADD COLUMN monthly_contribution REAL NOT NULL DEFAULT 0`,
		`ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE budgets ADD COLUMN currency TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE goals ADD COLUMN currency TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE transactions ADD COLUMN account_id TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE budgets ADD COLUMN account_id TEXT NOT NULL DEFAULT ''`,
	}
	for _, s := range alterStmts {
		_, _ = d.SQL.ExecContext(ctx, s)
	}

	// Seed default currencies
	seedCurrencies := []struct{ code, name, symbol string }{
		{"PKR", "Pakistani Rupee", "Rs"},
		{"SAR", "Saudi Riyal", "SAR"},
		{"USD", "US Dollar", "$"},
	}
	for _, c := range seedCurrencies {
		_, _ = d.SQL.ExecContext(ctx,
			`INSERT OR IGNORE INTO currencies (code, name, symbol) VALUES (?, ?, ?)`,
			c.code, c.name, c.symbol,
		)
	}

	// Backfill currency on existing rows: use the owning user's profile.currency, else 'PKR'.
	backfillStmts := []string{
		`UPDATE transactions
		   SET currency = COALESCE(NULLIF((SELECT currency FROM profiles WHERE profiles.user_id = transactions.user_id), ''), 'PKR')
		 WHERE currency = '' OR currency IS NULL`,
		`UPDATE budgets
		   SET currency = COALESCE(NULLIF((SELECT currency FROM profiles WHERE profiles.user_id = budgets.user_id), ''), 'PKR')
		 WHERE currency = '' OR currency IS NULL`,
		`UPDATE goals
		   SET currency = COALESCE(NULLIF((SELECT currency FROM profiles WHERE profiles.user_id = goals.user_id), ''), 'PKR')
		 WHERE currency = '' OR currency IS NULL`,
	}
	for _, s := range backfillStmts {
		_, _ = d.SQL.ExecContext(ctx, s)
	}

	// Backfill accounts: for each (user_id, currency) pair found in transactions
	// without an account_id, create a Default {CUR} account and assign all such rows to it.
	if err := backfillAccounts(ctx, d.SQL); err != nil {
		return err
	}
	return nil
}

func backfillAccounts(ctx context.Context, db *sql.DB) error {
	rows, err := db.QueryContext(ctx,
		`SELECT DISTINCT user_id, currency FROM transactions
		  WHERE (account_id = '' OR account_id IS NULL) AND currency != ''`)
	if err != nil {
		return err
	}
	type pair struct{ userID, currency string }
	var pairs []pair
	for rows.Next() {
		var p pair
		if err := rows.Scan(&p.userID, &p.currency); err != nil {
			rows.Close()
			return err
		}
		pairs = append(pairs, p)
	}
	rows.Close()

	for _, p := range pairs {
		var accountID string
		err := db.QueryRowContext(ctx,
			`SELECT id FROM accounts WHERE user_id = ? AND currency = ? AND name = ? LIMIT 1`,
			p.userID, p.currency, "Default "+p.currency,
		).Scan(&accountID)
		if err == sql.ErrNoRows {
			accountID = "acc_" + p.userID[:8] + "_" + p.currency
			_, err = db.ExecContext(ctx,
				`INSERT INTO accounts (id, user_id, name, bank, currency, opening_balance, emoji, color, archived, created_at)
				 VALUES (?, ?, ?, '', ?, 0, '🏦', '#1E293B', 0, ?)`,
				accountID, p.userID, "Default "+p.currency, p.currency, time.Now().UTC().Format(time.RFC3339),
			)
			if err != nil {
				return err
			}
		} else if err != nil {
			return err
		}
		if _, err := db.ExecContext(ctx,
			`UPDATE transactions SET account_id = ?
			  WHERE user_id = ? AND currency = ? AND (account_id = '' OR account_id IS NULL)`,
			accountID, p.userID, p.currency,
		); err != nil {
			return err
		}
	}
	return nil
}

