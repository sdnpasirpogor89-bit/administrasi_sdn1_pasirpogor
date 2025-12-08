// ========================================
// utils.js - Helper Functions untuk Katrol Nilai
// ========================================

import ExcelJS from "exceljs";

// ========================================
// 2. GROUP DATA BY NISN
// ========================================
/**
 * Mengubah data flat dari Supabase menjadi grouped per siswa
 * Input: Array flat dari Supabase
 * Output: Array siswa dengan nilai per jenis
 *
 * @param {Array} rawData - Data dari Supabase
 * @returns {Array} - Data grouped by NISN
 *
 * Example Input:
 * [
 *   { nisn: '001', nama_siswa: 'AHMAD', jenis_nilai: 'NH1', nilai: 75 },
 *   { nisn: '001', nama_siswa: 'AHMAD', jenis_nilai: 'NH2', nilai: 80 },
 *   { nisn: '002', nama_siswa: 'SITI', jenis_nilai: 'NH1', nilai: 65 }
 * ]
 *
 * Example Output:
 * [
 *   {
 *     nisn: '001',
 *     nama_siswa: 'AHMAD',
 *     nilai: { NH1: 75, NH2: 80 }
 *   },
 *   {
 *     nisn: '002',
 *     nama_siswa: 'SITI',
 *     nilai: { NH1: 65 }
 *   }
 * ]
 */
export const groupDataByNISN = (rawData) => {
  const grouped = {};

  rawData.forEach((item) => {
    if (!grouped[item.nisn]) {
      grouped[item.nisn] = {
        nisn: item.nisn,
        nama_siswa: item.nama_siswa,
        nilai: {
          NH1: item.nh1 !== null && item.nh1 !== undefined ? item.nh1 : null,
          NH2: item.nh2 !== null && item.nh2 !== undefined ? item.nh2 : null,
          NH3: item.nh3 !== null && item.nh3 !== undefined ? item.nh3 : null,
          NH4: item.nh4 !== null && item.nh4 !== undefined ? item.nh4 : null,
          NH5: item.nh5 !== null && item.nh5 !== undefined ? item.nh5 : null,
          UTS: item.uts !== null && item.uts !== undefined ? item.uts : null,
          UAS: item.uas !== null && item.uas !== undefined ? item.uas : null,
        },
        nilai_katrol: {},
      };
    }
  });

  return Object.values(grouped);
};

// ========================================
// 3. KATROL NILAI PER JENIS
// ========================================
/**
 * Melakukan katrol nilai untuk satu jenis nilai (NH1/NH2/UTS/dll)
 * menggunakan interpolasi linear
 *
 * Formula:
 * nilai_katrol = KKM + ((nilai_asli - nilai_min) / (nilai_max - nilai_min)) * (max_nilai - KKM)
 *
 * @param {Array} dataSiswa - Array siswa dengan nilai
 * @param {string} jenisNilai - Jenis nilai yang mau dikatrol (NH1/NH2/UTS/dll)
 * @param {number} kkm - KKM mapel
 * @param {number} maxNilai - Nilai maksimal katrol (default: 90)
 * @returns {Array} - Data siswa dengan nilai_katrol ditambahkan
 */
export const katrolNilaiPerJenis = (
  dataSiswa,
  jenisNilai,
  kkm,
  maxNilai = 90
) => {
  // Ambil semua nilai untuk jenis ini (filter yang ada nilainya)
  const nilaiArray = dataSiswa
    .map((siswa) => siswa.nilai[jenisNilai])
    .filter((n) => n !== undefined && n !== null && !isNaN(n));

  // Kalau ga ada data, return as is
  if (nilaiArray.length === 0) {
    return dataSiswa;
  }

  // Cari nilai max dan min
  const nilaiMax = Math.max(...nilaiArray);
  const nilaiMin = Math.min(...nilaiArray);

  // Gap untuk interpolasi
  const gap = maxNilai - kkm;

  // Katrol setiap siswa
  return dataSiswa.map((siswa) => {
    const nilaiAsli = siswa.nilai[jenisNilai];

    // Skip kalau ga ada nilai
    if (nilaiAsli === undefined || nilaiAsli === null || isNaN(nilaiAsli)) {
      return siswa;
    }

    let nilaiKatrol;

    // Jika nilai tertinggi, langsung dapat max
    if (nilaiAsli >= nilaiMax) {
      nilaiKatrol = maxNilai;
    }
    // Jika nilai terendah, dapat KKM
    else if (nilaiAsli <= nilaiMin) {
      nilaiKatrol = kkm;
    }
    // Interpolasi linear
    else {
      const range = nilaiMax - nilaiMin;
      const posisi = (nilaiAsli - nilaiMin) / range;
      nilaiKatrol = kkm + posisi * gap;
    }

    // Return siswa dengan nilai_katrol ditambahkan
    return {
      ...siswa,
      nilai_katrol: {
        ...siswa.nilai_katrol,
        [jenisNilai]: Math.round(nilaiKatrol * 100) / 100, // Round 2 desimal
      },
    };
  });
};

