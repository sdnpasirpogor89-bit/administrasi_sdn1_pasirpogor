import React, { useState } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient";
import { Download, Upload, Plus, X, AlertCircle } from "lucide-react";

// --- START: Component dan Fungsi Reusable dari Students.js ---
const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
  disabled = false,
}) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary:
      "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
};
// --- END: Component dan Fungsi Reusable dari Students.js ---

// Fungsi 1: Handle Export Data Siswa DENGAN ExcelJS (Styling Premium)
const handleExport = async (students, userData) => {
  if (!students || students.length === 0) {
    return 0;
  }

  // Buat workbook dan worksheet baru
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Siswa", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Tentukan kelas info
  const classInfo =
    userData && userData.role === "guru_kelas"
      ? `DATA SISWA KELAS ${userData.kelas}`
      : "DATA SELURUH SISWA";

  // === HEADER SECTION ===
  // Baris 1: Judul Sekolah
  worksheet.mergeCells("A1:F1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "SEKOLAH DASAR NEGERI 1 PASIRPOGOR";
  titleCell.font = { name: "Arial", size: 14, bold: true };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 25;

  // Baris 2: Subjudul (Data Kelas)
  worksheet.mergeCells("A2:F2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = classInfo;
  subtitleCell.font = { name: "Arial", size: 12, bold: true };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(2).height = 22;

  // Baris 3: Kosong (spacing)
  // worksheet.getRow(3).height = default (15)

  // Baris 4: Kosong (spacing)
  // worksheet.getRow(4).height = default (15)

  // === TABLE HEADER (Baris 5) ===
  const headers = [
    "No.",
    "NISN",
    "Nama Siswa",
    "Jenis Kelamin",
    "Kelas",
    "Status",
  ];
  const headerRow = worksheet.getRow(5);

  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { name: "Arial", size: 11, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFA7F3D0" }, // Green pastel (Emerald 200)
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
  });
  headerRow.height = 20;

  // === DATA ROWS (Mulai dari baris 6) ===
  students.forEach((student, index) => {
    const rowNum = index + 6;
    const dataRow = worksheet.getRow(rowNum);

    const rowData = [
      index + 1,
      student.nisn,
      student.nama_siswa,
      student.jenis_kelamin,
      student.kelas,
      student.is_active ? "Aktif" : "Nonaktif",
    ];

    rowData.forEach((value, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      cell.value = value;
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: colIdx === 0 || colIdx === 4 ? "center" : "left", // No & Kelas center
      };

      // Zebra striping (baris genap)
      if (index % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" }, // Gray 50
        };
      }

      // Border untuk semua cell data
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      // Highlight status nonaktif dengan warna merah muda
      if (colIdx === 5 && !student.is_active) {
        cell.font = { name: "Arial", size: 10, color: { argb: "FFDC2626" } }; // Red 600
      }
    });

    dataRow.height = 18;
  });

  // === COLUMN WIDTH ===
  worksheet.getColumn(1).width = 6; // No.
  worksheet.getColumn(2).width = 15; // NISN
  worksheet.getColumn(3).width = 35; // Nama Siswa
  worksheet.getColumn(4).width = 15; // Jenis Kelamin
  worksheet.getColumn(5).width = 8; // Kelas
  worksheet.getColumn(6).width = 12; // Status

  // === EXPORT FILE ===
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const date = new Date().toISOString().slice(0, 10);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Data_Siswa_${date}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);

  return students.length;
};

