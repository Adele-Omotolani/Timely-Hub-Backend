#!/bin/bash

BASE_URL="http://localhost:5040/api"

echo "Testing User Routes..."

echo "POST signUp"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/signUp" -H "Content-Type: application/json" -d '{"fullName":"Test User","email":"testuser@example.com","password":"password123","confirmPassword":"password123"}')
echo "$SIGNUP_RESPONSE"

echo "POST loginUser"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/loginUser" -H "Content-Type: application/json" -d '{"email":"testuser@example.com","password":"password123"}')
echo "$LOGIN_RESPONSE"

# Extract token from login response (assuming JSON response with token field)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "Failed to extract token from login response"
  exit 1
fi

# Extract user ID from login response
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$USER_ID" ]; then
  echo "Failed to extract user ID from login response"
  exit 1
fi

echo "Using token: $TOKEN"
echo "Using user ID: $USER_ID"

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "GET all users"
curl -s -X GET "$BASE_URL/getAll" -H "$AUTH_HEADER"

echo "GET one user"
curl -s -X GET "$BASE_URL/getOne/$USER_ID" -H "$AUTH_HEADER"

echo "POST logout"
curl -s -X POST "$BASE_URL/logout" -H "$AUTH_HEADER"

echo "PATCH update user"
curl -s -X PATCH "$BASE_URL/update/$USER_ID" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d '{"fullName":"Updated User"}'

# echo "DELETE deleteOne"
# curl -s -X DELETE "$BASE_URL/deleteOne/$USER_ID" -H "$AUTH_HEADER"

echo "Testing Chat Routes..."

CHAT_BASE="$BASE_URL/chat"

echo "POST createChat"
CHAT_RESPONSE=$(curl -s -X POST "$CHAT_BASE" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d '{"title":"Test Chat"}')
echo "$CHAT_RESPONSE"
CHAT_ID=$(echo "$CHAT_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

echo "POST sendMessage with file upload"
curl -s -X POST "$CHAT_BASE/message" -H "$AUTH_HEADER" -F "file=@test_file.txt" -F "message=Hello" -F "chatId=$CHAT_ID"

echo "GET getChats"
curl -s -X GET "$CHAT_BASE" -H "$AUTH_HEADER"

echo "GET getChat"
curl -s -X GET "$CHAT_BASE/$CHAT_ID" -H "$AUTH_HEADER"

echo "DELETE deleteChat"
curl -s -X DELETE "$CHAT_BASE/$CHAT_ID" -H "$AUTH_HEADER"

echo "Testing Quiz Routes..."

QUIZ_BASE="$BASE_URL/quiz"

echo "POST getQuiz with file upload"
QUIZ_RESPONSE=$(curl -s -X POST "$QUIZ_BASE" -H "$AUTH_HEADER" -F "file=@test_file.txt" -F "topic=Test Topic" -F "difficulty=easy" -F "numQuestions=5")
echo "$QUIZ_RESPONSE"
QUIZ_ID=$(echo "$QUIZ_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$QUIZ_ID" ]; then
  echo "GET getQuizById"
  curl -s -X GET "$QUIZ_BASE/$QUIZ_ID" -H "$AUTH_HEADER"
fi

echo "GET getAllQuizzes"
curl -s -X GET "$QUIZ_BASE/history" -H "$AUTH_HEADER"

echo "Testing Upload Routes..."

echo "GET files"
curl -s -X GET "$BASE_URL/files" -H "$AUTH_HEADER"

echo "POST upload files"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/upload" -H "$AUTH_HEADER" -F "files=@test_file.txt")
echo "$UPLOAD_RESPONSE"

# Extract file ID from upload response (assuming JSON array with _id field)
FILE_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -z "$FILE_ID" ]; then
  echo "Failed to extract file ID from upload response"
else
  echo "DELETE delete file"
  curl -s -X DELETE "$BASE_URL/files/$FILE_ID" -H "$AUTH_HEADER"
fi

echo "GET activities"
curl -s -X GET "$BASE_URL/activities" -H "$AUTH_HEADER"

echo "Testing Reminder Routes..."

REMINDER_BASE="$BASE_URL/reminders"

echo "POST addReminder"
REMINDER_RESPONSE=$(curl -s -X POST "$REMINDER_BASE" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d '{"title":"Test Reminder","description":"Test Description","date":"2024-12-31","time":"12:00"}')
echo "$REMINDER_RESPONSE"
REMINDER_ID=$(echo "$REMINDER_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

echo "GET getReminders"
curl -s -X GET "$REMINDER_BASE" -H "$AUTH_HEADER"

if [ -n "$REMINDER_ID" ]; then
  echo "PUT updateReminder"
  curl -s -X PUT "$REMINDER_BASE/$REMINDER_ID" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d '{"title":"Updated Reminder"}'

  echo "PUT markSeen"
  curl -s -X PUT "$REMINDER_BASE/$REMINDER_ID/seen" -H "$AUTH_HEADER"

  echo "DELETE deleteReminder"
  curl -s -X DELETE "$REMINDER_BASE/$REMINDER_ID" -H "$AUTH_HEADER"
fi

echo "POST resetSample"
curl -s -X POST "$REMINDER_BASE/reset" -H "$AUTH_HEADER"

echo "POST test-email"
curl -s -X POST "$REMINDER_BASE/test-email" -H "$AUTH_HEADER" -H "Content-Type: application/json" -d '{"email":"test@example.com"}'

echo "POST test-scheduler"
curl -s -X POST "$REMINDER_BASE/test-scheduler" -H "$AUTH_HEADER"

echo "All tests completed."
