import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scale, Shield, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);

  const signIn = async (nextEmail, nextPassword) => {
    if (pending.current) return;
    pending.current = true;
    setError('');
    setLoading(true);
    try {
      await login(nextEmail, nextPassword);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    return signIn(email, password);
  };

  const populateDemo = () => {
    const env = import.meta.env;
    if (env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'true') {
      setError('Demo login is unavailable in this runtime. Use your existing account to sign in.');
      return;
    }
    const nextEmail = env.VITE_DEMO_EMAIL || '', nextPassword = env.VITE_DEMO_PASSWORD || '';
    if (!nextEmail || !nextPassword) {
      setError('Demo account credentials are not configured. Configure the existing demo account in the local startup settings.');
      return;
    }
    setEmail(nextEmail);
    setPassword(nextPassword);
    return signIn(nextEmail, nextPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
            <Scale className="w-10 h-10 text-blue-200" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Divorce & Family Law</h1>
          <p className="text-blue-200 text-lg">Navigator</p>
          <p className="text-blue-300/70 text-sm mt-2">Intelligent legal guidance powered by AI</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Sign In</h2>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              disabled={loading}
              onClick={populateDemo}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Shield size={18} />
              Log In as Demo
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Demo login uses the existing account configured for this local workspace.
          </p>
        </div>

        <p className="text-blue-300/50 text-xs text-center mt-6">
          AI-powered legal guidance. Not a substitute for professional legal advice.
        </p>
      </div>
    </div>
  );
}
