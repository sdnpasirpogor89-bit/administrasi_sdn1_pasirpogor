import React, { useState } from "react";
import ExcelJS from "exceljs";

const StudentList = ({
  students,
  totalStudents,
  currentPageNum,
  totalPages,
  searchTerm,
  onSearch,
  onEditStudent,
  onDeleteStudent,
  onLoadStudents,
  onPageChange,
  onSetCurrentPage,
  isLoading,
  startIndex,
  rowsPerPage = 20,
  showToast,
  allStudents, // Tambahan props untuk semua data siswa (tidak terpaginasi)
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
  const [isExporting, setIsExporting] = useState(false);

  // Helper function untuk academic year (sama seperti di SPMB.js)
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Pendaftaran siswa baru: Januari-Juli untuk TA tahun depan
    // Agustus-Desember: pendaftaran untuk TA tahun depan juga
    if (currentMonth >= 7) { // Agustus-Desember (bulan 7-11)
      return `${currentYear + 1}/${currentYear + 2}`;
    } else { // Januari-Juli (bulan 0-6)
      return `${currentYear}/${currentYear + 1}`;
    }
  };

  // ✅ ADDED: Helper function untuk format tanggal DD-MM-YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    
    try {
      // Jika format YYYY-MM-DD
      if (dateString.includes("-")) {
        const [year, month, day] = dateString.split("-");
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
      
      // Jika sudah format DD-MM-YYYY atau format lain
      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original jika error
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = React.useMemo(() => {
    if (!sortConfig.key) return students;

    return [...students].sort((a, b) => {
      // Mapping field names untuk sorting
      let aValue, bValue;
      
      if (sortConfig.key === "nama") {
        aValue = a.nama_lengkap || a.nama || "";
        bValue = b.nama_lengkap || b.nama || "";
      } else if (sortConfig.key === "asal_sekolah") {
        aValue = a.asal_tk || a.asal_sekolah || "";
        bValue = b.asal_tk || b.asal_sekolah || "";
      } else {
        aValue = a[sortConfig.key] || "";
        bValue = b[sortConfig.key] || "";
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [students, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "fas fa-sort";
    return sortConfig.direction === "asc"
      ? "fas fa-sort-up"
      : "fas fa-sort-down";
  };

  const handleEdit = (student) => {
    onEditStudent(student);
    onSetCurrentPage("form");
  };

  const handleDelete = async (id) => {
    await onDeleteStudent(id);
    onLoadStudents();
  };

  // Export to Excel function
  const handleExportData = async () => {
    console.log("📊 DEBUG EXPORT:", {
      allStudents: allStudents,
      allStudentsLength: allStudents?.length,
      isExporting: isExporting,
      totalStudents: totalStudents,
    });

    if (!allStudents || allStudents.length === 0) {
      console.log("⚠ Export gagal: Tidak ada data");
      if (showToast) {
        showToast("Tidak ada data untuk di-export", "error");
      }
      return;
    }

    console.log("✅ Export dimulai...");
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data Calon Siswa");

      // Set column widths
      worksheet.columns = [
        { width: 5 }, // No
        { width: 30 }, // Nama Lengkap
        { width: 15 }, // Jenis Kelamin
        { width: 25 }, // Tempat Lahir
        { width: 15 }, // Tanggal Lahir
        { width: 25 }, // Asal TK/PAUD
        { width: 15 }, // NISN
        { width: 25 }, // Nama Ayah
        { width: 20 }, // Pekerjaan Ayah
        { width: 20 }, // Pendidikan Ayah
        { width: 25 }, // Nama Ibu
        { width: 20 }, // Pekerjaan Ibu
        { width: 20 }, // Pendidikan Ibu
        { width: 18 }, // No HP
        { width: 100 }, // Alamat
      ];

      // Get statistics
      const totalLaki = allStudents.filter(
        (s) => s.jenis_kelamin === "Laki-laki"
      ).length;
      const totalPerempuan = allStudents.filter(
        (s) => s.jenis_kelamin === "Perempuan"
      ).length;
      const academicYear = getCurrentAcademicYear(); // Dinamis sesuai tahun
      const currentDate = new Date().toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Header Sekolah - ✅ CHANGED: Left align
      worksheet.mergeCells("A1:O1");
      const schoolHeader = worksheet.getCell("A1");
      schoolHeader.value = "SDN 1 PASIR POGOR";
      schoolHeader.font = { bold: true, size: 16 };
      schoolHeader.alignment = { horizontal: "left", vertical: "middle" };

      // Header Data - ✅ CHANGED: Left align
      worksheet.mergeCells("A2:O2");
      const dataHeader = worksheet.getCell("A2");
      dataHeader.value = `DATA CALON SISWA BARU TAHUN AJARAN ${academicYear}`;
      dataHeader.font = { bold: true, size: 14 };
      dataHeader.alignment = { horizontal: "left", vertical: "middle" };

      // Total Data
      const totalCell = worksheet.getCell("A5");
      totalCell.value = `Total Data Siswa Baru : ${totalStudents} siswa`;
      totalCell.font = { bold: true, size: 11 };

      // Siswa Laki-laki
      const lakiCell = worksheet.getCell("A6");
      lakiCell.value = `Siswa Laki-laki: ${totalLaki} siswa`;
      lakiCell.font = { size: 11 };

      // Siswa Perempuan
      const perempuanCell = worksheet.getCell("A7");
      perempuanCell.value = `Siswa Perempuan: ${totalPerempuan} siswa`;
      perempuanCell.font = { size: 11 };

      // Tanggal Export
      const dateCell = worksheet.getCell("A4");
      dateCell.value = `Tanggal Export: ${currentDate}`;
      dateCell.font = { italic: true, size: 11 };

      // Header tabel (row 10)
      const headers = [
        "No.",
        "Nama Lengkap",
        "Jenis Kelamin",
        "Tempat Lahir",
        "Tanggal Lahir",
        "Asal TK/PAUD",
        "NISN",
        "Nama Ayah",
        "Pekerjaan Ayah",
        "Pendidikan Ayah",
        "Nama Ibu",
        "Pekerjaan Ibu",
        "Pendidikan Ibu",
        "No. HP Orang Tua",
        "Alamat Lengkap",
      ];

      const headerRow = worksheet.getRow(10);
      headerRow.values = headers;

      // Style header - Updated to blue theme
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1e3a8a" }, // Blue-800 for consistent theme
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data rows - Updated mapping sesuai database
      allStudents.forEach((student, index) => {
        const row = worksheet.getRow(11 + index);

        // Mapping field yang benar sesuai database
        const namaLengkap = student.nama_lengkap || student.nama || "-";
        const jenisKelamin = student.jenis_kelamin || "-";
        const tempatLahir = student.tempat_lahir || "-";
        const tanggalLahir = formatDateToDDMMYYYY(student.tanggal_lahir); // ✅ FORMAT DD-MM-YYYY
        const asalTK = student.asal_tk || student.asal_sekolah || "-";
        const nisn = student.nisn && student.nisn !== "-" ? student.nisn : "-";
        
        // Data orang tua
        const namaAyah = student.nama_ayah || "-";
        const pekerjaanAyah = student.pekerjaan_ayah || "-";
        const pendidikanAyah = student.pendidikan_ayah || "-";
        const namaIbu = student.nama_ibu || "-";
        const pekerjaanIbu = student.pekerjaan_ibu || "-";
        const pendidikanIbu = student.pendidikan_ibu || "-";
        const noHP = student.no_hp || "-";
        const alamat = student.alamat || "-";

        console.log(`📝 Student ${index + 1}:`, {
          namaLengkap,
          tanggalLahir, // Debug: cek format tanggal
          namaAyah,
          namaIbu,
          noHP,
          alamat,
        });

        row.values = [
          index + 1,
          namaLengkap,
          jenisKelamin,
          tempatLahir,
          tanggalLahir, // ✅ Sudah dalam format DD-MM-YYYY
          asalTK,
          nisn,
          namaAyah,
          pekerjaanAyah,
          pendidikanAyah,
          namaIbu,
          pekerjaanIbu,
          pendidikanIbu,
          noHP,
          alamat,
        ];

        // Style data rows
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle" };

          // Alternating row colors
          if (index % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8FAFC" },
            };
          }
        });

        // Center align No and Jenis Kelamin
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download file
      const fileName = `Data_Siswa_SDN1_Pasir_Pogor_${academicYear.replace('/', '-')}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (showToast) {
        showToast(`Data berhasil di-export: ${fileName}`, "success");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      if (showToast) {
        showToast("Gagal export data. Silakan coba lagi.", "error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Render functions
  const renderPhoneNumber = (phoneNumber, parentName) => {
    if (!phoneNumber) return <div className="text-gray-400 text-sm">-</div>;
    
    const cleanPhone = phoneNumber.toString().replace(/\D/g, "");
    let waPhone = cleanPhone;
    if (waPhone.startsWith("0")) {
      waPhone = "62" + waPhone.substring(1);
    } else if (!waPhone.startsWith("62")) {
      waPhone = "62" + waPhone;
    }

    const handleWhatsAppClick = () => {
      if (showToast) {
        showToast(
          `Membuka WhatsApp untuk menghubungi ${parentName}...`,
          "info"
        );
      }
    };

    return (
      <div className="flex flex-col gap-1">
        <div className="text-sm text-gray-800">{phoneNumber}</div>
        <div className="flex gap-1">
          <a
            href={`tel:${phoneNumber}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
            title="Telepon">
            <i className="fas fa-phone text-xs"></i>
            Call
          </a>
          <a
            href={`https://wa.me/${waPhone}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            title="WhatsApp">
            <i className="fab fa-whatsapp text-xs"></i>
            WA
          </a>
        </div>
      </div>
    );
  };

  // Card view component for mobile
  const StudentCard = ({ student, index }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-800 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {startIndex + index + 1}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              {student.nama_lengkap || student.nama}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                student.jenis_kelamin === "Laki-laki"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-pink-100 text-pink-800"
              }`}>
              {student.jenis_kelamin}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(student)}
            className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            title="Edit Data">
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => handleDelete(student.id)}
            className="bg-gradient-to-r from-red-600 to-red-400 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            title="Hapus Data">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500 mb-1">Tempat, Tanggal Lahir</div>
          <div className="font-medium">
            {student.tempat_lahir}, {formatDateToDDMMYYYY(student.tanggal_lahir)}
          </div>
        </div>

        <div>
          <div className="text-gray-500 mb-1">NISN</div>
          <div className="font-medium">
            {student.nisn && student.nisn !== "-" ? student.nisn : "-"}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="text-gray-500 mb-1">Alamat</div>
          <div className="font-medium">{student.alamat || "-"}</div>
        </div>

        <div>
          <div className="text-gray-500 mb-1">Orang Tua</div>
          <div className="font-medium">
            Ayah: {student.nama_ayah || "-"}
          </div>
          <div className="font-medium">
            Ibu: {student.nama_ibu || "-"}
          </div>
          <div className="mt-2">
            {renderPhoneNumber(student.no_hp, student.nama_ayah || student.nama_ibu)}
          </div>
        </div>

        <div>
          <div className="text-gray-500 mb-1">Asal TK/PAUD</div>
          <div className="font-medium">{student.asal_tk || student.asal_sekolah || "-"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
        <i className="fas fa-list text-blue-600"></i>
        Data Calon Siswa Baru
      </h2>

      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={onSearch}
            className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1 pl-12"
            placeholder="Cari nama siswa, asal sekolah, atau nama orang tua..."
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="bg-white border-2 border-gray-200 rounded-xl flex overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-4 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-blue-800 to-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}>
              <i className="fas fa-table"></i>
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-4 py-4 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                viewMode === "cards"
                  ? "bg-gradient-to-r from-blue-800 to-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}>
              <i className="fas fa-th-large"></i>
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>

          {/* Export Data Button */}
          <button
            onClick={() => {
              console.log("🖱️ Tombol Export diklik!");
              handleExportData();
            }}
            disabled={isExporting || !allStudents || allStudents.length === 0}
            className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3">
            <i className="fas fa-file-export"></i>
            <span className="hidden sm:inline">
              {isExporting ? "Exporting..." : "Export Data"}
            </span>
          </button>

          <button
            onClick={onLoadStudents}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3">
            <i className="fas fa-sync-alt"></i>
            <span className="hidden sm:inline">
              {isLoading ? "Memuat..." : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {/* Statistics - ✅ FIXED: Gunakan allStudents bukan students */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-800">
            {totalStudents}
          </div>
          <div className="text-blue-600 text-sm">Total Pendaftar</div>
        </div>
        <div className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-800">
            {allStudents ? allStudents.filter((s) => s.jenis_kelamin === "Laki-laki").length : 0}
          </div>
          <div className="text-green-600 text-sm">Siswa Laki-laki</div>
        </div>
        <div className="bg-gradient-to-r from-pink-100 to-pink-50 border-2 border-pink-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-pink-800">
            {allStudents ? allStudents.filter((s) => s.jenis_kelamin === "Perempuan").length : 0}
          </div>
          <div className="text-pink-600 text-sm">Siswa Perempuan</div>
        </div>
      </div>

      {/* Content - Table or Cards */}
      {viewMode === "cards" ? (
        // Cards View
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedStudents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <i className="fas fa-inbox text-4xl mb-4 text-gray-400"></i>
              <p className="text-gray-500">
                {searchTerm
                  ? "Tidak ada data yang sesuai dengan pencarian"
                  : "Belum ada data pendaftar"}
              </p>
            </div>
          ) : (
            sortedStudents.map((student, index) => (
              <StudentCard key={student.id} student={student} index={index} />
            ))
          )}
        </div>
      ) : (
        // Table View (Updated database mapping)
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left font-semibold text-sm">No</th>
                  <th
                    className="p-3 text-left font-semibold cursor-pointer hover:bg-blue-700 transition-colors text-sm min-w-[150px]"
                    onClick={() => handleSort("nama")}>
                    <div className="flex items-center gap-2">
                      Nama Siswa
                      <i className={getSortIcon("nama")}></i>
                    </div>
                  </th>
                  <th
                    className="p-3 text-left font-semibold cursor-pointer hover:bg-blue-700 transition-colors text-sm"
                    onClick={() => handleSort("jenis_kelamin")}>
                    <div className="flex items-center gap-2">
                      Jenis Kelamin
                      <i className={getSortIcon("jenis_kelamin")}></i>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold text-sm min-w-[120px]">
                    TTL
                  </th>
                  <th className="p-3 text-left font-semibold text-sm min-w-[200px]">
                    Orang Tua
                  </th>
                  <th
                    className="p-3 text-left font-semibold cursor-pointer hover:bg-blue-700 transition-colors text-sm min-w-[150px]"
                    onClick={() => handleSort("asal_sekolah")}>
                    <div className="flex items-center gap-2">
                      Asal TK/PAUD
                      <i className={getSortIcon("asal_sekolah")}></i>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold text-sm min-w-[100px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      <i className="fas fa-inbox text-4xl mb-2 block"></i>
                      {searchTerm
                        ? "Tidak ada data yang sesuai dengan pencarian"
                        : "Belum ada data pendaftar"}
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600 font-semibold">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">
                          {student.nama_lengkap || student.nama}
                        </div>
                        {student.nisn && student.nisn !== "-" && (
                          <div className="text-xs text-gray-500">
                            NISN: {student.nisn}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            student.jenis_kelamin === "Laki-laki"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-pink-100 text-pink-800"
                          }`}>
                          {student.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">
                            {student.tempat_lahir}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatDateToDDMMYYYY(student.tanggal_lahir)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium mb-1">
                            Ayah: {student.nama_ayah || "-"}
                          </div>
                          <div className="font-medium mb-1">
                            Ibu: {student.nama_ibu || "-"}
                          </div>
                          {renderPhoneNumber(student.no_hp, student.nama_ayah || student.nama_ibu)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {student.asal_tk || student.asal_sekolah || "-"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(student)}
                            className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-center"
                            title="Edit Data">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="bg-gradient-to-r from-red-600 to-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-center"
                            title="Hapus Data">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 mt-6 bg-white rounded-xl shadow-lg border border-gray-200 gap-4">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}-
            {Math.min(startIndex + rowsPerPage, totalStudents)} dari{" "}
            {totalStudents} data
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPageNum - 1)}
              disabled={currentPageNum === 1}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
              <i className="fas fa-chevron-left"></i>{" "}
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPageNum <= 3) {
                  pageNum = i + 1;
                } else if (currentPageNum >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPageNum - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      currentPageNum === pageNum
                        ? "bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg"
                        : "bg-white border border-gray-300 hover:bg-gray-50"
                    }`}>
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPageNum + 1)}
              disabled={currentPageNum === totalPages}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
              <span className="hidden sm:inline">Berikutnya</span>{" "}
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;