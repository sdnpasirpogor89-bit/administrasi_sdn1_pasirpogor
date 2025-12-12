// ========================================
// utils.js - Helper Functions untuk Katrol Nilai
// ========================================

import ExcelJS from "exceljs";

// ========================================
// 2. GROUP DATA BY NISN
// ========================================
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
        [jenisNilai]: Math.round(nilaiKatrol * 100) / 100,
      },
    };
  });
};

// ========================================
// 4. PROSES KATROL SEMUA JENIS NILAI
// ========================================
export const prosesKatrolSemua = (dataSiswa, kkm, maxNilai = 90) => {
  const jenisNilai = ["NH1", "NH2", "NH3", "NH4", "NH5", "UTS", "UAS"];
  let hasil = [...dataSiswa];

  jenisNilai.forEach((jenis) => {
    hasil = katrolNilaiPerJenis(hasil, jenis, kkm, maxNilai);
  });

  return hasil;
};

// ========================================
// 5. HITUNG NILAI AKHIR
// ========================================
export const hitungNilaiAkhir = (dataSiswa) => {
  return dataSiswa.map((siswa) => {
    const jenisNH = ["NH1", "NH2", "NH3", "NH4", "NH5"];

    const nilaiNH_asli = jenisNH
      .map((jenis) => siswa.nilai[jenis])
      .filter((n) => n !== undefined && n !== null && !isNaN(n));

    const nilaiNH_katrol = jenisNH
      .map((jenis) => siswa.nilai_katrol?.[jenis])
      .filter((n) => n !== undefined && n !== null && !isNaN(n));

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
      rata_NH_asli: Math.round(rataNH_asli * 100) / 100,
      rata_NH_katrol: Math.round(rataNH_katrol * 100) / 100,
      nilai_akhir_asli: Math.round(nilaiAkhirAsli),
      nilai_akhir_katrol: Math.round(nilaiAkhirKatrol),
    };
  });
};

