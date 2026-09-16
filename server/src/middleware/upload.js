import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const allowedMime = [
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMime.includes(file.mimetype) || [".csv", ".xlsx"].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV and XLSX files are allowed"), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

