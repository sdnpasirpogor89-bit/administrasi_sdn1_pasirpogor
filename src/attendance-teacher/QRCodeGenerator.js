// src/attendance-teacher/QRCodeGenerator.js - DARK MODE COMPLETE
import React, { useState, useRef, useEffect } from "react";
import { Download, RefreshCw, QrCode } from "lucide-react";

const QRCodeGenerator = () => {
  const qrCode = "QR_PRESENSI_GURU_SDN1_PASIRPOGOR";
  const [qrUrl, setQrUrl] = useState("");
  const [finalQrUrl, setFinalQrUrl] = useState("");
  const canvasRef = useRef(null);

  const generateQR = () => {
    const size = 600;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      qrCode
    )}`;
    setQrUrl(url);
  };

  useEffect(() => {
    if (qrUrl && canvasRef.current) {
      addBorderAndBranding();
    }
  }, [qrUrl]);

  const addBorderAndBranding = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const qrSize = 600;
    const padding = 40;
    const bottomSpace = 150;
    const width = qrSize + padding * 2;
    const height = qrSize + padding * 2 + bottomSpace;

    canvas.width = width;
    canvas.height = height;

    // Draw white background (tetap putih karena untuk print/display)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Draw outer border (red) - CHANGED TO RED
    ctx.strokeStyle = "#dc2626"; // red-600
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Draw inner border
    ctx.strokeStyle = "#ef4444"; // red-500
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

      const lineY = padding + qrSize + 15;
      ctx.strokeStyle = "#e5e7eb"; // gray-200
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, lineY);
      ctx.lineTo(width - 40, lineY);
      ctx.stroke();

      const logo = new Image();
      logo.onload = () => {
        const logoSize = 80;
        const logoX = (width - logoSize) / 2;
        const logoY = lineY + 20;

        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        // CHANGED TO RED
        ctx.fillStyle = "#dc2626"; // red-600
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const fontSize = 22;
        ctx.font = `bold ${fontSize}px Arial`;

        const textY = logoY + logoSize + 8;
        ctx.fillText("SDN 1 PASIRPOGOR", width / 2, textY);

        setFinalQrUrl(canvas.toDataURL("image/png"));
      };

      logo.onerror = () => {
        console.log("Logo tidak ditemukan, tampilkan text saja");

        // CHANGED TO RED
        ctx.fillStyle = "#dc2626"; // red-600
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const fontSize = 28;
        ctx.font = `bold ${fontSize}px Arial`;

        const textY = lineY + 40;
        ctx.fillText("SDN 1 PASIRPOGOR", width / 2, textY);

        ctx.font = `16px Arial`;
        ctx.fillStyle = "#6b7280"; // gray-500
        ctx.fillText("Presensi Guru", width / 2, textY + 35);

        setFinalQrUrl(canvas.toDataURL("image/png"));
      };

      logo.src = "/logo-sd.png";
    };

    qrImg.src = qrUrl;
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = finalQrUrl;
    link.download = `QR_Presensi_Guru_SDN1_PASIRPOGOR.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800 dark:shadow-xl">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="text-red-600 dark:text-red-400" size={28} />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Generator QR Presensi Guru
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
          Generate QR Code untuk sistem presensi guru SDN 1 Pasirpogor
        </p>
      </div>

      <button
        onClick={generateQR}
        className="w-full py-3 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mb-6 shadow-lg dark:bg-red-700 dark:hover:bg-red-800">
        <RefreshCw size={20} />
        Generate QR Code
      </button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {finalQrUrl && (
        <div className="space-y-4">
          <div className="border-4 border-red-500 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 dark:border-red-700">
            <img
              src={finalQrUrl}
              alt="QR Code Presensi Guru"
              className="w-full max-w-md mx-auto"
            />
            <p className="text-center text-sm text-gray-600 mt-2 font-medium dark:text-gray-400">
              QR CODE SDN 1 PASIRPOGOR
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-800">
            <p className="text-sm text-gray-700 mb-2 font-semibold dark:text-red-300">
              📋 Kode QR:
            </p>
            <p className="font-mono text-xs sm:text-sm bg-white px-3 py-2 rounded border border-gray-300 break-all dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700">
              {qrCode}
            </p>
          </div>

          <button
            onClick={downloadQR}
            className="w-full py-3 min-h-[44px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg dark:bg-green-700 dark:hover:bg-green-800">
            <Download size={20} />
            Download QR Code
          </button>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/30 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>✅ Cara Penggunaan:</strong>
            </p>
            <ol className="text-sm text-green-800 mt-2 space-y-1 list-decimal list-inside dark:text-green-300">
              <li>Download QR Code dengan klik tombol di atas</li>
              <li>Print atau tampilkan QR Code di ruang guru</li>
              <li>Guru scan QR Code menggunakan menu "Scan QR" di aplikasi</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/30 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>⚠️ Penting:</strong> QR Code ini bersifat statis untuk
          kemudahan. Pastikan QR Code hanya dapat diakses oleh guru di area
          sekolah.
        </p>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-gray-900/50 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>ℹ️ Catatan:</strong> Jika logo sekolah tidak muncul, pastikan
          file logo ada di folder{" "}
          <code className="bg-gray-200 px-1 rounded dark:bg-gray-800 dark:text-gray-300">
            /public/logo-sd.png
          </code>
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
