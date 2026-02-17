## Functionality

EmailFacadeService provides a way to notify users via email using 2 ways: API using certificate or manual - open email app with pre-built receiver, topic and message

ApiEmailService handles access authentication and provides a way to other services to send email: user-services provides data: from/to/cc/topic/message, ApiEmailService sends it.

ManualEmailService - does the same thing as the ApiEmailService, but instead of calling API, it opens the default email app and sets values.

EmailFacadeService receives data from user-services (to/from/topic/message/cc) - if ApiEmailService is available - uses it to send email. If ApiEmailService not available it uses manual to send it.

reference to working setup with sending email via API: C:\Users\usada\my_projects\forms\src\main\java\com\jg\forms\services\email\EmailService.java

## Usage

### Password Reset Emails

The `AuthController` uses `EmailFacadeService` for the forgot-password flow:

```java
emailFacadeService.sendEmail(EmailRequest.builder()
    .to(user.getEmail())
    .from(emailFrom)  // from application-secrets.properties: email.graph.from
    .subject("Password Reset - Power Plant Manager")
    .body("...reset link...")
    .build());
```

The reset email contains a link to `/app/reset-password?token={uuid}` with a 1-hour expiry. Email sending failure is logged but doesn't affect the API response (always returns 200 with generic message to prevent email enumeration).

**Files:**
- `sevice/email/EmailFacadeService.java` — facade (API primary, manual fallback)
- `sevice/email/ApiEmailService.java` — Microsoft Graph API with certificate auth
- `sevice/email/ManualEmailService.java` — opens default email client
- `dto/email/EmailRequest.java` — `@Data @Builder` with to/from/cc/subject/body/attachments
- `controller/auth/AuthController.java` — forgot-password endpoint (consumer)