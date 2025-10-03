import React from 'react';

const ProfileTab = ({ user }) => {
  const profile = {
    username: user?.username || '',
    full_name: user?.full_name || '',
    role: user?.role || '',
    kelas: user?.kelas || ''
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Informasi Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input
            type="text"
            value={profile.username}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
          <input
            type="text"
            value={profile.full_name}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <input
            type="text"
            value={profile.role.replace('_', ' ')}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Diampu</label>
          <input
            type="text"
            value={profile.kelas || 'Belum ditugaskan'}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;