// ========================================
// 4. PROSES KATROL SEMUA JENIS NILAI
// ========================================
/**
 * Melakukan katrol untuk semua jenis nilai yang ada
 *
 * @param {Array} dataSiswa - Data siswa yang sudah di-group
 * @param {number} kkm - KKM mapel (dari database)
 * @param {number} maxNilai - Nilai maksimal target katrol (dari database, default 90)
 * @returns {Array} - Data siswa dengan semua nilai sudah dikatrol
 *
 * @example
 * // KKM 75, Max 95 (dari database)
 * prosesKatrolSemua(dataSiswa, 75, 95)
 *
 * // KKM 70, Max 90 (dari database)
 * prosesKatrolSemua(dataSiswa, 70, 90)
 */
export const prosesKatrolSemua = (dataSiswa, kkm, maxNilai = 90) => {
  // Daftar jenis nilai yang perlu dikatrol
  const jenisNilai = ["NH1", "NH2", "NH3", "NH4", "NH5", "UTS", "UAS"];

  // Copy data untuk menghindari mutasi
  let hasil = [...dataSiswa];

  // Katrol setiap jenis nilai satu per satu
  jenisNilai.forEach((jenis) => {
    hasil = katrolNilaiPerJenis(hasil, jenis, kkm, maxNilai);
  });

  return hasil;
};

// ========================================
// 5. HITUNG NILAI AKHIR (REVISED - DENGAN PEMBULATAN)
// ========================================
/**
 * Menghitung nilai akhir berdasarkan rumus:
 * Nilai Akhir = 40% Rata-rata NH + 30% UTS + 30% UAS
 *
 * NILAI AKHIR DIBULATKAN ke angka bulat terdekat:
 * - 72.35 → 72.00
 * - 72.74 → 73.00
 * - 85.50 → 86.00
 *
 * @param {Array} dataSiswa - Data siswa yang sudah dikatrol
 * @returns {Array} - Data siswa dengan nilai akhir
 */
export const hitungNilaiAkhir = (dataSiswa) => {
  return dataSiswa.map((siswa) => {
    // Ambil semua NH yang ada (NH1-NH5)
    const jenisNH = ["NH1", "NH2", "NH3", "NH4", "NH5"];

    // Nilai NH Asli
    const nilaiNH_asli = jenisNH
      .map((jenis) => siswa.nilai[jenis])
      .filter((n) => n !== undefined && n !== null && !isNaN(n));

    // Nilai NH Katrol
    const nilaiNH_katrol = jenisNH
      .map((jenis) => siswa.nilai_katrol?.[jenis])
      .filter((n) => n !== undefined && n !== null && !isNaN(n));

    // Hitung rata-rata NH (tetap pakai desimal untuk akurasi)
    const rataNH_asli =
      nilaiNH_asli.length > 0
        ? nilaiNH_asli.reduce((sum, n) => sum + n, 0) / nilaiNH_asli.length
        : 0;

    const rataNH_katrol =
      nilaiNH_katrol.length > 0
        ? nilaiNH_katrol.reduce((sum, n) => sum + n, 0) / nilaiNH_katrol.length
        : 0;

    // Nilai UTS & UAS (tetap pakai desimal)
    const uts_asli = siswa.nilai.UTS || 0;
    const uas_asli = siswa.nilai.UAS || 0;
    const uts_katrol = siswa.nilai_katrol?.UTS || 0;
    const uas_katrol = siswa.nilai_katrol?.UAS || 0;

    // Hitung Nilai Akhir (dengan desimal penuh dulu)
    // Rumus: 40% NH + 30% UTS + 30% UAS
    const nilaiAkhirAsli = 0.4 * rataNH_asli + 0.3 * uts_asli + 0.3 * uas_asli;
    const nilaiAkhirKatrol =
      0.4 * rataNH_katrol + 0.3 * uts_katrol + 0.3 * uas_katrol;

    return {
      ...siswa,
      rata_NH_asli: Math.round(rataNH_asli * 100) / 100, // Rata-rata NH tetap 2 desimal
      rata_NH_katrol: Math.round(rataNH_katrol * 100) / 100, // Rata-rata NH tetap 2 desimal
      nilai_akhir_asli: Math.round(nilaiAkhirAsli), // 🔥 NILAI AKHIR DIBULATKAN
      nilai_akhir_katrol: Math.round(nilaiAkhirKatrol), // 🔥 NILAI AKHIR DIBULATKAN
    };
  });
};

