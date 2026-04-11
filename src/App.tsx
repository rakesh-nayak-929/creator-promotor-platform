import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Star,
  Instagram,
  Youtube,
  Globe,
  Filter,
  LayoutDashboard,
  Send,
  Music,
  AlertCircle,
  ExternalLink,
  Twitter,
  Info,
  MapPin,
  Briefcase,
  Clock,
  Shield,
  Check,
  CheckCheck,
  Sun,
  Moon,
  Camera
} from 'lucide-react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc,
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { useAuth, AuthProvider } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ErrorBoundary } from './ErrorBoundary';
import { cn, formatDate, formatChatTime, formatFullDateTime } from './utils';

const createNotification = async (userId: string, title: string, message: string, type: 'collaboration' | 'message' | 'status', link?: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link: link || '',
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-none',
    secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
    outline: 'border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800',
    ghost: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-8 py-4 text-lg font-semibold'
  };

  return (
    <button 
      className={cn(
        'rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
);

const NotificationDropdown = ({ notifications, onClose, onMarkAsRead, onTabChange }: { notifications: any[], onClose: () => void, onMarkAsRead: (id: string) => void, onTabChange?: (tab: string) => void }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden z-[100]">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
        <h3 className="font-bold text-zinc-900 dark:text-white">Notifications</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          <Plus className="rotate-45" size={20} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={cn(
                "p-4 border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer relative group",
                !n.read && "bg-orange-50/50 dark:bg-orange-900/10"
              )}
              onClick={() => {
                onMarkAsRead(n.id);
                if (onTabChange) {
                  if (n.type === 'message') onTabChange('messages');
                  else if (n.type === 'collaboration' || n.type === 'status') onTabChange('collaborations');
                }
                onClose();
              }}
            >
              {!n.read && <div className="absolute top-4 right-4 w-2 h-2 bg-orange-600 rounded-full group-hover:scale-125 transition-transform"></div>}
              <div className="flex gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  n.type === 'collaboration' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                  n.type === 'message' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {n.type === 'collaboration' ? <Briefcase size={20} /> :
                   n.type === 'message' ? <MessageSquare size={20} /> :
                   <Clock size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{n.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">{formatFullDateTime(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto text-zinc-200 mb-2" />
            <p className="text-sm text-zinc-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = ({ onAuthRequired, onTabChange }: { onAuthRequired?: (mode: 'signin' | 'signup') => void, onTabChange?: (tab: string) => void }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true });
      window.location.href = '/'; 
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              B
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">BringingOut</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/')} className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">Explore</button>
            <a href="#" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">How it works</a>
            <a href="#" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors relative"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 rounded-full border-2 border-white dark:border-zinc-900 text-[8px] text-white flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full"
                      >
                        <NotificationDropdown 
                          notifications={notifications} 
                          onClose={() => setIsNotifOpen(false)}
                          onMarkAsRead={handleMarkAsRead}
                          onTabChange={onTabChange}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-2 pl-4 border-l border-zinc-100 dark:border-zinc-800">
                  <button 
                    onClick={() => onTabChange?.('profile')}
                    className="focus:outline-none focus:ring-2 focus:ring-orange-600 rounded-full transition-all hover:opacity-80"
                    title="View Profile"
                  >
                    <img 
                      src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`} 
                      className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.email}`;
                      }}
                    />
                  </button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => onAuthRequired?.('signin')}>Sign In</Button>
                <Button size="sm" onClick={() => onAuthRequired?.('signup')}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const AuthModal = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin',
  initialRole = null
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialMode?: 'signin' | 'signup';
  initialRole?: 'creator' | 'promoter' | null;
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode and reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen, initialMode]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/network-request-failed') {
        message = "Network error: Please check your internet connection or disable any ad-blockers/VPNs that might be blocking Firebase.";
      } else if (err.code === 'auth/popup-blocked') {
        message = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = "Sign-in window was closed before completion. Please try again.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/invalid-credential') {
        message = mode === 'signin' 
          ? "Invalid email or password. If you don't have an account, please Sign Up first."
          : "This account might already exist or the credentials provided are invalid.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please Sign In instead.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (err.code === 'auth/network-request-failed') {
        message = "Network error: Please check your internet connection or disable any ad-blockers that might be blocking the connection.";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Too many attempts. Please try again in a few minutes.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {mode === 'signin' ? 'Sign in to continue your journey' : 'Join the community of creators'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Plus className="rotate-45 text-zinc-400 dark:text-zinc-500" size={24} />
            </button>
          </div>

          {/* Mode Toggle Tabs */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-8">
            <button 
              onClick={() => setMode('signin')}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                mode === 'signin' ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                mode === 'signup' ? "bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {error.includes("Network error") && (
                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-[11px] opacity-80 leading-tight bg-red-100/50 p-2 rounded-lg">
                      <strong>Troubleshoot:</strong> This often happens because the app is running in an iframe. Try opening the app in a new tab to bypass browser restrictions.
                    </span>
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
                    >
                      <ExternalLink size={14} />
                      Open App in New Tab
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:border-orange-600 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:border-orange-600 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:border-orange-600 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-medium text-zinc-700 dark:text-zinc-300"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
            Google
          </button>

          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-orange-600 dark:text-orange-500 font-semibold hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Views ---

const LandingView = ({ onJoin }: { onJoin: (role: 'creator' | 'promoter' | null, mode: 'signin' | 'signup') => void }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <Navbar onAuthRequired={(mode) => onJoin(null, mode)} />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-semibold mb-6">
                The #1 Hub for Creators & Promoters
              </span>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-8 leading-[1.1]">
                Connect. Collaborate. <br />
                <span className="text-orange-600">Grow Together.</span>
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                The bridge between visionaries and brands. Find the perfect match for your next campaign or content piece in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={() => onJoin('creator', 'signup')}
                >
                  Join as Creator <ArrowRight size={20} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => onJoin('promoter', 'signup')}
                >
                  Join as Promoter <ArrowRight size={20} />
                </Button>
              </div>
              <p className="mt-6 text-zinc-500 dark:text-zinc-400">
                Already have an account?{' '}
                <button 
                  onClick={() => onJoin(null, 'signin')}
                  className="text-orange-600 dark:text-orange-500 font-bold hover:underline"
                >
                  Sign In here
                </button>
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="text-orange-600 dark:text-orange-500" />,
                title: "Smart Discovery",
                desc: "Find partners based on niche, audience size, and engagement metrics."
              },
              {
                icon: <MessageSquare className="text-orange-600 dark:text-orange-500" />,
                title: "Direct Messaging",
                desc: "Secure, in-app communication to discuss deals and campaign details."
              },
              {
                icon: <CheckCircle2 className="text-orange-600 dark:text-orange-500" />,
                title: "Verified Profiles",
                desc: "Build trust with ratings, reviews, and verified platform connections."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const OnboardingView = ({ initialRole }: { initialRole: 'creator' | 'promoter' | null }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'creator' | 'promoter' | null>(initialRole);
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [followersCount, setFollowersCount] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email || Math.random()}`);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  const handleSubmit = async () => {
    if (!user || !role) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL,
        role,
        niche,
        bio,
        location,
        followersCount: Number(followersCount) || 0,
        profileLink,
        createdAt: serverTimestamp(),
        platformLinks: [],
        audienceSize: 0,
        budgetRange: '',
        rating: 5.0,
        engagementRate: 0
      });
      window.location.reload();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const randomAvatars = [
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Felix`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Max`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Luna`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver`,
  ];

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full"
      >
        <Card className="p-8 md:p-12 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800">
            <motion.div 
              className="h-full bg-orange-600"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <div className="text-center mb-10">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 block">
              Step {step} of {totalSteps}
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              {step === 1 ? "Choose Your Path" : step === 2 ? "Tell Us More" : "Final Details"}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              {step === 1 ? "Are you here to create or to promote?" : "Help others find you by sharing your niche."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRole('creator')}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all text-center group",
                      role === 'creator' ? "border-orange-600 bg-orange-50 dark:bg-orange-900/20" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors", role === 'creator' ? "bg-orange-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700")}>
                      <Users size={24} />
                    </div>
                    <span className="font-bold block dark:text-white">Creator</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">I make content</span>
                  </button>
                  <button
                    onClick={() => setRole('promoter')}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all text-center group",
                      role === 'promoter' ? "border-orange-600 bg-orange-50 dark:bg-orange-900/20" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors", role === 'promoter' ? "bg-orange-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700")}>
                      <Bell size={24} />
                    </div>
                    <span className="font-bold block dark:text-white">Promoter</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">I promote brands</span>
                  </button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex gap-3">
                    <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      <strong>Tip:</strong> Creators can showcase their portfolio and metrics, while Promoters focus on campaign requirements.
                    </p>
                  </div>
                </div>
                <Button className="w-full py-4" disabled={!role} onClick={nextStep}>
                  Continue <ArrowRight size={18} />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Profile Photo</label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {randomAvatars.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPhotoURL(url)}
                          className={cn(
                            "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all",
                            photoURL === url ? "border-orange-600 scale-110 shadow-lg" : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                          )}
                        >
                          <img src={url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                      <button
                        onClick={() => setPhotoURL(user?.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email}`)}
                        className={cn(
                          "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center bg-zinc-100 dark:bg-zinc-800",
                          photoURL === user?.photoURL ? "border-orange-600 scale-110 shadow-lg" : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                        )}
                        title="Use Google Photo"
                      >
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Google" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users size={20} className="text-zinc-400" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="url"
                        placeholder="Or paste image URL..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Your Niche</label>
                    <input
                      type="text"
                      placeholder="e.g. Tech, Lifestyle, Gaming"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Short Bio</label>
                    <textarea
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all resize-none"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 py-4" onClick={prevStep}>Back</Button>
                  <Button className="flex-1 py-4" disabled={!niche || !bio} onClick={nextStep}>Next</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                      <input
                        type="text"
                        placeholder="e.g. New York, USA"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  {role === 'creator' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Followers Count</label>
                        <input
                          type="number"
                          placeholder="e.g. 10000"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                          value={followersCount}
                          onChange={(e) => setFollowersCount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Main Profile Link</label>
                        <input
                          type="url"
                          placeholder="https://instagram.com/yourprofile"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                          value={profileLink}
                          onChange={(e) => setProfileLink(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                    <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                      <strong>Final Tip:</strong> A complete profile gets 3x more collaboration requests. Make sure your bio highlights your unique value!
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 py-4" onClick={prevStep}>Back</Button>
                  <Button className="flex-1 py-4" disabled={!location || loading} onClick={handleSubmit}>
                    {loading ? "Creating Profile..." : "Complete Setup"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

const CollaborationModal = ({ targetUser, onClose }: { targetUser: any; onClose: () => void }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !targetUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'collaborations'), {
        promoterId: user.uid,
        creatorId: targetUser.uid,
        title,
        description,
        budget: Number(budget),
        minBudget: Number(minBudget),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Create notification for the target user
      await createNotification(
        targetUser.uid,
        "New Collaboration Offer",
        `${user.displayName} sent you a collaboration offer: "${title}"`,
        'collaboration',
        'collaborations'
      );

      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'collaborations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Send Collaboration Offer</h3>
              <p className="text-zinc-500 dark:text-zinc-400">To {targetUser.displayName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Plus className="rotate-45 text-zinc-400 dark:text-zinc-500" size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Campaign Title</label>
              <input
                type="text"
                placeholder="e.g. Summer Collection Shoutout"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Description & Requirements</label>
              <textarea
                placeholder="Describe what you're looking for..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Budget (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Min. Budget (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!title || !description || loading}>
              {loading ? "Sending..." : "Send Offer"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UserProfileModal = ({ userId, onClose }: { userId: string; onClose: () => void }) => {
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
          setUserProfile({ id: docSnap.id, ...docSnap.data() });
        }

        // Fetch ratings
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('toId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const ratingsSnap = await getDocs(ratingsQuery);
        setRatings(ratingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching user profile or ratings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const averageRating = ratings.length > 0 
    ? (ratings.reduce((acc, curr) => acc + curr.stars, 0) / ratings.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-100 dark:border-orange-900/30 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Loading profile...</p>
      </div>
    </div>
  );

  if (!userProfile) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={userProfile.photoURL} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-100 dark:border-zinc-800" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${userProfile.email || 'default'}`;
                }}
              />
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{userProfile.displayName}</h3>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{userProfile.email}</p>
                  {averageRating && (
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded text-yellow-700 dark:text-yellow-400 text-[10px] font-bold">
                      <Star size={10} className="fill-yellow-700 dark:fill-yellow-400" />
                      {averageRating}
                    </div>
                  )}
                </div>
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold rounded-full uppercase">
                  {userProfile.role}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Plus className="rotate-45 text-zinc-400 dark:text-zinc-500" size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Bio</label>
              <p className="text-zinc-700 dark:text-zinc-300 mt-1 text-sm">{userProfile.bio || "No bio set."}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Username</label>
                <p className="text-zinc-900 dark:text-white font-semibold text-sm">{userProfile.displayName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Niche</label>
                <p className="text-zinc-900 dark:text-white font-semibold text-sm">{userProfile.niche}</p>
              </div>
            </div>

            {userProfile.role === 'creator' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Audience Stats</label>
                <div className="flex gap-4 mt-1">
                  <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-700 flex-1">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">Followers</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{(userProfile.followersCount || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-700 flex-1">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">Engagement</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{userProfile.engagementRate || 0}%</p>
                  </div>
                </div>
              </div>
            )}

            {userProfile.profileLink && (
              <a 
                href={userProfile.profileLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium dark:text-zinc-200">View Portfolio</span>
                </div>
                <ExternalLink size={14} className="text-zinc-400 dark:text-zinc-500" />
              </a>
            )}

            {ratings.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 block">Recent Reviews</label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {ratings.map((r) => (
                    <div key={r.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={10} 
                              className={cn(i < r.stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-200 dark:text-zinc-700")} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.review && <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">"{r.review}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Button className="w-full" onClick={onClose}>Close Profile</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PublicRequestModal = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [niche, setNiche] = useState(profile?.niche || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'publicRequests'), {
        promoterId: user.uid,
        promoterName: profile?.displayName || 'A Promoter',
        promoterPhoto: profile?.photoURL || '',
        promoterRole: profile?.role || 'promoter',
        promoterEmail: profile?.email || '',
        title,
        description,
        budget: Number(budget),
        niche,
        status: 'open',
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'publicRequests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Post Public Campaign</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Open this request to all creators</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Plus className="rotate-45 text-zinc-400 dark:text-zinc-500" size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Campaign Title</label>
              <input
                type="text"
                placeholder="e.g. Need 5 Creators for Summer Launch"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Description & Requirements</label>
              <textarea
                placeholder="Describe the campaign and what you expect from creators..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Budget (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Target Niche</label>
                <input
                  type="text"
                  placeholder="e.g. Fashion"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!title || !description || loading}>
              {loading ? "Posting..." : "Post Campaign"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RatingModal = ({ targetUser, onClose }: { targetUser: any; onClose: () => void }) => {
  const { user } = useAuth();
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !targetUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'ratings'), {
        fromId: user.uid,
        toId: targetUser.uid,
        stars,
        review,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'ratings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Rate {targetUser.displayName}</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Share your experience with this user</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Plus className="rotate-45 text-zinc-400 dark:text-zinc-500" size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setStars(s)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star 
                    size={40} 
                    className={cn(
                      "transition-colors",
                      s <= stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-200 dark:text-zinc-700"
                    )} 
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Review (Optional)</label>
              <textarea
                placeholder="How was the collaboration? (optional)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none resize-none"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface Message {
  id: string;
  senderId: string;
  text: string;
  seen: boolean;
  createdAt: any;
}

const ChatView = ({ collaboration, onClose }: { collaboration: any; onClose: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'collaborations', collaboration.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
      
      // Mark unseen messages as seen
      msgs.forEach(async (msg) => {
        if (msg.senderId !== user?.uid && !msg.seen) {
          try {
            await updateDoc(doc(db, 'collaborations', collaboration.id, 'messages', msg.id), {
              seen: true
            });
          } catch (err) {
            console.error("Error marking message as seen:", err);
          }
        }
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `collaborations/${collaboration.id}/messages`);
    });

    return () => unsubscribe();
  }, [collaboration.id, user?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    try {
      await addDoc(collection(db, 'collaborations', collaboration.id, 'messages'), {
        senderId: user.uid,
        text: newMessage,
        seen: false,
        createdAt: serverTimestamp()
      });

      // Notify the other party
      const recipientId = user.uid === collaboration.promoterId ? collaboration.creatorId : collaboration.promoterId;
      await createNotification(
        recipientId,
        "New Message",
        `You have a new message in "${collaboration.title}"`,
        'message',
        'messages'
      );

      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `collaborations/${collaboration.id}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
            <Plus className="rotate-45" size={20} />
          </Button>
          <h3 className="font-bold text-zinc-900 dark:text-white">{collaboration.title}</h3>
        </div>
        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full uppercase">
          {collaboration.status}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          const showDate = idx === 0 || formatDate(messages[idx-1].createdAt) !== formatDate(msg.createdAt);
          
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[75%] p-3 rounded-2xl text-sm shadow-sm",
                  isMe ? "bg-orange-600 text-white rounded-tr-none" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
                <div className={cn("flex items-center gap-1 mt-1 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    {formatChatTime(msg.createdAt)}
                  </span>
                  {isMe && (
                    msg.seen ? (
                      <CheckCheck size={12} className="text-blue-500" />
                    ) : (
                      <Check size={12} className="text-zinc-300 dark:text-zinc-600" />
                    )
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 bg-zinc-50/30 dark:bg-zinc-800/30">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-orange-600 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={!newMessage.trim()}>
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

const EditProfileModal = ({ profile, onClose }: { profile: any; onClose: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    photoURL: profile?.photoURL || '',
    bio: profile?.bio || '',
    niche: profile?.niche || '',
    followersCount: profile?.followersCount || 0,
    profileLink: profile?.profileLink || '',
    audienceSize: profile?.audienceSize || 0,
    engagementRate: profile?.engagementRate || 0,
  });

  const randomAvatars = [
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Felix`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Max`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Luna`,
    `https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver`,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        followersCount: Number(formData.followersCount),
        audienceSize: Number(formData.audienceSize),
        engagementRate: Number(formData.engagementRate),
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-8"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Profile</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Update your details for better visibility</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Plus className="rotate-45 text-zinc-400 dark:text-zinc-500" size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Profile Photo</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {randomAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, photoURL: url })}
                    className={cn(
                      "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all",
                      formData.photoURL === url ? "border-orange-600 scale-110 shadow-lg" : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    )}
                  >
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, photoURL: user?.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email}` })}
                  className={cn(
                    "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center bg-zinc-100 dark:bg-zinc-800",
                    formData.photoURL === user?.photoURL ? "border-orange-600 scale-110 shadow-lg" : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                  )}
                  title="Use Google Photo"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Google" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Users size={20} className="text-zinc-400" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                  value={formData.photoURL}
                  onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Display Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Bio</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none resize-none"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Niche</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                >
                  <option value="">Select Niche</option>
                  <option value="Tech">Tech</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Food">Food</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Followers Count</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                  value={formData.followersCount}
                  onChange={(e) => setFormData({ ...formData, followersCount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Profile Link (Instagram/YouTube)</label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                value={formData.profileLink}
                onChange={(e) => setFormData({ ...formData, profileLink: e.target.value })}
              />
            </div>
            {profile?.role === 'creator' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Audience Size</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                    value={formData.audienceSize}
                    onChange={(e) => setFormData({ ...formData, audienceSize: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Engagement Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-600 outline-none"
                    value={formData.engagementRate}
                    onChange={(e) => setFormData({ ...formData, engagementRate: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1" type="button" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const DashboardView = () => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minRating, setMinRating] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [publicRequests, setPublicRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [ratingUser, setRatingUser] = useState<any | null>(null);
  const [selectedCollab, setSelectedCollab] = useState<any | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPublicRequestModalOpen, setIsPublicRequestModalOpen] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    // Fetch potential matches
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', profile.role === 'creator' ? 'promoter' : 'creator'),
      limit(50)
    );

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch collaborations
    const collabField = profile.role === 'creator' ? 'creatorId' : 'promoterId';
    const collabQuery = query(
      collection(db, 'collaborations'),
      where(collabField, '==', user?.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubCollabs = onSnapshot(collabQuery, (snapshot) => {
      setCollaborations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch public requests
    const publicReqQuery = query(
      collection(db, 'publicRequests'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubPublicReqs = onSnapshot(publicReqQuery, (snapshot) => {
      setPublicRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch notifications for message count
    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user?.uid),
      where('type', '==', 'message'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubNotifs = onSnapshot(notifQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubCollabs();
      unsubPublicReqs();
      unsubNotifs();
    };
  }, [profile, user?.uid]);

  const handleUpdateStatus = async (collabId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'collaborations', collabId), { status: newStatus });
      
      // Notify the other party
      const collab = collaborations.find(c => c.id === collabId);
      if (collab) {
        const recipientId = profile?.role === 'creator' ? collab.promoterId : collab.creatorId;
        await createNotification(
          recipientId,
          "Collaboration Update",
          `The status of "${collab.title}" has been updated to ${newStatus}`,
          'status',
          'collaborations'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `collaborations/${collabId}`);
    }
  };

  const handleAcceptPublicRequest = async (request: any) => {
    if (!user || !profile || acceptingRequestId === request.id) return;
    
    // Double check status before proceeding
    if (request.status === 'filled') return;

    setAcceptingRequestId(request.id);
    try {
      // 1. Create a collaboration
      await addDoc(collection(db, 'collaborations'), {
        promoterId: request.promoterId,
        creatorId: user.uid,
        title: request.title,
        description: request.description,
        budget: request.budget,
        status: 'accepted',
        createdAt: serverTimestamp()
      });

      // 2. Mark request as filled
      await updateDoc(doc(db, 'publicRequests', request.id), {
        status: 'filled'
      });

      // 3. Notify promoter
      await createNotification(
        request.promoterId,
        "Public Request Accepted",
        `${profile.displayName} accepted your public campaign: "${request.title}"`,
        'collaboration',
        'collaborations'
      );

      setActiveTab('collaborations');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `publicRequests/${request.id}`);
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = !nicheFilter || u.niche === nicheFilter;
    const matchesFollowers = !minFollowers || (u.audienceSize || 0) >= Number(minFollowers);
    const matchesLocation = !locationFilter || u.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesRating = !minRating || (u.rating || 5.0) >= Number(minRating);
    return matchesSearch && matchesNiche && matchesFollowers && matchesLocation && matchesRating;
  });

  const stats = {
    active: collaborations.filter(c => c.status === 'accepted').length,
    pending: collaborations.filter(c => c.status === 'pending').length,
    total: collaborations.length
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Navbar onTabChange={setActiveTab} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <button 
              onClick={() => { setActiveTab('overview'); setSelectedCollab(null); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === 'overview' ? "bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none" : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
              )}
            >
              <LayoutDashboard size={20} /> Overview
            </button>
            <button 
              onClick={() => { setActiveTab('explore'); setSelectedCollab(null); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === 'explore' ? "bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none" : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
              )}
            >
              <Search size={20} /> Explore
            </button>
            <button 
              onClick={() => { setActiveTab('requests'); setSelectedCollab(null); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === 'requests' ? "bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none" : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
              )}
            >
              <Globe size={20} /> Public Requests
            </button>
            <button 
              onClick={() => { setActiveTab('collaborations'); setSelectedCollab(null); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === 'collaborations' ? "bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none" : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
              )}
            >
              <Briefcase size={20} /> Collaborations
            </button>
            <button 
              onClick={() => { setActiveTab('messages'); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === 'messages' ? "bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none" : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
              )}
            >
              <MessageSquare size={20} /> Messages
            </button>
            <button 
              onClick={() => { setActiveTab('profile'); setSelectedCollab(null); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === 'profile' ? "bg-orange-600 text-white shadow-lg shadow-orange-100 dark:shadow-none" : "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
              )}
            >
              <User size={20} /> My Profile
            </button>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <img 
                    src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email}`} 
                    className="w-10 h-10 rounded-lg object-cover border border-zinc-100 dark:border-zinc-800" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email || 'default'}`;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{profile?.displayName || user?.displayName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">{profile?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Overview</h2>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back, {profile?.displayName}</span>
                </div>

                {/* Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-white dark:bg-zinc-900 border-l-4 border-l-orange-600">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-500">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Collabs</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.active}</h3>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-white dark:bg-zinc-900 border-l-4 border-l-yellow-500">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pending Offers</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.pending}</h3>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-500">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Messages</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{notifications.length}</h3>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Collaborations</h3>
                    <div className="space-y-4">
                      {collaborations.slice(0, 3).map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                              <Briefcase size={18} className="text-zinc-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{c.title}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">{c.status}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => setActiveTab('collaborations')}>View</Button>
                        </div>
                      ))}
                      {collaborations.length === 0 && (
                        <p className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-sm italic">No recent activity</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Explore Recommendations</h3>
                    <div className="space-y-4">
                      {users.slice(0, 3).map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.photoURL} 
                              className="w-10 h-10 rounded-lg object-cover" 
                              referrerPolicy="no-referrer" 
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.email || 'default'}`;
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold text-zinc-900 dark:text-white">{u.displayName}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">{u.niche}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => setActiveTab('explore')}>Profile</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'explore' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Find {profile?.role === 'creator' ? 'Promoters' : 'Creators'}
                  </h2>
                  {profile?.role === 'promoter' && (
                    <Button onClick={() => setIsPublicRequestModalOpen(true)}>
                      <Plus size={18} /> Post Campaign
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-orange-600 outline-none transition-all dark:text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Filter size={18} className="text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Filters:</span>
                    </div>
                    <select 
                      className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-orange-600 dark:text-white"
                      value={nicheFilter}
                      onChange={(e) => setNicheFilter(e.target.value)}
                    >
                      <option value="">All Niches</option>
                      <option value="Tech">Tech</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Food">Food</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Location"
                      className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-orange-600 w-32 dark:text-white"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                    <select 
                      className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-orange-600 dark:text-white"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                    >
                      <option value="">Min. Rating</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4.0">4.0+ Stars</option>
                      <option value="3.5">3.5+ Stars</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Min. Followers"
                      className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-orange-600 w-32 dark:text-white"
                      value={minFollowers}
                      onChange={(e) => setMinFollowers(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    [1,2,3].map(i => <div key={i} className="h-64 bg-zinc-200 animate-pulse rounded-2xl"></div>)
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="p-6 hover:shadow-md transition-all group">
                          <div className="flex items-start justify-between mb-4">
                            <img 
                              src={u.photoURL} 
                              className="w-16 h-16 rounded-2xl object-cover border border-zinc-100 dark:border-zinc-800" 
                              referrerPolicy="no-referrer" 
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.email || 'default'}`;
                              }}
                            />
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex gap-1 items-center">
                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{u.rating || '5.0'}</span>
                              </div>
                              <button 
                                onClick={() => setRatingUser(u)}
                                className="text-[10px] font-bold text-orange-600 hover:underline"
                              >
                                Rate User
                              </button>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{u.displayName}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase tracking-wider">
                              {u.niche}
                            </span>
                            {u.location && (
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <MapPin size={10} /> {u.location}
                              </span>
                            )}
                          </div>
                          <div className="mb-4">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                              {(u.audienceSize || 0).toLocaleString()} followers
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 h-10">
                            {u.bio || "No bio provided yet."}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
                            <div className="flex gap-2">
                              <Instagram size={16} className="text-zinc-400 hover:text-orange-600 cursor-pointer" />
                              <Youtube size={16} className="text-zinc-400 hover:text-orange-600 cursor-pointer" />
                              <Music size={16} className="text-zinc-400 hover:text-orange-600 cursor-pointer" />
                            </div>
                            {profile?.role === 'promoter' && u.role === 'creator' ? (
                              <Button size="sm" onClick={() => setSelectedUser(u)}>Collaborate</Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>View Only</Button>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <Users size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No matches found</h3>
                      <p className="text-zinc-500 dark:text-zinc-400">Try adjusting your filters or search query.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Public Campaign Requests</h2>
                  {profile?.role === 'promoter' && (
                    <Button onClick={() => setIsPublicRequestModalOpen(true)}>
                      <Plus size={18} /> Post Campaign
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publicRequests.filter(r => r.status === 'open').length > 0 ? (
                    publicRequests.filter(r => r.status === 'open').map((req) => (
                      <Card key={req.id} className="p-6 border-l-4 border-l-orange-600">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={req.promoterPhoto || `https://picsum.photos/seed/${req.promoterId}/100/100`} 
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-100 dark:border-zinc-800" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${req.promoterId}`;
                              }}
                            />
                            <div>
                              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{req.title}</h3>
                              <div className="flex flex-col">
                                <button 
                                  onClick={() => setViewingUserId(req.promoterId)}
                                  className="text-xs text-orange-600 dark:text-orange-500 hover:underline font-bold text-left"
                                >
                                  {req.promoterName}
                                </button>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                  {req.promoterRole || 'Promoter'} • {req.promoterEmail || 'Email hidden'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded uppercase">
                            {req.niche}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 line-clamp-3">{req.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Budget</span>
                            <span className="text-lg font-bold text-zinc-900 dark:text-white">₹{req.budget}</span>
                          </div>
                          {profile?.role === 'creator' ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptPublicRequest(req)}
                              disabled={acceptingRequestId === req.id || req.status === 'filled'}
                            >
                              {acceptingRequestId === req.id ? 'Accepting...' : 'Accept Request'}
                            </Button>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Creators only</span>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <Globe size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No public requests found</h3>
                      <p className="text-zinc-500 dark:text-zinc-400">Check back later for new opportunities.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'collaborations' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Active Collaborations</h2>
                {collaborations.length > 0 ? (
                  collaborations.map((collab) => (
                    <Card key={collab.id} className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{collab.title}</h3>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              collab.status === 'pending' ? "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800" :
                              collab.status === 'accepted' ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                              collab.status === 'rejected' ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                              collab.status === 'completed' ? "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" :
                              "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            )}>
                              {collab.status}
                            </span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">{collab.description}</p>
                          <div className="flex items-center gap-4 mb-4">
                            <button 
                              onClick={() => setViewingUserId(profile?.role === 'creator' ? collab.promoterId : collab.creatorId)}
                              className="text-xs text-orange-600 dark:text-orange-500 hover:underline font-medium flex items-center gap-1"
                            >
                              <User size={12} /> View {profile?.role === 'creator' ? 'Promoter' : 'Creator'} Profile
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                            <span className="flex items-center gap-1 font-bold text-zinc-900 dark:text-white">
                              Budget: ₹{collab.budget}
                            </span>
                            <span>Created: {formatDate(collab.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {collab.status === 'pending' && profile?.role === 'creator' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(collab.id, 'rejected')}>Reject</Button>
                              <Button size="sm" onClick={() => handleUpdateStatus(collab.id, 'accepted')}>Accept</Button>
                            </>
                          )}
                          {collab.status === 'accepted' && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" onClick={() => handleUpdateStatus(collab.id, 'completed')}>
                              Complete Task
                            </Button>
                          )}
                          {collab.status === 'completed' && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              const targetId = profile?.role === 'creator' ? collab.promoterId : collab.creatorId;
                              const targetDoc = await getDoc(doc(db, 'users', targetId));
                              if (targetDoc.exists()) {
                                setRatingUser({ id: targetDoc.id, ...targetDoc.data() });
                              }
                            }}>
                              <Star size={16} className="mr-1" /> Rate {profile?.role === 'creator' ? 'Promoter' : 'Creator'}
                            </Button>
                          )}
                          <Button variant="secondary" size="sm" onClick={() => { setSelectedCollab(collab); setActiveTab('messages'); }}>
                            <MessageSquare size={16} /> Chat
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <LayoutDashboard size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No collaborations yet</h3>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              selectedCollab ? (
                <ChatView collaboration={selectedCollab} onClose={() => setSelectedCollab(null)} />
              ) : (
                <div className="h-[calc(100vh-12rem)] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden">
                  <div className="flex-1 flex flex-col md:flex-row">
                    <div className="w-full md:w-80 border-r border-zinc-100 dark:border-zinc-800 overflow-y-auto">
                      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 font-bold text-zinc-900 dark:text-white">Conversations</div>
                      {collaborations.filter(c => c.status === 'accepted').map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCollab(c)}
                          className={cn(
                            "w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-50 dark:border-zinc-800",
                            selectedCollab?.id === c.id && "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30"
                          )}
                        >
                          <div className="font-bold text-zinc-900 dark:text-white text-sm truncate">{c.title}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">Click to open chat</div>
                        </button>
                      ))}
                      {collaborations.filter(c => c.status === 'accepted').length === 0 && (
                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-sm italic">
                          No active chats. Accept a collaboration to start messaging.
                        </div>
                      )}
                    </div>
                    <div className="flex-1 hidden md:flex items-center justify-center bg-zinc-50/30 dark:bg-zinc-950/30">
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Your Inbox</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">Select a conversation to start chatting.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="p-8">
                  <div className="flex flex-col items-center text-center mb-8">
                    <img 
                      src={profile?.photoURL} 
                      className="w-24 h-24 rounded-3xl border-4 border-white dark:border-zinc-800 shadow-xl mb-4" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.email || 'default'}`;
                      }}
                    />
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">{profile?.displayName}</h2>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full uppercase mt-2">
                      {profile?.role}
                    </span>
                  </div>

                  {/* Profile Content - Restricted for Promoters */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Bio</label>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-1">{profile?.bio || "No bio set."}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Niche</label>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-1 font-semibold">{profile?.niche}</p>
                    </div>

                    {profile?.role === 'creator' ? (
                      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Portfolio & Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-1">Engagement Rate</div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">{profile?.engagementRate || '4.2'}%</div>
                          </div>
                          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-1">Followers</div>
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{(profile?.followersCount || 0).toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          {profile?.profileLink && (
                            <a 
                              href={profile.profileLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Globe size={18} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium dark:text-zinc-300">Main Profile Link</span>
                              </div>
                              <ExternalLink size={14} className="text-zinc-400 dark:text-zinc-500" />
                            </a>
                          )}
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                            <div className="flex items-center gap-3">
                              <Instagram size={18} className="text-pink-600 dark:text-pink-400" />
                              <span className="text-sm font-medium dark:text-zinc-300">Instagram</span>
                            </div>
                            <ExternalLink size={14} className="text-zinc-400 dark:text-zinc-500" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                            As a Promoter, your profile focus is on campaign requirements and brand details. Full creator portfolios are available in the Explore tab.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <Button variant="outline" className="w-full" onClick={() => setIsEditProfileModalOpen(true)}>Edit Profile</Button>
                    </div>
                  </div>
                </Card>
                
                {/* Notification Settings */}
                <Card className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="text-orange-600" size={24} />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Notification Settings</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">In-App Notifications</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive alerts within the platform</p>
                      </div>
                      <div className="w-12 h-6 bg-orange-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 opacity-60">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Email Notifications</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Get updates in your inbox (Coming Soon)</p>
                      </div>
                      <div className="w-12 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full relative cursor-not-allowed">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 opacity-60">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Browser push alerts (Coming Soon)</p>
                      </div>
                      <div className="w-12 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full relative cursor-not-allowed">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Security Section (2FA Simulation) */}
                <Card className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-orange-600" size={24} />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Security & 2FA</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Add an extra layer of security to your account.</p>
                      </div>
                      <button 
                        onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          is2FAEnabled ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          is2FAEnabled ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                    {is2FAEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl"
                      >
                        <p className="text-xs text-green-800 dark:text-green-400 font-medium mb-2">2FA is active via Email Verification.</p>
                        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-lg border border-green-200 dark:border-green-800">
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">Recovery Code</span>
                          <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">BO-92X-441-Z</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <CollaborationModal 
            targetUser={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
        {ratingUser && (
          <RatingModal 
            targetUser={ratingUser} 
            onClose={() => setRatingUser(null)} 
          />
        )}
        {isEditProfileModalOpen && (
          <EditProfileModal 
            profile={profile} 
            onClose={() => setIsEditProfileModalOpen(false)} 
          />
        )}
        {isPublicRequestModalOpen && (
          <PublicRequestModal 
            onClose={() => setIsPublicRequestModalOpen(false)} 
          />
        )}
        {viewingUserId && (
          <UserProfileModal 
            userId={viewingUserId} 
            onClose={() => setViewingUserId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

const AppContent = () => {
  const { user, profile, loading, isAuthReady } = useAuth();
  const [intendedRole, setIntendedRole] = useState<'creator' | 'promoter' | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'signin' | 'signup' }>({
    isOpen: false,
    mode: 'signin'
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if auth is ready and we're NOT in the middle of a profile fetch
    // OR if we have a user but definitely no profile (new user)
    if (isAuthReady && !loading) {
      if (user && profile) {
        if (profile.role === 'creator' && location.pathname === '/') {
          navigate('/creator-dashboard', { replace: true });
        } else if (profile.role === 'promoter' && location.pathname === '/') {
          navigate('/promoter-dashboard', { replace: true });
        }
      } else if (user && !profile && location.pathname !== '/onboarding') {
        // Only redirect to onboarding if we've confirmed the profile doesn't exist
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, profile, loading, isAuthReady, navigate, location.pathname]);

  // Show a lighter loader if we're just fetching the profile but auth is already ready
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-100 dark:border-orange-900/30 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Initializing...</p>
        </div>
      </div>
    );
  }

  // If auth is ready but profile is still loading, we can show a partial state or a smaller loader
  if (user && loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-50 dark:border-orange-900/20 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            {user.displayName ? `Welcome back, ${user.displayName.split(' ')[0]}!` : "Loading your profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={!user ? <LandingView onJoin={(role, mode) => {
          setIntendedRole(role);
          setAuthModal({ isOpen: true, mode });
        }} /> : <Navigate to={profile?.role === 'creator' ? '/creator-dashboard' : '/promoter-dashboard'} />} />
        <Route path="/onboarding" element={user && !profile ? <OnboardingView initialRole={intendedRole} /> : <Navigate to={profile?.role === 'creator' ? '/creator-dashboard' : '/promoter-dashboard'} />} />
        <Route path="/creator-dashboard" element={profile?.role === 'creator' ? <DashboardView /> : <Navigate to="/" />} />
        <Route path="/promoter-dashboard" element={profile?.role === 'promoter' ? <DashboardView /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialMode={authModal.mode}
        initialRole={intendedRole}
      />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}
