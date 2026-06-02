import mongoose from 'mongoose';

const DailyLogBucketSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "2026-06-02_userId"
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true }, // e.g. "2026-06-02"
  logs: {
    login: [{ timestamp: Date }],
    logout: [{ timestamp: Date }],
    form_submission: [{ timestamp: Date, formId: String }],
    reset_password: [{ timestamp: Date, userId: String }],
    // admin only actions
    employee_creation: [{ timestamp: Date, createdEmployeeId: String }],
    employee_promotion: [{ timestamp: Date, promotedEmployeeId: String }],
    form_creation: [{ timestamp: Date, formId: String }],
    form_deletion: [{ timestamp: Date, formId: String }],
    response_deletion: [{ timestamp: Date, responseId: String }],

    // admin + employee actions
    form_edit: [{ timestamp: Date, formId: String }],
    
    // Add other actions dynamically or hardcode them
  }
});

export default mongoose.models.DailyLogBucket || mongoose.model('DailyLogBucket', DailyLogBucketSchema);