import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logger'; 
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    
    // Await params for Next.js 15 App Router compatibility
    const resolvedParams = await params;
    
    // Grab both the form ID and the response ID from the URL path
    const formId = resolvedParams.id; 
    const responseId = resolvedParams.responseId;

    // 1. Check Authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Strict Authorization Check (Admins Only)
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden: Only administrators have permission to delete responses.' 
      }, { status: 403 });
    }

    // 3. Verify the Form exists
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // 4. Find and Delete the specific response
    // Query by BOTH _id and form to ensure a responseId belongs to the correct form route
    const deletedResponse = await Response.findOneAndDelete({
      _id: responseId,
      form: formId
    });

    if (!deletedResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // 5. NEW LOG FEATURE: Log response deletion directly into the daily user bucket array
    await logActivity({
      actorId: user.userId,
      action: 'response_deletion',
      entityId: responseId
    });

    return NextResponse.json({
      message: 'Response successfully deleted'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}