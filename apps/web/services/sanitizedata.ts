import DOMPurify from "dompurify";
/* eslint-disable @typescript-eslint/no-explicit-any */
export const sanitizeData = (formData: any): any => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sanitizedFormData: any = {};
    for (const key in formData) {
        if (Object.hasOwnProperty.call(formData, key)) {
            const value = formData[key];
            if (typeof value === 'string') {
                sanitizedFormData[key] = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
            } else if (value !== undefined) {
                sanitizedFormData[key] = value;
            }
        }
    }
    return sanitizedFormData;
};