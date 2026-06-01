import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Fetch form schema for filling (Restricted to Customers)
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can access and fill forms' }, { status: 403 });
    }

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.active) {
      return NextResponse.json({ error: 'This form is no longer active' }, { status: 400 });
    }

    // Return the form schema
    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form for customer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Submit a form response (Restricted to Customers)
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers are allowed to submit responses' }, { status: 403 });
    }

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.active) {
      return NextResponse.json({ error: 'This form is no longer accepting responses' }, { status: 400 });
    }

    const { answers } = await req.json();
    if (!answers) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    // Validation
    const errors = {};
    const validatedAnswers = {};
    
    // Flatten the sections array to extract all questions for validation
    const allQuestions = form.sections?.flatMap(section => section.questions || []) || [];

    for (const question of allQuestions) {
      const value = answers[question.id];

      // Check required
      if (question.required) {
        let isMissing = false;
        if (value === undefined || value === null || value === '') {
          isMissing = true;
        } else if (Array.isArray(value) && value.length === 0) {
          isMissing = true;
        }
        
        if (isMissing) {
          errors[question.id] = 'This field is required';
          continue;
        }
      }

      if (value !== undefined && value !== null && value !== '') {
        // Validate type: integer
        if (question.type === 'integer') {
          const parsed = parseInt(value, 10);
          if (isNaN(parsed) || String(parsed) !== String(value).trim()) {
            errors[question.id] = 'Please enter a valid integer';
            continue;
          }
          validatedAnswers[question.id] = parsed;
        } else if (question.type === 'checkbox') {
          // Expect array
          if (!Array.isArray(value)) {
            errors[question.id] = 'Invalid checkboxes value';
            continue;
          }
          validatedAnswers[question.id] = value;
        } else if (question.type === 'file') {
          // Expect a URL string
          if (typeof value !== 'string' || !value.startsWith('/uploads/')) {
            errors[question.id] = 'Invalid file submission';
            continue;
          }
          validatedAnswers[question.id] = value;
        } else {
          validatedAnswers[question.id] = value;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', validationErrors: errors }, { status: 400 });
    }

    // Create the response
    const submission = await Response.create({
      form: form._id,
      submittedBy: user.userId,
      answers: validatedAnswers,
    });
    
    const [populatedSubmission, submitter] = await Promise.all([
      Response.findById(submission._id)
        .populate('submittedBy', 'name email')
        .lean(),

      User.findById(user.userId)
        .select('name email')
        .lean(),
    ]);

    // await Promise.allSettled([
    //   sendAdminNotification(form, populatedSubmission || submission),
    //   submitter?.email ? sendUserConfirmation(submitter.email, form, validatedAnswers) : Promise.resolve(),
    // ]);

    const { getIO } = require("@/lib/socket");
    const io = getIO();

    io.to(id.toString()).emit(
      "new-response",
      populatedSubmission
    );

    return NextResponse.json({
      message: 'Form submitted successfully!',
      submissionId: submission._id,
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting form response:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}