import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import dbConnect from '@/lib/db';

export { apiHandler };

function apiHandler(handler) {
    return async (req, ...args) => {
        try {
            // Ensure DB connection
            await dbConnect();

            // Execute handler
            const responseData = await handler(req, ...args);

            // If handler returns a NextResponse, return it directly (custom status codes, etc.)
            if (responseData instanceof NextResponse) {
                return responseData;
            }

            // Otherwise, wrap in standard success format
            return NextResponse.json({
                success: true,
                data: responseData
            }, { status: 200 });

        } catch (err) {
            console.error('API Error:', err);
            return errorHandler(err);
        }
    };
}

function errorHandler(err) {
    if (typeof err === 'string') {
        // custom application error
        const is404 = err.toLowerCase().endsWith('not found');
        const statusCode = is404 ? 404 : 400;
        return NextResponse.json({ success: false, error: err }, { status: statusCode });
    }

    if (err instanceof ZodError) {
        // Zod validation error
        return NextResponse.json({
            success: false,
            error: 'Validation Error',
            details: err.flatten().fieldErrors
        }, { status: 400 });
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // default to 500 server error
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
}