// ========================================
// 6. EXPORT TO EXCEL - MULTI SHEET (BARU!)
// ========================================
export const exportToExcelMultiSheet = async (
  data,
  mapel,
  kelas,
  userData = {}
) => {
  const workbook = new ExcelJS.Workbook();

  // ==================== SHEET 1: DATA LENGKAP ====================
  const ws1 = workbook.addWorksheet("Data Lengkap");

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
    ws1.mergeCells(`A${row1 - 1}:U${row1 - 1}`);
    r.getCell(1).font = {
      bold: true,
      size: row1 <= 3 ? 14 : 11,
      name: "Calibri",
    };
    r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
  });

  const headers1 = [
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

  ws1.columns = [
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

  row1++;

  data.forEach((siswa, index) => {
    const r = ws1.addRow([
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

    r.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber >= 4) {
        cell.alignment = { vertical: "middle", horizontal: "center" };

        // ✅ REVISI: Kolom 20 & 21 (Nilai Akhir & Nilai Akhir-K) jadi TEXT
        if (colNumber === 20 || colNumber === 21) {
          cell.numFmt = "@"; // ← FORMAT JADI TEXT
          if (colNumber === 21) cell.font = { bold: true };
        } else {
          // Kolom nilai lainnya tetap NUMBER dengan 2 desimal
          cell.numFmt = "0.00";
        }
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
    ws2.mergeCells(`A${row2 - 1}:K${row2 - 1}`);
    r.getCell(1).font = {
      bold: true,
      size: row2 <= 3 ? 14 : 11,
      name: "Calibri",
    };
    r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
  });

  const headers2 = [
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

  ws2.columns = [
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

  row2++;

  data.forEach((siswa, index) => {
    const r = ws2.addRow([
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

    r.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber >= 4) {
        cell.alignment = { vertical: "middle", horizontal: "center" };

        // ✅ REVISI: Kolom 11 (Nilai Akhir-K) jadi TEXT
        if (colNumber === 11) {
          cell.numFmt = "@"; // ← FORMAT JADI TEXT
          cell.font = { bold: true };
        } else {
          // Kolom nilai lainnya tetap NUMBER dengan 2 desimal
          cell.numFmt = "0.00";
        }
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
// 7. EXPORT TO EXCEL - SINGLE SHEET (LAMA, TETAP DIPERTAHANKAN)
// ========================================
export const exportToExcel = async (
  data,
  mapel,
  kelas,
  type = "lengkap",
  userData = {}
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Nilai Katrol");

  const numColumns = type === "lengkap" ? 21 : 11;

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

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          if (colNumber === 20 || colNumber === 21) {
            cell.numFmt = "0";
          } else {
            cell.numFmt = "0.00";
          }
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

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          if (colNumber === 11) {
            cell.numFmt = "0";
          } else {
            cell.numFmt = "0.00";
          }
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
// 8. EXPORT LEGER - NILAI SEMUA MAPEL DENGAN 2 SHEET
// ========================================
export const exportLeger = async (
  kelas,
  supabase,
  tahunAjaran = null,
  semester = null,
  sortBy = "jumlah" // "jumlah" atau "rata_rata"
) => {
  try {
    // Query data dari nilai_katrol untuk kelas ini
    let query = supabase
      .from("nilai_katrol")
      .select(
        "nisn, nama_siswa, mata_pelajaran, nilai_akhir, semester, tahun_ajaran"
      )
      .eq("kelas", kelas)
      .order("nama_siswa", { ascending: true });

    // Filter tahun ajaran & semester jika ada
    if (tahunAjaran) query = query.eq("tahun_ajaran", tahunAjaran);
    if (semester) query = query.eq("semester", semester);

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("Tidak ada data nilai katrol untuk kelas ini");
    }

    // Mapping nama mapel ke shorthand
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

    // Group data dengan Map untuk menjaga urutan
    const siswaMap = new Map();
    const siswaOrder = [];

    // Sort data terlebih dahulu berdasarkan nama_siswa
    const sortedData = [...data].sort((a, b) => {
      const nameA = a.nama_siswa.toUpperCase();
      const nameB = b.nama_siswa.toUpperCase();
      return nameA.localeCompare(nameB);
    });

    // Group data dengan tetap menjaga urutan
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
        nilaiValid.length > 0 ? (jumlah / nilaiValid.length).toFixed(2) : null;

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
        rata_rata_num: item.rata_rata !== "-" ? parseFloat(item.rata_rata) : 0,
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
            if (colNumber === 14) {
              cell.numFmt = "0.00";
              cell.font = { bold: true };
            } else if (colNumber === 13) {
              cell.font = { bold: true };
            } else {
              cell.numFmt = "0";
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

    // Table headers Sheet 2 - TANPA KOLOM PERINGKAT
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
        fgColor: { argb: "FFE2EFDA" }, // Warna hijau muda untuk beda
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
      { width: 5 }, // No
      { width: 14 }, // NISN
      { width: 33 }, // Nama Siswa
      { width: 9 }, // B.Indo
      { width: 9 }, // B.Ing
      { width: 9 }, // B.Sunda
      { width: 9 }, // MTK
      { width: 9 }, // IPAS
      { width: 13 }, // Pancasila
      { width: 9 }, // Senbud
      { width: 9 }, // PABP
      { width: 9 }, // PJOK
      { width: 10 }, // Jumlah
      { width: 11 }, // Rata-rata
    ];

    rowPeringkat++;

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
            // ✅ REVISI: Kolom 14 (Rata-rata) jadi TEXT
            if (colNumber === 14) {
              cell.numFmt = "@"; // ← FORMAT JADI TEXT
              cell.font = { bold: true };
            } else if (colNumber === 13) {
              // Kolom Jumlah tetap NUMBER
              cell.font = { bold: true };
            } else {
              // Kolom nilai mapel tetap NUMBER
              cell.numFmt = "0";
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

    // ========================================
    // REVISI #3B: SHEET 2 - LEGER PERINGKAT
    // Cari bagian ini di Utils.js (sekitar line 1080-1150)
    // ========================================

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
          // Highlight 3 besar
          if (index < 3) {
            cell.font = { bold: true, size: 11 };
            if (index === 0) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFD700" },
              }; // Emas
            } else if (index === 1) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFC0C0C0" },
              }; // Perak
            } else if (index === 2) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFCD7F32" },
              }; // Perunggu
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
            // ✅ REVISI: Kolom 14 (Rata-rata) jadi TEXT
            if (colNumber === 14) {
              cell.numFmt = "@"; // ← FORMAT JADI TEXT
              cell.font = { bold: true };
            } else if (colNumber === 13) {
              // Kolom Jumlah tetap NUMBER
              cell.font = { bold: true };
            } else {
              // Kolom nilai mapel tetap NUMBER
              cell.numFmt = "0";
            }
          }
        }

        // Highlight baris 3 besar dengan warna berbeda
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
