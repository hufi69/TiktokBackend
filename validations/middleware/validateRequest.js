
function validateRequest(schema) {
    return (req, res, next) => {
      console.log(req.body)
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        if (!result.success) {
            // Simple error handling that works with any Zod error format
            let errors = [];
            
            try {
                // Try to get errors from the standard ZodError format
                if (result.error.errors) {
                    errors = result.error.errors;
                } else if (result.error.issues) {
                    // Zod v3+ format
                    errors = result.error.issues;
                } else {
                    // Fallback: create a basic error
                    errors = [{
                        path: ['unknown'],
                        message: result.error.message || 'Validation failed',
                        code: 'validation_error'
                    }];
                }
                
                const formattedErrors = errors.map(err => ({
                    field: err.path ? err.path.join('.') : 'unknown',
                    message: err.message || 'Validation error',
                    code: err.code || 'unknown'
                }));

                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: formattedErrors
                });
                
            } catch (formatError) {
                // Ultimate fallback
                console.error('Error formatting validation errors:', formatError);
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: [{
                        field: 'unknown',
                        message: 'Validation error occurred',
                        code: 'format_error'
                    }]
                });
            }
        }

        // Replace req properties with validated data
        req.body = result.data.body || req.body;
        req.query = result.data.query || req.query;
        req.params = result.data.params || req.params;

        next();
    };
}

module.exports = validateRequest;