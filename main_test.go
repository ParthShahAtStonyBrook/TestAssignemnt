package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGetUsersHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.GET("/api/users", getUsers)

	testFile := filepath.Join("data", "Spec for IAM, Service users.xlsx")
	if _, err := os.Stat(testFile); os.IsNotExist(err) {
		t.Fatalf("Test Excel file not found at %s", testFile)
	}

	req, err := http.NewRequest(http.MethodGet, "/api/users", nil)
	assert.NoError(t, err)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var users []User
	err = json.Unmarshal(w.Body.Bytes(), &users)
	assert.NoError(t, err)

	now := time.Now()

	for _, user := range users {
		t.Run("Validate dates for "+user.Name, func(t *testing.T) {
			assert.Falsef(t, user.CreateDate.IsZero(), "CreateDate is invalid or unparseable for user %s", user.Name)
			assert.Falsef(t, user.LastLogin.IsZero(), "LastLogin is invalid or unparseable for user %s", user.Name)
			assert.Falsef(t, user.LastPwdChange.IsZero(), "LastPwdChange is invalid or unparseable for user %s", user.Name)

			assert.LessOrEqual(t, user.CreateDate.Unix(), now.Unix(), "CreateDate is in the future")
			assert.LessOrEqual(t, user.LastLogin.Unix(), now.Unix(), "LastLogin is in the future")
			assert.LessOrEqual(t, user.LastPwdChange.Unix(), now.Unix(), "LastPwdChange is in the future")

		})
	}
}
