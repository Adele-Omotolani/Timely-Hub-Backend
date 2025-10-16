import nodemailer from 'nodemailer';
import { userModel } from '../models/userModel';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
      console.warn('   Please set EMAIL_USER and EMAIL_PASS environment variables to enable email notifications.');
      this.transporter = null as any;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your preferred email service
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      console.warn('⚠️  Email service not configured. Skipping email send.');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        ...options
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendReminderNotification(userId: string, reminderTitle: string, reminderTime: string): Promise<void> {
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }

      const subject = `⏰ Reminder: ${reminderTitle}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">🔔 Reminder Notification</h2>
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hi ${user.fullName},</p>
            <p style="font-size: 16px; color: #555; margin-bottom: 15px;">This is a reminder for:</p>
            <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin: 0 0 10px 0; font-size: 18px;">${reminderTitle}</h3>
              <p style="color: #666; margin: 0; font-size: 14px;">Scheduled for: ${new Date(reminderTime).toLocaleString()}</p>
            </div>
            <p style="font-size: 14px; color: #777; margin-top: 20px;">This reminder was set up in your TimelyHub account.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: user.email,
        subject,
        html
      });

    } catch (error) {
      console.error('Error sending reminder notification:', error);
      throw error;
    }
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    const subject = '🔐 Verify Your Email - TimelyHub';
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://timely-hub-frontend-paschal-vercel.vercel.app'}/verify-email?token=${verificationToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">🔐 Verify Your Email Address</h2>
          <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Welcome to TimelyHub!</p>
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">Please click the button below to verify your email address and complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0D9165; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #777; margin-bottom: 15px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${verificationUrl}</p>
          <p style="font-size: 14px; color: #777; margin-top: 20px;">This verification link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendActivityNotification(email: string, activityType: string, activityDetails: any): Promise<void> {
    let subject = '';
    let html = '';

    switch (activityType) {
      case 'reminder':
        subject = `⏰ Reminder Created: ${activityDetails.title}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">🔔 New Reminder Created</h2>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hi there!</p>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">You just created a new reminder:</p>
              <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2c5aa0; margin: 0 0 10px 0; font-size: 18px;">${activityDetails.title}</h3>
                <p style="color: #666; margin: 0; font-size: 14px;">Scheduled for: ${new Date(activityDetails.datetime).toLocaleString()}</p>
              </div>
              <p style="font-size: 14px; color: #777; margin-top: 20px;">This reminder has been added to your TimelyHub account.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
            </div>
          </div>
        `;
        break;

      case 'quiz':
        subject = `📚 Quiz Generated: ${activityDetails.topic}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">🧠 New Quiz Generated</h2>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hi there!</p>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">You just generated a new quiz:</p>
              <div style="background-color: #f0f9e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d5a27; margin: 0 0 10px 0; font-size: 18px;">${activityDetails.topic}</h3>
                <p style="color: #666; margin: 0; font-size: 14px;">${activityDetails.numQuestions} questions • ${activityDetails.difficulty} difficulty</p>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Source: ${activityDetails.source}</p>
              </div>
              <p style="font-size: 14px; color: #777; margin-top: 20px;">This quiz has been saved to your TimelyHub account.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
            </div>
          </div>
        `;
        break;

      case 'chat':
        subject = `💬 New Chat Started: ${activityDetails.title}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">💬 New Chat Started</h2>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hi there!</p>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">You just started a new chat:</p>
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">${activityDetails.title}</h3>
                <p style="color: #666; margin: 0; font-size: 14px;">Started: ${new Date(activityDetails.createdAt).toLocaleString()}</p>
              </div>
              <p style="font-size: 14px; color: #777; margin-top: 20px;">This chat has been saved to your TimelyHub account.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
            </div>
          </div>
        `;
        break;

      case 'file':
        subject = `📁 File Uploaded: ${activityDetails.originalName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">📁 File Uploaded</h2>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hi there!</p>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">You just uploaded a new file:</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 18px;">${activityDetails.originalName}</h3>
                <p style="color: #666; margin: 0; font-size: 14px;">Type: ${activityDetails.mimeType}</p>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Size: ${((activityDetails.size || 0) / 1024).toFixed(1)} KB</p>
              </div>
              <p style="font-size: 14px; color: #777; margin-top: 20px;">This file has been saved to your TimelyHub account.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
            </div>
          </div>
        `;
        break;

      default:
        subject = `📋 New Activity on TimelyHub`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">📋 New Activity</h2>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hi there!</p>
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">You just performed a new activity on TimelyHub.</p>
              <p style="font-size: 14px; color: #777; margin-top: 20px;">Check your account for more details.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
            </div>
          </div>
        `;
    }

    await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendTestEmail(email: string): Promise<void> {
    const subject = '🧪 Test Email from TimelyHub';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">✅ Test Email</h2>
          <p style="font-size: 16px; color: #555;">This is a test email from TimelyHub to verify your email settings.</p>
          <p style="font-size: 14px; color: #777; margin-top: 20px;">If you received this email, your notification system is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">TimelyHub - Stay organized, stay on time!</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html
    });
  }
}

export const notificationService = new NotificationService();
