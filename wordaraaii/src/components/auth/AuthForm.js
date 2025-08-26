'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthForm({ view: externalView, setView: externalSetView }) {
  // Backward compatibility: support internal state if parent doesn't control view
  const [internalView, setInternalView] = useState(externalView || 'signIn');
  const view = useMemo(() => (externalView ?? internalView), [externalView, internalView]);
  const setView = externalSetView ?? setInternalView;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const router = useRouter();

  const handleInputChange = (e) => setFormState({ ...formState, [e.target.name]: e.target.value });

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      let result;
      if (view === 'signIn') {
        result = await supabase.auth.signInWithPassword({
          email: formState.email,
          password: formState.password
        });
        if (!result.error) router.push('/');
      } else if (view === 'signUp') {
        if (formState.password !== formState.confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        result = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
          options: {
            data: {
              first_name: formState.firstName,
              last_name: formState.lastName,
              username: formState.username,
              phone_number: formState.phoneNumber,
              date_of_birth: formState.dateOfBirth
            }
          }
        });
        if (!result.error) setMessage('Account created! Please check your email for verification.');
      } else if (view === 'forgotPassword') {
        result = await supabase.auth.resetPasswordForEmail(formState.email);
        if (!result.error) setMessage('Password reset link sent!');
      }
      if (result.error) throw result.error;
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const renderContent = () => {
    switch (view) {
      case 'signUp':
        return (
          <motion.div key="signUp" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <div className="text-center mb-1.5">
              <h2 className="text-2xl font-bold mother-of-pearl-text">Create Account</h2>
              <p className="text-white/70 text-sm mt-1">Start collaborating with AI-powered documents in minutes</p>
            </div>
            
            {/* First Name and Last Name Row */}
            <div className="grid grid-cols-2 gap-4 md:gap-4">
              <Input 
                id="firstName" 
                name="firstName" 
                label="First Name" 
                value={formState.firstName} 
                onChange={handleInputChange} 
              />
              <Input 
                id="lastName" 
                name="lastName" 
                label="Last Name" 
                value={formState.lastName} 
                onChange={handleInputChange} 
              />
            </div>

            {/* Username */}
            <Input 
              id="username" 
              name="username" 
              label="Username" 
              value={formState.username} 
              onChange={handleInputChange} 
            />

            {/* Email Address */}
            <Input 
              id="email" 
              name="email" 
              type="email" 
              label="Email Address" 
              value={formState.email} 
              onChange={handleInputChange} 
            />

            {/* Phone Number */}
            <Input 
              id="phoneNumber" 
              name="phoneNumber" 
              type="tel" 
              label="Phone Number" 
              value={formState.phoneNumber} 
              onChange={handleInputChange} 
            />

            {/* Date of Birth */}
            <Input 
              id="dateOfBirth" 
              name="dateOfBirth" 
              type="date" 
              label="Date of Birth" 
              value={formState.dateOfBirth} 
              onChange={handleInputChange} 
            />

            {/* Password */}
            <Input 
              id="password" 
              name="password" 
              type="password" 
              label="Password" 
              value={formState.password} 
              onChange={handleInputChange} 
            />

            {/* Confirm Password */}
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              value={formState.confirmPassword}
              onChange={handleInputChange}
            />

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? 'Creating Account…' : 'Create Account'}
            </Button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="px-4 text-sm text-white/60">or</span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <p className="text-center text-sm text-white/70">
              Already have an account? 
              <button 
                type="button" 
                onClick={() => setView('signIn')} 
                className="font-medium text-skyBlue hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          </motion.div>
        );
      case 'forgotPassword':
        return (
          <motion.div key="forgotPassword" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <h2 className="text-2xl font-bold text-center mother-of-pearl-text">Reset Password</h2>
            <Input id="email" name="email" type="email" label="Email Address" value={formState.email} onChange={handleInputChange} />
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
            <p className="text-center text-sm text-white/70">Remembered your password? <button type="button" onClick={() => setView('signIn')} className="font-medium text-skyBlue hover:underline">Sign In</button></p>
          </motion.div>
        );
      default: // signIn view
        return (
          <motion.div key="signIn" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 md:space-y-6">
            <Input id="email" name="email" type="email" label="Email Address" value={formState.email} onChange={handleInputChange} />
            <Input id="password" name="password" type="password" label="Password" value={formState.password} onChange={handleInputChange} />
            <div className="text-right">
              <button type="button" onClick={() => setView('forgotPassword')} className="text-sm font-medium text-skyBlue hover:underline">Forgot Password?</button>
            </div>
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? 'Signing In…' : 'Sign In'}
            </Button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="px-4 text-sm text-white/60">or</span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <p className="text-center text-sm text-white/70">No account? <button type="button" onClick={() => setView('signUp')} className="font-medium text-skyBlue hover:underline">Sign Up</button></p>
          </motion.div>
        );
    }
  };

  return (
    // Keep compact width and stable internal scroll
    <div className="w-full max-w-md h-full flex flex-col mx-auto min-h-0">
      <AnimatePresence mode="wait">
        <form onSubmit={handleAuthAction} className="flex-1 overflow-y-auto min-h-0 pr-1 md:pr-2 scrollbar-themed">
          {/* Top Tabs */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setView('signIn')}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                view === 'signIn'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-selected={view === 'signIn'}
              role="tab"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setView('signUp')}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                view === 'signUp'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-selected={view === 'signUp'}
              role="tab"
            >
              Sign Up
            </button>
          </div>

          {renderContent()}
        </form>
      </AnimatePresence>
      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
      {message && <p className="mt-4 text-center text-sm text-green-400">{message}</p>}
    </div>
  );
}
