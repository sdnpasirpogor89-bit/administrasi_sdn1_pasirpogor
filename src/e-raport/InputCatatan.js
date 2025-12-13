import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Save } from "lucide-react";

// Inline style untuk shimmer animation
const shimmerStyle = document.createElement("style");
shimmerStyle.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
if (!document.head.querySelector("[data-shimmer-style]")) {
  shimmerStyle.setAttribute("data-shimmer-style", "true");
  document.head.appendChild(shimmerStyle);
}

function InputCatatan() {
  const [kelas, setKelas] = useState("");
  const [userId, setUserId] = useState("");
  const [siswaList, setSiswaList] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  useEffect(() => {
    if (kelas && academicYear) {
      loadData();
    }
  }, [kelas, academicYear]);

  const loadUserData = async () => {
    const sessionData = localStorage.getItem("userSession");
    console.log("🔍 Session from localStorage:", sessionData);

    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        console.log("🔍 Parsed user data:", userData);

        if (userData.kelas) {
          setKelas(userData.kelas);
          console.log("✅ Kelas set to:", userData.kelas);
        }

        if (userData.id) {
          setUserId(userData.id);
          console.log("✅ User ID set to:", userData.id);
        }
      } catch (error) {
        console.error("❌ Error parsing session:", error);
      }
    }
  };

  const loadActiveAcademicYear = async () => {
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("is_active", true)
      .single();

    console.log("📅 Active Academic Year:", data);
    setAcademicYear(data);
  };

  const loadData = async () => {
    setLoading(true);

    // Load siswa
    const { data: students } = await supabase
      .from("students")
      .select("*")
      .eq("kelas", kelas)
      .eq("is_active", true)
      .order("nama_siswa");

    // Load existing catatan
    const { data: existingCatatan } = await supabase
      .from("catatan_eraport")
      .select("*")
      .eq("academic_year_id", academicYear?.id)
      .eq("semester", academicYear?.semester);

    console.log("📝 Existing Catatan:", existingCatatan);

    // Merge data
    const merged = students?.map((siswa) => {
      const catatan = existingCatatan?.find((c) => c.student_id === siswa.id);

      return {
        ...siswa,
        catatan_id: catatan?.id,
        catatan_wali_kelas: catatan?.catatan_wali_kelas || "",
      };
    });

    setSiswaList(merged || []);
    setLoading(false);
  };

  const handleCatatanChange = (index, value) => {
    const updated = [...siswaList];
    updated[index].catatan_wali_kelas = value;
    setSiswaList(updated);
  };

  const handleSave = async () => {
    setSaving(true);

    // Filter siswa yang ada catatannya
    const siswaWithCatatan = siswaList.filter(
      (siswa) =>
        siswa.catatan_wali_kelas && siswa.catatan_wali_kelas.trim() !== ""
    );

    setSaveProgress({ current: 0, total: siswaWithCatatan.length });
    console.log("🔍 Starting save...");
    console.log("🔍 User ID:", userId);
    console.log("🔍 Kelas:", kelas);
    console.log("🔍 Total siswa dengan catatan:", siswaWithCatatan.length);

    if (!userId) {
      alert("User ID tidak ditemukan! Silakan login ulang.");
      setSaving(false);
      return;
    }

    if (siswaWithCatatan.length === 0) {
      alert("Tidak ada catatan untuk disimpan!");
      setSaving(false);
      return;
    }

    // ⭐ OPTIMASI: Proses parallel dengan batching
    const batchSize = 5; // Proses 5 siswa sekaligus
    for (let i = 0; i < siswaWithCatatan.length; i += batchSize) {
      const batch = siswaWithCatatan.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (siswa, batchIndex) => {
          const currentIndex = i + batchIndex;

          if (siswa.catatan_id) {
            // Update existing catatan
            console.log("🔄 Updating catatan for:", siswa.nama_siswa);
            const { error } = await supabase
              .from("catatan_eraport")
              .update({
                catatan_wali_kelas: siswa.catatan_wali_kelas,
                updated_at: new Date(),
              })
              .eq("id", siswa.catatan_id);

            if (error) {
              console.error("❌ Update error:", error);
            } else {
              console.log("✅ Updated:", siswa.nama_siswa);
            }
          } else {
            // Insert new catatan
            console.log("➕ Inserting catatan for:", siswa.nama_siswa);

            const insertData = {
              student_id: siswa.id,
              academic_year_id: academicYear?.id,
              semester: academicYear?.semester,
              catatan_wali_kelas: siswa.catatan_wali_kelas,
              created_by: userId,
            };

            console.log("📦 Insert data:", insertData);

            const { data, error } = await supabase
              .from("catatan_eraport")
              .insert(insertData)
              .select()
              .single();

            if (error) {
              console.error("❌ Insert error:", error);
              console.error("❌ Error details:", JSON.stringify(error));
            } else {
              console.log("✅ Inserted:", data);
            }
          }

          // Update progress
          setSaveProgress({
            current: currentIndex + 1,
            total: siswaWithCatatan.length,
          });
        })
      );
    }

    alert("Data berhasil disimpan!");
    setSaving(false);
    setSaveProgress({ current: 0, total: 0 });
    // Reload data untuk update catatan_id
    loadData();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 transition-colors duration-200">
        <h2 className="text-base md:text-lg lg:text-xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          INPUT CATATAN WALI KELAS
        </h2>

        {/* Filter */}
        <div className="mb-4 md:mb-6 bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-lg transition-colors duration-200">
          <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Pilih Kelas
          </label>
          <input
            type="text"
            value={kelas ? `Kelas ${kelas}` : ""}
            disabled
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-red-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
          />
        </div>

        {kelas && !loading && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] text-sm md:text-base font-semibold">
                <Save size={18} />
                Simpan Semua Data
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border-collapse text-xs md:text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-red-700 dark:bg-red-900 text-white">
                    <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-12 md:w-16 text-center">
                      No
                    </th>
                    <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-32 md:w-40 text-center">
                      NISN
                    </th>
                    <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 w-48 md:w-64 text-center">
                      Nama Siswa
                    </th>
                    <th className="border border-red-600 dark:border-red-800 p-2 md:p-3 text-center">
                      CATATAN WALI KELAS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {siswaList.map((siswa, idx) => (
                    <tr
                      key={siswa.id}
                      className={
                        idx % 2 === 0
                          ? "bg-red-50/30 dark:bg-gray-800/50"
                          : "bg-white dark:bg-gray-900"
                      }>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 text-center font-medium text-gray-900 dark:text-gray-100">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 text-center text-gray-800 dark:text-gray-200">
                        {siswa.nisn}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-2 md:p-3 text-gray-900 dark:text-gray-100 font-medium">
                        {siswa.nama_siswa}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-1 md:p-2">
                        <textarea
                          value={siswa.catatan_wali_kelas}
                          onChange={(e) =>
                            handleCatatanChange(idx, e.target.value)
                          }
                          className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 text-xs md:text-sm min-h-[100px]"
                          rows="3"
                          placeholder="Tulis catatan untuk siswa..."
                        />
                        {siswa.catatan_wali_kelas && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {siswa.catatan_wali_kelas.length} karakter
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-8 md:py-12">
            <div className="inline-flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-red-200 dark:border-red-800/30 border-t-red-700 dark:border-t-red-500 rounded-full animate-spin"></div>
                <div
                  className="w-12 h-12 md:w-16 md:h-16 border-4 border-transparent border-t-red-500 dark:border-t-red-400 rounded-full animate-spin absolute top-0 left-0"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1s",
                  }}></div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-3 md:mt-4 font-medium text-sm md:text-base">
                Memuat data siswa...
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mt-1">
                Mohon tunggu sebentar
              </p>
            </div>
          </div>
        )}

        {!kelas && !loading && (
          <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm md:text-base">
              Silakan login sebagai wali kelas untuk melihat data siswa.
            </p>
          </div>
        )}
      </div>

      {/* Overlay Loading saat Save - Fullscreen di tengah layar */}
      {saving && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="flex flex-col items-center">
              {/* Spinning Circles */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6">
                <div className="absolute inset-0 border-4 border-red-200 dark:border-red-800/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-red-700 dark:border-t-red-600 rounded-full animate-spin"></div>
                <div
                  className="absolute inset-2 border-4 border-transparent border-t-red-500 dark:border-t-red-500 rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.5s",
                  }}></div>
                <div
                  className="absolute inset-4 border-4 border-transparent border-t-red-400 dark:border-t-red-400 rounded-full animate-spin"
                  style={{ animationDuration: "2s" }}></div>
              </div>

              {/* Text */}
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                Menyimpan Catatan
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm md:text-base mb-4">
                Mohon tunggu, jangan tutup halaman ini...
              </p>

              {/* Progress */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-700 dark:from-red-600 dark:to-red-800 h-2 rounded-full transition-all duration-500 ease-out relative"
                  style={{
                    width: `${
                      saveProgress.total > 0
                        ? (saveProgress.current / saveProgress.total) * 100
                        : 0
                    }%`,
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 dark:via-white/30 to-transparent opacity-40 animate-shimmer"></div>
                </div>
              </div>

              {/* Counter */}
              <p className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                {saveProgress.current} dari {saveProgress.total} siswa
              </p>

              {/* Percentage */}
              <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-500 mt-2">
                {saveProgress.total > 0
                  ? Math.round(
                      (saveProgress.current / saveProgress.total) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InputCatatan;