// ========================================
// 6. EXPORT TO EXCEL (ExcelJS)
// ========================================
/**
 * Export data katrol ke Excel dengan format profesional
 * @param {Array} data - Data hasil katrol
 * @param {string} mapel - Nama mata pelajaran
 * @param {string} kelas - Kelas
 * @param {string} type - 'lengkap' atau 'ringkas'
 * @param {Object} userData - Data user dari database {role, name, username}
 */
export const exportToExcel = async (
  data,
  mapel,
  kelas,
  type = "lengkap",
  userData = {}
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Nilai Katrol");

  // Tentukan jumlah kolom berdasarkan type
  const numColumns = type === "lengkap" ? 21 : 11;

  // ========================================
  // HEADER SEKOLAH
  // ========================================
  const headerData = [
    ["SDN 1 PASIRPOGOR"],
    [`REKAPITULASI NILAI KATROL - ${mapel.toUpperCase()}`],
    [`KELAS ${kelas}`],
    ["Tahun Ajaran: 2025/2026"],
    [""],
  ];

  let currentRow = 1;
  headerData.forEach((row) => {
    const newRow = worksheet.getRow(currentRow++);
    newRow.getCell(1).value = row[0];

    // Merge cells untuk header
    worksheet.mergeCells(
      `A${currentRow - 1}:${String.fromCharCode(65 + numColumns - 1)}${
        currentRow - 1
      }`
    );

    // Style header
    newRow.getCell(1).font = {
      bold: true,
      size: currentRow <= 3 ? 14 : 11,
      name: "Calibri",
    };
    newRow.getCell(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
  });

  // ========================================
  // HEADER TABEL
  // ========================================
  if (type === "lengkap") {
    // FORMAT LENGKAP (21 KOLOM)
    const tableHeaders = [
      "No",
      "NISN",
      "Nama Siswa",
      "NH1",
      "NH1-K",
      "NH2",
      "NH2-K",
      "NH3",
      "NH3-K",
      "NH4",
      "NH4-K",
      "NH5",
      "NH5-K",
      "UTS",
      "UTS-K",
      "UAS",
      "UAS-K",
      "Rata NH",
      "Rata NH-K",
      "Nilai Akhir",
      "Nilai Akhir-K",
    ];

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = tableHeaders;
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
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

    // Set column widths
    worksheet.columns = [
      { width: 5 },
      { width: 12 },
      { width: 40 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
    ];

    currentRow++;

    // Isi data
    data.forEach((siswa, index) => {
      const row = worksheet.addRow([
        index + 1,
        siswa.nisn,
        siswa.nama_siswa,
        siswa.nilai.NH1 || "",
        siswa.nilai_katrol?.NH1 || "",
        siswa.nilai.NH2 || "",
        siswa.nilai_katrol?.NH2 || "",
        siswa.nilai.NH3 || "",
        siswa.nilai_katrol?.NH3 || "",
        siswa.nilai.NH4 || "",
        siswa.nilai_katrol?.NH4 || "",
        siswa.nilai.NH5 || "",
        siswa.nilai_katrol?.NH5 || "",
        siswa.nilai.UTS || "",
        siswa.nilai_katrol?.UTS || "",
        siswa.nilai.UAS || "",
        siswa.nilai_katrol?.UAS || "",
        siswa.rata_NH_asli || "",
        siswa.rata_NH_katrol || "",
        siswa.nilai_akhir_asli || "",
        siswa.nilai_akhir_katrol || "",
      ]);

      // Style setiap cell
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };

          // Format number: Nilai Akhir (kolom 20-21) pakai "0" (bulat), sisanya "0.00"
          if (colNumber === 20 || colNumber === 21) {
            cell.numFmt = "0"; // 🔥 Format angka bulat untuk Nilai Akhir
          } else {
            cell.numFmt = "0.00"; // Format 2 desimal untuk nilai lainnya
          }

          if (colNumber === numColumns) {
            cell.font = { bold: true };
          }
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 1 ? "center" : "left",
          };
        }

        // Zebra striping
        if (index % 2 !== 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          };
        }
      });

      currentRow++;
    });
  } else {
    // FORMAT RINGKAS (11 KOLOM)
    const tableHeaders = [
      "No",
      "NISN",
      "Nama Siswa",
      "NH1-K",
      "NH2-K",
      "NH3-K",
      "NH4-K",
      "NH5-K",
      "UTS-K",
      "UAS-K",
      "Nilai Akhir-K",
    ];

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = tableHeaders;
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
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

    // Set column widths
    worksheet.columns = [
      { width: 5 },
      { width: 12 },
      { width: 40 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 12 },
    ];

    currentRow++;

    // Isi data
    data.forEach((siswa, index) => {
      const row = worksheet.addRow([
        index + 1,
        siswa.nisn,
        siswa.nama_siswa,
        siswa.nilai_katrol?.NH1 || "",
        siswa.nilai_katrol?.NH2 || "",
        siswa.nilai_katrol?.NH3 || "",
        siswa.nilai_katrol?.NH4 || "",
        siswa.nilai_katrol?.NH5 || "",
        siswa.nilai_katrol?.UTS || "",
        siswa.nilai_katrol?.UAS || "",
        siswa.nilai_akhir_katrol || "",
      ]);

      // Style setiap cell
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };

          // Format number: Nilai Akhir (kolom 11) pakai "0" (bulat), sisanya "0.00"
          if (colNumber === 11) {
            cell.numFmt = "0"; // 🔥 Format angka bulat untuk Nilai Akhir
          } else {
            cell.numFmt = "0.00"; // Format 2 desimal untuk nilai lainnya
          }

          if (colNumber === numColumns) {
            cell.font = { bold: true };
          }
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 1 ? "center" : "left",
          };
        }

        // Zebra striping
        if (index % 2 !== 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          };
        }
      });

      currentRow++;
    });
  }

  // ========================================
  // TANDA TANGAN
  // ========================================
  currentRow += 2;
  const startCol = 8; // Kolom H

  const signRow1 = worksheet.getRow(currentRow + 0);
  signRow1.getCell(startCol).value = "Mengetahui,";
  signRow1.getCell(startCol).font = { bold: true };

  const signRow2 = worksheet.getRow(currentRow + 1);
  signRow2.getCell(startCol).value =
    userData.role === "guru_kelas" ? "Wali Kelas" : "Guru Mata Pelajaran";
  signRow2.getCell(startCol).font = { bold: true };

  const signRow3 = worksheet.getRow(currentRow + 4);
  signRow3.getCell(startCol).value =
    userData.name || userData.username || "___________________";
  signRow3.getCell(startCol).font = { bold: true, underline: true };

  [signRow1, signRow2, signRow3].forEach((row) => {
    row.getCell(startCol).alignment = { horizontal: "center" };
  });

  // ========================================
  // DOWNLOAD FILE
  // ========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Nilai_Katrol_${mapel.replace(
    /\s+/g,
    "_"
  )}_Kelas_${kelas}_${type}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
