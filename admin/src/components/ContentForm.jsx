import { FormField } from './fields.jsx';

// Renders every section of a resource config as a card with a 2-column grid.
export default function ContentForm({ resource, values, errors, onChange }) {
  return (
    <div className="space-y-6">
      {resource.sections.map((section) => (
        <section key={section.title} className="card p-5 sm:p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">{section.title}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {section.fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={(value) => onChange(field.name, value)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
