const z = require('zod');

const updateMeSchema = z.object({
  body: z.object({
  fullName: z.string().min(1, 'Full name is required'),

    // userName: z.string().min(1, 'Username is required'),
    occupation: z.string().min(1, 'Occupation is required'),
    country: z.string().min(1, 'Country is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required')
  }),
});

module.exports = { updateMeSchema };