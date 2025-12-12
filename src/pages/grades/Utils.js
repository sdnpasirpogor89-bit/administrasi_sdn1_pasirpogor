// ========================================
// utils.js - Helper Functions untuk Katrol Nilai
// ========================================

import ExcelJS from "exceljs";

// ========================================
// HELPER: DETECT AVAILABLE NH COLUMNS
// ========================================
export const detectAvailableNH = (data) => {
  if (!data || data.length === 0) return ["NH1", "NH2", "NH3", "NH4", "NH5"];

  // Ambil item pertama untuk deteksi kolom
  const firstItem = data[0];

  // Cari semua kolom yang mengandung 'NH' di properti nilai
  const allKeys = Object.keys(firstItem.nilai || {});
  const nhColumns = allKeys
    .filter((key) => key.toUpperCase().startsWith("NH"))
    .sort(); // Urutkan: NH1, NH2, NH3, etc.

  return nhColumns.length > 0 ? nhColumns : ["NH1", "NH2", "NH3", "NH4", "NH5"];
};

// ========================================
// 2. GROUP DATA BY NISN (DINAMIS)
// ========================================
export const groupDataByNISN = (rawData) => {
  const grouped = {};

  // Deteksi kolom NH yang ada di rawData
  if (!rawData || rawData.length === 0) return [];

  const firstItem = rawData[0];
  const availableColumns = Object.keys(firstItem).filter(
    (key) =>
      key.toLowerCase().includes("nh") ||
      key.toLowerCase().includes("uts") ||
      key.toLowerCase().includes("uas")
  );

  rawData.forEach((item) => {
    if (!grouped[item.nisn]) {
      // Buat struktur nilai dinamis
      const nilaiObj = {};

      // Tambahkan kolom NH yang tersedia
      availableColumns.forEach((col) => {
        const key = col.toUpperCase();
        const value = item[col];

        if (key.startsWith("NH")) {
          nilaiObj[key] =
            value !== null && value !== undefined ? Math.round(value) : null;
        } else if (key === "UTS" || key === "UAS") {
          nilaiObj[key] =
            value !== null && value !== undefined ? Math.round(value) : null;
        }
      });

      grouped[item.nisn] = {
        nisn: item.nisn,
        nama_siswa: item.nama_siswa,
        nilai: nilaiObj,
        nilai_katrol: {},
      };
    }
  });

  return Object.values(grouped);
};

// ========================================
// 3. KATROL NILAI PER JENIS (SAMA)
// ========================================
export const katrolNilaiPerJenis = (
  dataSiswa,
  jenisNilai,
  kkm,
  maxNilai = 90
) => {
  const nilaiArray = dataSiswa
    .map((siswa) => siswa.nilai[jenisNilai])
    .filter((n) => n !== undefined && n !== null && !isNaN(n));

  if (nilaiArray.length === 0) {
    return dataSiswa;
  }

  const nilaiMax = Math.max(...nilaiArray);
  const nilaiMin = Math.min(...nilaiArray);
  const gap = maxNilai - kkm;

  return dataSiswa.map((siswa) => {
    const nilaiAsli = siswa.nilai[jenisNilai];

    if (nilaiAsli === undefined || nilaiAsli === null || isNaN(nilaiAsli)) {
      return siswa;
    }

    let nilaiKatrol;

    if (nilaiAsli >= nilaiMax) {
      nilaiKatrol = maxNilai;
    } else if (nilaiAsli <= nilaiMin) {
      nilaiKatrol = kkm;
    } else {
      const range = nilaiMax - nilaiMin;
      const posisi = (nilaiAsli - nilaiMin) / range;
      nilaiKatrol = kkm + posisi * gap;
    }

    return {
      ...siswa,
      nilai_katrol: {
        ...siswa.nilai_katrol,
        // ✅ DIBULATKAN jadi 2 angka integer
        [jenisNilai]: Math.round(nilaiKatrol),
      },
    };
  });
};

