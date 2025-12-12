import React, { useState } from "react";
import { TrendingUp, X, ChevronRight } from "lucide-react";

const KatrolTable = ({ data, kkm }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-white dark:bg-gray-900 rounded-lg border border-red-100 dark:border-gray-700">
        <div className="text-4xl mb-3 text-gray-300 dark:text-gray-600">📊</div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Tidak ada data untuk ditampilkan
        </p>
      </div>
    );
  }

  // Helper untuk cek apakah nilai naik
  const isNaikSignificant = (asli, katrol) => {
    if (!asli || !katrol) return false;
    return katrol - asli >= 5; // Naik minimal 5 poin
  };

  // Helper untuk format nilai
  const formatNilai = (nilai) => {
    if (nilai === null || nilai === undefined || nilai === "") return "-";
    if (typeof nilai === "number") {
      return nilai % 1 === 0 ? nilai.toString() : nilai.toFixed(2);
    }
    return nilai;
  };

  // Tampilkan modal detail
  const handleShowDetail = (siswa) => {
    setSelectedStudent(siswa);
    setShowModal(true);
  };

  // Tutup modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  // Data untuk modal
  const getDetailData = (siswa) => [
    { label: "NH1", asli: siswa.nilai.NH1, katrol: siswa.nilai_katrol?.NH1 },
    { label: "NH2", asli: siswa.nilai.NH2, katrol: siswa.nilai_katrol?.NH2 },
    { label: "NH3", asli: siswa.nilai.NH3, katrol: siswa.nilai_katrol?.NH3 },
    { label: "NH4", asli: siswa.nilai.NH4, katrol: siswa.nilai_katrol?.NH4 },
    { label: "NH5", asli: siswa.nilai.NH5, katrol: siswa.nilai_katrol?.NH5 },
    { label: "UTS", asli: siswa.nilai.UTS, katrol: siswa.nilai_katrol?.UTS },
    { label: "UAS", asli: siswa.nilai.UAS, katrol: siswa.nilai_katrol?.UAS },
    {
      label: "Rata NH",
      asli: siswa.rata_NH_asli,
      katrol: siswa.rata_NH_katrol,
    },
    {
      label: "Nilai Akhir",
      asli: siswa.nilai_akhir_asli,
      katrol: siswa.nilai_akhir_katrol,
    },
  ];

  return (
    <div className="w-full">
      {/* Modal untuk Lihat Semua Nilai */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/60 dark:bg-black/70 backdrop-blur-sm touch-none">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-red-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 dark:from-gray-800 dark:to-gray-900 text-white p-4 border-b border-white/20 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold">
                    Detail Nilai - {selectedStudent.nama_siswa}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 dark:text-gray-300 mt-1">
                    NISN: {selectedStudent.nisn}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="ml-4 p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-gray-700 touch-manipulation active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="space-y-2">
                {getDetailData(selectedStudent).map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 gap-2 p-2.5 rounded-lg border border-red-100 dark:border-gray-700 hover:bg-red-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-300">
                      {item.label}
                    </div>
                    <div className="text-xs sm:text-sm text-center text-gray-700 dark:text-gray-400">
                      {formatNilai(item.asli)}
                    </div>
                    <div
                      className={`text-xs sm:text-sm text-center font-semibold flex items-center justify-center gap-1 ${
                        item.katrol && item.asli && item.katrol > item.asli
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-800 dark:text-gray-300"
                      }`}>
                      {formatNilai(item.katrol)}
                      {isNaikSignificant(item.asli, item.katrol) && (
                        <TrendingUp className="w-3 h-3 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Card */}
              <div className="mt-4 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-3">
                  Status & Kenaikan
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Status
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        selectedStudent.status === "Tuntas" ||
                        selectedStudent.nilai_akhir_katrol >= kkm
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {selectedStudent.status ||
                        (selectedStudent.nilai_akhir_katrol >= kkm
                          ? "Tuntas"
                          : "Belum Tuntas")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Kenaikan
                    </div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {selectedStudent.nilai_akhir_asli &&
                      selectedStudent.nilai_akhir_katrol
                        ? `${(
                            selectedStudent.nilai_akhir_katrol -
                            selectedStudent.nilai_akhir_asli
                          ).toFixed(1)} poin`
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    KKM
                  </div>
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-300">
                    {kkm}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-red-200 dark:border-gray-700 p-3 sm:p-4">
              <button
                onClick={handleCloseModal}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium touch-manipulation active:scale-95 min-h-[44px]">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop/Large Table - dengan tema merah */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-red-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 p-3 border-b border-red-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Tabel Nilai Katrol
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Total{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                {data.length}
              </span>{" "}
              siswa
            </div>
          </div>
        </div>
        <table className="min-w-full divide-y divide-red-200 dark:divide-gray-700">
          <thead className="bg-red-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                NISN
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 min-w-[180px]">
                Nama Siswa
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                NH1
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                NH1-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                NH2
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                NH2-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                NH3
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                NH3-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                NH4
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                NH4-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                NH5
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                NH5-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                UTS
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                UTS-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                UAS
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                UAS-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider border-r border-red-200 dark:border-gray-700">
                Rata NH
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/20">
                Rata NH-K
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider border-r border-red-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/20">
                Nilai Akhir
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-900/20">
                Nilai Akhir-K
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-red-100 dark:divide-gray-700">
            {data.map((siswa, index) => (
              <tr
                key={siswa.nisn}
                className="hover:bg-red-50/30 dark:hover:bg-gray-800/50 transition-colors duration-150">
                {/* No */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center font-medium">
                  {index + 1}
                </td>

                {/* NISN */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 font-mono">
                  {siswa.nisn}
                </td>

                {/* Nama */}
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700">
                  {siswa.nama_siswa}
                </td>

                {/* NH1 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH1)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH1)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH1,
                      siswa.nilai_katrol?.NH1
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* NH2 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH2)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH2)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH2,
                      siswa.nilai_katrol?.NH2
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* NH3 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH3)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH3)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH3,
                      siswa.nilai_katrol?.NH3
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* NH4 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH4)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH4)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH4,
                      siswa.nilai_katrol?.NH4
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* NH5 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH5)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH5)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH5,
                      siswa.nilai_katrol?.NH5
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* UTS */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.UTS)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.UTS)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.UTS,
                      siswa.nilai_katrol?.UTS
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* UAS */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.UAS)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.UAS)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.UAS,
                      siswa.nilai_katrol?.UAS
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* Rata NH */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 border-r border-red-100 dark:border-gray-700 text-center">
                  {formatNilai(siswa.rata_NH_asli)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-green-50/30 dark:bg-green-900/10">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {formatNilai(siswa.rata_NH_katrol)}
                  </span>
                </td>

                {/* Nilai Akhir */}
                <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-red-100 dark:border-gray-700 text-center bg-blue-50/30 dark:bg-blue-900/10">
                  <span className="font-semibold text-gray-800 dark:text-gray-300">
                    {formatNilai(siswa.nilai_akhir_asli)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center bg-blue-50/30 dark:bg-blue-900/10">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">
                      {formatNilai(siswa.nilai_akhir_katrol)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai_akhir_asli,
                      siswa.nilai_akhir_katrol
                    ) && (
                      <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet View - Enhanced */}
      <div className="block lg:hidden space-y-3">
        {data.map((siswa, index) => (
          <div
            key={siswa.nisn}
            className={`rounded-xl border ${
              index % 2 === 0
                ? "bg-white dark:bg-gray-900 border-red-200 dark:border-gray-700"
                : "bg-red-50/30 dark:bg-gray-800 border-red-200 dark:border-gray-700"
            } overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200`}>
            {/* Header Card */}
            <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 px-4 py-3 border-b border-red-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-gray-700 text-red-700 dark:text-red-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {siswa.nama_siswa}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      NISN: {siswa.nisn}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      siswa.status === "Tuntas" ||
                      siswa.nilai_akhir_katrol >= kkm
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    {siswa.status ||
                      (siswa.nilai_akhir_katrol >= kkm ? "Tuntas" : "Belum")}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {/* NH1 */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    NH1
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-gray-300">
                      {formatNilai(siswa.nilai.NH1)}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH1)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH1,
                      siswa.nilai_katrol?.NH1
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>

                {/* UTS */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    UTS
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-gray-300">
                      {formatNilai(siswa.nilai.UTS)}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.UTS)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.UTS,
                      siswa.nilai_katrol?.UTS
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>

                {/* UAS */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    UAS
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-gray-300">
                      {formatNilai(siswa.nilai.UAS)}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.UAS)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.UAS,
                      siswa.nilai_katrol?.UAS
                    ) && (
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Nilai Akhir Section */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Nilai Akhir
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-300">
                    {formatNilai(siswa.nilai_akhir_asli)}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 relative">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Nilai Akhir-K
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_akhir_katrol)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai_akhir_asli,
                      siswa.nilai_akhir_katrol
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  {isNaikSignificant(
                    siswa.nilai_akhir_asli,
                    siswa.nilai_akhir_katrol
                  ) && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      ↑
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Button */}
              <button
                onClick={() => handleShowDetail(siswa)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 touch-manipulation active:scale-95 min-h-[44px]">
                <span>Lihat Detail Lengkap</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legend dengan tema merah */}
      <div className="mt-6 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm p-3 sm:p-4 bg-red-50 dark:bg-gray-800 rounded-xl border border-red-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Nilai Katrol</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">Nilai Akhir</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-gray-700 dark:text-gray-300">
            Naik ≥ 5 poin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300">
            KKM:{" "}
            <span className="font-bold text-red-600 dark:text-red-400">
              {kkm}
            </span>
          </span>
        </div>
      </div>

      {/* Info Responsive */}
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center p-2">
        <p className="lg:hidden">
          <span className="inline-block bg-red-100 dark:bg-gray-700 px-2 py-1 rounded text-red-700 dark:text-gray-300">
            ↔️ Geser ke kanan/kiri untuk melihat lebih banyak kolom
          </span>
        </p>
        <p className="hidden lg:block">
          <span className="inline-block bg-red-100 dark:bg-gray-700 px-2 py-1 rounded text-red-700 dark:text-gray-300">
            Tabel ditampilkan lengkap untuk desktop
          </span>
        </p>
      </div>
    </div>
  );
};

export default KatrolTable;
