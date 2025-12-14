import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Save, Lock } from "lucide-react";

function InputKehadiran() {
  const [kelas, setKelas] = useState("");
  const [userId, setUserId] = useState("");
  const [siswaList, setSiswaList] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [periode, setPeriode] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  useEffect(() => {
    if (kelas && academicYear && periode) {
      loadData();
    }
  }, [kelas, academicYear, periode]);

  const loadUserData = async () => {
    const sessionData = localStorage.getItem("userSession");
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        if (userData.kelas) setKelas(userData.kelas);
        if (userData.id) setUserId(userData.id);
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }
  };

  const loadActiveAcademicYear = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setAcademicYear(data);
    } catch (error) {
      console.error("Error loading academic year:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const kelasInt = parseInt(kelas);

      // Load students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", kelas)
        .eq("is_active", true)
        .order("nama_siswa");

      if (studentsError) throw studentsError;

      if (!students?.length) {
        setSiswaList([]);
        setLoading(false);
        return;
      }

      // Load saved summary data untuk periode ini (if any)
      const { data: summaryData, error: summaryError } = await supabase
        .from("attendance_eraport")
        .select("*")
        .eq("kelas", kelasInt)
        .eq("tahun_ajaran", academicYear?.year)
        .eq("periode", periode);

      if (summaryError) throw summaryError;

      // Check if any data is locked
      setIsLocked(summaryData?.some((s) => s.is_locked) || false);

      // Map students dengan data yang udah disimpan, atau default 0
      const mappedStudents = students.map((siswa) => {
        const savedSummary = summaryData?.find((s) => s.nisn === siswa.nisn);

        return {
          ...siswa,
          sakit: savedSummary?.sakit || 0,
          izin: savedSummary?.izin || 0,
          alpa: savedSummary?.alpa || 0,
          summary_id: savedSummary?.id,
          is_locked: savedSummary?.is_locked || false,
        };
      });

      setSiswaList(mappedStudents);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKehadiranChange = (index, field, value) => {
    if (isLocked) {
      alert("Data sudah dikunci!");
      return;
    }
    const updated = [...siswaList];
    // Kalau value kosong, set 0
    updated[index][field] = value === "" ? 0 : parseInt(value) || 0;
    setSiswaList(updated);
  };

  const handleSave = async () => {
    if (!periode) {
      alert("Pilih periode terlebih dahulu!");
      return;
    }

    if (isLocked) {
      alert("Data sudah dikunci!");
      return;
    }

    // Cek apakah ada data yang sudah tersimpan sebelumnya
    const hasExistingData = siswaList.some((siswa) => siswa.summary_id);

    if (hasExistingData) {
      const konfirmasi = window.confirm(
        "Data untuk periode ini sudah ada sebelumnya.\n\nApakah Anda ingin menimpanya?\n\nKlik OK untuk menimpa data lama.\nKlik Cancel untuk membatalkan."
      );

      if (!konfirmasi) {
        return; // Batalkan simpan
      }
    } else {
      // Data baru, konfirmasi biasa
      if (!window.confirm("Simpan data kehadiran siswa?")) return;
    }

    setSaving(true);
    setSaveProgress({ current: 0, total: siswaList.length });

    try {
      const kelasInt = parseInt(kelas);
      const toUpdate = [];
      const toInsert = [];

      siswaList.forEach((siswa) => {
        const data = {
          nisn: siswa.nisn,
          nama_siswa: siswa.nama_siswa,
          kelas: kelasInt,
          tahun_ajaran: academicYear.year,
          periode: periode,
          sakit: siswa.sakit,
          izin: siswa.izin,
          alpa: siswa.alpa,
          is_auto_calculated: false,
        };

        if (siswa.summary_id) {
          toUpdate.push({ ...data, id: siswa.summary_id, updated_by: userId });
        } else {
          toInsert.push({ ...data, created_by: userId });
        }
      });

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("attendance_eraport")
          .insert(toInsert);

        if (insertError) throw insertError;
        setSaveProgress({ current: toInsert.length, total: siswaList.length });
      }

      if (toUpdate.length > 0) {
        for (let i = 0; i < toUpdate.length; i++) {
          const record = toUpdate[i];
          const { id, ...updateData } = record;

          const { error: updateError } = await supabase
            .from("attendance_eraport")
            .update(updateData)
            .eq("id", id);

          if (updateError) throw updateError;

          setSaveProgress({
            current: toInsert.length + i + 1,
            total: siswaList.length,
          });
        }
      }

      alert("Data berhasil disimpan!");
      await loadData();
    } catch (error) {
      console.error("Save error:", error);
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Input Absensi Siswa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">
              Kelas
            </label>
            <input
              type="text"
              value={kelas ? `Kelas ${kelas}` : ""}
              disabled
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">
              Periode
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
              <option value="">-- Pilih Periode --</option>
              <option value="mid_ganjil">Mid Semester Ganjil</option>
              <option value="mid_genap">Mid Semester Genap</option>
            </select>
          </div>
        </div>

        {isLocked && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Lock size={16} />
              <span className="font-medium">Data terkunci</span>
            </div>
          </div>
        )}

        {kelas && periode && !loading && siswaList.length > 0 && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleSave}
                disabled={isLocked || saving}
                className={`flex items-center gap-2 px-4 py-2 rounded ${
                  isLocked || saving
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    : "bg-red-700 dark:bg-red-600 text-white hover:bg-red-800 dark:hover:bg-red-700"
                }`}>
                <Save size={16} />
                Simpan Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-red-800 dark:bg-red-900 text-white">
                    <th className="border p-2 w-12">No</th>
                    <th className="border p-2">NISN</th>
                    <th className="border p-2">Nama Siswa</th>
                    <th className="border p-2">Sakit</th>
                    <th className="border p-2">Izin</th>
                    <th className="border p-2">Alpa</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaList.map((siswa, idx) => (
                    <tr
                      key={siswa.id}
                      className={
                        idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""
                      }>
                      <td className="border p-2 text-center text-gray-700 dark:text-gray-300">
                        {idx + 1}
                      </td>
                      <td className="border p-2 text-center text-gray-600 dark:text-gray-400">
                        {siswa.nisn}
                      </td>
                      <td className="border p-2 text-gray-800 dark:text-gray-200">
                        {siswa.nama_siswa}
                      </td>
                      <td className="border p-1 text-center">
                        <input
                          type="number"
                          value={siswa.sakit}
                          onChange={(e) =>
                            handleKehadiranChange(idx, "sakit", e.target.value)
                          }
                          onFocus={(e) => {
                            e.target.select();
                          }}
                          onClick={(e) => {
                            e.target.select();
                          }}
                          disabled={isLocked}
                          className="w-16 p-1 border rounded text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                          min="0"
                        />
                      </td>
                      <td className="border p-1 text-center">
                        <input
                          type="number"
                          value={siswa.izin}
                          onChange={(e) =>
                            handleKehadiranChange(idx, "izin", e.target.value)
                          }
                          onFocus={(e) => {
                            e.target.select();
                          }}
                          onClick={(e) => {
                            e.target.select();
                          }}
                          disabled={isLocked}
                          className="w-16 p-1 border rounded text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                          min="0"
                        />
                      </td>
                      <td className="border p-1 text-center">
                        <input
                          type="number"
                          value={siswa.alpa}
                          onChange={(e) =>
                            handleKehadiranChange(idx, "alpa", e.target.value)
                          }
                          onFocus={(e) => {
                            e.target.select();
                          }}
                          onClick={(e) => {
                            e.target.select();
                          }}
                          disabled={isLocked}
                          className="w-16 p-1 border rounded text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
                    <td
                      colSpan="3"
                      className="border p-2 text-right text-gray-700 dark:text-gray-300">
                      Total
                    </td>
                    <td className="border p-2 text-center text-red-700 dark:text-red-400">
                      {siswaList.reduce((a, b) => a + b.sakit, 0)}
                    </td>
                    <td className="border p-2 text-center text-red-700 dark:text-red-400">
                      {siswaList.reduce((a, b) => a + b.izin, 0)}
                    </td>
                    <td className="border p-2 text-center text-red-700 dark:text-red-400">
                      {siswaList.reduce((a, b) => a + b.alpa, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-red-200 dark:border-red-900 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Memuat...</p>
            </div>
          </div>
        )}

        {!loading && kelas && periode && siswaList.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Tidak ada data siswa untuk kelas ini
          </div>
        )}

        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-red-200 dark:border-red-900 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin mb-4"></div>
                <p className="font-medium text-gray-800 dark:text-white">
                  Menyimpan...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {saveProgress.current} dari {saveProgress.total}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InputKehadiran;
