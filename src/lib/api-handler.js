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
                data: responseData,
                message: null
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
        return NextResponse.json({ success: false, data: null, message: err }, { status: statusCode });
    }

    if (err instanceof ZodError) {
        // Zod validation error
        return NextResponse.json({
            success: false,
            message: 'Validation Error',
            data: err.flatten().fieldErrors
        }, { status: 400 });
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return NextResponse.json({ success: false, data: null, message: 'Unauthorized' }, { status: 401 });
    }

    // default to 500 server error, but if it's a known logic error like "Insufficient", make it 400
    if (err.message && (err.message.includes('Insufficient') || err.message.includes('غير كافية'))) {
        return NextResponse.json({ success: false, data: null, message: err.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, data: null, message: err.message }, { status: 500 });
}
