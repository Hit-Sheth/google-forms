import Header from '@/components/Header';
import FormBuilder from '@/components/FormBuilder';

export default function NewFormPage() {
  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Create Form</h1>
          <p style={{ color: 'var(--text-muted)' }}>Build a dynamic, responsive question form.</p>
        </div>
        <FormBuilder />
      </main>
    </>
  );
}
