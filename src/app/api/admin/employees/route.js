import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger'; 

// GET: List all employees and customers for search/promotion
export async function GET(req) {
  try {
    await dbConnect();
    const adminUser = await getUserFromRequest(req);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    
    // Create query
    const query = {
      role: { $ne: 'admin' }, // don't list admin users
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Direct employee creation by Admin
export async function POST(req) {
  try {
    await dbConnect();
    const adminUser = await getUserFromRequest(req);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'employee',
    });

    const actorId = adminUser.userId || adminUser._id; 

    await logActivity({
      actorId: actorId, // Use the unified variable
      action: 'EMPLOYEE_CREATED',
      entityId: employee._id,
      entityModel: 'User',
      details: { name, email }
    });

    return NextResponse.json(
      { message: 'Employee created successfully', employeeId: employee._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Change role (e.g. promote customer to employee)
export async function PUT(req) {
  try {
    await dbConnect();
    const adminUser = await getUserFromRequest(req);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (!['employee', 'customer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role type. Can only be employee or customer.' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.role = role;
    await user.save();

    return NextResponse.json({
      message: `User role updated successfully to ${role}`,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
