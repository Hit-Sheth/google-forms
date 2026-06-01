import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'FORM_CREATED', 'RESPONSE_DELETED'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityModel: { type: String, required: true }, // e.g., 'Form', 'Response'
  details: { type: Object }, // Store the metadata here
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);