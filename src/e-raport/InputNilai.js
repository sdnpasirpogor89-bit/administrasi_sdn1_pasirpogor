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
document.head.appendChild(shimmerStyle);

function InputNilai() {
  const [kelas, setKelas] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [siswaList, setSiswaList] = useState([]);
  const [tpList, setTpList] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  const mataPelajaran = [
    "PABP",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "IPAS",
    "Matematika",
    "Bahasa Sunda",
    "Seni Budaya",
    "PJOK",
  ];

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  useEffect(() => {
    if (kelas && selectedMapel && academicYear) {
      loadData();
    }
  }, [kelas, selectedMapel, academicYear]);

  const loadUserData = async () => {
    // Get user session from localStorage
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

        // ⭐ SET USER ID
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

    // Get class_id from kelas
    const { data: classData } = await supabase
      .from("classes")
      .select("id")
      .eq("grade", `Kelas ${kelas}`)
      .eq("academic_year", academicYear?.year)
      .single();

    if (!classData) {
      console.error("Class not found");
      setLoading(false);
      return;
    }

    console.log("🔍 Class ID:", classData.id);

    // Load siswa
    const { data: students } = await supabase
      .from("students")
      .select("*")
      .eq("kelas", kelas)
      .eq("is_active", true)
      .order("nama_siswa");

    // Load nilai katrol
    const { data: nilaiData } = await supabase
      .from("nilai_katrol")
      .select("*")
      .eq("kelas", kelas)
      .eq("mata_pelajaran", selectedMapel)
      .eq("semester", academicYear?.semester)
      .eq("tahun_ajaran", academicYear?.year);

    // Load TP
    const { data: tp, error: tpError } = await supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("class_id", classData.id) // ⭐ TAMBAHKAN FILTER CLASS_ID
      .eq("mata_pelajaran", selectedMapel)
      .eq("semester", academicYear?.semester)
      .eq("tahun_ajaran", academicYear?.year)
      .order("urutan");

    console.log("📚 TP Query params:", {
      class_id: classData.id,
      mata_pelajaran: selectedMapel,
      semester: academicYear?.semester,
      tahun_ajaran: academicYear?.year,
    });
    console.log("📚 TP Result:", tp);
    console.log("📚 TP Count:", tp?.length || 0);

    if (tpError) console.error("❌ TP Load Error:", tpError);

    setTpList(tp || []);

    // Load existing mini_erapor
    const { data: existingRapor } = await supabase
      .from("mini_erapor")
      .select("*, mini_erapor_detail(*)")
      .eq("class_id", classData.id)
      .eq("mata_pelajaran", selectedMapel)
      .eq("semester", academicYear?.semester)
      .eq("tahun_ajaran_id", academicYear?.id)
      .eq("periode", "Tengah Semester"); // ⭐ TAMBAHKAN FILTER PERIODE juga

    console.log("🔍 Existing Rapor:", existingRapor);

    // Merge data
    const merged = students?.map((siswa) => {
      const nilai = nilaiData?.find((n) => n.nisn === siswa.nisn) || {};
      const rapor = existingRapor?.find((r) => r.student_id === siswa.id);

      // Hitung rata NH dari yang ada
      const nhValues = [
        nilai.nh1_katrol,
        nilai.nh2_katrol,
        nilai.nh3_katrol,
        nilai.nh4_katrol,
        nilai.nh5katrol,
      ].filter((val) => val != null && val !== "" && !isNaN(val));

      const rataNH =
        nhValues.length > 0
          ? nhValues.reduce((a, b) => Number(a) + Number(b), 0) /
            nhValues.length
          : 0;

      const utsKatrol = Number(nilai.uts_katrol) || 0;
      const nilaiMid =
        rataNH > 0 || utsKatrol > 0
          ? Math.round(rataNH * 0.6 + utsKatrol * 0.4)
          : 0;

      return {
        ...siswa,
        nilai_mid: rapor?.nilai_akhir || nilaiMid,
        rapor_id: rapor?.id,
        tp_tercapai:
          rapor?.mini_erapor_detail
            ?.filter((d) => d.status === "sudah_menguasai") // ⭐ FIX
            .map((d) => d.tujuan_pembelajaran_id) || [],
        tp_peningkatan:
          rapor?.mini_erapor_detail
            ?.filter((d) => d.status === "perlu_perbaikan") // ⭐ FIX
            .map((d) => d.tujuan_pembelajaran_id) || [],
      };
    });

    setSiswaList(merged || []);
    setLoading(false);
  };

  const handleNilaiChange = (index, value) => {
    const updated = [...siswaList];
    updated[index].nilai_mid = value;
    setSiswaList(updated);
  };

  const handleTPChange = (index, tpId, type) => {
    const updated = [...siswaList];
    const student = updated[index];

    if (type === "tercapai") {
      if (student.tp_tercapai.includes(tpId)) {
        student.tp_tercapai = student.tp_tercapai.filter((id) => id !== tpId);
      } else {
        student.tp_tercapai = [...student.tp_tercapai, tpId];
        student.tp_peningkatan = student.tp_peningkatan.filter(
          (id) => id !== tpId
        );
      }
    } else {
      if (student.tp_peningkatan.includes(tpId)) {
        student.tp_peningkatan = student.tp_peningkatan.filter(
          (id) => id !== tpId
        );
      } else {
        student.tp_peningkatan = [...student.tp_peningkatan, tpId];
        student.tp_tercapai = student.tp_tercapai.filter((id) => id !== tpId);
      }
    }

    setSiswaList(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveProgress({ current: 0, total: siswaList.length });
    console.log("🔍 Starting save...");
    console.log("🔍 User ID:", userId);
    console.log("🔍 Kelas:", kelas);

    if (!userId) {
      alert("User ID tidak ditemukan! Silakan login ulang.");
      setSaving(false);
      return;
    }

    // Get class_id
    const { data: classData } = await supabase
      .from("classes")
      .select("id")
      .eq("grade", `Kelas ${kelas}`)
      .eq("academic_year", academicYear?.year)
      .single();

    if (!classData) {
      alert("Class not found!");
      setSaving(false);
      return;
    }

    console.log("🔍 Class ID for save:", classData.id);

    // ⭐ OPTIMASI: Proses parallel dengan batching
    const batchSize = 5; // Proses 5 siswa sekaligus
    for (let i = 0; i < siswaList.length; i += batchSize) {
      const batch = siswaList.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (siswa, batchIndex) => {
          const currentIndex = i + batchIndex;
          let raporId = siswa.rapor_id;

          // Insert atau update mini_erapor
          if (raporId) {
            console.log("🔄 Updating rapor:", raporId);
            const { error } = await supabase
              .from("mini_erapor")
              .update({
                nilai_akhir: siswa.nilai_mid,
                periode: "Tengah Semester",
                updated_at: new Date(),
              })
              .eq("id", raporId);

            if (error) console.error("❌ Update error:", error);
          } else {
            console.log("➕ Inserting new rapor for:", siswa.nama_siswa);

            const insertData = {
              student_id: siswa.id,
              class_id: classData.id,
              mata_pelajaran: selectedMapel,
              guru_id: userId,
              nilai_akhir: siswa.nilai_mid,
              periode: "Tengah Semester",
              semester: academicYear?.semester,
              tahun_ajaran_id: academicYear?.id,
              status: "draft",
            };

            console.log("📦 Insert data:", insertData);

            const { data, error } = await supabase
              .from("mini_erapor")
              .insert(insertData)
              .select()
              .single();

            if (error) {
              console.error("❌ Insert error:", error);
              console.error("❌ Error details:", JSON.stringify(error));
            } else {
              console.log("✅ Inserted:", data);
              raporId = data?.id;
            }
          }

          if (!raporId) return;

          // Delete existing details
          await supabase
            .from("mini_erapor_detail")
            .delete()
            .eq("mini_erapor_id", raporId);

          // Insert new details
          const details = [
            ...siswa.tp_tercapai.map((tpId) => ({
              mini_erapor_id: raporId,
              tujuan_pembelajaran_id: tpId,
              status: "sudah_menguasai",
            })),
            ...siswa.tp_peningkatan.map((tpId) => ({
              mini_erapor_id: raporId,
              tujuan_pembelajaran_id: tpId,
              status: "perlu_perbaikan",
            })),
          ];

          console.log(`📝 Details untuk ${siswa.nama_siswa}:`, details);
          console.log(`   - TP Tercapai: ${siswa.tp_tercapai.length}`);
          console.log(`   - TP Peningkatan: ${siswa.tp_peningkatan.length}`);

          if (details.length > 0) {
            console.log("💾 Inserting details...");
            const { data: detailData, error } = await supabase
              .from("mini_erapor_detail")
              .insert(details)
              .select();

            if (error) {
              console.error("❌ Detail insert error:", error);
              console.error("❌ Detail error full:", JSON.stringify(error));
            } else {
              console.log("✅ Details inserted:", detailData);
            }
          } else {
            console.log("⚠️ No details to insert (tidak ada TP yang dipilih)");
          }

          // Update progress
          setSaveProgress({
            current: currentIndex + 1,
            total: siswaList.length,
          });
        })
      );
    }

    alert("Data berhasil disimpan!");
    setSaving(false);
    setSaveProgress({ current: 0, total: 0 });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-4 sm:p-6 lg:p-8">
        <h2 className="text-base md:text-lg lg:text-xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          INPUT NILAI AKHIR RAPOR SISWA
        </h2>

        {/* Filter - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
          <div>
            <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Pilih Kelas
            </label>
            <input
              type="text"
              value={kelas ? `Kelas ${kelas}` : ""}
              disabled
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Pilih Mapel
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent dark:focus:border-transparent transition-all">
              <option value="" className="dark:bg-gray-800">
                -- Pilih Mata Pelajaran --
              </option>
              {mataPelajaran.map((mp) => (
                <option
                  key={mp}
                  value={mp}
                  className="dark:bg-gray-800 dark:text-gray-100">
                  {mp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMapel && !loading && (
          <>
            <div className="flex justify-end mb-4 sm:mb-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] min-w-[44px]">
                <Save size={18} />
                <span className="hidden sm:inline">Simpan Semua Data</span>
                <span className="sm:hidden">Simpan</span>
              </button>
            </div>

            {/* Table - Responsive */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-red-700 dark:bg-red-800 text-white">
                    <th className="border border-red-800 dark:border-red-900 p-2 sm:p-3 text-center min-w-[50px]">
                      No
                    </th>
                    <th className="border border-red-800 dark:border-red-900 p-2 sm:p-3 min-w-[150px]">
                      Nama Siswa
                    </th>
                    <th className="border border-red-800 dark:border-red-900 p-2 sm:p-3 text-center min-w-[100px]">
                      NISN
                    </th>
                    <th className="border border-red-800 dark:border-red-900 p-2 sm:p-3 text-center min-w-[90px]">
                      Nilai
                    </th>
                    <th className="border border-red-800 dark:border-red-900 p-2 sm:p-3 min-w-[250px]">
                      TP Yang diukur dan Tercapai dengan Optimal
                    </th>
                    <th className="border border-red-800 dark:border-red-900 p-2 sm:p-3 min-w-[250px]">
                      TP yang diukur dan Perlu Peningkatan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {siswaList.map((siswa, idx) => (
                    <tr
                      key={siswa.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <td className="border border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center text-gray-800 dark:text-gray-200">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-gray-800 dark:text-gray-200">
                        {siswa.nama_siswa}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center text-gray-800 dark:text-gray-200">
                        {siswa.nisn}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center">
                        <input
                          type="number"
                          value={siswa.nilai_mid}
                          onChange={(e) =>
                            handleNilaiChange(idx, e.target.value)
                          }
                          className="w-16 sm:w-20 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                        <div className="space-y-1 sm:space-y-2 max-h-[200px] overflow-y-auto pr-2">
                          {tpList.map((tp) => (
                            <label
                              key={tp.id}
                              className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 sm:p-2 rounded transition-colors group min-h-[44px]">
                              <input
                                type="checkbox"
                                checked={siswa.tp_tercapai.includes(tp.id)}
                                onChange={() =>
                                  handleTPChange(idx, tp.id, "tercapai")
                                }
                                className="mt-1 sm:mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500 dark:focus:ring-red-400 focus:ring-2"
                              />
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 flex-1">
                                {tp.deskripsi_tp}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                        <div className="space-y-1 sm:space-y-2 max-h-[200px] overflow-y-auto pr-2">
                          {tpList.map((tp) => (
                            <label
                              key={tp.id}
                              className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 sm:p-2 rounded transition-colors group min-h-[44px]">
                              <input
                                type="checkbox"
                                checked={siswa.tp_peningkatan.includes(tp.id)}
                                onChange={() =>
                                  handleTPChange(idx, tp.id, "peningkatan")
                                }
                                className="mt-1 sm:mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500 dark:focus:ring-red-400 focus:ring-2"
                              />
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 flex-1">
                                {tp.deskripsi_tp}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-200 dark:border-red-900 border-t-red-700 dark:border-t-red-500 rounded-full animate-spin"></div>
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-transparent border-t-red-600 dark:border-t-red-400 rounded-full animate-spin absolute top-0 left-0"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1s",
                  }}></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium text-sm sm:text-base">
                Memuat data...
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-1">
                Mohon tunggu sebentar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay Loading saat Save */}
      {saving && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full transform transition-all">
            <div className="flex flex-col items-center">
              {/* Spinning Circles */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
                <div className="absolute inset-0 border-4 border-red-200 dark:border-red-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-red-700 dark:border-t-red-500 rounded-full animate-spin"></div>
                <div
                  className="absolute inset-2 border-4 border-transparent border-t-red-600 dark:border-t-red-400 rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.5s",
                  }}></div>
                <div
                  className="absolute inset-4 border-4 border-transparent border-t-red-500 dark:border-t-red-300 rounded-full animate-spin"
                  style={{ animationDuration: "2s" }}></div>
              </div>

              {/* Text */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
                Menyimpan Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base mb-4">
                Mohon tunggu, jangan tutup halaman ini...
              </p>

              {/* Progress */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-700 dark:from-red-600 dark:to-red-800 h-2 rounded-full transition-all duration-500 ease-out relative"
                  style={{
                    width: `${
                      (saveProgress.current / saveProgress.total) * 100
                    }%`,
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-40 animate-shimmer"></div>
                </div>
              </div>

              {/* Counter */}
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                {saveProgress.current} dari {saveProgress.total} siswa
              </p>

              {/* Percentage */}
              <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-500 mt-2">
                {Math.round((saveProgress.current / saveProgress.total) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InputNilai;
