import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: Get form details
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    
    // FIX: Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const form = await Form.findById(id).populate('allowedEmployees', 'name email');
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (user.role === 'employee' && !form.allowedEmployees.some(emp => emp._id.toString() === user.userId)) {
      return NextResponse.json({ error: 'Unauthorized access to this form' }, { status: 403 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update form (Admin only)
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    
    // FIX: Await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, description, sections, allowedEmployees, active, theme } = await req.json();

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (sections !== undefined) form.sections = sections;
    if (allowedEmployees !== undefined) form.allowedEmployees = allowedEmployees;
    if (theme !== undefined) form.theme = theme;
    if (active !== undefined) form.active = active;

    await form.save();

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
    
    // FIX: Await params
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

    return NextResponse.json({
      message: 'Form and all its responses deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}