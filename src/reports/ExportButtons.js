import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { supabase } from "../supabaseClient";

const ExportButtons = ({ data = [], type, filters = {}, loading = false }) => {
  const [exporting, setExporting] = useState(null);

  // Helper: Format tanggal
  const formatDate = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return date || "";
    }
  };

  // Helper: Get report title
  const getReportTitle = () => {
    const titles = {
      students: "LAPORAN DATA SISWA",
      grades: "REKAPITULASI NILAI KATROL",
      attendance: "LAPORAN PRESENSI SISWA",
      teachers: "LAPORAN AKTIVITAS GURU",
    };
    return titles[type] || "LAPORAN";
  };

  // **AUTO-DETECT KEY DAN FORMAT DATA**
  const formatDataForExport = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.log("❌ Data kosong!");
      return [];
    }

    console.log("📊 DATA DITERIMA:", rawData.length, "rows");
    console.log("🔍 SEMUA KEY DI ROW PERTAMA:", Object.keys(rawData[0]));
    console.log("🔍 Sample data LENGKAP:", rawData[0]);

    if (type === "grades") {
      return rawData.map((row, index) => {
        // AUTO-DETECT: Ambil nilai langsung dari row (case-insensitive)
        const findValue = (possibleKeys) => {
          for (let key of possibleKeys) {
            // Cek exact match dulu
            if (
              row[key] !== undefined &&
              row[key] !== null &&
              row[key] !== ""
            ) {
              return row[key];
            }
          }
          // Cek case-insensitive
          const rowKeys = Object.keys(row);
          for (let key of possibleKeys) {
            const found = rowKeys.find(
              (k) => k.toLowerCase() === key.toLowerCase()
            );
            if (
              found &&
              row[found] !== undefined &&
              row[found] !== null &&
              row[found] !== ""
            ) {
              return row[found];
            }
          }
          return null;
        };

        const bindo = findValue([
          "bindo",
          "B.Indo",
          "bahasa_indonesia",
          "Bahasa Indonesia",
        ]);
        const bing = findValue([
          "bing",
          "B.Ing",
          "bahasa_inggris",
          "Bahasa Inggris",
        ]);
        const bsunda = findValue([
          "bsunda",
          "B.Sunda",
          "bahasa_sunda",
          "Bahasa Sunda",
        ]);
        const mtk = findValue(["mtk", "MTK", "matematika", "Matematika"]);
        const ipas = findValue(["ipas", "IPAS", "ipa", "IPA"]);
        const pancasila = findValue([
          "pancasila",
          "Pend. Pancasila",
          "pendidikan_pancasila",
          "Pendidikan Pancasila",
        ]);
        const senbud = findValue([
          "senbud",
          "Senbud",
          "seni_budaya",
          "Seni Budaya",
        ]);
        const pabp = findValue(["pabp", "PABP", "pendidikan_agama"]);
        const pjok = findValue(["pjok", "PJOK", "penjas"]);

        // Convert ke number atau "-"
        const toNumber = (val) => {
          if (val === null || val === undefined || val === "" || val === "-")
            return "-";
          const num = parseFloat(val);
          return isNaN(num) ? "-" : num;
        };

        const nilaiArray = [
          toNumber(bindo),
          toNumber(bing),
          toNumber(bsunda),
          toNumber(mtk),
          toNumber(ipas),
          toNumber(pancasila),
          toNumber(senbud),
          toNumber(pabp),
          toNumber(pjok),
        ];

        // Hitung jumlah dan rata-rata
        const nilaiValid = nilaiArray.filter((v) => v !== "-");
        const jumlah =
          nilaiValid.length > 0
            ? nilaiValid.reduce((sum, val) => sum + val, 0)
            : "-";
        const rata_rata =
          nilaiValid.length > 0 ? (jumlah / nilaiValid.length).toFixed(2) : "-";

        const result = {
          no: index + 1,
          nisn: row.nisn || row.NISN || "-",
          nama_siswa: row.nama_siswa || row.nama || row.Nama || "-",
          bindo: toNumber(bindo),
          bing: toNumber(bing),
          bsunda: toNumber(bsunda),
          mtk: toNumber(mtk),
          ipas: toNumber(ipas),
          pancasila: toNumber(pancasila),
          senbud: toNumber(senbud),
          pabp: toNumber(pabp),
          pjok: toNumber(pjok),
          jumlah: jumlah,
          rata_rata: rata_rata,
        };

        if (index === 0) {
          console.log("✅ FORMATTED ROW PERTAMA:", result);
        }

        return result;
      });
    }

    // Untuk tipe lainnya
    return rawData.map((row, index) => {
      const formatted = { no: index + 1 };

      if (type === "students") {
        formatted.nisn = row.nisn || "-";
        formatted.nama_siswa = row.nama_siswa || row.nama || "-";
        formatted.jenis_kelamin =
          row.jenis_kelamin === "L"
            ? "Laki-laki"
            : row.jenis_kelamin === "P"
            ? "Perempuan"
            : row.jenis_kelamin || "-";
        formatted.kelas = row.kelas || "-";
        formatted.is_active = row.is_active ? "Aktif" : "Tidak Aktif";
      }

      return formatted;
    });
  };

  // **KOLOM EXCEL**
  const getColumns = () => {
    if (type === "grades") {
      return [
        { header: "No", key: "no", width: 5 },
        { header: "NISN", key: "nisn", width: 14 },
        { header: "Nama Siswa", key: "nama_siswa", width: 30 },
        { header: "B.Indo", key: "bindo", width: 9 },
        { header: "B.Ing", key: "bing", width: 9 },
        { header: "B.Sunda", key: "bsunda", width: 9 },
        { header: "MTK", key: "mtk", width: 9 },
        { header: "IPAS", key: "ipas", width: 9 },
        { header: "Pend. Pancasila", key: "pancasila", width: 13 },
        { header: "Senbud", key: "senbud", width: 9 },
        { header: "PABP", key: "pabp", width: 9 },
        { header: "PJOK", key: "pjok", width: 9 },
        { header: "Jumlah", key: "jumlah", width: 10 },
        { header: "Rata-rata", key: "rata_rata", width: 11 },
      ];
    } else if (type === "students") {
      return [
        { header: "No", key: "no", width: 5 },
        { header: "NISN", key: "nisn", width: 14 },
        { header: "Nama Siswa", key: "nama_siswa", width: 30 },
        { header: "Jenis Kelamin", key: "jenis_kelamin", width: 14 },
        { header: "Kelas", key: "kelas", width: 10 },
        { header: "Status", key: "is_active", width: 12 },
      ];
    }
    return [];
  };

  // **EXPORT TO EXCEL**
  const exportToExcel = async () => {
    setExporting("excel");
    try {
      // Fetch tahun ajaran aktif dari database
      const { data: academicYearData, error: academicYearError } =
        await supabase
          .from("academic_years")
          .select("year, semester")
          .eq("is_active", true)
          .single();

      if (academicYearError) {
        console.warn("Gagal fetch tahun ajaran:", academicYearError);
      }

      const tahunAjaran = academicYearData
        ? `${academicYearData.year} (${academicYearData.semester})`
        : filters.tahun_ajaran || "2025/2026";

      const formattedData = formatDataForExport(data);

      if (!formattedData || formattedData.length === 0) {
        alert("Tidak ada data untuk di-export");
        setExporting(null);
        return;
      }

      console.log("✅ FORMATTED DATA:", formattedData.length, "rows");
      console.log("🔍 Sample formatted:", formattedData[0]);

      const columns = getColumns();

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan");

      let currentRow = 1;

      const lastColumn = String.fromCharCode(64 + Math.min(columns.length, 26));

      // ==================== HEADER SEKOLAH ====================
      worksheet.mergeCells(`A${currentRow}:${lastColumn}${currentRow}`);
      const schoolRow = worksheet.getRow(currentRow);
      schoolRow.getCell(1).value = "SEKOLAH DASAR NEGERI 1 PASIRPOGOR";
      schoolRow.getCell(1).font = {
        name: "Calibri",
        size: 14,
        bold: true,
        color: { argb: "FF1F2937" },
      };
      schoolRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      schoolRow.height = 25;
      currentRow++;

      // ==================== JUDUL LAPORAN ====================
      worksheet.mergeCells(`A${currentRow}:${lastColumn}${currentRow}`);
      const titleRow = worksheet.getRow(currentRow);
      const kelasInfo = filters.kelas
        ? `KELAS ${filters.kelas}`
        : "SEMUA KELAS";
      titleRow.getCell(1).value = `${getReportTitle()} ${kelasInfo}`;
      titleRow.getCell(1).font = {
        name: "Calibri",
        size: 13,
        bold: true,
        color: { argb: "FF1F2937" },
      };
      titleRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      titleRow.height = 23;
      currentRow++;

      // ==================== TAHUN AJARAN ====================
      worksheet.mergeCells(`A${currentRow}:${lastColumn}${currentRow}`);
      const tahunRow = worksheet.getRow(currentRow);
      tahunRow.getCell(1).value = `TAHUN AJARAN ${tahunAjaran}`;
      tahunRow.getCell(1).font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF374151" },
      };
      tahunRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      tahunRow.height = 20;
      currentRow += 2; // Spasi

      // ==================== TABLE HEADER ====================
      const headerRow = worksheet.getRow(currentRow);
      columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = {
          name: "Calibri",
          size: 10,
          bold: true,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E1F2" }, // Biru muda soft
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
      headerRow.height = 30;
      currentRow++;

      // ==================== TABLE DATA ====================
      formattedData.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(currentRow);

        columns.forEach((col, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          let value = row[col.key];

          // Set nilai
          cell.value = value;

          // Styling
          cell.font = {
            name: "Calibri",
            size: 10,
          };

          // Background alternating (zebra stripes) - abu-abu terang
          if (rowIndex % 2 !== 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
          }

          // Alignment
          if (colIndex === 0) {
            // No
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else if (col.key === "nisn") {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.numFmt = "@"; // Text format
          } else if (col.key === "nama_siswa") {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          } else if (col.key === "rata_rata" && value !== "-") {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.numFmt = "0.00";
            cell.font.bold = true;
          } else if (col.key === "jumlah" && value !== "-") {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font.bold = true;
          } else if (typeof value === "number") {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.numFmt = "0";
          } else {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }

          // Border tipis
          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
          };
        });

        dataRow.height = 20;
        currentRow++;
      });

      // ==================== COLUMN WIDTHS ====================
      worksheet.columns = columns.map((col) => ({
        width: col.width || 15,
      }));

      // ==================== SAVE FILE ====================
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const fileName = `Laporan_Nilai_Katrol_${filters.kelas || "Semua"}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      console.log("✅ Export berhasil!");
    } catch (error) {
      console.error("❌ Error exporting Excel:", error);
      alert("Gagal export Excel. Silakan coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  // Disable saat loading atau exporting
  const isDisabled = loading || exporting || !data || data.length === 0;

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToExcel}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium
          transition-all duration-200 shadow-sm
          ${
            isDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg active:scale-95"
          }
        `}>
        <FileSpreadsheet className="w-4 h-4" />
        <span>{exporting === "excel" ? "Exporting..." : "Export Excel"}</span>
      </button>
    </div>
  );
};

export default ExportButtons;
