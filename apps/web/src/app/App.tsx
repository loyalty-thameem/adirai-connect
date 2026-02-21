import { LoginCard } from '../features/auth/LoginCard';

export function App() {
  return (
    <main className="screen">
      <section className="phone-shell">
        <header>
          <p className="eyebrow">Adirai Connect</p>
          <h1>Community. Services. Complaints.</h1>
        </header>
        <LoginCard />
      </section>
    </main>
  );
}

