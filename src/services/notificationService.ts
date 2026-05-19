import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const notificationService = {
  async createNotification(userId: string, title: string, message: string, type: Notification['type'] = 'info') {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          read: false
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    // Initial fetch
    this.getNotifications(userId).then(callback);

    // Subscribe to changes with a unique channel name per call to avoid "after subscribe" errors
    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userId}` 
      }, async () => {
        const notifications = await this.getNotifications(userId);
        callback(notifications);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async getNotifications(userId: string) {
    const { data: rawData, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    
    // Sort manually if column naming is uncertain in the Order By
    const data = (rawData || []).sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.created_at || n.timestamp,
      read: n.read
    })) as Notification[];
  },

  async markAsRead(notificationId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id); // Secure with user_id
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  async notifyAdmin(title: string, message: string, type: Notification['type'] = 'info') {
    try {
      // 1. Get admin profile
      const { data: admin, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'adjeisikapasilas@gmail.com')
        .single();

      if (fetchError || !admin) {
        console.warn('Could not find admin profile for notifications');
        return;
      }

      // 2. Create notification for admin
      await this.createNotification(admin.id, title, message, type);
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id); // Secure with user_id
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  async broadcastToOrganizers(title: string, message: string, type: Notification['type'] = 'info') {
    try {
      // 1. Get all organizers
      const { data: organizers, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'organizer');

      if (fetchError) throw fetchError;
      if (!organizers || organizers.length === 0) return { success: true, count: 0 };

      // 2. Prepare notifications
      const notifications = organizers.map(org => ({
        user_id: org.id,
        title,
        message,
        type,
        read: false
      }));

      // 3. Bulk insert
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;
      
      return { success: true, count: organizers.length };
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }
};
