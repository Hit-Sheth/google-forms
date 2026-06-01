'use client';

import { use } from 'react';
import Header from '@/components/Header';
import FormBuilder from '@/components/FormBuilder';

export default function EmployeeEditFormPage({ params }) {
  // Use React's 'use' hook to unwrap the params promise
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return (
    <>
      <Header />
      <main className="container" style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Edit Form Schema</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Modify form questions. Changes are saved for the entire form.
          </p>
        </div>
        
        {/* Pass isEmployee={true} to hide the Settings/Theme/Permission sidebar */}
        <FormBuilder 
          formId={id} 
          isEmployee={true} 
        />
      </main>
    </>
  );
}