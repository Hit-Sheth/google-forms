import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

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

    // 1. Look for an existing draft by this user for this specific form
    let existingDraft = await Response.findOne({
      form: formId,
      submittedBy: user.userId,
      isDraft: true
    });

    if (existingDraft) {
      // 2a. Update the existing draft
      existingDraft.answers = answers;
      existingDraft.isDraft = isDraft; // If they clicked "Submit", this flips to false forever
      await existingDraft.save();
      
      return NextResponse.json(
        { message: isDraft ? 'Draft saved successfully' : 'Form submitted successfully' }, 
        { status: 200 }
      );
    } else {
      // 2b. Create a brand new response (either as a draft or a final submission)
      await Response.create({
        form: formId,
        submittedBy: user.userId,
        answers,
        isDraft
      });

      return NextResponse.json(
        { message: isDraft ? 'Draft saved successfully' : 'Form submitted successfully' }, 
        { status: 201 }
      );
    }
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

    // Check if the frontend is specifically asking for the user's active draft
    const isDraftRequest = req.nextUrl.searchParams.get('draft') === 'true';

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
      
      // Return just the draft answers (or null if they don't have one)
      return NextResponse.json({ draft: userDraft ? userDraft.answers : null });
    }

    // ---------------------------------------------------------
    // PATH 2: Fetching the list of responses for the Dashboard
    // ---------------------------------------------------------
    
    // CRITICAL: By putting isDraft: { $ne: true } here at the very top, 
    // it guarantees that NO ONE (not even admins) will ever see drafts in the dashboard!
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
    // If Admin, they automatically bypass the employee/customer checks. 
    // The query remains { form: id, isDraft: { $ne: true } }, meaning they see all FINAL submissions.

    const responses = await Response.find(responseQuery)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ form, responses });
    
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}