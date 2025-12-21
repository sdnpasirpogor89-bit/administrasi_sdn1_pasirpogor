import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ExcelJS from "exceljs"; // Ganti XLSX dengan ExcelJS

const PreviewRaport = ({
  kelas,
  periode,
  setPeriode,
  academicYear,
  userData,
}) => {
  const [siswaList, setSiswaList] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  // Load siswa list when component mounts
  useEffect(() => {
    if (kelas && academicYear && periode) {
      loadData();
    }
  }, [kelas, academicYear, periode]);

  const loadData = async () => {
    if (!kelas) {
      setError("Kelas tidak tersedia");
      return;
    }

    if (!periode) {
      setError("Pilih periode terlebih dahulu");
      return;
    }

    if (!academicYear) {
      setError("Data tahun ajaran aktif belum tersedia");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Query nilai_eraport dengan join students
      const { data: nilaiData, error: nilaiError } = await supabase
        .from("nilai_eraport")
        .select(`*, students!inner(nisn, nama_siswa, kelas)`)
        .eq("students.kelas", kelas)
        .eq("semester", academicYear.semester)
        .eq("tahun_ajaran_id", academicYear.id)
        .eq("periode", periode);

      if (nilaiError) throw nilaiError;

      console.log("Raw data:", nilaiData);

      // Transform data jadi format pivot
      const transformedData = transformToTableFormat(nilaiData);
      setData(transformedData);
    } catch (err) {
      setError("Gagal mengambil data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transformToTableFormat = (rawData) => {
    const siswaMap = new Map();

    rawData.forEach((item) => {
      const nisn = item.students.nisn;

      if (!siswaMap.has(nisn)) {
        siswaMap.set(nisn, {
          nisn: item.students.nisn,
          nama_siswa: item.students.nama_siswa,
          pabp: "-",
          pancasila: "-",
          bindo: "-",
          mtk: "-",
          ipas: "-",
          pjok: "-",
          senbud: "-",
          bsunda: "-",
          bing: "-",
        });
      }

      const siswa = siswaMap.get(nisn);
      const mapel = item.mata_pelajaran.toLowerCase();

      // Mapping mata pelajaran
      if (
        mapel.includes("paibp") ||
        mapel.includes("pabp") ||
        mapel.includes("agama")
      )
        siswa.pabp = item.nilai_akhir;
      else if (mapel.includes("pancasila") || mapel.includes("ppkn"))
        siswa.pancasila = item.nilai_akhir;
      else if (mapel.includes("indonesia") || mapel.includes("indo"))
        siswa.bindo = item.nilai_akhir;
      else if (mapel.includes("mtk") || mapel.includes("matematika"))
        siswa.mtk = item.nilai_akhir;
      else if (mapel.includes("ipas")) siswa.ipas = item.nilai_akhir;
      else if (mapel.includes("pjok") || mapel.includes("jasmani"))
        siswa.pjok = item.nilai_akhir;
      else if (mapel.includes("seni") || mapel.includes("senbud"))
        siswa.senbud = item.nilai_akhir;
      else if (mapel.includes("sunda")) siswa.bsunda = item.nilai_akhir;
      else if (mapel.includes("inggris") || mapel.includes("ing"))
        siswa.bing = item.nilai_akhir;
    });

    // Convert map to array dan hitung jumlah + rata-rata
    const result = Array.from(siswaMap.values()).map((siswa) => {
      const nilaiArray = [
        siswa.pabp,
        siswa.pancasila,
        siswa.bindo,
        siswa.mtk,
        siswa.ipas,
        siswa.pjok,
        siswa.senbud,
        siswa.bsunda,
        siswa.bing,
      ].filter((n) => n !== "-" && !isNaN(parseFloat(n)));

      const jumlah = nilaiArray.reduce((sum, n) => sum + parseFloat(n), 0);
      const rataRata =
        nilaiArray.length > 0 ? Math.round(jumlah / nilaiArray.length) : "-";

      return {
        ...siswa,
        jumlah: nilaiArray.length > 0 ? Math.round(jumlah) : "-",
        rata_rata: rataRata,
      };
    });

    // ✅ URUTKAN BERDASARKAN NAMA SISWA (A-Z)
    result.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

    // ✅ TAMBAHKAN NOMOR URUT SETELAH DIURUTKAN
    result.forEach((siswa, index) => {
      siswa.no = index + 1;
    });

    return result;
  };

  // ========================================
  // FUNGSI EXPORT EXCEL KHUSUS RAPORT
  // ========================================
  const exportRaportExcel = async () => {
    if (data.length === 0) {
      setError("Tidak ada data untuk di-export");
      return;
    }

    setExporting(true);
    setError("");

    try {
      // 1. Buat Workbook
      const workbook = new ExcelJS.Workbook();

      // 2. Tentukan periode label
      const periodeLabel =
        periode === "mid_ganjil" ? "Mid Semester Ganjil" : "Mid Semester Genap";

      // 3. Sheet 1: LEGER NILAI (urut nama)
      const wsNilai = workbook.addWorksheet("Leger Nilai");

      // Header Sheet 1
      const headerNilai = [
        ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
        [`LEGER NILAI RAPORT - KELAS ${kelas}`],
        [
          `Tahun Ajaran: ${academicYear?.year || "2025/2026"} - Semester ${
            academicYear?.semester?.toUpperCase() || "GANJIL"
          }`,
        ],
        [`Periode: ${periodeLabel}`],
        ["(Diurutkan berdasarkan Nama Siswa)"],
        [""],
      ];

      let rowNilai = 1;
      headerNilai.forEach((row) => {
        const r = wsNilai.getRow(rowNilai++);
        r.getCell(1).value = row[0];
        wsNilai.mergeCells(`A${rowNilai - 1}:N${rowNilai - 1}`);
        r.getCell(1).font = {
          bold: true,
          size: rowNilai <= 4 ? 14 : 11,
          name: "Calibri",
        };
        r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      });

      // Table headers Sheet 1
      const headersNilai = [
        "No",
        "NISN",
        "Nama Siswa",
        "PAIBP",
        "PPKn",
        "B.IND",
        "MTK",
        "IPAS",
        "PJOK",
        "SENBUD",
        "B.SUN",
        "B.ING",
        "Jumlah",
        "Rata-rata",
      ];

      const headerRowNilai = wsNilai.getRow(rowNilai);
      headerRowNilai.values = headersNilai;
      headerRowNilai.height = 30;

      headerRowNilai.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E1F2" },
        };
        cell.font = { bold: true, size: 10 };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Column widths Sheet 1
      wsNilai.columns = [
        { width: 5 },
        { width: 14 },
        { width: 33 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 10 },
        { width: 11 },
      ];

      rowNilai++;

      // Data rows Sheet 1 (urut sesuai data asli - berdasarkan nama)
      data.forEach((row, index) => {
        const r = wsNilai.addRow([
          row.no,
          row.nisn,
          row.nama_siswa,
          row.pabp,
          row.pancasila,
          row.bindo,
          row.mtk,
          row.ipas,
          row.pjok,
          row.senbud,
          row.bsunda,
          row.bing,
          row.jumlah,
          row.rata_rata,
        ]);

        r.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          if (colNumber === 1) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNumber === 2) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.numFmt = "@";
          } else if (colNumber === 3) {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };

            if (cell.value !== "-" && typeof cell.value === "number") {
              cell.numFmt = "0";
              if (colNumber === 14 || colNumber === 13) {
                cell.font = { bold: true };
              }
            }
          }

          if (index % 2 !== 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
          }
        });
      });

      // 4. Sheet 2: LEGER PERINGKAT (urut jumlah nilai)
      const wsPeringkat = workbook.addWorksheet("Leger Peringkat");

      // Header Sheet 2
      const headerPeringkat = [
        ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
        [`LEGER PERINGKAT RAPORT - KELAS ${kelas}`],
        [
          `Tahun Ajaran: ${academicYear?.year || "2025/2026"} - Semester ${
            academicYear?.semester?.toUpperCase() || "GANJIL"
          }`,
        ],
        [`Periode: ${periodeLabel}`],
        ["(Diurutkan berdasarkan Jumlah Nilai - Tertinggi ke Terendah)"],
        [""],
      ];

      let rowPeringkat = 1;
      headerPeringkat.forEach((row) => {
        const r = wsPeringkat.getRow(rowPeringkat++);
        r.getCell(1).value = row[0];
        wsPeringkat.mergeCells(`A${rowPeringkat - 1}:N${rowPeringkat - 1}`);
        r.getCell(1).font = {
          bold: true,
          size: rowPeringkat <= 4 ? 14 : 11,
          name: "Calibri",
        };
        r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      });

      // Table headers Sheet 2
      const headersPeringkat = [
        "No",
        "NISN",
        "Nama Siswa",
        "PAIBP",
        "PPKn",
        "B.IND",
        "MTK",
        "IPAS",
        "PJOK",
        "SENBUD",
        "B.SUN",
        "B.ING",
        "Jumlah",
        "Rata-rata",
      ];

      const headerRowPeringkat = wsPeringkat.getRow(rowPeringkat);
      headerRowPeringkat.values = headersPeringkat;
      headerRowPeringkat.height = 30;

      headerRowPeringkat.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2EFDA" },
        };
        cell.font = { bold: true, size: 10 };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Column widths Sheet 2
      wsPeringkat.columns = [
        { width: 5 },
        { width: 14 },
        { width: 33 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 10 },
        { width: 11 },
      ];

      // Sort data untuk peringkat
      const peringkatData = [...data]
        .filter((item) => item.jumlah !== "-" && item.rata_rata !== "-")
        .map((item) => ({
          ...item,
          jumlah_num: item.jumlah !== "-" ? item.jumlah : 0,
          rata_rata_num: item.rata_rata !== "-" ? parseInt(item.rata_rata) : 0,
        }))
        .sort((a, b) => b.jumlah_num - a.jumlah_num);

      // Update nomor urut untuk peringkat
      peringkatData.forEach((item, index) => {
        item.no = index + 1;
      });

      rowPeringkat++;

      // Data rows Sheet 2
      peringkatData.forEach((row, index) => {
        const r = wsPeringkat.addRow([
          row.no,
          row.nisn,
          row.nama_siswa,
          row.pabp,
          row.pancasila,
          row.bindo,
          row.mtk,
          row.ipas,
          row.pjok,
          row.senbud,
          row.bsunda,
          row.bing,
          row.jumlah,
          row.rata_rata,
        ]);

        r.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          if (colNumber === 1) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            if (index < 3) {
              cell.font = { bold: true, size: 11 };
              if (index === 0) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFD700" },
                };
              } else if (index === 1) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFC0C0C0" },
                };
              } else if (index === 2) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFCD7F32" },
                };
              }
            }
          } else if (colNumber === 2) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.numFmt = "@";
          } else if (colNumber === 3) {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };

            if (cell.value !== "-" && typeof cell.value === "number") {
              cell.numFmt = "0";
              if (colNumber === 14 || colNumber === 13) {
                cell.font = { bold: true };
              }
            }
          }

          // Highlight baris 3 besar
          if (index < 3 && colNumber > 1) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  index === 0
                    ? "FFFFFFCC"
                    : index === 1
                    ? "FFE8E8E8"
                    : "FFF5E6CC",
              },
            };
          } else if (index % 2 !== 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
          }
        });
      });

      // 5. Download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Format nama file
      const semesterLabel =
        academicYear?.semester === "ganjil" ? "Ganjil" : "Genap";
      const periodeShort =
        periode === "mid_ganjil" ? "Mid_Ganjil" : "Mid_Genap";
      const tahunAjaran = academicYear?.year?.replace("/", "-") || "2025-2026";

      a.download = `Raport_${periodeShort}_Kelas_${kelas}_${tahunAjaran}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Gagal export Excel: " + err.message);
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  // Ganti handleExportLeger dengan exportRaportExcel
  const handleExportExcel = async () => {
    await exportRaportExcel();
  };

  // Icons
  const FilterIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );

  const DownloadIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  const BookIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );

  return (
    <div className="p-4 md:p-6">
      {/* FILTER SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-100 dark:border-gray-700 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Kelas Display */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              <span className="flex items-center gap-1">
                <BookIcon />
                Kelas
              </span>
            </label>
            <input
              type="text"
              value={kelas ? `Kelas ${kelas}` : ""}
              disabled
              className="w-full px-3 py-2 border border-red-300 dark:border-gray-600 rounded-lg 
                bg-red-50 dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm"
            />
          </div>

          {/* Periode Select */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              <span className="flex items-center gap-1">
                <FilterIcon />
                Pilih Periode
              </span>
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-600
                transition-all duration-200 text-sm
                hover:border-red-400 dark:hover:border-red-500">
              <option value="">-- Pilih Periode --</option>
              <option value="mid_ganjil">Mid Semester Ganjil</option>
              <option value="mid_genap">Mid Semester Genap</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 sm:items-end">
            <button
              onClick={loadData}
              disabled={loading || !periode || !kelas}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 
                hover:from-red-700 hover:to-red-800 
                dark:from-red-700 dark:to-red-800 
                dark:hover:from-red-800 dark:hover:to-red-900
                text-white text-sm font-medium rounded-lg transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                shadow-md hover:shadow-lg active:scale-[0.98]
                sm:min-w-[140px]">
              <FilterIcon />
              {loading ? "Memuat..." : "Tampilkan"}
            </button>

            <button
              onClick={handleExportExcel} // Ganti dengan handleExportExcel
              disabled={data.length === 0 || exporting}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600
                hover:from-emerald-600 hover:to-emerald-700
                dark:from-emerald-600 dark:to-emerald-700
                dark:hover:from-emerald-700 dark:hover:to-emerald-800
                text-white text-sm font-medium rounded-lg transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                shadow-md hover:shadow-lg active:scale-[0.98]
                sm:min-w-[140px]">
              <DownloadIcon />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center gap-2 pt-4 border-t border-red-100 dark:border-gray-700">
          <div
            className={`w-3 h-3 rounded-full ${
              data.length > 0 ? "bg-green-500" : "bg-gray-400"
            }`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {data.length > 0
              ? `Data tersedia: ${data.length} siswa`
              : "Klik tombol Tampilkan untuk melihat data"}
          </span>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* TABLE CONTAINER */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-100 dark:border-gray-700 overflow-hidden">
          {/* TABLE INFO BAR */}
          <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-800 border-b border-red-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <span className="text-red-700 dark:text-red-300">📋</span>
                </div>
                <div>
                  <div className="font-bold text-red-800 dark:text-red-300">
                    Preview Nilai Raport Kelas {kelas}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    • Tahun Ajaran {academicYear?.year} • Semester{" "}
                    {academicYear?.semester?.toUpperCase()} •{" "}
                    {periode === "mid_ganjil"
                      ? "Mid Semester Ganjil"
                      : "Mid Semester Genap"}
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-gray-600">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">
                  Total: <span className="font-bold">{data.length}</span> Siswa
                </div>
              </div>
            </div>
          </div>

          {/* RESPONSIVE TABLE */}
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <table className="w-full">
                <thead className="bg-red-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-2 px-3 text-left font-bold text-red-800 dark:text-red-300 text-sm w-12">
                      No
                    </th>
                    <th className="py-2 px-3 text-left font-bold text-red-800 dark:text-red-300 text-sm w-24">
                      NISN
                    </th>
                    <th className="py-2 px-3 text-left font-bold text-red-800 dark:text-red-300 text-sm min-w-[160px]">
                      Nama Siswa
                    </th>
                    {[
                      "PAIBP",
                      "PPKn",
                      "B.IND",
                      "MTK",
                      "IPAS",
                      "PJOK",
                      "SENBUD",
                      "B.SUN",
                      "B.ING",
                    ].map((mapel) => (
                      <th
                        key={mapel}
                        className="py-2 px-3 text-center font-bold text-red-800 dark:text-red-300 text-sm w-20">
                        {mapel}
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center font-bold text-red-800 dark:text-red-300 text-sm w-20">
                      Jumlah
                    </th>
                    <th className="py-2 px-3 text-center font-bold text-red-800 dark:text-red-300 text-sm w-24">
                      Rata-rata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row) => (
                    <tr
                      key={row.nisn}
                      className="hover:bg-red-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.no}
                      </td>
                      <td className="py-2 px-3 font-mono text-red-600 dark:text-red-400 text-xs">
                        {row.nisn}
                      </td>
                      <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium text-sm">
                        {row.nama_siswa}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.pabp}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.pancasila}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.bindo}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.mtk}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.ipas}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.pjok}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.senbud}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.bsunda}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {row.bing}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-red-700 dark:text-red-300 text-base">
                        {row.jumlah}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 text-base">
                        {row.rata_rata}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE FOOTER */}
          <div className="px-4 py-3 bg-red-50 dark:bg-gray-700 border-t border-red-100 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-sm text-red-600 dark:text-red-400">
                ⬅️ Scroll horizontal untuk melihat semua nilai
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300">
                  📊 {data.length} Data
                </div>
                <div className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-700 dark:text-emerald-300">
                  ✅ Siap Export
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 dark:border-red-400"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <span className="mt-4 text-red-600 dark:text-red-400 font-medium">
            Memuat data nilai raport...
          </span>
          <span className="text-sm text-red-500 dark:text-red-500 mt-1">
            Silakan tunggu sebentar
          </span>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && data.length === 0 && periode && (
        <div className="bg-gradient-to-br from-red-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border-2 border-dashed border-red-200 dark:border-gray-700 rounded-xl p-8 md:p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="text-6xl mb-4 text-red-300 dark:text-red-600">
              📋
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-red-700 dark:text-red-300 mb-3">
              Belum Ada Data Nilai Raport
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm md:text-base mb-6">
              Data nilai raport untuk kelas {kelas} periode{" "}
              {periode === "mid_ganjil"
                ? "Mid Semester Ganjil"
                : "Mid Semester Genap"}{" "}
              belum tersedia
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-red-700 dark:text-red-300">💡</span>
              <span className="text-sm text-red-600 dark:text-red-400">
                Pastikan nilai sudah diinput di menu Input Nilai
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewRaport;
