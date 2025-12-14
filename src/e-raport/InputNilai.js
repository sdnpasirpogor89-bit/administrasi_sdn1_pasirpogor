import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Save, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";

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
  const [periode, setPeriode] = useState("");
  const [siswaList, setSiswaList] = useState([]);
  const [tpList, setTpList] = useState([]);
  const [academicYear, setAcademicYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

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
    if (kelas && selectedMapel && academicYear && periode) {
      loadData();
    }
  }, [kelas, selectedMapel, academicYear, periode]);

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
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("is_active", true)
      .single();

    setAcademicYear(data);
  };

  const loadData = async () => {
    setLoading(true);

    try {
      // Get class_id
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

      // Load siswa
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", kelas)
        .eq("is_active", true)
        .order("nama_siswa");

      // Load TP
      const { data: tp } = await supabase
        .from("tujuan_pembelajaran")
        .select("*")
        .eq("class_id", classData.id)
        .eq("mata_pelajaran", selectedMapel)
        .eq("semester", academicYear?.semester)
        .eq("tahun_ajaran", academicYear?.year)
        .order("urutan");

      setTpList(tp || []);

      // Load existing nilai_eraport untuk periode ini
      const { data: existingRapor } = await supabase
        .from("nilai_eraport")
        .select("*, nilai_eraport_detail(*)")
        .eq("class_id", classData.id)
        .eq("mata_pelajaran", selectedMapel)
        .eq("semester", academicYear?.semester)
        .eq("tahun_ajaran_id", academicYear?.id)
        .eq("periode", periode);

      // Map students dengan data yang udah disimpan atau default 0
      const merged = students?.map((siswa) => {
        const rapor = existingRapor?.find((r) => r.student_id === siswa.id);

        return {
          ...siswa,
          nilai_mid: rapor?.nilai_akhir || 0,
          rapor_id: rapor?.id,
          tp_tercapai:
            rapor?.nilai_eraport_detail
              ?.filter((d) => d.status === "sudah_menguasai")
              .map((d) => d.tujuan_pembelajaran_id) || [],
          tp_peningkatan:
            rapor?.nilai_eraport_detail
              ?.filter((d) => d.status === "perlu_perbaikan")
              .map((d) => d.tujuan_pembelajaran_id) || [],
        };
      });

      setSiswaList(merged || []);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNilaiChange = (index, value) => {
    const updated = [...siswaList];
    updated[index].nilai_mid = value === "" ? 0 : parseInt(value) || 0;
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
    if (!periode) {
      alert("Pilih periode terlebih dahulu!");
      return;
    }

    if (!selectedMapel) {
      alert("Pilih mata pelajaran terlebih dahulu!");
      return;
    }

    if (!userId) {
      alert("User ID tidak ditemukan! Silakan login ulang.");
      return;
    }

    // ⚠️ VALIDASI: Cek siswa yang belum centang TP
    const siswaBlmIsiTP = siswaList.filter(
      (s) => s.tp_tercapai.length === 0 && s.tp_peningkatan.length === 0
    );

    if (siswaBlmIsiTP.length > 0) {
      const namaList = siswaBlmIsiTP.map((s) => s.nama_siswa).join("\n- ");
      const konfirmasi = window.confirm(
        `⚠️ PERINGATAN!\n\nAda ${siswaBlmIsiTP.length} siswa yang belum dicentang TP-nya:\n\n- ${namaList}\n\nData siswa ini akan disimpan TANPA detail TP.\n\nLanjutkan simpan?`
      );

      if (!konfirmasi) return;
    }

    // Cek apakah ada data yang sudah tersimpan sebelumnya
    const hasExistingData = siswaList.some((siswa) => siswa.rapor_id);

    if (hasExistingData) {
      const konfirmasi = window.confirm(
        "Data nilai untuk periode ini sudah ada sebelumnya.\n\nApakah Anda ingin menimpanya?\n\nKlik OK untuk menimpa data lama.\nKlik Cancel untuk membatalkan."
      );

      if (!konfirmasi) return;
    } else {
      if (!window.confirm("Simpan data nilai siswa?")) return;
    }

    setSaving(true);
    setSaveProgress({ current: 0, total: siswaList.length });

    try {
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

      // Proses batch untuk efisiensi
      const batchSize = 5;
      for (let i = 0; i < siswaList.length; i += batchSize) {
        const batch = siswaList.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (siswa, batchIndex) => {
            const currentIndex = i + batchIndex;
            let raporId = siswa.rapor_id;

            // Update atau Insert nilai_eraport
            if (raporId) {
              const { error } = await supabase
                .from("nilai_eraport")
                .update({
                  nilai_akhir: siswa.nilai_mid,
                  periode: periode,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", raporId);

              if (error) {
                console.error("❌ Update error:", error);
                throw error;
              }
              console.log("✅ Updated rapor_id:", raporId);
            } else {
              const insertData = {
                student_id: siswa.id,
                class_id: classData.id,
                mata_pelajaran: selectedMapel,
                guru_id: userId,
                nilai_akhir: siswa.nilai_mid,
                periode: periode,
                semester: academicYear?.semester,
                tahun_ajaran_id: academicYear?.id,
                tanggal_dibuat: new Date().toISOString().split("T")[0],
                status: "draft",
              };

              console.log("📦 Insert data:", insertData);

              const { data, error } = await supabase
                .from("nilai_eraport")
                .insert(insertData)
                .select()
                .single();

              if (error) {
                console.error("❌ Insert error:", error);
                throw error;
              }

              // ⚠️ FIX: Pastikan raporId keisi!
              if (!data || !data.id) {
                console.error("❌ Insert succeeded but no ID returned:", data);
                throw new Error("Failed to get rapor_id after insert");
              }

              raporId = data.id;
              console.log("✅ Inserted rapor_id:", raporId);
            }

            // ⚠️ FIX: Double check raporId sebelum lanjut
            if (!raporId) {
              console.error(
                "❌ No rapor_id available for student:",
                siswa.nama_siswa
              );
              throw new Error(
                `Gagal mendapatkan ID rapor untuk ${siswa.nama_siswa}`
              );
            }

            // Delete existing details
            console.log("🗑️ Deleting old details for rapor_id:", raporId);
            const { error: deleteError } = await supabase
              .from("nilai_eraport_detail")
              .delete()
              .eq("nilai_eraport_id", raporId);

            if (deleteError) {
              console.error("❌ Delete error:", deleteError);
              // Nggak throw, karena mungkin emang belum ada data
            }

            // Insert new details
            const details = [
              ...siswa.tp_tercapai.map((tpId) => ({
                nilai_eraport_id: raporId,
                tujuan_pembelajaran_id: tpId,
                status: "sudah_menguasai",
              })),
              ...siswa.tp_peningkatan.map((tpId) => ({
                nilai_eraport_id: raporId,
                tujuan_pembelajaran_id: tpId,
                status: "perlu_perbaikan",
              })),
            ];

            console.log(
              `📝 Inserting ${details.length} details for:`,
              siswa.nama_siswa
            );

            if (details.length > 0) {
              const { data: insertedDetails, error: detailError } =
                await supabase
                  .from("nilai_eraport_detail")
                  .insert(details)
                  .select(); // ⚠️ FIX: Tambah .select() biar tau berhasil atau nggak

              if (detailError) {
                console.error("❌ Detail insert error:", detailError);
                throw new Error(
                  `Gagal insert detail untuk ${siswa.nama_siswa}: ${detailError.message}`
                );
              }

              console.log("✅ Inserted details:", insertedDetails);
            } else {
              console.log("⚠️ No details to insert for:", siswa.nama_siswa);
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
      await loadData();
    } catch (error) {
      console.error("💥 Save error:", error);
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
      setSaveProgress({ current: 0, total: 0 });
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedMapel || !periode) {
      alert("Pilih Mata Pelajaran dan Periode terlebih dahulu!");
      return;
    }

    // Prepare data untuk template
    const templateData = siswaList.map((siswa, idx) => ({
      No: idx + 1,
      NISN: siswa.nisn,
      "Nama Siswa": siswa.nama_siswa,
      Nilai: "",
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Header Sekolah
    XLSX.utils.sheet_add_aoa(
      ws,
      [["SEKOLAH DASAR NEGERI 1 PASIRPOGOR"], ["DAFTAR NILAI SISWA"], [""]],
      { origin: "A1" }
    );

    // Info
    const periodeText =
      periode === "mid_ganjil" ? "Mid Semester Ganjil" : "Mid Semester Genap";
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [`Mata Pelajaran: ${selectedMapel}`],
        [`Kelas: ${kelas}`],
        [`Periode: ${periodeText}`],
        [`Tahun Ajaran: ${academicYear?.year || ""}`],
        [""],
      ],
      { origin: "A4" }
    );

    // Table data
    XLSX.utils.sheet_add_json(ws, templateData, {
      origin: "A9",
      skipHeader: false,
    });

    // Set column widths
    ws["!cols"] = [
      { wch: 5 }, // No
      { wch: 15 }, // NISN
      { wch: 30 }, // Nama Siswa
      { wch: 10 }, // Nilai
    ];

    // Merge cells untuk header
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // SEKOLAH
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // DAFTAR NILAI
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Nilai");

    // Download
    const fileName = `Template_Nilai_${selectedMapel}_Kelas${kelas}_${periodeText}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convert to JSON, skip header rows (mulai dari row 9)
        const data = XLSX.utils.sheet_to_json(ws, { range: 8 });

        if (!data || data.length === 0) {
          alert("File Excel kosong atau format tidak sesuai!");
          return;
        }

        // Map nilai dari Excel ke siswaList
        const updated = [...siswaList];
        let importCount = 0;
        let notFoundCount = 0;

        data.forEach((row) => {
          const nisn = String(row.NISN || "").trim();
          const nilai = parseInt(row.Nilai) || 0;

          if (!nisn) return;

          const index = updated.findIndex((s) => String(s.nisn) === nisn);
          if (index !== -1) {
            updated[index].nilai_mid = nilai;
            importCount++;
          } else {
            notFoundCount++;
          }
        });

        setSiswaList(updated);

        alert(
          `Import berhasil!\n\n✅ ${importCount} nilai berhasil diimport\n${
            notFoundCount > 0 ? `⚠️ ${notFoundCount} NISN tidak ditemukan` : ""
          }`
        );

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("Gagal import file! Pastikan format Excel sesuai template.");
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-4 sm:p-6 lg:p-8">
        <h2 className="text-base md:text-lg lg:text-xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          INPUT NILAI AKHIR RAPOR SISWA
        </h2>

        {/* Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
          <div>
            <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Kelas
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
              Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400">
              <option value="">-- Pilih Mata Pelajaran --</option>
              {mataPelajaran.map((mp) => (
                <option key={mp} value={mp}>
                  {mp}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Periode
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400">
              <option value="">-- Pilih Periode --</option>
              <option value="mid_ganjil">Mid Semester Ganjil</option>
              <option value="mid_genap">Mid Semester Genap</option>
            </select>
          </div>
        </div>

        {selectedMapel && periode && !loading && siswaList.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 justify-end mb-4 sm:mb-6">
              <button
                onClick={handleDownloadTemplate}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-sm sm:text-base min-h-[44px]">
                <Download size={18} />
                <span className="hidden sm:inline">Download Template</span>
                <span className="sm:hidden">Template</span>
              </button>

              <label className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer text-sm sm:text-base min-h-[44px]">
                <Upload size={18} />
                <span className="hidden sm:inline">Import dari Excel</span>
                <span className="sm:hidden">Import</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]">
                <Save size={18} />
                <span className="hidden sm:inline">Simpan Semua Data</span>
                <span className="sm:hidden">Simpan</span>
              </button>
            </div>

            {/* Table */}
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
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.target.select()}
                          className="w-16 sm:w-20 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
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
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium text-sm sm:text-base">
                Memuat data...
              </p>
            </div>
          </div>
        )}

        {!loading &&
          kelas &&
          selectedMapel &&
          periode &&
          siswaList.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Tidak ada data siswa untuk kelas ini
            </div>
          )}
      </div>

      {/* Overlay Loading saat Save */}
      {saving && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
                <div className="absolute inset-0 border-4 border-red-200 dark:border-red-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-red-700 dark:border-t-red-500 rounded-full animate-spin"></div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
                Menyimpan Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base mb-4">
                Mohon tunggu, jangan tutup halaman ini...
              </p>

              {/* Progress Bar */}
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
