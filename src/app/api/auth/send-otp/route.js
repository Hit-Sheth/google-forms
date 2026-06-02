import dbConnect from '@/lib/db';
import OTP from '@/models/OTP';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email'; 
import crypto from 'crypto';
import { NextResponse } from 'next/server';

// Generates a cryptographically secure 6-digit code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export async function POST(req) {
  try {
    await dbConnect();
    const { email, purpose } = await req.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Email and purpose are required' }, { status: 400 });
    }

    if (!['register', 'reset_password'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid OTP purpose' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Flow-Specific Validations
    if (purpose === 'register') {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
      }
    }

    if (purpose === 'reset_password') {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (!existingUser) {
        return NextResponse.json({ message: 'If the email exists, an OTP was sent.' }, { status: 200 });
      }
    }

    // 2. Rate Limiting Check (Prevent spamming the email service)
    // Check if an OTP was generated for this email/purpose in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentOTP = await OTP.findOne({
      email: normalizedEmail,
      purpose,
      createdAt: { $gt: oneMinuteAgo }
    });

    if (recentOTP) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting another OTP.' },
        { status: 429 }
      );
    }

    // 3. Generate and Save the new OTP
    const otpCode = generateOTP();

    // Delete any old OTPs for this exact email and purpose so they only have 1 valid code
    await OTP.deleteMany({ email: normalizedEmail, purpose });

    await OTP.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose
    });

    // 4. Send the Email using your Google Cloud function
    const subject = purpose === 'register' 
      ? 'Verify your New Account' 
      : 'Password Reset Code';

    const emailBody = `
      <h2>Your Verification Code</h2>
      <p>Your 6-digit code is: <strong style="font-size: 24px;">${otpCode}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Assuming your sendEmail function takes an object like this:
    await sendOTPEmail(normalizedEmail, otpCode, purpose);

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
