import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ExcelJS from "exceljs";
import { Upload, Plus, Trash2, Edit2, Save, X } from "lucide-react";

function InputTP() {
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

  const [kelas, setKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [tpList, setTpList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [academicYear, setAcademicYear] = useState(null);

  // Load kelas & academic year
  useEffect(() => {
    loadUserData();
    loadActiveAcademicYear();
  }, []);

  // Load TP ketika mapel dipilih
  useEffect(() => {
    if (selectedMapel && academicYear && kelas) {
      loadTP();
    }
  }, [selectedMapel, academicYear, kelas]);

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

  const loadTP = async () => {
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

    const { data } = await supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("class_id", classData.id)
      .eq("mata_pelajaran", selectedMapel)
      .eq("tahun_ajaran", academicYear?.year)
      .eq("semester", academicYear?.semester)
      .order("urutan");

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

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 6) {
        // Skip header (row 1-6)
        const noCell = row.getCell(1).value;
        if (noCell && !isNaN(noCell)) {
          // Hanya ambil row yang ada NO-nya
          imported.push({
            class_id: classData.id,
            tingkat: row.getCell(2).value,
            fase: row.getCell(3).value,
            semester: row.getCell(4).value,
            deskripsi_tp: row.getCell(5).value,
            urutan: Number(noCell),
            mata_pelajaran: selectedMapel,
            tahun_ajaran: academicYear?.year,
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
    ).value = `Tahun Ajaran: ${academicYear?.year} - Semester: ${academicYear?.semester}`;
    worksheet.getCell("A4").font = { size: 11, italic: true };
    worksheet.getCell("A4").alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    // Spasi
    worksheet.addRow([]);

    // Header kolom (row 6)
    const headerRow = worksheet.addRow([
      "NO",
      "TINGKAT",
      "FASE",
      "SEMESTER",
      "TUJUAN PEMBELAJARAN",
    ]);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1976D2" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Kolom width
    worksheet.columns = [
      { key: "no", width: 6 },
      { key: "tingkat", width: 10 },
      { key: "fase", width: 10 },
      { key: "semester", width: 12 },
      { key: "deskripsi_tp", width: 80 },
    ];

    // Contoh data (5 row)
    for (let i = 1; i <= 5; i++) {
      const row = worksheet.addRow([
        i,
        kelas || "3",
        "C",
        academicYear?.semester || "Ganjil",
        i === 1
          ? "Contoh: mengidentifikasi dan menulis kalimat rasa pada makanan dan minuman"
          : "",
      ]);
      row.alignment = { vertical: "middle", wrapText: true };
      row.height = 40;

      // Border
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    // Border untuk header info
    ["A1", "A2", "A3", "A4"].forEach((cell) => {
      worksheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Instruksi di bawah (row terakhir)
    worksheet.addRow([]);
    const instruksi = worksheet.addRow([
      "INSTRUKSI:",
      "",
      "",
      "",
      "Isi kolom NO secara berurutan, kolom TUJUAN PEMBELAJARAN maksimal 200 karakter",
    ]);
    instruksi.font = { bold: true, color: { argb: "FFE65100" }, size: 10 };
    worksheet.mergeCells(instruksi.number, 5, instruksi.number, 5);

    // Download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Template_TP_${selectedMapel}_Kelas${kelas}_${academicYear?.semester}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleAddRow = () => {
    const newRow = {
      id: `temp-${Date.now()}`,
      tingkat: "",
      fase: "",
      semester: academicYear?.semester === "Ganjil" ? "1" : "2",
      deskripsi_tp: "",
      urutan: tpList.length + 1,
      isNew: true,
    };
    setTpList([...tpList, newRow]);
    setEditingId(newRow.id);
    setEditData(newRow);
  };

  const handleEdit = (tp) => {
    setEditingId(tp.id);
    setEditData({ ...tp });
  };

  const handleSave = async () => {
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

    const saveData = {
      ...editData,
      class_id: classData.id,
      mata_pelajaran: selectedMapel,
      tahun_ajaran: academicYear?.year,
      semester: academicYear?.semester,
    };

    if (editData.isNew) {
      delete saveData.id;
      delete saveData.isNew;
      const { error } = await supabase
        .from("tujuan_pembelajaran")
        .insert(saveData);
      if (!error) loadTP();
    } else {
      const { error } = await supabase
        .from("tujuan_pembelajaran")
        .update(saveData)
        .eq("id", editingId);
      if (!error) loadTP();
    }

    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus TP ini?")) return;

    await supabase.from("tujuan_pembelajaran").delete().eq("id", id);

    loadTP();
  };

  const handleCancel = () => {
    if (editData.isNew) {
      setTpList(tpList.filter((tp) => tp.id !== editingId));
    }
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-base md:text-lg lg:text-xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          DATA TUJUAN PEMBELAJARAN
        </h2>

        {/* Filter Kelas & Mata Pelajaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-red-50 dark:bg-gray-700 p-4 rounded-lg">
          <div>
            <label className="block font-semibold mb-2 text-gray-900 dark:text-white">
              Pilih Kelas
            </label>
            <input
              type="text"
              value={kelas ? `Kelas ${kelas}` : ""}
              disabled
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-gray-900 dark:text-white">
              Pilih Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white">
              <option value="">-- Pilih Mata Pelajaran --</option>
              {mataPelajaran.map((mp) => (
                <option key={mp} value={mp}>
                  {mp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMapel && (
          <>
            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mb-4 sm:justify-end">
              <button
                onClick={handleDownloadTemplate}
                disabled={!selectedMapel}
                className="bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px] transition-colors">
                <Upload size={18} />
                <span className="text-sm sm:text-base">Download Template</span>
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
  );
}

export default InputTP;
