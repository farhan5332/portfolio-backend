import { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { assetUrl } from '../lib/api.js';
import { Button, Field, Toggle } from './ui.jsx';
import { MediaPicker, UploadButton } from './media.jsx';

// Renders one form field from a config object (see src/resources.js).
export function FormField({ field, value, onChange, error }) {
  const id = `field-${field.name}`;
  const Input = INPUTS[field.type] ?? TextInput;
  const isToggle = field.type === 'boolean';

  return (
    <Field
      label={isToggle ? null : field.label}
      htmlFor={id}
      hint={field.hint}
      error={error}
      required={field.required}
      className={field.half ? '' : 'sm:col-span-2'}
    >
      <Input id={id} field={field} value={value} onChange={onChange} invalid={Boolean(error)} />
    </Field>
  );
}

function TextInput({ id, field, value, onChange, invalid }) {
  return (
    <input
      id={id}
      type={field.type === 'url' || field.type === 'email' ? field.type : 'text'}
      className={`input ${invalid ? 'input-error' : ''}`}
      value={value ?? ''}
      placeholder={field.placeholder}
      maxLength={field.max}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextArea({ id, field, value, onChange, invalid }) {
  return (
    <>
      <textarea
        id={id}
        rows={field.rows ?? 4}
        className={`input ${invalid ? 'input-error' : ''}`}
        value={value ?? ''}
        placeholder={field.placeholder}
        maxLength={field.max}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.max && (
        <p className="mt-1 text-right text-xs text-slate-400">
          {(value ?? '').length}/{field.max}
        </p>
      )}
    </>
  );
}

function NumberInput({ id, field, value, onChange, invalid }) {
  return (
    <input
      id={id}
      type="number"
      className={`input ${invalid ? 'input-error' : ''}`}
      value={value ?? ''}
      min={field.min}
      max={field.maxValue}
      step={field.step ?? 1}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
    />
  );
}

function RangeInput({ id, field, value, onChange }) {
  const v = value === '' || value == null ? field.min ?? 0 : value;
  return (
    <div className="flex items-center gap-4">
      <input
        id={id}
        type="range"
        className="w-full accent-indigo-600"
        min={field.min ?? 0}
        max={field.maxValue ?? 100}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="w-12 text-right text-sm font-medium text-slate-700 tabular-nums">
        {v}
        {field.suffix}
      </span>
    </div>
  );
}

function BooleanInput({ id, field, value, onChange }) {
  return (
    <div className="pt-1">
      <Toggle id={id} checked={value} onChange={onChange} label={field.label} />
    </div>
  );
}

function SelectInput({ id, field, value, onChange, invalid }) {
  const options = field.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <select
      id={id}
      className={`input ${invalid ? 'input-error' : ''}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function DateInput({ id, value, onChange, invalid }) {
  return (
    <input
      id={id}
      type="date"
      className={`input ${invalid ? 'input-error' : ''}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Chips: type and press Enter or comma. e.g. tech stack, tags
function TagInput({ id, field, value = [], onChange, invalid }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (items.length) onChange([...value, ...items]);
    setDraft('');
  };

  return (
    <div
      className={`input flex flex-wrap gap-1.5 ${invalid ? 'input-error' : ''} focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20`}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {tag}
          <button
            type="button"
            className="text-indigo-400 hover:text-indigo-700"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        id={id}
        className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
        placeholder={value.length ? '' : field.placeholder ?? 'Type and press Enter'}
        value={draft}
        onChange={(e) => (e.target.value.includes(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
      />
    </div>
  );
}

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

function RowActions({ index, length, onMove, onRemove }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Move up">
        ↑
      </Button>
      <Button size="sm" variant="ghost" disabled={index === length - 1} onClick={() => onMove(index, index + 1)} aria-label="Move down">
        ↓
      </Button>
      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => onRemove(index)} aria-label="Remove">
        ✕
      </Button>
    </div>
  );
}

// One text row per item. e.g. job highlights, service features
function ListInput({ id, field, value = [], onChange }) {
  const set = (i, v) => onChange(value.map((item, idx) => (idx === i ? v : item)));
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            id={i === 0 ? id : undefined}
            className="input"
            value={item}
            placeholder={field.placeholder}
            onChange={(e) => set(i, e.target.value)}
          />
          <RowActions
            index={i}
            length={value.length}
            onMove={(a, b) => onChange(move(value, a, b))}
            onRemove={(idx) => onChange(value.filter((_, j) => j !== idx))}
          />
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => onChange([...value, ''])}>
        + Add {field.itemLabel ?? 'item'}
      </Button>
    </div>
  );
}

// Rows of small objects. e.g. socials [{ platform, url }], stats [{ label, value }]
function PairListInput({ id, field, value = [], onChange }) {
  const set = (i, key, v) => onChange(value.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  const empty = Object.fromEntries(field.keys.map((k) => [k.name, '']));

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-2 sm:flex-row sm:items-center sm:border-0 sm:p-0">
          {field.keys.map((k, kIdx) => (
            <input
              key={k.name}
              id={i === 0 && kIdx === 0 ? id : undefined}
              className={`input ${k.grow ? 'sm:flex-[2]' : 'sm:flex-1'}`}
              placeholder={k.placeholder ?? k.label}
              aria-label={k.label}
              value={row[k.name] ?? ''}
              onChange={(e) => set(i, k.name, e.target.value)}
            />
          ))}
          <RowActions
            index={i}
            length={value.length}
            onMove={(a, b) => onChange(move(value, a, b))}
            onRemove={(idx) => onChange(value.filter((_, j) => j !== idx))}
          />
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={() => onChange([...value, { ...empty }])}>
        + Add {field.itemLabel ?? 'row'}
      </Button>
    </div>
  );
}

// { url, alt } - upload, pick from library, or paste a URL
function ImageInput({ id, value, onChange }) {
  const [picking, setPicking] = useState(false);
  const image = value ?? { url: '', alt: '' };
  const set = (patch) => onChange({ ...image, ...patch });

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 sm:w-48">
        {image.url ? (
          <img src={assetUrl(image.url)} alt={image.alt} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">No image</span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <UploadButton size="sm" onUploaded={(m) => set({ url: m.url, alt: image.alt || m.alt })}>
            Upload
          </UploadButton>
          <Button size="sm" variant="secondary" onClick={() => setPicking(true)}>
            Choose from library
          </Button>
          {image.url && (
            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => set({ url: '' })}>
              Remove
            </Button>
          )}
        </div>
        <input
          id={id}
          className="input"
          placeholder="...or paste an image URL"
          value={image.url ?? ''}
          onChange={(e) => set({ url: e.target.value })}
        />
        <input
          className="input"
          placeholder="Alt text (describes the image for screen readers & SEO)"
          aria-label="Alt text"
          maxLength={200}
          value={image.alt ?? ''}
          onChange={(e) => set({ alt: e.target.value })}
        />
      </div>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={(m) => set({ url: m.url, alt: image.alt || m.alt })} />
    </div>
  );
}

// [{ url, alt }, ...]
function GalleryInput({ value = [], onChange }) {
  const [picking, setPicking] = useState(false);
  const add = (m) => onChange([...value, { url: m.url, alt: m.alt || '' }]);
  const setAlt = (i, alt) => onChange(value.map((img, idx) => (idx === i ? { ...img, alt } : img)));

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((img, i) => (
            <div key={`${img.url}-${i}`} className="overflow-hidden rounded-lg border border-slate-200">
              <img src={assetUrl(img.url)} alt={img.alt} className="aspect-video w-full bg-slate-100 object-cover" />
              <div className="space-y-2 p-2">
                <input
                  className="input"
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${i + 1}`}
                  value={img.alt ?? ''}
                  onChange={(e) => setAlt(i, e.target.value)}
                />
                <RowActions
                  index={i}
                  length={value.length}
                  onMove={(a, b) => onChange(move(value, a, b))}
                  onRemove={(idx) => onChange(value.filter((_, j) => j !== idx))}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <UploadButton size="sm" onUploaded={add}>
          Upload images
        </UploadButton>
        <Button size="sm" variant="secondary" onClick={() => setPicking(true)}>
          Choose from library
        </Button>
      </div>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onSelect={add} />
    </div>
  );
}

// A URL to a document (e.g. resume PDF) - upload or paste
function FileInput({ id, field, value, onChange, invalid }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="space-y-2">
      <input
        id={id}
        className={`input ${invalid ? 'input-error' : ''}`}
        value={value ?? ''}
        placeholder={field.placeholder ?? 'https://... or upload a PDF'}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <UploadButton size="sm" kind="document" onUploaded={(m) => onChange(m.url)}>
          Upload PDF
        </UploadButton>
        <Button size="sm" variant="secondary" onClick={() => setPicking(true)}>
          Choose from library
        </Button>
        {value && (
          <a href={assetUrl(value)} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
            Open current file ↗
          </a>
        )}
      </div>
      <MediaPicker kind="document" open={picking} onClose={() => setPicking(false)} onSelect={(m) => onChange(m.url)} />
    </div>
  );
}

// Markdown textarea with a Write / Preview switch
function MarkdownInput({ id, field, value, onChange, invalid }) {
  const [tab, setTab] = useState('write');
  const html = useMemo(
    () => (tab === 'preview' ? DOMPurify.sanitize(marked.parse(value || '')) : ''),
    [tab, value]
  );
  const words = (value || '').trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className={`overflow-hidden rounded-lg border ${invalid ? 'border-red-400' : 'border-slate-300'} bg-white`}>
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2">
        <div className="flex">
          {['write', 'preview'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-3 py-2 text-xs font-medium capitalize ${tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">Markdown · {words} words</span>
      </div>
      {tab === 'write' ? (
        <textarea
          id={id}
          rows={field.rows ?? 14}
          className="block w-full resize-y border-0 px-3 py-2 font-mono text-sm focus:ring-0 focus:outline-none"
          value={value ?? ''}
          placeholder={field.placeholder ?? '## Heading\n\nWrite in **Markdown**...'}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="prose-preview min-h-40 px-4 py-3" dangerouslySetInnerHTML={{ __html: html || '<p class="text-slate-400">Nothing to preview</p>' }} />
      )}
    </div>
  );
}

const INPUTS = {
  text: TextInput,
  url: TextInput,
  email: TextInput,
  textarea: TextArea,
  markdown: MarkdownInput,
  number: NumberInput,
  range: RangeInput,
  boolean: BooleanInput,
  select: SelectInput,
  date: DateInput,
  tags: TagInput,
  list: ListInput,
  pairs: PairListInput,
  image: ImageInput,
  gallery: GalleryInput,
  file: FileInput,
};
