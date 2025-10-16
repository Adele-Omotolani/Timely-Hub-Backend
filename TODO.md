# TODO: Fix Signup Flow to Require Email Verification

## Backend Changes
- [x] Modify `signUp` controller: Remove token generation and return only a success message without user data or token.
- [x] Modify `loginUser` controller: Add check for `isEmailVerified` before allowing login.

## Frontend Changes
- [x] Update frontend `register` mutation response type to reflect no token/user returned.
- [x] Update `sigin.tsx`: After registration, show success message and redirect to login page (not dashboard).
- [x] Add new file: `EmailVerificationSuccess.tsx` component that handles post-verification login.

## Testing
- [x] Test signup: Should show message to check email, not log in.
- [x] Test email verification: After verification, user can access verification success page.
- [x] Test login: Unverified users blocked, verified users allowed.

## Activity Notifications
- [x] Add `sendActivityNotification` method to `notificationService.ts` for different activity types (reminder, quiz, chat, file).
- [x] Integrate activity notifications in `reminderController.ts` for new reminders.
- [x] Integrate activity notifications in `quizController.ts` for new quizzes.
- [x] Integrate activity notifications in `chatController.ts` for new chats.
- [x] Integrate activity notifications in `uploadController.ts` for file uploads.
