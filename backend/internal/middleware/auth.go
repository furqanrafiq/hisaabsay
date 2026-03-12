package middleware

import (
	"context"
	"net/http"
	"strings"

	"hisaabsay-backend/internal/auth"
	"hisaabsay-backend/internal/httpx"
)

type ctxKey string

const (
	ctxKeyUserID ctxKey = "userID"
	ctxKeyPhone  ctxKey = "phone"
)

func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyUserID).(string)
	return v, ok && v != ""
}

func PhoneFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyPhone).(string)
	return v, ok && v != ""
}

func RequireAuth(svc *auth.Service, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" {
			httpx.WriteError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}
		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			httpx.WriteError(w, http.StatusUnauthorized, "invalid authorization header")
			return
		}
		claims, err := svc.Verify(parts[1])
		if err != nil {
			httpx.WriteError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		ctx := context.WithValue(r.Context(), ctxKeyUserID, claims.UserID)
		ctx = context.WithValue(ctx, ctxKeyPhone, claims.Phone)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

