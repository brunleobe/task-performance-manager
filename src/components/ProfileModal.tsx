import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await api.updateProfile(fullName.trim());
      updateUser({ full_name: fullName.trim() });
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!currentPassword) {
      setSecurityError('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match.');
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSecuritySuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to change password.');
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-slate-200 shadow-2xl shadow-blue-950/20 dark:bg-[#121c38] dark:border-blue-900/50 border w-full max-w-md rounded-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-blue-900/30 flex items-center justify-between bg-slate-50/50 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-600/30">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
          >
            👤 General Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
          >
            🔒 Change Password
          </button>
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            {profileError && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {profileSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border-slate-200 text-slate-500 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-slate-400 border text-sm cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role & Department</label>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase">
                  {user.role}
                </span>
                {user.department_name && (
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 border-slate-200 text-slate-700 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-slate-300 border text-xs font-semibold">
                    🏢 {user.department_name}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:border-blue-900/40 dark:hover:bg-blue-900/30 border transition-all font-semibold"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security Settings */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {securityError && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {securityError}
              </div>
            )}
            {securitySuccess && (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {securitySuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:border-blue-900/40 dark:hover:bg-blue-900/30 border transition-all font-semibold"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdatingSecurity}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isUpdatingSecurity ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
