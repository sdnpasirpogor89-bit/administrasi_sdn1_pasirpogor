// src/attendance-teacher/QRCodeGenerator.js - SD PASIRPOGOR VERSION
import React, { useState, useRef, useEffect } from "react";
import { Download, RefreshCw, QrCode } from "lucide-react";

const QRCodeGenerator = () => {
  // ✅ QR Code untuk SD PASIRPOGOR
  const qrCode = "QR_PRESENSI_GURU_SDN1_PASIRPOGOR";
  const [qrUrl, setQrUrl] = useState("");
  const [finalQrUrl, setFinalQrUrl] = useState("");
  const canvasRef = useRef(null);

  const generateQR = () => {
    // Using QR Server API to generate QR code - high resolution
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
    const bottomSpace = 150; // Space for logo and text
    const width = qrSize + padding * 2;
    const height = qrSize + padding * 2 + bottomSpace;

    canvas.width = width;
    canvas.height = height;

    // Draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Draw outer border (blue)
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Draw inner border (double border effect)
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      // Draw QR code (clean for scanning)
      ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

      // Draw separator line
      const lineY = padding + qrSize + 15;
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, lineY);
      ctx.lineTo(width - 40, lineY);
      ctx.stroke();

      // Load and draw school logo at bottom
      const logo = new Image();
      logo.onload = () => {
        const logoSize = 80;
        const logoX = (width - logoSize) / 2;
        const logoY = lineY + 20;

        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        // Draw school name below logo
        ctx.fillStyle = "#1e40af";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const fontSize = 22;
        ctx.font = `bold ${fontSize}px Arial`;

        const textY = logoY + logoSize + 8;
        // ✅ NAMA SD
        ctx.fillText("SDN 1 PASIRPOGOR", width / 2, textY);

        // Convert canvas to data URL
        setFinalQrUrl(canvas.toDataURL("image/png"));
      };

      logo.onerror = () => {
        console.log("Logo tidak ditemukan, tampilkan text saja");
        // Fallback: tampilkan text saja tanpa logo
        ctx.fillStyle = "#1e40af";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const fontSize = 28;
        ctx.font = `bold ${fontSize}px Arial`;

        const textY = lineY + 40;
        // ✅ NAMA SD
        ctx.fillText("SDN 1 PASIRPOGOR", width / 2, textY);

        // Tambah subtitle
        ctx.font = `16px Arial`;
        ctx.fillStyle = "#64748b";
        ctx.fillText("Presensi Guru", width / 2, textY + 35);

        setFinalQrUrl(canvas.toDataURL("image/png"));
      };

      // ✅ COBA LOAD LOGO (kalo ga ada akan error & fallback ke text)
      logo.src = "/logo-sd.png"; // Sesuaikan dengan nama logo lo
    };

    qrImg.src = qrUrl;
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = finalQrUrl;
    // ✅ NAMA FILE DOWNLOAD
    link.download = `QR_Presensi_Guru_SDN1_PASIRPOGOR.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="text-blue-600" size={28} />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Generator QR Presensi Guru
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Generate QR Code untuk sistem presensi guru SDN 1 Pasirpogor
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateQR}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mb-6 shadow-lg">
        <RefreshCw size={20} />
        Generate QR Code
      </button>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* QR Code Display */}
      {finalQrUrl && (
        <div className="space-y-4">
          <div className="border-4 border-blue-500 rounded-lg p-4 bg-gray-50">
            <img
              src={finalQrUrl}
              alt="QR Code Presensi Guru"
              className="w-full max-w-md mx-auto"
            />
            <p className="text-center text-sm text-gray-600 mt-2 font-medium">
              QR CODE SDN 1 PASIRPOGOR
            </p>
          </div>

          {/* Code Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2 font-semibold">
              📋 Kode QR:
            </p>
            <p className="font-mono text-xs sm:text-sm bg-white px-3 py-2 rounded border border-gray-300 break-all">
              {qrCode}
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadQR}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg">
            <Download size={20} />
            Download QR Code
          </button>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>✅ Cara Penggunaan:</strong>
            </p>
            <ol className="text-sm text-green-800 mt-2 space-y-1 list-decimal list-inside">
              <li>Download QR Code dengan klik tombol di atas</li>
              <li>Print atau tampilkan QR Code di ruang guru</li>
              <li>Guru scan QR Code menggunakan menu "Scan QR" di aplikasi</li>
            </ol>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>⚠️ Penting:</strong> QR Code ini bersifat statis untuk
          kemudahan. Pastikan QR Code hanya dapat diakses oleh guru di area
          sekolah.
        </p>
      </div>

      {/* Info Additional */}
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>ℹ️ Catatan:</strong> Jika logo sekolah tidak muncul, pastikan
          file logo ada di folder{" "}
          <code className="bg-gray-200 px-1 rounded">/public/logo-sd.png</code>
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
