import dbConnect from '@/lib/db';
import Form from '@/models/Form';
import Response from '@/models/Response';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(req);

    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Fetch all active forms (available to fill)
    const activeForms = await Form.find({ active: true })
      .select('title description questions createdAt')
      .sort({ createdAt: -1 });

    // 2. Fetch responses submitted by this user
    const submittedResponses = await Response.find({ submittedBy: user.userId })
      .populate('form', 'title description')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      activeForms,
      submittedResponses,
    });
  } catch (error) {
    console.error('Error fetching customer forms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
