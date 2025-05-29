import React from 'react';
import Head from 'next/head';

export default function TestStyledPage() {
  return (
    <div className="styled-test-page">
      <Head>
        <title>Styled Test Page</title>
      </Head>
      
      <header className="bg-primary text-white p-4">
        <div className="container">
          <h1 className="h1">FinSight Style Test</h1>
          <p>Testing font loading and styling</p>
        </div>
      </header>
      
      <main className="container p-4">
        <section className="card m-4">
          <h2 className="h2 text-primary">Font Test - SCProsperSans</h2>
          <p>This paragraph should use SCProsperSans font family.</p>
          <p><strong>Bold text test</strong> - Should use SCProsperSans-Bold</p>
          <p><em>Medium weight test</em> - Should use SCProsperSans-Medium</p>
          <p className="subtle-text">Light weight text - Should use SCProsperSans-Light</p>
        </section>
        
        <section className="card m-4">
          <h2 className="h2 text-primary">UI Components Test</h2>
          
          <div className="flex gap-4 m-4">
            <button className="primary-button">Primary Button</button>
            <button className="secondary-button">Secondary Button</button>
          </div>
          
          <div className="card p-4 m-4">
            <h3 className="h3">Nested Card</h3>
            <p>Testing card styling and spacing</p>
          </div>
        </section>
        
        <section className="card m-4">
          <h2 className="h2 text-primary">Typography Scale</h2>
          <h1 className="h1">Heading Level 1</h1>
          <h2 className="h2">Heading Level 2</h2>
          <h3 className="h3">Heading Level 3</h3>
          <h4 className="h4">Heading Level 4</h4>
          <p className="body-text">Body text example</p>
          <p className="caption-text">Caption text example</p>
        </section>
      </main>
      
      <footer className="bg-primary text-white p-4 text-center">
        <p>© 2025 SCB Sapphire FinSight</p>
      </footer>
      
      <style jsx>{`
        /* Custom styles for this test page */
        .styled-test-page {
          font-family: 'SCProsperSans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .bg-primary {
          background-color: rgb(0, 114, 170);
        }
        
        .text-primary {
          color: rgb(0, 114, 170);
        }
        
        .text-white {
          color: white;
        }
        
        .card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .p-4 {
          padding: 1rem;
        }
        
        .m-4 {
          margin: 1rem;
        }
        
        .flex {
          display: flex;
        }
        
        .gap-4 {
          gap: 1rem;
        }
        
        .text-center {
          text-align: center;
        }
        
        .h1, .h2, .h3, .h4 {
          margin-bottom: 0.5rem;
        }
        
        .h1 {
          font-size: 2rem;
          font-weight: 700;
        }
        
        .h2 {
          font-size: 1.75rem;
          font-weight: 600;
        }
        
        .h3 {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .h4 {
          font-size: 1.25rem;
          font-weight: 500;
        }
        
        .body-text {
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .caption-text {
          font-size: 0.875rem;
          color: #666;
        }
        
        .subtle-text {
          font-weight: 300;
          color: #555;
        }
        
        .primary-button {
          background-color: rgb(0, 114, 170);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
        }
        
        .secondary-button {
          background-color: white;
          color: rgb(0, 114, 170);
          border: 1px solid rgb(0, 114, 170);
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}