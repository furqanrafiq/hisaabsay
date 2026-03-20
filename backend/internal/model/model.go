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
	CreatedAt       string          `json:"createdAt"`
}

type Budget struct {
	ID       string  `json:"id"`
	Category string  `json:"category"`
	Limit    float64 `json:"limit"`
	Month    string  `json:"month"`
}

type Goal struct {
	ID                  string  `json:"id"`
	Name                string  `json:"name"`
	TargetAmount        float64 `json:"targetAmount"`
	SavedAmount         float64 `json:"savedAmount"`
	Deadline            string  `json:"deadline"`
	Emoji               string  `json:"emoji"`
	MonthlyContribution float64 `json:"monthlyContribution"`
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

