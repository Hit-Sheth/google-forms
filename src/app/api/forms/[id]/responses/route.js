import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logger'; 
import { NextResponse } from 'next/server';
import { sendAdminNotification, sendUserConfirmation } from '@/lib/email';

// ==========================================
// POST: Submit a form OR Save a Draft
// ==========================================
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id: formId } = resolvedParams;

    
    // The frontend tells us if they clicked "Save Draft" (true) or "Submit" (false)
    const { answers, isDraft } = await req.json();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIX 1: Fetch the form document first so it's available for the email templates
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Look for an existing draft by this user for this specific form
    let existingDraft = await Response.findOne({
      form: formId,
      submittedBy: user.userId,
      isDraft: true
    });

    let finalResponseDocument;

    if (existingDraft) {
      // 2a. Update the existing draft
      existingDraft.answers = answers;
      existingDraft.isDraft = isDraft; // If they clicked "Submit", this flips to false forever
      finalResponseDocument = await existingDraft.save();
    } else {
      // 2b. Create a brand new response (either as a draft or a final submission)
      finalResponseDocument = await Response.create({
        form: formId,
        submittedBy: user.userId,
        answers,
        isDraft
      });
    }

    // NEW LOG & NOTIFICATION FEATURE: Triggers only on final submission execution
    if (!isDraft) {
      await logActivity({
        actorId: user.userId,
        action: 'form_submission',
        entityId: formId
      });

      // FIX 2: Safely pass defined metadata properties to email worker templates
      // user.email comes directly from your decrypted authentication token payload
      
      await Promise.allSettled([
        sendAdminNotification(form, finalResponseDocument),
        user?.email ? sendUserConfirmation(user.email, form, answers) : Promise.resolve(),
      ]);
    }

    return NextResponse.json(
      { message: isDraft ? 'Draft saved successfully' : 'Form submitted successfully' }, 
      { status: existingDraft ? 200 : 201 }
    );

  } catch (error) {
    console.error('Error saving response/draft:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ==========================================
// GET: Fetch user's draft OR Fetch completed responses for dashboard
// ==========================================
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // FIX 3: Standardized URL parsing to prevent potential runtime errors depending on incoming request instances
    const { searchParams } = new URL(req.url);
    const isDraftRequest = searchParams.get('draft') === 'true';

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // ---------------------------------------------------------
    // PATH 1: Fetching a single draft to pre-fill the form
    // ---------------------------------------------------------
    if (isDraftRequest) {
      const userDraft = await Response.findOne({
        form: id,
        submittedBy: user.userId,
        isDraft: true
      });
      
      return NextResponse.json({ draft: userDraft ? userDraft.answers : null });
    }

    // ---------------------------------------------------------
    // PATH 2: Fetching the list of responses for the Dashboard
    // ---------------------------------------------------------
    let responseQuery = { 
      form: id,
      isDraft: { $ne: true } 
    };

    // Role-based Access Control
    if (user.role === 'customer') {
      // Customers can ONLY ever see their own completed responses
      responseQuery.submittedBy = user.userId;
      
    } else if (user.role === 'employee') {
      // Find this employee's specific permission record for this form
      const empRecord = form.allowedEmployees.find(e => e.user.toString() === user.userId);
      
      if (!empRecord) {
        return NextResponse.json({ error: 'You are not assigned to this form' }, { status: 403 });
      }

      const perms = empRecord.permissions;

      if (!perms.canViewAll && !perms.canViewOwn) {
        return NextResponse.json({ error: 'You do not have permission to view responses' }, { status: 403 });
      }

      // If they can only view their own submissions, filter the query
      if (!perms.canViewAll && perms.canViewOwn) {
        responseQuery.submittedBy = user.userId;
      }
    }

    const responses = await Response.find(responseQuery)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ form, responses });
    
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}