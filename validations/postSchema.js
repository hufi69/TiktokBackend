const z = require('zod');

const createPostSchema = z.object({
  body: z.object({
    content: z.string()
      .max(2000, 'Post content cannot exceed 2000 characters')
      .optional(),
    isPublic: z.boolean().optional().default(true),
    tags: z.array(z.string().min(1, 'Tag cannot be empty')).optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      address: z.string().optional()
    }).optional()
  })
});

const updatePostSchema = z.object({
  body: z.object({
    content: z.string()
      .max(2000, 'Post content cannot exceed 2000 characters')
      .optional(),
    isPublic: z.boolean().optional(),
    tags: z.array(z.string().min(1, 'Tag cannot be empty')).optional()
  })
});

const getPostsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    author: z.string().optional(),
    tags: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'popular']).optional().default('newest')
  })
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  getPostsSchema
};