// Fungsi 2: Handle Import Data Siswa (Tetap pakai XLSX karena lebih reliable untuk read)
const handleImport = async (file, showToast, fetchStudents) => {
  if (!file) {
    showToast("Pilih file Excel untuk diimport.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Mulai baca dari baris 5 (header tabel di baris 5, data mulai baris 6)
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      range.s.r = 4; // Row index 4 = baris 5 (header)

      const json = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: XLSX.utils.encode_range(range),
      });

      if (json.length < 2) {
        showToast(
          "File Excel kosong atau tidak memiliki data yang valid.",
          "error"
        );
        return;
      }

      const headers = json[0].map((h) => String(h).trim());
      const requiredHeaders = ["NISN", "Nama Siswa", "Kelas", "Jenis Kelamin"];

      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        showToast(
          `Header tidak lengkap. Hilang: ${missingHeaders.join(
            ", "
          )}. Pastikan format sesuai template.`,
          "error"
        );
        return;
      }

      const rows = json.slice(1);

      const importData = rows
        .filter((row) => row && row[headers.indexOf("NISN")])
        .map((row) => {
          const nisnIndex = headers.indexOf("NISN");
          const namaIndex = headers.indexOf("Nama Siswa");
          const kelasIndex = headers.indexOf("Kelas");
          const jkIndex = headers.indexOf("Jenis Kelamin");
          const statusIndex = headers.indexOf("Status");

          let isActive = true;
          if (statusIndex !== -1 && row[statusIndex] !== undefined) {
            const statusText = String(row[statusIndex]).toLowerCase().trim();
            isActive =
              statusText === "aktif" ||
              statusText === "1" ||
              statusText === "true";
          }

          return {
            nisn: String(row[nisnIndex] || "").trim(),
            nama_siswa: String(row[namaIndex] || "").trim(),
            kelas: parseInt(row[kelasIndex]),
            jenis_kelamin: String(row[jkIndex] || "").trim(),
            is_active: isActive,
          };
        })
        .filter(
          (data) =>
            data.nisn &&
            data.nama_siswa &&
            !isNaN(data.kelas) &&
            data.kelas > 0 &&
            ["Laki-laki", "Perempuan"].includes(data.jenis_kelamin)
        );

      if (importData.length === 0) {
        showToast("Tidak ada data siswa valid untuk diimport.", "error");
        return;
      }

      const { error } = await supabase.from("students").upsert(importData, {
        onConflict: "nisn",
      });

      if (error) throw error;

      showToast(
        `Berhasil mengimpor/mengupdate ${importData.length} data siswa!`,
        "success"
      );
      fetchStudents();
    } catch (error) {
      console.error("Import error:", error);
      showToast(
        "Gagal mengimpor data. Pastikan format file sesuai template.",
        "error"
      );
    }
  };
  reader.readAsArrayBuffer(file);
};

// Komponen Utama yang diekspor
export const StudentsExcelActions = ({
  students,
  showToast,
  fetchStudents,
  onAdd,
  isMobile,
  userData,
}) => {
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [file, setFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExportClick = async () => {
    setLoadingExport(true);
    try {
      const exportedCount = await handleExport(students, userData);
      if (exportedCount > 0) {
        showToast(
          `Berhasil mengekspor ${exportedCount} data siswa.`,
          "success"
        );
      } else {
        showToast("Tidak ada data siswa yang bisa diekspor.", "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast("Gagal mengekspor data.", "error");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleSubmitImport = async () => {
    if (!file) {
      showToast("Pilih file terlebih dahulu.", "error");
      return;
    }
    setLoadingImport(true);
    await handleImport(file, showToast, fetchStudents);
    setLoadingImport(false);
    setShowImportModal(false);
    setFile(null);
  };

  if (isMobile) {
    return (
      <>
        <select
          onChange={(e) => {
            const action = e.target.value;
            if (action === "add") onAdd();
            if (action === "export") handleExportClick();
            if (action === "import") setShowImportModal(true);
            e.target.value = "";
          }}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white min-w-[120px]">
          <option value="">Action...</option>
          <option value="add">Tambah Siswa</option>
          <option value="export">Export Data (.xlsx)</option>
          <option value="import">Import Data (.xlsx)</option>
        </select>

        <ImportModal
          show={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setFile(null);
          }}
          onFileChange={setFile}
          onSubmit={handleSubmitImport}
          loading={loadingImport}
          file={file}
        />
      </>
    );
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <ActionButton
        icon={Plus}
        label="Tambah Siswa"
        onClick={onAdd}
        variant="primary"
      />
      <ActionButton
        icon={Download}
        label="Export"
        onClick={handleExportClick}
        variant="secondary"
        disabled={loadingExport}
      />
      <ActionButton
        icon={Upload}
        label="Import"
        onClick={() => setShowImportModal(true)}
        variant="secondary"
      />

      <ImportModal
        show={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setFile(null);
        }}
        onFileChange={setFile}
        onSubmit={handleSubmitImport}
        loading={loadingImport}
        file={file}
      />
    </div>
  );
};

// Import Modal Component
const ImportModal = ({
  show,
  onClose,
  onFileChange,
  onSubmit,
  loading,
  file,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Import Data Siswa
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-start bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg mb-4">
          <AlertCircle
            size={20}
            className="text-blue-600 mr-3 mt-1 flex-shrink-0"
          />
          <p className="text-sm text-blue-800">
            Gunakan file template yang sudah diekspor. Data harus dimulai dari{" "}
            <strong>baris ke-6</strong> dengan header di{" "}
            <strong>baris ke-5</strong>. NISN digunakan untuk update otomatis.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih File Excel *
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => onFileChange(e.target.files[0])}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <p className="text-xs text-gray-500 mb-4">
            File terpilih: <strong>{file.name}</strong>
          </p>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            Batal
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={loading || !file}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50">
            {loading ? "Memproses..." : "Import Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
