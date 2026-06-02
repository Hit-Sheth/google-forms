import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logger'; 
import { NextResponse } from 'next/server';

// GET: Get form details
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const form = await Form.findById(id).populate('allowedEmployees.user', 'name email');
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (user.role === 'employee') {
      // Check if employee is in the array of objects
      const isAllowed = form.allowedEmployees.some(emp => emp.user._id.toString() === user.userId);
      if (!isAllowed) {
        return NextResponse.json({ error: 'Unauthorized access to this form' }, { status: 403 });
      }
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update form (Admin or Authorized Employee)
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      title, description, sections, allowedEmployees, 
      settings, theme, defaultEmployeePermissions, active 
    } = body;

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check permission for employees
    if (user.role === 'employee') {
      const empRecord = form.allowedEmployees.find(e => e.user.toString() === user.userId);
      if (!empRecord || !(empRecord.permissions && empRecord.permissions.canEditForm === true)) {
        return NextResponse.json({ error: 'You do not have permission to edit this form' }, { status: 403 });
      }
    }

    // APPLY CHANGES: Both Admins and Authorized Employees can update core structure
    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (sections !== undefined) form.sections = sections;

    // ONLY Admins can update access, settings, and themes
    if (user.role === 'admin') {
      if (allowedEmployees !== undefined) form.allowedEmployees = allowedEmployees;
      if (settings !== undefined) form.settings = settings;
      if (theme !== undefined) form.theme = theme; 
      if (defaultEmployeePermissions !== undefined) form.defaultEmployeePermissions = defaultEmployeePermissions;
      if (active !== undefined) form.active = active;
    }

    await form.save();

    // NEW LOG FEATURE: Log form edit interaction into the daily user bucket
    await logActivity({
      actorId: user.userId,
      action: 'form_edit',
      entityId: form._id
    });

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete form (Admin only)
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const form = await Form.findByIdAndDelete(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const Response = (await import('@/models/Response')).default;
    await Response.deleteMany({ form: id });

    // NEW LOG FEATURE: Log form deletion clean and flat into the daily user bucket
    await logActivity({
      actorId: user.userId,
      action: 'form_deletion',
      entityId: id
    });

    return NextResponse.json({
      message: 'Form and all its responses deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}