import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ExcelJS from "exceljs";
import { Upload, Plus, Trash2, Edit2, Save, X } from "lucide-react";

function InputTP() {
  const mataPelajaran = [
    "PAIBP",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "IPAS",
    "Matematika",
    "Bahasa Sunda",
    "Seni Budaya",
    "PJOK",
  ];

  const [kelas, setKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [periode, setPeriode] = useState(""); // TAMBAHAN: State untuk periode
  const [tpList, setTpList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [academicYear, setAcademicYear] = useState(null);

  // Fungsi untuk mendapatkan fase berdasarkan kelas
  const getFaseByKelas = (kelasNumber) => {
    if (kelasNumber >= 1 && kelasNumber <= 2) return "A";
    if (kelasNumber >= 3 && kelasNumber <= 4) return "B";
    if (kelasNumber >= 5 && kelasNumber <= 6) return "C";
    return "";
  };

  // Load kelas & academic year
  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  // Load TP ketika mapel dan periode dipilih
  useEffect(() => {
    if (selectedMapel && academicYear && kelas && periode) {
      loadTP();
    }
  }, [selectedMapel, academicYear, kelas, periode]);

  const loadUserData = () => {
    const sessionData = localStorage.getItem("userSession");
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        if (userData.kelas) {
          setKelas(userData.kelas);
        }
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

  const getSemesterNumber = (semester) => {
    if (semester === 1 || semester === "1") return "Ganjil";
    if (semester === 2 || semester === "2") return "Genap";
    return semester; // Kalau udah "Ganjil" atau "Genap" langsung return
  };

  const loadTP = async () => {
    console.log("=== LOAD TP DEBUG ===");
    console.log("Kelas:", kelas);
    console.log("Mapel:", selectedMapel);
    console.log("Periode:", periode);
    console.log("Academic Year:", academicYear);

    // Get class_id from kelas
    const { data: classData } = await supabase
      .from("classes")
      .select("id")
      .eq("grade", `Kelas ${kelas}`)
      .eq("academic_year", academicYear?.year)
      .single();

    if (!classData) {
      console.error("Class not found");
      return;
    }

    console.log("Class ID:", classData.id);

    // Tentukan semester dari periode
    const semesterFromPeriode = periode.includes("ganjil") ? "Ganjil" : "Genap";

    const { data, error } = await supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("class_id", classData.id)
      .eq("mata_pelajaran", selectedMapel)
      .eq("tahun_ajaran", academicYear?.year)
      .eq("semester", semesterFromPeriode)
      .eq("periode", periode)
      .order("urutan");

    console.log("Query Result:", data);
    console.log("Query Error:", error);
    console.log("===================");

    setTpList(data || []);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Get class_id
    const { data: classData } = await supabase
      .from("classes")
      .select("id")
      .eq("grade", `Kelas ${kelas}`)
      .eq("academic_year", academicYear?.year)
      .single();

    if (!classData) {
      alert("Class not found!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    const imported = [];

    // Auto-fill tingkat dan fase berdasarkan kelas guru
    const tingkatDefault = kelas;
    const faseDefault = getFaseByKelas(parseInt(kelas));
    const semesterDefault = academicYear?.semester;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 6) {
        // Skip header (row 1-6)
        const noCell = row.getCell(1).value;
        if (noCell && !isNaN(noCell)) {
          // Hanya ambil row yang ada NO-nya
          imported.push({
            class_id: classData.id,
            tingkat: row.getCell(2).value || tingkatDefault,
            fase: row.getCell(3).value || faseDefault,
            semester: getSemesterNumber(
              row.getCell(4).value || semesterDefault
            ),
            deskripsi_tp: row.getCell(5).value,
            urutan: Number(noCell),
            mata_pelajaran: selectedMapel,
            tahun_ajaran: academicYear?.year,
            periode: periode, // TAMBAHAN: Simpan periode
          });
        }
      }
    });

    const { error } = await supabase
      .from("tujuan_pembelajaran")
      .insert(imported);

    if (!error) {
      alert("Import berhasil!");
      loadTP();
    } else {
      alert("Import gagal: " + error.message);
    }
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template TP");

    // Auto-fill berdasarkan kelas guru
    const tingkatDefault = kelas;
    const faseDefault = getFaseByKelas(parseInt(kelas));
    const semesterDefault = academicYear?.semester;

    // Merge cells untuk header
    worksheet.mergeCells("A1:E1");
    worksheet.mergeCells("A2:E2");
    worksheet.mergeCells("A3:E3");
    worksheet.mergeCells("A4:E4");

    // Title
    worksheet.getCell("A1").value = "TEMPLATE TUJUAN PEMBELAJARAN";
    worksheet.getCell("A1").font = {
      bold: true,
      size: 16,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7B1FA2" },
    };
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Info
    worksheet.getCell("A2").value = `Mata Pelajaran: ${selectedMapel}`;
    worksheet.getCell("A2").font = { bold: true, size: 12 };
    worksheet.getCell("A2").alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    worksheet.getCell("A3").value = `Kelas: ${kelas}`;
    worksheet.getCell("A3").font = { bold: true, size: 12 };
    worksheet.getCell("A3").alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    worksheet.getCell(
      "A4"
    ).value = `Tahun Ajaran: ${academicYear?.year} - Semester ${academicYear?.semester}`;
    worksheet.getCell("A4").font = { bold: true, size: 12 };
    worksheet.getCell("A4").alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    // Header row
    const headerRow = worksheet.getRow(6);
    const headers = [
      "NO",
      "TINGKAT",
      "FASE",
      "SEMESTER",
      "TUJUAN PEMBELAJARAN",
    ];
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0D47A1" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 10;
    worksheet.getColumn(3).width = 8;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 70;

    // Example data dengan default value dari kelas guru
    const exampleRows = [
      [
        1,
        tingkatDefault,
        faseDefault,
        semesterDefault,
        "Siswa mampu menjelaskan konsep dasar...",
      ],
      [
        2,
        tingkatDefault,
        faseDefault,
        semesterDefault,
        "Siswa mampu menganalisis...",
      ],
      [
        3,
        tingkatDefault,
        faseDefault,
        semesterDefault,
        "Siswa mampu membuat...",
      ],
    ];

    exampleRows.forEach((rowData, idx) => {
      const row = worksheet.getRow(7 + idx);
      rowData.forEach((value, i) => {
        const cell = row.getCell(i + 1);
        cell.value = value;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if (i === 0 || i === 1 || i === 2 || i === 3) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
      });
    });

    // Generate buffer and download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Template_TP_${selectedMapel}_Kelas${kelas}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleAddRow = async () => {
    // Get class_id
    const { data: classData } = await supabase
      .from("classes")
      .select("id")
      .eq("grade", `Kelas ${kelas}`)
      .eq("academic_year", academicYear?.year)
      .single();

    if (!classData) {
      alert("Class not found!");
      return;
    }

    // Auto-fill berdasarkan kelas guru yang login
    const tingkatDefault = kelas;
    const faseDefault = getFaseByKelas(parseInt(kelas));

    const newRow = {
      class_id: classData.id,
      tingkat: tingkatDefault,
      fase: faseDefault,
      semester: getSemesterNumber(academicYear?.semester),
      deskripsi_tp: "",
      urutan: tpList.length + 1,
      mata_pelajaran: selectedMapel,
      tahun_ajaran: academicYear?.year,
      periode: periode, // TAMBAHAN: Simpan periode
    };

    const { data, error } = await supabase
      .from("tujuan_pembelajaran")
      .insert(newRow)
      .select()
      .single();

    if (!error && data) {
      setEditingId(data.id);
      setEditData(data);
      loadTP();
    } else {
      alert("Gagal menambah baris: " + error.message);
    }
  };

  const handleEdit = (tp) => {
    setEditingId(tp.id);
    setEditData(tp);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("tujuan_pembelajaran")
      .update({
        tingkat: editData.tingkat,
        fase: editData.fase,
        semester: getSemesterNumber(editData.semester),
        deskripsi_tp: editData.deskripsi_tp,
      })
      .eq("id", editingId);

    if (!error) {
      setEditingId(null);
      setEditData({});
      loadTP();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus TP ini?")) {
      const { error } = await supabase
        .from("tujuan_pembelajaran")
        .delete()
        .eq("id", id);

      if (!error) {
        loadTP();
      } else {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-base md:text-lg lg:text-xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
            INPUT TUJUAN PEMBELAJARAN (TP)
          </h2>

          {/* Filter Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Kelas
              </label>
              <input
                type="text"
                value={kelas}
                readOnly
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Mata Pelajaran
              </label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-all">
                <option value="">Pilih Mata Pelajaran</option>
                {mataPelajaran.map((mapel) => (
                  <option key={mapel} value={mapel}>
                    {mapel}
                  </option>
                ))}
              </select>
            </div>

            {/* TAMBAHAN: Dropdown Periode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Periode
              </label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-all">
                <option value="">-- Pilih Periode --</option>
                <option value="mid_ganjil">Mid Semester Ganjil</option>
                <option value="mid_genap">Mid Semester Genap</option>
              </select>
            </div>
          </div>

          {/* Academic Year Info */}
          {academicYear && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Tahun Ajaran:</span>{" "}
                {academicYear.year} - Semester {academicYear.semester}
              </p>
            </div>
          )}

          {/* Content - only show if all filters are selected */}
          {!selectedMapel || !periode ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">
                Silakan pilih Mata Pelajaran dan Periode terlebih dahulu
              </p>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end mb-4 sm:mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] transition-colors">
                  <Upload size={18} />
                  <span className="text-sm sm:text-base">
                    Download Template
                  </span>
                </button>
                <label className="bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-3 rounded-lg cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] transition-colors">
                  <Upload size={18} />
                  <span className="text-sm sm:text-base">Import TP</span>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleAddRow}
                  className="bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] transition-colors">
                  <Plus size={18} />
                  <span className="text-sm sm:text-base">Tambah/Edit TP</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-red-800 dark:bg-red-900 text-white">
                      <th className="border-b border-r border-red-700 dark:border-red-800 p-2 sm:p-3 w-16 text-sm sm:text-base">
                        No
                      </th>
                      <th className="border-b border-r border-red-700 dark:border-red-800 p-2 sm:p-3 w-24 text-sm sm:text-base">
                        Tingkat
                      </th>
                      <th className="border-b border-r border-red-700 dark:border-red-800 p-2 sm:p-3 w-24 text-sm sm:text-base">
                        Fase
                      </th>
                      <th className="border-b border-r border-red-700 dark:border-red-800 p-2 sm:p-3 w-32 text-sm sm:text-base">
                        Semester
                      </th>
                      <th className="border-b border-r border-red-700 dark:border-red-800 p-2 sm:p-3 text-sm sm:text-base">
                        Tujuan Pembelajaran
                      </th>
                      <th className="border-b border-r border-red-700 dark:border-red-800 p-2 sm:p-3 w-24 text-sm sm:text-base">
                        Status
                      </th>
                      <th className="border-b border-red-700 dark:border-red-800 p-2 sm:p-3 w-32 text-sm sm:text-base">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpList.map((tp, idx) => (
                      <tr
                        key={tp.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                        <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center text-sm sm:text-base">
                          {idx + 1}
                        </td>

                        {editingId === tp.id ? (
                          <>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                              <input
                                type="text"
                                value={editData.tingkat || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    tingkat: e.target.value,
                                  })
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm sm:text-base min-h-[44px]"
                                placeholder="3"
                              />
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                              <input
                                type="text"
                                value={editData.fase || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    fase: e.target.value,
                                  })
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm sm:text-base min-h-[44px]"
                                placeholder="C"
                              />
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                              <input
                                type="text"
                                value={editData.semester || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    semester: e.target.value,
                                  })
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm sm:text-base min-h-[44px]"
                                placeholder="Ganjil"
                              />
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 relative">
                              <textarea
                                value={editData.deskripsi_tp || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    deskripsi_tp: e.target.value,
                                  })
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm sm:text-base min-h-[60px]"
                                placeholder="Masukkan tujuan pembelajaran..."
                              />
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center">
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                                Aktif
                              </span>
                            </td>
                            <td className="p-2 sm:p-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={handleSave}
                                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white p-2 sm:p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                                  title="Simpan">
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white p-2 sm:p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                                  title="Batal">
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center text-sm sm:text-base">
                              {tp.tingkat}
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center text-sm sm:text-base">
                              {tp.fase}
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center text-sm sm:text-base">
                              {tp.semester}
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                              {tp.deskripsi_tp}
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 p-2 sm:p-3 text-center">
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                                Aktif
                              </span>
                            </td>
                            <td className="p-2 sm:p-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEdit(tp)}
                                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white p-2 sm:p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                                  title="Edit">
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(tp.id)}
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white p-2 sm:p-3 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                                  title="Hapus">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InputTP;
