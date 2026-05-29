import Header from '@/components/Header';
import FormBuilder from '@/components/FormBuilder';

export default async function EditFormPage({ params }) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Edit Form Schema</h1>
          <p style={{ color: 'var(--text-muted)' }}>Modify questions or adjust employee response access permissions.</p>
        </div>
        <FormBuilder formId={id} />
      </main>
    </>
  );
}
