package model

type TransactionType string

const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
)

type Transaction struct {
	ID              string          `json:"id"`
	Type            TransactionType `json:"type"`
	Amount          float64         `json:"amount"`
	Category        string          `json:"category"`
	Note            string          `json:"note"`
	Date            string          `json:"date"`
	Fixed           bool            `json:"fixed"`
	OverspendReason string          `json:"overspendReason"`
	Currency        string          `json:"currency"`
	AccountID       string          `json:"accountId"`
	CreatedAt       string          `json:"createdAt"`
}

type Budget struct {
	ID        string  `json:"id"`
	Category  string  `json:"category"`
	Limit     float64 `json:"limit"`
	Month     string  `json:"month"`
	Currency  string  `json:"currency"`
	AccountID string  `json:"accountId"`
}

type Goal struct {
	ID                  string  `json:"id"`
	Name                string  `json:"name"`
	TargetAmount        float64 `json:"targetAmount"`
	SavedAmount         float64 `json:"savedAmount"`
	Deadline            string  `json:"deadline"`
	Emoji               string  `json:"emoji"`
	MonthlyContribution float64 `json:"monthlyContribution"`
	Currency            string  `json:"currency"`
	CreatedAt           string  `json:"createdAt"`
}

type UserProfile struct {
	Name                 string `json:"name"`
	Phone                string `json:"phone"`
	Currency             string `json:"currency"`
	NotificationsEnabled bool   `json:"notificationsEnabled"`
}

type Category struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Emoji string `json:"emoji"`
	Type  string `json:"type"` // income | expense
}

type Currency struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
}

type Account struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Bank           string  `json:"bank"`
	Currency       string  `json:"currency"`
	OpeningBalance float64 `json:"openingBalance"`
	Emoji          string  `json:"emoji"`
	Color          string  `json:"color"`
	Archived       bool    `json:"archived"`
	CreatedAt      string  `json:"createdAt"`
}

