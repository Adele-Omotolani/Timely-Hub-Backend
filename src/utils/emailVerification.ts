import crypto from 'crypto';
import { userModel } from '../models/userModel';
import { notificationService } from '../services/notificationService';

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (userId: string): Promise<void> => {
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await notificationService.sendEmailVerification(user.email, verificationToken);

  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const user = await userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired verification token' };
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null as any;
    user.emailVerificationExpires = null as any;
    await user.save();

    return { success: true, message: 'Email verified successfully' };

  } catch (error) {
    console.error('Error verifying email:', error);
    return { success: false, message: 'An error occurred during email verification' };
  }
};
