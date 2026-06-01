import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['text', 'integer', 'dropdown', 'radio', 'checkbox','file'],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: {
    type: [String],
    default: [],
  },
  // Specific to 'file' type
  allowedFileTypes: {
    type: [String],
    default: [], // e.g., ['pdf', 'jpg', 'png']
  },
  maxFileSize: {
    type: Number, // in Megabytes
    default: 10, // Default max size: 10MB
  },
});

const SectionSchema = new mongoose.Schema(
  {
    id: { type: Number },
    title: String,
    description: String,
    questions: [QuestionSchema],
  },
);

const FormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a form title.'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sections: [SectionSchema],
    allowedEmployees: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Form || mongoose.model('Form', FormSchema);
