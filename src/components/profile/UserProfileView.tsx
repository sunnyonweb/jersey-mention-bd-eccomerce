import { useState, useEffect, FormEvent } from 'react';
import { User as UserIcon, Package, MapPin, Phone, Mail, LogOut, ShieldCheck, Shirt, ExternalLink, ShieldAlert, Key, UserPlus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Order } from '../../types';

export default function UserProfileView() {
  const { user, setUser, logout, setCurrentOrderTracking, setActiveTab, showToast, mergeGuestCartAndWishlist, authPromptMode, completeAuthPrompt } = useStore();

  const [activeTabSection, setActiveTabSection] = useState<'profile' | 'orders' | 'addresses'>('orders');
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile Form States (for logged-in user editing)
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Saved Shipping Address States
  const [isProfileEditingAddress, setIsProfileEditingAddress] = useState(
    user?.savedShippingAddress?.address ? false : true
  );
  const [profileFormAddress, setProfileFormAddress] = useState({
    fullName: user?.savedShippingAddress?.fullName || user?.name || '',
    phone: user?.savedShippingAddress?.phone || user?.phone || '',
    address: user?.savedShippingAddress?.address || '',

    city: user?.savedShippingAddress?.city || '',
    district: user?.savedShippingAddress?.district || '',
    postalCode: user?.savedShippingAddress?.postalCode || '',
    zone: user?.savedShippingAddress?.zone || 'inside_dhaka'
  });

  const handleSaveProfileAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profileFormAddress.fullName || !profileFormAddress.phone || !profileFormAddress.address || !profileFormAddress.city || !profileFormAddress.district || !profileFormAddress.zone) {
      showToast('Please fill out all required shipping address fields.');
      return;
    }

    const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(profileFormAddress.phone.trim())) {
      showToast('Please enter a valid Bangladesh mobile number format (e.g. 01XXXXXXXXX).');
      return;
    }

    try {
      const res = await fetch('/api/user/shipping-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileFormAddress)
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, savedShippingAddress: data.savedShippingAddress });
        showToast('Shipping address saved successfully!');
        setIsProfileEditingAddress(false);
      } else {
        showToast(data.message || 'Error saving address.');
      }
    } catch (err) {
      showToast('Server communication error.');
    }
  };

  // Auth View Toggle (Sign In vs Sign Up)
  const [isSignUpMode, setIsSignUpMode] = useState(authPromptMode === 'signup');

  // Sign In States
  const [signInPhone, setSignInPhone] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // General Auth States
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Sync state with user details when user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setEmail(user.email);
      setProfileFormAddress({
        fullName: user.savedShippingAddress?.fullName || user.name || '',
        phone: user.savedShippingAddress?.phone || user.phone || '',
        address: user.savedShippingAddress?.address || '',
        city: user.savedShippingAddress?.city || '',
        district: user.savedShippingAddress?.district || '',
        postalCode: user.savedShippingAddress?.postalCode || '',
        zone: user.savedShippingAddress?.zone || 'inside_dhaka'
      });
      setIsProfileEditingAddress(user.savedShippingAddress?.address ? false : true);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsSignUpMode(authPromptMode === 'signup');
    }
  }, [authPromptMode, user]);

  useEffect(() => {
    if (!user) return;
    // Fetch customer order history
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch('/api/orders/my-orders');
        const data = await res.json();
        if (data.success) {
          setOrdersList(data.orders);
        }
      } catch (err) {
        console.error('Failed fetching orders');
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({ ...user, name, phone, email });
      showToast('Profile settings updated successfully!');
    }
  };

  const handleTrackSingleOrder = (ord: Order) => {
    setCurrentOrderTracking(ord);
    setActiveTab('order_tracking');
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signInPhone || !signInPassword) {
      setAuthError('Please fill in all fields');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: signInPhone, password: signInPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        await mergeGuestCartAndWishlist();
        completeAuthPrompt();
        showToast(`Logged in successfully as ${data.user.name}`);
        // Reset states
        setSignInPhone('');
        setSignInPassword('');
      } else {
        setAuthError(data.message || 'Invalid phone number or password.');
      }
    } catch (err) {
      setAuthError('Failed to connect to the server');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpPhone || !signUpPassword || !signUpConfirmPassword) {
      setAuthError('Name, mobile number, password, and confirmation are required');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail || undefined,
          password: signUpPassword,
          phone: signUpPhone
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        await mergeGuestCartAndWishlist();
        completeAuthPrompt();
        showToast(`Registered and logged in as ${data.user.name}`);
        // Reset states
        setSignUpName('');
        setSignUpEmail('');
        setSignUpPhone('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
      } else {
        setAuthError(data.message || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Failed to connect to the server');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setForgotMessage('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setForgotMessage(data.message || 'If an account exists with this email, a password reset link has been sent.');
    } catch {
      setAuthError('Unable to connect to the server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    if (newPassword.length < 8) {
      setPasswordChangeError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    setPasswordChangeLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmNewPassword })
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordChangeError(data.message || 'Unable to change password. Please try again.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      logout();
      showToast('Password changed successfully. Please sign in again.');
    } catch {
      setPasswordChangeError('Unable to change password. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };



  // If user is not logged in, show the Sign In / Sign Up Panel
  if (!user) {
    return (
      <div className="py-16 bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              {isSignUpMode ? <UserPlus className="w-6 h-6" /> : <Key className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              {isSignUpMode ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-xs text-slate-500">
              {isSignUpMode ? 'Sign up to purchase jerseys and track orders' : 'Access your Jersey Mention BD user or admin account'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl border border-red-200 text-center animate-pulse">
              {authError}
            </div>
          )}

          {forgotPasswordMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotMessage && <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-3.5 rounded-xl border border-emerald-200 text-center">{forgotMessage}</div>}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input type="email" required placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all" />
              </div>
              <button type="submit" disabled={authLoading} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50">
                {authLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : isSignUpMode ? (
            /* SIGN UP FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="Your phone number"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Add your email to enable password recovery.<br />
                  পাসওয়ার্ড ভুলে গেলে পুনরুদ্ধারের জন্য আপনার ইমেইল যোগ করুন।
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm your password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {authLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            /* SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="Your phone number"
                  value={signInPhone}
                  onChange={(e) => setSignInPhone(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {authLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {!isSignUpMode && !forgotPasswordMode && (
            <div className="text-center text-xs">
              <button onClick={() => { setForgotPasswordMode(true); setAuthError(''); }} className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer">
                Forgot Password?
              </button>
            </div>
          )}

          <div className="text-center text-xs">
            <button
              onClick={() => {
                setIsSignUpMode(forgotPasswordMode ? false : !isSignUpMode);
                setForgotPasswordMode(false);
                setAuthError('');
              }}

              className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
            >
              {forgotPasswordMode ? 'Back to Sign In' : isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>


        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Profile Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">{name}</h1>
                <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> {phone} | <Mail className="w-3.5 h-3.5" /> {email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Admin Panel for Admin users */}
            {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
              <button
                onClick={() => setActiveTab('admin')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" /> Go To Admin Dashboard
              </button>
            )}

            <button
              onClick={() => {
                logout();
                showToast('Logged out of account');
              }}
              className="bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTabSection('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSection === 'orders'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" /> My Match Orders ({ordersList.length})
          </button>

          <button
            onClick={() => setActiveTabSection('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSection === 'profile'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile & Sizing
          </button>

          <button
            onClick={() => setActiveTabSection('addresses')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSection === 'addresses'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" /> Saved Address
          </button>
        </div>

        {/* Tab Content: Orders History */}
        {activeTabSection === 'orders' && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="text-center py-12 text-slate-500 font-semibold text-xs">Loading orders...</div>
            ) : ordersList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-slate-800 text-base">No Previous Orders Found</h3>
                <p className="text-xs text-slate-500">Your recent jersey orders will appear here for easy tracking.</p>
              </div>
            ) : (
              ordersList.map((ord) => (
                <div key={ord.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">Order #{ord.orderNumber}</span>
                      <p className="text-slate-400 mt-0.5">
                        Placed on {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full uppercase text-[10px]">
                        {ord.orderStatus.replace('_', ' ')}
                      </span>

                      <button
                        onClick={() => handleTrackSingleOrder(ord)}
                        className="bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Live Tracking</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        {item.image || item.productImage ? (
                          <img
                            src={item.image || item.productImage}
                            alt={item.name || item.productName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-contain p-1 rounded-xl bg-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                            <Shirt className="w-5 h-5 opacity-45" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{item.name || item.productName}</h4>
                          <p className="text-slate-500 text-[11px]">
                            Qty: {item.quantity}{item.size ? ` | Size: ${item.size}` : ''}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Total Paid: <strong className="text-emerald-700 text-sm">৳{ord.totalAmount.toLocaleString()}</strong> ({ord.paymentMethod.toUpperCase()})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Profile Settings */}
        {activeTabSection === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-xl animate-in fade-in duration-200">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              Edit Personal Info
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Save Profile Changes
            </button>
          </form>
        )}

        {activeTabSection === 'profile' && (
          <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-xl animate-in fade-in duration-200">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">CHANGE PASSWORD</h2>
            {passwordChangeError && <div className="bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl border border-red-200">{passwordChangeError}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Current Password *</label>
                <input type="password" required placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Password *</label>
                <input type="password" required minLength={8} placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                <input type="password" required minLength={8} placeholder="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500" />
              </div>
            </div>
            <button type="submit" disabled={passwordChangeLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50">
              {passwordChangeLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        )}

        {/* Tab Content: Saved Shipping Address */}
        {activeTabSection === 'addresses' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-xl space-y-6 animate-in fade-in duration-200 text-left">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />
                Saved Shipping Address
              </h2>
            </div>

            {!isProfileEditingAddress && user.savedShippingAddress?.address ? (
              /* VIEW MODE */
              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3 leading-relaxed">
                  <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-200/50">
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Full Name</span>
                      <span className="text-slate-955 font-extrabold text-sm">{user.savedShippingAddress.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Mobile Number</span>
                      <span className="text-slate-955 font-extrabold text-sm">{user.savedShippingAddress.phone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold text-[9px] uppercase">Shipping Address</span>
                    <span className="text-slate-955 font-extrabold text-xs">{user.savedShippingAddress.address}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/50">
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">City</span>
                      <span className="text-slate-955 font-extrabold">{user.savedShippingAddress.city}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">District</span>
                      <span className="text-slate-955 font-extrabold">{user.savedShippingAddress.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Location Zone</span>
                      <span className="text-emerald-750 font-black uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded w-max block">
                        {user.savedShippingAddress.zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                      </span>
                    </div>
                  </div>

                  {user.savedShippingAddress.postalCode && (
                    <div className="pt-2 border-t border-slate-200/50">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Postal Code</span>
                      <span className="text-slate-955 font-extrabold">{user.savedShippingAddress.postalCode}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setProfileFormAddress({
                      fullName: user.savedShippingAddress?.fullName || '',
                      phone: user.savedShippingAddress?.phone || '',
                      address: user.savedShippingAddress?.address || '',
                      city: user.savedShippingAddress?.city || '',
                      district: user.savedShippingAddress?.district || '',
                      postalCode: user.savedShippingAddress?.postalCode || '',
                      zone: user.savedShippingAddress?.zone || 'inside_dhaka'
                    });
                    setIsProfileEditingAddress(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-xs border-none"
                >
                  Edit Address
                </button>
              </div>
            ) : (
              /* EDIT/CREATE MODE */
              <form onSubmit={handleSaveProfileAddress} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileFormAddress.fullName}
                      onChange={(e) => setProfileFormAddress({ ...profileFormAddress, fullName: e.target.value })}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={profileFormAddress.phone}
                      onChange={(e) => setProfileFormAddress({ ...profileFormAddress, phone: e.target.value })}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Street Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={profileFormAddress.address}
                    onChange={(e) => setProfileFormAddress({ ...profileFormAddress, address: e.target.value })}
                    placeholder="House #, Road #, Thana/Area"
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={profileFormAddress.city}
                      onChange={(e) => setProfileFormAddress({ ...profileFormAddress, city: e.target.value })}
                      placeholder="City/Area"
                      className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">District *</label>
                    <input
                      type="text"
                      required
                      value={profileFormAddress.district}
                      onChange={(e) => setProfileFormAddress({ ...profileFormAddress, district: e.target.value })}
                      placeholder="District"
                      className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Location Zone *</label>
                    <select
                      value={profileFormAddress.zone}
                      onChange={(e) => setProfileFormAddress({ ...profileFormAddress, zone: e.target.value })}
                      className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2.5 rounded-xl border border-slate-300 font-bold focus:border-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="inside_dhaka">Inside Dhaka</option>
                      <option value="outside_dhaka">Outside Dhaka</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={profileFormAddress.postalCode}
                    onChange={(e) => setProfileFormAddress({ ...profileFormAddress, postalCode: e.target.value })}
                    placeholder="Postal Code"
                    className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {user.savedShippingAddress?.address && (
                    <button
                      type="button"
                      onClick={() => setIsProfileEditingAddress(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl cursor-pointer border-none text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl cursor-pointer shadow-md border-none text-xs"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
