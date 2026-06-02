import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Helper function to check form settings and user access
function validateFormAccessAndSettings(form, user) {
  // 1. Check if the form is globally active and accepting responses
  if (!form.active || (form.settings && form.settings.isAcceptingResponses === false)) {
    return { error: 'This form is no longer accepting responses', status: 400 };
  }

  // 2. Check time-based settings
  const now = new Date();
  if (form.settings?.startDate && now < new Date(form.settings.startDate)) {
    return { error: 'This form is not yet open for responses', status: 400 };
  }
  if (form.settings?.endDate && now > new Date(form.settings.endDate)) {
    return { error: 'This form has closed', status: 400 };
  }

  // 3. Check Role-Based and Granular Employee Access
  if (user.role === 'employee') {
    const empRecord = form.allowedEmployees.find(e => e.user.toString() === user.userId);
    if (!empRecord || !empRecord.permissions.canSubmit) {
      return { error: 'You do not have permission to submit this form', status: 403 };
    }
  } else if (user.role !== 'customer' && user.role !== 'admin') {
    // Failsafe for unknown roles
    return { error: 'Only customers, admins, or authorized employees can submit forms', status: 403 };
  }

  return null; // Passes all checks
}

// GET: Fetch form schema for filling
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Run our new settings & access checks
    const accessError = validateFormAccessAndSettings(form, user);
    if (accessError) {
      return NextResponse.json({ error: accessError.error }, { status: accessError.status });
    }

    // Return the form schema
    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form for filling:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// // POST: Submit a form response
// export async function POST(req, { params }) {
//   try {
//     await dbConnect();
//     const user = await getUserFromRequest(req);
//     const resolvedParams = await params;
//     const { id } = resolvedParams;

//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const form = await Form.findById(id);
//     if (!form) {
//       return NextResponse.json({ error: 'Form not found' }, { status: 404 });
//     }

//     // Run our new settings & access checks
//     const accessError = validateFormAccessAndSettings(form, user);
//     if (accessError) {
//       return NextResponse.json({ error: accessError.error }, { status: accessError.status });
//     }

//     // NEW: Enforce Limit One Response Per User
//     if (form.settings?.limitOnePerCustomer) {
//       const existingResponse = await Response.findOne({ form: id, submittedBy: user.userId });
//       if (existingResponse) {
//         return NextResponse.json({ error: 'You have already submitted a response to this form.' }, { status: 400 });
//       }
//     }

//     const { answers } = await req.json();
//     if (!answers) {
//       return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
//     }

//     // Validation
//     const errors = {};
//     const validatedAnswers = {};
    
//     // Flatten the sections array to extract all questions for validation
//     const allQuestions = form.sections?.flatMap(section => section.questions || []) || [];

//     for (const question of allQuestions) {
//       const value = answers[question.id];

//       // Check required
//       if (question.required) {
//         let isMissing = false;
//         if (value === undefined || value === null || value === '') {
//           isMissing = true;
//         } else if (Array.isArray(value) && value.length === 0) {
//           isMissing = true;
//         }
        
//         if (isMissing) {
//           errors[question.id] = 'This field is required';
//           continue;
//         }
//       }

//       if (value !== undefined && value !== null && value !== '') {
//         // Validate type: integer
//         if (question.type === 'integer') {
//           const parsed = parseInt(value, 10);
//           if (isNaN(parsed) || String(parsed) !== String(value).trim()) {
//             errors[question.id] = 'Please enter a valid integer';
//             continue;
//           }
//           validatedAnswers[question.id] = parsed;
//         } else if (question.type === 'checkbox') {
//           // Expect array
//           if (!Array.isArray(value)) {
//             errors[question.id] = 'Invalid checkboxes value';
//             continue;
//           }
//           validatedAnswers[question.id] = value;
//         } else if (question.type === 'file') {
//           // Expect a URL string
//           if (typeof value !== 'string' || !value.startsWith('/uploads/')) {
//             errors[question.id] = 'Invalid file submission';
//             continue;
//           }
//           validatedAnswers[question.id] = value;
//         } else {
//           validatedAnswers[question.id] = value;
//         }
//       }
//     }

//     if (Object.keys(errors).length > 0) {
//       return NextResponse.json({ error: 'Validation failed', validationErrors: errors }, { status: 400 });
//     }

//     // Create the response
//     const submission = await Response.create({
//       form: form._id,
//       submittedBy: user.userId,
//       answers: validatedAnswers,
//     });

//     // Log the activity
//     if (typeof logActivity === 'function') {
//       await logActivity({
//         actorId: user.userId,
//         action: 'FORM_SUBMITTED',
//         entityId: submission._id,
//         entityModel: 'Response',
//         details: { formId: form._id, title: form.title }
//       });
//     }
    
//     const [populatedSubmission, submitter] = await Promise.all([
//       Response.findById(submission._id)
//         .populate('submittedBy', 'name email')
//         .lean(),

//       User.findById(user.userId)
//         .select('name email')
//         .lean(),
//     ]);

//     const { getIO } = require("@/lib/socket");
//     const io = getIO();

//     io.to(id.toString()).emit(
//       "new-response",
//       populatedSubmission
//     );

//     return NextResponse.json({
//       message: form.settings?.confirmationMessage || 'Form submitted successfully!',
//       submissionId: submission._id,
//     }, { status: 201 });
//   } catch (error) {
//     console.error('Error submitting form response:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }