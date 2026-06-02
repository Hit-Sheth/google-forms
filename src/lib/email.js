import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// Get credentials from environment variables
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_USER, // The user email you're sending from (e.g., hittsheth@gmail.com)
} = process.env;

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Redirect URL, can be playground for server-side
);

oauth2Client.setCredentials({
  refresh_token: GMAIL_REFRESH_TOKEN,
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAnswer(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(escapeHtml).join(', ') : 'Not answered';
  }

  if (value === undefined || value === null || value === '') {
    return 'Not answered';
  }

  return escapeHtml(value);
}

/**
 * Creates a Nodemailer transporter using OAuth2 for Gmail.
 * It handles fetching a new access token whenever needed.
 */
async function createTransporter() {
  try {
    const { token: accessToken } = await oauth2Client.getAccessToken();

    if (!accessToken) {
      throw new Error('Failed to create access token.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: GMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: true, // Important for security
      },
    });

    return transporter;
  } catch (error) {
    console.error('Error creating nodemailer transporter:', error.message);
    // Log more details for debugging if needed
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    throw new Error('Could not create email transporter. Check OAuth credentials and permissions.');
  }
}

/**
 * A generic email sending function.
 * @param {object} mailOptions - The mail options (to, subject, html).
 */
async function sendEmail(mailOptions) {
  try {
    const emailTransporter = await createTransporter();
    await emailTransporter.sendMail({
      from: `"Forms" <${GMAIL_USER}>`, // Sender address
      ...mailOptions,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    // We log the error but don't re-throw it to prevent crashing the main process (e.g., form submission)
  }
}

/**
 * Sends a notification to the admin about a new form response.
 * @param {object} form - The form that was submitted.
 * @param {object} response - The response data.
 */
export async function sendAdminNotification(form, response) {
  const subject = `New Response Received for "${form.title}"`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">New Form Submission</h2>
        <p>A new response has been submitted for the form: <strong>${form.title}</strong>.</p>
        ${response?.submittedBy?.name ? `<p>Submitted by: <strong>${escapeHtml(response.submittedBy.name)}</strong></p>` : ''}
        ${response?.submittedBy?.email ? `<p>Submitter email: <strong>${escapeHtml(response.submittedBy.email)}</strong></p>` : ''}
        <p>Response ID: <strong>${response._id}</strong></p>
        <p>You can view the full response in the admin dashboard.</p>
        <hr>
        <p style="font-size: 0.8em; color: #888;">This is an automated notification.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject,
    html,
  });
}

/**
 * Sends a confirmation email to the user with their full response.
 * @param {string} userEmail - The email of the user who submitted the form.
 * @param {object} form - The form that was submitted.
 * @param {object} answers - The user's answers, mapped by question ID.
 */
export async function sendUserConfirmation(userEmail, form, answers) {
  const subject = `Your response to "${form.title}"`;

  const answersHtml = form.questions
    .map((q) => {
      const answer = answers?.[q.id];
      return `
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <p style="font-weight: bold; color: #555;">${escapeHtml(q.label)}</p>
          <p style="color: #333; margin-left: 10px;">${formatAnswer(answer)}</p>
        </div>
      `;
    })
    .join('');

  const html = `
    <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">Thank You for Your Response!</h2>
        <p>Here is a copy of your submission for the form: <strong>${escapeHtml(form.title)}</strong>.</p>
        <div style="margin-top: 20px;">
          ${answersHtml}
        </div>
        <hr>
        <p style="font-size: 0.8em; color: #888;">This is an automated confirmation.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * Sends an OTP verification email for signup or password reset.
 * @param {string} userEmail - The email to send the OTP to.
 * @param {string} otpCode - The 6-digit OTP code.
 * @param {string} purpose - 'register' or 'reset_password'
 */
export async function sendOTPEmail(userEmail, otpCode, purpose) {
  const subject = purpose === 'register' 
    ? 'Verify your New Account' 
    : 'Password Reset Code';

  const html = `
    <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="font-size: 16px; color: #555;">Please use the following 6-digit code to complete your request.</p>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #f0f7ff; border: 1px dashed #0066cc; border-radius: 8px; display: inline-block;">
            <strong style="font-size: 36px; color: #0066cc; letter-spacing: 6px;">${otpCode}</strong>
        </div>
        
        <p style="font-size: 14px; color: #888;">This code will expire in 5 minutes.</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #aaa;">If you did not request this, please ignore this email to ensure your account remains secure.</p>
      </div>
    </div>
  `;

  // Uses your existing un-exported sendEmail function!
  await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}