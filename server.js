const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loginapp')
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
});

// Enhanced User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@gmail\.com$/, 'Please enter a valid Gmail address']
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscore']
    },
    mobile: {
        type: String,
        required: true,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    securityQuestions: [{
        question: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        }
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// OTP Schema for temporary storage
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 10 minutes
    }
});

const User = mongoose.model('User', userSchema);
const OTP = mongoose.model('OTP', otpSchema);

// Email Configuration
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Email Function
// Replace the sendEmail function with this testing version
async function sendEmail(to, subject, html) {
    try {
        // Extract OTP from email content for testing
        const otpMatch = html.match(/<div class="otp-code">(\d{6})<\/div>/);
        const otp = otpMatch ? otpMatch[1] : 'OTP not found';
        
        console.log('📧 ========== EMAIL SIMULATION ==========');
        console.log('📧 To:', to);
        console.log('📧 Subject:', subject);
        console.log('🔢 OTP CODE:', otp);
        console.log('📧 =====================================');
        
        return true; // Always return success for testing
    } catch (error) {
        console.error('❌ Email simulation failed:', error);
        return false;
    }
}


// Routes

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Enhanced server working with OTP functionality!' });
});

// Send OTP Route
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/^[^\s@]+@gmail\.com$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid Gmail address'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Remove any existing OTP for this email
        await OTP.deleteMany({ email: email.toLowerCase() });
        
        // Save new OTP
        const otpRecord = new OTP({
            email: email.toLowerCase(),
            otp: otp
        });
        await otpRecord.save();

        // Email HTML template
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email Verification</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Verification</h1>
                    <p>Complete your account registration</p>
                </div>
                <div class="content">
                    <h2>Hello!</h2>
                    <p>Thank you for registering with us. To complete your account setup, please use the verification code below:</p>
                    
                    <div class="otp-box">
                        <p>Your verification code is:</p>
                        <div class="otp-code">${otp}</div>
                        <p><small>This code expires in 10 minutes</small></p>
                    </div>
                    
                    <p>If you didn't request this verification, please ignore this email.</p>
                    
                    <div class="footer">
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        // Send email
        const emailSent = await sendEmail(
            email, 
            'Email Verification - Your OTP Code', 
            emailHTML
        );

        if (emailSent) {
            console.log(`📧 OTP sent to: ${email}`);
            res.json({
                success: true,
                message: 'OTP sent successfully to your email'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }

    } catch (error) {
        console.error('❌ Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Verify Signup Route (Final Step)
app.post('/api/verify-signup', async (req, res) => {
    try {
        const { name, email, username, mobile, password, securityQuestions, otp } = req.body;

        console.log('🔐 Signup verification attempt:', email);

        // Validate all required fields
        if (!name || !email || !username || !mobile || !password || !securityQuestions || !otp) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Verify OTP
        const otpRecord = await OTP.findOne({ 
            email: email.toLowerCase(), 
            otp: otp 
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Hash security answers
        const hashedSecurityQuestions = securityQuestions.map(sq => ({
            question: sq.question,
            answer: bcrypt.hashSync(sq.answer.toLowerCase(), 10)
        }));

        // Create or update user
        let user;
        if (existingUser && !existingUser.isVerified) {
            // Update existing unverified user
            user = await User.findByIdAndUpdate(existingUser._id, {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                username: username.toLowerCase().trim(),
                mobile: mobile.trim(),
                password: hashedPassword,
                securityQuestions: hashedSecurityQuestions,
                isVerified: true,
                verificationToken: undefined,
                verificationExpires: undefined
            }, { new: true });
        } else {
            // Create new user
            user = new User({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                username: username.toLowerCase().trim(),
                mobile: mobile.trim(),
                password: hashedPassword,
                securityQuestions: hashedSecurityQuestions,
                isVerified: true
            });
            await user.save();
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        console.log('✅ User registration completed:', email);

        // Send welcome email
        const welcomeHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome!</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .welcome-box { background: white; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome ${name}!</h1>
                    <p>Your account has been successfully created</p>
                </div>
                <div class="content">
                    <div class="welcome-box">
                        <h2>Account Details</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Username:</strong> ${username}</p>
                        <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <p>You can now login to your account and start using our services!</p>
                    <p>If you have any questions, feel free to contact our support team.</p>
                </div>
            </div>
        </body>
        </html>`;

        await sendEmail(email, 'Welcome to Our Platform!', welcomeHTML);

        res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now login.'
        });

    } catch (error) {
        console.error('❌ Signup verification error:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field === 'email' ? 'Email' : 'Username'} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Enhanced Login Route
app.post('/api/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body.email);

        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user (can login with email or username)
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username,
                name: user.name
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful:', user.email);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                mobile: user.mobile
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Protected route middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Enhanced Dashboard route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -securityQuestions');
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Admin route to view all users
app.get('/api/admin/users', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Not allowed in production' });
        }

        const users = await User.find({}, {
            name: 1,
            email: 1,
            username: 1,
            mobile: 1,
            isVerified: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('❌ Admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
});
