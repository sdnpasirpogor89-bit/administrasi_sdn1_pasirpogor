// src/components/SchoolSettingsTab.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Building2, MapPin, Phone, Calendar, Image, Edit3, Save, Upload, X, RotateCcw } from 'lucide-react';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageValidation, setImageValidation] = useState({ isValid: true, message: '' });

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

  // Enhanced Image Compression Function
  const compressImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
      const { maxWidth = 800, maxHeight = 800, quality = 0.7 } = options;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Enhanced Image Validation
  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!validTypes.includes(file.type)) {
      return {
        isValid: false,
        message: 'Format file harus JPG, PNG, atau WebP'
      };
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        message: 'Ukuran file maksimal 2MB'
      };
    }
    
    // Check dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          resolve({
            isValid: false,
            message: 'Resolusi gambar minimal 100x100px'
          });
        } else if (img.width > 4000 || img.height > 4000) {
          resolve({
            isValid: false,
            message: 'Resolusi gambar maksimal 4000x4000px'
          });
        } else {
          resolve({ isValid: true, message: '' });
        }
      };
      img.onerror = () => resolve({
        isValid: false,
        message: 'Gagal memuat gambar'
      });
      img.src = URL.createObjectURL(file);
    });
  };

  // ENHANCED LOGO UPLOAD WITH COMPRESSION
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setUploadProgress(0);
      setImageValidation({ isValid: true, message: '' });

      // Step 1: Validate image
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        setImageValidation(validation);
        showToast(validation.message, 'error');
        return;
      }

      // Simulate progress
      setUploadProgress(30);

      // Step 2: Compress image
      const compressedBlob = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7
      });

      setUploadProgress(70);

      // Step 3: Convert to Base64
      const base64String = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        reader.onload = () => resolve(reader.result);
      });

      setUploadProgress(100);

      // Step 4: Update form with compressed image
      setTempSchoolSettings(prev => ({ 
        ...prev, 
        school_logo: base64String 
      }));

      const sizeReduction = ((file.size - compressedBlob.size) / file.size * 100).toFixed(1);
      showToast(`Logo berhasil diupload! (${sizeReduction}% lebih kecil)`, 'success');
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('Error uploading logo', 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const removeLogo = () => {
    setTempSchoolSettings(prev => ({ 
      ...prev, 
      school_logo: null 
    }));
    setImageValidation({ isValid: true, message: '' });
    showToast('Logo dihapus dari form', 'info');
  };

  // Enhanced Form Validation
  const validateForm = () => {
    const errors = [];
    
    if (!tempSchoolSettings.school_name?.trim()) {
      errors.push('Nama sekolah wajib diisi');
    }
    
    if (!tempSchoolSettings.school_address?.trim()) {
      errors.push('Alamat sekolah wajib diisi');
    }
    
    if (!tempSchoolSettings.academic_year?.trim()) {
      errors.push('Tahun ajaran wajib diisi');
    }
    
    // Validate academic year format (YYYY/YYYY)
    const yearRegex = /^\d{4}\/\d{4}$/;
    if (tempSchoolSettings.academic_year && !yearRegex.test(tempSchoolSettings.academic_year)) {
      errors.push('Format tahun ajaran harus: YYYY/YYYY (contoh: 2025/2026)');
    }
    
    // Validate phone number (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
    if (tempSchoolSettings.school_phone && !phoneRegex.test(tempSchoolSettings.school_phone)) {
      errors.push('Format nomor telepon tidak valid');
    }
    
    return errors;
  };

  const updateSchoolSettings = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => showToast(error, 'error'));
      return;
    }

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
      setImageValidation({ isValid: true, message: '' });
      
      showToast('Pengaturan sekolah berhasil disimpan!', 'success');
      
    } catch (error) {
      console.error('Error updating school settings:', error);
      showToast('Error menyimpan pengaturan sekolah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to original values
  const resetForm = () => {
    setTempSchoolSettings({ ...schoolSettings });
    setImageValidation({ isValid: true, message: '' });
    showToast('Form telah direset ke nilai semula', 'info');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Pengaturan Sekolah</h2>
          <p className="text-sm text-gray-600 mt-1">
            Kelola informasi dan identitas sekolah
          </p>
        </div>
        {!editingSchoolSettings && (
          <button
            onClick={() => {
              setEditingSchoolSettings(true);
              setTempSchoolSettings({ ...schoolSettings });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 size={16} />
            Edit Pengaturan
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Informasi Sekolah */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Informasi Sekolah
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Sekolah *
                </label>
                {editingSchoolSettings ? (
                  <input
                    type="text"
                    value={tempSchoolSettings.school_name || ''}
                    onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Alamat Sekolah *
                </label>
                {editingSchoolSettings ? (
                  <textarea
                    value={tempSchoolSettings.school_address || ''}
                    onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    rows="3"
                    placeholder="Masukkan alamat lengkap sekolah"
                  />
                ) : (
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[76px]">
                    {schoolSettings.school_address}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                {editingSchoolSettings ? (
                  <input
                    type="text"
                    value={tempSchoolSettings.school_phone || ''}
                    onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, school_phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: 022-1234567"
                  />
                ) : (
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {schoolSettings.school_phone || '-'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tahun Ajaran dan Logo */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Tahun Ajaran
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahun Ajaran Aktif *
              </label>
              {editingSchoolSettings ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempSchoolSettings.academic_year || ''}
                    onChange={(e) => setTempSchoolSettings(prev => ({ ...prev, academic_year: e.target.value }))}
                    placeholder="2025/2026"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">
                    Format: YYYY/YYYY (contoh: 2025/2026)
                  </p>
                </div>
              ) : (
                <div className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg font-semibold text-blue-800">
                  {schoolSettings.academic_year}
                </div>
              )}
            </div>
          </div>
          
          {/* ENHANCED LOGO SECTION */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Image size={20} />
              Logo Sekolah
            </h3>
            
            {editingSchoolSettings ? (
              <div className="space-y-4">
                {/* Upload Progress */}
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 text-center">
                      Mengupload... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Validation Error */}
                {!imageValidation.isValid && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{imageValidation.message}</p>
                  </div>
                )}

                {/* Preview Logo */}
                {(tempSchoolSettings.school_logo || schoolSettings.school_logo) && (
                  <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Hapus logo"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-center gap-4">
                      <img 
                        src={tempSchoolSettings.school_logo || schoolSettings.school_logo} 
                        alt="Preview Logo" 
                        className="h-20 w-20 object-contain border rounded-lg bg-white p-2"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Preview Logo</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Logo akan disimpan dalam format terkompresi
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Gambar telah dioptimasi
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upload Area */}
                <label className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 border-gray-300'
                } bg-gray-50`}>
                  <Upload className="w-8 h-8 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-700 text-center mb-1">
                    Klik untuk upload logo
                  </span>
                  <span className="text-xs text-gray-500 text-center">
                    PNG, JPG, JPEG • Maks. 2MB • Minimal 100x100px
                  </span>
                  <span className="text-xs text-blue-600 mt-2 text-center">
                    Gambar akan dikompresi otomatis
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Tips:</strong> Gunakan gambar dengan latar belakang transparan (PNG) 
                    untuk hasil terbaik. Logo akan otomatis dikompresi hingga 70% lebih kecil.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  {schoolSettings.school_logo ? (
                    <img 
                      src={schoolSettings.school_logo} 
                      alt="School Logo" 
                      className="h-24 w-24 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white mx-auto mb-3">
                        <span className="text-2xl">🏫</span>
                      </div>
                      <p className="text-sm text-gray-500">Logo belum diset</p>
                    </div>
                  )}
                </div>
                {schoolSettings.school_logo && (
                  <p className="text-xs text-gray-500 text-center">
                    Logo terpasang • Format terkompresi
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Action Buttons */}
      {editingSchoolSettings && (
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={updateSchoolSettings}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            
            <button
              onClick={resetForm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
          
          <button
            onClick={() => {
              setEditingSchoolSettings(false);
              setTempSchoolSettings({});
              setImageValidation({ isValid: true, message: '' });
            }}
            disabled={loading}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors sm:ml-auto"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
};

export default SchoolSettingsTab;