import dbConnect from './db';
import DailyLogBucket from '@/models/DailyLogBucket';

/**
 * Helper to log platform activities using the Optimized Bucket Pattern
 * @param {Object} params
 * @param {string} params.actorId - The ID of the user performing the action
 * @param {string} params.action - The specific target array field name in the schema
 * @param {string} [params.entityId] - The ID of the target resource being affected
 */
export async function logActivity({ actorId, action, entityId }) {
  try {
    // 1. Core initialization
    await dbConnect();

    const timestamp = new Date();
    const dateString = timestamp.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const bucketId = `${dateString}_${actorId}`;

    const logPayload = { timestamp };

    // 2. Strict mapping based on your updated sub-document criteria
    if (entityId) {
      const stringId = entityId.toString();

      if (['form_submission', 'form_creation', 'form_edit', 'form_deletion'].includes(action)) {
        logPayload.formId = stringId;
      } else if (action === 'reset_password') {
        logPayload.userId = stringId;
      } else if (action === 'employee_creation') {
        logPayload.createdEmployeeId = stringId;
      } else if (action === 'employee_promotion') {
        logPayload.promotedEmployeeId = stringId;
      } else if (action === 'response_deletion') {
        logPayload.responseId = stringId;
      }
    }

    // 3. Perform atomic operation pushing the transaction payload directly into the day's record
    await DailyLogBucket.updateOne(
      { _id: bucketId },
      {
        $set: { actor: actorId, dateString: dateString },
        $push: { [`logs.${action}`]: logPayload }
      },
      { upsert: true }
    );

  } catch (error) {
    // Gracefully isolate logging path crashes from consumer executions
    console.error('Activity Logging Failed:', error);
  }
}