const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const User = require('../models/User')

// In-memory OTP store
const otpStore = new Map()

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function verifyMailer() {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('SMTP Connected Successfully')
    return true
  } catch (err) {
    console.error('SMTP Connection Failed:', err)
    return false
  }
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function buildOtpEmail(otp) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#34d399,#047857);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Password Reset OTP</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Workflow360 · Secure Reset
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
                You requested a password reset.
                Use the OTP below to verify your identity.
                This code expires in <strong>10 minutes</strong>.
              </p>

              <div style="background:#f0fdf4;border:2px dashed #34d399;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                <p style="margin:0 0 6px;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                  Your OTP Code
                </p>

                <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#047857;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
              </div>

              <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:18px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11.5px;">
                Powered by
                <strong style="color:#059669;">Yencode Technologies</strong>
                · Workflow360
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// POST /auth/forgot-password
async function sendOtp(req, res) {
  try {
    const { email } = req.body || {}

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        message: 'Email is required',
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    console.log("normalizedemail",normalizedEmail);
    

    const user = await User.findOne({
      email: normalizedEmail,
    }).lean()
    console.log("userr",user);
    

    if (!user) {
      return res.json({status:false,
        message: 'user not found',
      })
    }

    const smtpOk = await verifyMailer()

    if (!smtpOk) {
      return res.status(500).json({
        message: 'SMTP connection failed',
      })
    }

    const otp = generateOTP()

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      verified: false,
    })

    const transporter = createTransporter()

    const emailsent = await transporter.sendMail({
      from: `"Workflow360" <${process.env.SMTP_FROM}>`,
      to: normalizedEmail,
      subject: 'Your Password Reset OTP - Workflow360',
      html: buildOtpEmail(otp),
    })

    console.log('MAIL RESPONSE:', emailsent)
    console.log('ACCEPTED:', emailsent.accepted)
    console.log('REJECTED:', emailsent.rejected)
    console.log('MESSAGE ID:', emailsent.messageId)

    if (
      emailsent.accepted &&
      emailsent.accepted.length > 0
    ) {
      return res.json({
        status: true,
        message: 'OTP sent successfully',
      })
    }

    return res.status(500).json({
      status: false,
      message: 'Failed to send email',
    })
  } catch (err) {
    console.error('sendOtp error:', err)

    return res.status(500).json({
      status: false,
      message: 'Failed to send OTP. Please try again.',
      error: err.message,
    })
  }
}

// POST /auth/verify-otp
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {}

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required',
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const entry = otpStore.get(normalizedEmail)

    if (!entry) {
      return res.status(400).json({
        message: 'OTP not found or expired.',
      })
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedEmail)

      return res.status(400).json({
        message: 'OTP has expired.',
      })
    }

    if (String(otp).trim() !== entry.otp) {
      return res.status(400).json({
        message: 'Invalid OTP.',
      })
    }

    entry.verified = true

    otpStore.set(normalizedEmail, entry)

    return res.json({
      status: true,
      message: 'OTP verified successfully.',
    })
  } catch (err) {
    console.error('verifyOtp error:', err)

    return res.status(500).json({
      message: 'Verification failed.',
    })
  }
}

// POST /auth/reset-password
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {}

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP and new password are required',
      })
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const entry = otpStore.get(normalizedEmail)

    if (!entry || !entry.verified) {
      return res.status(400).json({
        message: 'Please verify your OTP first.',
      })
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedEmail)

      return res.status(400).json({
        message: 'OTP expired.',
      })
    }

    if (String(otp).trim() !== entry.otp) {
      return res.status(400).json({
        message: 'Invalid OTP.',
      })
    }

    const user = await User.findOne({
      email: normalizedEmail,
    })

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      })
    }

    user.passwordHash = await bcrypt.hash(
      String(newPassword),
      10,
    )

    await user.save()

    otpStore.delete(normalizedEmail)

    return res.json({
      status: true,
      message: 'Password reset successfully.',
    })
  } catch (err) {
    console.error('resetPassword error:', err)

    return res.status(500).json({
      message: 'Reset failed.',
    })
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  resetPassword,
}