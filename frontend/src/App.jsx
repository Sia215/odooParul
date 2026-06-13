import { useState } from 'react';
import LoginCard from './components/LoginCard';
import SignUpCard from './components/SignUpCard';

export default function App() {
  const [page, setPage] = useState('login');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      {page === 'login'
        ? <LoginCard onSwitchToSignUp={() => setPage('signup')} />
        : <SignUpCard onSwitchToLogin={() => setPage('login')} />
      }
    </div>
  );
}
