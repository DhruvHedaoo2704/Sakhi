import { useState, FormEvent } from 'react';
import { Shield, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!fullName.trim()) {
          throw new Error('Full name is required');
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-navy-900 via-space-navy-800 to-space-navy-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-neon-cyan-500 to-soft-lavender-500 rounded-full mb-4 shadow-neon-cyan">
            <Shield size={40} className="text-space-navy-900" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan-400 to-soft-lavender-400 bg-clip-text text-transparent">
            Sakhi
          </h1>
          <p className="text-gray-400 mt-2">Your safety companion</p>
        </div>

        <div className="bg-space-navy-700 rounded-2xl shadow-2xl p-8 border border-space-navy-600">
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-smooth ${
                isLogin
                  ? 'bg-neon-cyan-500 text-space-navy-900 shadow-neon-cyan'
                  : 'bg-space-navy-600 text-gray-400'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-smooth ${
                !isLogin
                  ? 'bg-soft-lavender-500 text-white shadow-neon-lavender'
                  : 'bg-space-navy-600 text-gray-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-space-navy-600 border border-space-navy-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan-500 focus:border-transparent transition-smooth"
                    placeholder="Enter your name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-space-navy-600 border border-space-navy-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan-500 focus:border-transparent transition-smooth"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-space-navy-600 border border-space-navy-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-cyan-500 focus:border-transparent transition-smooth"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-smooth haptic-press ${
                isLogin
                  ? 'bg-gradient-to-r from-neon-cyan-500 to-neon-cyan-600 hover:from-neon-cyan-600 hover:to-neon-cyan-700 shadow-neon-cyan'
                  : 'bg-gradient-to-r from-soft-lavender-500 to-soft-lavender-600 hover:from-soft-lavender-600 hover:to-soft-lavender-700 shadow-neon-lavender'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
