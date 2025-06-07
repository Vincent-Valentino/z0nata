package utils

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"

	"backend/models"
)

type EmailService struct {
	config models.EmailConfig
}

func NewEmailService(config models.EmailConfig) *EmailService {
	return &EmailService{
		config: config,
	}
}

func (e *EmailService) SendPasswordResetEmail(email, token, resetURL string) error {
	subject := "Reset Your Password - QuizApp"
	body := e.generatePasswordResetHTML(token, resetURL)

	return e.sendEmail(email, subject, body)
}

func (e *EmailService) SendVerificationEmail(email, token, verifyURL string) error {
	subject := "Verify Your Email - QuizApp"
	body := e.generateVerificationHTML(token, verifyURL)

	return e.sendEmail(email, subject, body)
}

func (e *EmailService) SendWelcomeEmail(email, fullName string) error {
	subject := "Welcome to QuizApp!"
	body := e.generateWelcomeHTML(fullName)

	return e.sendEmail(email, subject, body)
}

func (e *EmailService) sendEmail(to, subject, body string) error {
	auth := smtp.PlainAuth("", e.config.SMTPUsername, e.config.SMTPPassword, e.config.SMTPHost)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s", to, subject, body))

	addr := fmt.Sprintf("%s:%d", e.config.SMTPHost, e.config.SMTPPort)
	return smtp.SendMail(addr, auth, e.config.FromEmail, []string{to}, msg)
}

func (e *EmailService) generatePasswordResetHTML(token, resetURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset your password for your QuizApp account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="{{.ResetURL}}?token={{.Token}}" class="button">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">{{.ResetURL}}?token={{.Token}}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The QuizApp Team</p>
    </div>
    <div class="footer">
        <p>This is an automated email. Please do not reply to this email.</p>
    </div>
</body>
</html>`

	t, _ := template.New("reset").Parse(tmpl)
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Token":    token,
		"ResetURL": resetURL,
	})
	return buf.String()
}

func (e *EmailService) generateVerificationHTML(token, verifyURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Verify Your Email Address</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>Welcome to QuizApp! Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email:</p>
        <a href="{{.VerifyURL}}?token={{.Token}}" class="button">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">{{.VerifyURL}}?token={{.Token}}</p>
        <p>If you didn't create an account with QuizApp, please ignore this email.</p>
        <p>Best regards,<br>The QuizApp Team</p>
    </div>
    <div class="footer">
        <p>This is an automated email. Please do not reply to this email.</p>
    </div>
</body>
</html>`

	t, _ := template.New("verify").Parse(tmpl)
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Token":     token,
		"VerifyURL": verifyURL,
	})
	return buf.String()
}

func (e *EmailService) generateWelcomeHTML(fullName string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to QuizApp</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366F1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to QuizApp!</h1>
    </div>
    <div class="content">
        <p>Hello {{.FullName}},</p>
        <p>Welcome to QuizApp! Your account has been successfully created and verified.</p>
        <p>You can now start using all the features available in our quiz platform.</p>
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        <p>Best regards,<br>The QuizApp Team</p>
    </div>
    <div class="footer">
        <p>This is an automated email. Please do not reply to this email.</p>
    </div>
</body>
</html>`

	t, _ := template.New("welcome").Parse(tmpl)
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"FullName": fullName,
	})
	return buf.String()
}
