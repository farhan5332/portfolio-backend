// True only for real 24-char hex MongoDB ids (mongoose.isValidObjectId also accepts any 12-char string).
export const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
