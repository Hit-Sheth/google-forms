import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

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

    let responseQuery = { form: id };

    // Role-based Access Control
    if (user.role === 'customer') {
      // Customers can ONLY ever see their own responses
      responseQuery.submittedBy = user.userId;
    } else if (user.role === 'employee') {
      // Find this employee's specific permission record for this form
      const empRecord = form.allowedEmployees.find(e => e.user.toString() === user.userId);
      
      if (!empRecord) {
        return NextResponse.json({ error: 'You are not assigned to this form' }, { status: 403 });
      }

      const perms = empRecord.permissions;

      if (!perms.canViewAll && !perms.canViewOwn) {
        return NextResponse.json({ error: 'You do not have permission to view responses for this form' }, { status: 403 });
      }

      // If they can only view their own submissions, filter the query
      if (!perms.canViewAll && perms.canViewOwn) {
        responseQuery.submittedBy = user.userId;
      }
      // If canViewAll is true, we leave the query alone to fetch everything
    }
    // If Admin, they automatically see everything, so query remains { form: id }

    const responses = await Response.find(responseQuery)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ form, responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}