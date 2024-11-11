import { NextResponse, NextRequest } from 'next/server'
import nodemailer from 'nodemailer';

// Handles POST requests to /api

export async function POST(request: NextRequest) {
  const username = process.env.EMAIL_USERNAME;
  const password = process.env.EMAIL_PASSWORD;

  const formData = await request.formData()
  const email = formData.get('email') as string ;
  if (!email) {
    console.error('Email address is missing');
    return NextResponse.json({ message: "Error: Email address is missing" }, { status: 400 });
  }
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port : 465,
    secure: true,
    auth: {
      user: username,
      pass: password
    }
  });

  const mailOptions = {
    from: username,
    to: email,
    subject: subject,
    html: message
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return NextResponse.json({ message: "Success: email was sent" })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json(
      { message: "COULD NOT SEND MESSAGE" }, 
      { status: 500 }
    )
  }
}