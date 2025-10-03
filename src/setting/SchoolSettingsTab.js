import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Building2, MapPin, Phone, Calendar, Image, Edit3, Save, Upload, X } from 'lucide-react';

const SchoolSettingsTab = ({ user, loading, setLoading, showToast }) => {
  const [schoolSettings, setSchoolSettings] = useState({
    academic_year: '2025/2026',
    school_name: 'SD Negeri 1 Pasir Pogor',
    school_address: 'Jl. Raya Pasir Pogor No. 22 Cipongkor',
    school_phone: '022-1234567',
    school_logo: null
  });
  const [editingSchoolSettings, setEditingSchoolSettings] = useState(false);
  const [tempSchoolSettings, setTempSchoolSettings] = useState({});

  useEffect(() => {
    loadSchoolSettings();
  }, []);

  const loadSchoolSettings = async () => {
    try {
      setLoading(true);
      
      const { data: settingsData, error } = await supabase
        .from('school_settings')
        .select('setting_key, setting_value');
      
      if (error) throw error;
      
      if (settingsData && settingsData.length > 0) {
        const settings = {};
        settingsData.forEach(item => {
          settings[item.setting_key] = item.setting_value;
        });
        setSchoolSettings(prev => ({ ...prev, ...settings }));
      }
      
    } catch (error) {
      console.error('Error loading school settings:', error);
      showToast('Error loading school settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI SIMPLE BASE64 UPLOAD
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi file
    if (!file.type.startsWith('image/')) {
      showToast('Hanya file gambar yang diizinkan', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // CONVERT TO BASE64 - SIMPLE BANGET!
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      };

      const base64String = await convertToBase64(file);
      
      // SIMPAN BASE64 KE FORM
      setTempSchoolSettings(prev => ({ 
        ...prev, 
        school_logo: base64String 
      }));

      showToast('Logo berhasil diupload!', 'success');
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('Error uploading logo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeLogo = () => {
    setTempSchoolSettings(prev => ({ 
      ...prev, 
      school_logo: null 
    }));
    showToast('Logo dihapus dari form', 'info');
  };

  const updateSchoolSettings = async () => {
    try {
      setLoading(true);
      
      const updatePromises = Object.entries(tempSchoolSettings).map(([key, value]) => 
        supabase
          .from('school_settings')
          .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      );
      
      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        throw new Error('Failed to update some settings');
      }
      
      setSchoolSettings(prev => ({ ...prev, ...tempSchoolSettings }));
      setEditingSchoolSettings(false);
      setTempSchoolSettings({});
      showToast('Pengaturan sekolah berhasil disimpan!', 'success');
      
    } catch (error) {
      console.error('Error updating school settings:', error);
      showToast('Error menyimpan pengaturan sekolah', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Pengaturan Sekolah</h2>
        {!editingSchoolSettings && (
          <button
            onClick={() => {
              setEditingSchoolSettings(true);
              setTempSchoolSettings({ ...schoolSettings });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit3 size={16} />
            Edit Pengaturan
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Sekolah */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 size={16} className="inline mr-1" />
              Nama Sekolah
            </label>
            {editingSchoolSettings ? (
              <input
                type="text"
                value={tempSchoolSettings.school_name || ''}
                onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama sekolah"
              />
            ) : (
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {schoolSettings.school_name}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Alamat Sekolah
            </label>
            {editingSchoolSettings ? (
              <textarea
                value={tempSchoolSettings.school_address || ''}
                onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_address: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Masukkan alamat sekolah"
              />
            ) : (
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[76px]">
                {schoolSettings.school_address}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-1" />
              Nomor Telepon
            </label>
            {editingSchoolSettings ? (
              <input
                type="text"
                value={tempSchoolSettings.school_phone || ''}
                onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nomor telepon"
              />
            ) : (
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {schoolSettings.school_phone}
              </div>
            )}
          </div>
        </div>

        {/* Tahun Ajaran dan Logo */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Tahun Ajaran Aktif
            </label>
            {editingSchoolSettings ? (
              <input
                type="text"
                value={tempSchoolSettings.academic_year || ''}
                onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="2025/2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg font-semibold text-blue-800">
                {schoolSettings.academic_year}
              </div>
            )}
          </div>
          
          {/* SECTION LOGO - BASE64 VERSION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image size={16} className="inline mr-1" />
              Logo Sekolah
            </label>
            {editingSchoolSettings ? (
              <div className="space-y-3">
                {/* Preview Logo */}
                {(tempSchoolSettings.school_logo || schoolSettings.school_logo) && (
                  <div className="relative p-3 bg-gray-50 rounded-lg border">
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Hapus logo"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-center gap-3">
                      <img 
                        src={tempSchoolSettings.school_logo || schoolSettings.school_logo} 
                        alt="Preview Logo" 
                        className="h-16 w-16 object-contain border rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Preview Logo</p>
                        <p className="text-xs text-gray-500">Logo tersimpan di database</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upload Area - SIMPLE VERSION */}
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-700 text-center">
                    Klik untuk upload logo
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    PNG, JPG, JPEG (Maks. 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                <p className="text-xs text-gray-500 text-center">
                  Logo akan disimpan langsung di database
                </p>
              </div>
            ) : (
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {schoolSettings.school_logo ? (
                  <div className="flex items-center gap-3">
                    <img src={schoolSettings.school_logo} alt="School Logo" className="h-12 w-12 object-contain" />
                    <span className="text-sm text-gray-600">Logo terpasang</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Logo belum diset</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      {editingSchoolSettings && (
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={updateSchoolSettings}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          
          <button
            onClick={() => {
              setEditingSchoolSettings(false);
              setTempSchoolSettings({});
            }}
            disabled={loading}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
};

export default SchoolSettingsTab;