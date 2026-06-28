import { jsPDF } from 'jspdf';
import fs from 'fs';

try {
  const doc = new jsPDF();
  doc.text("Hello World", 10, 10);
  const data = doc.output();
  console.log("PDF header:", data.substring(0, 20));
  console.log("PDF length:", data.length);
  fs.writeFileSync('test.pdf', doc.output('arraybuffer'));
  console.log("PDF file written successfully!");
} catch (err) {
  console.error("Error generating PDF:", err);
}
