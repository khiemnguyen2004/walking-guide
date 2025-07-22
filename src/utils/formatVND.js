// Utility to format a number as '100.000 VNĐ'
export default function formatVND(value) {
  if (typeof value !== 'number') {
    value = Number(value);
  }
  if (isNaN(value)) return '';
  return value.toLocaleString('vi-VN').replace(/,/g, '.') + ' VNĐ';
} 