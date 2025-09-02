const {z} = require('zod')

const signupSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
    }),
})

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
    }),
})

const verifyOtpSchema = z.object({
    body: z.object({
        otp: z.string().min(6, 'OTP must be at least 6 characters long'),
    }),
})



module.exports = { signupSchema, loginSchema, verifyOtpSchema }