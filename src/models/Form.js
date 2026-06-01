import mongoose from 'mongoose';

// 1. The Permissions Template (Granular access per user)
const PermissionSchema = new mongoose.Schema({
  canSubmit: { type: Boolean, default: false },
  canViewOwn: { type: Boolean, default: true },
  canViewAll: { type: Boolean, default: false },
  canEditForm: { type: Boolean, default: false },
}, { _id: false });

// 2. Google Forms-Style Settings
const SettingsSchema = new mongoose.Schema({
  isAcceptingResponses: { type: Boolean, default: true },
  limitOnePerCustomer: { type: Boolean, default: false },
  confirmationMessage: { type: String, default: 'Your response has been recorded.' },
  showProgressBar: { type: Boolean, default: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
}, { _id: false });

// 3. Form Sections & Questions
const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'integer', 'dropdown', 'radio', 'checkbox', 'file'],
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
  allowedFileTypes: {
    type: [String],
    default: [],
  },
  maxFileSize: {
    type: Number,
    default: 10,
  },
}, { _id: false }); // Prevents mongoose from creating an extra _id since you use your own 'id'

const SectionSchema = new mongoose.Schema(
  {
    id: { type: Number },
    title: String,
    description: String,
    questions: [QuestionSchema],
  },
  { _id: false }
);

// 4. The Main Form Model
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

    // The overarching settings for how the form behaves
    settings: {
      type: SettingsSchema,
      default: () => ({})
    },

    // Visual Customization
    theme: {
      headerImage: { type: String, default: '' },
      primaryColor: { type: String, default: '#6366f1' },
      backgroundColor: { type: String, default: '#f8fafc' },
      fontFamily: { type: String, default: 'Inter, sans-serif' },
    },

    // Default permission template for NEW employees added to THIS form
    defaultEmployeePermissions: {
      type: PermissionSchema,
      default: () => ({}) 
    },
    
    // The Many-to-Many map: Which users have access, and what exact access do they have?
    allowedEmployees: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permissions: { type: PermissionSchema }
      }
    ],
    
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Form || mongoose.model('Form', FormSchema);