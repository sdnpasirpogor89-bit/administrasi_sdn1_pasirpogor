import React from "react";
import { TrendingUp } from "lucide-react";

const KatrolTable = ({ data, kkm }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              NISN
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              Nama Siswa
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              NH1
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              NH1-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              NH2
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              NH2-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              NH3
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              NH3-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              NH4
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              NH4-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              NH5
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              NH5-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              UTS
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              UTS-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              UAS
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              UAS-K
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
              Rata NH
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">
              Rata NH-K
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-blue-50">
              Nilai Akhir
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-50">
              Nilai Akhir-K
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((siswa, index) => (
            <tr
              key={siswa.nisn}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {/* No */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {index + 1}
              </td>

              {/* NISN */}
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r">
                {siswa.nisn}
              </td>

              {/* Nama */}
              <td className="px-4 py-3 text-sm text-gray-900 border-r">
                {siswa.nama_siswa}
              </td>

              {/* NH1 */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.NH1)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.NH1)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.NH1,
                    siswa.nilai_katrol?.NH1
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* NH2 */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.NH2)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.NH2)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.NH2,
                    siswa.nilai_katrol?.NH2
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* NH3 */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.NH3)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.NH3)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.NH3,
                    siswa.nilai_katrol?.NH3
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* NH4 */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.NH4)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.NH4)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.NH4,
                    siswa.nilai_katrol?.NH4
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* NH5 */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.NH5)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.NH5)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.NH5,
                    siswa.nilai_katrol?.NH5
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* UTS */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.UTS)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.UTS)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.UTS,
                    siswa.nilai_katrol?.UTS
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* UAS */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.nilai.UAS)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold text-green-700">
                    {formatNilai(siswa.nilai_katrol?.UAS)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai.UAS,
                    siswa.nilai_katrol?.UAS
                  ) && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </td>

              {/* Rata NH */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-center">
                {formatNilai(siswa.rata_NH_asli)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm border-r text-center bg-green-50">
                <span className="font-semibold text-green-700">
                  {formatNilai(siswa.rata_NH_katrol)}
                </span>
              </td>

              {/* Nilai Akhir */}
              <td className="px-4 py-3 whitespace-nowrap text-sm border-r text-center bg-blue-50">
                <span className="font-semibold">
                  {formatNilai(siswa.nilai_akhir_asli)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center bg-blue-50">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-blue-700 text-base">
                    {formatNilai(siswa.nilai_akhir_katrol)}
                  </span>
                  {isNaikSignificant(
                    siswa.nilai_akhir_asli,
                    siswa.nilai_akhir_katrol
                  ) && <TrendingUp className="w-4 h-4 text-blue-600" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200"></div>
          <span className="text-gray-600">Nilai Katrol</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200"></div>
          <span className="text-gray-600">Nilai Akhir</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">Naik ≥ 5 poin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">KKM: {kkm}</span>
        </div>
      </div>
    </div>
  );
};

export default KatrolTable;
