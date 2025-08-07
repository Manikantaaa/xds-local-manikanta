import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeData = (formData: any) => {
    const sanitizedFormData: any = {};
    const jsFunctionPatterns = [
        /\b(alert|eval|Function|setTimeout|setInterval|console|on\w+)\b/i, // matches JS functions and event handlers
        /<script.*?>.*?<\/script>/gi, // blocks script tags
        /javascript:/i, // blocks inline JS
        /\bon\w+\s*=/i, // blocks onload=, onclick=, etc.
        /[\(\)\{\};]/ // blocks function call characters
    ];

    for (const key in formData) {
        if (Object.hasOwnProperty.call(formData, key)) {
            const value = formData[key];
            if (typeof value === 'string') {
                try {
                    const window = new JSDOM('').window;
                    const purify = DOMPurify(window);
                    // Check for restricted words or HTML tags
                    if (
                    jsFunctionPatterns.some((pattern) => pattern.test(value)) ||
                    /<[^>]+>/.test(value) // optional: extra safety for HTML tags
                    ) {
                        console.warn('Blocked malicious input:', value);
                        sanitizedFormData[key] = '';
                    } else {
                        sanitizedFormData[key] = purify.sanitize(value);
                    }
                } catch (error) {
                    console.error("Error while sanitizing data:", error);
                    sanitizedFormData[key] = value; // Fallback to original value
                }
            } else if (Array.isArray(value)) {
                // Recursively sanitize array items
                sanitizedFormData[key] = value.map((item) =>
                    typeof item === 'object' && item !== null ? sanitizeData(item) : item
                );
            } else if (typeof value === 'object' && value !== null) {
                // Recursively sanitize nested objects
                sanitizedFormData[key] = sanitizeData(value);
            } else if (value !== undefined) {
                sanitizedFormData[key] = value;
            }
        }
    }
    return sanitizedFormData;
};
