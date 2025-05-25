package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type User struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	CreateDate     time.Time `json:"createDate"`
	LastLogin      time.Time `json:"lastLogin"`
	LastPwdChange  time.Time `json:"lastPwdChange"`
	DaysSinceLogin int       `json:"daysSinceLogin"`
	DaysSincePwd   int       `json:"daysSincePwd"`
	MFAEnabled     bool      `json:"mfaEnabled"`
}

func parseDate(dateStr string) (time.Time, error) {
	layouts := []string{
		"Jan 2 2006",
		"Jan 02 2006",
	}

	var lastErr error
	for _, layout := range layouts {
		t, err := time.ParseInLocation(layout, dateStr, time.Local)
		if err == nil {
			return t, nil
		}
		lastErr = err
	}
	return time.Time{}, fmt.Errorf("could not parse date '%s': %v", dateStr, lastErr)
}

func getUsers(c *gin.Context) {
	filePath := filepath.Join("data", "Spec for IAM, Service users.xlsx")
	log.Printf("Opening Excel file: %s", filePath)

	f, err := excelize.OpenFile(filePath)
	if err != nil {
		log.Printf("Error opening Excel file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Could not open Excel file: %v", err)})
		return
	}
	defer f.Close()

	sheetName := f.GetSheetList()[0]
	log.Printf("Reading sheet: %s", sheetName)

	rows, err := f.GetRows(sheetName)
	if err != nil {
		log.Printf("Error reading rows: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Could not read Excel rows: %v", err)})
		return
	}

	log.Printf("Found %d rows in sheet", len(rows))

	var users []User

	for i, row := range rows {
		if i == 0 {
			continue
		}

		if len(row) < 7 {
			log.Printf("Row %d has insufficient columns: %v", i, row)
			continue
		}

		createDate, err := parseDate(row[1])
		if err != nil {
			log.Printf("Row %d - Error parsing create date '%s': %v", i, row[1], err)
		}

		lastPwdChange, err := parseDate(row[2])
		if err != nil {
			log.Printf("Row %d - Error parsing password change date '%s': %v", i, row[2], err)
			lastPwdChange = time.Time{}
		}

		lastLogin, err := parseDate(row[4])
		if err != nil {
			log.Printf("Row %d - Error parsing last login date '%s': %v", i, row[4], err)
			lastLogin = time.Time{}
		}

		now := time.Now()
		daysSinceLogin := 0
		daysSincePwd := 0

		if lastLogin.After(now) || lastLogin.Before(createDate) {
			daysSinceLogin = -1
		} else {
			daysSinceLogin = int(now.Sub(lastLogin).Hours() / 24)

		}

		if lastPwdChange.After(now) || lastPwdChange.Before(createDate) {
			daysSincePwd = -1
		} else {
			daysSincePwd = int(now.Sub(lastPwdChange).Hours() / 24)
		}

		mfaEnabled := false
		if len(row) > 6 {
			mfaEnabled = row[6] == "Yes"
		}

		user := User{
			ID:             strconv.Itoa(i),
			Name:           row[0],
			CreateDate:     createDate,
			LastLogin:      lastLogin,
			LastPwdChange:  lastPwdChange,
			DaysSinceLogin: daysSinceLogin,
			DaysSincePwd:   daysSincePwd,
			MFAEnabled:     mfaEnabled,
		}

		users = append(users, user)
		log.Printf("Added user: %+v", user)
	}

	log.Printf("Returning %d users", len(users))
	c.JSON(http.StatusOK, users)
}

func main() {
	gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(config))

	r.GET("/api/users", getUsers)

	log.Printf("Starting server on :8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
