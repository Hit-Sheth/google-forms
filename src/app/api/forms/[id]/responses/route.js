import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Get all responses for a form (Restricted to Admin and Authorized Employees)
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await Form.findById(id).populate('allowedEmployees', 'name email');
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Authorization check
    const isAdmin = user.role === 'admin';
    const isAllowedEmployee = user.role === 'employee' && form.allowedEmployees.some(emp => emp._id.toString() === user.userId);

    if (!isAdmin && !isAllowedEmployee) {
      return NextResponse.json({ error: 'You do not have access to view responses for this form' }, { status: 403 });
    }

    // Fetch responses and populate submitter name & email
    const responses = await Response.find({ form: id })
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      form,
      responses,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
