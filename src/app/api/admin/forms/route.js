import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET: List all forms (Admin gets all, Employee gets only allowed ones)
export async function GET(req) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let query = {};
    if (user.role === 'employee') {
      // Employees can only view forms they have access to
      query = { allowedEmployees: user.userId };
    }

    const forms = await Form.find(query)
      .populate('allowedEmployees', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new form (Admin only)
export async function POST(req) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, description, sections, allowedEmployees, active } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newForm = await Form.create({
      title,
      description: description || '',
      creator: user.userId,
      sections: sections || [],
      allowedEmployees: allowedEmployees || [],
      active: typeof active === 'boolean' ? active : true,
    });

    return NextResponse.json({
      message: 'Form created successfully',
      form: newForm,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}