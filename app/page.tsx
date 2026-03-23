export default function Home() {
  return (
    <main className="shell">
      <section className="panel hero">
        <p className="eyebrow">Access Control</p>
        <h1>Role-Based Access Control Portal</h1>
        <p className="subtitle">
          Secure sign-in, role-based dashboards, and admin tools for your team.
        </p>
        <div className="actions">
          <a className="primary" href="/login">
            Sign in
          </a>
        </div>
      </section>
      <section className="panel info">
        <h2>How it works</h2>
        <ul className="list">
          <li>Admins manage roles, permissions, and users.</li>
          <li>Employees can sign in with email/password or a secure PIN.</li>
          <li>Dashboards adapt to each role automatically.</li>
        </ul>
      </section>
    </main>
  );
}