// ========================================
// 4. PROSES KATROL SEMUA JENIS NILAI (DINAMIS)
// ========================================
export const prosesKatrolSemua = (
  dataSiswa,
  kkm,
  maxNilai = 90,
  availableNH = null
) => {
  // Gunakan availableNH jika diberikan, kalau tidak deteksi otomatis
  let jenisNilaiArray;

  if (availableNH && Array.isArray(availableNH)) {
    // Tambahkan UTS dan UAS ke array jenis nilai
    jenisNilaiArray = [...availableNH, "UTS", "UAS"];
  } else {
    // Deteksi otomatis dari data
    const nhColumns = detectAvailableNH(dataSiswa);
    jenisNilaiArray = [...nhColumns, "UTS", "UAS"];
  }

  let hasil = [...dataSiswa];

  jenisNilaiArray.forEach((jenis) => {
    hasil = katrolNilaiPerJenis(hasil, jenis, kkm, maxNilai);
  });

  return hasil;
};

// ========================================
// 5. HITUNG NILAI AKHIR (DINAMIS)
// ========================================
export const hitungNilaiAkhir = (dataSiswa, availableNH = null) => {
  // Tentukan kolom NH yang akan diproses
  const nhColumns = availableNH || detectAvailableNH(dataSiswa);

  return dataSiswa.map((siswa) => {
    // Nilai NH asli
    const nilaiNH_asli = nhColumns
      .map((jenis) => siswa.nilai[jenis])
      .filter((n) => n !== undefined && n !== null && !isNaN(n));

    // Nilai NH katrol
    const nilaiNH_katrol = nhColumns
      .map((jenis) => siswa.nilai_katrol?.[jenis])
      .filter((n) => n !== undefined && n !== null && !isNaN(n));

    // Hitung rata-rata
    const rataNH_asli =
      nilaiNH_asli.length > 0
        ? nilaiNH_asli.reduce((sum, n) => sum + n, 0) / nilaiNH_asli.length
        : 0;

    const rataNH_katrol =
      nilaiNH_katrol.length > 0
        ? nilaiNH_katrol.reduce((sum, n) => sum + n, 0) / nilaiNH_katrol.length
        : 0;

    const uts_asli = siswa.nilai.UTS || 0;
    const uas_asli = siswa.nilai.UAS || 0;
    const uts_katrol = siswa.nilai_katrol?.UTS || 0;
    const uas_katrol = siswa.nilai_katrol?.UAS || 0;

    const nilaiAkhirAsli = 0.4 * rataNH_asli + 0.3 * uts_asli + 0.3 * uas_asli;
    const nilaiAkhirKatrol =
      0.4 * rataNH_katrol + 0.3 * uts_katrol + 0.3 * uas_katrol;

    return {
      ...siswa,
      // Simpan informasi kolom NH yang digunakan
      _nh_columns: nhColumns,
      // ✅ SEMUA DIBULATKAN jadi 2 angka integer
      rata_NH_asli: Math.round(rataNH_asli),
      rata_NH_katrol: Math.round(rataNH_katrol),
      nilai_akhir_asli: Math.round(nilaiAkhirAsli),
      nilai_akhir_katrol: Math.round(nilaiAkhirKatrol),
    };
  });
};

