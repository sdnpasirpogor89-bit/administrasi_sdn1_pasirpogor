import React from "react";
import { TrendingUp } from "lucide-react";

const KatrolTable = ({ data, kkm }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Tidak ada data untuk ditampilkan</p>
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
    return typeof nilai === "number" ? nilai.toFixed(2) : nilai;
  };

  // Kolom yang akan ditampilkan di mobile (prioritas)
  const mobileColumns = [
    "No",
    "Nama",
    "NH1",
    "NH1-K",
    "UTS",
    "UTS-K",
    "Nilai Akhir",
    "Nilai Akhir-K",
  ];

  return (
    <div className="w-full">
      {/* Desktop/Large Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                NISN
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                Nama Siswa
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                NH1
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                NH1-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                NH2
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                NH2-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                NH3
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                NH3-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                NH4
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                NH4-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                NH5
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                NH5-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                UTS
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                UTS-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                UAS
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                UAS-K
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700">
                Rata NH
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
                Rata NH-K
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30">
                Nilai Akhir
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30">
                Nilai Akhir-K
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((siswa, index) => (
              <tr
                key={siswa.nisn}
                className={
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-800"
                }>
                {/* No */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {index + 1}
                </td>

                {/* NISN */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">
                  {siswa.nisn}
                </td>

                {/* Nama */}
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700">
                  {siswa.nama_siswa}
                </td>

                {/* NH1 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH1)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH1)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH1,
                      siswa.nilai_katrol?.NH1
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* NH2 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH2)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH2)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH2,
                      siswa.nilai_katrol?.NH2
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* NH3 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH3)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH3)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH3,
                      siswa.nilai_katrol?.NH3
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* NH4 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH4)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH4)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH4,
                      siswa.nilai_katrol?.NH4
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* NH5 */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.NH5)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.NH5)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.NH5,
                      siswa.nilai_katrol?.NH5
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* UTS */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.UTS)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.UTS)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.UTS,
                      siswa.nilai_katrol?.UTS
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* UAS */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.nilai.UAS)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatNilai(siswa.nilai_katrol?.UAS)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai.UAS,
                      siswa.nilai_katrol?.UAS
                    ) && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </td>

                {/* Rata NH */}
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r dark:border-gray-700 text-center">
                  {formatNilai(siswa.rata_NH_asli)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-green-50 dark:bg-green-900/30">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {formatNilai(siswa.rata_NH_katrol)}
                  </span>
                </td>

                {/* Nilai Akhir */}
                <td className="px-4 py-3 whitespace-nowrap text-sm border-r dark:border-gray-700 text-center bg-blue-50 dark:bg-blue-900/30">
                  <span className="font-semibold dark:text-gray-100">
                    {formatNilai(siswa.nilai_akhir_asli)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center bg-blue-50 dark:bg-blue-900/30">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                      {formatNilai(siswa.nilai_akhir_katrol)}
                    </span>
                    {isNaikSignificant(
                      siswa.nilai_akhir_asli,
                      siswa.nilai_akhir_katrol
                    ) && (
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet View */}
      <div className="block lg:hidden">
        {data.map((siswa, index) => (
          <div
            key={siswa.nisn}
            className={`mb-4 rounded-lg border ${
              index % 2 === 0
                ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}>
            {/* Header Card */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {index + 1}. {siswa.nama_siswa}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  NISN: {siswa.nisn}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
              {/* NH1 */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  NH1
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {formatNilai(siswa.nilai.NH1)}
                </div>
              </div>
              <div className="space-y-1 bg-green-50 dark:bg-green-900/30 p-2 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  NH1-K
                </div>
                <div className="flex items-center gap-1">
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  UTS
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {formatNilai(siswa.nilai.UTS)}
                </div>
              </div>
              <div className="space-y-1 bg-green-50 dark:bg-green-900/30 p-2 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  UTS-K
                </div>
                <div className="flex items-center gap-1">
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

              {/* Nilai Akhir */}
              <div className="space-y-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded col-span-2 md:col-span-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Nilai Akhir
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatNilai(siswa.nilai_akhir_asli)}
                </div>
              </div>
              <div className="space-y-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded col-span-2 md:col-span-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Nilai Akhir-K
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {formatNilai(siswa.nilai_akhir_katrol)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai_akhir_asli,
                    siswa.nilai_akhir_katrol
                  ) && (
                    <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>

              {/* Button untuk lihat detail */}
              <div className="col-span-2 md:col-span-2">
                <button
                  className="w-full mt-2 text-xs text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => {
                    // Di sini bisa tambahkan modal atau expand untuk lihat semua nilai
                    console.log("Lihat detail untuk", siswa.nama_siswa);
                  }}>
                  Lihat semua nilai →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"></div>
          <span className="text-gray-600 dark:text-gray-300">Nilai Katrol</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"></div>
          <span className="text-gray-600 dark:text-gray-300">Nilai Akhir</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-gray-600 dark:text-gray-300">
            Naik ≥ 5 poin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            KKM: {kkm}
          </span>
        </div>
      </div>

      {/* Info Responsive */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p className="lg:hidden">
          ↔️ Geser ke kanan/kiri untuk melihat lebih banyak kolom
        </p>
        <p className="hidden lg:block">
          Tabel ditampilkan lengkap untuk desktop
        </p>
      </div>
    </div>
  );
};

export default KatrolTable;
