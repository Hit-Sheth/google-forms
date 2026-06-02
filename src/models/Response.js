import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // answers will map questionId to the submitted value (string, number, or array of strings)
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isDraft: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Response || mongoose.model('Response', ResponseSchema);