// ========================================
// 6. EXPORT TO EXCEL - MULTI SHEET (DINAMIS)
// ========================================
export const exportToExcelMultiSheet = async (
  data,
  mapel,
  kelas,
  availableNH = null,
  userData = {}
) => {
  const workbook = new ExcelJS.Workbook();

  // Deteksi kolom NH yang tersedia
  const nhColumns = availableNH || detectAvailableNH(data);

  // 🛡️ PROTEKSI: Validasi bahwa nhColumns adalah array
  if (!Array.isArray(nhColumns)) {
    console.error("❌ nhColumns bukan array, diterima:", nhColumns);
    console.error("❌ availableNH:", availableNH);
    throw new Error("Parameter nhColumns harus berupa array!");
  }

  if (nhColumns.length === 0) {
    console.warn("⚠️ nhColumns kosong, menggunakan default");
    nhColumns = ["NH1", "NH2", "NH3", "NH4", "NH5"];
  }

  console.log("📊 Menggunakan kolom NH:", nhColumns);

  // ==================== SHEET 1: DATA LENGKAP ====================
  const ws1 = workbook.addWorksheet("Data Lengkap");

  // Header tetap sama
  const headerData1 = [
    ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
    [`REKAPITULASI NILAI KATROL - ${mapel.toUpperCase()}`],
    [`KELAS ${kelas}`],
    ["Tahun Ajaran: 2025/2026"],
    [""],
  ];

  let row1 = 1;
  headerData1.forEach((rowData) => {
    const r = ws1.getRow(row1++);
    r.getCell(1).value = rowData[0];
    // Merge cells dinamis berdasarkan jumlah kolom
    const totalColumns = 3 + nhColumns.length * 2 + 4 + 4; // No+NISN+Nama + (NH*2) + (UTS*2) + (UAS*2) + RataNH*2 + NilaiAkhir*2
    const endColumn = String.fromCharCode(64 + totalColumns);
    ws1.mergeCells(`A${row1 - 1}:${endColumn}${row1 - 1}`);
    r.getCell(1).font = {
      bold: true,
      size: row1 <= 3 ? 14 : 11,
      name: "Calibri",
    };
    r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
  });

  // Buat headers dinamis
  const headers1 = ["No", "NISN", "Nama Siswa"];

  // Tambahkan kolom NH dinamis
  nhColumns.forEach((nh) => {
    headers1.push(nh);
    headers1.push(`${nh}-K`);
  });

  // Tambahkan kolom tetap
  headers1.push(
    "UTS",
    "UTS-K",
    "UAS",
    "UAS-K",
    "Rata NH",
    "Rata NH-K",
    "Nilai Akhir",
    "Nilai Akhir-K"
  );

  const headerRow1 = ws1.getRow(row1);
  headerRow1.values = headers1;
  headerRow1.height = 30;

  headerRow1.eachCell((cell) => {
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

  // Set column widths dinamis
  const columnWidths = [
    { width: 5 }, // No
    { width: 12 }, // NISN
    { width: 40 }, // Nama
  ];

  // Lebar untuk kolom NH (asli dan katrol)
  nhColumns.forEach(() => {
    columnWidths.push({ width: 8 }); // NH asli
    columnWidths.push({ width: 8 }); // NH-K
  });

  // Lebar untuk kolom tetap
  columnWidths.push(
    { width: 8 }, // UTS
    { width: 8 }, // UTS-K
    { width: 8 }, // UAS
    { width: 8 }, // UAS-K
    { width: 10 }, // Rata NH
    { width: 10 }, // Rata NH-K
    { width: 12 }, // Nilai Akhir
    { width: 12 } // Nilai Akhir-K
  );

  ws1.columns = columnWidths;

  row1++;

  // Isi data
  data.forEach((siswa, index) => {
    const rowData = [index + 1, siswa.nisn, siswa.nama_siswa];

    // Data NH dinamis
    nhColumns.forEach((nh) => {
      rowData.push(siswa.nilai[nh] || "");
      rowData.push(siswa.nilai_katrol?.[nh] || "");
    });

    // Data tetap
    rowData.push(
      siswa.nilai.UTS || "",
      siswa.nilai_katrol?.UTS || "",
      siswa.nilai.UAS || "",
      siswa.nilai_katrol?.UAS || "",
      siswa.rata_NH_asli || "",
      siswa.rata_NH_katrol || "",
      siswa.nilai_akhir_asli || "",
      siswa.nilai_akhir_katrol || ""
    );

    const r = ws1.addRow(rowData);

    r.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber >= 4) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.numFmt = "0"; // Format integer
        if (colNumber === headers1.length) cell.font = { bold: true };
      } else {
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "center" : "left",
        };
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

  // ==================== SHEET 2: KATROL AKHIR ====================
  const ws2 = workbook.addWorksheet("Katrol Akhir");

  const headerData2 = [
    ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
    [`NILAI KATROL AKHIR - ${mapel.toUpperCase()}`],
    [`KELAS ${kelas}`],
    ["Tahun Ajaran: 2025/2026"],
    [""],
  ];

  let row2 = 1;
  headerData2.forEach((rowData) => {
    const r = ws2.getRow(row2++);
    r.getCell(1).value = rowData[0];
    const totalColumns2 = 3 + nhColumns.length + 3; // No+NISN+Nama + NH + UTS+UAS+NilaiAkhir
    const endColumn2 = String.fromCharCode(64 + totalColumns2);
    ws2.mergeCells(`A${row2 - 1}:${endColumn2}${row2 - 1}`);
    r.getCell(1).font = {
      bold: true,
      size: row2 <= 3 ? 14 : 11,
      name: "Calibri",
    };
    r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
  });

  // Headers untuk sheet 2
  const headers2 = ["No", "NISN", "Nama Siswa"];
  nhColumns.forEach((nh) => {
    headers2.push(`${nh}-K`);
  });
  headers2.push("UTS-K", "UAS-K", "Nilai Akhir-K");

  const headerRow2 = ws2.getRow(row2);
  headerRow2.values = headers2;
  headerRow2.height = 30;

  headerRow2.eachCell((cell) => {
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

  // Column widths untuk sheet 2
  const columnWidths2 = [{ width: 5 }, { width: 12 }, { width: 40 }];

  nhColumns.forEach(() => {
    columnWidths2.push({ width: 8 });
  });

  columnWidths2.push({ width: 8 }, { width: 8 }, { width: 12 });

  ws2.columns = columnWidths2;

  row2++;

  // Data untuk sheet 2
  data.forEach((siswa, index) => {
    const rowData2 = [index + 1, siswa.nisn, siswa.nama_siswa];

    nhColumns.forEach((nh) => {
      rowData2.push(siswa.nilai_katrol?.[nh] || "");
    });

    rowData2.push(
      siswa.nilai_katrol?.UTS || "",
      siswa.nilai_katrol?.UAS || "",
      siswa.nilai_akhir_katrol || ""
    );

    const r = ws2.addRow(rowData2);

    r.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber >= 4) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.numFmt = "0";
        if (colNumber === headers2.length) cell.font = { bold: true };
      } else {
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "center" : "left",
        };
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

  // ==================== DOWNLOAD ====================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Nilai_Katrol_${mapel.replace(/\s+/g, "_")}_Kelas_${kelas}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ========================================
// 7. EXPORT TO EXCEL - SINGLE SHEET (DINAMIS)
// ========================================
export const exportToExcel = async (
  data,
  mapel,
  kelas,
  type = "lengkap",
  availableNH = null,
  userData = {}
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Nilai Katrol");

  const nhColumns = availableNH || detectAvailableNH(data);

  // Hitung jumlah kolom dinamis
  const numColumns =
    type === "lengkap"
      ? 3 + nhColumns.length * 2 + 4 + 4 // No+NISN+Nama + (NH*2) + UTS*2 + UAS*2 + RataNH*2 + NilaiAkhir*2
      : 3 + nhColumns.length + 3; // No+NISN+Nama + NH-K + UTS-K + UAS-K + NilaiAkhir-K

  const headerData = [
    ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
    [`REKAPITULASI NILAI KATROL - ${mapel.toUpperCase()}`],
    [`KELAS ${kelas}`],
    ["Tahun Ajaran: 2025/2026"],
    [""],
  ];

  let currentRow = 1;
  headerData.forEach((row) => {
    const newRow = worksheet.getRow(currentRow++);
    newRow.getCell(1).value = row[0];
    worksheet.mergeCells(
      `A${currentRow - 1}:${String.fromCharCode(65 + numColumns - 1)}${
        currentRow - 1
      }`
    );
    newRow.getCell(1).font = {
      bold: true,
      size: currentRow <= 3 ? 14 : 11,
      name: "Calibri",
    };
    newRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
  });

  if (type === "lengkap") {
    // Buat headers dinamis untuk tipe lengkap
    const tableHeaders = ["No", "NISN", "Nama Siswa"];

    nhColumns.forEach((nh) => {
      tableHeaders.push(nh);
      tableHeaders.push(`${nh}-K`);
    });

    tableHeaders.push(
      "UTS",
      "UTS-K",
      "UAS",
      "UAS-K",
      "Rata NH",
      "Rata NH-K",
      "Nilai Akhir",
      "Nilai Akhir-K"
    );

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

    // Set column widths dinamis
    const widths = [{ width: 5 }, { width: 12 }, { width: 40 }];
    nhColumns.forEach(() => {
      widths.push({ width: 8 }, { width: 8 });
    });
    widths.push(
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 8 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 12 }
    );

    worksheet.columns = widths;

    currentRow++;

    // Isi data
    data.forEach((siswa, index) => {
      const rowData = [index + 1, siswa.nisn, siswa.nama_siswa];

      nhColumns.forEach((nh) => {
        rowData.push(siswa.nilai[nh] || "");
        rowData.push(siswa.nilai_katrol?.[nh] || "");
      });

      rowData.push(
        siswa.nilai.UTS || "",
        siswa.nilai_katrol?.UTS || "",
        siswa.nilai.UAS || "",
        siswa.nilai_katrol?.UAS || "",
        siswa.rata_NH_asli || "",
        siswa.rata_NH_katrol || "",
        siswa.nilai_akhir_asli || "",
        siswa.nilai_akhir_katrol || ""
      );

      const row = worksheet.addRow(rowData);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "0";
          if (colNumber === numColumns) cell.font = { bold: true };
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 1 ? "center" : "left",
          };
        }

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
    // Tipe singkat/katrol akhir
    const tableHeaders = ["No", "NISN", "Nama Siswa"];
    nhColumns.forEach((nh) => {
      tableHeaders.push(`${nh}-K`);
    });
    tableHeaders.push("UTS-K", "UAS-K", "Nilai Akhir-K");

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

    // Column widths
    const widths = [{ width: 5 }, { width: 12 }, { width: 40 }];
    nhColumns.forEach(() => {
      widths.push({ width: 8 });
    });
    widths.push({ width: 8 }, { width: 8 }, { width: 12 });

    worksheet.columns = widths;

    currentRow++;

    // Isi data
    data.forEach((siswa, index) => {
      const rowData = [index + 1, siswa.nisn, siswa.nama_siswa];

      nhColumns.forEach((nh) => {
        rowData.push(siswa.nilai_katrol?.[nh] || "");
      });

      rowData.push(
        siswa.nilai_katrol?.UTS || "",
        siswa.nilai_katrol?.UAS || "",
        siswa.nilai_akhir_katrol || ""
      );

      const row = worksheet.addRow(rowData);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "0";
          if (colNumber === numColumns) cell.font = { bold: true };
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 1 ? "center" : "left",
          };
        }

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

// ========================================
// 8. EXPORT LEGER (TETAP SAMA - tidak berhubungan dengan NH)
// ========================================
export const exportLeger = async (
  kelas,
  supabase,
  tahunAjaran = null,
  semester = null,
  sortBy = "jumlah"
) => {
  try {
    let query = supabase
      .from("nilai_katrol")
      .select(
        "nisn, nama_siswa, mata_pelajaran, nilai_akhir, semester, tahun_ajaran"
      )
      .eq("kelas", kelas)
      .order("nama_siswa", { ascending: true });

    if (tahunAjaran) query = query.eq("tahun_ajaran", tahunAjaran);
    if (semester) query = query.eq("semester", semester);

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("Tidak ada data nilai katrol untuk kelas ini");
    }

    const mapelMapping = {
      "Bahasa Indonesia": "bindo",
      "Bahasa Inggris": "bing",
      "Bahasa Sunda": "bsunda",
      Matematika: "mtk",
      IPAS: "ipas",
      "Pendidikan Pancasila": "pancasila",
      "Seni Budaya": "senbud",
      "Pendidikan Agama dan Budi Pekerti (PABP)": "pabp",
      "Pendidikan Jasmani Olahraga Kesehatan": "pjok",
    };

    const siswaMap = new Map();
    const siswaOrder = [];

    const sortedData = [...data].sort((a, b) => {
      const nameA = a.nama_siswa.toUpperCase();
      const nameB = b.nama_siswa.toUpperCase();
      return nameA.localeCompare(nameB);
    });

    sortedData.forEach((item) => {
      if (!siswaMap.has(item.nisn)) {
        siswaMap.set(item.nisn, {
          nisn: item.nisn,
          nama_siswa: item.nama_siswa,
          bindo: null,
          bing: null,
          bsunda: null,
          mtk: null,
          ipas: null,
          pancasila: null,
          senbud: null,
          pabp: null,
          pjok: null,
        });
        siswaOrder.push(item.nisn);
      }

      const siswaData = siswaMap.get(item.nisn);
      const shorthand = mapelMapping[item.mata_pelajaran];
      if (shorthand) {
        siswaData[shorthand] = item.nilai_akhir;
      }
    });

    // Buat array data leger
    const legerData = [];

    siswaOrder.forEach((nisn, index) => {
      const siswa = siswaMap.get(nisn);
      const nilai = [
        siswa.bindo,
        siswa.bing,
        siswa.bsunda,
        siswa.mtk,
        siswa.ipas,
        siswa.pancasila,
        siswa.senbud,
        siswa.pabp,
        siswa.pjok,
      ];

      const nilaiValid = nilai.filter((n) => n !== null && n !== undefined);
      const jumlah =
        nilaiValid.length > 0
          ? nilaiValid.reduce((sum, n) => sum + n, 0)
          : null;
      const rataRata =
        nilaiValid.length > 0 ? Math.round(jumlah / nilaiValid.length) : null;

      legerData.push({
        no: index + 1,
        nisn: siswa.nisn,
        nama_siswa: siswa.nama_siswa,
        bindo: siswa.bindo || "-",
        bing: siswa.bing || "-",
        bsunda: siswa.bsunda || "-",
        mtk: siswa.mtk || "-",
        ipas: siswa.ipas || "-",
        pancasila: siswa.pancasila || "-",
        senbud: siswa.senbud || "-",
        pabp: siswa.pabp || "-",
        pjok: siswa.pjok || "-",
        jumlah: jumlah || "-",
        rata_rata: rataRata || "-",
      });
    });

    // Buat data untuk sheet peringkat
    const legerPeringkat = [...legerData]
      .filter((item) => item.jumlah !== "-" && item.rata_rata !== "-")
      .map((item) => ({
        ...item,
        jumlah_num: item.jumlah !== "-" ? item.jumlah : 0,
        rata_rata_num: item.rata_rata !== "-" ? parseInt(item.rata_rata) : 0,
      }));

    // Sort berdasarkan pilihan
    if (sortBy === "jumlah") {
      legerPeringkat.sort((a, b) => b.jumlah_num - a.jumlah_num);
    } else {
      legerPeringkat.sort((a, b) => b.rata_rata_num - a.rata_rata_num);
    }

    // Update nomor urut untuk peringkat
    legerPeringkat.forEach((item, index) => {
      item.no = index + 1;
    });

    // Buat Workbook Excel dengan 2 sheet
    const workbook = new ExcelJS.Workbook();

    // ==================== SHEET 1: LEGER NILAI ====================
    const wsNilai = workbook.addWorksheet("Leger Nilai");

    // Header Sheet 1
    const headerNilai = [
      ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
      [`LEGER NILAI - KELAS ${kelas}`],
      [
        `Tahun Ajaran: ${tahunAjaran || "2025/2026"}${
          semester ? ` - Semester ${semester}` : ""
        }`,
      ],
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
      "B.Indo",
      "B.Ing",
      "B.Sunda",
      "MTK",
      "IPAS",
      "Pend. Pancasila",
      "Senbud",
      "PABP",
      "PJOK",
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
      { width: 13 },
      { width: 9 },
      { width: 9 },
      { width: 9 },
      { width: 10 },
      { width: 11 },
    ];

    rowNilai++;

    // Data rows Sheet 1
    legerData.forEach((row, index) => {
      const r = wsNilai.addRow([
        row.no,
        row.nisn,
        row.nama_siswa,
        row.bindo,
        row.bing,
        row.bsunda,
        row.mtk,
        row.ipas,
        row.pancasila,
        row.senbud,
        row.pabp,
        row.pjok,
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

    // ==================== SHEET 2: LEGER PERINGKAT ====================
    const wsPeringkat = workbook.addWorksheet("Leger Peringkat");

    // Header Sheet 2
    const headerPeringkat = [
      ["SEKOLAH DASAR NEGER 1 PASIRPOGOR"],
      [`LEGER PERINGKAT - KELAS ${kelas}`],
      [
        `Tahun Ajaran: ${tahunAjaran || "2025/2026"}${
          semester ? ` - Semester ${semester}` : ""
        }`,
      ],
      [
        `(Diurutkan berdasarkan ${
          sortBy === "jumlah" ? "Jumlah Nilai" : "Rata-rata Nilai"
        } - Tertinggi ke Terendah)`,
      ],
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
      "B.Indo",
      "B.Ing",
      "B.Sunda",
      "MTK",
      "IPAS",
      "Pend. Pancasila",
      "Senbud",
      "PABP",
      "PJOK",
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
      { width: 13 },
      { width: 9 },
      { width: 9 },
      { width: 9 },
      { width: 10 },
      { width: 11 },
    ];

    rowPeringkat++;

    // Data rows Sheet 2
    legerPeringkat.forEach((row, index) => {
      const r = wsPeringkat.addRow([
        row.no,
        row.nisn,
        row.nama_siswa,
        row.bindo,
        row.bing,
        row.bsunda,
        row.mtk,
        row.ipas,
        row.pancasila,
        row.senbud,
        row.pabp,
        row.pjok,
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

    // ==================== DOWNLOAD ====================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Leger_Nilai_Kelas_${kelas}_${
      tahunAjaran || "2025-2026"
    }.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      count: legerData.length,
      peringkatCount: legerPeringkat.length,
      sortBy: sortBy,
    };
  } catch (error) {
    console.error("Error exporting leger:", error);
    throw error;
  }
};
