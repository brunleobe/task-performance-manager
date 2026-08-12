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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-slate-200 dark:bg-[#0f172a] dark:border-white/10 border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Account Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === 'profile'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
          >
            👤 General Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === 'security'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold'
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
              <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
                {profileSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border-slate-200 text-slate-500 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-slate-400 border text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role & Department</label>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold capitalize">
                  {user.role}
                </span>
                {user.department_name && (
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/[0.05] dark:border-white/[0.08] dark:text-slate-300 border text-xs font-medium">
                    🏢 {user.department_name}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-white/[0.05] dark:border-white/10 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 border-slate-200 hover:bg-slate-100 dark:text-slate-400 dark:border-white/10 dark:hover:bg-white/5 border transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
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
              <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {securityError}
              </div>
            )}
            {securitySuccess && (
              <div className="px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
                {securitySuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-white/[0.05] dark:border-white/10 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-white/[0.05] dark:border-white/10 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border-slate-200 text-slate-900 dark:bg-white/[0.05] dark:border-white/10 dark:text-white border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 border-slate-200 hover:bg-slate-100 dark:text-slate-400 dark:border-white/10 dark:hover:bg-white/5 border transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdatingSecurity}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
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
