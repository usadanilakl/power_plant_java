## Functionality

EmailFacadeService provides a way to notify users via email using 2 ways: API using certificate or manual - open email app with pre-built receiver, topic and message

ApiEmailService handles access authentication and provides a way to other services to send email: user-services provides data: from/to/cc/topic/message, ApiEmailService sends it. 

ManualEmailService - does the same thing as the ApiEmailService, but instead of calling API, it opens the default email app and sets values. 

EmailFacadeService receives data from user-services (to/from/topic/message/cc) - if ApiEmailService is available - uses it to send email. If ApiEmailService not available it uses manual to send it. 

reference to working setup with sending email via API: C:\Users\usada\my_projects\forms\src\main\java\com\jg\forms\services\email\EmailService.java