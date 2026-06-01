import dbConnect from './db';
import ActivityLog from '@/models/ActivityLog';

/**
 * Helper to log platform activities
 * @param {Object} params
 * @param {string} params.actorId - The ID of the user performing the action
 * @param {string} params.action - A clear string describing the action
 * @param {string} params.entityId - The ID of the object being modified/created
 * @param {string} params.entityModel - The name of the collection ('Form', 'Response', etc)
 * @param {Object} params.details - Extra metadata (like which fields were changed)
 */
export async function logActivity({ actorId, action, entityId, entityModel, details }) {
  try {
    // Ensure we are connected to the DB
    await dbConnect();
    
    await ActivityLog.create({
      actor: actorId,
      action,
      entityId,
      entityModel,
      details,
      createdAt: new Date()
    });
  } catch (error) {
    // We don't want to break the user's action just because the logger failed
    console.error('Activity Logging Failed:', error);
  }
}