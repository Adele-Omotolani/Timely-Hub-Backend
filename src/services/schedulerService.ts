import * as cron from 'node-cron';
import { Reminder } from '../models/ReminderModel';
import { notificationService } from './notificationService';

class SchedulerService {
  private isRunning: boolean = false;

  startScheduler(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    // Run every minute to check for reminders
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndSendReminders();
      } catch (error) {
        console.error('Error in reminder scheduler:', error);
      }
    });

    this.isRunning = true;
    console.log('🔔 Reminder notification scheduler started - checking every minute');
  }

  stopScheduler(): void {
    // Note: node-cron doesn't provide a direct way to stop all jobs
    // In a production app, you'd want to store job references and destroy them
    this.isRunning = false;
    console.log('🔔 Reminder notification scheduler stopped');
  }

  private async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes ahead

      // Find reminders that are due within the next 5 minutes and haven't been notified yet
      const upcomingReminders = await Reminder.find({
        datetime: {
          $gte: now.toISOString(),
          $lte: fiveMinutesFromNow.toISOString()
        },
        notified: { $ne: true }
      }).populate('userId');

      if (upcomingReminders.length === 0) {
        return;
      }

      console.log(`📅 Found ${upcomingReminders.length} upcoming reminder(s) to notify`);

      for (const reminder of upcomingReminders) {
        try {
          await notificationService.sendReminderNotification(
            reminder.userId.toString(),
            reminder.title,
            reminder.datetime
          );

          // Mark as notified
          reminder.notified = true;
          await reminder.save();

          console.log(`✅ Notification sent for reminder: "${reminder.title}"`);
        } catch (error) {
          console.error(`❌ Failed to send notification for reminder "${reminder.title}":`, error);
        }
      }

    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Method to manually trigger reminder check (useful for testing)
  async triggerManualCheck(): Promise<void> {
    console.log('🔄 Manually triggering reminder check...');
    await this.checkAndSendReminders();
  }

  // Method to reset all notifications (useful for testing)
  async resetAllNotifications(): Promise<void> {
    try {
      const result = await Reminder.updateMany(
        { notified: true },
        { $unset: { notified: 1 } }
      );
      console.log(`🔄 Reset notifications for ${result.modifiedCount} reminders`);
    } catch (error) {
      console.error('Error resetting notifications:', error);
    }
  }
}

export const schedulerService = new SchedulerService();
