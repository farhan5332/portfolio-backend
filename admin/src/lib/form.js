// Converts between API documents and form state, based on the field configs in resources.jsx.

export const allFields = (resource) => resource.sections.flatMap((s) => s.fields);

const emptyValue = (field) => {
  if (field.default !== undefined) return structuredClone(field.default);
  switch (field.type) {
    case 'boolean':
      return false;
    case 'tags':
    case 'list':
    case 'pairs':
    case 'gallery':
      return [];
    case 'image':
      return { url: '', alt: '' };
    case 'select':
      return typeof field.options[0] === 'string' ? field.options[0] : field.options[0].value;
    default:
      return '';
  }
};

// API document -> form values
export const toFormValues = (resource, doc = {}) =>
  Object.fromEntries(
    allFields(resource).map((field) => {
      const raw = doc[field.name];
      if (raw === undefined || raw === null) return [field.name, emptyValue(field)];
      if (field.type === 'date') return [field.name, String(raw).slice(0, 10)];
      if (field.type === 'image') return [field.name, { url: raw.url ?? '', alt: raw.alt ?? '' }];
      return [field.name, structuredClone(raw)];
    })
  );

// Form values -> request body. Empty rows are dropped, empty dates become null (cleared).
export const toPayload = (resource, values) => {
  const body = {};

  for (const field of allFields(resource)) {
    const value = values[field.name];

    switch (field.type) {
      case 'date':
        if (value) body[field.name] = value;
        else if (field.nullable) body[field.name] = null;
        break;
      case 'number':
      case 'range':
        if (value !== '' && value !== null && value !== undefined) body[field.name] = Number(value);
        break;
      case 'tags':
      case 'list':
        body[field.name] = value.map((s) => s.trim()).filter(Boolean);
        break;
      case 'pairs':
        body[field.name] = value
          .map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? '').trim()])))
          .filter((row) => Object.values(row).some(Boolean));
        break;
      case 'gallery':
        body[field.name] = value.filter((img) => img.url);
        break;
      default:
        body[field.name] = value;
    }
  }
  return body;
};

// API errors are keyed like "socials.0.url"; show them on the "socials" field.
export const groupErrors = (fieldErrors = {}) => {
  const result = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    const name = key.split('.')[0];
    result[name] ??= key.includes('.') ? `${key.split('.').slice(1).join(' → ')}: ${message}` : message;
  }
  return result;
};

export const formatDate = (value, opts = { year: 'numeric', month: 'short', day: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString(undefined, opts) : '—';
